import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { 
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Badge } from '@/Components/ui/badge';
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/Components/ui/select';
import { 
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/Components/ui/table';
import { Checkbox } from '@/Components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/Components/ui/dropdown-menu';
import {
    Users,
    Search,
    Filter,
    Plus,
    Download,
    Upload,
    MoreVertical,
    MessageCircle,
    Edit,
    Trash2,
    Eye,
    Send,
    UserCheck,
    UserX,
    Calendar
} from 'lucide-react';
import { toast } from 'sonner';

interface Client {
    id: number;
    name: string;
    email: string;
    phone: string;
    status: 'active' | 'inactive' | 'opted_out';
    tags: string[];
    birthday?: string;
    last_interaction?: string;
    total_messages: number;
    created_at: string;
    avatar?: string;
}

interface ClientsProps {
    user: any;
    clients: {
        data: Client[];
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
    };
    filters?: {
        search?: string;
        status?: string;
        tags?: string[];
    };
    stats: {
        total_clients: number;
        active_clients: number;
        inactive_clients: number;
        opted_out_clients: number;
    };
}

export default function ClientsIndex({ user, clients, filters = {}, stats }: ClientsProps) {
    const [selectedClients, setSelectedClients] = useState<number[]>([]);
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [showFilters, setShowFilters] = useState(false);

    const handleSearch = () => {
        router.get('/marketing/clients', {
            search: searchTerm,
            status: statusFilter,
        }, {
            preserveState: true,
            replace: true
        });
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedClients(clients.data.map(client => client.id));
        } else {
            setSelectedClients([]);
        }
    };

    const handleSelectClient = (clientId: number, checked: boolean) => {
        if (checked) {
            setSelectedClients(prev => [...prev, clientId]);
        } else {
            setSelectedClients(prev => prev.filter(id => id !== clientId));
        }
    };

    const handleBulkAction = async (action: string) => {
        if (selectedClients.length === 0) {
            toast.error('Veuillez sélectionner au moins un client');
            return;
        }

        try {
            const response = await fetch('/marketing/clients/bulk-action', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({
                    action,
                    client_ids: selectedClients
                })
            });

            if (response.ok) {
                toast.success(`Action "${action}" appliquée à ${selectedClients.length} client(s)`);
                setSelectedClients([]);
                router.reload();
            } else {
                toast.error('Erreur lors de l\'action en lot');
            }
        } catch (error) {
            toast.error('Erreur de connexion');
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            active: { label: 'Actif', color: 'bg-green-100 text-green-800' },
            inactive: { label: 'Inactif', color: 'bg-yellow-100 text-yellow-800' },
            opted_out: { label: 'Désabonné', color: 'bg-red-100 text-red-800' }
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
        return (
            <Badge className={config.color}>
                {config.label}
            </Badge>
        );
    };

    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(new Date(dateString));
    };

    return (
        <AuthenticatedLayout user={user}>
            <Head title="Clients Marketing" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                                Gestion des Clients
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400 mt-2">
                                Gérez vos contacts marketing et leurs interactions
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" className="gap-2">
                                <Upload className="h-4 w-4" />
                                Importer
                            </Button>
                            <Button variant="outline" className="gap-2">
                                <Download className="h-4 w-4" />
                                Exporter
                            </Button>
                            <Button className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                                <Plus className="h-4 w-4" />
                                Nouveau Client
                            </Button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Total Clients</p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                            {stats?.total_clients || 0}
                                        </p>
                                    </div>
                                    <Users className="h-8 w-8 text-blue-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Clients Actifs</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {stats?.active_clients || 0}
                                        </p>
                                    </div>
                                    <UserCheck className="h-8 w-8 text-green-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Clients Inactifs</p>
                                        <p className="text-2xl font-bold text-yellow-600">
                                            {stats?.inactive_clients || 0}
                                        </p>
                                    </div>
                                    <UserX className="h-8 w-8 text-yellow-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Désabonnés</p>
                                        <p className="text-2xl font-bold text-red-600">
                                            {stats?.opted_out_clients || 0}
                                        </p>
                                    </div>
                                    <UserX className="h-8 w-8 text-red-500" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters */}
                    <Card className="mb-8">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Filter className="h-5 w-5" />
                                    Filtres et Recherche
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowFilters(!showFilters)}
                                >
                                    {showFilters ? 'Masquer' : 'Afficher'} filtres
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className={showFilters ? '' : 'hidden'}>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <Label htmlFor="search">Recherche</Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                        <Input
                                            id="search"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Nom, email, téléphone..."
                                            className="pl-10"
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="status">Statut</Label>
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Tous les statuts" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">Tous</SelectItem>
                                            <SelectItem value="active">Actif</SelectItem>
                                            <SelectItem value="inactive">Inactif</SelectItem>
                                            <SelectItem value="opted_out">Désabonné</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>&nbsp;</Label>
                                    <Button onClick={handleSearch} className="w-full">
                                        Rechercher
                                    </Button>
                                </div>
                                <div>
                                    <Label>&nbsp;</Label>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSearchTerm('');
                                            setStatusFilter('');
                                            router.get('/marketing/clients');
                                        }}
                                        className="w-full"
                                    >
                                        Réinitialiser
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bulk Actions */}
                    {selectedClients.length > 0 && (
                        <Card className="mb-6">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-slate-600 dark:text-slate-400">
                                            {selectedClients.length} client(s) sélectionné(s)
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleBulkAction('send_message')}
                                            className="gap-2"
                                        >
                                            <Send className="h-4 w-4" />
                                            Envoyer Message
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleBulkAction('activate')}
                                            className="gap-2"
                                        >
                                            <UserCheck className="h-4 w-4" />
                                            Activer
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleBulkAction('deactivate')}
                                            className="gap-2"
                                        >
                                            <UserX className="h-4 w-4" />
                                            Désactiver
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Clients Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Liste des Clients</CardTitle>
                            <CardDescription>
                                {clients?.total || 0} client(s) trouvé(s)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">
                                            <Checkbox
                                                checked={selectedClients.length === clients?.data?.length && clients?.data?.length > 0}
                                                onCheckedChange={handleSelectAll}
                                            />
                                        </TableHead>
                                        <TableHead>Client</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>Statut</TableHead>
                                        <TableHead>Messages</TableHead>
                                        <TableHead>Dernière Interaction</TableHead>
                                        <TableHead>Inscription</TableHead>
                                        <TableHead className="w-12"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {clients?.data?.length > 0 ? (
                                        clients.data.map((client) => (
                                            <TableRow key={client.id}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedClients.includes(client.id)}
                                                        onCheckedChange={(checked) => 
                                                            handleSelectClient(client.id, checked as boolean)
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                                            {client.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-slate-900 dark:text-white">
                                                                {client.name}
                                                            </p>
                                                            {client.birthday && (
                                                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                                                    <Calendar className="h-3 w-3" />
                                                                    {formatDate(client.birthday)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        <p>{client.email}</p>
                                                        <p className="text-slate-500">{client.phone}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(client.status)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">
                                                        {client.total_messages}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                                                    {client.last_interaction ? formatDate(client.last_interaction) : 'Jamais'}
                                                </TableCell>
                                                <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                                                    {formatDate(client.created_at)}
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem className="gap-2">
                                                                <Eye className="h-4 w-4" />
                                                                Voir
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="gap-2">
                                                                <Edit className="h-4 w-4" />
                                                                Modifier
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="gap-2">
                                                                <MessageCircle className="h-4 w-4" />
                                                                Envoyer Message
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="gap-2 text-red-600">
                                                                <Trash2 className="h-4 w-4" />
                                                                Supprimer
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-8">
                                                <div className="flex flex-col items-center gap-4">
                                                    <Users className="h-12 w-12 text-slate-400" />
                                                    <div>
                                                        <p className="text-slate-600 dark:text-slate-400">Aucun client trouvé</p>
                                                        <p className="text-sm text-slate-500 dark:text-slate-500">
                                                            Créez votre premier client pour commencer
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            {clients && clients.last_page > 1 && (
                                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                                    <div className="text-sm text-slate-600 dark:text-slate-400">
                                        Affichage de {((clients.current_page - 1) * clients.per_page) + 1} à{' '}
                                        {Math.min(clients.current_page * clients.per_page, clients.total)} sur {clients.total} résultats
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Pagination controls would go here */}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={clients.current_page <= 1}
                                        >
                                            Précédent
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={clients.current_page >= clients.last_page}
                                        >
                                            Suivant
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}