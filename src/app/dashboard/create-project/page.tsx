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

    if (!dbUser) {
        return null;
    }

    const doesPrivateMetadataExist = user?.privateMetadata?.githubAppInstAccessToken || user?.privateMetadata?.githubAppInstAccTokenExpiresAt;


    let token = null;

    if (doesPrivateMetadataExist) {
        const tokenExpiryTime = user?.privateMetadata?.githubAppInstAccTokenExpiresAt;
        console.log("Token Expiry Time:", tokenExpiryTime);
    
        const tokenExpiryTimestamp = new Date(tokenExpiryTime as string).getTime();
        const currentTimestamp = Date.now();
        const GRACE_PERIOD_MS = 60 * 1000; 
    
        const isTokenExpired = tokenExpiryTimestamp <= (currentTimestamp + GRACE_PERIOD_MS);
    
        console.log("Token Expiry Timestamp:", tokenExpiryTimestamp, "Current Timestamp:", currentTimestamp);
        console.log("Difference (ms):", tokenExpiryTimestamp - currentTimestamp);
    
        if (isTokenExpired) {
            console.log("Token is expired. Fetching a new token...");
            const res = await fetchAccessToken(dbUser?.github_installation_id?.toString());
            token = res.accessToken;
    
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
