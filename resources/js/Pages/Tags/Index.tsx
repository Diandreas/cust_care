import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/Utils/toast';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import Modal from '@/Components/Modal';
import axios from 'axios';

interface Tag {
    id: number;
    name: string;
    clients_count: number;
}

export default function Index({ auth, tags }: PageProps<{ tags: Tag[] }>) {
    const { t } = useTranslation();
    const { success, error } = useToast();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingTag, setEditingTag] = useState<Tag | null>(null);
    const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
    });

    const { data: editData, setData: setEditData, put, processing: editProcessing, errors: editErrors } = useForm({
        name: '',
    });

    const openCreateModal = () => {
        reset();
        setShowCreateModal(true);
    };

    const openEditModal = (tag: Tag) => {
        setEditingTag(tag);
        setEditData('name', tag.name);
    };

    const openDeleteModal = (tag: Tag) => {
        setTagToDelete(tag);
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('tags.store'), {
            onSuccess: () => {
                setShowCreateModal(false);
                success('Tag créé avec succès');
                reset();
            },
            onError: () => {
                error('Erreur lors de la création du tag');
            }
        });
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTag) return;

        put(route('tags.update', editingTag.id), {
            onSuccess: () => {
                setEditingTag(null);
                success('Tag mis à jour avec succès');
                setEditData('name', '');
            },
            onError: () => {
                error('Erreur lors de la mise à jour du tag');
            }
        });
    };

    const handleDelete = () => {
        if (!tagToDelete) return;

        axios.delete(route('tags.destroy', tagToDelete.id))
            .then(() => {
                setTagToDelete(null);
                success('Tag supprimé avec succès');
            })
            .catch(() => {
                error('Erreur lors de la suppression du tag');
            });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">{t('tags.management')}</h2>}
        >
            <Head title={t('tags.management')} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm dark:bg-gray-800 sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                            <div className="flex justify-between mb-6">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Liste des tags</h3>
                                <PrimaryButton onClick={openCreateModal}>Nouveau tag</PrimaryButton>
                            </div>

                            {tags.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                                    Nom
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                                    Clients
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                                            {tags.map((tag) => (
                                                <tr key={tag.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{tag.name}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">{tag.clients_count}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <button
                                                            onClick={() => openEditModal(tag)}
                                                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                                                        >
                                                            Modifier
                                                        </button>
                                                        <button
                                                            onClick={() => openDeleteModal(tag)}
                                                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                        >
                                                            Supprimer
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-500 dark:text-gray-400">Aucun tag créé pour le moment.</p>
                                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Créez votre premier tag pour organiser vos clients.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de création */}
            <Modal show={showCreateModal} onClose={() => setShowCreateModal(false)}>
                <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Créer un nouveau tag</h2>
                    <form onSubmit={handleCreate} className="mt-6">
                        <div className="mb-6">
                            <InputLabel htmlFor="name" value="Nom du tag" />
                            <TextInput
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="mt-1 block w-full"
                                required
                                autoFocus
                            />
                            {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name}</p>}
                        </div>

                        <div className="flex justify-end">
                            <SecondaryButton onClick={() => setShowCreateModal(false)} className="mr-3">
                                Annuler
                            </SecondaryButton>
                            <PrimaryButton type="submit" disabled={processing}>
                                Créer
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Modal d'édition */}
            <Modal show={!!editingTag} onClose={() => setEditingTag(null)}>
                <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Modifier le tag</h2>
                    <form onSubmit={handleUpdate} className="mt-6">
                        <div className="mb-6">
                            <InputLabel htmlFor="edit_name" value="Nom du tag" />
                            <TextInput
                                id="edit_name"
                                value={editData.name}
                                onChange={(e) => setEditData('name', e.target.value)}
                                className="mt-1 block w-full"
                                required
                                autoFocus
                            />
                            {editErrors.name && <p className="mt-2 text-sm text-red-600">{editErrors.name}</p>}
                        </div>

                        <div className="flex justify-end">
                            <SecondaryButton onClick={() => setEditingTag(null)} className="mr-3">
                                Annuler
                            </SecondaryButton>
                            <PrimaryButton type="submit" disabled={editProcessing}>
                                Mettre à jour
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Modal de suppression */}
            <Modal show={!!tagToDelete} onClose={() => setTagToDelete(null)}>
                <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Confirmation de suppression</h2>
                    <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                        Êtes-vous sûr de vouloir supprimer le tag "{tagToDelete?.name}" ?
                        {tagToDelete && tagToDelete.clients_count > 0 && (
                            <span className="block mt-2 text-red-600">
                                Ce tag est associé à {tagToDelete.clients_count} client{tagToDelete.clients_count > 1 ? 's' : ''}.
                            </span>
                        )}
                    </p>

                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={() => setTagToDelete(null)} className="mr-3">
                            Annuler
                        </SecondaryButton>
                        <DangerButton onClick={handleDelete}>
                            Supprimer
                        </DangerButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
} 