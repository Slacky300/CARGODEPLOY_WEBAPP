import DashboardPage from '@/components/DashboardPage';
import prisma from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

const Page = async () => {

  const { userId } = await auth();


  if (!userId) {
    redirect("/sign-in");
  }

  const user = await prisma.user.findUnique({
    where: {
      externalId: userId
    }
  });

  if (!user) {
    redirect("/welcome");
  }

  


  return (
    <DashboardPage title='Dashboard'>
      Dashobard Page Content
    </DashboardPage>
  )
}

export default Page
