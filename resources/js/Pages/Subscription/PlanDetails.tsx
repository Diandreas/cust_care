import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';

interface SubscriptionPlan {
    id: number;
    name: string;
    code: string;
    price: number;
    max_clients: number;
    max_campaigns_per_month: number;
    total_campaign_sms: number;
    monthly_sms_quota: number;
    unused_sms_rollover_percent: number;
    description: string;
    features: string[];
    is_active: boolean;
}

interface PlanDetailsProps {
    plan: SubscriptionPlan;
    userHasPlan: boolean;
}

export default function PlanDetails({
    auth,
    plan,
    userHasPlan,
}: PageProps<PlanDetailsProps>) {
    const { t } = useTranslation();
    const { data, setData, post, processing, errors } = useForm({
        payment_method: 'mobile_money',
    });

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF',
        }).format(price);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('subscription.plans.subscribe', plan.id));
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">Détails du plan</h2>}
        >
            <Head title={`Plan ${plan.name}`} />

            <div className="py-12">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm dark:bg-gray-800 sm:rounded-lg">
                        <div className="p-6">
                            <div className="flex flex-col gap-8 md:flex-row md:items-start">
                                {/* Partie gauche - Informations du plan */}
                                <div className="flex-1">
                                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{plan.name}</h1>
                                    <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">{plan.description}</p>

                                    <div className="mt-6">
                                        <p className="text-4xl font-bold text-gray-900 dark:text-white">
                                            {formatPrice(plan.price)}
                                            <span className="text-base font-normal text-gray-500 dark:text-gray-400">
                                                /mois
                                            </span>
                                        </p>
                                    </div>

                                    <div className="mt-8">
                                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Ce que vous obtenez :</h2>
                                        <ul className="mt-4 space-y-4">
                                            <li className="flex items-start">
                                                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                                <span className="ml-3 text-gray-600 dark:text-gray-300">
                                                    Jusqu'à <strong>{plan.max_clients}</strong> clients dans votre base de données
                                                </span>
                                            </li>
                                            <li className="flex items-start">
                                                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                                <span className="ml-3 text-gray-600 dark:text-gray-300">
                                                    <strong>{plan.max_campaigns_per_month}</strong> campagnes par mois (<strong>{plan.total_campaign_sms}</strong> SMS au total)
                                                </span>
                                            </li>
                                            <li className="flex items-start">
                                                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                                <span className="ml-3 text-gray-600 dark:text-gray-300">
                                                    <strong>{plan.monthly_sms_quota}</strong> SMS personnalisés de réserve mensuelle
                                                </span>
                                            </li>
                                            <li className="flex items-start">
                                                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                                <span className="ml-3 text-gray-600 dark:text-gray-300">
                                                    {plan.unused_sms_rollover_percent > 0
                                                        ? <><strong>{plan.unused_sms_rollover_percent * 100}%</strong> des SMS non utilisés sont reportés au mois suivant</>
                                                        : <>Les SMS non utilisés expirent à la fin du mois</>
                                                    }
                                                </span>
                                            </li>
                                            {plan.features.map((feature, index) => (
                                                <li key={index} className="flex items-start">
                                                    <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                    <span className="ml-3 text-gray-600 dark:text-gray-300">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* Partie droite - Formulaire de souscription */}
                                <div className="w-full md:w-1/3">
                                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-900">
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Souscrire à ce plan</h2>

                                        {userHasPlan ? (
                                            <div className="mt-4">
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    Vous êtes déjà abonné à ce plan.
                                                </p>
                                                <button
                                                    type="button"
                                                    className="mt-4 w-full rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                                    disabled
                                                >
                                                    Plan actuel
                                                </button>
                                            </div>
                                        ) : (
                                            <form onSubmit={handleSubmit} className="mt-4">
                                                <div className="mb-4">
                                                    <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Méthode de paiement
                                                    </label>
                                                    <select
                                                        id="payment_method"
                                                        value={data.payment_method}
                                                        onChange={(e) => setData('payment_method', e.target.value)}
                                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                                    >
                                                        <option value="mobile_money">Mobile Money</option>
                                                        <option value="credit_card">Carte de crédit</option>
                                                        <option value="bank_transfer">Virement bancaire</option>
                                                    </select>
                                                    {errors.payment_method && (
                                                        <p className="mt-1 text-xs text-red-500">{errors.payment_method}</p>
                                                    )}
                                                </div>
                                                <button
                                                    type="submit"
                                                    className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                                                    disabled={processing}
                                                >
                                                    {processing ? 'Traitement en cours...' : 'Souscrire maintenant'}
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <a href={route('subscription.plans')} className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
                            &larr; Retour aux plans
                        </a>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 