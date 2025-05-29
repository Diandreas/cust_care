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
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash, Check, Globe, Copy, Search, Tag } from 'lucide-react';

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

export default function TemplatesIndex({
    auth,
    templates,
    isAdmin,
}: PageProps<TemplatesIndexProps>) {
    const { t } = useTranslation();
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [copied, setCopied] = useState<number | null>(null);

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

    const filteredTemplates = templates.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">{t('common.templates')}</h2>}
        >
            <Head title={t('common.templates')} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="relative w-full sm:max-w-md">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder={t('templates.searchPlaceholder', 'Rechercher un modèle...')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 rounded-xl border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
                            />
                        </div>
                        <motion.div
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            <Button
                                onClick={() => setIsCreating(!isCreating)}
                                className="gap-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:shadow-lg transition-all duration-300 rounded-xl"
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
                                <Card className="border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800">
                                        <CardTitle className="text-lg text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                            <Tag className="h-5 w-5 text-indigo-500" />
                                            {t('templates.create')}
                                        </CardTitle>
                                        <CardDescription>{t('templates.createDescription', 'Créez un nouveau modèle de message que vous pourrez réutiliser')}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <form onSubmit={handleCreateSubmit}>
                                            <div className="grid gap-6">
                                                <div className="space-y-2">
                                                    <Label htmlFor="name" className="font-medium text-slate-700 dark:text-slate-300">{t('templates.name')} *</Label>
                                                    <Input
                                                        id="name"
                                                        value={createData.name}
                                                        onChange={(e) => setCreateData('name', e.target.value)}
                                                        className="rounded-xl border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50"
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
                                                        className="rounded-xl resize-none border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50"
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
                                                    className="rounded-xl border border-slate-200 dark:border-slate-700"
                                                >
                                                    {t('common.cancel')}
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    disabled={createProcessing}
                                                    className="rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:shadow-lg transition-all duration-300"
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

                    {/* Liste des modèles */}
                    <Card className="border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800">
                            <CardTitle className="text-lg text-slate-800 dark:text-slate-200">{t('templates.yourTemplates')}</CardTitle>
                            <CardDescription>
                                {filteredTemplates.length === 0 && searchTerm
                                    ? t('templates.noSearchResults', 'Aucun modèle ne correspond à votre recherche')
                                    : t('templates.description', 'Gérez vos modèles de messages pour une communication efficace')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            {templates.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="rounded-full bg-slate-50 dark:bg-slate-800 p-4 mb-4">
                                        <Tag className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                                    </div>
                                    <p className="text-muted-foreground font-medium">{t('templates.noTemplates')}</p>
                                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 max-w-md">
                                        {t('templates.noTemplatesDescription', 'Créez votre premier modèle en cliquant sur le bouton "Créer" ci-dessus')}
                                    </p>
                                </div>
                            ) : filteredTemplates.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="rounded-full bg-slate-50 dark:bg-slate-800 p-4 mb-4">
                                        <Search className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                                    </div>
                                    <p className="text-muted-foreground font-medium">{t('templates.noSearchResults', 'Aucun modèle ne correspond à votre recherche')}</p>
                                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">{t('templates.tryAnotherSearch', 'Essayez une autre recherche')}</p>
                                </div>
                            ) : (
                                <ScrollArea className="h-[600px] pr-4">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {filteredTemplates.map((template) => (
                                            <motion.div
                                                key={template.id}
                                                whileHover={{ y: -4 }}
                                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                            >
                                                <Card className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300">
                                                    {editingId === template.id ? (
                                                        <CardContent className="p-6">
                                                            <form onSubmit={(e) => handleEditSubmit(e, template.id)}>
                                                                <div className="grid gap-6">
                                                                    <div className="space-y-2">
                                                                        <Label htmlFor={`edit-name-${template.id}`} className="font-medium text-slate-700 dark:text-slate-300">{t('templates.name')} *</Label>
                                                                        <Input
                                                                            id={`edit-name-${template.id}`}
                                                                            value={editData.name}
                                                                            onChange={(e) => setEditData('name', e.target.value)}
                                                                            className="rounded-xl border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50"
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
                                                                            className="rounded-xl resize-none border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50"
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
                                                                        className="rounded-xl border border-slate-200 dark:border-slate-700"
                                                                    >
                                                                        {t('common.cancel')}
                                                                    </Button>
                                                                    <Button
                                                                        type="submit"
                                                                        disabled={editProcessing}
                                                                        className="rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:shadow-lg transition-all duration-300"
                                                                    >
                                                                        {t('common.save')}
                                                                    </Button>
                                                                </div>
                                                            </form>
                                                        </CardContent>
                                                    ) : (
                                                        <>
                                                            <CardHeader className="pb-3 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <CardTitle className="text-base text-slate-800 dark:text-slate-200">{template.name}</CardTitle>
                                                                        {template.is_global && (
                                                                            <Badge variant="outline" className="flex gap-1 items-center bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300">
                                                                                <Globe className="h-3 w-3" />
                                                                                {t('templates.global')}
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </CardHeader>
                                                            <CardContent className="p-4">
                                                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 mb-4 min-h-[80px] max-h-[150px] overflow-auto">
                                                                    <p className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{template.content}</p>
                                                                </div>
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="gap-1 rounded-xl border-slate-200 dark:border-slate-700"
                                                                        onClick={() => copyToClipboard(template.content, template.id)}
                                                                    >
                                                                        {copied === template.id ? (
                                                                            <>
                                                                                <Check className="h-3.5 w-3.5 text-green-500" />
                                                                                {t('templates.copied', 'Copié')}
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Copy className="h-3.5 w-3.5" />
                                                                                {t('templates.copy', 'Copier')}
                                                                            </>
                                                                        )}
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="gap-1 rounded-xl border-slate-200 dark:border-slate-700"
                                                                        onClick={() => startEditing(template)}
                                                                    >
                                                                        <Edit className="h-3.5 w-3.5" />
                                                                        {t('common.edit')}
                                                                    </Button>
                                                                    {!template.is_global && (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="destructive"
                                                                            className="gap-1 rounded-xl"
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
                                                                                {t('common.delete')}
                                                                            </Link>
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </CardContent>
                                                        </>
                                                    )}
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}