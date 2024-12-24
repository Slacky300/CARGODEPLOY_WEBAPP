"use client";
import React from "react";
import DashboardPage from "@/components/DashboardPage";
import { RefreshCcw, ExternalLink, GitBranch } from "lucide-react";

const ViewDeployment = () => {
  // Example deployment data (replace with real data or props/state as needed)
  const deploymentInfo = {
    repoName: "my-awesome-repo",
    repoUrl: "https://github.com/username/my-awesome-repo",
    environment: "Production",
    deployedAt: new Date().toLocaleString(),
    deploymentStatus: "Success",
  };

  // Example logs to display in the terminal-like UI
  const logs = `
[INFO] Starting deployment process for ${deploymentInfo.repoName}...
[INFO] Fetching build artifacts...
[INFO] Build artifacts fetched successfully.
[INFO] Environment: ${deploymentInfo.environment}
[INFO] Build completed successfully!
[INFO] Deployment status: ${deploymentInfo.deploymentStatus}
[INFO] Deployment completed at ${deploymentInfo.deployedAt}
[INFO] Deployment successful!
`;

  return (
    <DashboardPage title={`Logs for ${deploymentInfo.repoName}`} route="/deployments">
      {/* Container for page content */}
      <div className="flex flex-col w-full h-full p-4 gap-6">
        {/* Info Section */}
        <div className="border border-gray-300 rounded-md bg-white p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Repo and Info */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Repository: {deploymentInfo.repoName}
            </h2>
            <p className="text-sm text-gray-600">
              Deployment Environment: {deploymentInfo.environment}
            </p>
            <p className="text-sm text-gray-600">
              Deployed At: {deploymentInfo.deployedAt}
            </p>
            <p className="text-sm text-gray-600">
              Status:{" "}
              <span
                className={`font-semibold ${
                  deploymentInfo.deploymentStatus === "Success"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {deploymentInfo.deploymentStatus}
              </span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <a
              href={deploymentInfo.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-4 py-2 text-sm bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
            >
              <ExternalLink size={16} />
              Open Repo
            </a>
            <button
              onClick={() => {
                // Example action: redeploy
                console.log("Redeploy clicked!");
              }}
              className="flex items-center gap-1 px-4 py-2 text-sm bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
            >
              <RefreshCcw size={16} />
              Redeploy
            </button>
            {/* <button
              onClick={() => {
                // Example action: view pipeline
                console.log("View pipeline clicked!");
              }}
              about="View the pipeline for this deployment"
              disabled
              className="flex items-center gap-1 px-4 py-2 text-sm bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
            >
              <GitBranch size={16} />
              View Pipeline 
            </button> */}
          </div>
        </div>

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