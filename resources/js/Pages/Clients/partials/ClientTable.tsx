import React from 'react';
import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Checkbox } from '@/Components/ui/checkbox';
import { Badge } from '@/Components/ui/badge';
import { Avatar, AvatarFallback } from '@/Components/ui/avatar';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/Components/ui/table';
import {
    Phone, Mail, Calendar, Clock, Eye, Edit, Trash2, Users2, PlusCircle
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

interface ClientTableProps {
    clients: {
        data: Client[];
        links: any[];
        total: number;
    };
    selectedClients: number[];
    onToggleAll: (checked: boolean) => void;
    onToggleClient: (clientId: number) => void;
    onSortChange: (field: string) => void;
    sortBy: string;
    sortDirection: 'asc' | 'desc';
    onDeleteClient: (clientId: number) => void;
}

export default function ClientTable({
    clients,
    selectedClients,
    onToggleAll,
    onToggleClient,
    onSortChange,
    sortBy,
    sortDirection,
    onDeleteClient
}: ClientTableProps) {
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

    return (
        <Card className="overflow-hidden border-border/60 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/90">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-gray-50/80 dark:bg-slate-700/80">
                        <TableRow>
                            <TableHead className="w-10 px-6">
                                <Checkbox
                                    checked={clients.data.length > 0 && selectedClients.length === clients.data.length}
                                    onCheckedChange={onToggleAll}
                                    className="border-border/80 dark:border-slate-600"
                                />
                            </TableHead>
                            <TableHead
                                className="px-6 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
                                onClick={() => onSortChange('name')}
                            >
                                <div className="flex items-center">
                                    {t('common.name')}
                                    {sortBy === 'name' && (
                                        <span className="ml-1 text-indigo-600 dark:text-indigo-400">
                                            {sortDirection === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </div>
                            </TableHead>
                            <TableHead className="px-6">{t('common.phone')}</TableHead>
                            <TableHead className="px-6">{t('common.email')}</TableHead>
                            <TableHead className="px-6">{t('common.tags')}</TableHead>
                            <TableHead
                                className="px-6 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
                                onClick={() => onSortChange('birthday')}
                            >
                                <div className="flex items-center">
                                    {t('common.birthday')}
                                    {sortBy === 'birthday' && (
                                        <span className="ml-1 text-indigo-600 dark:text-indigo-400">
                                            {sortDirection === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </div>
                            </TableHead>
                            <TableHead
                                className="px-6 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
                                onClick={() => onSortChange('last_contact')}
                            >
                                <div className="flex items-center">
                                    {t('common.lastContact')}
                                    {sortBy === 'last_contact' && (
                                        <span className="ml-1 text-indigo-600 dark:text-indigo-400">
                                            {sortDirection === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </div>
                            </TableHead>
                            <TableHead className="px-6 text-right">{t('common.actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clients.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-96 text-center">
                                    <div className="flex flex-col items-center">
                                        <Users2 className="h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">{t('clients.noClients')}</h3>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('clients.noClientsDescription')}</p>
                                        <div className="mt-6">
                                            <Link
                                                href={route('clients.create')}
                                                className="inline-flex items-center rounded-md border border-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                            >
                                                <PlusCircle className="mr-2 h-4 w-4" />
                                                {t('common.addClient')}
                                            </Link>
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            clients.data.map((client) => (
                                <TableRow key={client.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/70 dark:border-slate-700/60">
                                    <TableCell className="px-6">
                                        <Checkbox
                                            checked={selectedClients.includes(client.id)}
                                            onCheckedChange={() => onToggleClient(client.id)}
                                            className="border-border/80 dark:border-slate-600"
                                        />
                                    </TableCell>
                                    <TableCell className="px-6">
                                        <Link
                                            href={route('clients.show', client.id)}
                                            className="flex items-center group"
                                        >
                                            <Avatar className={`${getAvatarColor(client.name)} text-white h-9 w-9 mr-3`}>
                                                <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200">
                                                {client.name}
                                            </span>
                                        </Link>
                                    </TableCell>
                                    <TableCell className="px-6">
                                        <div className="flex items-center text-gray-500 dark:text-gray-400">
                                            <Phone className="mr-2 h-4 w-4" />
                                            <span className="font-mono text-sm">
                                                {formatPhoneNumber(client.phone)}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6">
                                        {client.email ? (
                                            <a
                                                href={`mailto:${client.email}`}
                                                className="flex items-center text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
                                            >
                                                <Mail className="mr-2 h-4 w-4" />
                                                <span className="truncate max-w-[150px]">{client.email}</span>
                                            </a>
                                        ) : (
                                            <span className="text-gray-400 dark:text-gray-500">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="px-6">
                                        {client.tags && client.tags.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {client.tags.slice(0, 3).map(tag => (
                                                    <Badge
                                                        key={tag.id}
                                                        variant="secondary"
                                                        className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
                                                    >
                                                        {tag.name}
                                                    </Badge>
                                                ))}
                                                {client.tags.length > 3 && (
                                                    <Badge variant="outline" className="text-gray-600 dark:text-gray-300 border-border/60 dark:border-slate-700/60">
                                                        +{client.tags.length - 3}
                                                    </Badge>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 dark:text-gray-500">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="px-6">
                                        {client.birthday ? (
                                            <div className="flex items-center text-gray-500 dark:text-gray-400">
                                                <Calendar className="mr-2 h-4 w-4" />
                                                <span className="text-sm">{formatDate(client.birthday)}</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 dark:text-gray-500">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="px-6">
                                        {client.lastContact ? (
                                            <div className="flex items-center text-gray-500 dark:text-gray-400">
                                                <Clock className="mr-2 h-4 w-4" />
                                                <span className="text-sm">{formatDate(client.lastContact)}</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 dark:text-gray-500">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="px-6">
                                        <div className="flex space-x-1 justify-end">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:text-indigo-300 dark:hover:bg-indigo-900/30"
                                                asChild
                                            >
                                                <Link href={route('clients.show', client.id)}>
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:text-indigo-300 dark:hover:bg-indigo-900/30"
                                                asChild
                                            >
                                                <Link href={route('clients.edit', client.id)}>
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0 text-rose-600 hover:text-rose-800 hover:bg-rose-50 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-900/30"
                                                onClick={() => onDeleteClient(client.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {clients.links.length > 3 && (
                <div className="border-t border-border/60 px-4 py-3 dark:border-slate-700/60 sm:px-6">
                    <div className="flex items-center justify-between">
                        <div className="hidden sm:block">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                {t('pagination.showing')} <span className="font-medium">{clients.data.length}</span> {t('pagination.of')} <span className="font-medium">{clients.total}</span> {t('pagination.results')}
                            </p>
                        </div>
                        <div className="flex flex-1 justify-between sm:justify-end">
                            <div className="flex space-x-1">
                                {clients.links.map((link, i) => {
                                    // Skip the first and last links (Previous/Next buttons)
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
                </div>
            )}
        </Card>
    );
}