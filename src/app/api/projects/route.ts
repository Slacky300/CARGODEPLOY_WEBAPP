import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export const GET = async () => {
    console.log("GET request received");

    const { userId } = await auth();
    if (!userId) {
        console.log("Unauthorized access attempt");
        return NextResponse.json({ status: 401, error: "Unauthorized" });
    }

    console.log("Fetching user from database...");
    const user = await prisma.user.findUnique({
        where: { externalId: userId },
    });

    if (!user) {
        console.log("User not found for userId:", userId);
        return NextResponse.json({ status: 404, error: "User not found" });
    }

    console.log(`Fetching projects for user ${user.id}`);
    const userProjects = await prisma.project.findMany({
        where: { userId: user.id },
    });

    console.log(`Fetched ${userProjects.length} projects`);
    return NextResponse.json({ status: 200, projects: userProjects });
};

export const POST = async (req: NextRequest) => {
    console.log("POST request received");

    const { userId } = await auth();
    if (!userId) {
        console.log("Unauthorized access attempt");
        return NextResponse.json({
            status: 401,
            success: false,
            error: "Unauthorized",
        });
    }

    console.log("Fetching user from database...");
    const user = await prisma.user.findUnique({
        where: { externalId: userId },
    });

    if (!user) {
        console.log("User not found for userId:", userId);
        return NextResponse.json({
            status: 404,
            success: false,
            error: "User not found",
        });
    }

    console.log("Parsing request body...");
    let body;
    try {
        body = await req.json();
    } catch (error) {
        console.log("Error parsing request body:", error);
        return NextResponse.json({
            status: 400,
            success: false,
            error: "Invalid request body",
        });
    }

    console.log("Validating request body...");
    const { name, gitHubRepoURL, slugIdentifier, rootDir, envVars, branch, token } = body;

    if (!name || !gitHubRepoURL || !slugIdentifier || !rootDir || !branch) {
        console.log("Missing required fields in request body");
        return NextResponse.json({
            status: 400,
            success: false,
            error: "Please provide all required fields",
        });
    }

    console.log(`Checking if user has exceeded quota limit (${user.quotaLimit})...`);
    const userProjects = await prisma.project.findMany({ where: { userId: user.id } });

    if (userProjects.length >= user.quotaLimit) {
        console.log(`User ${user.id} has reached their project limit`);
        return NextResponse.json({
            status: 400,
            success: false,
            error: "You have reached your project limit",
        });
    }

    const newName = `${name}-${user.id}-${Math.random().toString(36).substring(7)}`;
    console.log(`Generated new project name: ${newName}`);

    console.log(`Checking if project with slugIdentifier '${slugIdentifier}' exists...`);
    const doesProjectExist = await prisma.project.findFirst({ where: { slugIdentifier } });

    if (doesProjectExist) {
        console.log(`Project with slugIdentifier '${slugIdentifier}' already exists`);
        return NextResponse.json({
            status: 400,
            success: false,
            error: `Project with slugIdentifier already exists`,
        });
    }

    let project;
    try {
        console.log("Creating new project in database...");
        project = await prisma.project.create({
            data: {
                name: newName,
                gitHubRepoURL,
                slugIdentifier,
                rootDir,
                userId: user.id,
                branch,
                token,
            },
        });
        console.log(`Project created successfully: ${project.id}`);
    } catch (error) {
        console.log("Error creating project:", error);
        return NextResponse.json({
            status: 500,
            success: false,
            error: "Failed to create project",
        });
    }

    const envIds = [];

    if (envVars && Array.isArray(envVars)) {
        console.log(`Adding ${envVars.length} environment variables to the project...`);
        for (const x of envVars) {
            try {
                const envV = await prisma.environmentVariables.create({
                    data: {
                        key: x.key,
                        value: x.value,
                        projectId: project.id, // Use projectId directly
                    },
                });
                envIds.push(envV.id);
                console.log(`Environment variable added: ${x.key}`);
            } catch (error) {
                console.log("Error creating environment variable:", error);
            }
        }
    }

    console.log("Updating project with environment variables...");
    const updatedProject = await prisma.project.update({
        where: { id: project.id },
        data: {
            envVars: {
                connect: envIds.map((id) => ({ id })),
            },
        },
    });

    console.log(`Creating initial deployment for project ${project.id}...`);
    const newDeployment = await prisma.deployment.create({
        data: {
            projectId: project.id,
            status: "PENDING",
        },
    });
    console.log(`Deployment created with ID: ${newDeployment.id}`);

    console.log("Preparing webhook payload...");
    const updatedEnvVars = envVars.map(({ key, value }: { key: string; value: string }) => ({
        name: key,
        value: value,
    }));

    console.log(`Sending deployment request to webhook: ${process.env.BACKEND_URL}/jobs/create`);
    let webhookResponse;
    try {
        const webhookHit = await fetch(`${process.env.BACKEND_URL}/jobs/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                git_url: project.gitHubRepoURL,
                project_id: project.slugIdentifier,
                root_folder: project.rootDir,
                env_variables: JSON.stringify(updatedEnvVars),
                name: project.name,
                access_token: token,
                branch: project.branch,
                deployment_id: newDeployment.id,
            }),
        });

        if (!webhookHit.ok) {
            console.log("Failed to hit webhook:", webhookHit.statusText);
            return NextResponse.json({
                status: 500,
                success: false,
                error: "Failed to hit webhook",
            });
        }

        webhookResponse = await webhookHit.json();
        console.log("Webhook response:", webhookResponse);
    } catch (error) {
        console.log("Error hitting webhook:", error);
        return NextResponse.json({
            status: 500,
            success: false,
            error: "Webhook request failed",
        });
    }

    return NextResponse.json({
        status: 201,
        success: true,
        data: { updatedProject, newDeployment },
    });
};
