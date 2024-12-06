import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';


export async function RedirectURI() {
    const clientId = process.env.GITHUB_CLIENT_ID || "Ov23liYcYSiqWQxMIOvd";
    const redirectUri = process.env.GITHUB_REDIRECT_URI || "http://localhost:3000"; // Your app's callback URL
  
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&allow_signup=true`;
  
    return NextResponse.json({ url: authUrl });
  }
  

export async function fetchPublicRepos(token: string) {
    try{
        const response = await fetch('https://api.github.com/user/repos?visibility=public',{
            method: 'GET',
            headers:{
                Authorization: `Bearer ${token}`,
            }
        })
        const data = await response.json();
        return data;
    }catch(error){
        console.error('Error fetching public repos:', error);
    }
}

export async function GET(req: NextRequest, res: NextResponse) {
    const {userId} = await auth();
    if (!userId) {
        return NextResponse.json({
            status: 401,
            body: {
                error: 'Unauthorized',
            },
        });
    }

    try {
        const client = await clerkClient();;
        const provider = `oauth_github`;

        const externalAccount = await client.users.getUserOauthAccessToken(
            userId,
            provider
        );


        return NextResponse.json({
            status: 200,
            token: externalAccount.data[0].token
        });




    } catch (error) {
        console.error('Error fetching external account:', error);

        return NextResponse.json({
            status: 500,
            body: {
                error: 'Internal server error',
            },
        });
    }
}

