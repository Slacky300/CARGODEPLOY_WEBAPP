import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import prisma from '@/lib/db';
import fs from "fs";
import jwt from "jsonwebtoken";
import path from "path";






export const GET = async (req: NextRequest) => {
    try {

        const { searchParams } = new URL(req.url);
        const installation_id = searchParams.get('installation_id');

        console.log("Url:", req.url);

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

        const fetchAccessToken = async (installation_id: string) => {
          if (!installation_id) {
            return { accessToken: "", expiresAt: "" };
          }
        
          const APP_ID = process.env.GITHUB_APP_ID;
          const privateKeyPath = path.resolve(process.cwd(), 'src/lib/cargodeploy_app_prkey.pem');
        
          if (!fs.existsSync(privateKeyPath)) {
            throw new Error('Private key file not found.');
          }
        
          const privateKey = fs.readFileSync(privateKeyPath, 'utf-8');
          const token = jwt.sign({ iss: APP_ID }, privateKey, {
            algorithm: 'RS256',
            expiresIn: '10m',
          });
        
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
          return {
            accessToken: installationData.token,
            expiresAt: installationData.expires_at,
          };
        };

        const { accessToken, expiresAt } = await fetchAccessToken(installation_id);

        //reduntant code
        await clerkClientVar.users.updateUser(userId, {
            privateMetadata: {
                githubAppInstAccessToken: accessToken,
                githubAppInstAccTokenExpiresAt: expiresAt,
            },
        });

        return NextResponse.redirect(`http://localhost:3000/dashboard/create-project`);

    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error('Error:', error.message);
        } else {
            console.error('Unknown error:', error);
        }
        return NextResponse.json({
            status: 500,
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Internal server error',
        });
    }
};
