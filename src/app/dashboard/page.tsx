import DashboardPage from '@/components/DashboardPage';
import prisma from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { DashboardPageContent } from './DashboardPageContent';
import { CreateProjectModal } from '@/components/CreateProjectModal';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';

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
    <DashboardPage 
    cta={
      <CreateProjectModal>
        <Button className="w-full sm:w-fit">
          <PlusIcon className="size-4 mr-2" />
          Add Category
        </Button>
      </CreateProjectModal>
    }
    
    title='Your Deployments'>
     <DashboardPageContent />
    </DashboardPage>
  )
}

export default Page
