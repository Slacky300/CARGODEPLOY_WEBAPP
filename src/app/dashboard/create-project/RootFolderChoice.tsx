"use client";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import {CircleArrowDown, CircleChevronRight } from "lucide-react";
import { GithubRepository } from "@/lib/utils";

interface FolderProps {
    repo : GithubRepository;
    onClosed : ()=> void ;
    onSubmit : (data : String) => void ;
}
interface Folder{
    folder: any;
    setPath: Dispatch<SetStateAction<string>>
}
const Folder = ({ folder , setPath}: Folder) => {
  const [open, setOpen] = useState(false);
  const [subfolders, setSubfolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [pathOfFolder, setPathOfFolder] = useState(''); 


  const fetchSubfolders = async () => {
    if (subfolders.length > 0 || loading) return; 
    setLoading(true);

    try {
      const response = await fetch(folder.url, {
        headers: {
          Accept: "application/vnd.github.v3+json",
        },
      });
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data = await response.json();
      const dirs = data.filter((item: any) => item.type === "dir"); // Only folders
      setSubfolders(dirs);
    } catch (error) {
      console.error("Failed to fetch folders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (name: string) => {
    console.log(name , "this is name")
    setPathOfFolder((prev)=> prev+=`/${name}`)
    setPath(pathOfFolder)
    console.log(pathOfFolder , "this is the pathoffolder")
    setOpen(!open);
    if (!open) fetchSubfolders(); // Fetch subfolders when opening
  };

  return (
    <div className="ml-4 text-lg font-sans ">
      <div
        onClick={()=>handleToggle(folder.name)}

        className="flex items-center space-x-3 p-2 rounded-lg transition-all duration-300"
        
      >
        <span
          className="cursor-pointer transition-transform duration-300"
        >
          {open ? (
            <CircleArrowDown  className="w-5 h-5 text-gray-700" />
          ) : (
            <CircleChevronRight className="w-5 h-5 text-gray-700" />
          )}
        </span>
        <span className="font-medium text-gray-900">{folder.name}</span>
      </div>

      {open && (
        <div className="pl-6">
          {loading && <div className="text-gray-500 text-sm">Loading...</div>}
          {subfolders.map((subfolder: any, index: number) => (
            <Folder key={index} folder={subfolder} setPath={setPath}/>
          ))}
        </div>
      )}
    </div>
  );
};

const FolderExplorer = ({repo , onClosed, onSubmit}: FolderProps ) => {
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [path,setPath] = useState(".");

  // Fetch root folders from GitHub API
  const fetchRootFolders = async (repo : GithubRepository , onClosed : void) => {
    const owner = `${repo.owner.login}`; // Replace with your GitHub username
    const repository = `${repo.name}`; // Replace with your repository name
    console.log(repo.name , "this is repo names")
    try {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repository}/contents/${path}`,
        {
          headers: {
            Accept: "application/vnd.github.v3+json",
          },
        }
      );
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data = await response.json();
      const dirs = data.filter((item: any) => item.type === "dir"); // Only folders
      setFolders(dirs);
    } catch (error) {
      console.error("Failed to fetch root folders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRootFolders(repo);
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
      <div className="bg-white p-8 rounded-lg shadow-xl w-[450px] border border-gray-300 font-sans">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900">Select a Folder</h2>
        <div className="overflow-y-auto max-h-80 min-h-72 border border-gray-300 p-4 rounded-lg">
          {loading ? (
            <div className="text-gray-500 text-sm">Loading...</div>
          ) : (
            folders.map((folder, index) => <Folder key={index} folder={folder} setPath={setPath}/>)
          )}
        </div>
        <div className="flex justify-between mt-4 space-x-3">
          <button type="button" className="px-2 py-2 rounded-sm bg-black text-white" onSubmit={() => onSubmit(path)} >Add</button>
          <button type="button" className="p-2 rounded-sm bg-black text-white" onClick={()=>onClosed()} >Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default FolderExplorer;
