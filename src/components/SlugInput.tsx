import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { CreateProjectFormValues } from "@/config/index";
import { UseFormRegister } from "react-hook-form";

interface SlugInputProps {
    slug: string;
    setSlug: (slug: string) => void;
    register: UseFormRegister<CreateProjectFormValues>;
}

const SlugInput = ({ slug, setSlug, register }: SlugInputProps) => {
    const [debouncedSlug, setDebouncedSlug] = useState("");

    // Debounce the slug input to minimize API calls
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSlug(slug.trim());
        }, 2000); // Trigger after 2 seconds of no typing

        return () => clearTimeout(handler); // Cleanup timeout on slug change
    }, [slug]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSlug(e.target.value);
    };

    // Fetch slug availability using TanStack Query
    const { data: available, isLoading, isError } = useQuery({
        queryKey: ["checkSlugAvailability", debouncedSlug],
        queryFn: async () => {
            const res = await fetch(`/api/deployment/slug?slug=${debouncedSlug}`, { //Need to improve the URL path
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const data = await res.json();
            console.log(data)
            const available = data.available;
            const message = data.message;
            const status = data.status;
            console.log(available, message)
            if (status === 500) {
                throw new Error(message || "Error checking slug availability");
            }

            return available;
        },
        enabled: !!debouncedSlug && debouncedSlug.length > 2, // Only trigger query if debouncedSlug is valid
    });

    return (
        <div>
            <label className="block text-sm font-medium mb-2" htmlFor="project_slug">
                Slug to Identify
            </label>
            <div className="relative">
                <input
                    type="text"
                    id="slug"
                    {...register("slug", { required: "Slug is required" })} // Ensure you're validating 'slug'
                    value={slug}
                    onChange={handleChange}
                    placeholder="Enter project slug"
                    className="w-full px-4 py-2 rounded-md bg-gray-200 text-black border border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                />
                {/* Loading Spinner */}
                {isLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="loader border-t-transparent border-4 border-gray-500 rounded-full w-6 h-6 animate-spin"></div>
                    </div>
                )}
            </div>
            {/* Availability Message */}
            {!isLoading && debouncedSlug && (
                <p
                    className={`mt-2 text-sm ${available ? "text-green-600" : "text-red-600"
                        }`}
                >
                    {available
                        ? "Slug is available!"
                        : "Slug is already taken. Try another one."}
                </p>
            )}
            {/* Error Message */}
            {isError && (
                <p className="mt-2 text-sm text-red-600">
                    Error checking slug availability.
                </p>
            )}
        </div>
    );
};

export default SlugInput;
