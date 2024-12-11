export const PRODUCT_CATEGORIES = [
    {
        label: "Examples",
        value: "examples" as const,
        featured: [
            {
                name: "React",
                href: "/docs/react",
                description: "Deploy React applications effortlessly with CargoDeploy.",
                image: "/example.jpg",
            },
            {
                name: "Vue",
                href: "/docs/vue",
                description: "Deploy Vue applications with optimized performance using CargoDeploy.",
                image: "/example.jpg",
            },
            {
                name: "Angular",
                href: "/docs/angular",
                description: "Streamline the deployment of Angular applications.",
                image: "/example.jpg",
            },
            {
                name: "Svelte",
                href: "/docs/svelte",
                description: "Quickly deploy Svelte applications with our automated pipeline.",
                image: "/example.jpg",
            }
        ]
    },
    {
        label: "Features",
        value: "features" as const,
        featured: [
            {
                name: "Kubernetes Integration",
                href: "/features/kubernetes",
                description: "Scalable container orchestration with Kubernetes.",
                image: "/example.jpg",
            },
            {
                name: "AWS S3 Storage",
                href: "/features/s3-storage",
                description: "High-availability static file hosting via AWS S3.",
                image: "/example.jpg",
            },
            {
                name: "Node.js Reverse Proxy",
                href: "/features/reverse-proxy",
                description: "Serve static files using Node.js for dynamic routing and caching.",
                image: "/example.jpg",
            }
        ]
    },
    {
        label: "Pricing",
        value: "pricing" as const,
        featured: [
            {
                name: "Free Tier",
                href: "/pricing/free",
                description: "Get started with basic deployment features at no cost.",
                image: "/example.jpg",
            },
            {
                name: "Pro Tier",
                href: "/pricing/pro",
                description: "Upgrade for advanced features and priority support.",
                image: "/example.jpg",
            }
        ]
    },
    {
        label: "Resources",
        value: "resources" as const,
        featured: [
            {
                name: "Documentation",
                href: "/docs",
                description: "Comprehensive guides to help you get started.",
                image: "/example.jpg",
            },
            {
                name: "Community",
                href: "/community",
                description: "Join our community for tips, help, and collaboration.",
                image: "/example.jpg",
            },
            {
                name: "Blog",
                href: "/blog",
                description: "Read about best practices, updates, and case studies.",
                image: "/example.jpg",
            }
        ]
    }
];


export interface Repository {
    id: string;
    name: string;
    url: string;
    description: string;
    clone_url: string;
    visibility: string;
    owner: {
        login: string;
        avatar_url: string;
    }
}

export interface CreateProjectFormValues {
    name: string;
    branch: string;
    rootDir: string;
    slug: string;
    token: string;
    envVars: { key: string; value: string }[];
}