import { useEffect, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';

interface Category {
    id: number;
    name: string;
}

interface Client {
    id?: number;
    name: string;
    phone: string;
    email: string | null;
    birthday: string | null;
    category_ids: number[];
    notes: string | null;
}

interface ClientFormProps extends PageProps {
    client?: Client;
    categories: Category[];
    isEditing: boolean;
}

export default function Form({ auth, client, categories, isEditing }: ClientFormProps) {
    const { data, setData, post, put, processing, errors, reset } = useForm<Client>({
        name: client?.name || '',
        phone: client?.phone || '',
        email: client?.email || '',
        birthday: client?.birthday || '',
        category_ids: client?.category_ids || [],
        notes: client?.notes || '',
    });

    const [selectedCategories, setSelectedCategories] = useState<number[]>(data.category_ids);

    useEffect(() => {
        setData('category_ids', selectedCategories);
    }, [selectedCategories]);

    const handleCategoryToggle = (categoryId: number) => {
        setSelectedCategories((prev) =>
            prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEditing && client?.id) {
            put(route('clients.update', client.id));
        } else {
            post(route('clients.store'));
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-playfair text-xl font-semibold leading-tight text-gray-800">
                    {isEditing ? 'Modifier le Client' : 'Nouveau Client'}
                </h2>
            }
        >
            <Head title={isEditing ? 'Modifier le Client' : 'Nouveau Client'} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="bg-white p-6 shadow-sm sm:rounded-lg">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div>
                                    <InputLabel htmlFor="name" value="Nom" required />
                                    <TextInput
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.name} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="phone" value="Téléphone" required />
                                    <TextInput
                                        id="phone"
                                        type="tel"
                                        value={data.phone}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('phone', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.phone} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="email" value="Email" />
                                    <TextInput
                                        id="email"
                                        type="email"
                                        value={data.email || ''}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('email', e.target.value)}
                                    />
                                    <InputError message={errors.email} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="birthday" value="Date de naissance" />
                                    <TextInput
                                        id="birthday"
                                        type="date"
                                        value={data.birthday || ''}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('birthday', e.target.value)}
                                    />
                                    <InputError message={errors.birthday} className="mt-2" />
                                </div>
                            </div>

                            <div>
                                <InputLabel value="Catégories" />
                                <div className="mt-1 grid grid-cols-1 gap-2 rounded-md border border-gray-300 p-3 sm:grid-cols-2 md:grid-cols-3">
                                    {categories.length > 0 ? (
                                        categories.map((category) => (
                                            <div key={category.id} className="flex items-center">
                                                <input
                                                    id={`category-${category.id}`}
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                    checked={selectedCategories.includes(category.id)}
                                                    onChange={() => handleCategoryToggle(category.id)}
                                                />
                                                <label
                                                    htmlFor={`category-${category.id}`}
                                                    className="ml-2 block text-sm text-gray-900"
                                                >
                                                    {category.name}
                                                </label>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500">Aucune catégorie disponible</p>
                                    )}
                                </div>
                                <InputError message={errors.category_ids} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="notes" value="Notes" />
                                <textarea
                                    id="notes"
                                    value={data.notes || ''}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={3}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                ></textarea>
                                <InputError message={errors.notes} className="mt-2" />
                            </div>

                            <div className="flex justify-end gap-4">
                                <SecondaryButton type="button" onClick={() => window.history.back()}>
                                    Annuler
                                </SecondaryButton>
                                <PrimaryButton disabled={processing}>
                                    {isEditing ? 'Mettre à jour' : 'Créer'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 