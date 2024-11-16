import { cn } from '@/lib/utils';
import React from 'react'

const MaxWidthWrapper = ({
    classname,
    children
}: {
    classname?: string;
    children: React.ReactNode;
}) => {
  return (
    <div className={`${cn('mx-auto w-full max-w-screen-xl px-2.5 md:px-20', classname)}`}>
      {children}
    </div>
  )
}

export default MaxWidthWrapper
