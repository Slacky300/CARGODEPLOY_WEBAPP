import React from 'react'
import { LoadingSpinner } from './LoadingSpinner'

const PageLoader = ({ text }: { text: string }) => {
    return (
        <div
            className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-700"
        >
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-lg font-semibold">
                {text}
            </p>
        </div>
    )
}

export default PageLoader
