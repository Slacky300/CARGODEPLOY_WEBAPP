import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
    try {
        const { searchParams } = new URL(req.url);
        const deploymentId = searchParams.get("deploymentId");

        if (!deploymentId) {
            return NextResponse.json(
                { error: "DeploymentId is required" },
                { status: 400 }
            );
        }

        const logs = await prisma.log.findFirst({
            where: {
                deploymentId,
            },
        });

        if (!logs) {
            return NextResponse.json(
                { error: "Logs not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { status: 200, logs: logs.message },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error in GET handler:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
};

export const POST = async (req: NextRequest) => {
    try {
        const body = await req.json();

        if (!body) {
            return NextResponse.json(
                { error: "Bad Request" },
                { status: 400 }
            );
        }

        const { logs, deploymentId } = body;

        if (!logs || !deploymentId) {
            return NextResponse.json(
                { error: "Logs or deploymentId not provided" },
                { status: 400 }
            );
        }

        const deployment = await prisma.deployment.findUnique({
            where: {
                id: deploymentId,
            },
        });

        if (!deployment) {
            return NextResponse.json(
                { error: "Deployment not found" },
                { status: 404 }
            );
        }

        const logMessage = logs.join("\n"); // Combine logs into a single string

        const newLogs = await prisma.log.create({
            data: {
                message: logMessage,
                deployment: {
                    connect: {
                        id: deploymentId,
                    },
                },
            },
        });

        return NextResponse.json(
            { success: true, log: newLogs },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error in POST handler:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
};
