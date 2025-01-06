import { Card } from "@/components/ui/card"
import Image from "next/image"

export const DashboardEmptyState = () => {


  return (
    <Card className="flex flex-col items-center justify-center rounded-2xl flex-1 text-center p-6">
      <div className="flex justify-center w-full">
        <a href="https://storyset.com/people">
         <Image src="/images/noprojects.svg" alt="No Projects" width={192} height={192} className="-mt-24"/>
         </a>

      </div>

      <h1 className="mt-2 text-xl/8 font-medium tracking-tight text-gray-900">
        No Projects Yet
      </h1>

      <p className="text-sm/6 text-gray-600 max-w-prose mt-2 mb-8">
        Start deploying your repos by creating your first Project.
      </p>

      {/* <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
        <Button
          variant="outline"
          className="flex items-center space-x-2 w-full sm:w-auto"
          onClick={() => { }}
          disabled={false}
        >
          <span className="size-5">🚀</span>
          <span>{"Quickstart"}</span>
        </Button>

          <Button className="flex bg-gray-800 items-center space-x-2 w-full sm:w-auto">
            <span>Add Project</span>
          </Button>
      </div> */}
    </Card>
  )
}