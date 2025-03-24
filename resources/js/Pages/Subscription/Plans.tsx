import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';

interface Plan {
    id: string;
    name: string;
    price: number;
    interval: 'month' | 'year';
    features: string[];
    is_popular?: boolean;
}

interface PlansProps {
    plans: Plan[];
    currentPlan?: string;
}

export default function Plans({
    auth,
    plans,
    currentPlan,
}: PageProps<PlansProps>) {
    const { t } = useTranslation();

    const formatPrice = (price: number, interval: Plan['interval']) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
        }).format(price);
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">{t('subscription.plans.title')}</h2>}
        >
            <Head title={t('subscription.plans.title')} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* En-tête */}
                    <div className="text-center">
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                            {t('subscription.plans.heading')}
                        </h1>
                        <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
                            {t('subscription.plans.subheading')}
                        </p>
                    </div>

                    {/* Plans */}
                    <div className="mt-16 grid gap-8 lg:grid-cols-3">
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                className={`relative rounded-2xl border ${plan.is_popular
                                        ? 'border-indigo-600 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-900/20'
                                        : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                                    } p-8 shadow-sm`}
                            >
                                {plan.is_popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <span className="inline-flex items-center rounded-full bg-indigo-600 px-3 py-1 text-sm font-medium text-white">
                                            {t('subscription.plans.popular')}
                                        </span>
                                    </div>
                                )}

                                <div className="mb-8">
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                                    <p className="mt-4 text-4xl font-bold text-gray-900 dark:text-white">
                                        {formatPrice(plan.price, plan.interval)}
                                        <span className="text-base font-normal text-gray-500 dark:text-gray-400">
                                            /{t(`subscription.plans.${plan.interval}`)}
                                        </span>
                                    </p>
                                </div>

                                <ul className="mb-8 space-y-4">
                                    {plan.features.map((feature, index) => (
                                        <li key={index} className="flex items-center text-gray-600 dark:text-gray-300">
                                            <svg
                                                className="mr-3 h-5 w-5 text-indigo-500"
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <Link
                                    href={route('subscription.subscribe', plan.id)}
                                    className={`block w-full rounded-lg px-4 py-2 text-center text-sm font-medium ${plan.is_popular
                                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'
                                            : 'bg-white text-indigo-600 hover:bg-gray-50 dark:bg-gray-700 dark:text-indigo-400 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    {currentPlan === plan.id
                                        ? t('subscription.plans.currentPlan')
                                        : t('subscription.plans.selectPlan')}
                                </Link>
                            </div>
                        ))}
                    </div>

                    {/* FAQ */}
                    <div className="mt-24">
                        <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                            {t('subscription.plans.faq.title')}
                        </h2>
                        <div className="mt-12 space-y-8">
                            {[
                                {
                                    question: t('subscription.plans.faq.q1'),
                                    answer: t('subscription.plans.faq.a1'),
                                },
                                {
                                    question: t('subscription.plans.faq.q2'),
                                    answer: t('subscription.plans.faq.a2'),
                                },
                                {
                                    question: t('subscription.plans.faq.q3'),
                                    answer: t('subscription.plans.faq.a3'),
                                },
                            ].map((faq, index) => (
                                <div key={index} className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{faq.question}</h3>
                                    <p className="mt-2 text-gray-500 dark:text-gray-400">{faq.answer}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 