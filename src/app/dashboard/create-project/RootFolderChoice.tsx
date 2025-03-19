"use client";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { CircleArrowDown, CircleChevronRight } from "lucide-react";
import { GithubRepository } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface FolderProps {
  repo: GithubRepository;
  onClosed: () => void;
  token: string;
  clerkOAuthToken?: string;
  onSubmit: (data: string) => void;
}

interface Folder {
  folder: FolderItem;
  token: string;
  setPath: Dispatch<SetStateAction<string>>;
  currentPath: string;
  selectedPath: string; // To track selected path globally
  setSelectedPath: Dispatch<SetStateAction<string>>; // Function to update selection
}

interface FolderItem {
  name: string;
  path: string;
  type: string;
  url: string;
}

const Folder = ({ folder, setPath, token, currentPath, selectedPath, setSelectedPath }: Folder) => {
  const [open, setOpen] = useState(false);
  const [subfolders, setSubfolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSubfolders = async () => {
    if (subfolders.length > 0 || loading) return;
    setLoading(true);

    try {
      const response = await fetch(folder.url, {
        headers: {
          Accept: "application/vnd.github.v3+json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data: FolderItem[] = await response.json();
      const dirs = data.filter((item) => item.type === "dir"); // Only folders
      setSubfolders(dirs);
    } catch (error) {
      console.error("Failed to fetch folders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    const newPath = currentPath ? `${currentPath}/${folder.name}` : folder.name;

    if (selectedPath === newPath) {
      // If clicking the same folder, deselect it
      setSelectedPath("");
      setPath(""); // Reset path
    } else {
      setSelectedPath(newPath);
      setPath(newPath); // Update full path
    }

    setOpen((prev) => !prev);
    if (!open) fetchSubfolders();
  };

  return (
    <div className="ml-4 text-lg font-sans">
      <div
        onClick={handleToggle}
        className={`flex items-center space-x-3 p-2 rounded-lg transition-all duration-300 cursor-pointer ${
          selectedPath === (currentPath ? `${currentPath}/${folder.name}` : folder.name)
            ? "bg-black text-white" // Highlight selected folder
            : "text-gray-900"
        }`}
      >
        <span className="transition-transform duration-300">
          {open ? (
            <CircleArrowDown className="w-5 h-5" />
          ) : (
            <CircleChevronRight className="w-5 h-5" />
          )}
        </span>
        <span className="font-medium">{folder.name}</span>
      </div>

      {open && (
        <div className="pl-6">
          {loading && <div className="text-gray-500 text-sm">Loading...</div>}
          {subfolders.map((subfolder, index) => (
            <Folder
              key={index}
              folder={subfolder}
              setPath={setPath}
              token={token}
              currentPath={`${currentPath}/${folder.name}`} // Pass down accumulated path
              selectedPath={selectedPath} // Pass the selected path
              setSelectedPath={setSelectedPath} // Pass the setter function
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FolderExplorer = ({ repo, onClosed, onSubmit, token, clerkOAuthToken }: FolderProps) => {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [path, setPath] = useState(""); // Empty by default
  const [selectedPath, setSelectedPath] = useState(""); // Track selected folder



  // Fetch root folders from GitHub API
  const fetchRootFolders = async () => {
    const owner = repo.owner.login;
    const repository = repo.name;

    if(repo.private && token === null) {
      console.error("Private repository requires a token");
      toast({
        title: "Error",
        description: "Private repository requires a token",
        variant: "destructive",
      });
      return;
    }
    try {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repository}/contents/`,
        {
          headers: {
            Accept: "application/vnd.github.v3+json",
            Authorization: repo.private ? `Bearer ${token}` : `Bearer ${clerkOAuthToken}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data: FolderItem[] = await response.json();
      const dirs = data.filter((item) => item.type === "dir"); 
      setFolders(dirs);
    } catch (error) {
      console.log("Failed to fetch root folders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRootFolders();
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
      <div className="bg-white p-8 rounded-lg shadow-xl w-[450px] border border-gray-300 font-sans">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900">Select a Folder</h2>
        <div className="overflow-y-auto max-h-80 min-h-72 border border-gray-300 p-4 rounded-lg">
          {loading ? (
            <div className="text-gray-500 text-sm">Loading...</div>
          ) : (
            folders.map((folder, index) => (
              <Folder
                key={index}
                token={token}
                folder={folder}
                setPath={setPath}
                currentPath=""
                selectedPath={selectedPath}
                setSelectedPath={setSelectedPath}
              />
            ))
          )}
        </div>
        <div className="flex justify-between mt-4 space-x-3">
          <button
            type="button"
            className="px-2 py-2 rounded-sm bg-black text-white"
            onClick={() => {
              onSubmit(path);
              onClosed();
            }} // Pass selected path
          >
            Add
          </button>
          <button type="button" className="p-2 rounded-sm bg-black text-white" onClick={onClosed}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default FolderExplorer;