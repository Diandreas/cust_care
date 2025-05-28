import React from 'react';
import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Checkbox } from '@/Components/ui/checkbox';
import { Badge } from '@/Components/ui/badge';
import { Avatar, AvatarFallback } from '@/Components/ui/avatar';
import { Separator } from '@/Components/ui/separator';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/Components/ui/dropdown-menu';
import {
    Phone, Mail, Calendar, Clock, Eye, Edit, MoreHorizontal, Users2, PlusCircle
} from 'lucide-react';

interface Client {
    id: number;
    name: string;
    phone: string;
    email: string | null;
    birthday: string | null;
    address: string | null;
    notes: string | null;
    lastContact: string | null;
    tags: Tag[];
    totalSmsCount: number;
    lastSmsDate: string | null;
}

interface Tag {
    id: number;
    name: string;
}

interface ClientGridProps {
    clients: {
        data: Client[];
        links: any[];
        total: number;
    };
    selectedClients: number[];
    onToggleClient: (clientId: number) => void;
    onDeleteClient: (clientId: number) => void;
}

export default function ClientGrid({
    clients,
    selectedClients,
    onToggleClient,
    onDeleteClient
}: ClientGridProps) {
    const { t } = useTranslation();

    // Helper functions
    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
    };

    const formatPhoneNumber = (phone: string) => {
        return phone?.replace(/(\d{3})(?=\d)/g, '$1 ');
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(part => part.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    const getAvatarColor = (name: string) => {
        const colors = [
            'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-violet-500',
            'bg-fuchsia-500', 'bg-rose-500', 'bg-blue-500', 'bg-cyan-500'
        ];
        const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
        return colors[index];
    };

    if (clients.data.length === 0) {
        return (
            <Card className="mt-6 px-6 py-12 text-center border-border/60 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/90">
                <div className="flex flex-col items-center">
                    <Users2 className="h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">{t('clients.noClients')}</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('clients.noClientsDescription')}</p>
                    <div className="mt-6">
                        <Link
                            href={route('clients.create')}
                            className="inline-flex items-center rounded-lg border border-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            {t('common.addClient')}
                        </Link>
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {clients.data.map((client) => (
                    <Card key={client.id} className="relative overflow-hidden border-border/60 transition-all hover:shadow-md dark:border-slate-700/60 dark:bg-slate-800/90 group hover:border-transparent hover:bg-gradient-to-r hover:from-indigo-500/5 hover:via-purple-500/5 hover:to-pink-500/5 dark:hover:from-indigo-900/30 dark:hover:via-purple-900/30 dark:hover:to-pink-900/30">
                        {/* Header with checkbox and actions */}
                        <div className="relative p-4">
                            <div className="absolute left-3 top-3 z-10">
                                <Checkbox
                                    checked={selectedClients.includes(client.id)}
                                    onCheckedChange={() => onToggleClient(client.id)}
                                    className="border-border/80 bg-white/90 dark:border-slate-600 dark:bg-slate-800/90"
                                />
                            </div>
                            <div className="absolute right-3 top-3 z-10">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 rounded-full p-0 bg-white/90 hover:bg-white dark:bg-slate-800/90 dark:hover:bg-slate-700/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="dark:bg-slate-800 dark:border-slate-700/60">
                                        <DropdownMenuItem className="dark:hover:bg-slate-700/90 dark:focus:bg-slate-700/90">
                                            <Link
                                                href={route('clients.edit', client.id)}
                                                className="w-full flex items-center"
                                            >
                                                <Edit className="mr-2 h-4 w-4" />
                                                {t('common.edit')}
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-rose-600 focus:text-rose-600 dark:text-rose-400 dark:focus:text-rose-400 dark:hover:bg-slate-700/90 dark:focus:bg-slate-700/90"
                                            onSelect={(e) => {
                                                e.preventDefault();
                                                onDeleteClient(client.id);
                                            }}
                                        >
                                            {t('common.delete')}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Avatar and client name */}
                            <div className="flex flex-col items-center pt-4">
                                <Avatar className={`${getAvatarColor(client.name)} mb-3 h-16 w-16 text-xl font-bold text-white shadow-md`}>
                                    <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
                                </Avatar>
                                <Link
                                    href={route('clients.show', client.id)}
                                    className="text-center text-lg font-medium text-gray-900 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 dark:text-white dark:hover:text-transparent transition-colors duration-200"
                                >
                                    {client.name}
                                </Link>

                                {/* Tags */}
                                {client.tags && client.tags.length > 0 && (
                                    <div className="mt-2 flex flex-wrap justify-center gap-1">
                                        {client.tags.slice(0, 2).map(tag => (
                                            <Badge
                                                key={tag.id}
                                                variant="secondary"
                                                className="bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 text-indigo-700 dark:from-indigo-500/30 dark:via-purple-500/30 dark:to-pink-500/30 dark:text-indigo-300 text-xs"
                                            >
                                                {tag.name}
                                            </Badge>
                                        ))}
                                        {client.tags.length > 2 && (
                                            <Badge variant="outline" className="text-gray-600 dark:text-gray-300 border-border/60 dark:border-slate-700/60 text-xs">
                                                +{client.tags.length - 2}
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Contact info */}
                        <Separator className="bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 dark:from-indigo-900/30 dark:via-purple-900/30 dark:to-pink-900/30 h-[2px]" />
                        <CardContent className="p-4">
                            <div className="space-y-2">
                                <div className="flex items-center text-gray-600 dark:text-gray-400">
                                    <Phone className="mr-2 h-3.5 w-3.5 text-gray-500 dark:text-gray-500 flex-shrink-0" />
                                    <span className="text-sm font-mono">
                                        {formatPhoneNumber(client.phone)}
                                    </span>
                                </div>

                                {client.email && (
                                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                                        <Mail className="mr-2 h-3.5 w-3.5 text-gray-500 dark:text-gray-500 flex-shrink-0" />
                                        <a
                                            href={`mailto:${client.email}`}
                                            className="text-sm truncate hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
                                        >
                                            {client.email}
                                        </a>
                                    </div>
                                )}

                                {client.birthday && (
                                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                                        <Calendar className="mr-2 h-3.5 w-3.5 text-gray-500 dark:text-gray-500 flex-shrink-0" />
                                        <span className="text-sm">{formatDate(client.birthday)}</span>
                                    </div>
                                )}

                                {client.lastContact && (
                                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                                        <Clock className="mr-2 h-3.5 w-3.5 text-gray-500 dark:text-gray-500 flex-shrink-0" />
                                        <span className="text-sm">{formatDate(client.lastContact)}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>

                        {/* Quick actions */}
                        <Separator className="dark:bg-slate-700/60" />
                        <div className="grid grid-cols-2 divide-x divide-border/60 dark:divide-slate-700/60">
                            <Link
                                href={route('clients.show', client.id)}
                                className="flex items-center justify-center py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-indigo-50 hover:text-indigo-700 dark:text-gray-400 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-300"
                            >
                                <Eye className="mr-1.5 h-3.5 w-3.5" />
                                {t('common.show')}
                            </Link>
                            <Link
                                href={route('clients.edit', client.id)}
                                className="flex items-center justify-center py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-indigo-50 hover:text-indigo-700 dark:text-gray-400 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-300"
                            >
                                <Edit className="mr-1.5 h-3.5 w-3.5" />
                                {t('common.edit')}
                            </Link>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Pagination */}
            {clients.links.length > 3 && (
                <div className="mt-6 flex items-center justify-between border-t border-border/60 px-4 py-3 dark:border-slate-700/60 sm:px-6">
                    <div className="hidden sm:block">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            {t('pagination.showing')} <span className="font-medium">{clients.data.length}</span> {t('pagination.of')} <span className="font-medium">{clients.total}</span> {t('pagination.results')}
                        </p>
                    </div>
                    <div className="flex flex-1 justify-between sm:justify-end">
                        <div className="flex space-x-1">
                            {clients.links.map((link, i) => {
                                // Skip non-page links
                                if (i === 0 || i === clients.links.length - 1 || !link.url) {
                                    return null;
                                }

                                return (
                                    <Link
                                        key={i}
                                        href={link.url}
                                        className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${link.active
                                            ? 'z-10 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-sm focus:z-20'
                                            : 'bg-white text-gray-500 hover:bg-gray-50 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700/90'
                                            } border border-border/60 dark:border-slate-700/60 rounded-md transition-colors duration-200`}
                                    >
                                        {link.label.replace('&laquo;', '←').replace('&raquo;', '→')}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}