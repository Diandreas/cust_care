import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Textarea } from '@/Components/ui/textarea';
import { Checkbox } from '@/Components/ui/checkbox';
import { Label } from '@/Components/ui/label';
import { Separator } from '@/Components/ui/separator';
import { Badge } from '@/Components/ui/badge';
import { Plus, Edit, Trash, Check, Globe } from 'lucide-react';

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

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">{t('common.templates')}</h2>}
        >
            <Head title={t('common.templates')} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="mb-6 flex justify-end">
                        <Button
                            onClick={() => setIsCreating(!isCreating)}
                            className="gap-2"
                        >
                            {isCreating ? t('templates.cancel') : (
                                <>
                                    <Plus className="h-4 w-4" />
                                    {t('templates.create')}
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Formulaire de création de modèle */}
                    {isCreating && (
                        <Card className="mb-8">
                            <CardHeader>
                                <CardTitle>{t('templates.create')}</CardTitle>
                                <CardDescription>{t('templates.createDescription', 'Créez un nouveau modèle de message que vous pourrez réutiliser')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleCreateSubmit}>
                                    <div className="grid gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">{t('templates.name')} *</Label>
                                            <Input
                                                id="name"
                                                value={createData.name}
                                                onChange={(e) => setCreateData('name', e.target.value)}
                                                required
                                            />
                                            {createErrors.name && <p className="text-sm text-destructive">{createErrors.name}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="content">{t('templates.content')} *</Label>
                                            <Textarea
                                                id="content"
                                                rows={5}
                                                value={createData.content}
                                                onChange={(e) => setCreateData('content', e.target.value)}
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
                                                />
                                                <Label htmlFor="is_global">{t('templates.isGlobal')}</Label>
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
                                        >
                                            {t('common.cancel')}
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={createProcessing}
                                        >
                                            {t('common.save')}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    {/* Liste des modèles */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('templates.yourTemplates')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {templates.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <p className="text-muted-foreground">{t('templates.noTemplates')}</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {templates.map((template) => (
                                        <Card key={template.id} className="overflow-hidden">
                                            {editingId === template.id ? (
                                                <CardContent className="p-6">
                                                    <form onSubmit={(e) => handleEditSubmit(e, template.id)}>
                                                        <div className="grid gap-6">
                                                            <div className="space-y-2">
                                                                <Label htmlFor={`edit-name-${template.id}`}>{t('templates.name')} *</Label>
                                                                <Input
                                                                    id={`edit-name-${template.id}`}
                                                                    value={editData.name}
                                                                    onChange={(e) => setEditData('name', e.target.value)}
                                                                    required
                                                                />
                                                                {editErrors.name && <p className="text-sm text-destructive">{editErrors.name}</p>}
                                                            </div>

                                                            <div className="space-y-2">
                                                                <Label htmlFor={`edit-content-${template.id}`}>{t('templates.content')} *</Label>
                                                                <Textarea
                                                                    id={`edit-content-${template.id}`}
                                                                    rows={5}
                                                                    value={editData.content}
                                                                    onChange={(e) => setEditData('content', e.target.value)}
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
                                                                    />
                                                                    <Label htmlFor={`edit-is_global-${template.id}`}>{t('templates.isGlobal')}</Label>
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
                                                            >
                                                                {t('common.cancel')}
                                                            </Button>
                                                            <Button
                                                                type="submit"
                                                                disabled={editProcessing}
                                                            >
                                                                {t('common.save')}
                                                            </Button>
                                                        </div>
                                                    </form>
                                                </CardContent>
                                            ) : (
                                                <>
                                                    <CardHeader className="pb-3">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <CardTitle>{template.name}</CardTitle>
                                                                {template.is_global && (
                                                                    <Badge variant="outline" className="flex gap-1 items-center">
                                                                        <Globe className="h-3 w-3" />
                                                                        {t('templates.global')}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="gap-1"
                                                                    onClick={() => startEditing(template)}
                                                                >
                                                                    <Edit className="h-3.5 w-3.5" />
                                                                    {t('common.edit')}
                                                                </Button>
                                                                {!template.is_global && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        className="gap-1"
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
                                                        </div>
                                                    </CardHeader>
                                                    <Separator />
                                                    <CardContent className="pt-4">
                                                        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{template.content}</p>
                                                    </CardContent>
                                                </>
                                            )}
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}