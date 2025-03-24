import React, { PropsWithChildren } from 'react';
import { Link } from '@inertiajs/react';
import { ThemeProvider } from '@/Components/theme-provider';
import { ThemeToggle } from '@/Components/ThemeToggle';

export default function GuestLayout({ children }: PropsWithChildren) {
    return (
        <ThemeProvider defaultTheme="light" storageKey="elitesms-theme">
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
                <div className="flex min-h-screen flex-col items-center pt-6 sm:justify-center sm:pt-0">
                    <div className="">
                        <div className="">
                            <Link href="/" className="flex items-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-indigo-600">
                                    <span className="text-xl font-bold text-white">E</span>
                                </div>
                                <span className="ml-3 text-2xl font-semibold tracking-tighter text-gray-900 dark:text-white">
                                    EliteSMS
                                </span>
                            </Link>
                            <div className="mt-6">
                                <ThemeToggle />
                            </div>
                        </div>

                        <div className="">
                            {children}
                        </div>

                        <div className="mt-6 flex items-center justify-center">
                            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                                &copy; {new Date().getFullYear()} EliteSMS. Tous droits réservés.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </ThemeProvider>
    );
}