import fs from 'fs'
import path from 'path'
import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'

export const GET = async (req: NextRequest) => {
   
    const {searchParams} = new URL(req.url);
    const installation_id = searchParams.get('installation_id');

    if(!installation_id) {
        return {
            status: 400,
            body: {
                message: 'installation_id is required'
            }
        }
    }

    const APP_ID = process.env.GITHUB_APP_ID;

    try {
        console.log(process.cwd());
        const privateKeyPath = path.join(process.cwd(), "/src/lib/cargodeploy_app_prkey.pem");
        console.log(privateKeyPath);
        const privateKey = fs.readFileSync(privateKeyPath, 'utf-8');
        const token = jwt.sign(
            {
                iss: APP_ID,
            },
            privateKey,
            { algorithm: 'RS256', expiresIn: '10m' }
        );
        const response = await fetch(`https://api.github.com/app/installations/${installation_id}/access_tokens`,
            {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                  Accept: 'application/vnd.github.v3+json',
                },
              }
        );
        const data = await response.json();
        const gitRepos = await fetch(`https://api.github.com/installation/repositories`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${data.token}`,
            }
        });
        const repos = await gitRepos.json();

        return NextResponse.json({
            status: 200,
            body: {
                message: 'Success',
                token: data.token,
                gitData: data,
                data: repos
            }
        });
    } catch (e) {
        console.error(e);
        return NextResponse.json({
            status: 500,
            body: {
                message: 'Internal server error'
            }
        });
    }




}