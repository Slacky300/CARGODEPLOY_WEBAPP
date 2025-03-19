import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server";



export const GET = async () => {
    const { userId } = await auth();
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

    const userProjects = await prisma.project.findMany({
        where: {
            user: user
        }
    });

    return NextResponse.json({
        status: 200,
        projects: userProjects
    });

}



export const POST = async (req: NextRequest) => {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({
            success: false,
            error: "Unauthorized"
        },{status: 401, statusText: "Unauthorized"});
    }

    const user = await prisma.user.findUnique({
        where: { externalId: userId }
    });

    if (!user) {
        return NextResponse.json({
            success: false,
            error: "User not found"
        },{status: 404, statusText: "Not Found"});
    }

    const body = await req.json();

    if (!body) {
        return NextResponse.json({
            success: false,
            error: "Please provide body required fields"
        },{status: 400, statusText: "Bad Request"});
    }

    const { name, gitHubRepoURL, isPrivate, slugIdentifier, rootDir, envVars, branch, token, build, install, commit, commitMessage, commitAuthor } = body;

    if (!name || !gitHubRepoURL || !slugIdentifier || !rootDir || !branch || !build || !install || !commit) {
        return NextResponse.json({
            success: false,
            error: "Please provide all required fields"
        },{status: 400});
    }

    const userProjects = await prisma.user.findUnique({
        where: { id: user.id },
        include: {  Projects: true }
    }).then(user => user?.Projects || []);

    if(userProjects.length >= user.quotaLimit) {
        return NextResponse.json({
            success: false,
            error: "You have reached your project limit"
        },{status: 400});
    }

    const newName = name + "-" + user.id + "-" + userProjects.length;

    const doesProjectExist = await prisma.project.findFirst({
        where: { slugIdentifier }
    });

    if (doesProjectExist) {
        return NextResponse.json({
            success: false,
            error: `Project with slugIdentifier already exists`
        },{status: 400});
    }

    // Use a transaction to ensure atomicity
    return await prisma.$transaction(async (tx) => {
        // Create project
        let project;
        try {
            project = await tx.project.create({
                data: {
                    name: newName,
                    gitHubRepoURL,
                    slugIdentifier,
                    rootDir,
                    userId: user.id,
                    branch,
                    token,
                    isPrivate: isPrivate
                }
            });
        } catch (error) {
            console.error("Error creating project:", error);
            return NextResponse.json({
                success: false,
                error: "Failed to create project"
            },{status: 500});
        }

        // Create environment variables
        const envEntries = [];
        if (envVars && Array.isArray(envVars)) {
            for (const x of envVars) {
                try {
                    const envV = await tx.environmentVariables.create({
                        data: {
                            key: x.key,
                            value: x.value,
                            projectId: project.id
                        }
                    });
                    envEntries.push(envV);
                } catch (error) {
                    console.error("Error creating environment variable:", error);
                    throw error; // This will trigger transaction rollback
                }
            }
        }

        // Create deployment
        const newDeployment = await tx.deployment.create({
            data: {
                projectId: project.id,
                status: "PENDING",
                commitId: commit,
                commitMsg: commitMessage,
                commitAuthor: commitAuthor
            }
        });

        // Format environment variables for webhook
        const updatedEnvVars = envVars.map(({ key, value }: { key: string, value: string }) => ({
            name: key,
            value: value
        }));

        // Make the webhook call - but outside the transaction since external API calls
        // should typically be done after transaction commit
        try {
            // First ensure the transaction will succeed by returning a "prepare" status
            // The actual webhook call will happen after the transaction commits
            
            return {
                project,
                envEntries,
                newDeployment,
                updatedEnvVars
            };
        } catch (error) {
            console.error("Error preparing webhook data:", error);
            throw error; // This will trigger transaction rollback
        }
    }).then(async (transactionResult) => {
        if (transactionResult instanceof NextResponse) {
            return transactionResult;
        }
        // Transaction succeeded, now make the webhook call
        if (transactionResult instanceof NextResponse) {
            return transactionResult;
        }
        const { project, newDeployment, updatedEnvVars } = transactionResult;
        
        try {
            const webhookHit = await fetch(`${process.env.BACKEND_URL}/jobs/create`, {
                method: "POST",
                headers:{
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    git_url: project.gitHubRepoURL,
                    project_id: project.slugIdentifier,
                    root_folder: project.rootDir,
                    env_variables: JSON.stringify(updatedEnvVars),
                    name: project.name,
                    access_token: token,
                    branch: project.branch,
                    deployment_id: newDeployment.id,
                    build_command: build,
                    install_command: install,
                    commit_sha: commit
                }),
            });

            if (!webhookHit.ok) {
                // Webhook failed - we need to clean up manually
                console.error("Failed to hit webhook:", webhookHit);
                await prisma.$transaction([
                    prisma.environmentVariables.deleteMany({
                        where: { projectId: project.id }
                    }),
                    prisma.deployment.delete({
                        where: { id: newDeployment.id }
                    }),
                    prisma.project.delete({
                        where: { id: project.id }
                    })
                ]);
                
                return NextResponse.json({
                    success: false,
                    error: "Failed to hit webhook"
                },{status: 500});
            }
            
            const webhookResponse = await webhookHit.json();
            console.log("Webhook response:", webhookResponse);
            
            return NextResponse.json({
                success: true,
                data: { updatedProject: project, newDeployment }
            },{status: 201});
        } catch (error) {
            // Any error with the webhook - clean up
            console.error("Error with webhook:", error);
            await prisma.$transaction([
                prisma.environmentVariables.deleteMany({
                    where: { projectId: project.id }
                }),
                prisma.deployment.delete({
                    where: { id: newDeployment.id }
                }),
                prisma.project.delete({
                    where: { id: project.id }
                })
            ]);
            
            return NextResponse.json({
                success: false,
                error: "Failed to hit webhook"
            },{status: 500});
        }
    }).catch(error => {
        console.error("Transaction failed:", error);
        return NextResponse.json({
            success: false,
            error: "Transaction failed"
        },{status: 500});
    });
};
