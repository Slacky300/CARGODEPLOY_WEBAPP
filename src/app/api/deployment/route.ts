import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server"
import { stat } from "fs";
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
    const slug = searchParams.get('slug');
    
    console.log("Checking availability for slug:", slug);
    // If slug is missing, return a bad request response
    if (!slug) {
        return NextResponse.json(
            { message: "Slug is required" , status: 400 },
           
        );
    }

    console.log("Checking availability for slug:", slug);

    try {
        // Query the database to check if the slug already exists
        const doesSlugExist = await prisma.project.findUnique({
            where: {
                slugIdentifier: slug,
            },
        });


        // If slug is not found in the database, it's available
        if (!doesSlugExist) {
            return NextResponse.json(
                { available: true, message: `${slug} is available` , status: 200 },
               
            );
        }

        // If slug is found in the database, it's not available
        return NextResponse.json(
            { available: false, message: `${slug} is not available`, status: 400 },
           
        );

    } catch (error) {
        // Handle errors gracefully
        console.error("Error checking slug availability:", error);
        return NextResponse.json(
            { message: "Internal server error" , status: 500 },
          
        );
    }
};
