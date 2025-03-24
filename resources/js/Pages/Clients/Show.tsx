import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Message {
    id: number;
    content: string;
    status: string;
    sent_at: string;
    campaign?: {
        id: number;
        name: string;
    };
}

interface Client {
    id: number;
    name: string;
    email: string;
    phone: string;
    address?: string;
    notes?: string;
    category: {
        id: number;
        name: string;
    };
    messages: Message[];
    created_at: string;
    messages_count: number;
    successful_messages_count: number;
}

interface ClientShowProps extends PageProps {
    client: Client;
}

export default function Show({ auth, client }: ClientShowProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered':
                return 'bg-green-100 text-green-800';
            case 'failed':
                return 'bg-red-100 text-red-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'delivered':
                return 'Livré';
            case 'failed':
                return 'Échoué';
            case 'pending':
                return 'En attente';
            default:
                return 'Inconnu';
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <h2 className="font-playfair text-xl font-semibold leading-tight text-gray-800">
                        Détails du Client
                    </h2>
                    <div className="flex gap-4">
                        <Link
                            href={route('clients.edit', client.id)}
                            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                        >
                            Modifier
                        </Link>
                        <Link
                            href={route('clients.index')}
                            className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                            Retour à la liste
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={`Client: ${client.name}`} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Client Information Card */}
                        <div className="col-span-1 overflow-hidden rounded-lg bg-white shadow-lg">
                            <div className="border-b border-gray-200 bg-gray-50 px-4 py-5 sm:px-6">
                                <h3 className="font-playfair text-lg font-medium leading-6 text-gray-900">
                                    Informations du Client
                                </h3>
                            </div>
                            <div className="px-4 py-5 sm:p-6">
                                <dl className="grid grid-cols-1 gap-x-4 gap-y-6">
                                    <div>
                                        <dt className="font-montserrat text-sm font-medium text-gray-500">Nom</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{client.name}</dd>
                                    </div>
                                    <div>
                                        <dt className="font-montserrat text-sm font-medium text-gray-500">Email</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{client.email || '-'}</dd>
                                    </div>
                                    <div>
                                        <dt className="font-montserrat text-sm font-medium text-gray-500">Téléphone</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{client.phone}</dd>
                                    </div>
                                    <div>
                                        <dt className="font-montserrat text-sm font-medium text-gray-500">Catégorie</dt>
                                        <dd className="mt-1">
                                            <span className="inline-flex rounded-full bg-violet-100 px-2 text-xs font-semibold leading-5 text-violet-800">
                                                {client.category.name}
                                            </span>
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="font-montserrat text-sm font-medium text-gray-500">Adresse</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{client.address || '-'}</dd>
                                    </div>
                                    <div>
                                        <dt className="font-montserrat text-sm font-medium text-gray-500">Notes</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{client.notes || '-'}</dd>
                                    </div>
                                    <div>
                                        <dt className="font-montserrat text-sm font-medium text-gray-500">Client depuis</dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            {format(new Date(client.created_at), 'dd MMMM yyyy', { locale: fr })}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </div>

                        {/* Statistics Card */}
                        <div className="col-span-2 overflow-hidden rounded-lg bg-white shadow-lg">
                            <div className="border-b border-gray-200 bg-gray-50 px-4 py-5 sm:px-6">
                                <h3 className="font-playfair text-lg font-medium leading-6 text-gray-900">
                                    Statistiques des Messages
                                </h3>
                            </div>
                            <div className="px-4 py-5 sm:p-6">
                                <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                                    <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                                        <dt className="truncate font-montserrat text-sm font-medium text-gray-500">
                                            Total Messages
                                        </dt>
                                        <dd className="mt-1 font-playfair text-3xl font-semibold tracking-tight text-gray-900">
                                            {client.messages_count}
                                        </dd>
                                    </div>
                                    <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                                        <dt className="truncate font-montserrat text-sm font-medium text-gray-500">
                                            Messages Livrés
                                        </dt>
                                        <dd className="mt-1 font-playfair text-3xl font-semibold tracking-tight text-gray-900">
                                            {client.successful_messages_count}
                                        </dd>
                                    </div>
                                    <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                                        <dt className="truncate font-montserrat text-sm font-medium text-gray-500">
                                            Taux de Livraison
                                        </dt>
                                        <dd className="mt-1 font-playfair text-3xl font-semibold tracking-tight text-gray-900">
                                            {client.messages_count > 0
                                                ? Math.round((client.successful_messages_count / client.messages_count) * 100)
                                                : 0}
                                            %
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </div>

                        {/* Message History */}
                        <div className="col-span-3 overflow-hidden rounded-lg bg-white shadow-lg">
                            <div className="border-b border-gray-200 bg-gray-50 px-4 py-5 sm:px-6">
                                <h3 className="font-playfair text-lg font-medium leading-6 text-gray-900">
                                    Historique des Messages
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                Message
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                Campagne
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                Statut
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {client.messages.map((message) => (
                                            <tr key={message.id}>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                    {format(new Date(message.sent_at), 'dd/MM/yyyy HH:mm')}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900">{message.content}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                    {message.campaign ? (
                                                        <Link
                                                            href={route('campaigns.show', message.campaign.id)}
                                                            className="text-indigo-600 hover:text-indigo-900"
                                                        >
                                                            {message.campaign.name}
                                                        </Link>
                                                    ) : (
                                                        'Message Direct'
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm">
                                                    <span
                                                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(
                                                            message.status
                                                        )}`}
                                                    >
                                                        {getStatusLabel(message.status)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {client.messages.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                                                    Aucun message envoyé à ce client
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 