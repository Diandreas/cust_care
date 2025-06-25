import React, { PropsWithChildren } from 'react';
import { Link } from '@inertiajs/react';
import { ThemeProvider } from '@/Components/theme-provider';
import { ThemeToggle } from '@/Components/ThemeToggle';

export default function GuestLayout({ children }: PropsWithChildren) {
    return (
        <ThemeProvider defaultTheme="light" storageKey="helloboost-theme">
            {/* Animated background bubbles */}
            <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-indigo-50 to-pink-100 dark:from-gray-900 dark:via-indigo-950 dark:to-gray-950">
                {/* Enhanced floating particles */}
                <div className="pointer-events-none absolute inset-0 z-0">
                    <div className="absolute left-1/4 top-10 h-72 w-72 rounded-full bg-indigo-400 opacity-20 blur-3xl animate-pulse-slow" />
                    <div className="absolute right-1/4 bottom-10 h-80 w-80 rounded-full bg-pink-400 opacity-20 blur-3xl animate-pulse-slow delay-2000" />
                    <div className="absolute left-1/2 top-1/2 h-40 w-40 rounded-full bg-purple-400 opacity-10 blur-2xl animate-pulse-slow delay-1000" />

                    {/* Additional floating elements */}
                    <div className="absolute left-10 bottom-1/4 h-20 w-20 rounded-full bg-gradient-to-r from-indigo-300 to-purple-300 opacity-10 blur-xl animate-float" />
                    <div className="absolute right-10 top-1/3 h-16 w-16 rounded-full bg-gradient-to-r from-pink-300 to-rose-300 opacity-15 blur-lg animate-float-delayed" />
                </div>

                <div className="relative z-10 flex min-h-screen flex-col items-center pt-8 sm:justify-center sm:pt-0">
                    <div className="max-w-md w-full">
                        {/* Compact Header - Logo and ThemeToggle on same line */}
                        <div className="mb-8 flex items-center justify-between bg-white/30 dark:bg-gray-800/30 backdrop-blur-md rounded-2xl p-4 border border-gray-200/30 dark:border-gray-700/30 shadow-lg hover:shadow-xl transition-all duration-300">
                            <Link href="/" className="flex items-center group">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-xl transform transition-all duration-300 group-hover:rotate-12 group-hover:scale-110">
                                    <span className="text-xl font-bold text-white drop-shadow-lg">H</span>
                                </div>
                                <span className="ml-3 text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 dark:text-white drop-shadow-sm group-hover:scale-105 transition-transform duration-300">
                                    HelloBoost
                                </span>
                            </Link>

                            {/* Theme Toggle with enhanced styling */}
                            <div className="transform transition-all duration-300 hover:scale-110 hover:rotate-3">
                                <ThemeToggle />
                            </div>
                        </div>

                        {/* Enhanced Glassmorphism card */}
                        <div className="w-full overflow-hidden rounded-2xl bg-white/70 dark:bg-gray-800/80 p-8 shadow-2xl backdrop-blur-2xl border border-gray-200/50 dark:border-gray-700/50 transform transition-all duration-500 hover:shadow-3xl hover:-translate-y-1">
                            {children}
                        </div>

                        {/* Enhanced Footer */}
                        <div className="mt-6 flex items-center justify-center">
                            <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-xl px-4 py-2 border border-gray-200/30 dark:border-gray-700/30">
                                <p className="text-center text-xs text-gray-600 dark:text-gray-400 tracking-wide">
                                    &copy; {new Date().getFullYear()}{' '}
                                    <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
                                        HelloBoost
                                    </span>
                                    . Tous droits réservés.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced custom animations */}
            <style>{`
                @keyframes pulse-slow {
                    0%, 100% {
                        transform: scale(1);
                        opacity: 0.2;
                    }
                    50% {
                        transform: scale(1.1);
                        opacity: 0.3;
                    }
                }

                @keyframes float {
                    0%, 100% {
                        transform: translateY(0px) rotate(0deg);
                    }
                    33% {
                        transform: translateY(-10px) rotate(5deg);
                    }
                    66% {
                        transform: translateY(5px) rotate(-3deg);
                    }
                }

                @keyframes float-delayed {
                    0%, 100% {
                        transform: translateY(0px) rotate(0deg);
                    }
                    33% {
                        transform: translateY(8px) rotate(-4deg);
                    }
                    66% {
                        transform: translateY(-6px) rotate(6deg);
                    }
                }

                .animate-pulse-slow {
                    animation: pulse-slow 8s ease-in-out infinite;
                }

                .animate-float {
                    animation: float 12s ease-in-out infinite;
                }

                .animate-float-delayed {
                    animation: float-delayed 15s ease-in-out infinite;
                }

                .delay-1000 {
                    animation-delay: 1s;
                }

                .delay-2000 {
                    animation-delay: 2s;
                }

                .hover\\:shadow-3xl:hover {
                    box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
                }
            `}</style>
        </ThemeProvider>
    );
}
