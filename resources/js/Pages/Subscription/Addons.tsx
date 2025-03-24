import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';

interface Subscription {
    id: number;
    plan_id: number;
    plan: string;
    clients_limit: number;
    campaigns_limit: number;
    campaign_sms_limit: number;
    personal_sms_quota: number;
    sms_used: number;
    campaigns_used: number;
}

interface AddonsProps {
    subscription: Subscription | null;
}

export default function Addons({
    auth,
    subscription,
}: PageProps<AddonsProps>) {
    const { t } = useTranslation();
    const [addonType, setAddonType] = useState<'sms' | 'clients'>('sms');

    const { data, setData, post, processing, errors, reset } = useForm({
        addon_type: 'sms',
        quantity: 1,
        payment_method: 'mobile_money',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('subscription.addons'), {
            preserveScroll: true,
            onSuccess: () => reset('quantity'),
        });
    };

    const handleAddonTypeChange = (type: 'sms' | 'clients') => {
        setAddonType(type);
        setData('addon_type', type);
    };

    const calculatePrice = () => {
        const quantity = data.quantity || 1;
        if (data.addon_type === 'sms') {
            // 1000 FCFA pour 100 SMS
            return quantity * 1000;
        } else {
            // 2000 FCFA pour 100 clients
            return quantity * 2000;
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF',
        }).format(price);
    };

    if (!subscription) {
        return (
            <AuthenticatedLayout
                user={auth.user}
                header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">Options complémentaires</h2>}
            >
                <Head title="Options complémentaires" />
                <div className="py-12">
                    <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                        <div className="overflow-hidden bg-white shadow-sm dark:bg-gray-800 sm:rounded-lg">
                            <div className="p-6">
                                <div className="text-center">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                        Vous n'avez pas d'abonnement actif
                                    </h3>
                                    <p className="mt-2 text-gray-500 dark:text-gray-400">
                                        Veuillez souscrire à un plan d'abonnement pour accéder aux options complémentaires.
                                    </p>
                                    <a
                                        href={route('subscription.plans')}
                                        className="mt-4 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                                    >
                                        Voir les plans d'abonnement
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">Options complémentaires</h2>}
        >
            <Head title="Options complémentaires" />

            <div className="py-12">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm dark:bg-gray-800 sm:rounded-lg">
                        <div className="p-6">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Options complémentaires</h1>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">
                                Ajoutez des SMS supplémentaires ou augmentez votre capacité de clients.
                            </p>

                            <div className="mt-8">
                                <div className="flex flex-wrap gap-4">
                                    <button
                                        type="button"
                                        onClick={() => handleAddonTypeChange('sms')}
                                        className={`flex-1 rounded-lg border border-gray-200 p-4 text-left ${addonType === 'sms'
                                                ? 'border-indigo-600 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-900/20'
                                                : 'bg-white dark:border-gray-700 dark:bg-gray-800'
                                            }`}
                                    >
                                        <div className="flex items-center">
                                            <div className={`flex h-5 w-5 items-center justify-center rounded-full ${addonType === 'sms' ? 'bg-indigo-600' : 'border border-gray-300 dark:border-gray-600'
                                                }`}>
                                                {addonType === 'sms' && (
                                                    <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">SMS supplémentaires</h3>
                                                <p className="text-gray-500 dark:text-gray-400">1.000 FCFA pour 100 SMS</p>
                                            </div>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleAddonTypeChange('clients')}
                                        className={`flex-1 rounded-lg border border-gray-200 p-4 text-left ${addonType === 'clients'
                                                ? 'border-indigo-600 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-900/20'
                                                : 'bg-white dark:border-gray-700 dark:bg-gray-800'
                                            }`}
                                    >
                                        <div className="flex items-center">
                                            <div className={`flex h-5 w-5 items-center justify-center rounded-full ${addonType === 'clients' ? 'bg-indigo-600' : 'border border-gray-300 dark:border-gray-600'
                                                }`}>
                                                {addonType === 'clients' && (
                                                    <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Capacité clients supplémentaire</h3>
                                                <p className="text-gray-500 dark:text-gray-400">2.000 FCFA pour 100 clients</p>
                                            </div>
                                        </div>
                                    </button>
                                </div>

                                <div className="mt-8">
                                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-900">
                                        <form onSubmit={handleSubmit}>
                                            <div className="mb-4">
                                                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Quantité
                                                </label>
                                                <div className="mt-1 flex items-center">
                                                    <input
                                                        type="number"
                                                        id="quantity"
                                                        name="quantity"
                                                        min="1"
                                                        max="100"
                                                        value={data.quantity}
                                                        onChange={(e) => setData('quantity', parseInt(e.target.value) || 1)}
                                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                                    />
                                                    <span className="ml-2 text-gray-500 dark:text-gray-400">
                                                        {addonType === 'sms' ? 'x 100 SMS' : 'x 100 clients'}
                                                    </span>
                                                </div>
                                                {errors.quantity && (
                                                    <p className="mt-1 text-xs text-red-500">{errors.quantity}</p>
                                                )}
                                            </div>

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

                                            <div className="mb-6 border-t border-gray-200 pt-4 dark:border-gray-700">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-lg font-medium text-gray-900 dark:text-white">Total à payer</span>
                                                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                                                        {formatPrice(calculatePrice())}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                    {addonType === 'sms'
                                                        ? `Vous ajouterez ${data.quantity * 100} SMS à votre quota actuel.`
                                                        : `Vous augmenterez votre capacité de ${data.quantity * 100} clients supplémentaires.`
                                                    }
                                                </p>
                                            </div>

                                            <button
                                                type="submit"
                                                className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                                                disabled={processing}
                                            >
                                                {processing ? 'Traitement en cours...' : 'Procéder au paiement'}
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <a href={route('subscription.index')} className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
                            &larr; Retour à l'abonnement
                        </a>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 