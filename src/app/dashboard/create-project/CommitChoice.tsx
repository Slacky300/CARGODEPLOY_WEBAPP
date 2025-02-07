"use client";

import { fetchCommits, GithubRepository } from "@/lib/utils";
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
  repo: GithubRepository;
  onCommitSubmit: (commit: Commit) => void;
  onClose: () => void;
}

const CommitChoice: React.FC<CommitChoiceProps> = ({ token, repo, onCommitSubmit, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);
  const [commitHistory, setCommitHistory] = useState<Commit[]>([]);


 

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchCommits(repo.owner.login, repo.name, { isPrivate: repo.private, token });
      setCommitHistory(data);
    };
    fetchData();
  }, []);

  const handleCommitSubmit = (): void => {
    if (selectedCommit) {
      onCommitSubmit(selectedCommit);
    }
  };

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
            }`} 
          >
            <p className="font-bold">{item.sha.slice(0, 10)}</p>
            <p>{item.commit.message}</p>
          </div>
          ))}
        {commitHistory.length < 4 && (
          <div className="p-4 rounded-lg flex justify-center space-x-3 mt-8">
            <p className="text-xl">All your commits are above</p>
          </div>
        )}
        <div className="flex justify-end mt-4 space-x-3">
          <button type="button" className="px-2 py-2 rounded-sm bg-black text-white" onClick={handleCommitSubmit}>Add</button>
          <button type="button" className="p-2 rounded-sm bg-black text-white" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  </div>
  );
};

export default CommitChoice;
