"use client"; // Mark this as a client component

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';

const NewProjectButton = () => {
    const router = useRouter();

    const handleClick = () => {
        router.push('/dashboard/create-project'); 
    };

    return (
        <Button className="w-full sm:w-fit bg-gray-800" onClick={handleClick}>
            <PlusIcon className="size-4 mr-2" />
            <span className="tracking-widest">New Project</span>
        </Button>
    );
};

export default NewProjectButton;
