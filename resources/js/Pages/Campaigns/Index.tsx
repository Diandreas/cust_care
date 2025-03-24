import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import PrimaryButton from '@/Components/PrimaryButton';

interface Campaign {
    id: number;
    name: string;
    status: 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    scheduled_at: string | null;
    completed_at: string | null;
    total_recipients: number;
    sent_count: number;
    delivered_count: number;
    failed_count: number;
    created_at: string;
}

interface CampaignsIndexProps extends PageProps {
    campaigns: Campaign[];
}

export default function Index({ auth, campaigns }: CampaignsIndexProps) {
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

    const formatDate = (date: string | null) => {
        if (!date) return '-';
        return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: fr });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-playfair text-xl font-semibold leading-tight text-gray-800">Campagnes SMS</h2>}
        >
            <Head title="Campagnes SMS" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="mb-6 flex justify-end">
                        <Link href={route('campaigns.create')}>
                            <PrimaryButton type="button">
                                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                                Nouvelle Campagne
                            </PrimaryButton>
                        </Link>
                    </div>

                    <div className="overflow-hidden rounded-lg bg-white shadow-lg">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Campagne
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Statut
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Programmée pour
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Destinataires
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Performance
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {campaigns.map((campaign) => (
                                        <tr key={campaign.id}>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 flex-shrink-0">
                                                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-lg font-semibold text-violet-600">
                                                            {campaign.name.charAt(0)}
                                                        </span>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="font-medium text-gray-900">{campaign.name}</div>
                                                        <div className="text-sm text-gray-500">
                                                            Créée le {formatDate(campaign.created_at)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(
                                                        campaign.status
                                                    )}`}
                                                >
                                                    {getStatusLabel(campaign.status)}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                {formatDate(campaign.scheduled_at)}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                {campaign.total_recipients} destinataire
                                                {campaign.total_recipients !== 1 ? 's' : ''}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-gray-600">
                                                            {campaign.sent_count} envoyé
                                                            {campaign.sent_count !== 1 ? 's' : ''}
                                                        </span>
                                                        <span className="font-medium text-gray-900">
                                                            {campaign.total_recipients > 0
                                                                ? Math.round(
                                                                    (campaign.sent_count / campaign.total_recipients) * 100
                                                                )
                                                                : 0}
                                                            %
                                                        </span>
                                                    </div>
                                                    <div className="mt-2 overflow-hidden rounded-full bg-gray-200">
                                                        <div
                                                            className="h-2 rounded-full bg-violet-600"
                                                            style={{
                                                                width: `${campaign.total_recipients > 0
                                                                        ? (campaign.sent_count /
                                                                            campaign.total_recipients) *
                                                                        100
                                                                        : 0
                                                                    }%`,
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="mt-2 grid grid-cols-2 gap-4 text-xs text-gray-500">
                                                        <div>
                                                            <span className="font-medium text-green-600">
                                                                {campaign.delivered_count}
                                                            </span>{' '}
                                                            livré{campaign.delivered_count !== 1 ? 's' : ''}
                                                        </div>
                                                        <div>
                                                            <span className="font-medium text-red-600">
                                                                {campaign.failed_count}
                                                            </span>{' '}
                                                            échoué{campaign.failed_count !== 1 ? 's' : ''}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                                <div className="flex justify-end gap-2">
                                                    <Link
                                                        href={route('campaigns.show', campaign.id)}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        Détails
                                                    </Link>
                                                    {campaign.status === 'draft' && (
                                                        <Link
                                                            href={route('campaigns.edit', campaign.id)}
                                                            className="text-gray-600 hover:text-gray-900"
                                                        >
                                                            Modifier
                                                        </Link>
                                                    )}
                                                    {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                                                        <button
                                                            onClick={() => {
                                                                if (confirm('Voulez-vous annuler cette campagne ?')) {
                                                                    // Cancel action
                                                                }
                                                            }}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            Annuler
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {campaigns.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                                                Aucune campagne trouvée
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 