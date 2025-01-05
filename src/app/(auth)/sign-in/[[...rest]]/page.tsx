"use client"
import { SignIn } from "@clerk/nextjs"

const Page = () => {


  return (
       <div className="w-full mt-48 sm:mt-24 flex items-center justify-center">
      <SignIn/>
    </div>
  )
}

export default Page