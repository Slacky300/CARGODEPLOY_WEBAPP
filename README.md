# CargoDeploy


[**Server-Side Repository**](https://github.com/Slacky300/CargoDeploy)  

CargoDeploy is a cutting-edge deployment platform that automates frontend builds, stores assets securely in AWS S3, and delivers them seamlessly using a Node.js reverse proxy. Designed for modern frameworks like React and Vite, it ensures scalability, efficiency, and reliability.  

---

## Dashboard Previews  

**Dashboard:**  
![Dashboard Screenshot](https://github.com/user-attachments/assets/ef0491fa-90fc-4a0e-b5bb-6ade97891a9a)  

**Deployment List:**  
![Deployment List Screenshot](https://github.com/user-attachments/assets/36a4977b-2680-4350-ade5-5b9ba4466a1d)  

**Logs of Deployment:**  
![Logs Screenshot 1](https://github.com/user-attachments/assets/89986899-aa73-4c82-8341-02cde1041ca8)  
![Logs Screenshot 2](https://github.com/user-attachments/assets/9e198f40-13e0-47fb-bfb8-d7d95874fac3)  

**Deployed FrontendWebApp**
![image](https://github.com/user-attachments/assets/51b1995c-b82b-4675-8914-ced2895848b6)


---

## Table of Contents

- [Features](#features)
- [Setup](#setup)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Learn More](#learn-more)


## Features

- **Automated Frontend Builds**: Streamline your build process with automated frontend builds.
- **AWS S3 Storage**: High-availability static file hosting via AWS S3.
- **Node.js Reverse Proxy**: Serve static files using Node.js for dynamic routing and caching.
- **Modern Framework Support**: Built for modern frameworks like React and Vite.
- **User Authentication**: Secure user authentication with Clerk.
- **Project Management**: Create, update, and delete projects with ease.
- **Deployment Management**: Manage deployments with detailed status tracking.

## Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL database

### Installation

1. Clone the repository:

    ```sh
    git clone https://github.com/yourusername/cargodeploy.git
    cd cargodeploy
    ```

2. Install dependencies:

    ```sh
    npm install --legacy-peer-deps
    # or
    yarn install --legacy-peer-deps
    ```

3. Set up environment variables:

    Create a `.env` file in the root directory and add the following variables:

    ```env
    DATABASE_URL=your_database_url
    GITHUB_APP_ID=your_github_app_id
    GITHUB_CLIENT_SECRET=your_github_client_secret
    GITHUB_CLIENT_ID=your_github_client_id
    GITHUB_APP_NAME=your_github_app_name
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
    CLERK_API_KEY=your_clerk_api_key
    ```

4. Run database migrations:

    ```sh
    npx prisma migrate dev
    ```

5. Start the development server:

    ```sh
    npm run dev
    # or
    yarn run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

### Creating a Project

1. Navigate to the dashboard.
2. Click on "Create Project".
3. Fill in the project details and submit the form.

### Managing Deployments

1. Navigate to the project details page.
2. View the list of deployments and their statuses.
3. Trigger new deployments as needed.

## Project Structure

```plaintext
.env
.eslintrc.json
.gitignore
.next/
package.json
prisma/
public/
src/
  app/
  components/
  config/
  hooks/
  lib/
  middleware.ts
tailwind.config.ts
tsconfig.json
```

- **.env**: Environment variables.
- **.eslintrc.json**: ESLint configuration.
- **.next/**: Next.js build output.
- **package.json**: Project dependencies and scripts.
- **prisma/**: Prisma schema and migrations.
- **public/**: Public assets.
- **src/**: Source code.
  - **app/**: Application pages and API routes.
  - **components/**: Reusable UI components.
  - **config/**: Configuration files.
  - **hooks/**: Custom React hooks.
  - **lib/**: Utility functions and libraries.
  - **middleware.ts**: Middleware configuration.
- **tailwind.config.ts**: Tailwind CSS configuration.
- **tsconfig.json**: TypeScript configuration.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
