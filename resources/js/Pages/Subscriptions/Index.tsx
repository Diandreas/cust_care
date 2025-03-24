import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import PrimaryButton from '@/Components/PrimaryButton';

interface Plan {
    id: number;
    name: string;
    price: number;
    max_clients: number;
    max_sms_per_month: number;
    max_campaigns: number;
    features: string[];
}

interface Subscription {
    id: number;
    plan_id: number;
    plan: Plan;
    status: 'active' | 'cancelled' | 'expired';
    started_at: string;
    expires_at: string;
    is_trial: boolean;
    billing_cycle: 'monthly' | 'yearly';
}

interface SubscriptionsIndexProps extends PageProps {
    plans: Plan[];
    subscription: Subscription | null;
}

export default function Index({ auth, plans, subscription }: SubscriptionsIndexProps) {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF',
            maximumFractionDigits: 0,
        }).format(price);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const getDaysLeft = (expiresAt: string) => {
        const expirationDate = new Date(expiresAt);
        const now = new Date();
        const diffTime = expirationDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-playfair text-xl font-semibold leading-tight text-gray-800">Abonnements</h2>}
        >
            <Head title="Abonnements" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Current Subscription */}
                    {subscription && (
                        <div className="mb-8 overflow-hidden rounded-lg bg-white shadow-lg">
                            <div className="border-b border-gray-200 bg-gray-50 px-4 py-5 sm:px-6">
                                <h3 className="font-playfair text-lg font-medium leading-6 text-gray-900">
                                    Votre Abonnement Actuel
                                </h3>
                            </div>
                            <div className="px-4 py-5 sm:p-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                    <div>
                                        <h4 className="font-montserrat text-sm font-medium uppercase tracking-wider text-gray-500">
                                            Plan
                                        </h4>
                                        <p className="mt-1 font-playfair text-2xl font-semibold text-violet-600">
                                            {subscription.plan.name}
                                        </p>
                                        <div className="mt-1 flex items-center text-sm text-gray-500">
                                            <span
                                                className={`mr-2 inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${subscription.status === 'active'
                                                    ? 'bg-green-100 text-green-800'
                                                    : subscription.status === 'cancelled'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-red-100 text-red-800'
                                                    }`}
                                            >
                                                {subscription.status === 'active'
                                                    ? 'Actif'
                                                    : subscription.status === 'cancelled'
                                                        ? 'Annulé'
                                                        : 'Expiré'}
                                            </span>
                                            <span>
                                                {subscription.billing_cycle === 'monthly'
                                                    ? 'Facturation mensuelle'
                                                    : 'Facturation annuelle'}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-montserrat text-sm font-medium uppercase tracking-wider text-gray-500">
                                            Période
                                        </h4>
                                        <p className="mt-1 text-sm">
                                            Depuis le{' '}
                                            <span className="font-medium text-gray-900">
                                                {formatDate(subscription.started_at)}
                                            </span>
                                        </p>
                                        <p className="mt-1 text-sm">
                                            Expire le{' '}
                                            <span className="font-medium text-gray-900">
                                                {formatDate(subscription.expires_at)}
                                            </span>
                                        </p>
                                        <p className="mt-2 text-sm font-medium text-violet-600">
                                            {getDaysLeft(subscription.expires_at)} jours restants
                                        </p>
                                    </div>

                                    <div>
                                        <h4 className="font-montserrat text-sm font-medium uppercase tracking-wider text-gray-500">
                                            Prix
                                        </h4>
                                        <p className="mt-1 font-playfair text-2xl font-semibold text-gray-900">
                                            {formatPrice(subscription.plan.price)}
                                            <span className="text-sm font-normal text-gray-500">
                                                {' '}
                                                / {subscription.billing_cycle === 'monthly' ? 'mois' : 'an'}
                                            </span>
                                        </p>
                                        {subscription.is_trial && (
                                            <p className="mt-1 text-sm font-medium text-green-600">Période d'essai</p>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end gap-4">
                                    {subscription.status === 'active' && (
                                        <Link
                                            href={route('subscriptions.cancel')}
                                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                        >
                                            Annuler l'abonnement
                                        </Link>
                                    )}
                                    <Link
                                        href={route('subscriptions.upgrade')}
                                        className="inline-flex items-center rounded-md border border-transparent bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                                    >
                                        Changer de Plan
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Plans */}
                    <div className="overflow-hidden rounded-lg bg-white shadow-lg">
                        <div className="border-b border-gray-200 bg-gray-50 px-4 py-5 sm:px-6">
                            <h3 className="font-playfair text-lg font-medium leading-6 text-gray-900">
                                Nos Plans d'Abonnement
                            </h3>
                        </div>
                        <div className="px-4 py-5 sm:p-6">
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {plans.map((plan) => (
                                    <div
                                        key={plan.id}
                                        className="flex flex-col overflow-hidden rounded-lg border shadow-sm transition-transform hover:scale-105"
                                    >
                                        <div className="bg-gradient-to-r from-violet-500 to-indigo-600 px-4 py-5 text-white">
                                            <h3 className="font-playfair text-xl font-semibold">{plan.name}</h3>
                                            <div className="mt-2 text-3xl font-bold">
                                                {formatPrice(plan.price)}
                                                <span className="text-sm font-normal opacity-80"> / mois</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-1 flex-col justify-between bg-white p-4">
                                            <ul className="mb-4 space-y-3">
                                                <li className="flex items-center font-montserrat text-sm">
                                                    <svg
                                                        className="mr-2 h-5 w-5 text-green-500"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth="2"
                                                            d="M5 13l4 4L19 7"
                                                        ></path>
                                                    </svg>
                                                    Jusqu'à {plan.max_clients} clients
                                                </li>
                                                <li className="flex items-center font-montserrat text-sm">
                                                    <svg
                                                        className="mr-2 h-5 w-5 text-green-500"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth="2"
                                                            d="M5 13l4 4L19 7"
                                                        ></path>
                                                    </svg>
                                                    {plan.max_sms_per_month} SMS par mois
                                                </li>
                                                <li className="flex items-center font-montserrat text-sm">
                                                    <svg
                                                        className="mr-2 h-5 w-5 text-green-500"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth="2"
                                                            d="M5 13l4 4L19 7"
                                                        ></path>
                                                    </svg>
                                                    {plan.max_campaigns} campagnes simultanées
                                                </li>
                                                {plan.features.map((feature, index) => (
                                                    <li key={index} className="flex items-center font-montserrat text-sm">
                                                        <svg
                                                            className="mr-2 h-5 w-5 text-green-500"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth="2"
                                                                d="M5 13l4 4L19 7"
                                                            ></path>
                                                        </svg>
                                                        {feature}
                                                    </li>
                                                ))}
                                            </ul>
                                            <div className="mt-4">
                                                <Link
                                                    href={route('subscriptions.subscribe', plan.id)}
                                                    className={`block w-full rounded-md ${subscription?.plan_id === plan.id
                                                        ? 'bg-gray-300 cursor-not-allowed'
                                                        : 'bg-violet-600 hover:bg-violet-700'
                                                        } px-4 py-2 text-center text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2`}
                                                    aria-disabled={subscription?.plan_id === plan.id}
                                                >
                                                    {subscription?.plan_id === plan.id
                                                        ? 'Plan Actuel'
                                                        : 'Sélectionner ce Plan'}
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 rounded-md bg-gray-50 p-4 text-sm">
                                <h4 className="font-medium text-gray-800">Besoin d'un plan personnalisé ?</h4>
                                <p className="mt-1 text-gray-600">
                                    Pour des volumes plus importants ou des fonctionnalités spécifiques, contactez notre
                                    service commercial pour un plan sur mesure.
                                </p>
                                <div className="mt-4">
                                    <Link
                                        href="#"
                                        className="font-medium text-violet-600 hover:text-violet-800"
                                    >
                                        Contactez-nous
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 