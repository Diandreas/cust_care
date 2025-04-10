import React, { useState, ReactNode, useEffect } from 'react';
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
    Home, Users2, Sparkles, MessageCircle, FileText,
    CreditCard, Settings, User as UserIcon,
    Menu, X, LogOut, Bell, ChevronRight
} from 'lucide-react';
import { useTranslation } from '@/i18n';

interface AuthenticatedLayoutProps {
    user: User;
    header?: ReactNode;
    children: ReactNode;
    fullWidth?: boolean;
}

export default function AuthenticatedLayout({
    user,
    header,
    children,
    fullWidth = false
}: AuthenticatedLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    // Get the sidebar expanded state from localStorage with a default of false
    const [sidebarExpanded, setSidebarExpanded] = useState(() => {
        // Check if we're in a browser environment first to avoid SSR issues
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('sidebarExpanded');
            return saved !== null ? JSON.parse(saved) : false;
        }
        return false;
    });

    const { url } = usePage();
    const { t } = useTranslation();
    const [isScrolled, setIsScrolled] = useState(false);

    // Persist sidebar expanded state to localStorage whenever it changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('sidebarExpanded', JSON.stringify(sidebarExpanded));
        }
    }, [sidebarExpanded]);

    // Monitor scroll to apply shadow effects to header
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close sidebar when clicking outside (on desktop)
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (sidebarExpanded && !target.closest('.sidebar-container')) {
                setSidebarExpanded(false);
            }
        };

        if (sidebarExpanded) {
            document.addEventListener('click', handleClickOutside);
        }

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [sidebarExpanded]);

    const navigation = [
        { name: t('navigation.dashboard'), href: route('dashboard'), icon: Home, current: url.startsWith('/dashboard') },
        { name: t('navigation.clients'), href: route('clients.index'), icon: Users2, current: url.startsWith('/clients') },
        { name: t('navigation.campaigns'), href: route('campaigns.index'), icon: Sparkles, current: url.startsWith('/campaigns') },
        { name: t('navigation.messages'), href: route('messages.index'), icon: MessageCircle, current: url.startsWith('/messages') },
        { name: t('navigation.templates'), href: route('templates.index'), icon: FileText, current: url.startsWith('/templates') },
        { name: t('navigation.subscription'), href: route('subscription.index'), icon: CreditCard, current: url.startsWith('/subscription') },
    ];

    const sidebarVariants = {
        collapsed: {
            width: "64px",
            transition: {
                duration: 0.3,
                ease: "easeInOut"
            }
        },
        expanded: {
            width: "240px",
            transition: {
                duration: 0.3,
                ease: "easeInOut"
            }
        }
    };

    const mobileMenuVariants = {
        hidden: { x: "-100%", opacity: 0 },
        visible: {
            x: 0,
            opacity: 1,
            transition: {
                type: "spring",
                damping: 25,
                stiffness: 300
            }
        },
        exit: {
            x: "-100%",
            opacity: 0,
            transition: {
                duration: 0.2,
                ease: "easeInOut"
            }
        }
    };

    const navItemVariants = {
        collapsed: {
            opacity: 0,
            display: "none",
            transition: {
                duration: 0.2,
                ease: "easeInOut"
            }
        },
        expanded: {
            opacity: 1,
            display: "block",
            transition: {
                delay: 0.1,
                duration: 0.3,
                ease: "easeInOut"
            }
        }
    };

    const handleToggleSidebar = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSidebarExpanded(!sidebarExpanded);
    };

    // Determine if we're on the campaigns page
    const isCampaignsPage = url.startsWith('/campaigns');

    return (
        <ThemeProvider defaultTheme="light" storageKey="elitesms-theme">
            <div className="min-h-screen bg-background text-foreground">
                {/* Mobile sidebar */}
                <AnimatePresence>
                    {sidebarOpen && (
                        <div className="fixed inset-0 z-50 lg:hidden">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="fixed inset-0 bg-charcoal/60 backdrop-blur-sm"
                                aria-hidden="true"
                                onClick={() => setSidebarOpen(false)}
                            />

                            <motion.div
                                variants={mobileMenuVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="fixed inset-y-0 left-0 flex w-full max-w-xs flex-1 flex-col bg-card text-card-foreground border-r border-border rounded-r-xl shadow-lg"
                            >
                                <div className="flex items-center justify-between px-4 py-4">
                                    <Link href={route('dashboard')} className="flex items-center">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-indigo-500/40">
                                            <span className="text-lg font-bold text-white">E</span>
                                        </div>
                                        <span className="ml-3 text-xl font-semibold">
                                            Elite<span className="text-indigo-500 dark:text-indigo-400">SMS</span>
                                        </span>
                                    </Link>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setSidebarOpen(false)}
                                        className="text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-full hover:bg-accent/30"
                                        aria-label={t('navigation.closeSidebar')}
                                    >
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>

                                <div className="flex-1 overflow-y-auto px-4 py-2">
                                    <nav className="flex flex-1 flex-col space-y-2">
                                        {navigation.map((item) => (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                className={cn(
                                                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                                                    item.current
                                                        ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-md shadow-indigo-500/30"
                                                        : "text-foreground/80 hover:text-indigo-500 hover:bg-accent/50"
                                                )}
                                                aria-current={item.current ? 'page' : undefined}
                                            >
                                                <div className={cn(
                                                    "flex h-8 w-8 items-center justify-center rounded-lg",
                                                    item.current
                                                        ? "bg-white/20"
                                                        : "bg-accent/40"
                                                )}>
                                                    <item.icon
                                                        className={cn(
                                                            "h-5 w-5",
                                                            item.current
                                                                ? "text-white"
                                                                : "text-muted-foreground"
                                                        )}
                                                        aria-hidden="true"
                                                    />
                                                </div>
                                                {item.name}
                                            </Link>
                                        ))}
                                    </nav>
                                </div>

                                <div className="p-4 border-t border-border/30">
                                    <div className="flex items-center justify-between">
                                        <ThemeToggle />
                                        <LanguageSwitcher />
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Desktop sidebar (collapsed/expanded) */}
                <motion.div
                    className={`sidebar-container fixed inset-y-0 left-0 z-30 hidden lg:flex lg:flex-col border-r border-border bg-card text-card-foreground overflow-hidden ${isCampaignsPage ? 'lg:z-20' : 'lg:z-30'}`}
                    initial="collapsed"
                    animate={sidebarExpanded ? "expanded" : "collapsed"}
                    variants={sidebarVariants}
                >
                    <div className="flex h-16 shrink-0 items-center justify-center py-6">
                        <Link href={route('dashboard')} className="flex items-center justify-center">

                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-indigo-500/40 transition-transform duration-300 hover:scale-105">
                                <span className="text-lg font-bold text-white">E</span>
                            </div>
                            <motion.span
                                className="ml-3 text-xl font-semibold"
                                variants={navItemVariants}
                                initial="collapsed"
                                animate={sidebarExpanded ? "expanded" : "collapsed"}
                            >
                                Elite<span className="text-indigo-500 dark:text-indigo-400">SMS</span>
                            </motion.span>

                        </Link>
                    </div>

                    <div className="flex flex-col flex-1 overflow-y-auto py-6">


                        <nav className="flex-1 px-2 py-2 space-y-2">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center rounded-xl transition-all duration-200 overflow-hidden",
                                        item.current
                                            ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-md shadow-indigo-500/30"
                                            : "text-foreground/80 hover:text-indigo-500 hover:bg-accent/50",
                                        sidebarExpanded ? "px-4 py-3" : "justify-center h-12 w-12 mx-auto"
                                    )}
                                    aria-current={item.current ? 'page' : undefined}
                                >
                                    <div className={cn(
                                        "flex items-center justify-center rounded-lg",
                                        item.current
                                            ? "bg-white/20"
                                            : "",
                                        sidebarExpanded ? "h-8 w-8" : "h-8 w-8"
                                    )}>
                                        <item.icon
                                            className={cn(
                                                "flex-shrink-0",
                                                item.current ? "text-white" : "text-muted-foreground",
                                                sidebarExpanded ? "h-5 w-5" : "h-5 w-5"
                                            )}
                                            aria-hidden="true"
                                        />
                                    </div>
                                    <motion.span
                                        className="ml-3 whitespace-nowrap"
                                        variants={navItemVariants}
                                        initial="collapsed"
                                        animate={sidebarExpanded ? "expanded" : "collapsed"}
                                    >
                                        {item.name}
                                    </motion.span>
                                </Link>
                            ))}
                            <Button
                                onClick={handleToggleSidebar}
                                variant="ghost"
                                size="icon"
                                className={`relative  rounded-full bg-card text-muted-foreground hover:text-foreground border border-border transform translate-x-1/2 ${sidebarExpanded ? 'rotate-180' : ''} transition-transform duration-300 hover:bg-accent/30 shadow-sm`}
                            >
                                <ChevronRight size={16} />
                            </Button>
                        </nav>

                        <div className="mt-auto px-2">
                            <div
                                className={cn(
                                    "flex items-center",
                                    sidebarExpanded ? "px-3 py-2" : "justify-center"
                                )}
                            >
                                <ThemeToggle />
                                {sidebarExpanded && (
                                    <motion.div
                                        className="ml-3"
                                        variants={navItemVariants}
                                        initial="collapsed"
                                        animate={sidebarExpanded ? "expanded" : "collapsed"}
                                    >
                                        <LanguageSwitcher />
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className={`${sidebarExpanded ? 'lg:ml-60' : 'lg:ml-16'} transition-all duration-300`}>
                    {/* Header - Hide on campaigns page as it has its own header */}
                    {!isCampaignsPage && (
                        <div className={`sticky top-0 z-20 flex h-16 shrink-0 items-center border-b border-border bg-background/80 backdrop-blur-sm ${isScrolled ? 'shadow-sm' : ''} transition-shadow duration-200`}>
                            <button
                                type="button"
                                className="px-4 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 lg:hidden"
                                onClick={() => setSidebarOpen(true)}
                                aria-label={t('navigation.openSidebar')}
                            >
                                <span className="sr-only">{t('navigation.openSidebar')}</span>
                                <Menu className="h-5 w-5" aria-hidden="true" />
                            </button>

                            <div className="flex flex-1 justify-between px-4 sm:px-6 lg:px-8">
                                <div className="flex items-center">{header}</div>
                                <div className="ml-4 flex items-center gap-4">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="relative text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-full hover:bg-accent/30"
                                        aria-label={t('navigation.notifications')}
                                    >
                                        <Bell className="h-5 w-5" />
                                        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-[10px] font-bold text-white shadow-sm">
                                            3
                                        </span>
                                        <span className="sr-only">3 unread notifications</span>
                                    </Button>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                className="relative h-10 w-10 rounded-full border border-primary/30 hover:border-primary/80 transition-colors duration-200 hover:bg-accent/30"
                                                aria-label={t('navigation.userMenu')}
                                            >
                                                <Avatar className="h-9 w-9">
                                                    <AvatarFallback className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white">
                                                        {user.name.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg border-border/40">
                                            <div className="flex items-center justify-start gap-3 p-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                                                    <span className="text-sm font-bold text-white">{user.name.charAt(0)}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <p className="text-sm font-medium">{user.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                                </div>
                                            </div>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem asChild>
                                                <Link href={route('profile.edit')} className="flex cursor-pointer items-center rounded-lg py-2 hover:bg-accent/50">
                                                    <UserIcon className="mr-2 h-4 w-4 text-indigo-500" />
                                                    <span>{t('navigation.profile')}</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href={route('subscription.index')} className="flex cursor-pointer items-center rounded-lg py-2 hover:bg-accent/50">
                                                    <CreditCard className="mr-2 h-4 w-4 text-indigo-500" />
                                                    <span>{t('navigation.subscription')}</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href={route('dashboard')} className="flex cursor-pointer items-center rounded-lg py-2 hover:bg-accent/50">
                                                    <Settings className="mr-2 h-4 w-4 text-indigo-500" />
                                                    <span>{t('navigation.settings')}</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem asChild>
                                                <Link
                                                    href={route('logout')}
                                                    method="post"
                                                    as="button"
                                                    className="flex w-full cursor-pointer items-center text-destructive hover:text-destructive/90 rounded-lg py-2 hover:bg-accent/50"
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
                    )}

                    <motion.main
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className={cn(
                            "bg-background min-h-screen",
                            isCampaignsPage ? 'py-0' : 'py-6'
                        )}
                    >
                        {isCampaignsPage ? (
                            // Full width content for campaigns page
                            children
                        ) : (
                            // Standard content with padding for other pages
                            <div className={fullWidth ? 'w-full' : 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'}>
                                {children}
                            </div>
                        )}
                    </motion.main>
                </div>
            </div>
        </ThemeProvider>
    );
}