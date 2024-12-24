import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import prisma from '@/lib/db';



export const fetchAccessToken = async (installation_id: string | undefined) => {

    if(!installation_id) {
        return { accessToken: "", expiresAt: "" };
    }

    console.log('#######################fetchAccessToken#######################');

    const APP_ID = process.env.GITHUB_APP_ID;
    const privateKeyPath = path.resolve(process.cwd(), 'src/lib/cargodeploy_app_prkey.pem');

    if (!fs.existsSync(privateKeyPath)) {
        throw new Error('Private key file not found.'); //Need improvement
    }
    const privateKey = fs.readFileSync(privateKeyPath, 'utf-8');

    const token = jwt.sign(   //Need to study about iss
        { iss: APP_ID },
        privateKey,
        { algorithm: 'RS256', expiresIn: '10m' }
    );

    const installationResponse = await fetch(
        `https://api.github.com/app/installations/${installation_id}/access_tokens`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github.v3+json',
            },
        }
    );

    if (!installationResponse.ok) {
        throw new Error('Failed to fetch installation access token from GitHub.');
    }

    const installationData = await installationResponse.json();
    const accessToken = installationData.token;
    const expiresAt = installationData.expires_at;
    const {userId}  = await auth();
    if (!userId) {
        throw new Error('User not authenticated.');
    }
    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    console.log("clerk expiresAt:", user.privateMetadata.githubAppInstAccTokenExpiresAt);


    console.log("Expires At Github:", expiresAt);


    



    await client.users.updateUser(userId, {
        privateMetadata: {
            githubAppInstAccessToken: accessToken,
            githubAppInstAccTokenExpiresAt: expiresAt,
        },
    });

    

    console.log("clerk expiresAt:", user.privateMetadata.githubAppInstAccTokenExpiresAt);



    return { accessToken, expiresAt };
}





export const GET = async (req: NextRequest) => {
    try {

        const { searchParams } = new URL(req.url);
        const installation_id = searchParams.get('installation_id');

        const clerkClientVar = await clerkClient();

        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({
                status: 401,
                message: 'Unauthorized. User not authenticated.',
            });
        }

        const user = await prisma.user.findUnique({
            where: { externalId: userId },
        });
        if (!user) {
            return NextResponse.json({
                status: 401,
                message: 'Unauthorized. User not found in database.',
            });
        }

        if (!installation_id) {
            return NextResponse.json({
                status: 400,
                message: 'Bad Request. installation_id is required.',
            });
        }

        await prisma.user.update({
            where: { externalId: userId },
            data: { github_installation_id: Number(installation_id) },
        });


        const { accessToken, expiresAt } = await fetchAccessToken(installation_id);

        //reduntant code
        await clerkClientVar.users.updateUser(userId, {
            privateMetadata: {
                githubAppInstAccessToken: accessToken,
                githubAppInstAccTokenExpiresAt: expiresAt,
            },
        });

        return NextResponse.redirect(`http://localhost:3000/dashboard/create-project`);

    } catch (error: any) {
        console.error('Error:', error.message);
        return NextResponse.json({
            status: 500,
            message: 'Internal server error',
            error: error.message,
        });
    }
};
