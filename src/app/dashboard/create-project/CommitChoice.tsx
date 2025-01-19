"use client";

import { GithubRepository } from "@/lib/utils";
import React, { useEffect, useState } from "react";

interface Commit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
    };
  };
}

interface CommitChoiceProps {
  token: string;
  repo: GithubRepository | null;
  onCommitSubmit: (commit: Commit) => void;
    onClose: () => void;

}

const CommitChoice: React.FC<CommitChoiceProps> = ({ token, repo , onCommitSubmit , onClose}) => {
  const [searchTerm, setSearchTerm] = useState("");
  console.log(token, "this is token");
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);
  const [commitHistory, setCommitHistory] = useState<Commit[]>([]);

  const owner = repo ? repo.owner.login : ""; // Repository owner
  const repoName = repo ? repo.name : ""; // Repository name

  async function fetchCommits() {
    const url = `https://api.github.com/repos/${owner}/${repoName}/commits`;

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/vnd.github+json", // GitHub's recommended media type
          ...(token ? { Authorization: `Bearer ${token}` } : {}), // Add your token here if available

        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const commits = await response.json();
      setCommitHistory(commits);
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error fetching commits:", error.message);
      } else {
        console.error("Error fetching commits:", error);
      }
    }
  }

  useEffect(() => {
    fetchCommits();
  }, []);

  const handleCommitSubmit = (): void => {
    if (selectedCommit) {
      onCommitSubmit(selectedCommit);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 font-sans">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen">
        <input
          type="text"
          placeholder="Search..."
          className="w-full p-2 mb-4 border rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="space-y-4 overflow-y-auto" style={{ maxHeight: "400px" }}>
        {commitHistory
        ?.filter((commit) =>
          commit.commit.message.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .map((item, index) => (
          <div
            key={index}
            onClick={() => setSelectedCommit(item)}
            className={`p-4 bg-gray-100 rounded-lg shadow justify-between sm:flex ${
              selectedCommit?.sha === item.sha ? 'border-2 border-black' : ''
            }`} // Conditionally apply border-2 border-black when selected
          >
            <p className="font-bold">{item.sha.slice(0, 10)}</p>
            <p>{item.commit.message}</p>
          </div>
        ))}
        </div>
        {commitHistory.length < 4 && (
          <div className="p-4 rounded-lg flex justify-center space-x-3 mt-8">
            <p className="text-xl">All your commits are above</p>
          </div>
        )}
        <div className="flex justify-end mt-4 space-x-3">
          <button className="px-2 py-2 rounded-sm bg-black text-white" onClick={handleCommitSubmit}>Add</button>
          <button className="p-2 rounded-sm bg-black text-white" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default CommitChoice;
