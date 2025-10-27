import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
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
import { Switch } from '@/Components/ui/switch';
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/Components/ui/select';
import { Textarea } from '@/Components/ui/textarea';
import { Badge } from '@/Components/ui/badge';
import { Separator } from '@/Components/ui/separator';
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
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from '@/Components/ui/tabs';
import {
    Settings,
    Play,
    Pause,
    RotateCcw,
    Save,
    TestTube,
    Calendar,
    Users,
    MessageCircle,
    Zap,
    CheckCircle,
    XCircle,
    Clock,
    Database
} from 'lucide-react';
import { toast } from 'sonner';

interface AutomationRule {
    id?: number;
    name: string;
    type: 'birthday' | 'seasonal' | 'new-client' | 'inactive-client';
    is_active: boolean;
    conditions: object;
    actions: object;
    schedule?: string;
    last_executed?: string;
    next_execution?: string;
}

interface AutomationConfigProps {
    user: any;
    automation_rules: AutomationRule[];
    stats: {
        total_rules: number;
        active_rules: number;
        executed_today: number;
        last_execution: string;
    };
}

export default function AutomationConfig({ user, automation_rules = [], stats }: AutomationConfigProps) {
    const [activeTab, setActiveTab] = useState('rules');
    const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionLog, setExecutionLog] = useState<string[]>([]);

    // Configuration des types d'automatisations
    const automationTypes = {
        'birthday': {
            label: 'Anniversaires',
            description: 'Messages automatiques pour les anniversaires clients',
            icon: Calendar,
            color: 'bg-pink-100 text-pink-700'
        },
        'seasonal': {
            label: 'Saisonnières',
            description: 'Campagnes pour les fêtes et événements spéciaux',
            icon: Calendar,
            color: 'bg-green-100 text-green-700'
        },
        'new-client': {
            label: 'Nouveaux Clients',
            description: 'Séquence de bienvenue pour nouveaux clients',
            icon: Users,
            color: 'bg-blue-100 text-blue-700'
        },
        'inactive-client': {
            label: 'Clients Inactifs',
            description: 'Réactivation des clients inactifs',
            icon: MessageCircle,
            color: 'bg-orange-100 text-orange-700'
        }
    };

    const handleToggleRule = async (ruleId: number, isActive: boolean) => {
        try {
            await router.patch(`/marketing/automation/rules/${ruleId}`, {
                is_active: isActive
            });
            toast.success(`Règle ${isActive ? 'activée' : 'désactivée'} avec succès`);
        } catch (error) {
            toast.error('Erreur lors de la mise à jour de la règle');
        }
    };

    const handleExecuteAutomation = async (type: string = 'all') => {
        setIsExecuting(true);
        setExecutionLog([]);
        
        try {
            const response = await fetch('/marketing/automation/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({ type, dry_run: false })
            });

            const result = await response.json();
            
            if (response.ok) {
                setExecutionLog(result.logs || ['Exécution terminée avec succès']);
                toast.success(`Automatisation ${type} exécutée avec succès`);
            } else {
                toast.error(result.message || 'Erreur lors de l\'exécution');
            }
        } catch (error) {
            toast.error('Erreur de connexion');
        } finally {
            setIsExecuting(false);
        }
    };

    const handleTestAutomation = async (type: string) => {
        setIsExecuting(true);
        
        try {
            const response = await fetch('/marketing/automation/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({ type, dry_run: true })
            });

            const result = await response.json();
            
            if (response.ok) {
                setExecutionLog(result.logs || ['Test terminé avec succès']);
                toast.success(`Test ${type} terminé avec succès`);
            } else {
                toast.error(result.message || 'Erreur lors du test');
            }
        } catch (error) {
            toast.error('Erreur de connexion');
        } finally {
            setIsExecuting(false);
        }
    };

    return (
        <AuthenticatedLayout user={user}>
            <Head title="Configuration des Automatisations Marketing" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                                Configuration des Automatisations
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400 mt-2">
                                Gérez et configurez vos automatisations marketing
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                onClick={() => handleTestAutomation('all')}
                                variant="outline"
                                disabled={isExecuting}
                                className="gap-2"
                            >
                                <TestTube className="h-4 w-4" />
                                Test Global
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button 
                                        disabled={isExecuting}
                                        className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                                    >
                                        <Play className="h-4 w-4" />
                                        Exécuter Toutes
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Confirmer l'exécution</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Vous êtes sur le point d'exécuter toutes les automatisations actives. 
                                            Cette action enverra des messages réels aux clients. Continuer ?
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleExecuteAutomation('all')}>
                                            Exécuter
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Total Règles</p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                            {stats?.total_rules || 0}
                                        </p>
                                    </div>
                                    <Database className="h-8 w-8 text-blue-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Règles Actives</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {stats?.active_rules || 0}
                                        </p>
                                    </div>
                                    <CheckCircle className="h-8 w-8 text-green-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Exécutées Aujourd'hui</p>
                                        <p className="text-2xl font-bold text-purple-600">
                                            {stats?.executed_today || 0}
                                        </p>
                                    </div>
                                    <Zap className="h-8 w-8 text-purple-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Dernière Exécution</p>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                                            {stats?.last_execution || 'Jamais'}
                                        </p>
                                    </div>
                                    <Clock className="h-8 w-8 text-orange-500" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="rules" className="gap-2">
                                <Settings className="h-4 w-4" />
                                Règles d'Automatisation
                            </TabsTrigger>
                            <TabsTrigger value="execution" className="gap-2">
                                <Play className="h-4 w-4" />
                                Exécution Manuelle
                            </TabsTrigger>
                            <TabsTrigger value="logs" className="gap-2">
                                <MessageCircle className="h-4 w-4" />
                                Logs d'Exécution
                            </TabsTrigger>
                        </TabsList>

                        {/* Rules Tab */}
                        <TabsContent value="rules" className="space-y-6">
                            {Object.entries(automationTypes).map(([type, config]) => {
                                const rules = automation_rules.filter(rule => rule.type === type);
                                const Icon = config.icon;

                                return (
                                    <Card key={type}>
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${config.color}`}>
                                                        <Icon className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <CardTitle>{config.label}</CardTitle>
                                                        <CardDescription>{config.description}</CardDescription>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        onClick={() => handleTestAutomation(type)}
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={isExecuting}
                                                        className="gap-2"
                                                    >
                                                        <TestTube className="h-4 w-4" />
                                                        Test
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleExecuteAutomation(type)}
                                                        size="sm"
                                                        disabled={isExecuting}
                                                        className="gap-2"
                                                    >
                                                        <Play className="h-4 w-4" />
                                                        Exécuter
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            {rules.length > 0 ? (
                                                <div className="space-y-4">
                                                    {rules.map((rule) => (
                                                        <div key={rule.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                                            <div className="flex items-center gap-3">
                                                                <Switch
                                                                    checked={rule.is_active}
                                                                    onCheckedChange={(checked) => 
                                                                        rule.id && handleToggleRule(rule.id, checked)
                                                                    }
                                                                />
                                                                <div>
                                                                    <p className="font-medium text-slate-900 dark:text-white">
                                                                        {rule.name}
                                                                    </p>
                                                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                                                        Dernière exécution: {rule.last_executed || 'Jamais'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant={rule.is_active ? "default" : "secondary"}>
                                                                    {rule.is_active ? 'Active' : 'Inactive'}
                                                                </Badge>
                                                                <Button variant="ghost" size="sm">
                                                                    <Settings className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-slate-600 dark:text-slate-400 text-center py-8">
                                                    Aucune règle configurée pour ce type d'automatisation
                                                </p>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </TabsContent>

                        {/* Execution Tab */}
                        <TabsContent value="execution" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Exécution Manuelle des Automatisations</CardTitle>
                                    <CardDescription>
                                        Exécutez manuellement des automatisations spécifiques ou testez-les en mode simulation
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {Object.entries(automationTypes).map(([type, config]) => {
                                        const Icon = config.icon;
                                        
                                        return (
                                            <div key={type} className="flex items-center justify-between p-4 border rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${config.color}`}>
                                                        <Icon className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900 dark:text-white">
                                                            {config.label}
                                                        </p>
                                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                                            {config.description}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        onClick={() => handleTestAutomation(type)}
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={isExecuting}
                                                        className="gap-2"
                                                    >
                                                        <TestTube className="h-4 w-4" />
                                                        Test
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button 
                                                                size="sm"
                                                                disabled={isExecuting}
                                                                className="gap-2"
                                                            >
                                                                <Play className="h-4 w-4" />
                                                                Exécuter
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Confirmer l'exécution</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Vous êtes sur le point d'exécuter l'automatisation "{config.label}". 
                                                                    Cette action enverra des messages réels aux clients. Continuer ?
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleExecuteAutomation(type)}>
                                                                    Exécuter
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Logs Tab */}
                        <TabsContent value="logs" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Logs d'Exécution</CardTitle>
                                    <CardDescription>
                                        Historique des exécutions d'automatisations
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {executionLog.length > 0 ? (
                                        <div className="space-y-2">
                                            {executionLog.map((log, index) => (
                                                <div key={index} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                                    <p className="text-sm font-mono text-slate-700 dark:text-slate-300">
                                                        {log}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-slate-600 dark:text-slate-400 text-center py-8">
                                            Aucun log d'exécution disponible. Exécutez une automatisation pour voir les logs.
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}