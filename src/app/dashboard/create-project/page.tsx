import DashboardPage from '@/components/DashboardPage';
import React from 'react'
import ListRepositories from './ListRepositories';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/db';
import { auth, clerkClient } from '@clerk/nextjs/server';



const CreateProject = async () => {

    const user = await currentUser();
    console.log("User:", user);
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
            if (!dbUser?.github_installation_id) {
                return null;
            }
            try {
                const response = await fetch(`${process.env.FRONTEND_URL}/api/external/github?installation_id=${dbUser.github_installation_id}`,{
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': `${process.env.API_KEY}`
                    }
                });
                const data = await response.json();
                const { accessToken, expiresAt } = data;
                const clerkClientVar = await clerkClient();
                const {userId} = await auth();
                if (!userId) {
                    return null;
                }
                await clerkClientVar.users.updateUser(userId, {
                    privateMetadata: {
                        githubAppInstAccessToken: accessToken,
                        githubAppInstAccTokenExpiresAt: expiresAt,
                    },
                });
            } catch (e) {
                console.error(e);
            }
    
            
        } else {
            console.log("Token is valid. Using existing token...");
            token = user?.privateMetadata?.githubAppInstAccessToken;
            console.log("Existing token:", token);
        }
    }




    return (
        // <div>
        //     <CommitChoice token = {token ? String(token) : ''} />
        // </div>
        <DashboardPage title='Create Project' route='/dashboard'>
            <ListRepositories avatar={user?.externalAccounts[0].imageUrl} username={user?.externalAccounts[0].username}
                token={token as string | undefined} />
        </DashboardPage>
    )
}

export default CreateProject
