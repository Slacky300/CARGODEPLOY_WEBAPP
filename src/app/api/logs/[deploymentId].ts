import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export default async function handler(req: NextRequest) {
    const { userId }  = await auth();
    if (!userId) {
        return NextResponse.json({status: 401, error: 'Unauthorized' });
    }

    const { searchParams } = new URL(req.url);
    const deploymentId = searchParams.get('deploymentId');
    if (!deploymentId || typeof deploymentId !== 'string') {
        return NextResponse.json({ status: 400, error: 'Invalid deployment ID' });
    }

    await prisma.deployment.findUnique({
        where: {
            id: deploymentId
        }
    });

    const logs = await prisma.log.findMany({

        where: {
            deployment: {
                id: deploymentId
            }
        }
    });

   return NextResponse.json({status: 200, logs});
}