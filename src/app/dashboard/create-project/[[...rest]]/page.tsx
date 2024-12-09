import DashboardPage from '@/components/DashboardPage';
import React from 'react'
import ListRepositories from './ListRepositories';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/db';
import { fetchAccessToken } from '@/app/api/external/install-app/github/route';

const CreateProject = async () => {

    const user = await currentUser();
    if (!user) {
        return null;
    }
    const dbUser = await prisma.user.findUnique({
        where: {
            email: user.emailAddresses[0].emailAddress
        }
    });

    if (!dbUser || !dbUser.github_installation_id) {
        return null;
    }

    const doesPrivateMetadataExist = user?.privateMetadata?.githubAppInstAccessToken;

    if(!user?.privateMetadata?.githubAppInstAccessToken) {
        return null;
    }

    let token = null;

    if (doesPrivateMetadataExist) {
        const tokenExpiryTimestamp = new Date(user?.privateMetadata?.githubAppInstAccessTokenExpiresAt as string).getTime(); // Convert to Unix timestamp
        const currentTime = Date.now(); // Current time in milliseconds
    
        const isTokenExpired = typeof tokenExpiryTimestamp === 'number' && tokenExpiryTimestamp < currentTime;
        console.log("Token Expiry Timestamp:", tokenExpiryTimestamp, "Current Time:", currentTime);
    
        if (isTokenExpired) {
            console.log("Token is expired. Fetching a new token...");
            token = await fetchAccessToken(dbUser.github_installation_id?.toString());
            console.log("Fetched new token:", token);
        } else {
            console.log("Token is valid. Using existing token...");
            token = user?.privateMetadata?.githubAppInstAccessToken;
            console.log("Existing token:", token);
        }
    }
    


    return (
        <DashboardPage title='Create Project' route='/dashboard'>
            <ListRepositories avatar={user?.externalAccounts[0].imageUrl} username={user?.externalAccounts[0].username}
                token={token as string | undefined} />
        </DashboardPage>
    )
}

export default CreateProject
