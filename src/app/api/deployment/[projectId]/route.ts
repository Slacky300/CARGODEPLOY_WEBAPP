import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) => {

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
        })
    }

    const projectId = (await params).projectId;

    console.log("Project---------",projectId);


    if (!projectId) {
        return NextResponse.json({
            status: 400,
            error: "Project ID is required"
        });
    }

    const project = await prisma.project.findUnique({
        where: {
            id: projectId
        }
    });

    if (!project) {
        return NextResponse.json({
            status: 404,
            error: "Project not found"
        }
        )
    }

    const deployments = await prisma.deployment.findMany({
        where: {
            projectId: projectId
        }
    });

    const responseBody = {
        projectName: project.name,
        deployments: deployments.map(deployment => ({
            deploymentId: deployment.id,
            createdAt: deployment.createdAt,
            gitHubRepoURL: project.gitHubRepoURL,
            gitHubRepoName: project.gitHubRepoURL.split("/").at(-1),
            deploymentStatus: deployment.status,
            commitSha: deployment.commitId,
            commitMsg: deployment.commitMsg,
            commitAuthor: deployment.commitAuthor
        })),
        project,
        githubRepoOwner: project.gitHubRepoURL.split("/").at(-2),
        isPrivate: project.isPrivate
    }

    return NextResponse.json({
        status: 200,
        data: responseBody
    });
}