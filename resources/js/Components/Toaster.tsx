import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
    return (
        <SonnerToaster
            position="top-right"
            toastOptions={{
                style: {
                    background: 'white',
                    color: 'black',
                    border: '1px solid #e2e8f0',
                },
                className: 'border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white',
            }}
        />
    );
} 