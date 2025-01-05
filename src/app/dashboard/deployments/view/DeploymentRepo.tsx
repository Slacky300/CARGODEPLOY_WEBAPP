"use client";
import React from 'react'
import { RefreshCcw, ExternalLink } from "lucide-react";
import { Deployment } from '@/config';

type DeploymentInfo = {
  deploymentInfo: Deployment,
  status: string,
  doesLogExistInDB: boolean,
}

const DeploymentRepo = ({ deploymentInfo, status, doesLogExistInDB }: DeploymentInfo) => {
  
  const getStatusClass = (deploymentStatus: string) => {
    switch (deploymentStatus) {
      case "SUCCESS":
        return "text-green-600";
      case "FAILED":
        return "text-red-600";
      default:
        return "text-yellow-600";
    }
  };
  
  return (
    <div className="border border-gray-300 rounded-md bg-white p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      {/* Repo and Info */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Repository: {deploymentInfo.gitHubRepoName}
        </h2>
        <p className="text-sm text-gray-600">
          Deployment Environment: {"PRODCTION"}
        </p>
        <p className="text-sm text-gray-600">
          Deployed At: {deploymentInfo.createdAt.toString()}
        </p>
        <p className="text-sm text-gray-600">
          Status:{" "}
          <span
            className={`font-semibold ${getStatusClass(doesLogExistInDB ? deploymentInfo.deploymentStatus: status)}`}
          >
            {deploymentInfo.deploymentStatus === "PENDING" ? status : deploymentInfo.deploymentStatus}
          </span>

        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <a
          href={deploymentInfo.gitHubRepoURL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 cursor-pointer px-4 py-2 text-sm bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
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
  )
}

export default DeploymentRepo
