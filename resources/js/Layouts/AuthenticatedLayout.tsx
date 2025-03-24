import React, { useState, ReactNode } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { User } from '@/types';
import { ThemeProvider } from '@/Components/theme-provider';
import { Button } from '@/Components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { ThemeToggle } from '@/Components/ThemeToggle';
import { Avatar, AvatarFallback } from '@/Components/ui/avatar';
import { cn } from '@/lib/utils';
import {
    Users, MessageSquare, Send, FileText, Calendar,
    CreditCard, Settings, User as UserIcon, LayoutDashboard,
    Menu, X, LogOut, BellRing
} from 'lucide-react';

interface AuthenticatedLayoutProps {
    user: User;
    header?: ReactNode;
    children: ReactNode;
}

export default function AuthenticatedLayout({ user, header, children }: AuthenticatedLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { url } = usePage();

    const navigation = [
        { name: 'Tableau de bord', href: route('dashboard'), icon: LayoutDashboard, current: url.startsWith('/dashboard') },
        { name: 'Clients', href: route('clients.index'), icon: Users, current: url.startsWith('/clients') },
        { name: 'Campagnes', href: route('campaigns.index'), icon: Send, current: url.startsWith('/campaigns') },
        { name: 'Messages', href: route('messages.index'), icon: MessageSquare, current: url.startsWith('/messages') },
        { name: 'Modèles', href: route('templates.index'), icon: FileText, current: url.startsWith('/templates') },
        { name: 'Événements', href: route('automatic-events.index'), icon: Calendar, current: url.startsWith('/automatic-events') },
        { name: 'Abonnement', href: route('subscription.index'), icon: CreditCard, current: url.startsWith('/subscription') },
    ];

    return (
        <ThemeProvider defaultTheme="light" storageKey="elitesms-theme">
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                {/* Mobile sidebar */}
                <div
                    className={cn(
                        "fixed inset-0 z-50 lg:hidden",
                        sidebarOpen ? "block" : "hidden"
                    )}
                >
                    <div
                        className="fixed inset-0 bg-gray-900/80"
                        aria-hidden="true"
                        onClick={() => setSidebarOpen(false)}
                    />

                    <div className="fixed inset-y-0 left-0 flex w-full max-w-xs flex-1 flex-col bg-white dark:bg-gray-800">
                        <div className="flex items-center justify-between px-6 py-4">
                            <div className="flex items-center">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-indigo-600">
                                    <span className="text-lg font-bold text-white">E</span>
                                </div>
                                <span className="ml-3 text-xl font-semibold text-gray-900 dark:text-white">
                                    EliteSMS
                                </span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSidebarOpen(false)}
                            >
                                <X className="h-6 w-6" />
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-2">
                            <nav className="flex flex-1 flex-col">
                                <ul className="flex flex-1 flex-col gap-y-2">
                                    {navigation.map((item) => (
                                        <li key={item.name}>
                                            <Link
                                                href={item.href}
                                                className={cn(
                                                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                                                    item.current
                                                        ? "bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 dark:from-purple-950/50 dark:to-indigo-950/50 dark:text-purple-300"
                                                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700/50 dark:hover:text-white"
                                                )}
                                            >
                                                <item.icon
                                                    className={cn(
                                                        "h-5 w-5",
                                                        item.current
                                                            ? "text-purple-600 dark:text-purple-400"
                                                            : "text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400"
                                                    )}
                                                />
                                                {item.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                        </div>
                    </div>
                </div>

                {/* Desktop sidebar */}
                <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
                    <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800">
                        <div className="flex flex-1 flex-col overflow-y-auto">
                            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
                                <div className="flex items-center">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-indigo-600">
                                        <span className="text-lg font-bold text-white">E</span>
                                    </div>
                                    <span className="ml-3 text-xl font-semibold text-gray-900 dark:text-white">
                                        EliteSMS
                                    </span>
                                </div>
                            </div>

                            <nav className="mt-6 flex-1 space-y-1 px-4 py-2">
                                {navigation.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={cn(
                                            "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                                            item.current
                                                ? "bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 dark:from-purple-950/50 dark:to-indigo-950/50 dark:text-purple-300"
                                                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700/50 dark:hover:text-white"
                                        )}
                                    >
                                        <item.icon
                                            className={cn(
                                                "h-5 w-5",
                                                item.current
                                                    ? "text-purple-600 dark:text-purple-400"
                                                    : "text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400"
                                            )}
                                        />
                                        {item.name}
                                    </Link>
                                ))}
                            </nav>
                        </div>
                    </div>
                </div>

                <div className="lg:pl-64">
                    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800">
                        <button
                            type="button"
                            className="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500 lg:hidden dark:border-gray-800 dark:text-gray-400"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <span className="sr-only">Ouvrir la barre latérale</span>
                            <Menu className="h-6 w-6" aria-hidden="true" />
                        </button>

                        <div className="flex flex-1 justify-between px-4 sm:px-6 lg:px-8">
                            <div className="flex items-center">{header}</div>
                            <div className="ml-4 flex items-center gap-4">
                                <ThemeToggle />

                                <Button variant="ghost" size="icon" className="relative">
                                    <BellRing className="h-5 w-5" />
                                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                        3
                                    </span>
                                </Button>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className="relative h-8 w-8 rounded-full border border-gray-200 dark:border-gray-700"
                                        >
                                            <Avatar>
                                                <AvatarFallback className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                                                    {user.name.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <div className="flex items-center justify-start gap-2 p-2">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-indigo-500">
                                                <span className="text-sm font-bold text-white">{user.name.charAt(0)}</span>
                                            </div>
                                            <div className="flex flex-col space-y-1">
                                                <p className="text-sm font-medium">{user.name}</p>
                                                <p className="text-xs text-muted-foreground">{user.email}</p>
                                            </div>
                                        </div>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                            <Link href={route('profile.edit')} className="flex cursor-pointer items-center">
                                                <UserIcon className="mr-2 h-4 w-4" />
                                                <span>Mon profil</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href={route('subscription.index')} className="flex cursor-pointer items-center">
                                                <CreditCard className="mr-2 h-4 w-4" />
                                                <span>Abonnement</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href={route('dashboard')} className="flex cursor-pointer items-center">
                                                <Settings className="mr-2 h-4 w-4" />
                                                <span>Paramètres</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                            <Link
                                                href={route('logout')}
                                                method="post"
                                                as="button"
                                                className="flex w-full cursor-pointer items-center text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400"
                                            >
                                                <LogOut className="mr-2 h-4 w-4" />
                                                <span>Déconnexion</span>
                                            </Link>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>

                    <main className="py-6">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </ThemeProvider>
    );
}