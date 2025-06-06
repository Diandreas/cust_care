import React, { useState, ReactNode, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { User } from '@/types';

// ShadCN Imports
import { ThemeProvider } from '@/Components/theme-provider';
import { Button } from '@/Components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/Components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetClose,
    SheetFooter
} from '@/Components/ui/sheet';
import { Avatar, AvatarFallback } from '@/Components/ui/avatar';
import {
    Card,
    CardContent
} from '@/Components/ui/card';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from '@/Components/ui/tooltip';
import {
    Badge
} from '@/Components/ui/badge';
import {
    Separator
} from '@/Components/ui/separator';
import {
    ScrollArea
} from '@/Components/ui/scroll-area';
import { ThemeToggle } from '@/Components/ThemeToggle';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Icons
import {
    Home, Users2, Sparkles, MessageCircle, FileText,
    CreditCard, Settings, User as UserIcon,
    Menu, X, LogOut, Bell, ChevronRight
} from 'lucide-react';
import { useTranslation } from '@/i18n';

// Types
interface AuthenticatedLayoutProps {
    user: User;
    header?: ReactNode;
    children: ReactNode;
    fullWidth?: boolean;
}

// Component 1: Logo minimaliste moderne
const Logo = ({ expanded = true }) => (
    <Link href={route('dashboard')} className="flex items-center justify-center group">
        <motion.div
            className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-lg transition-all duration-300 group-hover:shadow-xl"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            <span className="text-lg font-bold text-white">H</span>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </motion.div>
        <AnimatePresence>
            {expanded && (
                <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="ml-3 overflow-hidden"
                >
                    <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 dark:text-white">
                        Hello<span className="text-slate-600 dark:text-slate-300">Boost</span>
                    </span>
                </motion.div>
            )}
        </AnimatePresence>
    </Link>
);

// Component 2: NavItem épuré et moderne
const NavItem = ({ item, expanded }) => {
    const { t } = useTranslation();

    const itemClasses = cn(
        "relative flex items-center rounded-xl transition-all duration-300 group",
        item.current
            ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg"
            : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50",
        expanded ? "px-3 py-3 gap-3" : "justify-center h-11 w-11 mx-auto"
    );

    const iconClasses = cn(
        "transition-all duration-300",
        item.current ? "text-white" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200",
        "h-5 w-5"
    );

    return expanded ? (
        <motion.div
            whileHover={{ x: 4 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            <Link
                href={item.href}
                className={itemClasses}
                aria-current={item.current ? 'page' : undefined}
            >
                <item.icon className={iconClasses} aria-hidden="true" />
                <span className="whitespace-nowrap font-medium">{item.name}</span>
                {item.current && (
                    <motion.div
                        layoutId="activeIndicator"
                        className="absolute right-2 h-1.5 w-1.5 rounded-full bg-white"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                )}
            </Link>
        </motion.div>
    ) : (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Link
                            href={item.href}
                            className={itemClasses}
                            aria-current={item.current ? 'page' : undefined}
                        >
                            <item.icon className={iconClasses} aria-hidden="true" />
                        </Link>
                    </motion.div>
                </TooltipTrigger>
                <TooltipContent
                    side="right"
                    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white border-0 shadow-xl rounded-lg px-3 py-2"
                >
                    <span className="font-medium text-sm">{item.name}</span>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

// Component 3: UserMenu simplifié et élégant
const UserMenu = ({ user }) => {
    const { t } = useTranslation();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="h-10 w-10 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300 hover:shadow-lg"
                    aria-label={t('navigation.userMenu')}
                >
                    <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-sm">
                            {user.name.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-56 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2"
            >
                <div className="flex items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg mb-2">
                    <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold">
                            {user.name.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="ml-3 flex flex-col">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{user.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                    </div>
                </div>
                <div className="space-y-1">
                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer focus:bg-slate-50 dark:focus:bg-slate-800/50">
                        <Link href={route('profile.edit')} className="flex items-center py-2 px-3">
                            <UserIcon className="mr-3 h-4 w-4 text-slate-500 dark:text-slate-400" />
                            <span className="font-medium text-slate-700 dark:text-slate-300">{t('navigation.profile')}</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer focus:bg-slate-50 dark:focus:bg-slate-800/50">
                        <Link href={route('subscription.index')} className="flex items-center py-2 px-3">
                            <CreditCard className="mr-3 h-4 w-4 text-slate-500 dark:text-slate-400" />
                            <span className="font-medium text-slate-700 dark:text-slate-300">{t('navigation.subscription')}</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer focus:bg-slate-50 dark:focus:bg-slate-800/50">
                        {/*<Link href={route('settings.index')} className="flex items-center py-2 px-3">*/}
                            <Settings className="mr-3 h-4 w-4 text-slate-500 dark:text-slate-400" />
                            <span className="font-medium text-slate-700 dark:text-slate-300">{t('navigation.settings')}</span>
                        {/*</Link>*/}
                    </DropdownMenuItem>
                </div>
                <Separator className="my-2 bg-slate-200 dark:bg-slate-700" />
                <div className="pt-1">
                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer focus:bg-red-50 dark:focus:bg-red-900/20">
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="flex w-full items-center text-red-600 dark:text-red-400 py-2 px-3"
                        >
                            <LogOut className="mr-3 h-4 w-4" />
                            <span className="font-medium">{t('navigation.logout')}</span>
                        </Link>
                    </DropdownMenuItem>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

// Main Component
export default function AuthenticatedLayout({
    user,
    header,
    children,
    fullWidth = false
}: AuthenticatedLayoutProps) {
    // State
    const [sheetOpen, setSheetOpen] = useState(false);
    const [sidebarExpanded, setSidebarExpanded] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('sidebarExpanded');
            return saved !== null ? JSON.parse(saved) : false;
        }
        return false;
    });
    const [isScrolled, setIsScrolled] = useState(false);

    // Hooks
    const { url } = usePage();
    const { t } = useTranslation();

    // Effects
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('sidebarExpanded', JSON.stringify(sidebarExpanded));
        }
    }, [sidebarExpanded]);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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

        return () => document.removeEventListener('click', handleClickOutside);
    }, [sidebarExpanded]);

    // Navigation items
    const navigation = [
        { name: t('navigation.dashboard'), href: route('dashboard'), icon: Home, current: url.startsWith('/dashboard') },
        { name: t('navigation.clients'), href: route('clients.index'), icon: Users2, current: url.startsWith('/clients') },
        { name: t('navigation.campaigns'), href: route('campaigns.index'), icon: Sparkles, current: url.startsWith('/campaigns') },
        { name: t('navigation.templates'), href: route('templates.index'), icon: FileText, current: url.startsWith('/templates') },
        { name: t('navigation.subscription'), href: route('subscription.index'), icon: CreditCard, current: url.startsWith('/subscription') },
        // { name: t('navigation.settings'), href: route('settings.index'), icon: Settings, current: url.startsWith('/settings') },
    ];

    // Animation variants
    const sidebarVariants = {
        collapsed: {
            width: "72px",
            transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
        },
        expanded: {
            width: "240px",
            transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
        }
    };

    // Helpers
    const handleToggleSidebar = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSidebarExpanded(!sidebarExpanded);
    };

    const isCampaignsPage = url.startsWith('/campaigns');

    return (
        <ThemeProvider defaultTheme="light" storageKey="elitesms-theme">
            <div className="min-h-screen bg-white dark:bg-slate-900 text-foreground">
                {/* Mobile Sidebar */}
                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                    <SheetContent side="left" className="p-0 sm:max-w-xs border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                        <SheetHeader className="p-4 border-b border-slate-200 dark:border-slate-700">
                            <SheetTitle className="text-left">
                                <Logo />
                            </SheetTitle>
                            <SheetClose className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
                                <X className="h-5 w-5" />
                            </SheetClose>
                        </SheetHeader>

                        <ScrollArea className="h-[calc(100vh-12rem)]">
                            <div className="p-4">
                                <nav className="flex flex-col space-y-2">
                                    {navigation.map((item) => (
                                        <NavItem key={item.name} item={item} expanded={true} />
                                    ))}
                                </nav>
                            </div>
                        </ScrollArea>

                        <SheetFooter className="p-4 border-t border-slate-200 dark:border-slate-700 block bg-slate-50 dark:bg-slate-800/50 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Avatar className="h-9 w-9">
                                        <AvatarFallback className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold">
                                            {user.name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <p className="text-sm font-semibold truncate max-w-[130px] text-slate-900 dark:text-white">{user.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[130px]">{user.email}</p>
                                    </div>
                                </div>
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400 transition-colors"
                                >
                                    <LogOut size={18} />
                                </Link>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <ThemeToggle />
                                <LanguageSwitcher />
                            </div>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>

                {/* Desktop Sidebar */}
                <motion.div
                    className="sidebar-container fixed inset-y-0 left-0 z-30 hidden lg:flex lg:flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
                    initial="collapsed"
                    animate={sidebarExpanded ? "expanded" : "collapsed"}
                    variants={sidebarVariants}
                    style={{ zIndex: isCampaignsPage ? 20 : 30 }}
                >
                    <div className="flex h-16 shrink-0 items-center justify-center py-6 border-b border-slate-200 dark:border-slate-800">
                        <Logo expanded={sidebarExpanded} />
                    </div>

                    <ScrollArea className="flex-1 overflow-hidden">
                        <div className="px-2 py-4">
                            <nav className="space-y-1.5">
                                {navigation.map((item) => (
                                    <NavItem key={item.name} item={item} expanded={sidebarExpanded} />
                                ))}
                            </nav>

                            {/* Toggle Button */}
                            <div className="mt-6 flex justify-center">
                                <motion.button
                                    onClick={handleToggleSidebar}
                                    className={`p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 ${sidebarExpanded ? 'rotate-180' : ''}`}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <ChevronRight size={18} />
                                </motion.button>
                            </div>
                        </div>
                    </ScrollArea>

                    {/* Bottom Section */}
                    <div className="border-t border-slate-200 dark:border-slate-800 pt-2 pb-3 px-3 bg-slate-50/50 dark:bg-slate-800/30">
                        <div className={cn(
                            "flex items-center justify-between",
                            sidebarExpanded ? "mb-3" : "mb-2 justify-center"
                        )}>
                            <ThemeToggle />
                            {sidebarExpanded && <LanguageSwitcher />}
                        </div>

                        {/* User Section */}
                        <div className={cn(
                            "flex items-center",
                            sidebarExpanded ? "justify-between" : "justify-center flex-col space-y-2"
                        )}>
                            <div className={cn(
                                "flex items-center",
                                sidebarExpanded ? "space-x-2" : "justify-center"
                            )}>
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-sm">
                                        {user.name.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                {sidebarExpanded && (
                                    <div className="flex flex-col">
                                        <p className="text-sm font-semibold truncate max-w-[120px] text-slate-900 dark:text-white">{user.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[120px]">{user.email}</p>
                                    </div>
                                )}
                            </div>

                            {sidebarExpanded ? (
                                <Button variant="ghost" size="icon" asChild className="rounded-lg h-8 w-8">
                                    <Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                        className="text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400 transition-colors"
                                    >
                                        <LogOut size={16} />
                                    </Link>
                                </Button>
                            ) : (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Link
                                                href={route('logout')}
                                                method="post"
                                                as="button"
                                                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400 transition-colors"
                                            >
                                                <LogOut size={16} />
                                            </Link>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-0 shadow-xl rounded-lg">
                                            {t('navigation.logout')}
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Main Content */}
                <div className={`${sidebarExpanded ? 'lg:ml-[240px]' : 'lg:ml-[72px]'} transition-all duration-400`}>
                    {/* Header */}
                    {!isCampaignsPage && (
                        <motion.div
                            className={`sticky top-0 z-20 flex h-16 items-center border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm ${isScrolled ? 'shadow-sm shadow-slate-200/50 dark:shadow-slate-800/50' : ''} transition-all duration-200`}
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            <button
                                type="button"
                                className="px-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 focus:outline-none lg:hidden transition-colors"
                                onClick={() => setSheetOpen(true)}
                                aria-label={t('navigation.openSidebar')}
                            >
                                <Menu className="h-5 w-5" aria-hidden="true" />
                            </button>

                            <div className="flex flex-1 items-center justify-between px-4 sm:px-6 lg:px-8">
                                <div className="flex items-center">{header}</div>
                                <div className="flex items-center space-x-2">
                                    <UserMenu user={user} />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Main Content */}
                    <main className={`${fullWidth ? 'px-0' : 'px-4 sm:px-6 lg:px-8'} py-4 ${!isCampaignsPage ? 'pt-6' : ''}`}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                        >
                            {children}
                        </motion.div>
                    </main>
                </div>
            </div>
        </ThemeProvider>
    );
}
