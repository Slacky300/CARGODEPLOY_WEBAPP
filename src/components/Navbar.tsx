import React from 'react'
import MaxWidthWrapper from './MaxWidthWrapper'
import { Icons } from './Icons'
import Link from 'next/link'
import NavItems from './NavItems'
import { SignedIn, UserButton } from '@clerk/nextjs'

const Navbar = async () => {
    return (
        <div className='bg-white sticky z-50 top-0 inset-x-0 h-16'>
            <header className='relative bg-white'>
                <MaxWidthWrapper>
                    <div className='border-b border-gray-200'>
                        <div className='flex h-16 items-center'>
                            {/* Mobile Nav */}
                            <div className='ml-4 flex lg:ml-0'>
                                <Link href={'/'}>
                                    <Icons.logo className='w-10 h-10' />
                                </Link>
                            </div>

                            <div className='hidden z-50 lg:ml-8 lg:block lg:self-stretch'>
                                <NavItems />
                            </div>

                            <div className='ml-auto flex items-center'>
                                <div className='hidden lg:flex lg:flex-1 lg:items-center lg:justify-end lg:space-x-6'>
                                    <span className='text-sm text-gray-500 italic'>
                                    
                                    </span>

                                    <SignedIn>
                                        <span aria-hidden="true">
                                            <Link href={'/dashboard'} className='text-gray-900 font-medium'>
                                                Dashboard
                                            </Link>
                                        </span>
                                        <span className='h-6 w-px bg-gray-200' aria-hidden="true" />
                                        <UserButton />
                                    </SignedIn>
                                </div>
                            </div>
                        </div>
                    </div>
                </MaxWidthWrapper>
            </header>
        </div>
    )
}

export default Navbar
