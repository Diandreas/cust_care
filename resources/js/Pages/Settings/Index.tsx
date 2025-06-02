import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { toast } from 'sonner';

// Import shadcn components
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/Components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Switch } from '@/Components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Badge } from '@/Components/ui/badge';
import { Separator } from '@/Components/ui/separator';
import { Alert, AlertDescription } from '@/Components/ui/alert';

// Lucide icons
import {
    Settings,
    Phone,
    MessageSquare,
    Brain,
    CreditCard,
    Shield,
    Zap,
    Globe,
    Volume2,
    Mail,
    Smartphone,
    CheckCircle,
    AlertTriangle,
    Plus,
    Trash2,
    Eye,
    EyeOff
} from 'lucide-react';

interface SettingsProps {
    user: any;
    twilioConfig: {
        sms_enabled: boolean;
        whatsapp_enabled: boolean;
        voice_enabled: boolean;
        email_enabled: boolean;
        ai_enabled: boolean;
        account_sid?: string;
        phone_numbers: any[];
        available_numbers: any[];
    };
    subscription: {
        plan: string;
        features: string[];
        phone_numbers_included: number;
        phone_numbers_used: number;
        can_request_numbers: boolean;
    };
}

export default function SettingsIndex({ auth, user, twilioConfig, subscription }: PageProps<SettingsProps>) {
    const [activeTab, setActiveTab] = useState('general');
    const [showApiKeys, setShowApiKeys] = useState(false);

    // Formulaire pour les paramètres généraux
    const { data: generalData, setData: setGeneralData, post: postGeneral, processing: processingGeneral } = useForm({
        company_name: user.company_name || '',
        timezone: user.timezone || 'Europe/Paris',
        language: user.language || 'fr',
        notifications_enabled: user.notifications_enabled || true,
    });

    // Formulaire pour la configuration Twilio
    const { data: twilioData, setData: setTwilioData, post: postTwilio, processing: processingTwilio } = useForm({
        account_sid: twilioConfig.account_sid || '',
        auth_token: '',
        sms_enabled: twilioConfig.sms_enabled || false,
        whatsapp_enabled: twilioConfig.whatsapp_enabled || false,
        voice_enabled: twilioConfig.voice_enabled || false,
        email_enabled: twilioConfig.email_enabled || false,
    });

    // Formulaire pour l'IA
    const { data: aiData, setData: setAiData, post: postAi, processing: processingAi } = useForm({
        ai_enabled: twilioConfig.ai_enabled || false,
        auto_response: user.ai_settings?.auto_response || false,
        sentiment_analysis: user.ai_settings?.sentiment_analysis || true,
        smart_routing: user.ai_settings?.smart_routing || false,
        campaign_optimization: user.ai_settings?.campaign_optimization || true,
    });

    const handleGeneralSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        postGeneral(route('settings.general.update'), {
            onSuccess: () => toast.success('Paramètres généraux mis à jour'),
            onError: () => toast.error('Erreur lors de la mise à jour')
        });
    };

    const handleTwilioSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        postTwilio(route('settings.twilio.update'), {
            onSuccess: () => toast.success('Configuration Twilio mise à jour'),
            onError: () => toast.error('Erreur lors de la configuration Twilio')
        });
    };

    const handleAiSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        postAi(route('settings.ai.update'), {
            onSuccess: () => toast.success('Paramètres IA mis à jour'),
            onError: () => toast.error('Erreur lors de la mise à jour IA')
        });
    };

    const handlePurchaseNumber = (phoneNumber: string) => {
        // Logic to purchase phone number
        toast.success(`Numéro ${phoneNumber} acheté avec succès !`);
    };

    const handleRequestNumber = () => {
        // Logic to request additional phone number
        toast.info('Demande de numéro supplémentaire envoyée');
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center space-x-4">
                    <Settings className="h-8 w-8 text-gray-600 dark:text-gray-400" />
                    <div>
                        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                            Paramètres
                        </h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Gérez vos paramètres et configurations
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Paramètres" />

            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="general" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500/10 data-[state=active]:via-purple-500/10 data-[state=active]:to-pink-500/10">
                            <Settings className="h-4 w-4 mr-2" />
                            Général
                        </TabsTrigger>
                        <TabsTrigger value="twilio" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500/10 data-[state=active]:via-purple-500/10 data-[state=active]:to-pink-500/10">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Twilio
                        </TabsTrigger>
                        <TabsTrigger value="phone-numbers" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500/10 data-[state=active]:via-purple-500/10 data-[state=active]:to-pink-500/10">
                            <Phone className="h-4 w-4 mr-2" />
                            Numéros
                        </TabsTrigger>
                        <TabsTrigger value="ai" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500/10 data-[state=active]:via-purple-500/10 data-[state=active]:to-pink-500/10">
                            <Brain className="h-4 w-4 mr-2" />
                            IA
                        </TabsTrigger>
                        <TabsTrigger value="subscription" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500/10 data-[state=active]:via-purple-500/10 data-[state=active]:to-pink-500/10">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Abonnement
                        </TabsTrigger>
                    </TabsList>

                    {/* Onglet Général */}
                    <TabsContent value="general" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl">Paramètres généraux</CardTitle>
                                <CardDescription>
                                    Configurez les paramètres de base de votre compte
                                </CardDescription>
                            </CardHeader>
                            <form onSubmit={handleGeneralSubmit}>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="company_name">Nom de l'entreprise</Label>
                                            <Input
                                                id="company_name"
                                                value={generalData.company_name}
                                                onChange={(e) => setGeneralData('company_name', e.target.value)}
                                                placeholder="Votre entreprise"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="timezone">Fuseau horaire</Label>
                                            <Select value={generalData.timezone} onValueChange={(value) => setGeneralData('timezone', value)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                                                    <SelectItem value="Europe/London">Europe/London</SelectItem>
                                                    <SelectItem value="America/New_York">America/New_York</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="language">Langue</Label>
                                            <Select value={generalData.language} onValueChange={(value) => setGeneralData('language', value)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="fr">Français</SelectItem>
                                                    <SelectItem value="en">English</SelectItem>
                                                    <SelectItem value="es">Español</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id="notifications"
                                                checked={generalData.notifications_enabled}
                                                onCheckedChange={(checked) => setGeneralData('notifications_enabled', checked)}
                                            />
                                            <Label htmlFor="notifications">Notifications activées</Label>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button
                                        type="submit"
                                        disabled={processingGeneral}
                                        className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white"
                                    >
                                        {processingGeneral ? 'Enregistrement...' : 'Enregistrer'}
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </TabsContent>

                    {/* Onglet Twilio */}
                    <TabsContent value="twilio" className="mt-6">
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl">Configuration Twilio</CardTitle>
                                    <CardDescription>
                                        Configurez vos identifiants Twilio et activez les services
                                    </CardDescription>
                                </CardHeader>
                                <form onSubmit={handleTwilioSubmit}>
                                    <CardContent className="space-y-6">
                                        <Alert>
                                            <Shield className="h-4 w-4" />
                                            <AlertDescription>
                                                Vos identifiants Twilio sont stockés de manière sécurisée et chiffrée.
                                            </AlertDescription>
                                        </Alert>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="account_sid">Account SID</Label>
                                                <div className="relative">
                                                    <Input
                                                        id="account_sid"
                                                        type={showApiKeys ? "text" : "password"}
                                                        value={twilioData.account_sid}
                                                        onChange={(e) => setTwilioData('account_sid', e.target.value)}
                                                        placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                                                        onClick={() => setShowApiKeys(!showApiKeys)}
                                                    >
                                                        {showApiKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="auth_token">Auth Token</Label>
                                                <Input
                                                    id="auth_token"
                                                    type={showApiKeys ? "text" : "password"}
                                                    value={twilioData.auth_token}
                                                    onChange={(e) => setTwilioData('auth_token', e.target.value)}
                                                    placeholder="••••••••••••••••••••••••••••••••"
                                                />
                                            </div>
                                        </div>

                                        <Separator />

                                        <div className="space-y-4">
                                            <h3 className="text-lg font-medium">Services disponibles</h3>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                                    <div className="flex items-center space-x-3">
                                                        <MessageSquare className="h-5 w-5 text-blue-500" />
                                                        <div>
                                                            <div className="font-medium">SMS</div>
                                                            <div className="text-sm text-gray-500">Envoyer des SMS</div>
                                                        </div>
                                                    </div>
                                                    <Switch
                                                        checked={twilioData.sms_enabled}
                                                        onCheckedChange={(checked) => setTwilioData('sms_enabled', checked)}
                                                    />
                                                </div>

                                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                                    <div className="flex items-center space-x-3">
                                                        <Smartphone className="h-5 w-5 text-green-500" />
                                                        <div>
                                                            <div className="font-medium">WhatsApp</div>
                                                            <div className="text-sm text-gray-500">Messages WhatsApp</div>
                                                        </div>
                                                    </div>
                                                    <Switch
                                                        checked={twilioData.whatsapp_enabled}
                                                        onCheckedChange={(checked) => setTwilioData('whatsapp_enabled', checked)}
                                                    />
                                                </div>

                                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                                    <div className="flex items-center space-x-3">
                                                        <Volume2 className="h-5 w-5 text-purple-500" />
                                                        <div>
                                                            <div className="font-medium">Appels vocaux</div>
                                                            <div className="text-sm text-gray-500">Appels téléphoniques</div>
                                                        </div>
                                                    </div>
                                                    <Switch
                                                        checked={twilioData.voice_enabled}
                                                        onCheckedChange={(checked) => setTwilioData('voice_enabled', checked)}
                                                    />
                                                </div>

                                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                                    <div className="flex items-center space-x-3">
                                                        <Mail className="h-5 w-5 text-red-500" />
                                                        <div>
                                                            <div className="font-medium">Email</div>
                                                            <div className="text-sm text-gray-500">Emails via SendGrid</div>
                                                        </div>
                                                    </div>
                                                    <Switch
                                                        checked={twilioData.email_enabled}
                                                        onCheckedChange={(checked) => setTwilioData('email_enabled', checked)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button
                                            type="submit"
                                            disabled={processingTwilio}
                                            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white"
                                        >
                                            {processingTwilio ? 'Enregistrement...' : 'Enregistrer la configuration'}
                                        </Button>
                                    </CardFooter>
                                </form>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Onglet Numéros de téléphone */}
                    <TabsContent value="phone-numbers" className="mt-6">
                        <div className="space-y-6">
                            {/* Informations sur l'abonnement */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl">Vos numéros de téléphone</CardTitle>
                                    <CardDescription>
                                        Gérez vos numéros de téléphone selon votre plan d'abonnement
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <div className="text-sm text-gray-500">Plan actuel</div>
                                            <div className="font-medium text-lg">
                                                {subscription.plan === 'basic' && 'Pack de base'}
                                                {subscription.plan === 'pro' && 'Pack Pro'}
                                                {subscription.plan === 'premium' && 'Pack Premium'}
                                            </div>
                                        </div>
                                        <Badge variant="outline">
                                            {subscription.phone_numbers_used} / {subscription.phone_numbers_included} numéros utilisés
                                        </Badge>
                                    </div>

                                    {subscription.plan === 'basic' && (
                                        <Alert>
                                            <AlertTriangle className="h-4 w-4" />
                                            <AlertDescription>
                                                Avec le pack de base, vous utilisez notre numéro collectif partagé.
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {/* Numéros actuels */}
                                    {twilioConfig.phone_numbers.length > 0 && (
                                        <div className="space-y-4">
                                            <h3 className="font-medium">Vos numéros actifs</h3>
                                            <div className="grid gap-4">
                                                {twilioConfig.phone_numbers.map((number: any, index: number) => (
                                                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                                                        <div className="flex items-center space-x-3">
                                                            <Phone className="h-5 w-5 text-blue-500" />
                                                            <div>
                                                                <div className="font-medium">{number.phone_number}</div>
                                                                <div className="text-sm text-gray-500">
                                                                    {number.type === 'shared' ? 'Numéro partagé' : 'Numéro dédié'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <Badge variant={number.type === 'shared' ? 'secondary' : 'default'}>
                                                                {number.monthly_cost}€/mois
                                                            </Badge>
                                                            {number.type !== 'shared' && (
                                                                <Button variant="outline" size="sm">
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Numéros disponibles à l'achat */}
                                    {subscription.plan !== 'basic' && twilioConfig.available_numbers.length > 0 && (
                                        <div className="space-y-4">
                                            <h3 className="font-medium">Numéros disponibles</h3>
                                            <div className="grid gap-4">
                                                {twilioConfig.available_numbers.slice(0, 5).map((number: any, index: number) => (
                                                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                                                        <div className="flex items-center space-x-3">
                                                            <Phone className="h-5 w-5 text-green-500" />
                                                            <div>
                                                                <div className="font-medium">{number.phone_number}</div>
                                                                <div className="text-sm text-gray-500">{number.friendly_name}</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <Badge variant="outline">
                                                                {number.monthly_cost}€/mois
                                                            </Badge>
                                                            <Button
                                                                onClick={() => handlePurchaseNumber(number.phone_number)}
                                                                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                                                            >
                                                                <Plus className="h-4 w-4 mr-2" />
                                                                Acheter
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Demande de numéros supplémentaires */}
                                    {subscription.can_request_numbers && (
                                        <div className="pt-6">
                                            <Button
                                                onClick={handleRequestNumber}
                                                variant="outline"
                                                className="w-full"
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Demander un numéro supplémentaire
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Onglet IA */}
                    <TabsContent value="ai" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl">Intelligence Artificielle</CardTitle>
                                <CardDescription>
                                    Configurez les fonctionnalités d'IA pour automatiser vos campagnes
                                </CardDescription>
                            </CardHeader>
                            <form onSubmit={handleAiSubmit}>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <Brain className="h-5 w-5 text-blue-500" />
                                            <div>
                                                <div className="font-medium">IA activée</div>
                                                <div className="text-sm text-gray-500">Activer toutes les fonctionnalités IA</div>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={aiData.ai_enabled}
                                            onCheckedChange={(checked) => setAiData('ai_enabled', checked)}
                                        />
                                    </div>

                                    {aiData.ai_enabled && (
                                        <div className="space-y-4 pl-6">
                                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                                <div>
                                                    <div className="font-medium">Réponses automatiques</div>
                                                    <div className="text-sm text-gray-500">Répondre automatiquement aux messages entrants</div>
                                                </div>
                                                <Switch
                                                    checked={aiData.auto_response}
                                                    onCheckedChange={(checked) => setAiData('auto_response', checked)}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                                <div>
                                                    <div className="font-medium">Analyse de sentiment</div>
                                                    <div className="text-sm text-gray-500">Analyser le sentiment des messages reçus</div>
                                                </div>
                                                <Switch
                                                    checked={aiData.sentiment_analysis}
                                                    onCheckedChange={(checked) => setAiData('sentiment_analysis', checked)}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                                <div>
                                                    <div className="font-medium">Routage intelligent</div>
                                                    <div className="text-sm text-gray-500">Rediriger automatiquement vers les bons conseillers</div>
                                                </div>
                                                <Switch
                                                    checked={aiData.smart_routing}
                                                    onCheckedChange={(checked) => setAiData('smart_routing', checked)}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                                <div>
                                                    <div className="font-medium">Optimisation des campagnes</div>
                                                    <div className="text-sm text-gray-500">Optimiser automatiquement le timing et le contenu</div>
                                                </div>
                                                <Switch
                                                    checked={aiData.campaign_optimization}
                                                    onCheckedChange={(checked) => setAiData('campaign_optimization', checked)}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter>
                                    <Button
                                        type="submit"
                                        disabled={processingAi}
                                        className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white"
                                    >
                                        {processingAi ? 'Enregistrement...' : 'Enregistrer les paramètres IA'}
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </TabsContent>

                    {/* Onglet Abonnement */}
                    <TabsContent value="subscription" className="mt-6">
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl">Votre abonnement</CardTitle>
                                    <CardDescription>
                                        Gérez votre plan et vos options d'abonnement
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Pack de base */}
                                        <Card className={`relative ${subscription.plan === 'basic' ? 'ring-2 ring-blue-500' : ''}`}>
                                            <CardHeader>
                                                <CardTitle className="text-lg">Pack de base</CardTitle>
                                                <div className="text-2xl font-bold">29€<span className="text-sm font-normal">/mois</span></div>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <div className="flex items-center">
                                                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                                    <span className="text-sm">Numéro collectif partagé</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                                    <span className="text-sm">1000 SMS/mois</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                                    <span className="text-sm">Support standard</span>
                                                </div>
                                            </CardContent>
                                            {subscription.plan === 'basic' && (
                                                <div className="absolute top-4 right-4">
                                                    <Badge>Actuel</Badge>
                                                </div>
                                            )}
                                        </Card>

                                        {/* Pack Pro */}
                                        <Card className={`relative ${subscription.plan === 'pro' ? 'ring-2 ring-purple-500' : ''}`}>
                                            <CardHeader>
                                                <CardTitle className="text-lg">Pack Pro</CardTitle>
                                                <div className="text-2xl font-bold">99€<span className="text-sm font-normal">/mois</span></div>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <div className="flex items-center">
                                                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                                    <span className="text-sm">1 numéro dédié inclus</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                                    <span className="text-sm">5000 SMS/mois</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                                    <span className="text-sm">IA avancée</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                                    <span className="text-sm">Support prioritaire</span>
                                                </div>
                                            </CardContent>
                                            {subscription.plan === 'pro' && (
                                                <div className="absolute top-4 right-4">
                                                    <Badge>Actuel</Badge>
                                                </div>
                                            )}
                                        </Card>

                                        {/* Pack Premium */}
                                        <Card className={`relative ${subscription.plan === 'premium' ? 'ring-2 ring-gold-500' : ''}`}>
                                            <CardHeader>
                                                <CardTitle className="text-lg">Pack Premium</CardTitle>
                                                <div className="text-2xl font-bold">299€<span className="text-sm font-normal">/mois</span></div>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <div className="flex items-center">
                                                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                                    <span className="text-sm">Numéros illimités sur demande</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                                    <span className="text-sm">SMS illimités</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                                    <span className="text-sm">IA complète + personnalisée</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                                    <span className="text-sm">Support 24/7 dédié</span>
                                                </div>
                                            </CardContent>
                                            {subscription.plan === 'premium' && (
                                                <div className="absolute top-4 right-4">
                                                    <Badge>Actuel</Badge>
                                                </div>
                                            )}
                                        </Card>
                                    </div>

                                    {subscription.plan !== 'premium' && (
                                        <div className="pt-6">
                                            <Button className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white">
                                                <Zap className="h-4 w-4 mr-2" />
                                                Mettre à niveau
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </AuthenticatedLayout>
    );
} 