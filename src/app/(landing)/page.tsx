import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { Button, buttonVariants } from "@/components/ui/button";
import { BarChart, Github, Lock, Rocket, Server, Shield, Users } from "lucide-react";
import Link from "next/link";


const PERKS = [
  {
    title: "Seamless Deployment",
    icon: <Lock className="w-1/3 h-1/3" />,
    description: "Automate the deployment of modern frontend applications like React and Vite with minimal manual intervention.",
  },
  {
    title: "Scalability",
    icon: <BarChart className="w-1/3 h-1/3" />,
    description: "Leverage Kubernetes for efficient container orchestration, ensuring scalable and optimized resource management.",
  },
  {
    title: "High Availability",
    icon: <Shield className="w-1/3 h-1/3" />,
    description: "Store and serve static assets with AWS S3, guaranteeing high availability and reliability for your applications.",
  },
  {
    title: "Multi-Tenant Support",
    icon: <Users className="w-1/3 h-1/3" />,
    description: "Manage multiple applications and subdomains under a single, cohesive system with multi-tenant environment support.",
  },
  {
    title: "Reverse Proxy Routing",
    icon: <Server className="w-1/3 h-1/3" />,
    description: "Utilize Node.js for job management and reverse proxy routing, ensuring reliable delivery of applications.",
  },
  {
    title: "Performance Optimization",
    icon: <Rocket className="w-1/3 h-1/3" />,
    description: "Optimize performance and reduce overhead, combining containerization, cloud storage, and a reverse proxy approach.",
  }
];



function Footer() {
  return (
    <footer className="bg-gray-200 text-white py-6 mt-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center">
          <div className="text-sm font-bold text-black">
            &copy; {new Date().getFullYear()} CargoDeploy. All rights reserved.
          </div>
          <div className="flex items-center space-x-4">
            <Link href="https://github.com/Slacky300" target="_blank" passHref>
              <span className="text-black" rel="noopener noreferrer">
                <Github className="w-6 h-6" />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

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
            <Link href='/dashboard' className={buttonVariants()}>
              Get Started
            </Link>
            <Button variant={`ghost`}>Learn More &rarr;</Button>
          </div>
          <div className="mt-12 text-red-600 font-medium">
            Note: Signups are temporarily closed due to budget constraints on our AKS (Azure Kubernetes Service).
            We appreciate your understanding and encourage you to check back soon for updates.
          </div>

        </div>
      </MaxWidthWrapper>
      <section className="border-t border-gray-200 bg-gray-50">
        <MaxWidthWrapper classname="py-20">
          <div className="grid grid-cols-1 gap-y-12 sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-3 md:gap-x-6 sm:gap-x-6 lg:gap-x-8 lg:gap-y-0">
            {PERKS.map((perk, index) => (
              <div key={index} className="text-center mb-8 lg:block lg:text-center">
                <div className="md:flex-shrink-0 flex justify-center">
                  <div className="h-16 w-16 flex items-center justify-center rounded-full bg-yellow-400 text-black ml-1">
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
      <Footer />
    </>
  );
}
