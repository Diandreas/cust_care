import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface Client {
    id: number;
    name: string;
    phone: string;
    email?: string;
    gender?: string;
    birthday?: string;
    tags?: { id: number; name: string }[];
}

interface MessagePreviewProps {
    messageContent: string;
    selectedClient?: Client | null;
    className?: string;
}

const MessagePreview: React.FC<MessagePreviewProps> = ({
    messageContent,
    selectedClient,
    className = '',
}) => {
    const { t } = useTranslation();
    const [previewContent, setPreviewContent] = useState(messageContent);
    const [currentClient, setCurrentClient] = useState<Client | null>(null);

    // Fonction pour personnaliser le message avec les variables
    const personalize = (content: string, client: Client | null) => {
        if (!client) return content;

        let result = content;

        // Remplacements standards
        result = result.replace(/{{client\.name}}/g, client.name);
        result = result.replace(/{{client\.phone}}/g, client.phone);

        // Email (si disponible)
        if (client.email) {
            result = result.replace(/{{client\.email}}/g, client.email);
        } else {
            result = result.replace(/{{client\.email}}/g, '');
        }

        // Date et heure actuelles
        const now = new Date();
        result = result.replace(/{{date}}/g, now.toLocaleDateString());
        result = result.replace(/{{time}}/g, now.toLocaleTimeString().slice(0, 5));
        result = result.replace(/{{year}}/g, now.getFullYear().toString());
        result = result.replace(/{{month}}/g, (now.getMonth() + 1).toString().padStart(2, '0'));
        result = result.replace(/{{day}}/g, now.getDate().toString().padStart(2, '0'));

        return result;
    };

    // Observer les changements de contenu du message ou du client sélectionné
    useEffect(() => {
        const client = selectedClient || currentClient;
        setPreviewContent(personalize(messageContent, client));
    }, [messageContent, selectedClient, currentClient]);

    // Gérer le changement de client pour la prévisualisation
    const handleClientChange = (client: Client | null) => {
        setCurrentClient(client);
    };

    return (
        <div className={`mt-4 rounded-lg border border-gray-300 dark:border-gray-600 ${className}`}>
            <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 rounded-t-lg dark:bg-gray-700 dark:border-gray-600">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('campaigns.messagePreview')}
                </span>
                {selectedClient && (
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                        {t('campaigns.previewFor')}: {selectedClient.name}
                    </span>
                )}
            </div>

            <div className="p-4 bg-white dark:bg-gray-800">
                <div className="flex items-start mb-4">
                    <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 dark:bg-gray-600 dark:text-gray-300">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                    </div>
                    <div className="ml-3 bg-blue-100 rounded-lg rounded-tl-none px-4 py-2 dark:bg-blue-900">
                        <p className="text-sm text-gray-900 whitespace-pre-wrap dark:text-gray-100">
                            {previewContent}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 text-right dark:text-gray-400">
                            {new Date().toLocaleTimeString()}
                        </p>
                    </div>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex justify-between">
                    <span>
                        {previewContent.length} {t('campaigns.characters')}
                    </span>
                    <span>
                        {Math.ceil(previewContent.length / 160)} SMS
                    </span>
                </div>
            </div>
        </div>
    );
}

export default MessagePreview; 