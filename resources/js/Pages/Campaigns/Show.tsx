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
    delivered_at: string | null;
    client: {
        id: number;
        name: string;
        phone: string;
    };
}

interface Campaign {
    id: number;
    name: string;
    message: string;
    status: 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    scheduled_at: string | null;
    completed_at: string | null;
    created_at: string;
    total_recipients: number;
    sent_count: number;
    delivered_count: number;
    failed_count: number;
    messages: Message[];
    categories: Array<{
        id: number;
        name: string;
        clients_count: number;
    }>;
}

interface CampaignShowProps extends PageProps {
    campaign: Campaign;
}

export default function Show({ auth, campaign }: CampaignShowProps) {
    const getStatusColor = (status: Campaign['status']) => {
        switch (status) {
            case 'draft':
                return 'bg-gray-100 text-gray-800';
            case 'scheduled':
                return 'bg-blue-100 text-blue-800';
            case 'in_progress':
                return 'bg-yellow-100 text-yellow-800';
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
        }
    };

    const getStatusLabel = (status: Campaign['status']) => {
        switch (status) {
            case 'draft':
                return 'Brouillon';
            case 'scheduled':
                return 'Programmée';
            case 'in_progress':
                return 'En cours';
            case 'completed':
                return 'Terminée';
            case 'cancelled':
                return 'Annulée';
        }
    };

    const getMessageStatusColor = (status: string) => {
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

    const getMessageStatusLabel = (status: string) => {
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

    const formatDate = (date: string | null) => {
        if (!date) return '-';
        return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: fr });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="font-playfair text-xl font-semibold leading-tight text-gray-800">
                        Détails de la Campagne
                    </h2>
                    <div className="flex gap-4">
                        {campaign.status === 'draft' && (
                            <Link
                                href={route('campaigns.edit', campaign.id)}
                                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                            >
                                Modifier
                            </Link>
                        )}
                        <Link
                            href={route('campaigns.index')}
                            className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                            Retour à la liste
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={`Campagne: ${campaign.name}`} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Campaign Information */}
                        <div className="col-span-1 space-y-6">
                            <div className="overflow-hidden rounded-lg bg-white shadow">
                                <div className="border-b border-gray-200 bg-gray-50 px-4 py-5 sm:px-6">
                                    <h3 className="font-playfair text-lg font-medium leading-6 text-gray-900">
                                        Informations
                                    </h3>
                                </div>
                                <div className="px-4 py-5 sm:p-6">
                                    <dl className="grid grid-cols-1 gap-x-4 gap-y-6">
                                        <div>
                                            <dt className="font-montserrat text-sm font-medium text-gray-500">Nom</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{campaign.name}</dd>
                                        </div>
                                        <div>
                                            <dt className="font-montserrat text-sm font-medium text-gray-500">Statut</dt>
                                            <dd className="mt-1">
                                                <span
                                                    className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(
                                                        campaign.status
                                                    )}`}
                                                >
                                                    {getStatusLabel(campaign.status)}
                                                </span>
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="font-montserrat text-sm font-medium text-gray-500">
                                                Date de création
                                            </dt>
                                            <dd className="mt-1 text-sm text-gray-900">
                                                {formatDate(campaign.created_at)}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="font-montserrat text-sm font-medium text-gray-500">
                                                Programmée pour
                                            </dt>
                                            <dd className="mt-1 text-sm text-gray-900">
                                                {formatDate(campaign.scheduled_at)}
                                            </dd>
                                        </div>
                                        {campaign.completed_at && (
                                            <div>
                                                <dt className="font-montserrat text-sm font-medium text-gray-500">
                                                    Terminée le
                                                </dt>
                                                <dd className="mt-1 text-sm text-gray-900">
                                                    {formatDate(campaign.completed_at)}
                                                </dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-lg bg-white shadow">
                                <div className="border-b border-gray-200 bg-gray-50 px-4 py-5 sm:px-6">
                                    <h3 className="font-playfair text-lg font-medium leading-6 text-gray-900">Message</h3>
                                </div>
                                <div className="px-4 py-5 sm:p-6">
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
                                                        {campaign.message}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="mt-2 text-sm text-gray-500">
                                        {campaign.message.length} caractère{campaign.message.length !== 1 ? 's' : ''} (
                                        {Math.ceil(campaign.message.length / 160)} SMS)
                                    </p>
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
                                        {campaign.categories.map((category) => (
                                            <div
                                                key={category.id}
                                                className="flex items-center justify-between rounded-lg border bg-white p-4"
                                            >
                                                <div>
                                                    <p className="font-medium text-gray-900">{category.name}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {category.clients_count} client
                                                        {category.clients_count !== 1 ? 's' : ''}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Statistics and Messages */}
                        <div className="col-span-2 space-y-6">
                            {/* Statistics */}
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                                    <dt className="truncate font-montserrat text-sm font-medium text-gray-500">
                                        Total Messages
                                    </dt>
                                    <dd className="mt-1 font-playfair text-3xl font-semibold tracking-tight text-gray-900">
                                        {campaign.total_recipients}
                                    </dd>
                                </div>
                                <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                                    <dt className="truncate font-montserrat text-sm font-medium text-gray-500">
                                        Messages Livrés
                                    </dt>
                                    <dd className="mt-1 font-playfair text-3xl font-semibold tracking-tight text-green-600">
                                        {campaign.delivered_count}
                                    </dd>
                                </div>
                                <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                                    <dt className="truncate font-montserrat text-sm font-medium text-gray-500">
                                        Messages Échoués
                                    </dt>
                                    <dd className="mt-1 font-playfair text-3xl font-semibold tracking-tight text-red-600">
                                        {campaign.failed_count}
                                    </dd>
                                </div>
                            </div>

                            {/* Progress */}
                            <div className="overflow-hidden rounded-lg bg-white shadow">
                                <div className="border-b border-gray-200 bg-gray-50 px-4 py-5 sm:px-6">
                                    <h3 className="font-playfair text-lg font-medium leading-6 text-gray-900">
                                        Progression
                                    </h3>
                                </div>
                                <div className="px-4 py-5 sm:p-6">
                                    <div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">
                                                {campaign.sent_count} message{campaign.sent_count !== 1 ? 's' : ''} envoyé
                                                {campaign.sent_count !== 1 ? 's' : ''}
                                            </span>
                                            <span className="font-medium text-gray-900">
                                                {campaign.total_recipients > 0
                                                    ? Math.round((campaign.sent_count / campaign.total_recipients) * 100)
                                                    : 0}
                                                %
                                            </span>
                                        </div>
                                        <div className="mt-2 overflow-hidden rounded-full bg-gray-200">
                                            <div
                                                className="h-2 rounded-full bg-violet-600"
                                                style={{
                                                    width: `${campaign.total_recipients > 0
                                                        ? (campaign.sent_count / campaign.total_recipients) * 100
                                                        : 0
                                                        }%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Messages List */}
                            <div className="overflow-hidden rounded-lg bg-white shadow">
                                <div className="border-b border-gray-200 bg-gray-50 px-4 py-5 sm:px-6">
                                    <h3 className="font-playfair text-lg font-medium leading-6 text-gray-900">
                                        Messages Envoyés
                                    </h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                    Client
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                    Envoyé le
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                    Livré le
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                    Statut
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white">
                                            {campaign.messages.map((message) => (
                                                <tr key={message.id}>
                                                    <td className="whitespace-nowrap px-6 py-4">
                                                        <div className="flex items-center">
                                                            <div className="h-8 w-8 flex-shrink-0">
                                                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-600">
                                                                    {message.client.name.charAt(0)}
                                                                </span>
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="font-medium text-gray-900">
                                                                    {message.client.name}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    {message.client.phone}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                        {formatDate(message.sent_at)}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                        {formatDate(message.delivered_at)}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                                                        <span
                                                            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getMessageStatusColor(
                                                                message.status
                                                            )}`}
                                                        >
                                                            {getMessageStatusLabel(message.status)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {campaign.messages.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={4}
                                                        className="px-6 py-4 text-center text-sm text-gray-500"
                                                    >
                                                        Aucun message envoyé
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
            </div>
        </AuthenticatedLayout>
    );
} 