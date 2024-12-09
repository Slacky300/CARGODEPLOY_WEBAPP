import DashboardPage from '@/components/DashboardPage';
import prisma from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { DashboardPageContent } from './DashboardPageContent';
import NewProjectButton from '@/components/NewProjectButton';

const Page = async () => {

  const { userId } = await auth();
  
  if (!userId) {
    redirect("/");
  }

  const userClerk = await prisma.user.findUnique({
    where: {
      externalId: userId
    }
  });

  if (!userClerk) {
    redirect("/welcome");
  }




  return (
    <DashboardPage 
    cta={
        <NewProjectButton />
    }
    
    title='Your Projects'>
     <DashboardPageContent />
    </DashboardPage>
  )
}

export default Page
