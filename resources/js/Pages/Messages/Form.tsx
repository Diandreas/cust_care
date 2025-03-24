import { useEffect, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import Modal from '@/Components/Modal';

interface Client {
    id: number;
    name: string;
    phone: string;
}

interface Category {
    id: number;
    name: string;
}

interface Template {
    id: number;
    name: string;
    content: string;
}

interface MessageFormProps extends PageProps {
    clients: Client[];
    categories: Category[];
    templates: Template[];
}

export default function Form({ auth, clients, categories, templates }: MessageFormProps) {
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [recipients, setRecipients] = useState<Client[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredClients, setFilteredClients] = useState<Client[]>(clients);
    const [selectedCategory, setSelectedCategory] = useState<number | ''>('');

    const { data, setData, post, processing, errors, reset } = useForm({
        recipients: [] as number[],
        message: '',
        template_id: '',
    });

    useEffect(() => {
        let filtered = clients;

        if (selectedCategory !== '') {
            // Cette fonction simulée serait remplacée par un vrai filtre basé sur la catégorie
            // Elle dépendrait de la structure de vos données
            filtered = clients.filter(client => {
                // Simulons que chaque client a une propriété category_id
                return (client as any).category_id === selectedCategory;
            });
        }

        if (searchTerm) {
            filtered = filtered.filter(client =>
                client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                client.phone.includes(searchTerm)
            );
        }

        setFilteredClients(filtered);
    }, [searchTerm, selectedCategory, clients]);

    const handleTemplateChange = (templateId: string) => {
        const template = templates.find((t) => t.id === parseInt(templateId));
        setData({
            ...data,
            template_id: templateId,
            message: template?.content || data.message,
        });
    };

    const handleRecipientToggle = (clientId: number) => {
        const updatedRecipients = data.recipients.includes(clientId)
            ? data.recipients.filter((id) => id !== clientId)
            : [...data.recipients, clientId];

        setData('recipients', updatedRecipients);

        // Mettre à jour la liste d'affichage pour les destinataires sélectionnés
        const selectedClients = clients.filter((client) => updatedRecipients.includes(client.id));
        setRecipients(selectedClients);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('messages.send'));
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-playfair text-xl font-semibold leading-tight text-gray-800">
                    Envoyer un Message
                </h2>
            }
        >
            <Head title="Envoyer un Message" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <form onSubmit={submit} className="space-y-8">
                        <div className="overflow-hidden rounded-lg bg-white shadow">
                            <div className="border-b border-gray-200 bg-gray-50 px-4 py-5 sm:px-6">
                                <h3 className="font-playfair text-lg font-medium leading-6 text-gray-900">
                                    Destinataires
                                </h3>
                            </div>
                            <div className="px-4 py-5 sm:p-6">
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-4 sm:flex-row">
                                        <div className="flex-1">
                                            <InputLabel htmlFor="search" value="Rechercher un client" />
                                            <TextInput
                                                id="search"
                                                type="search"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="mt-1 block w-full"
                                                placeholder="Nom ou numéro de téléphone"
                                            />
                                        </div>
                                        <div className="sm:w-64">
                                            <InputLabel htmlFor="category" value="Filtrer par catégorie" />
                                            <select
                                                id="category"
                                                value={selectedCategory}
                                                onChange={(e) => setSelectedCategory(e.target.value === '' ? '' : parseInt(e.target.value))}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            >
                                                <option value="">Toutes les catégories</option>
                                                {categories.map((category) => (
                                                    <option key={category.id} value={category.id}>
                                                        {category.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <h4 className="font-montserrat text-sm font-medium text-gray-700">
                                            Sélectionnez des destinataires
                                        </h4>
                                        <div className="mt-2 max-h-60 overflow-y-auto rounded-md border border-gray-300 bg-white">
                                            <ul className="divide-y divide-gray-200">
                                                {filteredClients.length > 0 ? (
                                                    filteredClients.map((client) => (
                                                        <li key={client.id} className="flex items-center p-3">
                                                            <input
                                                                type="checkbox"
                                                                id={`client-${client.id}`}
                                                                checked={data.recipients.includes(client.id)}
                                                                onChange={() => handleRecipientToggle(client.id)}
                                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                            />
                                                            <label
                                                                htmlFor={`client-${client.id}`}
                                                                className="ml-3 flex flex-1 items-center"
                                                            >
                                                                <div className="h-8 w-8 flex-shrink-0">
                                                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-600">
                                                                        {client.name.charAt(0)}
                                                                    </span>
                                                                </div>
                                                                <div className="ml-3">
                                                                    <p className="font-medium text-gray-900">{client.name}</p>
                                                                    <p className="text-sm text-gray-500">{client.phone}</p>
                                                                </div>
                                                            </label>
                                                        </li>
                                                    ))
                                                ) : (
                                                    <li className="p-3 text-center text-sm text-gray-500">
                                                        Aucun client trouvé
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <h4 className="font-montserrat text-sm font-medium text-gray-700">
                                            Destinataires sélectionnés ({recipients.length})
                                        </h4>
                                        {recipients.length > 0 ? (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {recipients.map((client) => (
                                                    <div
                                                        key={client.id}
                                                        className="inline-flex items-center rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-violet-800"
                                                    >
                                                        {client.name}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRecipientToggle(client.id)}
                                                            className="ml-1 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-violet-400 hover:bg-violet-200 hover:text-violet-500 focus:outline-none"
                                                        >
                                                            <span className="sr-only">Retirer</span>
                                                            <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                                                                <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="mt-2 text-sm text-gray-500">
                                                Aucun destinataire sélectionné
                                            </p>
                                        )}
                                    </div>

                                    <InputError message={errors.recipients} className="mt-2" />
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
                            <PrimaryButton disabled={processing || data.recipients.length === 0}>
                                Envoyer le message
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
                                            E
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
                        <p className="mt-4 text-sm text-gray-500">
                            Destinataires: {recipients.length} client{recipients.length !== 1 ? 's' : ''}
                        </p>
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