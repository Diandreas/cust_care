// resources/js/Pages/Clients/Edit.tsx
import React, { useState, useEffect } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { PageProps, Client, Tag } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/Utils/toast';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import axios from 'axios';

interface EditClientProps extends Record<string, unknown> {
    client: Client;
    tags: Tag[];
    selectedTags: number[];
}

export default function EditClient({
    auth,
    client,
    tags,
    selectedTags,
}: PageProps<EditClientProps>) {
    const { t } = useTranslation();
    const { success, error } = useToast();
    const [selectedTagsState, setSelectedTagsState] = useState<number[]>(selectedTags || []);
    const [newTagName, setNewTagName] = useState('');
    const [isAddingTag, setIsAddingTag] = useState(false);

    const { data, setData, patch, processing, errors } = useForm({
        name: client.name || '',
        phone: client.phone || '',
        email: client.email || '',
        birthday: client.birthday || '',
        address: client.address || '',
        notes: client.notes || '',
        gender: client.gender || '',
        tags: selectedTagsState || [],
    });

    useEffect(() => {
        setData('tags', selectedTagsState);
    }, [selectedTagsState]);

    const handleTagToggle = (tagId: number) => {
        setSelectedTagsState(prev =>
            prev.includes(tagId)
                ? prev.filter(id => id !== tagId)
                : [...prev, tagId]
        );
    };

    const handleCreateTag = () => {
        if (!newTagName.trim()) {
            error(t('tags.nameRequired'));
            return;
        }

        axios.post(route('tags.store'), {
            name: newTagName,
        })
            .then(response => {
                success(t('tags.createSuccess'));
                setNewTagName('');
                setIsAddingTag(false);
                // Ajouter le nouveau tag à la liste et le sélectionner
                const newTag = response.data.tag;
                handleTagToggle(newTag.id);
                // Rafraîchir la page pour voir le nouveau tag
                window.location.reload();
            })
            .catch(err => {
                error(t('tags.createError'));
            });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        patch(route('clients.update', client.id), {
            onSuccess: () => {
                success(t('clients.updateSuccess'));
            },
            onError: () => {
                error(t('common.error'));
            }
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">{t('clients.edit')}</h2>}
        >
            <Head title={t('clients.edit')} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm dark:bg-gray-800 sm:rounded-lg">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            <form onSubmit={handleSubmit}>
                                <div className="mb-6 grid grid-cols-1 gap-y-6 gap-x-4 md:grid-cols-2">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('common.name')} *
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                            required
                                        />
                                        {errors.name && (
                                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('common.phone')} *
                                        </label>
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                            required
                                        />
                                        {errors.phone && (
                                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.phone}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('common.email')}
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        />
                                        {errors.email && (
                                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="birthday" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('common.birthday')}
                                        </label>
                                        <input
                                            type="date"
                                            id="birthday"
                                            name="birthday"
                                            value={data.birthday}
                                            onChange={(e) => setData('birthday', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        />
                                        {errors.birthday && (
                                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.birthday}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('common.address')}
                                        </label>
                                        <input
                                            type="text"
                                            id="address"
                                            name="address"
                                            value={data.address}
                                            onChange={(e) => setData('address', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        />
                                        {errors.address && (
                                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.address}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('common.gender')}
                                        </label>
                                        <select
                                            id="gender"
                                            name="gender"
                                            value={data.gender}
                                            onChange={(e) => setData('gender', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        >
                                            <option value="">{t('clients.selectGender')}</option>
                                            <option value="male">{t('gender.male')}</option>
                                            <option value="female">{t('gender.female')}</option>
                                            <option value="other">{t('gender.other')}</option>
                                        </select>
                                        {errors.gender && (
                                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.gender}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {t('common.notes')}
                                    </label>
                                    <textarea
                                        id="notes"
                                        name="notes"
                                        rows={4}
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    ></textarea>
                                    {errors.notes && (
                                        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.notes}</p>
                                    )}
                                </div>

                                <div className="mb-6">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('common.tags')}
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setIsAddingTag(!isAddingTag)}
                                            className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                        >
                                            {isAddingTag ? t('common.cancel') : t('tags.createNew')}
                                        </button>
                                    </div>

                                    {isAddingTag && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <TextInput
                                                value={newTagName}
                                                onChange={(e) => setNewTagName(e.target.value)}
                                                placeholder={t('tags.newTagPlaceholder')}
                                                className="flex-1"
                                            />
                                            <PrimaryButton type="button" onClick={handleCreateTag} className="whitespace-nowrap">
                                                {t('common.add')}
                                            </PrimaryButton>
                                        </div>
                                    )}

                                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                                        {tags.length > 0 ? (
                                            tags.map((tag) => (
                                                <div key={tag.id} className="flex items-center">
                                                    <input
                                                        id={`tag-${tag.id}`}
                                                        type="checkbox"
                                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                        checked={selectedTagsState.includes(tag.id)}
                                                        onChange={() => handleTagToggle(tag.id)}
                                                    />
                                                    <label htmlFor={`tag-${tag.id}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                                        {tag.name}
                                                    </label>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('tags.noTagsAvailable')}</p>
                                        )}
                                    </div>
                                    <div className="mt-2">
                                        <Link
                                            href={route('tags.index')}
                                            className="text-sm text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                        >
                                            {t('tags.manageTagsLink')}
                                        </Link>
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <a
                                        href={route('clients.index')}
                                        className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                    >
                                        {t('common.cancel')}
                                    </a>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-700 dark:hover:bg-indigo-600"
                                    >
                                        {t('common.save')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}