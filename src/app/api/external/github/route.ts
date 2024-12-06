import { NextResponse } from "next/server";

export const GET = async () => {
    const clientId = process.env.GITHUB_CLIENT_ID || "Ov23liYcYSiqWQxMIOvd";
    const redirectUri = process.env.GITHUB_REDIRECT_URI || "http://localhost:3000/api/github/callback"; // Your app's callback URL
  
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&allow_signup=true`;
  
    return NextResponse.json({ url: authUrl });
}