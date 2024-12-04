import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server"
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