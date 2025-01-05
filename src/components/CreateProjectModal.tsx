"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { PropsWithChildren, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Modal } from "./ui/modal"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"


const PROJECT_VALIDATOR = z.object({
  name: z.string().min(1, "Name is required"),
  gitHubRepoURL: z.string().url("Invalid URL format"),
  slugIdentifier: z.string().min(1, "Slug Identifier is required"),
  rootDir: z.string().min(1, "Root Directory is required"),
  envVars: z.array(z.object({
    key: z.string().min(1, "Key is required"),
    value: z.string().min(1, "Value is required"),
  })).optional(),
})

type ProjectForm = z.infer<typeof PROJECT_VALIDATOR>

interface CreateProjectModalProps extends PropsWithChildren {
  containerClassName?: string
}

export const CreateProjectModal = ({
  children,
  containerClassName,
}: CreateProjectModalProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()

  const { mutate: createProject, isPending } = useMutation({
    mutationFn: async (data: ProjectForm) => {
      await fetch("/api/projects",{
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-projects"] })
      setIsOpen(false)
    },
  })

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ProjectForm>({
    resolver: zodResolver(PROJECT_VALIDATOR),
  })

  const onSubmit = (data: ProjectForm) => {
    createProject(data)
  }

  if(control === undefined) {
    return null
  }

  return (
    <>
      <div className={containerClassName} onClick={() => setIsOpen(true)}>
        {children}
      </div>

      <Modal
        className="max-w-xl p-8"
        showModal={isOpen}
        setShowModal={setIsOpen}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <h2 className="text-lg/7 font-medium tracking-tight text-gray-950">
              New Project
            </h2>
            <p className="text-sm/6 text-gray-600">
              Create a new project with the following details.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                autoFocus
                id="name"
                {...register("name")}
                placeholder="e.g. My Awesome Project"
                className="w-full"
              />
              {errors.name ? (
                <p className="mt-1 text-sm text-red-500">
                  {errors.name.message}
                </p>
              ) : null}
            </div>

            <div>
              <Label htmlFor="gitHubRepoURL">GitHub Repository URL</Label>
              <Input
                id="gitHubRepoURL"
                {...register("gitHubRepoURL")}
                placeholder="e.g. https://github.com/user/repo"
                className="w-full"
              />
              {errors.gitHubRepoURL ? (
                <p className="mt-1 text-sm text-red-500">
                  {errors.gitHubRepoURL.message}
                </p>
              ) : null}
            </div>

            <div>
              <Label htmlFor="slugIdentifier">Slug Identifier</Label>
              <Input
                id="slugIdentifier"
                {...register("slugIdentifier")}
                placeholder="e.g. my-project-slug"
                className="w-full"
              />
              {errors.slugIdentifier ? (
                <p className="mt-1 text-sm text-red-500">
                  {errors.slugIdentifier.message}
                </p>
              ) : null}
            </div>

            <div>
              <Label htmlFor="rootDir">Root Directory</Label>
              <Input
                id="rootDir"
                {...register("rootDir")}
                placeholder="e.g. /path/to/root"
                className="w-full"
              />
              {errors.rootDir ? (
                <p className="mt-1 text-sm text-red-500">
                  {errors.rootDir.message}
                </p>
              ) : null}
            </div>

            <div>
              <Label>Environment Variables</Label>
              <div className="space-y-3">
                {/* Implement a dynamic form to add environment variables */}
              </div>
              {errors.envVars ? (
                <p className="mt-1 text-sm text-red-500">
                  {errors.envVars.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button disabled={isPending} type="submit">
              {isPending ? "Creating..." : "Create Project"}{" "}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}