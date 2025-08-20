import React, { useState, useRef, useEffect } from 'react';
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
import { Textarea } from '@/Components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/Components/ui/select";
import { Badge } from '@/Components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Separator } from '@/Components/ui/separator';
import { Slider } from '@/Components/ui/slider';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, 
  DialogTitle, DialogTrigger
} from '@/Components/ui/dialog';
import {
  FileText, Palette, Type, Image as ImageIcon, Sparkles,
  Download, Save, Eye, Undo, Redo, Layers, Move,
  RotateCcw, Copy, Trash2, Plus, Grid3X3, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Template {
  id: string;
  name: string;
  category: string;
  preview_url: string;
  description: string;
  format: string;
}

interface FlyerCreateProps extends PageProps {
  templates: Template[];
  formats: any[];
  orientations: any[];
}

export default function FlyerCreate({ 
  auth, 
  templates = [],
  formats = [],
  orientations = []
}: FlyerCreateProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [canvasElements, setCanvasElements] = useState<any[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const { data, setData, post, processing, errors } = useForm({
    name: '',
    description: '',
    format: 'a4',
    orientation: 'portrait',
    template_name: '',
    design_data: {},
    content_data: {},
    ai_generation: {
      enabled: false,
      topic: '',
      tone: 'professional',
      requirements: ''
    }
  });

  const templateCategories = [
    { id: 'business', name: 'Business', icon: FileText },
    { id: 'event', name: 'Événements', icon: Calendar },
    { id: 'promotion', name: 'Promotions', icon: Tag },
    { id: 'restaurant', name: 'Restaurant', icon: Utensils },
    { id: 'beauty', name: 'Beauté', icon: Heart },
    { id: 'fitness', name: 'Fitness', icon: Activity }
  ];

  const formatOptions = [
    { id: 'a4', name: 'A4', dimensions: '210×297mm', ratio: '3:4' },
    { id: 'a5', name: 'A5', dimensions: '148×210mm', ratio: '2:3' },
    { id: 'square', name: 'Carré', dimensions: '1080×1080px', ratio: '1:1' },
    { id: 'story', name: 'Story', dimensions: '1080×1920px', ratio: '9:16' },
    { id: 'post', name: 'Post', dimensions: '1080×1080px', ratio: '1:1' }
  ];

  const colorPalettes = [
    { name: 'Moderne', colors: ['#1a1a1a', '#ffffff', '#3b82f6', '#10b981'] },
    { name: 'Chaleureux', colors: ['#92400e', '#fbbf24', '#f59e0b', '#fef3c7'] },
    { name: 'Professionnel', colors: ['#1e40af', '#3b82f6', '#dbeafe', '#f8fafc'] },
    { name: 'Créatif', colors: ['#7c3aed', '#a855f7', '#c084fc', '#f3e8ff'] },
    { name: 'Nature', colors: ['#166534', '#22c55e', '#86efac', '#f0fdf4'] }
  ];

  const elementTypes = [
    { type: 'text', name: 'Texte', icon: Type },
    { type: 'image', name: 'Image', icon: ImageIcon },
    { type: 'shape', name: 'Forme', icon: Layers },
    { type: 'logo', name: 'Logo', icon: FileText }
  ];

  // Initialiser le canvas
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Configuration canvas selon le format
      const format = formatOptions.find(f => f.id === data.format);
      if (format) {
        if (data.format === 'a4') {
          canvas.width = 595;
          canvas.height = 842;
        } else if (data.format === 'square') {
          canvas.width = 400;
          canvas.height = 400;
        } else if (data.format === 'story') {
          canvas.width = 300;
          canvas.height = 533;
        }
      }
      
      // Fond blanc
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [data.format]);

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setData('template_name', template.name);
    setData('format', template.format);
    setShowTemplateDialog(false);
  };

  const handleAIGeneration = async () => {
    setIsGeneratingAI(true);
    
    try {
      const response = await fetch('/marketing/flyers/generate-ai-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        },
        body: JSON.stringify(data.ai_generation)
      });

      const result = await response.json();
      
      if (result.success) {
        // Appliquer le contenu généré au flyer
        setData('content_data', result.content);
        
        // Ajouter les éléments au canvas
        const newElements = result.content.elements || [];
        setCanvasElements(newElements);
      }
    } catch (error) {
      console.error('Erreur génération IA:', error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const addElement = (type: string) => {
    const newElement = {
      id: `element_${Date.now()}`,
      type,
      x: 50,
      y: 50,
      width: type === 'text' ? 200 : 100,
      height: type === 'text' ? 40 : 100,
      content: type === 'text' ? 'Nouveau texte' : '',
      style: {
        fontSize: 16,
        fontFamily: 'Arial',
        color: '#000000',
        backgroundColor: 'transparent',
        borderRadius: 0,
        opacity: 1
      }
    };
    
    setCanvasElements([...canvasElements, newElement]);
    setSelectedElement(newElement.id);
  };

  const updateElement = (id: string, updates: any) => {
    setCanvasElements(elements => 
      elements.map(el => el.id === id ? { ...el, ...updates } : el)
    );
  };

  const deleteElement = (id: string) => {
    setCanvasElements(elements => elements.filter(el => el.id !== id));
    if (selectedElement === id) {
      setSelectedElement(null);
    }
  };

  const exportFlyer = async (format: 'png' | 'jpg' | 'pdf') => {
    if (!canvasRef.current) return;
    
    try {
      const canvas = canvasRef.current;
      const dataUrl = canvas.toDataURL(`image/${format === 'jpg' ? 'jpeg' : format}`);
      
      // Créer un lien de téléchargement
      const link = document.createElement('a');
      link.download = `${data.name || 'flyer'}.${format}`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Erreur export:', error);
    }
  };

  const handleSave = async () => {
    const flyerData = {
      ...data,
      design_data: {
        canvas_elements: canvasElements,
        canvas_size: {
          width: canvasRef.current?.width,
          height: canvasRef.current?.height
        }
      }
    };
    
    post('/marketing/flyers', {
      data: flyerData,
      onSuccess: () => {
        // Redirection ou notification
      }
    });
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title={t('marketing.flyers.create.title', 'Créer un Flyer')} />

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Header avec actions */}
        <div className="flex items-center justify-between mb-6 bg-white border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Créateur de Flyers</h1>
              <p className="text-gray-600">Créez des flyers professionnels avec l'IA</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Undo className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Redo className="w-4 h-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="outline" onClick={() => exportFlyer('png')}>
              <Eye className="w-4 h-4 mr-2" />
              Aperçu
            </Button>
            <Button variant="outline" onClick={handleSave} disabled={processing}>
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder
            </Button>
            <Button 
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              onClick={() => exportFlyer('png')}
            >
              <Download className="w-4 h-4 mr-2" />
              Télécharger
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
          
          {/* Sidebar gauche - Outils */}
          <div className="col-span-3 space-y-4 overflow-y-auto">
            
            {/* Configuration générale */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Nom du flyer</Label>
                  <Input
                    id="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="Mon super flyer"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label>Format</Label>
                  <Select value={data.format} onValueChange={(value) => setData('format', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {formatOptions.map((format) => (
                        <SelectItem key={format.id} value={format.id}>
                          <div>
                            <div className="font-medium">{format.name}</div>
                            <div className="text-xs text-gray-500">{format.dimensions}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Orientation</Label>
                  <Select value={data.orientation} onValueChange={(value) => setData('orientation', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">Portrait</SelectItem>
                      <SelectItem value="landscape">Paysage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Génération IA */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Génération IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="ai-topic">Sujet</Label>
                  <Input
                    id="ai-topic"
                    value={data.ai_generation.topic}
                    onChange={(e) => setData('ai_generation', { ...data.ai_generation, topic: e.target.value })}
                    placeholder="Promotion été, Nouveau produit..."
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label>Ton</Label>
                  <Select 
                    value={data.ai_generation.tone} 
                    onValueChange={(value) => setData('ai_generation', { ...data.ai_generation, tone: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professionnel</SelectItem>
                      <SelectItem value="friendly">Amical</SelectItem>
                      <SelectItem value="persuasive">Persuasif</SelectItem>
                      <SelectItem value="creative">Créatif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="ai-requirements">Exigences</Label>
                  <Textarea
                    id="ai-requirements"
                    value={data.ai_generation.requirements}
                    onChange={(e) => setData('ai_generation', { ...data.ai_generation, requirements: e.target.value })}
                    placeholder="Inclure logo, couleurs spécifiques..."
                    className="mt-1 min-h-[60px]"
                  />
                </div>

                <Button
                  onClick={handleAIGeneration}
                  disabled={!data.ai_generation.topic || isGeneratingAI}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {isGeneratingAI ? (
                    <>
                      <Zap className="w-4 h-4 mr-2 animate-pulse" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Générer avec l'IA
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Templates */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Grid3X3 className="w-4 h-4 mr-2" />
                      Choisir Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Choisir un Template</DialogTitle>
                      <DialogDescription>
                        Sélectionnez un template pour commencer votre design
                      </DialogDescription>
                    </DialogHeader>
                    
                    <Tabs defaultValue="all" className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="all">Tous</TabsTrigger>
                        <TabsTrigger value="business">Business</TabsTrigger>
                        <TabsTrigger value="event">Événements</TabsTrigger>
                        <TabsTrigger value="promotion">Promos</TabsTrigger>
                      </TabsList>
                      
                      {['all', 'business', 'event', 'promotion'].map((category) => (
                        <TabsContent key={category} value={category}>
                          <div className="grid grid-cols-3 gap-4">
                            {templates
                              .filter(t => category === 'all' || t.category === category)
                              .map((template) => (
                                <motion.div
                                  key={template.id}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  className="cursor-pointer"
                                  onClick={() => handleTemplateSelect(template)}
                                >
                                  <Card className="hover:shadow-lg transition-shadow">
                                    <div className="aspect-[3/4] bg-gray-100 rounded-t-lg flex items-center justify-center">
                                      <FileText className="w-12 h-12 text-gray-400" />
                                    </div>
                                    <CardContent className="p-3">
                                      <h3 className="font-semibold text-sm">{template.name}</h3>
                                      <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                                      <Badge variant="outline" className="mt-2 text-xs">
                                        {template.format.toUpperCase()}
                                      </Badge>
                                    </CardContent>
                                  </Card>
                                </motion.div>
                              ))}
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  </DialogContent>
                </Dialog>

                {selectedTemplate && (
                  <div className="mt-3 p-3 bg-purple-50 rounded-lg border">
                    <p className="text-sm font-medium text-purple-900">{selectedTemplate.name}</p>
                    <p className="text-xs text-purple-700">{selectedTemplate.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Éléments */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Éléments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {elementTypes.map((element) => (
                    <Button
                      key={element.type}
                      variant="outline"
                      className="h-auto p-3 flex flex-col items-center gap-2"
                      onClick={() => addElement(element.type)}
                    >
                      <element.icon className="w-5 h-5" />
                      <span className="text-xs">{element.name}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Couleurs */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Couleurs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {colorPalettes.map((palette, index) => (
                    <div key={index}>
                      <p className="text-sm font-medium mb-2">{palette.name}</p>
                      <div className="flex gap-1">
                        {palette.colors.map((color, colorIndex) => (
                          <div
                            key={colorIndex}
                            className="w-8 h-8 rounded border cursor-pointer hover:scale-110 transition-transform"
                            style={{ backgroundColor: color }}
                            onClick={() => {
                              if (selectedElement) {
                                const element = canvasElements.find(el => el.id === selectedElement);
                                if (element) {
                                  updateElement(selectedElement, {
                                    style: { ...element.style, color }
                                  });
                                }
                              }
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Canvas principal */}
          <div className="col-span-6 flex items-center justify-center bg-gray-50 rounded-lg border">
            <div className="relative">
              <canvas
                ref={canvasRef}
                className="border bg-white shadow-lg max-w-full max-h-full"
                style={{ 
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain'
                }}
              />
              
              {/* Overlay pour les éléments sélectionnables */}
              <div className="absolute inset-0">
                {canvasElements.map((element) => (
                  <div
                    key={element.id}
                    className={cn(
                      "absolute border-2 cursor-move",
                      selectedElement === element.id 
                        ? "border-purple-500 bg-purple-500/10" 
                        : "border-transparent hover:border-purple-300"
                    )}
                    style={{
                      left: element.x,
                      top: element.y,
                      width: element.width,
                      height: element.height
                    }}
                    onClick={() => setSelectedElement(element.id)}
                  >
                    {element.type === 'text' && (
                      <div 
                        className="w-full h-full flex items-center justify-center text-center"
                        style={{
                          fontSize: element.style.fontSize,
                          fontFamily: element.style.fontFamily,
                          color: element.style.color
                        }}
                      >
                        {element.content}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar droite - Propriétés */}
          <div className="col-span-3 space-y-4 overflow-y-auto">
            
            {selectedElement ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    Propriétés
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteElement(selectedElement)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    const element = canvasElements.find(el => el.id === selectedElement);
                    if (!element) return null;

                    return (
                      <>
                        {element.type === 'text' && (
                          <>
                            <div>
                              <Label htmlFor="text-content">Texte</Label>
                              <Textarea
                                id="text-content"
                                value={element.content}
                                onChange={(e) => updateElement(selectedElement, { content: e.target.value })}
                                className="mt-1"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="font-size">Taille: {element.style.fontSize}px</Label>
                              <Slider
                                value={[element.style.fontSize]}
                                onValueChange={([value]) => 
                                  updateElement(selectedElement, {
                                    style: { ...element.style, fontSize: value }
                                  })
                                }
                                min={8}
                                max={72}
                                step={1}
                                className="mt-2"
                              />
                            </div>
                            
                            <div>
                              <Label>Police</Label>
                              <Select 
                                value={element.style.fontFamily} 
                                onValueChange={(value) => 
                                  updateElement(selectedElement, {
                                    style: { ...element.style, fontFamily: value }
                                  })
                                }
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Arial">Arial</SelectItem>
                                  <SelectItem value="Georgia">Georgia</SelectItem>
                                  <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                                  <SelectItem value="Helvetica">Helvetica</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </>
                        )}
                        
                        <div>
                          <Label htmlFor="element-color">Couleur</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Input
                              id="element-color"
                              type="color"
                              value={element.style.color}
                              onChange={(e) => 
                                updateElement(selectedElement, {
                                  style: { ...element.style, color: e.target.value }
                                })
                              }
                              className="w-12 h-8"
                            />
                            <Input
                              value={element.style.color}
                              onChange={(e) => 
                                updateElement(selectedElement, {
                                  style: { ...element.style, color: e.target.value }
                                })
                              }
                              className="flex-1"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="element-x">X: {element.x}</Label>
                            <Input
                              id="element-x"
                              type="number"
                              value={element.x}
                              onChange={(e) => updateElement(selectedElement, { x: parseInt(e.target.value) })}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="element-y">Y: {element.y}</Label>
                            <Input
                              id="element-y"
                              type="number"
                              value={element.y}
                              onChange={(e) => updateElement(selectedElement, { y: parseInt(e.target.value) })}
                              className="mt-1"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="element-width">Largeur</Label>
                            <Input
                              id="element-width"
                              type="number"
                              value={element.width}
                              onChange={(e) => updateElement(selectedElement, { width: parseInt(e.target.value) })}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="element-height">Hauteur</Label>
                            <Input
                              id="element-height"
                              type="number"
                              value={element.height}
                              onChange={(e) => updateElement(selectedElement, { height: parseInt(e.target.value) })}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Move className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Aucun élément sélectionné
                  </h3>
                  <p className="text-gray-600">
                    Cliquez sur un élément du canvas pour modifier ses propriétés
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Calques */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  Calques
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {canvasElements.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Aucun élément
                    </p>
                  ) : (
                    canvasElements.map((element, index) => (
                      <div
                        key={element.id}
                        className={cn(
                          "flex items-center justify-between p-2 rounded border cursor-pointer",
                          selectedElement === element.id ? "bg-purple-50 border-purple-200" : "hover:bg-gray-50"
                        )}
                        onClick={() => setSelectedElement(element.id)}
                      >
                        <div className="flex items-center gap-2">
                          {React.createElement(
                            elementTypes.find(t => t.type === element.type)?.icon || Type,
                            { className: "w-4 h-4 text-gray-500" }
                          )}
                          <span className="text-sm">
                            {element.type === 'text' 
                              ? element.content.substring(0, 20) + (element.content.length > 20 ? '...' : '')
                              : `${element.type} ${index + 1}`
                            }
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-600 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteElement(element.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}