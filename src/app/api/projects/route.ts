import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server";



export const GET = async () => {
    const {userId} =  await auth();
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



export const POST = async (req: NextRequest, res: NextResponse) => {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({
            status: 401,
            success: false,
            error: "Unauthorized"
        });
    }

    const user = await prisma.user.findUnique({
        where: { externalId: userId }
    });

    if (!user) {
        return NextResponse.json({
            status: 404,
            success: false,
            error: "User not found"
        });
    }

    const body = await req.json();

    if(!body) return NextResponse.json({
        status: 400,
        success: false,
        error: "Please provide body required fields"
    });

    const { name, gitHubRepoURL, slugIdentifier, rootDir, envVars } = body;

    if(!name || !gitHubRepoURL || !slugIdentifier || !rootDir){
        return NextResponse.json({
            status: 400,
            success: false,
            error: "Please provide all required fields"
        });
    }

    const doesProjectExist = await prisma.project.findFirst({
        where: {
            OR: [
                { slugIdentifier },
                { name },
                { gitHubRepoURL }
            ]
        }
    });
    

    if (doesProjectExist) {
        return NextResponse.json({
            status: 400,
            success: false,
            error: `Project with slug/githubRepo/name already exists`
        });
    }

    const project = await prisma.project.create({
        data: {
            name,
            gitHubRepoURL,
            slugIdentifier,
            rootDir,
            user: { connect: { id: user.id } }
        }
    });

    let envIds = [];

    if (envVars && Array.isArray(envVars)) {
        for(const x of envVars){
            const envV = await prisma.environmentVariables.create({
                data: {
                    key: x.key,
                    value: x.value,
                    project: { connect: { id: project.id } }
                }
            });
            envIds.push(envV.id);
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

    return NextResponse.json({
        status: 201,
        success: true,
        data: updatedProject
    });
};
