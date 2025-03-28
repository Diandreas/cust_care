import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface Client {
    id: number;
    name: string;
    phone: string;
    email?: string;
    tags: { id: number; name: string }[];
    last_message_date?: string;
}

interface Tag {
    id: number;
    name: string;
    clients_count: number;
}

interface AdvancedRecipientSelectorProps {
    clients: Client[];
    tags: Tag[];
    onSelectionChange: (selectedClientIds: number[]) => void;
}

const AdvancedRecipientSelector: React.FC<AdvancedRecipientSelectorProps> = ({
    clients,
    tags,
    onSelectionChange
}) => {
    const { t } = useTranslation();
    const [selectedTags, setSelectedTags] = useState<number[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClients, setSelectedClients] = useState<number[]>([]);
    const [filterType, setFilterType] = useState('all');

    // Filtrer les clients en fonction des critères sélectionnés
    useEffect(() => {
        let filteredClients = clients;

        // Filtre par tags
        if (selectedTags.length > 0) {
            filteredClients = filteredClients.filter(client =>
                client.tags.some(tag => selectedTags.includes(tag.id))
            );
        }

        // Filtre par texte
        if (searchTerm) {
            filteredClients = filteredClients.filter(client =>
                client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                client.phone.includes(searchTerm) ||
                (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // Filtre par type de clients
        if (filterType === 'active') {
            filteredClients = filteredClients.filter(client => client.last_message_date);
        } else if (filterType === 'inactive') {
            filteredClients = filteredClients.filter(client => !client.last_message_date);
        }

        setSelectedClients(filteredClients.map(client => client.id));
        onSelectionChange(filteredClients.map(client => client.id));
    }, [selectedTags, searchTerm, filterType, clients]);

    return (
        <div className="space-y-4">
            {/* Interface de recherche */}
            <div className="flex items-center space-x-2">
                <input
                    type="text"
                    placeholder={t('clients.search')}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                    <option value="all">{t('clients.all')}</option>
                    <option value="active">{t('clients.active')}</option>
                    <option value="inactive">{t('clients.inactive')}</option>
                </select>
            </div>

            {/* Sélection par tags */}
            <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('clients.filterByTags')}
                </h4>
                <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                        <button
                            key={tag.id}
                            onClick={() => {
                                if (selectedTags.includes(tag.id)) {
                                    setSelectedTags(selectedTags.filter(id => id !== tag.id));
                                } else {
                                    setSelectedTags([...selectedTags, tag.id]);
                                }
                            }}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${selectedTags.includes(tag.id)
                                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                }`}
                        >
                            {tag.name} ({tag.clients_count})
                        </button>
                    ))}
                </div>
            </div>

            {/* Nombre de clients sélectionnés */}
            <div className="text-sm text-gray-500 dark:text-gray-400">
                {selectedClients.length} {t('clients.selected')}
            </div>
        </div>
    );
};

export default AdvancedRecipientSelector; 