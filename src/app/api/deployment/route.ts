import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server"
import { DeploymentStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
    const {userId} = await auth();

    if (!userId) {
        return NextResponse.json({
            status: 401,
            error: "Unauthorized"
        });
    }
   
    const {projectId} = await req.json();


    const user = await prisma.user.findUnique({
        where: {
            externalId: userId
        }
    });

    if (!user) {
        return NextResponse.json({
            status: 404,
            error: "User not found"
        });
    }

    const deployment = await prisma.deployment.create({
        data: {
            project: {
                connect: {
                    id: projectId
                }
            }
        }
    });

    return NextResponse.json({
        status: 200,
        deployment
    });

}


export const GET = async (req: NextRequest) => {

    const { searchParams } = new URL(req.url);
    const deploymentId = searchParams.get('deploymentId');

    if (!deploymentId) {
        return NextResponse.json(
            { message: "DeploymentID is required" , status: 400 },
           
        );
    }

    const {userId}  = await auth();

    if (!userId) {
        return NextResponse.json({
            status: 401,
            error: "Unauthorized"
        });
    }

    const user = await prisma.user.findUnique({
        where: {
            externalId: userId
        }
    });

    if (!user) {
        return NextResponse.json({
            status: 404,
            error: "User not found"
        });
    }

    const deployment = await prisma.deployment.findUnique({
        where: {
            id: deploymentId
        }
    });


  

    if (!deployment) {
        return NextResponse.json({
            status: 404,
            error: "Deployment not found"
        });
    }


    const project = await prisma.project.findUnique({
        where: {
            id: deployment.projectId
        }
    });

    if (!project) {
        return NextResponse.json({
            status: 404,
            error: "Project not found"
        });
    }

    const responseBody = {
        deploymentId: deployment.id,
        createdAt: deployment.createdAt,
        gitHubRepoURL: project.gitHubRepoURL,
        gitHubRepoName: project.gitHubRepoURL.split('/').pop(),
        deploymentStatus: deployment.status,
        projectId: project.id
    }

    

    return NextResponse.json({
        status: 200,
        deployment: responseBody
    });

}

export const PATCH = async (req: NextRequest) => {
    try {
        const { searchParams } = new URL(req.url);
        const deploymentIdWithStatus = searchParams.get('deploymentIdWithStatus');

        if (!deploymentIdWithStatus) {
            return NextResponse.json({
                status: 400,
                error: "DeploymentID and status are required"
            });
        }
        const deploymentId = deploymentIdWithStatus.split('-')[0];
        const statusD = deploymentIdWithStatus.split('-')[1] as DeploymentStatus;
        
        if (!deploymentId || !statusD) {
            return NextResponse.json({
                status: 400,
                error: "DeploymentID and status are required"
            });
        }

        const deployment = await prisma.deployment.findUnique({
            where: {
                id: deploymentId
            }
        });

        if (!deployment) {
            return NextResponse.json({
                status: 404,
                error: "Deployment not found"
            });
        }

        const project = await prisma.project.findUnique({
            where:{
                id: deployment.projectId
            }
        });

        if (!project) {
            return NextResponse.json({
                status: 404,
                error: "Project not found"
            });
        }

        // Update the project's deployed status
        await prisma.project.update({
            where: {
                id: project.id
            },
            data: {
                isDeployed: statusD === "SUCCESS" ? true : false
            }
        });

        // Update the current deployment status
        const patchDeployment = await prisma.deployment.update({
            where: {
                id: deploymentId
            },
            data: {
                status: statusD
            }
        });

        // If a deployment has completed or failed, check for the next pending deployment
        if (statusD === "SUCCESS" || statusD === "FAILED") {
            // Process the queue - find the next pending deployment for this project
            const nextDeployment = await prisma.deployment.findFirst({
                where: { 
                    projectId: deployment.projectId,
                    status: "PENDING" 
                },
                orderBy: { createdAt: 'asc' }, // Process oldest pending deployment first
            });

            if (nextDeployment) {
                console.log(`Starting next deployment in queue: ${nextDeployment.id}`);
                
                // Update status to IN_PROGRESS
                await prisma.deployment.update({
                    where: { id: nextDeployment.id },
                    data: { status: "IN_PROGRESS" }
                });

                // Fetch environment variables
                const environmentVariables = await prisma.environmentVariables.findMany({
                    where: { projectId: nextDeployment.projectId },
                    select: { key: true, value: true }
                });

                const updatedEnvironmentVariables = environmentVariables.map(({ key, value }) => ({
                    name: key,
                    value: value
                }));

                // Get access token if needed for private repos
                let token = "";
                if (project.isPrivate) {
                    try {
                        const resultForToken = await fetch(`/api/token`, {
                            method: "GET",
                            headers: { 
                                "Content-Type": "application/json", 
                                "x-api-key": `${process.env.API_KEY}` 
                            }
                        });

                        if (resultForToken.ok) {
                            const tokenFromAPI = await resultForToken.json();
                            token = tokenFromAPI.token || "";
                        }
                    } catch (error) {
                        console.error("Error fetching token:", error);
                    }
                }

                // Prepare job payload
                const payloadForJob = {
                    git_url: project.gitHubRepoURL,
                    project_id: project.slugIdentifier,
                    root_folder: project.rootDir,
                    env_variables: JSON.stringify(updatedEnvironmentVariables),
                    name: project.name,
                    build_command: project.buildCommand,
                    install_command: project.installCommand,
                    access_token: token,
                    branch: project.branch,
                    deployment_id: nextDeployment.id,
                    commit_sha: nextDeployment.commitId
                };

                try {
                    const triggerK8sJob = await fetch(`${process.env.BACKEND_URL}/jobs/create`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payloadForJob)
                    });

                    if (!triggerK8sJob.ok) {
                        console.error("Failed to trigger next deployment in queue");
                        await prisma.deployment.update({
                            where: { id: nextDeployment.id },
                            data: { status: "FAILED" }
                        });
                        
                        // Recursively call this endpoint to process the next item in queue
                        await fetch(`/api/deployment?deploymentIdWithStatus=${nextDeployment.id}-FAILED`, {
                            method: "PATCH"
                        });
                    }
                } catch (error) {
                    console.error("Error triggering K8s job:", error);
                    await prisma.deployment.update({
                        where: { id: nextDeployment.id },
                        data: { status: "FAILED" }
                    });
                    
                    // Recursively call this endpoint to process the next item in queue
                    await fetch(`/api/deployment?deploymentIdWithStatus=${nextDeployment.id}-FAILED`, {
                        method: "PATCH"
                    });
                }

                return NextResponse.json({
                    status: 200,
                    deployment: patchDeployment,
                    nextDeployment: {
                        id: nextDeployment.id,
                        status: "IN_PROGRESS"
                    }
                });
            } else {
                console.log(`No pending deployments in queue for project ${deployment.projectId}`);
            }
        }

        return NextResponse.json({
            status: 200,
            deployment: patchDeployment
        });
    } catch (error) {
        console.error("Error in deployment PATCH API:", error);
        return NextResponse.json({
            status: 500,
            error: "Internal Server Error"
        });
    }
};