import React from 'react'
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';

interface DashboardPageProps {
    title: string;
    children?: React.ReactNode;
    hideBackButton?: boolean;
    cta?: React.ReactNode;
}

const DashboardPage = ({ title, children, cta, hideBackButton }: DashboardPageProps) => {
    return (
        <section className='flex-1 h-full w-full flex flex-col'>
            <div className='p-6 sm:p-8 flex justify-between border-b border-gray-200'>
                <div className='flex flex-col sm:flex-row sm:items-center gap-y-2 gap-x-8'>
                    {hideBackButton ? null : <Button className='w-fit bg-white' variant={"outline"}>
                        <ArrowLeft className='size-4'/>
                    </Button>}
                </div>
             
            </div>
        </section>
    )
}

export default DashboardPage
