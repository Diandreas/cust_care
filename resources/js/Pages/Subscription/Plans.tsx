import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';

interface SubscriptionPlan {
    id: number;
    name: string;
    code: string;
    price: number;
    annual_price: number;
    has_annual_option: boolean;
    annual_discount_percent: number;
    max_clients: number;
    max_campaigns_per_month: number;
    total_campaign_sms: number;
    monthly_sms_quota: number;
    unused_sms_rollover_percent: number;
    description: string;
    features: string[];
    is_active: boolean;
}

interface PlansProps {
    plans: SubscriptionPlan[];
    currentPlanId?: number;
}

export default function Plans({
    auth,
    plans,
    currentPlanId,
}: PageProps<PlansProps>) {
    const { t } = useTranslation();
    const [duration, setDuration] = useState<'monthly' | 'annual'>('monthly');
    const { data, setData, post, processing, errors } = useForm({
        payment_method: 'mobile_money',
        duration: 'monthly',
        simulation_mode: false,
    });

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF',
        }).format(price);
    };

    const handleSelectPlan = (planId: number) => {
        post(route('subscription.plans.subscribe', planId), {
            preserveScroll: true,
        });
    };

    const getPopularPlan = () => {
        if (!plans || plans.length === 0) return null;
        // Considérer le plan "business" comme le plus populaire
        return plans.find(plan => plan.code === 'business') || plans[1];
    };

    const toggleDuration = () => {
        const newDuration = duration === 'monthly' ? 'annual' : 'monthly';
        setDuration(newDuration);
        setData('duration', newDuration);
    };

    const getPlanPrice = (plan: SubscriptionPlan) => {
        return duration === 'annual' && plan.has_annual_option
            ? plan.annual_price / 12 // Prix annuel divisé par 12 pour obtenir le prix mensuel équivalent
            : plan.price;
    };

    const getPlanTotalPrice = (plan: SubscriptionPlan) => {
        return duration === 'annual' && plan.has_annual_option
            ? plan.annual_price
            : plan.price;
    };

    const popularPlan = getPopularPlan();

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">Plans d'abonnement</h2>}
        >
            <Head title="Plans d'abonnement" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm dark:bg-gray-800 sm:rounded-lg">
                        <div className="p-6">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Choisissez votre plan</h1>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">
                                Sélectionnez le plan qui correspond le mieux à vos besoins. Vous pouvez changer de plan à tout moment.
                            </p>

                            <div className="mt-6 flex justify-center">
                                <div className="relative flex rounded-full bg-gray-100 p-1 dark:bg-gray-700">
                                    <button
                                        type="button"
                                        className={`${duration === 'monthly'
                                            ? 'bg-white shadow-sm dark:bg-gray-600'
                                            : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                                            } relative rounded-full px-4 py-2 text-sm font-medium transition-colors`}
                                        onClick={toggleDuration}
                                    >
                                        Mensuel
                                    </button>
                                    <button
                                        type="button"
                                        className={`${duration === 'annual'
                                            ? 'bg-white shadow-sm dark:bg-gray-600'
                                            : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                                            } relative ml-0.5 rounded-full px-4 py-2 text-sm font-medium transition-colors`}
                                        onClick={toggleDuration}
                                    >
                                        Annuel
                                        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-[10px] font-semibold text-white">
                                            -20%
                                        </span>
                                    </button>
                                </div>
                            </div>

                            <div className="mt-8 grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                {plans.map((plan) => (
                                    <div
                                        key={plan.id}
                                        className={`relative rounded-2xl border ${plan.id === popularPlan?.id
                                            ? 'border-indigo-600 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-900/20'
                                            : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                                            } p-8 shadow-sm`}
                                    >
                                        {plan.id === popularPlan?.id && (
                                            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                                <span className="inline-flex items-center rounded-full bg-indigo-600 px-3 py-1 text-sm font-medium text-white">
                                                    Le plus populaire
                                                </span>
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                                            <p className="mt-4 text-4xl font-bold text-gray-900 dark:text-white">
                                                {formatPrice(getPlanPrice(plan))}
                                                <span className="text-base font-normal text-gray-500 dark:text-gray-400">
                                                    /mois
                                                </span>
                                            </p>
                                            {duration === 'annual' && plan.has_annual_option && (
                                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                    Facturé {formatPrice(plan.annual_price)} par an
                                                    <span className="ml-2 text-green-600">(économie de {plan.annual_discount_percent}%)</span>
                                                </p>
                                            )}
                                            <p className="mt-6 text-gray-500 dark:text-gray-400">
                                                {plan.description}
                                            </p>
                                            <ul className="mt-6 space-y-4">
                                                {plan.features.map((feature, index) => (
                                                    <li key={index} className="flex items-start">
                                                        <svg className="h-5 w-5 shrink-0 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                        <span className="ml-3 text-gray-500 dark:text-gray-400">{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="mt-8">
                                            <form>
                                                <div className="mb-4">
                                                    <label htmlFor={`payment_method_${plan.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                                                        Méthode de paiement
                                                    </label>
                                                    <select
                                                        id={`payment_method_${plan.id}`}
                                                        name="payment_method"
                                                        className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                                        onChange={(e) => setData('payment_method', e.target.value)}
                                                        value={data.payment_method}
                                                    >
                                                        <option value="mobile_money">Mobile Money</option>
                                                        <option value="credit_card">Carte bancaire</option>
                                                        <option value="bank_transfer">Virement bancaire</option>
                                                    </select>
                                                </div>

                                                {/* Bouton pour choisir normalement le plan */}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        post(route('subscription.plans.subscribe', plan.id));
                                                    }}
                                                    disabled={currentPlanId === plan.id || processing}
                                                    className={`mt-8 block w-full rounded-lg px-4 py-3 text-center text-sm font-semibold  
                                                    ${currentPlanId === plan.id
                                                            ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                                            : plan.id === popularPlan?.id
                                                                ? 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'
                                                                : 'bg-white text-indigo-600 hover:bg-gray-50 dark:bg-gray-700 dark:text-indigo-400 dark:hover:bg-gray-600'
                                                        } disabled:opacity-50`}
                                                >
                                                    {currentPlanId === plan.id ? 'Abonnement actuel' : 'Choisir ce plan'}
                                                </button>

                                                {/* Bouton pour activer en mode test (sans paiement) */}
                                                {currentPlanId !== plan.id && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            post(route('payment.subscription', [plan.id]), {
                                                                payment_method: data.payment_method,
                                                                duration: duration,
                                                                simulation_mode: true
                                                            });
                                                        }}
                                                        disabled={processing}
                                                        className="mt-2 block w-full rounded-lg border border-indigo-600 bg-white px-4 py-2 text-center text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:border-indigo-400 dark:bg-transparent dark:text-indigo-400 dark:hover:bg-gray-800"
                                                    >
                                                        Activer en mode test (sans paiement)
                                                    </button>
                                                )}
                                            </form>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-12 text-center">
                                <p className="text-gray-600 dark:text-gray-400">
                                    Des questions ? Contactez notre service client au +123 456 789
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}