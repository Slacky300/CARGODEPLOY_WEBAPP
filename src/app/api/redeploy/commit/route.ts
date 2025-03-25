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
        console.log("User:", user);
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
        console.log("Project:", project);

        if (!project) return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });

        const environmentVariables = await prisma.environmentVariables.findMany({
            where: { projectId: project.id },
            select: { key: true, value: true }
        });

        const updatedEnvironmentVariables = environmentVariables.map(({ key, value }) => ({
            name: key,
            value: value
          }));
          

        if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        if (!project) return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });

        // Create a new deployment atomically
        const createNewDeployment = await prisma.deployment.create({
            data: {
                projectId: project.id,
                status: "PENDING",
                commitId: commit,
                commitMsg: commitMessage || "",
                commitAuthor: commitAuthor || ""
            }
        });

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

        const triggerK8sJob = await fetch(`${process.env.BACKEND_URL}/jobs/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payloadForJob)
        });

        if (!triggerK8sJob.ok) {
            return NextResponse.json({ success: false, error: "Error triggering job" }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: createNewDeployment }, { status: 201 });

    } catch (error) {
        console.error("Error in deployment API:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
};
