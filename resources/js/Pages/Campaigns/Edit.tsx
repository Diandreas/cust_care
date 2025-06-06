// resources/js/Pages/Campaigns/Edit.tsx
import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
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

interface Campaign {
    id: number;
    name: string;
    message_content: string;
    scheduled_at: string | null;
    status: string;
    recipients_count: number;
    recipients: Client[];
}

interface EditCampaignProps {
    campaign: Campaign;
    templates: Template[];
    selected_clients: number[];
    [key: string]: unknown;
}

export default function EditCampaign({
    auth,
    campaign,
    templates,
    selected_clients
}: PageProps<EditCampaignProps>) {
    const { t } = useTranslation();
    const [step, setStep] = useState(1);
    const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
    const [remainingChars, setRemainingChars] = useState(160 - (campaign.message_content?.length || 0));
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredClients, setFilteredClients] = useState<Client[]>([]);

    const { data, setData, put, processing, errors } = useForm({
        name: campaign.name,
        message_content: campaign.message_content,
        scheduled_at: campaign.scheduled_at || '',
        send_now: !campaign.scheduled_at,
        client_ids: selected_clients || [],
        selected_all_clients: false,
    });

    // Initialiser les clients filtrés
    useEffect(() => {
        // Filtrer les clients
        const allClients = [];
        setFilteredClients(allClients);
    }, []);

    // Mettre à jour les clients filtrés lorsque le terme de recherche change
    useEffect(() => {
        const allClients = [];
        if (searchTerm) {
            setFilteredClients(
                allClients.filter(client =>
                    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    client.phone.includes(searchTerm)
                )
            );
        } else {
            setFilteredClients(allClients);
        }
    }, [searchTerm]);

    // Gérer le changement de template
    const handleTemplateChange = (templateId: number) => {
        setSelectedTemplate(templateId);
        const template = templates.find((t) => t.id === templateId);
        if (template) {
            setData('message_content', template.content);
            updateRemainingChars(template.content);
        }
    };

    // Mettre à jour le compteur de caractères
    const updateRemainingChars = (content: string) => {
        const smsLength = content.length;
        const remainingChars = 160 - smsLength;
        setRemainingChars(remainingChars);
    };

    // Gérer la sélection des clients
    const handleClientSelection = (clientId: number) => {
        if (data.client_ids.includes(clientId)) {
            setData('client_ids', data.client_ids.filter((id) => id !== clientId));
        } else {
            setData('client_ids', [...data.client_ids, clientId]);
        }
    };

    // Gérer la soumission du formulaire
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('campaigns.update', campaign.id));
    };

    // Récupérer tous les clients disponibles
    const allClients = [];

    // Suivant du formulaire multi-étapes
    const handleNext = () => {
        if (step === 1 && !data.name) {
            alert(t('campaigns.nameRequired'));
            return;
        }
        if (step === 2 && !data.message_content) {
            alert(t('campaigns.messageRequired'));
            return;
        }
        if (step === 3 && data.client_ids.length === 0) {
            alert(t('campaigns.recipientsRequired'));
            return;
        }

        setStep(step + 1);
    };

    // Précédent du formulaire multi-étapes
    const handlePrevious = () => {
        setStep(step - 1);
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">{t('campaigns.edit')}</h2>}
        >
            <Head title={t('campaigns.edit')} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="mb-6 overflow-hidden bg-white shadow-sm dark:bg-gray-800 sm:rounded-lg">
                        {/* Étapes du formulaire */}
                        <div className="border-b border-gray-200 bg-white px-4 py-5 dark:border-gray-700 dark:bg-gray-800 sm:px-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">{t('campaigns.editCampaign')}</h3>
                                <div className="flex items-center">
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                                        1
                                    </div>
                                    <div className={`mx-2 h-0.5 w-8 ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                                        2
                                    </div>
                                    <div className={`mx-2 h-0.5 w-8 ${step >= 3 ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 3 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                                        3
                                    </div>
                                    <div className={`mx-2 h-0.5 w-8 ${step >= 4 ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 4 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                                        4
                                    </div>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {/* Étape 1: Informations de base */}
                            {step === 1 && (
                                <div className="px-4 py-5 sm:p-6">
                                    <h4 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">{t('campaigns.step1Title')}</h4>
                                    <div className="mb-6">
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('campaigns.name')} *
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                            required
                                        />
                                        {errors.name && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
                                    </div>
                                </div>
                            )}

                            {/* Étape 2: Contenu du message */}
                            {step === 2 && (
                                <div className="px-4 py-5 sm:p-6">
                                    <h4 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">{t('campaigns.step2Title')}</h4>
                                    <div className="mb-4">
                                        <label htmlFor="template" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('campaigns.selectTemplate')}
                                        </label>
                                        <select
                                            id="template"
                                            name="template"
                                            value={selectedTemplate || ''}
                                            onChange={(e) => handleTemplateChange(Number(e.target.value))}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                        >
                                            <option value="">{t('campaigns.noTemplate')}</option>
                                            {templates.map((template) => (
                                                <option key={template.id} value={template.id}>
                                                    {template.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mb-6">
                                        <label htmlFor="message_content" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('campaigns.messageContent')} *
                                        </label>
                                        <textarea
                                            id="message_content"
                                            name="message_content"
                                            rows={5}
                                            value={data.message_content}
                                            onChange={(e) => {
                                                setData('message_content', e.target.value);
                                                updateRemainingChars(e.target.value);
                                            }}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                            required
                                        ></textarea>
                                        {errors.message_content && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.message_content}</p>}
                                        <div className="mt-2 flex justify-between">
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {t('campaigns.charactersRemaining')}: {remainingChars}
                                            </span>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {Math.ceil(data.message_content.length / 160)} SMS
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Étape 3: Destinataires */}
                            {step === 3 && (
                                <div className="px-4 py-5 sm:p-6">
                                    <h4 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">{t('campaigns.step3Title')}</h4>

                                    <div className="mb-6">
                                        <div className="flex justify-between items-center">
                                            <h5 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{t('campaigns.selectIndividualClients')}</h5>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {data.client_ids.length} {t('campaigns.clientsSelected')}
                                            </span>
                                        </div>

                                        <div className="relative mb-4">
                                            <input
                                                type="text"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                placeholder={t('campaigns.searchClients')}
                                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            />
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </div>
                                        </div>

                                        <div className="max-h-60 overflow-y-auto rounded border border-gray-300 p-2 dark:border-gray-600">
                                            {filteredClients.length > 0 ? (
                                                <div className="space-y-2">
                                                    {filteredClients.map((client) => (
                                                        <div key={client.id} className="flex items-center">
                                                            <input
                                                                id={`client-${client.id}`}
                                                                name={`client-${client.id}`}
                                                                type="checkbox"
                                                                checked={data.client_ids.includes(client.id)}
                                                                onChange={() => handleClientSelection(client.id)}
                                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                                                            />
                                                            <label htmlFor={`client-${client.id}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                                                {client.name} ({client.phone})
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                                    {searchTerm ? t('campaigns.noSearchResults') : t('campaigns.noClientsAvailable')}
                                                </div>
                                            )}
                                        </div>
                                        {errors.client_ids && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.client_ids}</p>}

                                        <div className="flex justify-between mt-2">
                                            <button
                                                type="button"
                                                onClick={() => setData('client_ids', [])}
                                                className="text-sm text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300"
                                            >
                                                {t('campaigns.deselectAll')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setData('client_ids', allClients.map(c => c.id))}
                                                className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                                            >
                                                {t('campaigns.selectAll')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Étape 4: Programmation et Récapitulatif */}
                            {step === 4 && (
                                <div className="px-4 py-5 sm:p-6">
                                    <h4 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">{t('campaigns.step4Title')}</h4>

                                    <div className="mb-6">
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('campaigns.sendingOptions')}</label>
                                            <div className="mt-2 space-y-2">
                                                <div className="flex items-center">
                                                    <input
                                                        id="send_now"
                                                        name="send_timing"
                                                        type="radio"
                                                        checked={data.send_now}
                                                        onChange={() => setData('send_now', true)}
                                                        className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600"
                                                    />
                                                    <label htmlFor="send_now" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                                        {t('campaigns.sendImmediately')}
                                                    </label>
                                                </div>
                                                <div className="flex items-center">
                                                    <input
                                                        id="send_later"
                                                        name="send_timing"
                                                        type="radio"
                                                        checked={!data.send_now}
                                                        onChange={() => setData('send_now', false)}
                                                        className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600"
                                                    />
                                                    <label htmlFor="send_later" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                                        {t('campaigns.scheduleSending')}
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        {!data.send_now && (
                                            <div className="mb-4">
                                                <label htmlFor="scheduled_at" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    {t('campaigns.scheduleDateTime')} *
                                                </label>
                                                <input
                                                    type="datetime-local"
                                                    id="scheduled_at"
                                                    name="scheduled_at"
                                                    value={data.scheduled_at}
                                                    onChange={(e) => setData('scheduled_at', e.target.value)}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                                    required={!data.send_now}
                                                />
                                                {errors.scheduled_at && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.scheduled_at}</p>}
                                            </div>
                                        )}
                                    </div>

                                    {/* Récapitulatif */}
                                    <div className="mt-6 rounded-md bg-gray-50 p-4 dark:bg-gray-700">
                                        <h5 className="mb-4 text-base font-medium text-gray-900 dark:text-white">{t('campaigns.summary')}</h5>

                                        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div>
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('campaigns.name')}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{data.name}</p>
                                            </div>

                                            <div>
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('campaigns.recipients')}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{data.client_ids.length} {t('common.clients')}</p>
                                            </div>

                                            <div>
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('campaigns.sendingTime')}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {data.send_now ? t('campaigns.immediately') : new Date(data.scheduled_at).toLocaleString()}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('campaigns.messageSize')}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {data.message_content.length} {t('campaigns.characters')} ({Math.ceil(data.message_content.length / 160)} SMS)
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('campaigns.messagePreview')}</p>
                                            <div className="mt-1 rounded-md bg-white p-3 dark:bg-gray-800">
                                                <p className="whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-400">{data.message_content}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Navigation entre les étapes */}
                            <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700 sm:px-6">
                                <div className="flex justify-between">
                                    <button
                                        type="button"
                                        onClick={handlePrevious}
                                        disabled={step === 1}
                                        className={`inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 ${step === 1 ? 'cursor-not-allowed opacity-50' : ''}`}
                                    >
                                        {t('common.previous')}
                                    </button>
                                    {step < 4 ? (
                                        <button
                                            type="button"
                                            onClick={handleNext}
                                            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-700 dark:hover:bg-indigo-600"
                                        >
                                            {t('common.next')}
                                        </button>
                                    ) : (
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-700 dark:hover:bg-indigo-600"
                                        >
                                            {t('campaigns.updateCampaign')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
