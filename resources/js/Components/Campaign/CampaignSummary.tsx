import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Client {
    id: number;
    name: string;
    phone: string;
    category?: {
        id: number;
        name: string;
    };
}

interface CampaignSummaryProps {
    campaign: {
        name: string;
        message_content: string;
        scheduled_at: string | null;
        send_now?: boolean;
    };
    clients: Client[];
    onSend: () => void;
}

const CampaignSummary: React.FC<CampaignSummaryProps> = ({ campaign, clients, onSend }) => {
    const { t } = useTranslation();
    const [showMoreStats, setShowMoreStats] = useState(false);

    // Préparer les données pour les graphiques
    const prepareCategoryData = () => {
        const categoryMap: Record<string, number> = {};

        clients.forEach(client => {
            const categoryName = client.category ? client.category.name : t('campaigns.noCategory');
            if (!categoryMap[categoryName]) {
                categoryMap[categoryName] = 0;
            }
            categoryMap[categoryName]++;
        });

        return Object.entries(categoryMap).map(([name, count]) => ({ name, count }));
    };

    // Calculer les statistiques
    const categoryData = prepareCategoryData();
    const totalSmsCount = Math.ceil(campaign.message_content.length / 160) * clients.length;

    return (
        <div className="mt-6 bg-white rounded-lg shadow dark:bg-gray-800">
            <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 sm:px-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                    {t('campaigns.summary')}
                </h3>
            </div>

            <div className="px-4 py-5 sm:p-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                    <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {t('campaigns.name')}
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                            {campaign.name}
                        </dd>
                    </div>

                    <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {t('campaigns.sendingTime')}
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                            {campaign.scheduled_at
                                ? new Date(campaign.scheduled_at).toLocaleString()
                                : t('campaigns.immediately')}
                        </dd>
                    </div>

                    <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {t('campaigns.recipients')}
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                            {clients.length} {t('common.clients')}
                        </dd>
                    </div>

                    <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {t('campaigns.totalSMS')}
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                            {totalSmsCount} SMS ({Math.ceil(campaign.message_content.length / 160)} {t('campaigns.perClient')})
                        </dd>
                    </div>

                    <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {t('campaigns.messagePreview')}
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                            <div className="p-3 bg-gray-50 rounded-md dark:bg-gray-700">
                                <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                                    {campaign.message_content}
                                </p>
                            </div>
                        </dd>
                    </div>

                    {showMoreStats && (
                        <>
                            <div className="sm:col-span-2">
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    {t('campaigns.categoryDistribution')}
                                </dt>
                                <dd className="mt-1">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        {categoryData.map((category, index) => (
                                            <div key={index} className="bg-gray-50 p-3 rounded-md dark:bg-gray-700">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">{category.name}</span>
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {category.count} {t('common.clients')}
                                                    </span>
                                                </div>
                                                <div className="mt-1 w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-600">
                                                    <div
                                                        className="bg-indigo-600 h-2.5 rounded-full"
                                                        style={{ width: `${(category.count / clients.length) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </dd>
                            </div>
                        </>
                    )}
                </dl>

                <div className="mt-6 flex justify-between items-center">
                    <button
                        type="button"
                        onClick={() => setShowMoreStats(!showMoreStats)}
                        className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                        {showMoreStats ? t('campaigns.showLessDetails') : t('campaigns.showMoreDetails')}
                    </button>

                    <button
                        type="button"
                        onClick={onSend}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-700 dark:hover:bg-indigo-600"
                    >
                        {campaign.scheduled_at ? t('campaigns.scheduleCampaign') : t('campaigns.sendNow')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CampaignSummary; 