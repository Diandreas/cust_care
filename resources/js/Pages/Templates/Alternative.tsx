import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/i18n';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Textarea } from '@/Components/ui/textarea';
import { Checkbox } from '@/Components/ui/checkbox';
import { Label } from '@/Components/ui/label';
import { Separator } from '@/Components/ui/separator';
import { Badge } from '@/Components/ui/badge';
import { ScrollArea } from '@/Components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash, Check, Globe, Copy, Search, Tag, Filter, SlidersHorizontal, Star, User } from 'lucide-react';

interface Template {
    id: number;
    name: string;
    content: string;
    is_global: boolean;
}

interface TemplatesIndexProps extends Record<string, unknown> {
    templates: Template[];
    isAdmin: boolean;
}

export default function TemplatesAlternative({
    auth,
    templates,
    isAdmin,
}: PageProps<TemplatesIndexProps>) {
    const { t } = useTranslation();
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [copied, setCopied] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState('all');

    // Form pour créer un nouveau modèle
    const { data: createData, setData: setCreateData, post, processing: createProcessing, errors: createErrors, reset: resetCreate } = useForm<{
        name: string;
        content: string;
        is_global: boolean;
    }>({
        name: '',
        content: '',
        is_global: false,
    });

    // Form pour éditer un modèle existant
    const { data: editData, setData: setEditData, patch, processing: editProcessing, errors: editErrors, reset: resetEdit } = useForm<{
        name: string;
        content: string;
        is_global: boolean;
    }>({
        name: '',
        content: '',
        is_global: false,
    });

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('templates.store'), {
            onSuccess: () => {
                resetCreate();
                setIsCreating(false);
            },
        });
    };

    const handleEditSubmit = (e: React.FormEvent, id: number) => {
        e.preventDefault();
        patch(route('templates.update', id), {
            onSuccess: () => {
                setEditingId(null);
                resetEdit();
            },
        });
    };

    const startEditing = (template: Template) => {
        setEditData({
            name: template.name,
            content: template.content,
            is_global: template.is_global,
        });
        setEditingId(template.id);
    };

    const cancelEditing = () => {
        setEditingId(null);
        resetEdit();
    };

    const copyToClipboard = (text: string, id: number) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    // Filtrage des templates en fonction du terme de recherche et de l'onglet actif
    const filteredTemplates = templates.filter(template => {
        const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            template.content.toLowerCase().includes(searchTerm.toLowerCase());

        if (activeTab === 'all') return matchesSearch;
        if (activeTab === 'global') return matchesSearch && template.is_global;
        if (activeTab === 'personal') return matchesSearch && !template.is_global;

        return matchesSearch;
    });

    // Fonction pour obtenir le nombre de templates dans chaque catégorie
    const getTemplateCount = (type: 'all' | 'global' | 'personal') => {
        if (type === 'all') return templates.length;
        if (type === 'global') return templates.filter(t => t.is_global).length;
        if (type === 'personal') return templates.filter(t => !t.is_global).length;
        return 0;
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">{t('common.templates')}</h2>}
        >
            <Head title={t('common.templates')} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* En-tête avec boutons d'action */}
                    <div className="mb-8 bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-md">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                            <div className="relative w-full sm:max-w-md">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder={t('templates.searchPlaceholder', 'Rechercher un modèle...')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 rounded-full border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                />
                            </div>
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Button
                                    onClick={() => setIsCreating(!isCreating)}
                                    className="gap-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                                >
                                    {isCreating ? t('templates.cancel') : (
                                        <>
                                            <Plus className="h-4 w-4" />
                                            {t('templates.create')}
                                        </>
                                    )}
                                </Button>
                            </motion.div>
                        </div>

                        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto bg-slate-100 dark:bg-slate-800 rounded-full p-1">
                                <TabsTrigger value="all" className="rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
                                    <span className="flex items-center gap-2">
                                        <Tag className="h-4 w-4" />
                                        <span className="hidden sm:inline">{t('templates.allTemplates')}</span>
                                        <Badge variant="outline" className="ml-1 bg-slate-100 dark:bg-slate-800">
                                            {getTemplateCount('all')}
                                        </Badge>
                                    </span>
                                </TabsTrigger>
                                <TabsTrigger value="global" className="rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
                                    <span className="flex items-center gap-2">
                                        <Globe className="h-4 w-4" />
                                        <span className="hidden sm:inline">{t('templates.globalTemplates')}</span>
                                        <Badge variant="outline" className="ml-1 bg-slate-100 dark:bg-slate-800">
                                            {getTemplateCount('global')}
                                        </Badge>
                                    </span>
                                </TabsTrigger>
                                <TabsTrigger value="personal" className="rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
                                    <span className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        <span className="hidden sm:inline">{t('templates.personalTemplates')}</span>
                                        <Badge variant="outline" className="ml-1 bg-slate-100 dark:bg-slate-800">
                                            {getTemplateCount('personal')}
                                        </Badge>
                                    </span>
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    {/* Formulaire de création de modèle */}
                    <AnimatePresence>
                        {isCreating && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className="mb-8"
                            >
                                <Card className="border-0 rounded-2xl shadow-xl overflow-hidden">
                                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500"></div>
                                    <CardHeader className="bg-white dark:bg-slate-900 pb-4">
                                        <CardTitle className="text-xl font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300">
                                                <Tag className="h-4 w-4" />
                                            </span>
                                            {t('templates.create')}
                                        </CardTitle>
                                        <CardDescription>{t('templates.createDescription', 'Créez un nouveau modèle de message que vous pourrez réutiliser')}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6 bg-white dark:bg-slate-900">
                                        <form onSubmit={handleCreateSubmit}>
                                            <div className="grid gap-6">
                                                <div className="space-y-2">
                                                    <Label htmlFor="name" className="font-medium text-slate-700 dark:text-slate-300">{t('templates.name')} *</Label>
                                                    <Input
                                                        id="name"
                                                        value={createData.name}
                                                        onChange={(e) => setCreateData('name', e.target.value)}
                                                        className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                                        required
                                                    />
                                                    {createErrors.name && <p className="text-sm text-destructive">{createErrors.name}</p>}
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="content" className="font-medium text-slate-700 dark:text-slate-300">{t('templates.content')} *</Label>
                                                    <Textarea
                                                        id="content"
                                                        rows={5}
                                                        value={createData.content}
                                                        onChange={(e) => setCreateData('content', e.target.value)}
                                                        className="rounded-xl resize-none border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                                        required
                                                    />
                                                    {createErrors.content && <p className="text-sm text-destructive">{createErrors.content}</p>}
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id="is_global"
                                                            checked={createData.is_global}
                                                            onCheckedChange={(checked) => setCreateData('is_global', checked === true)}
                                                            disabled={!isAdmin}
                                                            className="border-slate-300 dark:border-slate-600"
                                                        />
                                                        <Label htmlFor="is_global" className="font-medium text-slate-700 dark:text-slate-300">{t('templates.isGlobal')}</Label>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {isAdmin
                                                            ? t('templates.globalDescription')
                                                            : t('templates.globalDescriptionAdminOnly', 'Seul un administrateur peut rendre un modèle disponible pour tous les utilisateurs')}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-6 flex justify-end space-x-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setIsCreating(false)}
                                                    className="rounded-full"
                                                >
                                                    {t('common.cancel')}
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    disabled={createProcessing}
                                                    className="rounded-full bg-purple-600 hover:bg-purple-700 text-white"
                                                >
                                                    {t('common.save')}
                                                </Button>
                                            </div>
                                        </form>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* État vide ou résultats de recherche vides */}
                    {templates.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md p-12 text-center">
                            <div className="flex flex-col items-center justify-center">
                                <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-6 mb-4">
                                    <Tag className="h-12 w-12 text-purple-500 dark:text-purple-300" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">{t('templates.noTemplates')}</h3>
                                <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                                    {t('templates.noTemplatesDescription', 'Créez votre premier modèle en cliquant sur le bouton "Créer" ci-dessus')}
                                </p>
                                <Button
                                    onClick={() => setIsCreating(true)}
                                    className="gap-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white"
                                >
                                    <Plus className="h-4 w-4" />
                                    {t('templates.create')}
                                </Button>
                            </div>
                        </div>
                    ) : filteredTemplates.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md p-12 text-center">
                            <div className="flex flex-col items-center justify-center">
                                <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-6 mb-4">
                                    <Search className="h-12 w-12 text-slate-400 dark:text-slate-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
                                    {t('templates.noSearchResults', 'Aucun modèle ne correspond à votre recherche')}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                                    {t('templates.tryAnotherSearch', 'Essayez une autre recherche')}
                                </p>
                            </div>
                        </div>
                    ) : (
                        /* Liste des templates */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredTemplates.map((template) => (
                                <motion.div
                                    key={template.id}
                                    whileHover={{ y: -5 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                >
                                    {editingId === template.id ? (
                                        <Card className="border-0 rounded-2xl shadow-lg overflow-hidden">
                                            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
                                            <CardHeader className="bg-white dark:bg-slate-900 pb-3">
                                                <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                                                    {t('templates.editTemplate')}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-6 bg-white dark:bg-slate-900">
                                                <form onSubmit={(e) => handleEditSubmit(e, template.id)}>
                                                    <div className="grid gap-6">
                                                        <div className="space-y-2">
                                                            <Label htmlFor={`edit-name-${template.id}`} className="font-medium text-slate-700 dark:text-slate-300">{t('templates.name')} *</Label>
                                                            <Input
                                                                id={`edit-name-${template.id}`}
                                                                value={editData.name}
                                                                onChange={(e) => setEditData('name', e.target.value)}
                                                                className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                                                required
                                                            />
                                                            {editErrors.name && <p className="text-sm text-destructive">{editErrors.name}</p>}
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor={`edit-content-${template.id}`} className="font-medium text-slate-700 dark:text-slate-300">{t('templates.content')} *</Label>
                                                            <Textarea
                                                                id={`edit-content-${template.id}`}
                                                                rows={5}
                                                                value={editData.content}
                                                                onChange={(e) => setEditData('content', e.target.value)}
                                                                className="rounded-xl resize-none border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                                                required
                                                            />
                                                            {editErrors.content && <p className="text-sm text-destructive">{editErrors.content}</p>}
                                                        </div>

                                                        <div className="space-y-2">
                                                            <div className="flex items-center space-x-2">
                                                                <Checkbox
                                                                    id={`edit-is_global-${template.id}`}
                                                                    checked={editData.is_global}
                                                                    onCheckedChange={(checked) => setEditData('is_global', checked === true)}
                                                                    disabled={!isAdmin}
                                                                    className="border-slate-300 dark:border-slate-600"
                                                                />
                                                                <Label htmlFor={`edit-is_global-${template.id}`} className="font-medium text-slate-700 dark:text-slate-300">{t('templates.isGlobal')}</Label>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground">
                                                                {isAdmin
                                                                    ? t('templates.globalDescription')
                                                                    : t('templates.globalDescriptionAdminOnly', 'Seul un administrateur peut rendre un modèle disponible pour tous les utilisateurs')}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-6 flex justify-end space-x-2">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={cancelEditing}
                                                            className="rounded-full"
                                                        >
                                                            {t('common.cancel')}
                                                        </Button>
                                                        <Button
                                                            type="submit"
                                                            disabled={editProcessing}
                                                            className="rounded-full bg-amber-500 hover:bg-amber-600 text-white"
                                                        >
                                                            {t('common.save')}
                                                        </Button>
                                                    </div>
                                                </form>
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <Card className="border-0 rounded-2xl shadow-lg overflow-hidden h-full flex flex-col">
                                            <div className={`absolute top-0 left-0 right-0 h-1 ${template.is_global ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
                                            <CardHeader className="pt-5 pb-3 bg-white dark:bg-slate-900">
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-200">{template.name}</CardTitle>
                                                    </div>
                                                    {template.is_global && (
                                                        <Badge variant="outline" className="rounded-full py-1 px-2 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 flex items-center gap-1">
                                                            <Globe className="h-3 w-3" />
                                                            {t('templates.global')}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-5 flex-grow bg-white dark:bg-slate-900">
                                                <ScrollArea className="h-32 rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 mb-4">
                                                    <p className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{template.content}</p>
                                                </ScrollArea>
                                            </CardContent>
                                            <CardFooter className="px-5 py-3 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                                                <div className="flex items-center">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="gap-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                                        onClick={() => copyToClipboard(template.content, template.id)}
                                                    >
                                                        {copied === template.id ? (
                                                            <>
                                                                <Check className="h-3.5 w-3.5 text-green-500" />
                                                                <span className="text-green-500">{t('templates.copied', 'Copié')}</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy className="h-3.5 w-3.5" />
                                                                {t('templates.copy', 'Copier')}
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="rounded-full h-8 w-8 p-0 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                                        onClick={() => startEditing(template)}
                                                    >
                                                        <Edit className="h-3.5 w-3.5" />
                                                        <span className="sr-only">{t('common.edit')}</span>
                                                    </Button>
                                                    {!template.is_global && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="rounded-full h-8 w-8 p-0 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                            asChild
                                                        >
                                                            <Link
                                                                href={route('templates.destroy', template.id)}
                                                                method="delete"
                                                                as="button"
                                                                onClick={(e: React.MouseEvent) => {
                                                                    if (!confirm(t('templates.confirmDelete'))) {
                                                                        e.preventDefault();
                                                                    }
                                                                }}
                                                            >
                                                                <Trash className="h-3.5 w-3.5" />
                                                                <span className="sr-only">{t('common.delete')}</span>
                                                            </Link>
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardFooter>
                                        </Card>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 