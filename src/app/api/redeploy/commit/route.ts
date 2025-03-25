import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        if (!body || !body.commit || !body.deploymentId) {
            return NextResponse.json({ success: false, error: "Please provide commitHash and deploymentId" }, { status: 400 });
        }

        const { commit, commitAuthor, commitMessage, deploymentId } = body;

        console.log("Redeploying commit:", commit, "for deployment:", deploymentId);

        // Fetch user, deployment, project, and environment variables in a single transaction
        const user = await prisma.user.findUnique({ where: { externalId: userId } });
        const project = await prisma.project.findFirst({
            where: { id: deploymentId },
            select: {
                id: true,
                name: true,
                gitHubRepoURL: true,
                slugIdentifier: true,
                rootDir: true,
                buildCommand: true,
                installCommand: true,
                branch: true,
                isPrivate: true
            }
        });

        if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        if (!project) return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });

        const environmentVariables = await prisma.environmentVariables.findMany({
            where: { projectId: project.id },
            select: { key: true, value: true }
        });

        const updatedEnvironmentVariables = environmentVariables.map(({ key, value }) => ({
            name: key,
            value: value
        }));

        // Check if a deployment is already in progress for this project
        const deploymentInProgress = await prisma.deployment.findFirst({
            where: { projectId: project.id, status: "IN_PROGRESS" }
        });

        // Create new deployment with initial status based on whether another deployment is in progress
        const initialStatus = deploymentInProgress ? "PENDING" : "IN_PROGRESS";
        
        const createNewDeployment = await prisma.deployment.create({
            data: {
                projectId: project.id,
                status: initialStatus,
                commitId: commit,
                commitMsg: commitMessage || "",
                commitAuthor: commitAuthor || ""
            }
        });

        // If no deployment is in progress, trigger the build immediately
        if (initialStatus === "IN_PROGRESS") {
            let token = "";
            if (project.isPrivate) {
                try {
                    const resultForToken = await fetch(`/api/token`, {
                        method: "GET",
                        headers: { "Content-Type": "application/json", "x-api-key": `${process.env.API_KEY}` }
                    });

                    if (resultForToken.ok) {
                        const tokenFromAPI = await resultForToken.json();
                        token = tokenFromAPI.token || "";
                    }
                } catch (error) {
                    console.error("Error fetching token:", error);
                }
            }

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
                deployment_id: createNewDeployment.id,
                commit_sha: commit
            };

            try {
                const triggerK8sJob = await fetch(`${process.env.BACKEND_URL}/jobs/create`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payloadForJob)
                });

                if (!triggerK8sJob.ok) {
                    await prisma.deployment.update({
                        where: { id: createNewDeployment.id },
                        data: { status: "FAILED" }
                    });
                    return NextResponse.json({ success: false, error: "Error triggering job" }, { status: 500 });
                }
            } catch (error) {
                console.error("Error triggering K8s job:", error);
                await prisma.deployment.update({
                    where: { id: createNewDeployment.id },
                    data: { status: "FAILED" }
                });
                return NextResponse.json({ success: false, error: "Error triggering job" }, { status: 500 });
            }
        } else {
            console.log(`Deployment ${createNewDeployment.id} added to queue (PENDING status)`);
        }

        return NextResponse.json({
            success: true,
            data: {
                ...createNewDeployment,
                queuedBehindDeployment: deploymentInProgress ? deploymentInProgress.id : null
            }
        }, { status: 201 });

    } catch (error) {
        console.error("Error in deployment API:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
};