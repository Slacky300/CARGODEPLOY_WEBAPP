import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export const DELETE = async (req: NextRequest,   { params }: { params: Promise<{ projectId: string }> }
) => {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const  projectId  = (await params).projectId;
        if (!projectId) {
            return NextResponse.json(
                { success: false, error: "Project ID is required" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { externalId: userId },
        });
        if (!user) {
            return NextResponse.json(
                { success: false, error: "User not found" },
                { status: 404 }
            );
        }

        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!project) {
            return NextResponse.json(
                { success: false, error: "Project not found" },
                { status: 404 }
            );
        }

        const result = await prisma.project.delete({
            where: { id: projectId },
        });
          

        return NextResponse.json(
            { success: true, message: "Project deleted successfully", data: result},
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting project:", error);
        return NextResponse.json(
            { success: false, error: "Internal Server Error", details: error },
            { status: 500 }
        );
    }
};
