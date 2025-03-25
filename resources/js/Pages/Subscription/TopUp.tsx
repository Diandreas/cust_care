import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

export default function TopUp({ auth }: PageProps) {
    const { t } = useTranslation();
    const [selectedPackage, setSelectedPackage] = useState<number | null>(null);

    const { data, setData, post, processing, errors } = useForm({
        sms_amount: 0,
        payment_method: 'mobile_money',
    });

    const smsPackages = [
        { id: 1, amount: 100, price: 10 },
        { id: 2, amount: 500, price: 45 },
        { id: 3, amount: 1000, price: 80 },
        { id: 4, amount: 5000, price: 350 },
    ];

    const handlePackageSelect = (packageId: number) => {
        setSelectedPackage(packageId);
        const selectedPkg = smsPackages.find(pkg => pkg.id === packageId);
        if (selectedPkg) {
            setData('sms_amount', selectedPkg.amount);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('subscription.process-top-up'));
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">{t('subscription.topUp')}</h2>}
        >
            <Head title={t('subscription.topUp')} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm dark:bg-gray-800 sm:rounded-lg">
                        <div className="border-b border-gray-200 bg-white px-4 py-5 dark:border-gray-700 dark:bg-gray-800 sm:px-6">
                            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">{t('subscription.buySmsCredits')}</h3>
                        </div>
                        <div className="p-6">
                            <div className="mb-8">
                                <h4 className="mb-4 text-base font-medium text-gray-700 dark:text-gray-300">{t('subscription.selectSmsPackage')}</h4>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    {smsPackages.map((pkg) => (
                                        <div
                                            key={pkg.id}
                                            className={`relative cursor-pointer rounded-lg border p-4 ${selectedPackage === pkg.id
                                                    ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-900/20'
                                                    : 'border-gray-300 dark:border-gray-600'
                                                }`}
                                            onClick={() => handlePackageSelect(pkg.id)}
                                        >
                                            <div className="flex flex-col items-center">
                                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{pkg.amount}</div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">{t('subscription.smsCredits')}</div>
                                                <div className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">${pkg.price.toFixed(2)}</div>
                                            </div>

                                            {selectedPackage === pkg.id && (
                                                <div className="absolute right-2 top-2 h-5 w-5 rounded-full bg-indigo-600 dark:bg-indigo-400">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="mb-6">
                                    <h4 className="mb-4 text-base font-medium text-gray-700 dark:text-gray-300">{t('subscription.selectPaymentMethod')}</h4>

                                    <div className="flex flex-wrap gap-4">
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="payment_method"
                                                value="mobile_money"
                                                checked={data.payment_method === 'mobile_money'}
                                                onChange={e => setData('payment_method', e.target.value)}
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{t('subscription.paymentMethods.mobileMoney')}</span>
                                        </label>

                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="payment_method"
                                                value="credit_card"
                                                checked={data.payment_method === 'credit_card'}
                                                onChange={e => setData('payment_method', e.target.value)}
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{t('subscription.paymentMethods.creditCard')}</span>
                                        </label>

                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="payment_method"
                                                value="bank_transfer"
                                                checked={data.payment_method === 'bank_transfer'}
                                                onChange={e => setData('payment_method', e.target.value)}
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{t('subscription.paymentMethods.bankTransfer')}</span>
                                        </label>
                                    </div>

                                    <InputError message={errors.payment_method} className="mt-2" />
                                </div>

                                <div className="flex items-center justify-end">
                                    <PrimaryButton disabled={processing || !selectedPackage}>
                                        {t('subscription.proceedToPayment')}
                                    </PrimaryButton>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}