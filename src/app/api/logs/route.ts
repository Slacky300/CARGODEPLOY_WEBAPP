import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest ) => {
    const { searchParams } = new URL(req.url);
    const deploymentId = searchParams.get('deploymentId');
    if(!deploymentId){
        return {
            status: 400,
            error: "DeploymentId is required"
        }
    }
    const logs = await prisma.log.findFirst({
        where: {
            deploymentId
        }
    });

    if(!logs){
        return NextResponse.json({
            error: "Logs not found"
        }, {status: 404});
    }

    return NextResponse.json({
        status: 200,
        logs: logs.message
    });

}

export const POST = async (req: NextRequest ) => {
    try{
        const body = await req.json();
        if(!body){
            return {
                status: 400,
                error: "Bad Request"
            }
        }
        const {logs, deploymentId} = body;
        if(!logs || !deploymentId){
            return {
                status: 400,
                error: "Logs or deploymentId not provided"
            }
        }
        const deployment = await prisma.deployment.findUnique({
            where: {
                id: deploymentId
            }
        });
        if(!deployment){
            return {
                status: 404,
                error: "Deployment not found"
            }
        }
        let logMessage = "";
        for(const log of logs){
            logMessage += log + "\n";
        }
        const newLogs = await prisma.log.create({
            data: {
                message: logMessage,
                deployment: {
                    connect: {
                        id: deploymentId
                    }
                }
            }
        });

        return NextResponse.json({
            status: 200,
            success: true,
            log: newLogs
        });

    }catch(e){
        console.error(e);
    }
}