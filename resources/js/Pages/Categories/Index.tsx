// resources/js/Pages/Categories/Index.tsx
import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, Category } from '@/types';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Badge } from '@/Components/ui/badge';
import { confirmDialog } from '@/Utils/sweetalert';

interface CategoryPageProps extends PageProps {
    categories: Category[];
}

export default function Index({ auth, categories }: CategoryPageProps) {
    const { t } = useTranslation();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    const { data, setData, post, patch, processing, errors, reset } = useForm({
        name: '',
        description: '',
    });

    const closeModal = () => {
        setIsCreateModalOpen(false);
        setEditingCategory(null);
        reset();
    };

    const openEditModal = (category: Category) => {
        setEditingCategory(category);
        setData({
            name: category.name,
            description: category.description || '',
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingCategory) {
            patch(route('categories.update', editingCategory.id), {
                onSuccess: () => closeModal(),
                preserveScroll: true,
            });
        } else {
            post(route('categories.store'), {
                onSuccess: () => closeModal(),
                preserveScroll: true,
            });
        }
    };

    const handleDelete = async (category: Category) => {
        const result = await confirmDialog(
            t('categories.confirmDelete'),
            t('common.delete'),
            t('common.delete'),
            t('common.cancel')
        );

        if (result.isConfirmed) {
            // Utilisation d'une requête SPA avec Inertia
            router.delete(route('categories.destroy', category.id), {
                preserveScroll: true,
            });
        }
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={t('common.categories')} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
                            {t('common.categories')}
                        </h1>
                        <Button onClick={() => setIsCreateModalOpen(true)}>
                            <PlusIcon className="h-4 w-4 mr-2" />
                            {t('categories.create')}
                        </Button>
                    </div>

                    {categories.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                                <p>{t('categories.noCategories')}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {categories.map((category) => (
                                <Card key={category.id}>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="flex items-center justify-between">
                                            <span>{category.name}</span>
                                            <Badge variant="outline">
                                                {t('categories.clientsCount', { count: category.clients_count })}
                                            </Badge>
                                        </CardTitle>
                                        {category.description && (
                                            <CardDescription>{category.description}</CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardFooter className="flex justify-end space-x-2 pt-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openEditModal(category)}
                                        >
                                            <PencilIcon className="h-4 w-4 mr-1" />
                                            {t('common.edit')}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/20"
                                            onClick={() => handleDelete(category)}
                                        >
                                            <TrashIcon className="h-4 w-4 mr-1" />
                                            {t('common.delete')}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={isCreateModalOpen || editingCategory !== null} onOpenChange={closeModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingCategory ? t('common.edit') + ' ' + editingCategory.name : t('categories.create')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('common.description')}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">{t('common.name')}</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder={t('common.name')}
                                />
                                {errors.name && (
                                    <p className="text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">{t('common.description')}</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder={t('common.description')}
                                />
                                {errors.description && (
                                    <p className="text-sm text-red-600 dark:text-red-400">{errors.description}</p>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeModal}>
                                {t('common.cancel')}
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {editingCategory ? t('common.save') : t('common.create')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}