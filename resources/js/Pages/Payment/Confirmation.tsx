import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';

interface SubscriptionPlan {
    id: number;
    name: string;
    price: number;
    annual_price: number;
    has_annual_option: boolean;
    annual_discount_percent: number;
}

interface ConfirmationProps {
    plan: SubscriptionPlan | null;
    addonType: 'sms' | 'clients' | null;
    quantity: number | null;
    amount: number;
    paymentMethod: string;
    duration: 'monthly' | 'annual';
}

export default function Confirmation({
    auth,
    plan,
    addonType,
    quantity,
    amount,
    paymentMethod,
    duration = 'monthly',
}: PageProps<ConfirmationProps>) {
    const { t } = useTranslation();
    const { post, processing } = useForm();

    const handleConfirmPayment = () => {
        if (plan) {
            post(route('payment.subscription', plan.id), {
                payment_method: paymentMethod,
                duration: duration,
            });
        } else if (addonType) {
            post(route('payment.addon'), {
                addon_type: addonType,
                quantity: quantity,
                payment_method: paymentMethod,
            });
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF',
        }).format(price);
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">Confirmation de paiement</h2>}
        >
            <Head title="Confirmation de paiement" />

            <div className="py-12">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm dark:bg-gray-800 sm:rounded-lg">
                        <div className="p-6">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Confirmation de paiement</h1>
                            <div className="mt-6 space-y-6">
                                <div className="rounded-lg bg-gray-50 p-6 dark:bg-gray-700">
                                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">Résumé de la commande</h2>

                                    <div className="mt-4 space-y-3">
                                        {plan ? (
                                            <>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500 dark:text-gray-400">Plan d'abonnement</span>
                                                    <span className="font-medium text-gray-900 dark:text-white">{plan.name}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500 dark:text-gray-400">Durée</span>
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        {duration === 'annual' ? '1 an' : '1 mois'}
                                                    </span>
                                                </div>
                                                {duration === 'annual' && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500 dark:text-gray-400">Réduction</span>
                                                        <span className="font-medium text-green-600 dark:text-green-400">
                                                            -{plan.annual_discount_percent}%
                                                        </span>
                                                    </div>
                                                )}
                                            </>
                                        ) : addonType ? (
                                            <>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500 dark:text-gray-400">Option complémentaire</span>
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        {addonType === 'sms' ? 'SMS supplémentaires' : 'Extension clients'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500 dark:text-gray-400">Quantité</span>
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        {quantity} x {addonType === 'sms' ? '100 SMS' : '100 clients'}
                                                    </span>
                                                </div>
                                            </>
                                        ) : null}

                                        <div className="flex justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">Méthode de paiement</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {paymentMethod === 'mobile_money' ? 'Mobile Money' :
                                                    paymentMethod === 'credit_card' ? 'Carte de crédit' : 'Virement bancaire'}
                                            </span>
                                        </div>

                                        <div className="border-t border-gray-200 pt-3 dark:border-gray-600">
                                            <div className="flex justify-between">
                                                <span className="text-lg font-semibold text-gray-900 dark:text-white">Total à payer</span>
                                                <span className="text-lg font-bold text-gray-900 dark:text-white">{formatPrice(amount)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-900/20">
                                    <div className="flex">
                                        <div className="shrink-0">
                                            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Mode de test</h3>
                                            <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                                                <p>Cette plateforme est actuellement en mode de test. Aucun paiement réel ne sera prélevé.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between space-x-4">
                                    <a
                                        href={plan ? route('subscription.plans') : route('subscription.addons.index')}
                                        className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                                    >
                                        Annuler
                                    </a>
                                    <button
                                        onClick={handleConfirmPayment}
                                        disabled={processing}
                                        className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                                    >
                                        {processing ? 'Traitement en cours...' : 'Confirmer le paiement'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 