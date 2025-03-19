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

  const projectsLength = await prisma.project.count({
    where: {
      userId: userClerk.id
    }
  });



  return (
    <DashboardPage 
    cta={
        <NewProjectButton projectCount={projectsLength} userQuota={userClerk?.quotaLimit} />
    }
    
    title='Your Projects'>
     <DashboardPageContent />
    </DashboardPage>
  )
}

export default Page
