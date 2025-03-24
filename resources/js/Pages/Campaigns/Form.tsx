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
    clients_count: number;
}

interface Template {
    id: number;
    name: string;
    content: string;
}

interface CampaignFormProps extends PageProps {
    campaign?: {
        id: number;
        name: string;
        message: string;
        scheduled_at: string | null;
        categories: number[];
        template_id: number | null;
    };
    categories: Category[];
    templates: Template[];
}

export default function Form({ auth, campaign, categories, templates }: CampaignFormProps) {
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
        campaign?.template_id ? templates.find((t) => t.id === campaign.template_id) || null : null
    );

    const { data, setData, post, put, processing, errors } = useForm({
        name: campaign?.name || '',
        message: campaign?.message || '',
        scheduled_at: campaign?.scheduled_at || '',
        categories: campaign?.categories || [],
        template_id: campaign?.template_id || '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if (campaign) {
            put(route('campaigns.update', campaign.id));
        } else {
            post(route('campaigns.store'));
        }
    };

    const handleTemplateChange = (templateId: string) => {
        const template = templates.find((t) => t.id === parseInt(templateId));
        setSelectedTemplate(template || null);
        setData({
            ...data,
            template_id: templateId,
            message: template?.content || data.message,
        });
    };

    const getTotalRecipients = () => {
        return categories
            .filter((category) => data.categories.includes(category.id))
            .reduce((sum, category) => sum + category.clients_count, 0);
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-playfair text-xl font-semibold leading-tight text-gray-800">
                    {campaign ? 'Modifier la Campagne' : 'Nouvelle Campagne'}
                </h2>
            }
        >
            <Head title={campaign ? 'Modifier la Campagne' : 'Nouvelle Campagne'} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <form onSubmit={submit} className="space-y-8">
                        <div className="overflow-hidden rounded-lg bg-white shadow">
                            <div className="border-b border-gray-200 bg-gray-50 px-4 py-5 sm:px-6">
                                <h3 className="font-playfair text-lg font-medium leading-6 text-gray-900">
                                    Informations de la Campagne
                                </h3>
                            </div>
                            <div className="px-4 py-5 sm:p-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div>
                                        <InputLabel htmlFor="name" value="Nom de la campagne" />
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

                                    <div>
                                        <InputLabel htmlFor="scheduled_at" value="Date d'envoi (optionnel)" />
                                        <TextInput
                                            id="scheduled_at"
                                            type="datetime-local"
                                            name="scheduled_at"
                                            value={data.scheduled_at}
                                            className="mt-1 block w-full"
                                            onChange={(e) => setData('scheduled_at', e.target.value)}
                                        />
                                        <InputError message={errors.scheduled_at} className="mt-2" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-lg bg-white shadow">
                            <div className="border-b border-gray-200 bg-gray-50 px-4 py-5 sm:px-6">
                                <h3 className="font-playfair text-lg font-medium leading-6 text-gray-900">
                                    Destinataires
                                </h3>
                            </div>
                            <div className="px-4 py-5 sm:p-6">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                                        {categories.map((category) => (
                                            <label
                                                key={category.id}
                                                className="relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none"
                                            >
                                                <input
                                                    type="checkbox"
                                                    name="categories[]"
                                                    value={category.id}
                                                    checked={data.categories.includes(category.id)}
                                                    onChange={(e) => {
                                                        const categoryId = parseInt(e.target.value);
                                                        setData(
                                                            'categories',
                                                            e.target.checked
                                                                ? [...data.categories, categoryId]
                                                                : data.categories.filter((id) => id !== categoryId)
                                                        );
                                                    }}
                                                    className="sr-only"
                                                />
                                                <div className="flex w-full items-center justify-between">
                                                    <div className="flex items-center">
                                                        <div className="text-sm">
                                                            <p className="font-medium text-gray-900">{category.name}</p>
                                                            <p className="text-gray-500">
                                                                {category.clients_count} client
                                                                {category.clients_count !== 1 ? 's' : ''}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div
                                                        className={`h-5 w-5 rounded-full border flex items-center justify-center ${data.categories.includes(category.id)
                                                                ? 'border-transparent bg-violet-600 text-white'
                                                                : 'border-gray-300'
                                                            }`}
                                                    >
                                                        {data.categories.includes(category.id) && (
                                                            <svg
                                                                className="h-3 w-3"
                                                                fill="currentColor"
                                                                viewBox="0 0 12 12"
                                                            >
                                                                <path d="M3.707 5.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L5 6.586 3.707 5.293z" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                    <InputError message={errors.categories} className="mt-2" />

                                    <div className="rounded-md bg-blue-50 p-4">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <svg
                                                    className="h-5 w-5 text-blue-400"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="font-montserrat text-sm font-medium text-blue-800">
                                                    Total des destinataires
                                                </h3>
                                                <div className="mt-2 text-sm text-blue-700">
                                                    <p>
                                                        Cette campagne sera envoyée à {getTotalRecipients()} destinataire
                                                        {getTotalRecipients() !== 1 ? 's' : ''}.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-lg bg-white shadow">
                            <div className="border-b border-gray-200 bg-gray-50 px-4 py-5 sm:px-6">
                                <h3 className="font-playfair text-lg font-medium leading-6 text-gray-900">
                                    Message
                                </h3>
                            </div>
                            <div className="px-4 py-5 sm:p-6">
                                <div className="space-y-6">
                                    <div>
                                        <InputLabel htmlFor="template" value="Modèle de message (optionnel)" />
                                        <select
                                            id="template"
                                            name="template_id"
                                            value={data.template_id}
                                            onChange={(e) => handleTemplateChange(e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        >
                                            <option value="">Sélectionner un modèle</option>
                                            {templates.map((template) => (
                                                <option key={template.id} value={template.id}>
                                                    {template.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="message" value="Contenu du message" />
                                        <textarea
                                            id="message"
                                            name="message"
                                            rows={4}
                                            value={data.message}
                                            onChange={(e) => setData('message', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            required
                                        />
                                        <InputError message={errors.message} className="mt-2" />
                                        <p className="mt-2 text-sm text-gray-500">
                                            {data.message.length} caractère{data.message.length !== 1 ? 's' : ''} (
                                            {Math.ceil(data.message.length / 160)} SMS)
                                        </p>
                                    </div>

                                    <div>
                                        <SecondaryButton type="button" onClick={() => setShowPreviewModal(true)}>
                                            Aperçu du message
                                        </SecondaryButton>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4">
                            <SecondaryButton type="button" onClick={() => window.history.back()}>
                                Annuler
                            </SecondaryButton>
                            <PrimaryButton disabled={processing}>
                                {campaign ? 'Mettre à jour' : 'Créer la campagne'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>

            {/* Preview Modal */}
            <Modal show={showPreviewModal} onClose={() => setShowPreviewModal(false)}>
                <div className="p-6">
                    <h2 className="font-playfair text-lg font-medium text-gray-900">Aperçu du Message</h2>
                    <div className="mt-4">
                        <div className="rounded-lg bg-gray-100 p-4">
                            <div className="space-y-4">
                                <div className="flex items-center space-x-4">
                                    <div className="h-10 w-10 flex-shrink-0">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-lg font-semibold text-violet-600">
                                            S
                                        </span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="rounded-2xl bg-white p-4 text-sm shadow">
                                            {data.message || 'Aucun message'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <SecondaryButton type="button" onClick={() => setShowPreviewModal(false)}>
                            Fermer
                        </SecondaryButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
} 