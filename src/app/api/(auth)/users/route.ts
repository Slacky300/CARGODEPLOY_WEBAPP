import prisma from "@/lib/db";
import { auth, currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export const GET = async () => {

  const {userId} = await auth();
  const user = await currentUser();
  console.log(userId);
  console.log(user);

  if(!userId || !user){
    return NextResponse.json({
      "synced": false
    })
  }

  const doesUserExistsInDB = await prisma.user.findUnique({
    where: {
      externalId: userId
    }
  });

  if(!doesUserExistsInDB){
    await prisma.user.create({
      data: {
        externalId: userId,
        email: user.emailAddresses[0].emailAddress,
        name: user.fullName,
        avatar: user.imageUrl,
        username: user.username,
        quotaLimit: 1
      }
    });
  }
  return NextResponse.json({
    "synced": true ,
  })
}