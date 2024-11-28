import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { Button, buttonVariants } from "@/components/ui/button";
import { BarChart, Lock, Shield } from "lucide-react";
import Link from "next/link";


const PERKS = [

  {
    title: "Authorization",
    icon: <Lock className="w-1/3 h-1/3" />,
    description: "Authorization is the process of giving someone permission to do or have something.",
  },
  {
    title: "Security",
    icon: <Shield className="w-1/3 h-1/3" />,
    description: "Security is the degree of resistance to, or protection from, harm.",
  },
  {
    title: "Performance",
    icon: <BarChart className="w-1/3 h-1/3" />,
    description: "Performance is the degree to which a system or machine performs its designated functions.",
  }
]

export default function Home() {
  return (
    <>
      <MaxWidthWrapper>
        <div className="py-20 mx-auto text-center flex flex-col items-center max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-black sm:text-6xl">
            Deploy Smarter with
            <span className="text-yellow-400">&nbsp;CargoDeploy</span>
          </h1>
          <p className="mt-6 text-lg max-w-prose text-muted-foreground">
            Automate frontend builds, store assets with AWS S3, and deliver seamlessly via a Node.js reverse proxy. Scalable, efficient, and built for modern frameworks like React and Vite.
          </p>


          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <Link href='/product' className={buttonVariants()}>
              Get Started
            </Link>
            <Button variant={`ghost`}>Learn More &rarr;</Button>
          </div>
        </div>
      </MaxWidthWrapper>
      <section className="border-t border-gray-200 bg-gray-50">
        <MaxWidthWrapper classname="py-20">
          <div className="grid grid-cols-1 gap-y-12 sm:grid-cols-12 sm:gap-x-6 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-0">
            {PERKS.map((perk, index) => (
              <div key={index} className="text-center md:flex md:items-start md:text-left lg:block lg:text-center">
                <div className="md:flex-shrink-0 flex justify-center">
                  <div className="h-16 w-16 flex items-center justify-center rounded-full bg-yellow-400 text-black">
                    {perk.icon}
                  </div>
                </div>
                <div className="mt-6 md:ml-4 md:mt-0 lg:ml-0 lg:mt-6">
                  <h3 className="text-lg font-semibold text-black">{perk.title}</h3>
                  <p className="mt-3 text-base text-muted-foreground">{perk.description}</p>
                </div>
              </div>
            ))}

          </div>
        </MaxWidthWrapper>
      </section>
    </>
  );
}
