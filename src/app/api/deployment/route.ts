import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server"
import { DeploymentStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest, res: NextResponse) => {
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

    const patchDeployment = await prisma.deployment.update({
        where: {
            id: deploymentId
        },
        data: {
            status: statusD
        }
    });

    return NextResponse.json({
        status: 200,
        deployment: patchDeployment
    });


}