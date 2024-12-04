"use client";

import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";

const TestForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    gitHubRepoURL: "",
    slugIdentifier: "",
    rootDir: "",
    envVars: [{ key: "", value: "" }], 
  });

  const {data} = useQuery<{status: number, success: boolean, error?: string, data?: any}>({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      return res.json();
    },
    refetchInterval: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEnvVarChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedEnvVars = [...formData.envVars];
    if (name === "key" || name === "value") {
      updatedEnvVars[index][name] = value;
    }
    setFormData((prev) => ({ ...prev, envVars: updatedEnvVars }));
  };

  const addEnvVar = () => {
    setFormData((prev) => ({
      ...prev,
      envVars: [...prev.envVars, { key: "", value: "" }],
    }));
  };

  const removeEnvVar = (index: number) => {
    const updatedEnvVars = formData.envVars.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, envVars: updatedEnvVars }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if(data?.success){
      alert("Project created successfully");
    }else{
      alert(data?.error || "An error occurred");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-xl p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-gray-700 mb-6 text-center">
          Test Form
        </h2>
        <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Project Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter project name"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* GitHub Repo URL */}
          <div>
            <label htmlFor="gitHubRepoURL" className="block text-sm font-medium text-gray-700">
              GitHub Repository URL
            </label>
            <input
              type="url"
              id="gitHubRepoURL"
              name="gitHubRepoURL"
              value={formData.gitHubRepoURL}
              onChange={handleChange}
              placeholder="Enter GitHub repository URL"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Slug Identifier */}
          <div>
            <label htmlFor="slugIdentifier" className="block text-sm font-medium text-gray-700">
              Slug Identifier
            </label>
            <input
              type="text"
              id="slugIdentifier"
              name="slugIdentifier"
              value={formData.slugIdentifier}
              onChange={handleChange}
              placeholder="Enter slug identifier"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Root Directory */}
          <div>
            <label htmlFor="rootDir" className="block text-sm font-medium text-gray-700">
              Root Directory
            </label>
            <input
              type="text"
              id="rootDir"
              name="rootDir"
              value={formData.rootDir}
              onChange={handleChange}
              placeholder="Enter root directory"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Environment Variables */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Environment Variables
            </label>
            {formData.envVars.map((envVar, index) => (
              <div key={index} className="flex space-x-4 items-center mt-2">
                <input
                  type="text"
                  name="key"
                  value={envVar.key}
                  onChange={(e) => handleEnvVarChange(index, e)}
                  placeholder="Key"
                  className="block w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <input
                  type="text"
                  name="value"
                  value={envVar.value}
                  onChange={(e) => handleEnvVarChange(index, e)}
                  placeholder="Value"
                  className="block w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => removeEnvVar(index)}
                  className="text-red-500 hover:text-red-700 focus:outline-none"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addEnvVar}
              className="mt-3 text-blue-500 hover:text-blue-700 focus:outline-none"
            >
              + Add Environment Variable
            </button>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TestForm;
