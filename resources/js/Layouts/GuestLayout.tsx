import React, { PropsWithChildren } from 'react';
import { Link } from '@inertiajs/react';
import { ThemeProvider } from '@/Components/theme-provider';
import { ThemeToggle } from '@/Components/ThemeToggle';

export default function GuestLayout({ children }: PropsWithChildren) {
    return (
        <ThemeProvider defaultTheme="light" storageKey="helloboost-theme">
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
                <div className="flex min-h-screen flex-col items-center pt-6 sm:justify-center sm:pt-0">
                    <div className="max-w-md w-full">
                        <div className="mb-8 flex flex-col items-center">
                            <Link href="/" className="flex items-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-lg">
                                    <span className="text-xl font-bold text-white">H</span>
                                </div>
                                <span className="ml-3 text-2xl font-semibold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 dark:text-white">
                                    HelloBoost
                                </span>
                            </Link>
                            <div className="mt-6">
                                <ThemeToggle />
                            </div>
                        </div>

                        <div className="w-full overflow-hidden rounded-xl bg-white/80 p-8 shadow-lg backdrop-blur-sm dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50">
                            {children}
                        </div>

                        <div className="mt-6 flex items-center justify-center">
                            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                                &copy; {new Date().getFullYear()} HelloBoost. Tous droits réservés.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </ThemeProvider>
    );
}