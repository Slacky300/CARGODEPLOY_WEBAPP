"use client";
import React from "react";
import DashboardPage from "@/components/DashboardPage";
import DeploymentRepo from "../DeploymentRepo";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Deployment } from "@/config";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const ViewDeployment = () => {

  const { deploymentId } = useParams();
 

  const { data, isLoading, isError } = useQuery<Deployment>({
    queryKey: ['deployment', deploymentId],
    queryFn: async () => {
      const response = await fetch(`/api/deployment?deploymentId=${deploymentId}`);
      const data = await response.json();
      return data.deployment || [];
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }



  if (isError || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-red-500 text-center">
          Failed to load Deployment Details
        </p>
      </div>
    );
  }

  // Example logs to display in the terminal-like UI
  const logs = `
[INFO] Starting deployment process for ${data.gitHubRepoName}...
[INFO] Fetching build artifacts...
[INFO] Build artifacts fetched successfully.
[INFO] Environment: ${"PRODUCTION"}
[INFO] Build completed successfully!
[INFO] Deployment status: ${data.deploymentStatus}
[INFO] Deployment completed at ${data.createdAt}
[INFO] Deployment successful!
`;

  return (
    <DashboardPage title={`Logs for ${data.gitHubRepoName}`} route={`/dashboard/deployments/${data.projectId}`}>
      {/* Container for page content */}
      <div className="flex flex-col w-full h-full p-4 gap-6">
        {/* Info Section */}
        <DeploymentRepo deploymentInfo={data} />

        {/* Terminal-Style Logs Section */}
        <div
          className="
            bg-black
            text-green-500
            rounded-md
            p-4
            font-mono
            text-sm
            overflow-y-auto
            max-h-[60vh]
            leading-relaxed
            whitespace-pre-wrap
          "
        >
          {logs}
        </div>
      </div>
    </DashboardPage>
  );
};

export default ViewDeployment;