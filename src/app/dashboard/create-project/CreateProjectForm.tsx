"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Trash, User, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRepositoryDetails } from "@/hooks/use-repository-details";
import SlugInput from "@/components/SlugInput";
import { CreateProjectFormValues } from "@/config/index";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { fetchCommits, GithubRepository } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import CommitChoice from "./CommitChoice";
import RootFolderChoice from "./RootFolderChoice";

interface RepoToDisplay {
  repo: GithubRepository;
  setSelectedRepo: (repo: GithubRepository) => void;
  setNextSection: (next: boolean) => void;
  token?: string;
}

const CreateProjectForm = ({
  repo,
  setNextSection,
  token,
}: RepoToDisplay) => {

  const [slug, setSlug] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalForDir, setModalForDir] = useState(false);
  const [slugExists, setSlugExists] = useState(false);
  const [advancedOptionsVisible, setAdvancedOptionsVisible] = useState(false);
  const router = useRouter();
  const [clerkOauth, setClerkOauth] = useState<string>("");  
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<CreateProjectFormValues>({
    defaultValues: {
      name: "",
      branch: "",
      rootDir: "",
      outDir: "",
      slug: "",
      commit: "",
      buildCommand: "npm run build",
      installCommand: "npm install",
      token: token,
      isPrivate: repo.private,
      envVars: [{ key: "", value: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "envVars",
  });

  const { branches, branchesLoading } = useRepositoryDetails(
    repo.owner.login,
    repo.name,
    token ?? token
  );

  type UpdatedProject = {
    token: string | null;
    name: string;
    branch: string;
    rootDir: string;
    id: string;
    gitHubRepoURL: string;
    slugIdentifier: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    isDeployed: boolean;
  };

  type NewDeployment = {
    status: "PENDING" | "SUCCESS" | "FAILED" | "IN_PROGRESS";
    id: string;
    createdAt: Date;
    updatedAt: Date;
    projectId: string;
    containerId: string | null;
  };

  type ApiResponse = {
    status: number;
    success: boolean;
    data: {
      updatedProject: UpdatedProject;
      newDeployment: NewDeployment;
      message?: string;
    };
  };

  type ApiError = {
    message?: string;
  };

  const createProject = async (
    data: CreateProjectFormValues
  ): Promise<ApiResponse> => {
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: data.name,
        gitHubRepoURL: repo?.clone_url,
        slugIdentifier: data.slug,
        rootDir: data.rootDir,
        branch: data.branch,
        envVars: data.envVars,
        token: data.token,
        build : data.buildCommand,
        install : data.installCommand,
        commit: data.commit,
        commitMessage: getCommit ? getCommit.commit.message : "",
        commitAuthor: getCommit ? getCommit.commit.author.name : "",
      }),
    });
  
    if (!response.ok) {
      const errorData = await response.json(); 
      throw new Error(errorData.error || `HTTP Error ${response.status}`);
    }
  
    return response.json();
  };
  
  const queryClient = useQueryClient();
  const mutation = useMutation<ApiResponse, ApiError, CreateProjectFormValues>({
    mutationFn: createProject,
    onSuccess: (data: ApiResponse) => {
      toast({
        title: `Project for ${data.data.updatedProject.gitHubRepoURL.split("/")[1].split(".")[0]} created successfully`,
        description: `Deployment is in progress. You will be redirected to the deployment page shortly.`,
      })
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.push(`/dashboard/deployments/view/${data.data.newDeployment.id}`);
    },
    onError: async (error: ApiError) => {
    
     
  
    
      toast({
        title: "Failed to create project",
        description: error.message,
        variant: "destructive",
      });
    },
    

  });

  const onSubmit = (data: CreateProjectFormValues) => {
    if (slugExists) {
      toast({
        title: "Slug already exists",
        description: "Please enter a different slug",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate(data);
  };

  const handleOnClick = () => {
    setShowModal(true);
  }
  const [getCommit, setGetCommit] = useState<{ sha: string, commit: { message: string, author: { name: string } } } | null>(null);
  const getCommitData = (selectedCommit: { sha: string, commit: { message: string, author: { name: string } } }) => {
    setGetCommit({
      sha: selectedCommit.sha,
      commit: {
        message: selectedCommit.commit.message,
        author: { name: selectedCommit.commit.author.name }
      }
    });
    setShowModal(false);
  }
  
  const getFolderPathData = (data: string) => {
   

    setValue("rootDir", data.toString());

  }

  useEffect(() => {
    const setLatestCommit = async () => {
      try {
        const data = await fetchCommits(repo.owner.login, repo.name, { isPrivate: repo.private, token });
        if (data && data.length > 0) {
          const latestCommit = data[0];
          setGetCommit(latestCommit);
          setValue("commit", latestCommit.sha);


          if (branches && branches.length > 0) {
            const defaultBranch = ["main", "master"].includes(branches[0].name)
              ? branches[0].name
              : branches[0].name;

            setValue("branch", defaultBranch);
            setValue("rootDir", ".");
          }
        }
      } catch (error) {
        console.error("Failed to fetch commits", error);
      }
    };

    setLatestCommit();
  }, [repo, token, branches]);

  useEffect(() => {
    const fetachOauthToken = async () => {
      try{
        const res = await fetch(`/api/external/oauth-token/github`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': `${process.env.API_KEY}`
          }
        });
        const data = await res.json();
        setClerkOauth(data.token);
      }catch(e){
        console.error(e);
      }
    };
    fetachOauthToken();
  });

  const memoizedFields = useMemo(() => fields, [fields]);

  const isValidCommand = (command: string) => {
    const validCommands = [
      "npm install",
      "yarn install",
      "npm run build",
      "yarn build",
      "npm run start",
      "yarn start"
    ];
    return validCommands.includes(command);
  };

  return (
    <div className="flex flex-col md:flex-row bg-gray-100 text-black p-8 rounded-lg max-w-6xl shadow-md gap-6">
      {/* Left Section - Repository Details */}
      <div className="bg-gray-50 p-6 rounded-md shadow-md w-full md:w-2/5 flex flex-col items-center text-center space-y-4">
        <img
          src={repo?.owner.avatar_url}
          alt="Owner Avatar"
          className="rounded-full shadow-lg mb-4"
        />
        <div className="flex items-center justify-center space-x-2">
          <h3 className="font-bold">{repo?.name}</h3>
          <button
            onClick={() => setNextSection(false)}
            className="px-3 py-1 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-600 transition shadow-md"
          >
            Change
          </button>
        </div>
        <div className="center space-y-1 w-full">
          <div className="flex items-center space-x-3">
            <User className="text-gray-600 flex-shrink-0" size={20} />
            <p className="text-sm text-gray-700">
              <strong>Owner:</strong> {repo?.owner.login}
            </p>
          </div>
          <div className=" flex items-center space-x-0">
            <Github className="text-gray-600 flex-shrink-0" size={20} />
            <Button
              variant="ghost"
              className="text-sm text-blue-600 hover:underline"
              onClick={() => window.open(repo?.clone_url, "_blank")}
            >
              View on GitHub
            </Button>
          </div>
        </div>
      </div>

      {/* Right Section - Create Project Form */}
      <div className="bg-gray-50 text-black p-6 rounded-md shadow-md w-full md:w-4/5">
        <h2 className="text-xl font-bold mb-4 text-center">Create Project</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="name">
              Project Name
            </label>
            <input
              id="name"
              {...register("name", {
                required: "Project name is required",
                minLength: { value: 3, message: "Project name must be at least 3 characters long" }
              })}
              placeholder="Enter project name"
              className="w-full px-4 py-2 rounded-md bg-gray-200 text-black border border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
            {errors.name && <p className="text-red-600">{errors.name.message}</p>}
          </div>

          <SlugInput slug={slug} setSlug={setSlug} register={register} setSlugExists={setSlugExists} slugExists={slugExists} />

          <button
            type="button"
            className="text-blue-600 hover:underline focus:outline-none"
            onClick={() => setAdvancedOptionsVisible(!advancedOptionsVisible)}
          >
            {advancedOptionsVisible ? "Hide Advanced Options" : "Show Advanced Options"}
          </button>

          {advancedOptionsVisible && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2" htmlFor="branch">
                  Git Branches
                </label>
                <select
                  id="branch"
                  {...register("branch", { required: "Branch is required" })}
                  className="w-full px-4 py-2 rounded-md bg-gray-200 text-black border border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  {branchesLoading ? (
                    <option>Loading...</option>
                  ) : (
                    branches?.map((branch) => (
                      <option key={branch.name} value={branch.name}>
                        {branch.name}
                      </option>
                    ))
                  )}
                </select>
                {errors.branch && <p className="text-red-600">{errors.branch.message}</p>}
              </div>

              {/* Div which Handles the Commit Data */}
              <div>
                <label className="block text-sm font-medium mb-2" htmlFor="commit">
                  Commit
                </label>
                <input
                  id="commit"
                  {...register("commit", { required: "Commit is required" })}
                  placeholder={getCommit ? `${getCommit.sha.slice(0, 6)} ${getCommit.commit.message.slice(0, 20)}...` : "Select a commit"}
                  className="w-full px-4 py-2 rounded-md bg-gray-100 text-gray-800 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-not-allowed"
                  value={getCommit ? `${getCommit.sha}` : ""}
                />

                {errors.commit && <p className="text-red-600">{errors.commit.message}</p>}
                <Button
                  variant="ghost"
                  type="button"
                  className="text-sm text-blue-600 hover:underline"
                  onClick={handleOnClick}
                >
                  Choose Commit
                </Button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" htmlFor="rootDir">
                  Source Code Folder Path
                </label>
                <div className="flex gap-2">
                  <input
                    id="rootDir"
                    {...register("rootDir", {
                      required: "Root folder is required",
                      pattern: { value: /^[a-zA-Z0-9-_/.]+$/, message: "Invalid folder path" }
                    })}
                    placeholder="Enter root folder path"
                    className="w-full px-4 py-2 rounded-md bg-gray-200 text-black border border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                  {errors.rootDir && <p className="text-red-600">{errors.rootDir.message}</p>}
                  <button type="button" className="px-2 py-2 rounded-sm bg-black text-white" onClick={() => setModalForDir(true)}>Choose</button>
                </div>
              </div>

              <div className="w-full flex items-center space-x-4">

                {/* Build Command Input */}
                <div className="flex-1">
                  <label className="block text-sm font-medium">Build Command</label>
                  <input
                    {...register("buildCommand", {
                      required: "Build command is required",
                      validate: value => isValidCommand(value) || "Invalid build command"
                    })}
                    placeholder="e.g., npm run build"
                    className="w-full px-4 py-2 rounded-md bg-gray-200 text-black border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.buildCommand && (
                    <p className="text-red-600 mt-1">{errors.buildCommand.message}</p>
                  )}
                  <p className="text-sm text-gray-600 mt-1">
                    Specify the build command. Example: <code>npm run build OR yarn build</code>.
                  </p>
                </div>
              </div>

              <div className="w-full flex items-center space-x-4">

                {/* Install Command Input */}
                <div className="flex-1">
                  <label className="block text-sm font-medium">Install Command</label>
                  <input
                    {...register("installCommand", {
                      required: "Install command is required",
                      validate: value => isValidCommand(value) || "Invalid install command"
                    })}
                    placeholder="e.g., npm install"
                    className="w-full px-4 py-2 rounded-md bg-gray-200 text-black border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.installCommand && (
                    <p className="text-red-600 mt-1">{errors.installCommand.message}</p>
                  )}
                  <p className="text-sm text-gray-600 mt-1">
                    Specify the install command. Example: <code>yarn install OR npm install</code>.
                  </p>
                </div>
              </div>

              <div className="w-full">
                <label className="block text-sm font-medium mb-4">Environment Variables</label>
                {memoizedFields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2 mb-2">
                    <input
                      {...register(`envVars.${index}.key`, { required: "Key is required" })}
                      placeholder="Key"
                      className="flex-1 min-w-0 px-4 py-2 rounded-md bg-gray-200 text-black border border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    />
                    <input
                      {...register(`envVars.${index}.value`, { required: "Value is required" })}
                      placeholder="Value"
                      className="flex-1 min-w-0 px-4 py-2 rounded-md bg-gray-200 text-black border border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    />
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="px-3 py-2 flex-col bg-gray-800 text-white rounded-md hover:bg-gray-700 transition"
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => append({ key: "", value: "" })}
                  className="mt-2 px-4 py-2 bg-gray-200 text-black rounded-md hover:bg-gray-700 hover:text-white transition"
                >
                  Add Variable
                </button>
              </div>
            </>
          )}

          <div>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full px-4 py-2 bg-gray-200 text-black rounded-md font-medium hover:bg-gray-700 hover:text-white transition"
            >
              {mutation.isPending ?
                <>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="loader border-t-transparent border-4 border-gray-500 rounded-full w-6 h-6 animate-spin"></div>
                    <span className="mx-2">Creating Project...</span>
                  </div>
                </> :
                <>
                  Create Project
                </>}
            </button>
          </div>
        </form>

      </div>
      {
        showModal && <CommitChoice token={token ? token.toString() : ''} repo={repo} onCommitSubmit={getCommitData} onClose={() => setShowModal(false)} />
      }
      {
        modalForDir && <RootFolderChoice token={token ? token.toString() : ''} clerkOAuthToken={clerkOauth} repo={repo} onClosed={() => setModalForDir(false)} onSubmit={getFolderPathData} />
      }
    </div>
  );
};

export default CreateProjectForm;