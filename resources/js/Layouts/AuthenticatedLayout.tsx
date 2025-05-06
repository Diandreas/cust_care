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

// Component 1: Logo
const Logo = ({ expanded = true }) => (
    <Link href={route('dashboard')} className="flex items-center justify-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-md shadow-indigo-500/30 transition-all duration-300 hover:scale-105 hover:shadow-lg">
            <span className="text-lg font-bold text-white">E</span>
        </div>
        {expanded && (
            <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="ml-3 text-xl font-semibold overflow-hidden"
            >
                Elite<span className="text-indigo-500 dark:text-indigo-400">SMS</span>
            </motion.span>
        )}
    </Link>
);

// Component 2: NavItem
const NavItem = ({ item, expanded }) => {
    const { t } = useTranslation();

    const itemClasses = cn(
        "flex items-center rounded-lg transition-all duration-200",
        item.current
            ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-md shadow-indigo-500/20"
            : "text-foreground/80 hover:text-indigo-500 hover:bg-accent/30",
        expanded ? "px-4 py-3 gap-3" : "justify-center h-11 w-11 mx-auto"
    );

    const iconContainerClasses = cn(
        "flex items-center justify-center rounded-lg",
        item.current ? "bg-white/20" : "",
        "h-8 w-8"
    );

    const iconClasses = cn(
        "flex-shrink-0",
        item.current ? "text-white" : "text-muted-foreground",
        "h-5 w-5"
    );

    return expanded ? (
        <Link
            href={item.href}
            className={itemClasses}
            aria-current={item.current ? 'page' : undefined}
        >
            <div className={iconContainerClasses}>
                <item.icon className={iconClasses} aria-hidden="true" />
            </div>
            <span className="whitespace-nowrap font-medium">{item.name}</span>
        </Link>
    ) : (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Link
                        href={item.href}
                        className={itemClasses}
                        aria-current={item.current ? 'page' : undefined}
                    >
                        <div className={iconContainerClasses}>
                            <item.icon className={iconClasses} aria-hidden="true" />
                        </div>
                    </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-card border-border shadow-lg">
                    {item.name}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

// Component 3: UserMenu
const UserMenu = ({ user }) => {
    const { t } = useTranslation();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="h-10 w-10 rounded-full border border-primary/30 hover:border-primary/80 transition-colors hover:bg-accent/30"
                    aria-label={t('navigation.userMenu')}
                >
                    <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white">
                            {user.name.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg">
                <div className="flex items-center p-3 bg-accent/10 rounded-t-xl">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                        <span className="text-sm font-bold text-white">{user.name.charAt(0)}</span>
                    </div>
                    <div className="ml-3 flex flex-col">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                </div>
                <div className="p-2">
                    <DropdownMenuItem asChild className="rounded-lg">
                        <Link href={route('profile.edit')} className="flex cursor-pointer items-center py-2">
                            <UserIcon className="mr-2 h-4 w-4 text-indigo-500" />
                            <span>{t('navigation.profile')}</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg">
                        <Link href={route('subscription.index')} className="flex cursor-pointer items-center py-2">
                            <CreditCard className="mr-2 h-4 w-4 text-indigo-500" />
                            <span>{t('navigation.subscription')}</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg">
                        <Link href={route('dashboard')} className="flex cursor-pointer items-center py-2">
                            <Settings className="mr-2 h-4 w-4 text-indigo-500" />
                            <span>{t('navigation.settings')}</span>
                        </Link>
                    </DropdownMenuItem>
                </div>
                <Separator />
                <div className="p-2">
                    <DropdownMenuItem asChild className="rounded-lg">
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="flex w-full cursor-pointer items-center text-destructive hover:text-destructive/90 py-2"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>{t('navigation.logout')}</span>
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
    ];

    // Animation variants
    const sidebarVariants = {
        collapsed: { width: "72px", transition: { duration: 0.3, ease: "easeInOut" } },
        expanded: { width: "220px", transition: { duration: 0.3, ease: "easeInOut" } }
    };

    // Helpers
    const handleToggleSidebar = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSidebarExpanded(!sidebarExpanded);
    };

    const isCampaignsPage = url.startsWith('/campaigns');

    return (
        <ThemeProvider defaultTheme="light" storageKey="elitesms-theme">
            <div className="min-h-screen bg-background text-foreground">
                {/* Mobile Sidebar using Sheet from shadcn/ui */}
                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                    <SheetContent side="left" className="p-0 sm:max-w-xs border-r border-border/40">
                        <SheetHeader className="p-4 border-b border-border/30 bg-card">
                            <SheetTitle className="text-left">
                                <Logo />
                            </SheetTitle>
                            <SheetClose className="absolute right-4 top-4 text-muted-foreground hover:text-foreground rounded-full p-1 hover:bg-accent/30">
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

                        <SheetFooter className="p-4 border-t border-border/30 block bg-accent/10 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Avatar className="h-9 w-9 border border-border/50">
                                        <AvatarFallback className="bg-primary/80 text-white">
                                            {user.name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <p className="text-sm font-medium truncate max-w-[130px]">{user.name}</p>
                                        <p className="text-xs text-muted-foreground truncate max-w-[130px]">{user.email}</p>
                                    </div>
                                </div>
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="p-2 rounded-lg hover:bg-accent/50 text-muted-foreground hover:text-destructive transition-colors"
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
                    className="sidebar-container fixed inset-y-0 left-0 z-30 hidden lg:flex lg:flex-col border-r border-border/40 bg-card text-card-foreground shadow-sm overflow-hidden"
                    initial="collapsed"
                    animate={sidebarExpanded ? "expanded" : "collapsed"}
                    variants={sidebarVariants}
                    style={{ zIndex: isCampaignsPage ? 20 : 30 }}
                >
                    <div className="flex h-16 shrink-0 items-center justify-center py-6 border-b border-border/20">
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
                            <div className="mt-4 flex justify-center">
                                <Button
                                    onClick={handleToggleSidebar}
                                    variant="ghost"
                                    size="icon"
                                    className={`rounded-full text-muted-foreground hover:text-foreground ${sidebarExpanded ? 'rotate-180' : ''} transition-all duration-200`}
                                >
                                    <ChevronRight size={18} />
                                </Button>
                            </div>
                        </div>
                    </ScrollArea>

                    {/* Bottom Section */}
                    <div className="border-t border-border/20 pt-2 pb-3 px-3">
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
                                <Avatar className="h-8 w-8 border border-border/50">
                                    <AvatarFallback className="bg-primary/80 text-white">
                                        {user.name.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                {sidebarExpanded && (
                                    <div className="flex flex-col">
                                        <p className="text-sm font-medium truncate max-w-[120px]">{user.name}</p>
                                        <p className="text-xs text-muted-foreground truncate max-w-[120px]">{user.email}</p>
                                    </div>
                                )}
                            </div>

                            {sidebarExpanded ? (
                                <Button variant="ghost" size="icon" asChild className="rounded-full">
                                    <Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                        className="text-muted-foreground hover:text-destructive transition-colors"
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
                                                className="p-2 rounded-lg hover:bg-accent/50 text-muted-foreground hover:text-destructive transition-colors"
                                            >
                                                <LogOut size={16} />
                                            </Link>
                                        </TooltipTrigger>
                                        <TooltipContent side="right">
                                            {t('navigation.logout')}
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Main Content */}
                <div className={`${sidebarExpanded ? 'lg:ml-[220px]' : 'lg:ml-[72px]'} transition-all duration-300`}>
                    {/* Header - Hidden on campaigns page */}
                    {!isCampaignsPage && (
                        <div className={`sticky top-0 z-20 flex h-16 items-center border-b border-border/50 bg-background/95 backdrop-blur-md ${isScrolled ? 'shadow-sm' : ''} transition-all duration-200`}>
                            <button
                                type="button"
                                className="px-4 text-muted-foreground hover:text-foreground focus:outline-none lg:hidden"
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
                        </div>
                    )}

                    {/* Main Content */}
                    <main className={`${fullWidth ? 'px-0' : 'px-4 sm:px-6 lg:px-8'} py-4 ${!isCampaignsPage ? 'pt-6' : ''}`}>
                        {children}
                    </main>
                </div>
            </div>
        </ThemeProvider>
    );
}
