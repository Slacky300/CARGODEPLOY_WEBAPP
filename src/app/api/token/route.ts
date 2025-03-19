// app/api/auth/user-details/route.ts
import { NextResponse } from 'next/server';
import { auth, clerkClient, currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/db';

export async function GET() {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: {
      email: user.emailAddresses[0].emailAddress
    }
  });

  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const doesPrivateMetadataExist = user?.privateMetadata?.githubAppInstAccessToken || user?.privateMetadata?.githubAppInstAccTokenExpiresAt;
  let token = null;

  if (doesPrivateMetadataExist) {
    const tokenExpiryTime = user?.privateMetadata?.githubAppInstAccTokenExpiresAt;
    const tokenExpiryTimestamp = new Date(tokenExpiryTime as string).getTime();
    const currentTimestamp = Date.now();
    const GRACE_PERIOD_MS = 60 * 1000;

    const isTokenExpired = tokenExpiryTimestamp <= (currentTimestamp + GRACE_PERIOD_MS);

    if (isTokenExpired) {
      if (!dbUser?.github_installation_id) {
        return NextResponse.json({ error: 'No GitHub installation ID' }, { status: 400 });
      }
      
      try {
        const response = await fetch(`${process.env.FRONTEND_URL}/api/external/github?installation_id=${dbUser.github_installation_id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': `${process.env.API_KEY}`
          }
        });
        
        const data = await response.json();
        const { accessToken, expiresAt } = data;
        
        const clerkClientVar = await clerkClient();
        const { userId } = await auth();
        
        if (!userId) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        await clerkClientVar.users.updateUser(userId, {
          privateMetadata: {
            githubAppInstAccessToken: accessToken,
            githubAppInstAccTokenExpiresAt: expiresAt,
          },
        });
        
        token = accessToken;
      } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to refresh token' }, { status: 500 });
      }
    } else {
      token = user?.privateMetadata?.githubAppInstAccessToken;
    }
  }

  return NextResponse.json({ token });
}