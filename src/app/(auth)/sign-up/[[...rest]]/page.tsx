"use client"

import MaxWidthWrapper from "@/components/MaxWidthWrapper"
import { SignUp } from "@clerk/nextjs"

const Page = () => {
    return (
        <MaxWidthWrapper>
            <div className="w-full mt-48 sm:mt-24 flex items-center justify-center">
                <SignUp fallbackRedirectUrl="/welcome" forceRedirectUrl="/welcome" />
            </div>
        </MaxWidthWrapper>
    )
}

export default Page