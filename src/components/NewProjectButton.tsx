"use client"; // Mark this as a client component

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@radix-ui/react-toast';


interface NewProjectButtonProps {
    projectCount: number;
    userQuota: number | 3;
}

const NewProjectButton = ({projectCount, userQuota}: NewProjectButtonProps) => {
    const router = useRouter();
    const {toast} = useToast();
    const handleClick = () => {
        if(projectCount >= userQuota){
            toast({
                title: "Project limit reached",
                description: "You have reached the maximum number of projects allowed.",
                variant: "destructive",
                duration: 1000,
                action: <ToastAction altText="Upgrade">
                    <Button variant="ghost" className='border border-white' onClick={() => router.push('/dashboard/subscription')}>Upgrade</Button>
                </ToastAction>
            });
            return;
        }else{
            router.push('/dashboard/create-project'); 
        }
    };

    return (
        <Button className="w-full sm:w-fit bg-gray-800"  onClick={handleClick}>
            <PlusIcon className="size-4 mr-2" />
            <span className="tracking-widest">New Project</span>
        </Button>
    );
};

export default NewProjectButton;
