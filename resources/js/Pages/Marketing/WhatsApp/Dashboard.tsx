import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Badge } from '@/Components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Separator } from '@/Components/ui/separator';
import { Switch } from '@/Components/ui/switch';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, 
  DialogTitle, DialogTrigger, DialogFooter
} from '@/Components/ui/dialog';
import {
  Alert, AlertDescription, AlertTitle,
} from "@/Components/ui/alert";
import {
  Phone, MessageCircle, Users, Send, Settings, Shield,
  CheckCircle, AlertTriangle, QrCode, Link, Copy,
  BarChart3, TrendingUp, Clock, Zap, Bot, User
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface WhatsAppStats {
  total_messages: number;
  delivered_messages: number;
  read_messages: number;
  failed_messages: number;
  delivery_rate: number;
  read_rate: number;
  connected_clients: number;
  opt_out_clients: number;
}

interface WhatsAppClient {
  id: string;
  name: string;
  phone: string;
  status: 'active' | 'opted_out' | 'blocked';
  last_message_at: string;
  total_messages: number;
  ai_interactions: number;
}

interface WhatsAppDashboardProps extends PageProps {
  whatsapp_connected: boolean;
  whatsapp_config: any;
  stats: WhatsAppStats;
  recent_messages: any[];
  clients: WhatsAppClient[];
  auth_link?: string;
  qr_code?: string;
}

export default function WhatsAppDashboard({ 
  auth, 
  whatsapp_connected = false,
  whatsapp_config = {},
  stats,
  recent_messages = [],
  clients = [],
  auth_link,
  qr_code
}: WhatsAppDashboardProps) {
  const { t } = useTranslation();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authStep, setAuthStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState('');

  const { data, setData, post, processing, errors } = useForm({
    phone_number: '',
    verification_code: ''
  });

  const handleWhatsAppAuth = async () => {
    if (authStep === 1) {
      // Étape 1: Demander le code de vérification
      try {
        const response = await fetch('/marketing/whatsapp/request-auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
          },
          body: JSON.stringify({ phone_number: data.phone_number })
        });

        const result = await response.json();
        
        if (result.success) {
          setAuthStep(2);
        }
      } catch (error) {
        console.error('Erreur authentification:', error);
      }
    } else {
      // Étape 2: Vérifier le code
      try {
        const response = await fetch('/marketing/whatsapp/verify-auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
          },
          body: JSON.stringify({ 
            phone_number: data.phone_number,
            verification_code: data.verification_code 
          })
        });

        const result = await response.json();
        
        if (result.success) {
          setShowAuthDialog(false);
          window.location.reload();
        }
      } catch (error) {
        console.error('Erreur vérification:', error);
      }
    }
  };

  const copyAuthLink = () => {
    if (auth_link) {
      navigator.clipboard.writeText(auth_link);
      // TODO: Ajouter toast notification
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'opted_out': return 'text-yellow-600 bg-yellow-100';
      case 'blocked': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'opted_out': return 'Désabonné';
      case 'blocked': return 'Bloqué';
      default: return status;
    }
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title={t('marketing.whatsapp.dashboard.title', 'WhatsApp Business')} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">WhatsApp Business</h1>
              <p className="text-gray-600">Gérez vos communications WhatsApp et l'IA conversationnelle</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge 
              variant={whatsapp_connected ? 'default' : 'secondary'}
              className={whatsapp_connected ? 'bg-green-500' : ''}
            >
              <div className={cn(
                "w-2 h-2 rounded-full mr-2",
                whatsapp_connected ? 'bg-white animate-pulse' : 'bg-gray-400'
              )} />
              {whatsapp_connected ? 'Connecté' : 'Déconnecté'}
            </Badge>
            
            {!whatsapp_connected && (
              <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-green-500 hover:bg-green-600">
                    <Phone className="w-4 h-4 mr-2" />
                    Connecter WhatsApp
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-green-600" />
                      Authentification WhatsApp
                    </DialogTitle>
                    <DialogDescription>
                      Connectez votre compte WhatsApp pour permettre l'interaction avec l'IA
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    {authStep === 1 ? (
                      <>
                        <div>
                          <Label htmlFor="phone">Numéro de téléphone</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={data.phone_number}
                            onChange={(e) => setData('phone_number', e.target.value)}
                            placeholder="+33 6 12 34 56 78"
                            className="mt-1"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Entrez le numéro WhatsApp que vous souhaitez connecter
                          </p>
                        </div>
                        
                        {qr_code && (
                          <div className="text-center">
                            <div className="inline-block p-4 bg-white border rounded-lg">
                              <QrCode className="w-32 h-32 text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-600 mt-2">
                              Ou scannez ce QR code avec WhatsApp
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div>
                        <Label htmlFor="code">Code de vérification</Label>
                        <Input
                          id="code"
                          value={data.verification_code}
                          onChange={(e) => setData('verification_code', e.target.value)}
                          placeholder="123456"
                          className="mt-1 text-center text-lg font-mono"
                          maxLength={6}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Entrez le code reçu par WhatsApp sur {data.phone_number}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <DialogFooter>
                    {authStep === 2 && (
                      <Button 
                        variant="outline" 
                        onClick={() => setAuthStep(1)}
                      >
                        Retour
                      </Button>
                    )}
                    <Button 
                      onClick={handleWhatsAppAuth}
                      disabled={processing || (authStep === 1 && !data.phone_number) || (authStep === 2 && !data.verification_code)}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      {authStep === 1 ? 'Envoyer le code' : 'Vérifier'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Alerte si non connecté */}
        {!whatsapp_connected && (
          <Alert className="mb-6 border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">WhatsApp non connecté</AlertTitle>
            <AlertDescription className="text-yellow-700">
              Connectez votre compte WhatsApp pour permettre aux clients d'interagir avec l'IA via WhatsApp.
              L'authentification est simple et sécurisée.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats principales */}
        {whatsapp_connected && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Messages Envoyés</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.total_messages.toLocaleString()}</p>
                      <p className="text-sm text-green-600 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {stats.delivery_rate}% livrés
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Send className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Clients Connectés</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.connected_clients.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">{stats.opt_out_clients} désabonnés</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Taux de Lecture</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.read_rate}%</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" 
                          style={{ width: `${stats.read_rate}%` }}
                        />
                      </div>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Interactions IA</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {clients.reduce((sum, client) => sum + client.ai_interactions, 0).toLocaleString()}
                      </p>
                      <p className="text-sm text-purple-600 flex items-center">
                        <Bot className="w-3 h-3 mr-1" />
                        IA active
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Bot className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Clients WhatsApp */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  Clients WhatsApp
                </CardTitle>
                <CardDescription>
                  Gérez vos contacts WhatsApp et leurs interactions avec l'IA
                </CardDescription>
              </CardHeader>
              <CardContent>
                {whatsapp_connected ? (
                  <div className="space-y-4">
                    {clients.map((client, index) => (
                      <motion.div
                        key={client.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <User className="w-5 h-5 text-green-600" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900">{client.name}</h3>
                              <Badge 
                                variant="outline" 
                                className={cn("text-xs", getStatusColor(client.status))}
                              >
                                {getStatusText(client.status)}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{client.phone}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <MessageCircle className="w-3 h-3" />
                                {client.total_messages} messages
                              </span>
                              <span className="flex items-center gap-1">
                                <Bot className="w-3 h-3" />
                                {client.ai_interactions} interactions IA
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {client.last_message_at ? 
                                  `Dernier: ${new Date(client.last_message_at).toLocaleDateString('fr-FR')}` : 
                                  'Jamais contacté'
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                    
                    {clients.length === 0 && (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Aucun client WhatsApp
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Les clients qui interagissent avec vous via WhatsApp apparaîtront ici
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Phone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      WhatsApp non connecté
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Connectez votre compte WhatsApp pour voir vos clients
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Configuration et liens */}
          <div className="space-y-6">
            
            {/* Configuration IA */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-purple-600" />
                  IA Conversationnelle
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">IA Activée</p>
                    <p className="text-xs text-gray-500">Réponses automatiques intelligentes</p>
                  </div>
                  <Switch checked={whatsapp_connected} disabled={!whatsapp_connected} />
                </div>
                
                <Separator />
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Réponse automatique</span>
                    <Badge variant="outline" className="text-green-600">Actif</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Gestion commandes</span>
                    <Badge variant="outline" className="text-green-600">Actif</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Support client</span>
                    <Badge variant="outline" className="text-green-600">Actif</Badge>
                  </div>
                </div>
                
                <Button variant="outline" size="sm" className="w-full">
                  <Settings className="w-4 h-4 mr-2" />
                  Configurer l'IA
                </Button>
              </CardContent>
            </Card>

            {/* Lien d'authentification */}
            {auth_link && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link className="w-5 h-5 text-blue-600" />
                    Lien d'Authentification
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <p className="text-xs text-gray-600 mb-2">Lien pour vos clients:</p>
                      <p className="text-sm font-mono break-all">{auth_link}</p>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={copyAuthLink}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copier le Lien
                    </Button>
                    
                    <p className="text-xs text-gray-500">
                      Partagez ce lien pour que vos clients puissent s'authentifier 
                      et interagir avec votre IA via WhatsApp
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions rapides */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  Actions Rapides
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost" className="w-full justify-start">
                  <MessageCircle className="w-4 h-4 mr-3" />
                  Envoyer message groupé
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Bot className="w-4 h-4 mr-3" />
                  Tester l'IA
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <BarChart3 className="w-4 h-4 mr-3" />
                  Voir les analytics
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Settings className="w-4 h-4 mr-3" />
                  Paramètres avancés
                </Button>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}