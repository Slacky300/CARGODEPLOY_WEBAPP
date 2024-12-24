import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";


export const GET = async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    if (!slug) {
        return NextResponse.json(
            { message: "Slug is required" , status: 400 },
           
        );
    }

    console.log("Checking availability for slug:", slug);

    try {

        //Remove this block of code

        const isProjectTableEmpty = await prisma.project.findMany();

        if (isProjectTableEmpty.length === 0) {
            return NextResponse.json(
                { available: true, message: `${slug} is available` , status: 200 },
               
            );
        }

        //Remove this block of code

        const doesSlugExist = await prisma.project.findUnique({
            where: {
                slugIdentifier: slug,
            },
        });



        if (doesSlugExist === null) {
            return NextResponse.json(
                { available: true, message: `${slug} is available` , status: 200 },
               
            );
        }

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