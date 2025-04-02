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
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import { Avatar, AvatarFallback } from '@/Components/ui/avatar';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home, Users2, Sparkles, MessageCircle, FileText, Calendar,
    CreditCard, Settings, User as UserIcon, LayoutDashboard,
    Menu, X, LogOut, Bell
} from 'lucide-react';
import { useTranslation } from '@/i18n';

interface AuthenticatedLayoutProps {
    user: User;
    header?: ReactNode;
    children: ReactNode;
}

export default function AuthenticatedLayout({ user, header, children }: AuthenticatedLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { url } = usePage();
    const { t } = useTranslation();

    const navigation = [
        { name: t('navigation.dashboard'), href: route('dashboard'), icon: Home, current: url.startsWith('/dashboard') },
        { name: t('navigation.clients'), href: route('clients.index'), icon: Users2, current: url.startsWith('/clients') },
        { name: t('navigation.campaigns'), href: route('campaigns.index'), icon: Sparkles, current: url.startsWith('/campaigns') },
        { name: t('navigation.messages'), href: route('messages.index'), icon: MessageCircle, current: url.startsWith('/messages') },
        { name: t('navigation.templates'), href: route('templates.index'), icon: FileText, current: url.startsWith('/templates') },
        { name: t('navigation.subscription'), href: route('subscription.index'), icon: CreditCard, current: url.startsWith('/subscription') },
    ];

    const sidebarVariants = {
        hidden: { x: -300, opacity: 0 },
        visible: {
            x: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 250,
                damping: 25,
                staggerChildren: 0.05
            }
        },
        exit: {
            x: -300,
            opacity: 0,
            transition: {
                duration: 0.2,
                ease: "easeInOut"
            }
        }
    };

    const itemVariants = {
        hidden: { x: -20, opacity: 0 },
        visible: {
            x: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 300, damping: 24 }
        }
    };

    const fadeInVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { duration: 0.5 }
        }
    };

    return (
        <ThemeProvider defaultTheme="light" storageKey="elitesms-theme">
            <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
                {/* Mobile sidebar */}
                <AnimatePresence>
                    {sidebarOpen && (
                        <div className="fixed inset-0 z-50 lg:hidden">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="fixed inset-0 bg-gray-900/80 backdrop-blur"
                                aria-hidden="true"
                                onClick={() => setSidebarOpen(false)}
                            />

                            <motion.div
                                variants={sidebarVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="fixed inset-y-0 left-0 flex w-full max-w-xs flex-1 flex-col bg-white dark:bg-slate-900"
                            >
                                <div className="flex items-center justify-between px-6 py-4">
                                    <div className="flex items-center">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 via-blue-400 to-pink-500 shadow-xl shadow-blue-500/50 dark:shadow-blue-500/70">
                                            <span className="text-lg font-bold text-white">E</span>
                                        </div>
                                        <span className="ml-3 text-xl font-semibold text-gray-900 dark:text-white">
                                            Elite<span className="text-blue-600 dark:text-blue-400">SMS</span>
                                        </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setSidebarOpen(false)}
                                        className="text-gray-600 hover:text-gray-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                                        aria-label={t('navigation.closeSidebar')}
                                    >
                                        <X className="h-6 w-6" />
                                    </Button>
                                </div>

                                <div className="flex-1 overflow-y-auto px-6 py-2">
                                    <nav className="flex flex-1 flex-col">
                                        <ul className="flex flex-1 flex-col gap-y-2">
                                            {navigation.map((item) => (
                                                <motion.li
                                                    key={item.name}
                                                    variants={itemVariants}
                                                >
                                                    <Link
                                                        href={item.href}
                                                        className={cn(
                                                            "flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium transition-all duration-200",
                                                            item.current
                                                                ? "bg-gradient-to-r from-blue-600 via-blue-400 to-pink-500 text-white shadow-lg shadow-blue-500/30 dark:shadow-blue-500/50 border border-pink-500/50"
                                                                : "text-gray-700 hover:text-blue-700 hover:bg-blue-50 dark:text-gray-300 dark:hover:text-blue-300 dark:hover:bg-blue-900/30 hover:border-l-2 hover:border-l-pink-500 hover:shadow-md hover:shadow-blue-500/20 dark:hover:shadow-blue-500/30"
                                                        )}
                                                        aria-current={item.current ? 'page' : undefined}
                                                    >
                                                        <item.icon
                                                            className={cn(
                                                                "h-5 w-5",
                                                                item.current
                                                                    ? "text-white"
                                                                    : "text-gray-500 group-hover:text-blue-600 dark:text-gray-400 dark:group-hover:text-blue-400"
                                                            )}
                                                            aria-hidden="true"
                                                        />
                                                        {item.name}
                                                    </Link>
                                                </motion.li>
                                            ))}
                                        </ul>
                                    </nav>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Desktop sidebar */}
                <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
                    <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white dark:border-blue-900/50 dark:bg-slate-900">
                        <div className="flex flex-1 flex-col overflow-y-auto">
                            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-blue-900/50">
                                <Link href={route('dashboard')} className="flex items-center group">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 via-blue-400 to-pink-500 shadow-xl shadow-blue-500/40 dark:shadow-blue-500/70 hover:shadow-xl hover:shadow-pink-500/40 dark:hover:shadow-pink-500/70 transition-shadow duration-300">
                                        <span className="text-xl font-bold text-white">E</span>
                                    </div>
                                    <span className="ml-3 text-xl font-semibold text-gray-900 dark:text-white">
                                        Elite<span className="text-blue-600 dark:text-blue-400">SMS</span>
                                    </span>
                                </Link>
                            </div>

                            <nav className="mt-6 flex-1 space-y-2 px-4 py-2" aria-label="Sidebar">
                                {navigation.map((item) => (
                                    <div key={item.name}>
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                "group flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium transition-all duration-200 relative",
                                                item.current
                                                    ? "bg-gradient-to-r from-blue-600 via-blue-400 to-pink-500 text-white shadow-lg shadow-blue-500/30 dark:shadow-blue-500/50 border border-pink-500/50"
                                                    : "text-gray-700 hover:text-blue-700 hover:bg-blue-50 dark:text-gray-300 dark:hover:text-blue-300 dark:hover:bg-blue-900/30 hover:border-l-2 hover:border-l-pink-500 hover:shadow-md hover:shadow-blue-500/20 dark:hover:shadow-blue-500/30"
                                            )}
                                            aria-current={item.current ? 'page' : undefined}
                                        >
                                            <item.icon
                                                className={cn(
                                                    "h-5 w-5",
                                                    item.current
                                                        ? "text-white"
                                                        : "text-gray-500 group-hover:text-blue-600 dark:text-gray-400 dark:group-hover:text-blue-400"
                                                )}
                                                aria-hidden="true"
                                            />
                                            {item.name}
                                            {item.current && (
                                                <div className="absolute -z-10 inset-0 rounded-md bg-gradient-to-r from-blue-600/20 via-blue-400/10 to-pink-500/20 blur-sm"></div>
                                            )}
                                        </Link>
                                    </div>
                                ))}
                            </nav>
                        </div>
                    </div>
                </div>

                <div className="lg:pl-64">
                    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center border-b border-gray-200 bg-white dark:border-blue-900/50 dark:bg-slate-900">
                        <button
                            type="button"
                            className="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden dark:border-blue-900/50 dark:text-gray-400"
                            onClick={() => setSidebarOpen(true)}
                            aria-label={t('navigation.openSidebar')}
                        >
                            <span className="sr-only">{t('navigation.openSidebar')}</span>
                            <Menu className="h-6 w-6" aria-hidden="true" />
                        </button>

                        <div className="flex flex-1 justify-between px-4 sm:px-6 lg:px-8">
                            <div className="flex items-center">{header}</div>
                            <div className="ml-4 flex items-center gap-4">
                                <ThemeToggle />
                                <LanguageSwitcher />

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="relative text-gray-600 hover:text-gray-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                                    aria-label={t('navigation.notifications')}
                                >
                                    <Bell className="h-5 w-5" />
                                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-pink-500 text-[10px] font-bold text-white shadow-lg shadow-pink-500/30 dark:shadow-pink-500/50">
                                        3
                                    </span>
                                    <span className="sr-only">3 unread notifications</span>
                                </Button>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className="relative h-10 w-10 rounded-full border-2 border-blue-400 hover:border-pink-500 transition-colors duration-200 shadow-md shadow-blue-500/30 dark:shadow-blue-500/40 hover:shadow-lg hover:shadow-pink-500/30 dark:hover:shadow-pink-500/40"
                                            aria-label={t('navigation.userMenu')}
                                        >
                                            <Avatar>
                                                <AvatarFallback className="bg-gradient-to-r from-blue-600 via-blue-400 to-pink-500 text-white">
                                                    {user.name.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-white dark:bg-slate-900 dark:border-blue-900/50 shadow-xl shadow-blue-500/20 dark:shadow-blue-500/30 w-64">
                                        <div className="flex items-center justify-start gap-2 p-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 via-blue-400 to-pink-500 shadow-md shadow-pink-500/30 dark:shadow-pink-500/40">
                                                <span className="text-sm font-bold text-white">{user.name.charAt(0)}</span>
                                            </div>
                                            <div className="flex flex-col space-y-1">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                                                <p className="text-xs text-gray-600 dark:text-blue-300/70 truncate">{user.email}</p>
                                            </div>
                                        </div>
                                        <DropdownMenuSeparator className="bg-gray-200 dark:bg-blue-800/50" />
                                        <DropdownMenuItem asChild>
                                            <Link href={route('profile.edit')} className="flex cursor-pointer items-center text-gray-700 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors duration-150 px-3 py-2 hover:text-blue-700 dark:hover:text-blue-300 group">
                                                <UserIcon className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300" />
                                                <span>{t('navigation.profile')}</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href={route('subscription.index')} className="flex cursor-pointer items-center text-gray-700 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors duration-150 px-3 py-2 hover:text-blue-700 dark:hover:text-blue-300 group">
                                                <CreditCard className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300" />
                                                <span>{t('navigation.subscription')}</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href={route('dashboard')} className="flex cursor-pointer items-center text-gray-700 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors duration-150 px-3 py-2 hover:text-blue-700 dark:hover:text-blue-300 group">
                                                <Settings className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300" />
                                                <span>{t('navigation.settings')}</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-gray-200 dark:bg-blue-800/50" />
                                        <DropdownMenuItem asChild>
                                            <Link
                                                href={route('logout')}
                                                method="post"
                                                as="button"
                                                className="flex w-full cursor-pointer items-center text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors duration-150 px-3 py-2 shadow-sm shadow-pink-500/10 dark:shadow-pink-500/20 hover:shadow-md hover:shadow-pink-500/20 dark:hover:shadow-pink-500/30"
                                            >
                                                <LogOut className="mr-2 h-4 w-4" />
                                                <span>{t('navigation.logout')}</span>
                                            </Link>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>

                    <motion.main
                        initial="hidden"
                        animate="visible"
                        variants={fadeInVariants}
                        className="py-6 bg-gray-50 dark:bg-slate-950"
                    >
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            {children}
                        </div>
                    </motion.main>
                </div>
            </div>
        </ThemeProvider>
    );
}