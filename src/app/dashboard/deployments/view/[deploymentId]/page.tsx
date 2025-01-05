"use client";
import React, { useEffect, useState } from "react";
import DashboardPage from "@/components/DashboardPage";
import DeploymentRepo from "../DeploymentRepo";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Deployment } from "@/config";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useSocketContext } from "@/context/SocketContext";

const ViewDeployment = () => {
  const { deploymentId } = useParams();
  const [logs, setLogs] = useState<string[]>([]);
  const { socket } = useSocketContext();
  const [status, setStatus] = useState<string>("PENDING");

  const [doesLogExistInDB, setDoesLogExistInDB] = useState<boolean>(false);

  const { data, isLoading, isError } = useQuery<Deployment>({
    queryKey: ["deployment", deploymentId],
    queryFn: async () => {
      if (!deploymentId) throw new Error("Invalid deploymentId");
      const response = await fetch(`/api/deployment?deploymentId=${deploymentId}`);
      if (!response.ok) throw new Error("Failed to fetch deployment details");
      const data = await response.json();
      return data.deployment;
    },
  });

  const { data: logsData } = useQuery({
    queryKey: ["logs", deploymentId],
    queryFn: async () => {
      const response = await fetch(`/api/logs?deploymentId=${deploymentId}`);
      if (!response.ok) return null;
      const data = await response.json();
      setDoesLogExistInDB(true);
      if(logsData){}
      setLogs(data.logs.split("\n"));
      return data.logs;
    },
  });

  useEffect(() => {
    if (doesLogExistInDB) return;
    if (!socket || !deploymentId) return;

    socket.emit("join", deploymentId);

    socket.on("logUpdate", (payload: { deploymentId: string; logs: string }) => {
      if (payload?.logs) {
        if (payload.logs === "SUCCESS" || payload.logs === "FAILED") {
          setStatus(payload.logs);
          return;
        }
        setLogs((prevLogs) => [...prevLogs, payload.logs]);
      }
    });

    return () => {
      socket.off("logUpdate");
    };
  }, [socket, deploymentId]);

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
        <p className="text-red-500 text-center">Failed to load Deployment Details</p>
      </div>
    );
  }

  return (
    <DashboardPage
      title={`Logs for ${data.gitHubRepoName}`}
      route={`/dashboard/deployments/${data.projectId}`}
    >
      <div className="flex flex-col w-full h-full p-4 gap-6">
        <DeploymentRepo deploymentInfo={data} status={status} doesLogExistInDB />
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
          {logs.length > 0 ? (
            logs.map((logLine, index) => <div key={index}>{logLine}</div>)
          ) : (
            <div className="text-gray-500">
              No logs available yet. Waiting for updates...
            </div>
          )}
        </div>

        {/* Additional Note */}
        <div className="mt-6 p-4 bg-yellow-100 text-yellow-700 rounded-md text-sm">
          <p>
          Please note: Logs may not be available immediately. Rest assured, you will be notified via email once your deployment has either failed or succeeded.          </p>
        </div>
      </div>
    </DashboardPage>
  );
};

export default ViewDeployment;
