import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import jwt from "jsonwebtoken";
import path from "path";

export const GET = async (req: NextRequest) => {

  try {
    const { searchParams } = new URL(req.url);
    const installation_id = searchParams.get('installation_id');

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

    return NextResponse.json({
      accessToken: installationData.token,
      expiresAt: installationData.expires_at,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({
      status: 500,
      error: "Internal Server Error"
    });
  }
}


