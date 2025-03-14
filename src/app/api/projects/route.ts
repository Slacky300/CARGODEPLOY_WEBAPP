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
        },{status: 400 , statusText: "Bad Request"});
    }

    const { name, gitHubRepoURL, slugIdentifier, rootDir, envVars, branch, token, build, install, commit, commitMessage, commitAuthor } = body;

    if (!name || !gitHubRepoURL || !slugIdentifier || !rootDir || !branch || !build || !install || !commit) {
        return NextResponse.json({
           
            success: false,
            error: "Please provide all required fields"
        },{status: 400});
    }

    const userProjects = await prisma.project.findMany({
        where: {
            user: user
        }
    });

    

    if(userProjects.length === user.quotaLimit) {
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

    let project;
    try {
        project = await prisma.project.create({
            data: {
                name: newName,
                gitHubRepoURL,
                slugIdentifier,
                rootDir,
                userId: user.id,
                branch,
                token
            }
        });
    } catch (error) {
        console.error("Error creating project:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to create project"
        },{status: 500});
    }

    const envIds = [];

    if (envVars && Array.isArray(envVars)) {
        for (const x of envVars) {
            try {
                const envV = await prisma.environmentVariables.create({
                    data: {
                        key: x.key,
                        value: x.value,
                        projectId: project.id // Use projectId instead of connecting via relation
                    }
                });
                envIds.push(envV.id);
            } catch (error) {
                console.error("Error creating environment variable:", error);
            }
        }
    }

    const updatedProject = await prisma.project.update({
        where: { id: project.id },
        data: {
            envVars: {
                connect: envIds.map((id) => ({ id }))
            }
        }
    });

    const newDeployment = await prisma.deployment.create({
        data: {
            projectId: project.id,
            status: "PENDING",
            commitId: commit,
            commitMsg: commitMessage,
            commitAuthor: commitAuthor
        }
    });

    const updatedEnvVars = envVars.map(({ key, value }: { key: string, value: string }) => ({
        name: key,
        value: value
    }));

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
        console.error("Failed to hit webhook:", webhookHit);
        return NextResponse.json({
            success: false,
            error: "Failed to hit webhook"
        },{status: 500});
    }
    const webhookResponse = await webhookHit.json();
    console.log("Webhook response:", webhookResponse);
    return NextResponse.json({
        success: true,
        data: { updatedProject, newDeployment }
    },{status: 201});
};
