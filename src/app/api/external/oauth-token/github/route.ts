import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';



export async function GET() {
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

