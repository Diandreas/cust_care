// resources/js/Pages/Campaigns/Create.tsx
import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';
import AdvancedRecipientSelector from '@/Components/AdvancedRecipientSelector';
import MessagePreview from '@/Components/MessagePreview';

interface Client {
    id: number;
    name: string;
    phone: string;
    email?: string;
    tags: { id: number; name: string }[];
    last_message_date?: string;
}

interface Tag {
    id: number;
    name: string;
    clients_count: number;
}

interface Template {
    id: number;
    name: string;
    content: string;
}

interface CreateCampaignProps {
    templates: Template[];
    tags: Tag[];
    clients: Client[];
    [key: string]: unknown;
}

export default function CreateCampaign({
    auth,
    templates,
    tags,
    clients,
}: PageProps<CreateCampaignProps>) {
    const { t } = useTranslation();
    const [step, setStep] = useState(1);
    const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
    const [remainingChars, setRemainingChars] = useState(160);
    const [selectionMethod, setSelectionMethod] = useState('advanced');
    const [searchTerm, setSearchTerm] = useState('');
    const [showSelectedClients, setShowSelectedClients] = useState(false);
    const [previewClient, setPreviewClient] = useState<Client | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        message_content: '',
        scheduled_at: '',
        send_now: true,
        client_ids: [] as number[],
        selected_all_clients: false,
        filter_criteria: {} as any,
    });

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

    // Gérer la sélection des clients avec le sélecteur avancé
    const handleAdvancedClientSelection = (selectedClientIds: number[]) => {
        setData('client_ids', selectedClientIds);
    };

    // Gérer la sélection individuelle d'un client
    const handleClientSelection = (clientId: number) => {
        if (data.client_ids.includes(clientId)) {
            setData('client_ids', data.client_ids.filter(id => id !== clientId));
        } else {
            setData('client_ids', [...data.client_ids, clientId]);
        }
    };

    // Gérer la soumission du formulaire - MODIFIÉ
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Empêcher les soumissions multiples
        if (isSubmitting || processing) {
            return;
        }

        // Vérifier que nous sommes bien à l'étape 4
        if (step !== 4) {
            setStep(4);
            return;
        }

        // Vérifications des champs obligatoires
        if (!data.name) {
            alert(t('campaigns.nameRequired'));
            setStep(1);
            return;
        }

        if (!data.message_content) {
            alert(t('campaigns.messageRequired'));
            setStep(2);
            return;
        }

        if (data.client_ids.length === 0) {
            alert(t('campaigns.recipientsRequired'));
            setStep(3);
            return;
        }

        // Vérifier la programmation si l'envoi n'est pas immédiat
        if (!data.send_now && !data.scheduled_at) {
            alert(t('campaigns.scheduleRequired'));
            return;
        }

        // Demander confirmation avant création de la campagne
        if (confirm(t('campaigns.confirmCreation'))) {
            setIsSubmitting(true);
            post(route('campaigns.store'), {
                onFinish: () => setIsSubmitting(false)
            });
        }
    };

    // Récupérer tous les clients disponibles
    const allClients = clients || [];

    // Filtrer les clients pour la recherche manuelle
    const filteredClients = searchTerm
        ? allClients.filter(client =>
            client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.phone.includes(searchTerm))
        : allClients;

    // Détails des clients sélectionnés pour l'aperçu
    const selectedClientsDetails = allClients.filter(client =>
        data.client_ids.includes(client.id)
    );

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

        // Si on est à l'étape 3 et qu'il y a des destinataires sélectionnés, demander confirmation
        if (step === 3 && data.client_ids.length > 0) {
            if (confirm(t('campaigns.confirmRecipients', { count: data.client_ids.length }))) {
                setStep(step + 1);
            }
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
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">{t('campaigns.create')}</h2>}
        >
            <Head title={t('campaigns.create')} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="mb-6 overflow-hidden bg-white shadow-sm dark:bg-gray-800 sm:rounded-lg">
                        {/* Étapes du formulaire */}
                        <div className="border-b border-gray-200 bg-white px-4 py-5 dark:border-gray-700 dark:bg-gray-800 sm:px-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">{t('campaigns.createNew')}</h3>
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

                                    {/* Variables disponibles */}
                                    <div className="mb-6">
                                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {t('campaigns.availableVariables')}
                                        </h5>
                                        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
                                            {[
                                                { id: 'client.name', label: t('campaigns.variables.clientName') },
                                                { id: 'client.phone', label: t('campaigns.variables.clientPhone') },
                                                { id: 'client.email', label: t('campaigns.variables.clientEmail') },
                                                { id: 'date', label: t('campaigns.variables.date') },
                                                { id: 'time', label: t('campaigns.variables.time') }
                                            ].map(variable => (
                                                <button
                                                    key={variable.id}
                                                    type="button"
                                                    onClick={() => {
                                                        const newContent = data.message_content + `{{${variable.id}}}`;
                                                        setData('message_content', newContent);
                                                        updateRemainingChars(newContent);
                                                    }}
                                                    className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                                >
                                                    {variable.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Prévisualisation du message */}
                                    <div className="mb-6">
                                        <div className="flex justify-between items-center mb-2">
                                            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {t('campaigns.messagePreview')}
                                            </h5>
                                            {clients.length > 0 && (
                                                <div className="flex items-center">
                                                    <label htmlFor="preview_client" className="mr-2 text-sm text-gray-500 dark:text-gray-400">
                                                        {t('campaigns.previewAs')}:
                                                    </label>
                                                    <select
                                                        id="preview_client"
                                                        value={previewClient?.id || ''}
                                                        onChange={(e) => {
                                                            const clientId = Number(e.target.value);
                                                            const client = clients.find(c => c.id === clientId) || null;
                                                            setPreviewClient(client);
                                                        }}
                                                        className="text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                                    >
                                                        <option value="">{t('campaigns.selectClient')}</option>
                                                        {clients.slice(0, 10).map(client => (
                                                            <option key={client.id} value={client.id}>
                                                                {client.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>

                                        <MessagePreview
                                            messageContent={data.message_content}
                                            selectedClient={previewClient}
                                            className="mt-4"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Étape 3: Destinataires */}
                            {step === 3 && (
                                <div className="px-4 py-5 sm:p-6">
                                    <h4 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">{t('campaigns.step3Title')}</h4>

                                    <div className="mb-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('campaigns.selectRecipients')}</h5>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {data.client_ids.length} {t('campaigns.clientsSelected')}
                                            </span>
                                        </div>

                                        {/* Onglets de méthode de sélection */}
                                        <div className="border-b border-gray-200 mb-4">
                                            <nav className="-mb-px flex" aria-label="Tabs">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectionMethod('advanced')}
                                                    className={`${selectionMethod === 'advanced'
                                                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                                        } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm`}
                                                >
                                                    {t('campaigns.advancedFilters')}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectionMethod('manual')}
                                                    className={`${selectionMethod === 'manual'
                                                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                                        } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm`}
                                                >
                                                    {t('campaigns.manualSelection')}
                                                </button>
                                            </nav>
                                        </div>

                                        {/* Contenu selon la méthode sélectionnée */}
                                        {selectionMethod === 'advanced' && (
                                            <AdvancedRecipientSelector
                                                clients={allClients}
                                                tags={tags}
                                                onSelectionChange={(selectedIds) => setData('client_ids', selectedIds)}
                                            />
                                        )}

                                        {selectionMethod === 'manual' && (
                                            <div className="space-y-4">
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

                                                <div className="max-h-80 overflow-y-auto border border-gray-300 rounded-md dark:border-gray-600">
                                                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                                        {filteredClients.map((client) => (
                                                            <li key={client.id} className="px-4 py-3 flex items-center hover:bg-gray-50 dark:hover:bg-gray-700">
                                                                <input
                                                                    id={`client-${client.id}`}
                                                                    name={`client-${client.id}`}
                                                                    type="checkbox"
                                                                    checked={data.client_ids.includes(client.id)}
                                                                    onChange={() => handleClientSelection(client.id)}
                                                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                                                                />
                                                                <label htmlFor={`client-${client.id}`} className="ml-3 block">
                                                                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">{client.name}</span>
                                                                    <span className="block text-sm text-gray-500 dark:text-gray-400">{client.phone}</span>
                                                                </label>
                                                            </li>
                                                        ))}
                                                        {filteredClients.length === 0 && (
                                                            <li className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                                                                {searchTerm ? t('campaigns.noSearchResults') : t('campaigns.noClientsAvailable')}
                                                            </li>
                                                        )}
                                                    </ul>
                                                </div>

                                                <div className="flex justify-between">
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
                                        )}
                                    </div>

                                    {/* Notification de validation */}
                                    {data.client_ids.length > 0 ? (
                                        <div className="mt-4 p-4 rounded-md bg-green-50 dark:bg-green-900">
                                            <div className="flex">
                                                <div className="flex-shrink-0">
                                                    <svg className="h-5 w-5 text-green-400 dark:text-green-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                                        {t('campaigns.recipientsValidMessage', { count: data.client_ids.length })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-4 p-4 rounded-md bg-yellow-50 dark:bg-yellow-900">
                                            <div className="flex">
                                                <div className="flex-shrink-0">
                                                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                                        {t('campaigns.noRecipientsSelected')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Récapitulatif des clients sélectionnés */}
                                    {data.client_ids.length > 0 && (
                                        <div className="mt-6 bg-gray-50 p-4 rounded-md dark:bg-gray-700">
                                            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                {t('campaigns.selectedRecipients')}
                                            </h5>

                                            <div className="flex items-center justify-between">
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {data.client_ids.length} {t('common.clients')}
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => setShowSelectedClients(!showSelectedClients)}
                                                    className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                >
                                                    {showSelectedClients ? t('campaigns.hideList') : t('campaigns.showList')}
                                                </button>
                                            </div>

                                            {showSelectedClients && (
                                                <div className="mt-2 max-h-60 overflow-y-auto">
                                                    <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                                                        {selectedClientsDetails.map(client => (
                                                            <li key={client.id} className="py-2 flex justify-between items-center">
                                                                <div className="text-sm text-gray-800 dark:text-gray-200">
                                                                    {client.name} <span className="text-gray-500 dark:text-gray-400">({client.phone})</span>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleClientSelection(client.id)}
                                                                    className="text-sm text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300"
                                                                >
                                                                    {t('common.remove')}
                                                                </button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}
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
                                                        onChange={() => setData('send_now', false as any)}
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
                                        disabled={step === 1 || processing || isSubmitting}
                                        className={`inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 ${(step === 1 || processing || isSubmitting) ? 'cursor-not-allowed opacity-50' : ''}`}
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
                                            disabled={processing || isSubmitting}
                                            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-700 dark:hover:bg-indigo-600"
                                        >
                                            {(processing || isSubmitting) ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    {t('common.processing')}
                                                </>
                                            ) : (
                                                t('campaigns.createCampaign')
                                            )}
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