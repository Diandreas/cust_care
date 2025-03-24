import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import Modal from '@/Components/Modal';

interface Category {
    id: number;
    name: string;
    description?: string;
    clients_count: number;
    created_at: string;
}

interface CategoriesIndexProps extends PageProps {
    categories: Category[];
}

export default function Index({ auth, categories }: CategoriesIndexProps) {
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        description: '',
    });

    const openCreateModal = () => {
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

    const openDeleteModal = (category: Category) => {
        setCategoryToDelete(category);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setCategoryToDelete(null);
        setShowDeleteModal(false);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingCategory) {
            put(route('categories.update', editingCategory.id), {
                onSuccess: () => {
                    setEditingCategory(null);
                    reset();
                },
            });
        } else {
            post(route('categories.store'), {
                onSuccess: () => {
                    reset();
                },
            });
        }
    };

    const deleteCategory = () => {
        if (categoryToDelete) {
            post(route('categories.destroy', categoryToDelete.id), {
                onSuccess: () => {
                    closeDeleteModal();
                },
            });
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-playfair text-xl font-semibold leading-tight text-gray-800">Gestion des Catégories</h2>}
        >
            <Head title="Catégories" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="mb-6 flex justify-end">
                        <PrimaryButton onClick={openCreateModal}>
                            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Nouvelle Catégorie
                        </PrimaryButton>
                    </div>

                    <div className="overflow-hidden rounded-lg bg-white shadow-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Nom
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Description
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Clients
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {categories.map((category) => (
                                    <tr key={category.id}>
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 flex-shrink-0">
                                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-600">
                                                        {category.name.charAt(0)}
                                                    </span>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="font-medium text-gray-900">{category.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {category.description || '-'}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                            {category.clients_count} client{category.clients_count !== 1 ? 's' : ''}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(category)}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                >
                                                    Modifier
                                                </button>
                                                <button
                                                    onClick={() => openDeleteModal(category)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Supprimer
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {categories.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                                            Aucune catégorie trouvée
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            <Modal
                show={editingCategory !== null || data.name !== '' || data.description !== ''}
                onClose={() => {
                    setEditingCategory(null);
                    reset();
                }}
            >
                <form onSubmit={submit} className="p-6">
                    <h2 className="font-playfair text-lg font-medium text-gray-900">
                        {editingCategory ? 'Modifier la Catégorie' : 'Nouvelle Catégorie'}
                    </h2>

                    <div className="mt-6">
                        <InputLabel htmlFor="name" value="Nom" />
                        <TextInput
                            id="name"
                            type="text"
                            name="name"
                            value={data.name}
                            className="mt-1 block w-full"
                            onChange={(e) => setData('name', e.target.value)}
                            required
                        />
                        <InputError message={errors.name} className="mt-2" />
                    </div>

                    <div className="mt-6">
                        <InputLabel htmlFor="description" value="Description" />
                        <textarea
                            id="description"
                            name="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <InputError message={errors.description} className="mt-2" />
                    </div>

                    <div className="mt-6 flex justify-end gap-4">
                        <SecondaryButton
                            type="button"
                            onClick={() => {
                                setEditingCategory(null);
                                reset();
                            }}
                        >
                            Annuler
                        </SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            {editingCategory ? 'Mettre à jour' : 'Créer'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onClose={closeDeleteModal}>
                <div className="p-6">
                    <h2 className="font-playfair text-lg font-medium text-gray-900">
                        Confirmer la Suppression
                    </h2>

                    <p className="mt-4 text-sm text-gray-600">
                        Êtes-vous sûr de vouloir supprimer cette catégorie ? Cette action est irréversible.
                        {categoryToDelete?.clients_count > 0 && (
                            <span className="mt-2 block font-semibold text-red-600">
                                Attention : Cette catégorie contient {categoryToDelete.clients_count} client
                                {categoryToDelete.clients_count !== 1 ? 's' : ''}.
                            </span>
                        )}
                    </p>

                    <div className="mt-6 flex justify-end gap-4">
                        <SecondaryButton type="button" onClick={closeDeleteModal}>
                            Annuler
                        </SecondaryButton>
                        <PrimaryButton
                            onClick={deleteCategory}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                        >
                            Supprimer
                        </PrimaryButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
} 