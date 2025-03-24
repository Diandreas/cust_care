// resources/js/Pages/Messages/Create.tsx
import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';

interface Client {
    id: number;
    name: string;
    phone: string;
}

interface Template {
    id: number;
    name: string;
    content: string;
}

interface CreateMessageProps {
    clients: Client[];
    templates: Template[];
    preselected_client_id?: number;
}

export default function CreateMessage({
    auth,
    clients,
    templates,
    preselected_client_id,
}: PageProps<CreateMessageProps>) {
    const { t } = useTranslation();
    const [remainingChars, setRemainingChars] = useState(160);
    const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);

    const { data, setData, post, processing, errors } = useForm({
        client_id: preselected_client_id || '',
        content: '',
    });

    // Gérer le changement de template
    const handleTemplateChange = (templateId: number) => {
        setSelectedTemplate(templateId);
        const template = templates.find((t) => t.id === templateId);
        if (template) {
            setData('content', template.content);
            updateRemainingChars(template.content);
        }
    };

    // Mettre à jour le compteur de caractères
    const updateRemainingChars = (content: string) => {
        const smsLength = content.length;
        const remainingChars = 160 - smsLength;
        setRemainingChars(remainingChars);
    };

    // Gérer la soumission du formulaire
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('messages.store'));
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">{t('messages.send')}</h2>}
        >
            <Head title={t('messages.send')} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm dark:bg-gray-800 sm:rounded-lg">
                        <div className="p-6">
                            <form onSubmit={handleSubmit}>
                                <div className="mb-6">
                                    <label htmlFor="client_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {t('messages.selectRecipient')} *
                                    </label>
                                    <select
                                        id="client_id"
                                        name="client_id"
                                        value={data.client_id}
                                        onChange={(e) => setData('client_id', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                        required
                                    >
                                        <option value="">{t('messages.chooseClient')}</option>
                                        {clients.map((client) => (
                                            <option key={client.id} value={client.id}>
                                                {client.name} ({client.phone})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.client_id && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.client_id}</p>}
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="template" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {t('messages.useTemplate')}
                                    </label>
                                    <select
                                        id="template"
                                        name="template"
                                        value={selectedTemplate || ''}
                                        onChange={(e) => handleTemplateChange(Number(e.target.value))}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                    >
                                        <option value="">{t('messages.noTemplate')}</option>
                                        {templates.map((template) => (
                                            <option key={template.id} value={template.id}>
                                                {template.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-6">
                                    <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {t('messages.messageContent')} *
                                    </label>
                                    <textarea
                                        id="content"
                                        name="content"
                                        rows={5}
                                        value={data.content}
                                        onChange={(e) => {
                                            setData('content', e.target.value);
                                            updateRemainingChars(e.target.value);
                                        }}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                        required
                                    ></textarea>
                                    {errors.content && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.content}</p>}
                                    <div className="mt-2 flex justify-between">
                                        <span className={`text-sm ${remainingChars < 0 ? 'text-red-500' : 'text-gray-500'} dark:text-gray-400`}>
                                            {t('messages.charactersRemaining')}: {remainingChars}
                                        </span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            {Math.ceil(data.content.length / 160)} SMS
                                        </span>
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <Link
                                        href={route('messages.index')}
                                        className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                    >
                                        {t('common.cancel')}
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={processing || remainingChars < 0}
                                        className={`inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-700 dark:hover:bg-indigo-600 ${(processing || remainingChars < 0) ? 'opacity-50' : ''}`}
                                    >
                                        {t('messages.send')}
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