import React from 'react'
import { Button } from './ui/button';
import { Github } from 'lucide-react';

const GithubAppInstallButton = () => {

    const handleClick = () => {
        window.open('https://github.com/apps/cargodeploy/installations/new');
    };

    return (
        <Button className="w-full sm:w-fit bg-gray-800" onClick={handleClick}>
            <Github className="size-4 mr-2" />
            <span className="tracking-widest">Configure GitHub App</span>
        </Button>
    );
}

export default GithubAppInstallButton
