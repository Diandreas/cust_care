import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { 
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Progress } from '@/Components/ui/progress';
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/Components/ui/select';
import { 
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from '@/Components/ui/alert-dialog';
import {
    Terminal,
    Play,
    Pause,
    Square,
    RefreshCw,
    Activity,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    Cpu,
    Database,
    TrendingUp,
    Calendar,
    Users,
    MessageCircle,
    Zap
} from 'lucide-react';
import { toast } from 'sonner';

interface CommandExecution {
    id: string;
    command: string;
    type: 'birthday' | 'seasonal' | 'new-client' | 'inactive-client' | 'all';
    status: 'running' | 'completed' | 'failed' | 'pending';
    progress: number;
    startedAt: string;
    completedAt?: string;
    output: string[];
    errorMessage?: string;
    results?: {
        total_processed: number;
        successful: number;
        failed: number;
        messages_sent: number;
    };
}

interface SystemStatus {
    cpu_usage: number;
    memory_usage: number;
    database_connections: number;
    queue_size: number;
    last_cron_run: string;
    marketing_service_status: 'online' | 'offline' | 'error';
    whatsapp_service_status: 'online' | 'offline' | 'error';
    ai_service_status: 'online' | 'offline' | 'error';
}

interface CommandDashboardProps {
    user: any;
    executions: CommandExecution[];
    system_status: SystemStatus;
}

export default function CommandDashboard({ user, executions = [], system_status }: CommandDashboardProps) {
    const [selectedExecution, setSelectedExecution] = useState<CommandExecution | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [refreshInterval, setRefreshInterval] = useState(5); // seconds

    const commandTypes = {
        'birthday': {
            label: 'Anniversaires',
            icon: Calendar,
            color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
            command: 'php artisan marketing:automation --type=birthday --verbose'
        },
        'seasonal': {
            label: 'Saisonnières',
            icon: Calendar,
            color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            command: 'php artisan marketing:automation --type=seasonal --verbose'
        },
        'new-client': {
            label: 'Nouveaux Clients',
            icon: Users,
            color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            command: 'php artisan marketing:automation --type=new-client --verbose'
        },
        'inactive-client': {
            label: 'Clients Inactifs',
            icon: MessageCircle,
            color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
            command: 'php artisan marketing:automation --type=inactive-client --verbose'
        },
        'all': {
            label: 'Toutes les Automatisations',
            icon: Zap,
            color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
            command: 'php artisan marketing:automation --type=all --verbose'
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'running':
                return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
            case 'completed':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'failed':
                return <XCircle className="h-4 w-4 text-red-500" />;
            case 'pending':
                return <Clock className="h-4 w-4 text-yellow-500" />;
            default:
                return <AlertTriangle className="h-4 w-4 text-gray-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'running':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'completed':
                return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'failed':
                return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            case 'pending':
                return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
        }
    };

    const getServiceStatusColor = (status: string) => {
        switch (status) {
            case 'online':
                return 'bg-green-100 text-green-700';
            case 'offline':
                return 'bg-gray-100 text-gray-700';
            case 'error':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const executeCommand = async (type: string) => {
        try {
            const response = await fetch('/marketing/automation/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({ type, verbose: true })
            });

            if (response.ok) {
                toast.success(`Commande ${type} lancée avec succès`);
                // Actualiser la page après un délai
                setTimeout(() => window.location.reload(), 1000);
            } else {
                toast.error('Erreur lors du lancement de la commande');
            }
        } catch (error) {
            toast.error('Erreur de connexion');
        }
    };

    const stopExecution = async (executionId: string) => {
        try {
            const response = await fetch(`/marketing/automation/stop/${executionId}`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                }
            });

            if (response.ok) {
                toast.success('Exécution arrêtée');
                setTimeout(() => window.location.reload(), 1000);
            } else {
                toast.error('Erreur lors de l\'arrêt');
            }
        } catch (error) {
            toast.error('Erreur de connexion');
        }
    };

    // Auto-refresh logic
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            window.location.reload();
        }, refreshInterval * 1000);

        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval]);

    const runningExecutions = executions.filter(e => e.status === 'running');
    const completedExecutions = executions.filter(e => e.status === 'completed');
    const failedExecutions = executions.filter(e => e.status === 'failed');

    return (
        <AuthenticatedLayout user={user}>
            <Head title="Monitoring des Commandes Marketing" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                                Monitoring des Commandes
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400 mt-2">
                                Surveillez et gérez l'exécution des automatisations marketing
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="auto-refresh">Auto-actualisation:</Label>
                                <Switch
                                    id="auto-refresh"
                                    checked={autoRefresh}
                                    onCheckedChange={setAutoRefresh}
                                />
                                {autoRefresh && (
                                    <Select value={refreshInterval.toString()} onValueChange={(value) => setRefreshInterval(parseInt(value))}>
                                        <SelectTrigger className="w-20">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="5">5s</SelectItem>
                                            <SelectItem value="10">10s</SelectItem>
                                            <SelectItem value="30">30s</SelectItem>
                                            <SelectItem value="60">1m</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                            <Button
                                onClick={() => window.location.reload()}
                                variant="outline"
                                className="gap-2"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Actualiser
                            </Button>
                        </div>
                    </div>

                    {/* System Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">CPU</p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                            {system_status?.cpu_usage || 0}%
                                        </p>
                                    </div>
                                    <Cpu className="h-8 w-8 text-blue-500" />
                                </div>
                                <Progress value={system_status?.cpu_usage || 0} className="mt-2" />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Mémoire</p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                            {system_status?.memory_usage || 0}%
                                        </p>
                                    </div>
                                    <Database className="h-8 w-8 text-green-500" />
                                </div>
                                <Progress value={system_status?.memory_usage || 0} className="mt-2" />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">File d'attente</p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                            {system_status?.queue_size || 0}
                                        </p>
                                    </div>
                                    <Activity className="h-8 w-8 text-orange-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">En cours</p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                            {runningExecutions.length}
                                        </p>
                                    </div>
                                    <TrendingUp className="h-8 w-8 text-purple-500" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Service Status */}
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle>État des Services</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                    <span className="font-medium">Service Marketing</span>
                                    <Badge className={getServiceStatusColor(system_status?.marketing_service_status || 'offline')}>
                                        {system_status?.marketing_service_status || 'offline'}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                    <span className="font-medium">WhatsApp Service</span>
                                    <Badge className={getServiceStatusColor(system_status?.whatsapp_service_status || 'offline')}>
                                        {system_status?.whatsapp_service_status || 'offline'}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                    <span className="font-medium">IA Service</span>
                                    <Badge className={getServiceStatusColor(system_status?.ai_service_status || 'offline')}>
                                        {system_status?.ai_service_status || 'offline'}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle>Actions Rapides</CardTitle>
                            <CardDescription>
                                Lancez des commandes d'automatisation marketing
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.entries(commandTypes).map(([type, config]) => {
                                    const Icon = config.icon;
                                    const isRunning = runningExecutions.some(e => e.type === type);

                                    return (
                                        <div key={type} className="p-4 border rounded-lg">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className={`p-2 rounded-lg ${config.color}`}>
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-white">
                                                        {config.label}
                                                    </p>
                                                    {isRunning && (
                                                        <Badge className="bg-blue-100 text-blue-700">
                                                            En cours...
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <code className="text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded block">
                                                    {config.command}
                                                </code>
                                                {isRunning ? (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="destructive" size="sm" className="w-full gap-2">
                                                                <Square className="h-4 w-4" />
                                                                Arrêter
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Arrêter l'exécution ?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Cette action arrêtera la commande en cours d'exécution.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => {
                                                                    const execution = runningExecutions.find(e => e.type === type);
                                                                    if (execution) stopExecution(execution.id);
                                                                }}>
                                                                    Arrêter
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                ) : (
                                                    <Button 
                                                        onClick={() => executeCommand(type)}
                                                        size="sm" 
                                                        className="w-full gap-2"
                                                    >
                                                        <Play className="h-4 w-4" />
                                                        Exécuter
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Executions History */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Historique des Exécutions</CardTitle>
                            <CardDescription>
                                Suivez l'état et les résultats des commandes exécutées
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {executions.length > 0 ? (
                                <div className="space-y-4">
                                    {executions.map((execution) => {
                                        const config = commandTypes[execution.type];
                                        const Icon = config?.icon || Terminal;

                                        return (
                                            <div 
                                                key={execution.id}
                                                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                                                onClick={() => setSelectedExecution(execution)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Icon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                                                    <div>
                                                        <p className="font-medium text-slate-900 dark:text-white">
                                                            {config?.label || execution.command}
                                                        </p>
                                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                                            Démarré: {execution.startedAt}
                                                            {execution.completedAt && ` • Terminé: ${execution.completedAt}`}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {execution.status === 'running' && (
                                                        <Progress value={execution.progress} className="w-24" />
                                                    )}
                                                    <div className="flex items-center gap-2">
                                                        {getStatusIcon(execution.status)}
                                                        <Badge className={getStatusColor(execution.status)}>
                                                            {execution.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-slate-600 dark:text-slate-400 text-center py-8">
                                    Aucune exécution trouvée. Lancez une commande pour voir l'historique.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}