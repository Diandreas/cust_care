import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Textarea } from '@/Components/ui/textarea';
import { Label } from '@/Components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/Components/ui/select";
import { Badge } from '@/Components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Separator } from '@/Components/ui/separator';
import {
  Sparkles, Instagram, Facebook, Twitter, Linkedin, 
  FileText, Megaphone, Target, Wand2, Copy, Download,
  RefreshCw, CheckCircle, AlertCircle, Lightbulb
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ContentGeneratorProps extends PageProps {
  content_templates?: any[];
  recent_generations?: any[];
}

export default function ContentGenerator({ 
  auth, 
  content_templates = [],
  recent_generations = []
}: ContentGeneratorProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('social');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);

  const { data, setData, post, processing, errors, reset } = useForm({
    type: 'social_post',
    topic: '',
    tone: 'friendly',
    platform: 'instagram',
    target_audience: '',
    requirements: '',
    keywords: '',
    length: 'medium'
  });

  const contentTypes = [
    {
      id: 'social',
      name: 'Posts Réseaux Sociaux',
      icon: Instagram,
      description: 'Créez des posts optimisés pour chaque plateforme',
      platforms: [
        { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-600' },
        { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-600' },
        { id: 'twitter', name: 'Twitter/X', icon: Twitter, color: 'text-slate-900' },
        { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'text-blue-700' }
      ]
    },
    {
      id: 'article',
      name: 'Articles de Blog',
      icon: FileText,
      description: 'Rédigez des articles SEO-friendly',
      platforms: []
    },
    {
      id: 'email',
      name: 'Emails Marketing',
      icon: Megaphone,
      description: 'Créez des emails persuasifs',
      platforms: []
    },
    {
      id: 'whatsapp',
      name: 'Messages WhatsApp',
      icon: MessageCircle,
      description: 'Messages personnalisés pour vos clients',
      platforms: []
    }
  ];

  const tones = [
    { id: 'professional', name: 'Professionnel', desc: 'Formel et expert' },
    { id: 'friendly', name: 'Amical', desc: 'Chaleureux et accessible' },
    { id: 'persuasive', name: 'Persuasif', desc: 'Convaincant et motivant' },
    { id: 'casual', name: 'Décontracté', desc: 'Informel et proche' },
    { id: 'enthusiastic', name: 'Enthousiaste', desc: 'Énergique et positif' }
  ];

  const lengths = [
    { id: 'short', name: 'Court', desc: '50-100 mots' },
    { id: 'medium', name: 'Moyen', desc: '100-200 mots' },
    { id: 'long', name: 'Long', desc: '200-400 mots' }
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      const response = await fetch('/marketing/ai/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        setGeneratedContent(result.content);
      } else {
        console.error('Erreur génération:', result.error);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // TODO: Ajouter toast notification
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title={t('marketing.ai.content_generator.title', 'Générateur de Contenu IA')} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Générateur de Contenu IA</h1>
              <p className="text-gray-600">Créez du contenu marketing optimisé en quelques clics</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Formulaire de génération */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-purple-600" />
                  Configuration du Contenu
                </CardTitle>
                <CardDescription>
                  Décrivez ce que vous souhaitez créer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    {contentTypes.map((type) => (
                      <TabsTrigger key={type.id} value={type.id} className="text-xs">
                        <type.icon className="w-4 h-4 mr-1" />
                        {type.name.split(' ')[0]}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {contentTypes.map((type) => (
                    <TabsContent key={type.id} value={type.id} className="space-y-6 mt-6">
                      
                      {/* Sélection plateforme pour réseaux sociaux */}
                      {type.id === 'social' && (
                        <div>
                          <Label className="text-sm font-medium mb-3 block">Plateforme</Label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {type.platforms.map((platform) => (
                              <Button
                                key={platform.id}
                                variant={data.platform === platform.id ? 'default' : 'outline'}
                                className="h-auto p-4 flex flex-col items-center gap-2"
                                onClick={() => setData('platform', platform.id)}
                              >
                                <platform.icon className={cn("w-5 h-5", platform.color)} />
                                <span className="text-xs">{platform.name}</span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Sujet principal */}
                      <div>
                        <Label htmlFor="topic" className="text-sm font-medium">
                          Sujet / Thème <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="topic"
                          value={data.topic}
                          onChange={(e) => setData('topic', e.target.value)}
                          placeholder="Ex: Promotion été 2024, Nouveau produit, Conseils beauté..."
                          className="mt-1"
                        />
                        {errors.topic && (
                          <p className="text-red-500 text-xs mt-1">{errors.topic}</p>
                        )}
                      </div>

                      {/* Ton et style */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Ton</Label>
                          <Select value={data.tone} onValueChange={(value) => setData('tone', value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {tones.map((tone) => (
                                <SelectItem key={tone.id} value={tone.id}>
                                  <div>
                                    <div className="font-medium">{tone.name}</div>
                                    <div className="text-xs text-gray-500">{tone.desc}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Longueur</Label>
                          <Select value={data.length} onValueChange={(value) => setData('length', value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {lengths.map((length) => (
                                <SelectItem key={length.id} value={length.id}>
                                  <div>
                                    <div className="font-medium">{length.name}</div>
                                    <div className="text-xs text-gray-500">{length.desc}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Public cible */}
                      <div>
                        <Label htmlFor="target_audience" className="text-sm font-medium">
                          Public Cible
                        </Label>
                        <Input
                          id="target_audience"
                          value={data.target_audience}
                          onChange={(e) => setData('target_audience', e.target.value)}
                          placeholder="Ex: Femmes 25-40 ans, Entrepreneurs, Jeunes parents..."
                          className="mt-1"
                        />
                      </div>

                      {/* Mots-clés */}
                      <div>
                        <Label htmlFor="keywords" className="text-sm font-medium">
                          Mots-clés (optionnel)
                        </Label>
                        <Input
                          id="keywords"
                          value={data.keywords}
                          onChange={(e) => setData('keywords', e.target.value)}
                          placeholder="Ex: beauté, naturel, bio, promotion..."
                          className="mt-1"
                        />
                      </div>

                      {/* Exigences spécifiques */}
                      <div>
                        <Label htmlFor="requirements" className="text-sm font-medium">
                          Exigences Spécifiques
                        </Label>
                        <Textarea
                          id="requirements"
                          value={data.requirements}
                          onChange={(e) => setData('requirements', e.target.value)}
                          placeholder="Ex: Inclure un call-to-action, mentionner une réduction, utiliser des emojis..."
                          className="mt-1 min-h-[80px]"
                        />
                      </div>

                      {/* Bouton de génération */}
                      <Button
                        onClick={handleGenerate}
                        disabled={!data.topic || isGenerating}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                        size="lg"
                      >
                        {isGenerating ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Génération en cours...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Générer le Contenu
                          </>
                        )}
                      </Button>

                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Résultats et historique */}
          <div className="space-y-6">
            
            {/* Contenu généré */}
            {generatedContent && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Contenu Généré
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <p className="text-sm leading-relaxed">{generatedContent.content}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyToClipboard(generatedContent.content)}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copier
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-3 h-3 mr-1" />
                      Exporter
                    </Button>
                  </div>

                  {generatedContent.hashtags && (
                    <div>
                      <Label className="text-xs font-medium text-gray-600">Hashtags suggérés</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {generatedContent.hashtags.map((tag: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Templates rapides */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-600" />
                  Templates Rapides
                </CardTitle>
                <CardDescription>
                  Utilisez ces modèles prêts à l'emploi
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { name: 'Promotion Flash', topic: 'Promotion limitée dans le temps' },
                  { name: 'Nouveau Produit', topic: 'Lancement nouveau produit' },
                  { name: 'Témoignage Client', topic: 'Partage témoignage client satisfait' },
                  { name: 'Conseil Expert', topic: 'Conseil professionnel dans mon domaine' },
                  { name: 'Événement', topic: 'Invitation à un événement' }
                ].map((template, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full justify-start h-auto p-3 text-left"
                    onClick={() => setData('topic', template.topic)}
                  >
                    <Target className="w-4 h-4 mr-3 text-purple-600 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-sm">{template.name}</div>
                      <div className="text-xs text-gray-500">{template.topic}</div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Historique récent */}
            {recent_generations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-blue-600" />
                    Générations Récentes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recent_generations.slice(0, 5).map((generation, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          {generation.type}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(generation.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {generation.topic}
                      </p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-2 h-6 text-xs"
                        onClick={() => setData('topic', generation.topic)}
                      >
                        Réutiliser
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}