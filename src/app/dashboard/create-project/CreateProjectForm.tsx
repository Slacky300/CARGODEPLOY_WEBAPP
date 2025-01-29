"use client";
import React, { useEffect, useState } from "react";
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
  const [slugExists, setSlugExists] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateProjectFormValues>({
    defaultValues: {
      name: "",
      branch: "",
      rootDir: "",
      outDir: "",
      slug: "",
      commit: "hello",
      buildCommand: "npm run build",
      installCommand: "npm install",
      token: token,
      envVars: [{ key: "", value: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "envVars",
  });


  const { branches, branchesLoading } = useRepositoryDetails(
    repo?.owner.login,
    repo?.name,
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
    status: "PENDING" | "SUCCESS" | "FAILED";
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
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create project");
    }

    return response.json();
  };

  const queryClient = useQueryClient();
  const mutation = useMutation<ApiResponse, ApiError, CreateProjectFormValues>({
    mutationFn: createProject,
    onSuccess: (data) => {
      toast({
        title: `Project for ${data.data.updatedProject.gitHubRepoURL.split("/")[1].split(".")[0]} created successfully`,
        description: `Deployment is in progress. You will be redirected to the deployment page shortly.`,
      })
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.push(`/dashboard/deployments/view/${data.data.newDeployment.id}`);
    },
    onError: (error) => {

      toast({
        title: "Failed to create project",
        description: error.message || "An error occurred",
        color: "bg-red-500",
      });
    },
  });

  const onSubmit = (data: CreateProjectFormValues) => {
    if (slugExists) {
      toast({
        title: "Slug already exists",
        description: "Please enter a different slug",
        color: "bg-yellow-500",
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

  useEffect(() => {
    const setLatestCommit = async () => {
      const data = await fetchCommits(repo.owner.login, repo.name, { isPrivate: repo.private, token });
      setGetCommit(data[0]);
      if (branches && branches[0]) {
        register("branch", {
          value: ["main", "master"].includes(branches[0].name) ? branches[0].name : branches[0].name,
        });
      }      
    };
    setLatestCommit();
  }, []);

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
              {...register("name", { required: "Project name is required" })}
              placeholder="Enter project name"
              className="w-full px-4 py-2 rounded-md bg-gray-200 text-black border border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
            {errors.name && <p className="text-red-600">{errors.name.message}</p>}
          </div>

          <SlugInput slug={slug} setSlug={setSlug} register={register} setSlugExists={setSlugExists} slugExists={slugExists} />

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

          {/* Div which Hnadle the Commit Data */}
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="commit">
              Commit
            </label>
            <input
              id="commit"
              {...register("commit", { required: "Commit is required" })}
              placeholder={getCommit ? `${getCommit.sha.slice(0, 6)} ${getCommit.commit.message.slice(0, 20)}...` : "Select a commit"}
              className="w-full px-4 py-2 rounded-md bg-gray-100 text-gray-800 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-not-allowed"
              value={getCommit ? `${getCommit.sha.slice(0, 6)} | ${getCommit.commit.message.slice(0, 20)}...` : ""}
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
            <input
              id="rootDir"
              {...register("rootDir", { required: "Root folder is required" })}
              placeholder="Enter root folder path"
              className="w-full px-4 py-2 rounded-md bg-gray-200 text-black border border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
            {errors.rootDir && <p className="text-red-600">{errors.rootDir.message}</p>}
          </div>

          <div className="w-full flex items-center space-x-4">

            {/* Build Command Input */}
            <div className="flex-1">
              <label className="block text-sm font-medium">Build Command</label>
              <input
                {...register("buildCommand", { required: "Build command is required" })}
                placeholder="e.g., run build"
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
                {...register("installCommand", { required: "Install command is required" })}
                placeholder="e.g., install"
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


          <div className="w-full ">
            <label className="block text-sm font-medium mb-4">Environment Variables</label>
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2 mb-2">
                <input
                  {...register(`envVars.${index}.key`)}
                  placeholder="Key"
                  className="flex-1 min-w-0 px-4 py-2 rounded-md bg-gray-200 text-black border border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                />
                <input
                  {...register(`envVars.${index}.value`)}
                  placeholder="Value"
                  className="flex-1 min-w-0 px-4 py-2 rounded-md bg-gray-200 text-black border border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                />
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="px-3 py-2  flex-col bg-gray-800 text-white rounded-md hover:bg-gray-700 transition"
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

          <div>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full px-4 py-2 bg-gray-200 text-black rounded-md font-medium hover:bg-gray-700 hover:text-white transition"
            >
              {mutation.isPending ?
                <>
                  <div className="loader border-t-transparent border-4 border-gray-500 rounded-full w-6 h-6 animate-spin"></div>
                  Creating Project...
                </> :
                <>
                  Create Project
                </>}
            </button>
          </div>
        </form>

      </div>
      {
        showModal && <CommitChoice token={token ? String(token) : ''} repo={repo} onCommitSubmit={getCommitData} onClose={() => setShowModal(false)} />
      }
    </div>
  );
};

export default CreateProjectForm;
