import React, { useState, useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import axios from 'axios';
import { Transition } from '@headlessui/react';

// ShadCN UI Components
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Checkbox } from '@/Components/ui/checkbox';
import { Textarea } from '@/Components/ui/textarea';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger
} from '@/Components/ui/dialog';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/Components/ui/dropdown-menu';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/Components/ui/select';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Avatar, AvatarFallback } from '@/Components/ui/avatar';
import { Badge } from '@/Components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/Components/ui/table';
import { ScrollArea } from '@/Components/ui/scroll-area';
import { Separator } from '@/Components/ui/separator';
import { Alert, AlertDescription } from '@/Components/ui/alert';

// Icons
import {
    Search, SlidersHorizontal, LayoutGrid, List, PlusCircle, Upload, Download,
    MoreHorizontal, Check, X, MessageSquare, Eye, Edit, Trash2,
    Phone, Mail, Calendar, Clock, RefreshCw, Tag, AlertCircle,
    FileText, Save, MessageSquarePlus, Users2, ShieldCheck, Zap, Import, UserPlus
} from 'lucide-react';

interface Client {
    id: number;
    name: string;
    phone: string;
    email: string | null;
    birthday: string | null;
    address: string | null;
    notes: string | null;
    lastContact: string | null;
    tags: Tag[];
    totalSmsCount: number;
    lastSmsDate: string | null;
}

interface Tag {
    id: number;
    name: string;
}

interface ClientsIndexProps {
    clients: {
        data: Client[];
        links: any[];
        total: number;
    };
    tags: Tag[];
    filters: {
        search: string;
        tag_id: number | null;
        date_range: string | null;
        birthday_month: number | null;
        sort_by: string;
        sort_direction: 'asc' | 'desc';
    };
    stats: {
        totalClients: number;
        newClientsThisMonth: number;
        activeClientsLast30Days: number;
        totalSmsSent: number;
    };
    subscription: {
        plan: string;
        clientsLimit: number;
        clientsCount: number;
        smsBalance: number;
    };
}

export default function ClientsIndex({
    auth,
    clients,
    tags,
    filters,
    stats,
    subscription,
}: PageProps<ClientsIndexProps & Record<string, unknown>>) {
    const { t } = useTranslation();
    const [selectedClients, setSelectedClients] = useState<number[]>([]);
    const [showFiltersPanel, setShowFiltersPanel] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showBulkSmsModal, setShowBulkSmsModal] = useState(false);
    const [showSimpleImportModal, setShowSimpleImportModal] = useState(false);
    const [showQuickAddModal, setShowQuickAddModal] = useState(false);
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [showSmsPreviewModal, setShowSmsPreviewModal] = useState(false);
    const [importLoading, setImportLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
    const [previewData, setPreviewData] = useState<Record<string, string>[]>([]);
    const [bulkSmsContent, setBulkSmsContent] = useState('');
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const [contactsText, setContactsText] = useState('');
    const [clientToDelete, setClientToDelete] = useState<number | null>(null);
    const [clientsToDelete, setClientsToDelete] = useState<number[]>([]);
    const [duplicateClients, setDuplicateClients] = useState<any[]>([]);
    const [smsPreviewInfo, setSmsPreviewInfo] = useState({
        characters: 0,
        segments: 1
    });

    // Quick add form state
    const [quickAddForm, setQuickAddForm] = useState({
        name: '',
        phone: '',
        gender: '',
        tagIds: [] as number[]
    });

    // État pour la recherche et les filtres
    const { data, setData, get, processing } = useForm({
        search: filters.search || '',
        tag_id: filters.tag_id || '',
        date_range: filters.date_range || '',
        birthday_month: filters.birthday_month || '',
        sort_by: filters.sort_by || 'name',
        sort_direction: filters.sort_direction || 'asc',
    });

    // État pour la validation en temps réel du téléphone
    const [phoneValidation, setPhoneValidation] = useState({
        isValid: true,
        formattedNumber: '',
        errorType: '',
        country: '',
    });

    // Fonction avancée pour valider et formater les numéros de téléphone
    const validateAndFormatPhone = (phone: string) => {
        // Réinitialiser la validation
        const validation = {
            isValid: false,
            formattedNumber: '',
            errorType: '',
            country: '',
        };

        // Ignorer si vide
        if (!phone.trim()) {
            validation.isValid = true; // On ne veut pas montrer d'erreur pour un champ vide
            setPhoneValidation(validation);
            return validation;
        }

        // Nettoyage du numéro
        const cleanedPhone = phone.replace(/\s+/g, '').replace(/[()-]/g, '');

        // Détecter le format international
        const isInternational = /^(\+|00)/.test(cleanedPhone);

        // Tests spécifiques aux pays
        if (isInternational) {
            // Format international
            if (/^\+237[6-9][0-9]{8}$/.test(cleanedPhone)) {
                validation.isValid = true;
                validation.formattedNumber = cleanedPhone;
                validation.country = 'Cameroun';
            } else if (/^\+33[1-9][0-9]{8}$/.test(cleanedPhone)) {
                validation.isValid = true;
                validation.formattedNumber = cleanedPhone;
                validation.country = 'France';
            } else if (/^\+[0-9]{10,14}$/.test(cleanedPhone)) {
                validation.isValid = true;
                validation.formattedNumber = cleanedPhone;
                validation.country = 'International';
            } else {
                validation.errorType = 'format';
            }
        } else {
            // Format local Cameroun: commence par 6 et a 9 chiffres
            if (/^6[0-9]{8}$/.test(cleanedPhone)) {
                validation.isValid = true;
                validation.formattedNumber = `+237${cleanedPhone}`;
                validation.country = 'Cameroun';
            }
            // Format local France: commence par 0 et a 10 chiffres
            else if (/^0[1-9][0-9]{8}$/.test(cleanedPhone)) {
                validation.isValid = true;
                validation.formattedNumber = `+33${cleanedPhone.substring(1)}`;
                validation.country = 'France';
            } else {
                // Déterminer le type d'erreur pour un message adapté
                if (/^[0-9]+$/.test(cleanedPhone)) {
                    validation.errorType = 'length';
                } else {
                    validation.errorType = 'characters';
                }
            }
        }

        setPhoneValidation(validation);
        return validation;
    };

    // Detect duplicate clients
    useEffect(() => {
        const phoneMap = new Map();
        const emailMap = new Map();
        const potentialDuplicates = [];

        for (const client of clients.data) {
            if (client.phone) {
                if (phoneMap.has(client.phone)) {
                    potentialDuplicates.push({
                        type: 'phone',
                        value: client.phone,
                        clients: [phoneMap.get(client.phone), client]
                    });
                } else {
                    phoneMap.set(client.phone, client);
                }
            }

            if (client.email) {
                if (emailMap.has(client.email)) {
                    potentialDuplicates.push({
                        type: 'email',
                        value: client.email,
                        clients: [emailMap.get(client.email), client]
                    });
                } else {
                    emailMap.set(client.email, client);
                }
            }
        }

        setDuplicateClients(potentialDuplicates);
    }, [clients]);

    // SMS preview calculations
    useEffect(() => {
        if (bulkSmsContent) {
            const characters = bulkSmsContent.length;
            const segments = Math.ceil(characters / 160);
            setSmsPreviewInfo({ characters, segments });
        } else {
            setSmsPreviewInfo({ characters: 0, segments: 1 });
        }
    }, [bulkSmsContent]);

    // Function to handle file analysis for import
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setSelectedFile(file);

        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    // Analyze CSV data
                    const text = event.target?.result as string;
                    const lines = text.split('\n');
                    const headers = lines[0].split(',').map(h => h.trim());

                    // Auto-map columns
                    const initialMapping: Record<string, string> = {};
                    headers.forEach(header => {
                        const normalizedHeader = header.toLowerCase();
                        if (normalizedHeader.includes('name') || normalizedHeader.includes('nom'))
                            initialMapping[header] = 'name';
                        else if (normalizedHeader.includes('phone') || normalizedHeader.includes('tel'))
                            initialMapping[header] = 'phone';
                        else if (normalizedHeader.includes('email'))
                            initialMapping[header] = 'email';
                        else if (normalizedHeader.includes('birth') || normalizedHeader.includes('naissance'))
                            initialMapping[header] = 'birthday';
                        else if (normalizedHeader.includes('address') || normalizedHeader.includes('adresse'))
                            initialMapping[header] = 'address';
                        else if (normalizedHeader.includes('note'))
                            initialMapping[header] = 'notes';
                        else
                            initialMapping[header] = 'ignore';
                    });
                    setFieldMapping(initialMapping);

                    // Preview first 5 rows
                    const previewRows = [];
                    for (let i = 1; i < Math.min(6, lines.length); i++) {
                        if (lines[i].trim()) {
                            const values = lines[i].split(',');
                            const row: Record<string, string> = {};
                            headers.forEach((header, index) => {
                                row[header] = values[index]?.trim() || '';
                            });
                            previewRows.push(row);
                        }
                    }
                    setPreviewData(previewRows);
                } catch (err) {
                    console.error('Error parsing file:', err);
                    toast.error(t('import.fileError'));
                }
            };
            reader.readAsText(file);
        }
    };

    // Handle import submission
    const handleImport = () => {
        if (!selectedFile) {
            toast.error(t('import.fileRequired'));
            return;
        }

        setImportLoading(true);

        const formData = new FormData();
        formData.append('file', selectedFile);

        // Transformer le mapping pour exclure les valeurs "ignore" avant de l'envoyer
        const filteredMapping = Object.fromEntries(
            Object.entries(fieldMapping).filter(([_, value]) => value !== 'ignore')
        );
        formData.append('mapping', JSON.stringify(filteredMapping));
        formData.append('_token', document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '');

        axios.post(route('clients.import'), formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
            .then(response => {
                setImportLoading(false);
                toast.success(t('import.success'));
                setShowImportModal(false);

                // Refresh without full page reload
                get(route('clients.index'), {
                    preserveState: true,
                    only: ['clients', 'stats']
                });
            })
            .catch(err => {
                setImportLoading(false);

                if (err.response && err.response.status === 403) {
                    toast.error(t('subscription.limit.upgradeRequired'));
                } else {
                    toast.error(t('common.importError', {
                        details: err.response?.data?.message || t('common.unknownError')
                    }));
                }
            });
    };

    // Handle simple text import (name + phone)
    const handleSimpleImport = () => {
        if (!contactsText.trim()) {
            toast.error(t('import.textRequired'));
            return;
        }

        setImportLoading(true);

        const lines = contactsText.trim().split('\n');
        const contacts = lines.map(line => {
            // Try different delimiters (space, comma, semicolon)
            let parts: string[];
            if (line.includes(',')) {
                parts = line.split(',');
            } else if (line.includes(';')) {
                parts = line.split(';');
            } else {
                // Split by last space to take everything before as name
                const lastSpaceIndex = line.lastIndexOf(' ');
                if (lastSpaceIndex > 0) {
                    parts = [
                        line.substring(0, lastSpaceIndex),
                        line.substring(lastSpaceIndex + 1)
                    ];
                } else {
                    parts = line.split(' ');
                }
            }

            const name = parts[0]?.trim() || '';
            const phone = parts[1]?.trim().replace(/\s+/g, '') || '';

            return { name, phone };
        }).filter(c => c.name && c.phone); // Filter incomplete lines

        if (contacts.length === 0) {
            setImportLoading(false);
            toast.error(t('import.noValidContacts'));
            return;
        }

        axios.post(route('clients.import.simple'), {
            contacts: JSON.stringify(contacts)
        })
            .then(response => {
                setImportLoading(false);
                toast.success(t('import.success', { count: response.data.imported || 0 }));
                setShowSimpleImportModal(false);
                setContactsText('');

                // Refresh client list
                get(route('clients.index'), {
                    preserveState: true,
                    only: ['clients', 'stats']
                });
            })
            .catch(err => {
                setImportLoading(false);

                if (err.response && err.response.status === 403) {
                    toast.error(t('subscription.limit.upgradeRequired'));
                } else {
                    toast.error(t('common.importError', {
                        details: err.response?.data?.message || t('common.unknownError')
                    }));
                }
            });
    };

    // Handle quickAddForm submission with improved phone validation
    const handleQuickAdd = () => {
        if (!quickAddForm.name || !quickAddForm.phone) {
            toast.error(t('clients.missingRequiredFields'));
            return;
        }

        // Validation du numéro de téléphone
        const phoneCheck = validateAndFormatPhone(quickAddForm.phone);
        if (!phoneCheck.isValid) {
            toast.error(t('clients.invalidPhoneFormat'));
            return;
        }

        // Utiliser le numéro formaté
        const normalizedPhone = phoneCheck.formattedNumber;

        axios.post(route('clients.store'), {
            name: quickAddForm.name,
            phone: normalizedPhone,
            gender: quickAddForm.gender,
            tag_ids: quickAddForm.tagIds
        })
            .then(response => {
                toast.success(t('clients.added'));
                setShowQuickAddModal(false);
                setQuickAddForm({
                    name: '',
                    phone: '',
                    gender: '',
                    tagIds: []
                });

                // Refresh the client list
                get(route('clients.index'), {
                    preserveState: true,
                    only: ['clients', 'stats']
                });
            })
            .catch(err => {
                if (err.response && err.response.status === 403) {
                    toast.error(t('subscription.limit.upgradeRequired'));
                } else {
                    toast.error(t('common.error', {
                        details: err.response?.data?.message || t('common.unknownError')
                    }));
                }
            });
    };

    // Export clients (CSV or Excel)
    const handleExport = (format: 'csv' | 'excel') => {
        // Create URL with export parameters
        const params = new URLSearchParams();

        // Add current filters
        if (data.search) params.append('search', data.search);
        if (data.tag_id) params.append('tag_id', data.tag_id.toString());
        if (data.date_range) params.append('date_range', data.date_range);
        if (data.birthday_month) params.append('birthday_month', data.birthday_month.toString());

        // If clients are selected, export only those
        if (selectedClients.length > 0) {
            selectedClients.forEach(id => params.append('selected[]', id.toString()));
        }

        // Add export format
        params.append('format', format);

        // Create invisible link, click it, then remove it
        const link = document.createElement('a');
        link.href = `${route('clients.export')}?${params.toString()}`;
        link.setAttribute('download', `clients_${new Date().toISOString().split('T')[0]}.${format}`);
        link.setAttribute('target', '_blank');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Close modal and show success message
        setShowExportModal(false);
        toast.success(t('export.success'));
    };

    // Handle search form submission
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        get(route('clients.index'), {
            preserveState: true,
            replace: true,
        });
    };

    // Format date for display
    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
    };

    // Format phone number for display
    const formatPhoneNumber = (phone: string) => {
        return phone?.replace(/(\d{2})(?=\d)/g, '$1 ');
    };

    // Toggle all clients selection
    const toggleAllClients = (checked: boolean) => {
        if (checked) {
            setSelectedClients(clients.data.map(client => client.id));
        } else {
            setSelectedClients([]);
        }
    };

    // Toggle single client selection
    const toggleClient = (clientId: number) => {
        if (selectedClients.includes(clientId)) {
            setSelectedClients(selectedClients.filter(id => id !== clientId));
        } else {
            setSelectedClients([...selectedClients, clientId]);
        }
    };

    // Handle bulk actions (delete, SMS)
    const handleBulkAction = (action: string) => {
        if (action === 'delete') {
            if (selectedClients.length === 0) {
                toast.error(t('clients.noClientsSelected'));
                return;
            }
            setClientsToDelete(selectedClients);
            setShowDeleteConfirmModal(true);
        } else if (action === 'sms') {
            if (selectedClients.length === 0) {
                toast.error(t('clients.noClientsSelected'));
                return;
            }
            setShowBulkSmsModal(true);
        }
    };

    // Handle client deletion confirmation
    const handleDeleteConfirm = () => {
        if (clientToDelete) {
            // Delete single client
            axios.post(route('clients.destroy', clientToDelete), {
                _method: 'DELETE'
            })
                .then(response => {
                    // Reset states first
                    setClientToDelete(null);
                    setShowDeleteConfirmModal(false);

                    // Show success message
                    toast.success(t('clients.deleteSuccess', { count: 1 }));

                    // Refresh data
                    setTimeout(() => {
                        get(route('clients.index'), {
                            preserveState: true,
                            only: ['clients', 'stats']
                        });
                    }, 100);
                })
                .catch(err => {
                    // Reset states on error
                    setClientToDelete(null);
                    setShowDeleteConfirmModal(false);
                    toast.error(t('common.error'));
                });
        } else if (clientsToDelete.length > 0) {
            // Bulk delete clients
            axios.post('/api/clients/bulk-delete', {
                _method: 'DELETE',
                clients: clientsToDelete
            })
                .then(response => {
                    // Reset states first
                    setSelectedClients([]);
                    setClientsToDelete([]);
                    setShowDeleteConfirmModal(false);

                    // Show success message
                    toast.success(t('clients.deleteSuccess', { count: clientsToDelete.length }));

                    // Refresh data
                    setTimeout(() => {
                        get(route('clients.index'), {
                            preserveState: true,
                            only: ['clients', 'stats']
                        });
                    }, 100);
                })
                .catch(err => {
                    // Reset states on error
                    setSelectedClients([]);
                    setClientsToDelete([]);
                    setShowDeleteConfirmModal(false);
                    toast.error(t('common.error'));
                });
        }
    };

    // Handle sort change
    const handleSortChange = (field: string) => {
        setData(prevData => {
            const newDirection = prevData.sort_by === field && prevData.sort_direction === 'asc' ? 'desc' : 'asc';
            return {
                ...prevData,
                sort_by: field,
                sort_direction: newDirection,
            };
        });
        get(route('clients.index'), {
            preserveState: true,
            replace: true,
        });
    };

    // Send bulk SMS
    const handleBulkSms = () => {
        if (!bulkSmsContent.trim()) {
            toast.error(t('sms.contentRequired'));
            return;
        }

        axios.post(route('messages.bulkSend'), {
            client_ids: selectedClients,
            content: bulkSmsContent,
        })
            .then(response => {
                toast.success(t('sms.sendSuccess'));
                setShowBulkSmsModal(false);
                setBulkSmsContent('');
            })
            .catch(err => {
                if (err.response && err.response.status === 403) {
                    toast.error(t('subscription.limit.upgradeRequired'));
                } else {
                    toast.error(t('common.error', { details: err.response?.data?.message || t('common.unknownError') }));
                }
            });
    };

    // Get client initials for avatar
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(part => part.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    // Generate avatar background color based on name
    const getAvatarColor = (name: string) => {
        const colors = [
            'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-violet-500',
            'bg-fuchsia-500', 'bg-rose-500', 'bg-blue-500', 'bg-cyan-500'
        ];
        const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
        return colors[index];
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">{t('common.clients')}</h2>}
        >
            <Head title={t('common.clients')} />

            <div className="py-4">
                <div className="mx-auto max-w-7xl">
                    {/* Stats Cards - Updated Gradient Theme */}
                    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Card className="overflow-hidden border-border/60 transition-all hover:shadow-md dark:bg-slate-800/90 dark:border-slate-700/60">
                            <CardContent className="p-4">
                                <div className="flex items-center">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-md shadow-indigo-500/20 dark:shadow-indigo-500/10">
                                        <Users2 className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('stats.totalClients')}</div>
                                        <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                                            {stats.totalClients.toLocaleString()}
                                            <span className="ml-2 text-sm font-medium text-indigo-500 dark:text-indigo-400">
                                                +{stats.newClientsThisMonth} {t('stats.thisMonth')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="overflow-hidden border-border/60 transition-all hover:shadow-md dark:bg-slate-800/90 dark:border-slate-700/60">
                            <CardContent className="p-4">
                                <div className="flex items-center">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-md shadow-indigo-500/20 dark:shadow-indigo-500/10">
                                        <Zap className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('stats.activeClients')}</div>
                                        <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                                            {stats.activeClientsLast30Days.toLocaleString()}
                                            <span className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                                                {Math.round((stats.activeClientsLast30Days / stats.totalClients) * 100)}% {t('stats.ofTotal')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="overflow-hidden border-border/60 transition-all hover:shadow-md dark:bg-slate-800/90 dark:border-slate-700/60">
                            <CardContent className="p-4">
                                <div className="flex items-center">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-md shadow-indigo-500/20 dark:shadow-indigo-500/10">
                                        <MessageSquare className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('stats.smsSent')}</div>
                                        <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                                            {stats.totalSmsSent.toLocaleString()}
                                            <span className="ml-2 text-sm font-medium text-indigo-500 dark:text-indigo-400">
                                                {subscription.smsBalance} {t('stats.smsRemaining')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="overflow-hidden border-border/60 transition-all hover:shadow-md dark:bg-slate-800/90 dark:border-slate-700/60">
                            <CardContent className="p-4">
                                <div className="flex items-center">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-md shadow-indigo-500/20 dark:shadow-indigo-500/10">
                                        <ShieldCheck className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('stats.subscription')}</div>
                                        <div className="text-xl font-semibold text-gray-900 dark:text-white">
                                            {subscription.plan}
                                            <div className="mt-1 text-sm font-medium">
                                                <span className={`${subscription.clientsCount > subscription.clientsLimit * 0.9 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                                    {subscription.clientsCount}/{subscription.clientsLimit} {t('stats.clientsUsed')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Alert for duplicates */}
                    {duplicateClients.length > 0 && (
                        <Alert className="mb-6 border-indigo-200 bg-indigo-50/90 text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-900/30 dark:text-indigo-300">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="flex items-center justify-between">
                                <span>{duplicateClients.length} {t('clients.possibleDuplicates')}</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 dark:text-indigo-400 dark:hover:text-indigo-300 dark:hover:bg-indigo-900/50"
                                    onClick={() => { }} // Add handler for duplicates management
                                >
                                    {t('clients.manageDuplicates')}
                                </Button>
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="mb-6 space-y-4">
                        {/* Search and actions bar */}
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                                <form onSubmit={handleSearch} className="flex w-full gap-2 md:w-auto md:flex-1">
                                    <div className="relative flex-grow">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                        <Input
                                            value={data.search}
                                            onChange={(e) => setData('search', e.target.value)}
                                            placeholder={t('common.searchClients')}
                                            className="w-full pl-9 border-border/60 bg-white dark:bg-slate-800/80 dark:text-gray-100 dark:border-slate-700/60"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-sm hover:shadow-md transition-shadow duration-200"
                                    >
                                        {t('common.search')}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        type="button"
                                        onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                                        className="flex items-center justify-center gap-2 border-border/60 shadow-sm transition-colors duration-200 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-gray-200"
                                    >
                                        <SlidersHorizontal className="h-4 w-4" />
                                        {t('common.filters')}
                                        {(data.tag_id || data.date_range || data.birthday_month) && (
                                            <Badge className="ml-1 h-5 w-5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 p-0 text-center text-xs">
                                                {[data.tag_id, data.date_range, data.birthday_month].filter(Boolean).length}
                                            </Badge>
                                        )}
                                    </Button>
                                </form>
                                <div className="flex gap-2">
                                    <Tabs
                                        value={viewMode}
                                        onValueChange={(val) => setViewMode(val as 'table' | 'grid')}
                                        className="w-auto"
                                    >
                                        <TabsList className="grid w-full grid-cols-2 bg-muted/60 dark:bg-slate-800/80 dark:border dark:border-slate-700/60 p-0.5">
                                            <TabsTrigger value="table" className="flex items-center gap-2 data-[state=active]:bg-background dark:data-[state=active]:bg-slate-700">
                                                <List className="h-4 w-4" />
                                                {t('common.tableView')}
                                            </TabsTrigger>
                                            <TabsTrigger value="grid" className="flex items-center gap-2 data-[state=active]:bg-background dark:data-[state=active]:bg-slate-700">
                                                <LayoutGrid className="h-4 w-4" />
                                                {t('common.gridView')}
                                            </TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Button
                                    onClick={() => setShowQuickAddModal(true)}
                                    className="rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-sm hover:shadow-md transition-shadow duration-200"
                                >
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    {t('clients.quickAdd')}
                                </Button>

                                <Link
                                    href={route('clients.create')}
                                    className="inline-flex items-center justify-center rounded-lg border border-indigo-500 bg-white px-4 py-2 text-sm font-medium text-indigo-600 shadow-sm transition-all hover:bg-indigo-50 hover:shadow-md dark:border-indigo-600 dark:bg-slate-800/80 dark:text-indigo-400 dark:hover:bg-slate-700/90"
                                >
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    {t('common.addDetailed')}
                                </Link>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="flex items-center justify-center gap-2 border-border/60 bg-white shadow-sm hover:bg-gray-50 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-gray-200 dark:hover:bg-slate-700/90"
                                        >
                                            <Import className="h-4 w-4" />
                                            {t('common.import')}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="dark:bg-slate-800 dark:border-slate-700/60">
                                        <DropdownMenuItem onSelect={() => setShowImportModal(true)} className="dark:hover:bg-slate-700/90 dark:focus:bg-slate-700/90">
                                            {t('import.fromCSV')}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => setShowSimpleImportModal(true)} className="dark:hover:bg-slate-700/90 dark:focus:bg-slate-700/90">
                                            {t('import.simpleFormat')}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <Button
                                    variant="outline"
                                    className="flex items-center justify-center gap-2 border-border/60 bg-white shadow-sm hover:bg-gray-50 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-gray-200 dark:hover:bg-slate-700/90"
                                    onClick={() => setShowExportModal(true)}
                                >
                                    <Download className="h-4 w-4" />
                                    {t('common.export')}
                                </Button>
                            </div>
                        </div>

                        {/* Filters panel */}
                        <Transition
                            show={showFiltersPanel}
                            enter="transition ease-out duration-200"
                            enterFrom="opacity-0 translate-y-1"
                            enterTo="opacity-100 translate-y-0"
                            leave="transition ease-in duration-150"
                            leaveFrom="opacity-100 translate-y-0"
                            leaveTo="opacity-0 translate-y-1"
                        >
                            <Card className="mt-2 border-border/60 dark:border-slate-700/60 dark:bg-slate-800/90">
                                <CardContent className="pt-6">
                                    <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                        <div>
                                            <Label htmlFor="tag_filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {t('filters.tags')}
                                            </Label>
                                            <select
                                                value={data.tag_id}
                                                onChange={(e) => setData('tag_id', e.target.value)}
                                                className="mt-1 block w-full rounded-lg border border-border/60 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-slate-700/60 dark:bg-slate-800 dark:text-white"
                                            >
                                                <option value="">{t('common.all')}</option>
                                                {tags.map((tag) => (
                                                    <option key={tag.id} value={tag.id.toString()}>
                                                        {tag.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <Label htmlFor="date_range" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {t('filters.dateRange')}
                                            </Label>
                                            <select
                                                value={data.date_range}
                                                onChange={(e) => setData('date_range', e.target.value)}
                                                className="mt-1 block w-full rounded-lg border border-border/60 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-slate-700/60 dark:bg-slate-800 dark:text-white"
                                            >
                                                <option value="">{t('common.all')}</option>
                                                <option value="today">{t('filters.today')}</option>
                                                <option value="this_week">{t('filters.thisWeek')}</option>
                                                <option value="this_month">{t('filters.thisMonth')}</option>
                                                <option value="last_30_days">{t('filters.last30Days')}</option>
                                                <option value="this_year">{t('filters.thisYear')}</option>
                                            </select>
                                        </div>
                                        <div>
                                            <Label htmlFor="birthday_month" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {t('filters.birthdayMonth')}
                                            </Label>
                                            <select
                                                value={data.birthday_month}
                                                onChange={(e) => setData('birthday_month', e.target.value)}
                                                className="mt-1 block w-full rounded-lg border border-border/60 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-slate-700/60 dark:bg-slate-800 dark:text-white"
                                            >
                                                <option value="">{t('common.all')}</option>
                                                <option value="1">{t('months.january')}</option>
                                                <option value="2">{t('months.february')}</option>
                                                <option value="3">{t('months.march')}</option>
                                                <option value="4">{t('months.april')}</option>
                                                <option value="5">{t('months.may')}</option>
                                                <option value="6">{t('months.june')}</option>
                                                <option value="7">{t('months.july')}</option>
                                                <option value="8">{t('months.august')}</option>
                                                <option value="9">{t('months.september')}</option>
                                                <option value="10">{t('months.october')}</option>
                                                <option value="11">{t('months.november')}</option>
                                                <option value="12">{t('months.december')}</option>
                                            </select>
                                        </div>
                                        <div>
                                            <Label htmlFor="sort_by" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {t('filters.sortBy')}
                                            </Label>
                                            <div className="mt-1 flex rounded-md shadow-sm">
                                                <Select
                                                    value={data.sort_by}
                                                    onValueChange={(val) => setData('sort_by', val)}
                                                >
                                                    <SelectTrigger className="rounded-r-none border-border/60 dark:border-slate-700/60 dark:bg-slate-800 dark:text-white">
                                                        <SelectValue placeholder={t('common.name')} />
                                                    </SelectTrigger>
                                                    <SelectContent className="dark:bg-slate-800 dark:border-slate-700/60">
                                                        <SelectItem value="name">{t('common.name')}</SelectItem>
                                                        <SelectItem value="created_at">{t('common.dateAdded')}</SelectItem>
                                                        <SelectItem value="last_contact">{t('common.lastContact')}</SelectItem>
                                                        <SelectItem value="birthday">{t('common.birthday')}</SelectItem>
                                                        <SelectItem value="total_sms">{t('common.totalSms')}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setData('sort_direction', data.sort_direction === 'asc' ? 'desc' : 'asc')}
                                                    className="rounded-l-none border border-l-0 border-border/60 dark:border-slate-700/60 dark:bg-slate-700 dark:text-gray-200"
                                                >
                                                    {data.sort_direction === 'asc' ? '↑' : '↓'}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end space-x-3">
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setData({
                                                    search: '',
                                                    tag_id: '',
                                                    date_range: '',
                                                    birthday_month: '',
                                                    sort_by: 'name',
                                                    sort_direction: 'asc',
                                                });
                                                get(route('clients.index'), {
                                                    preserveState: true,
                                                    replace: true,
                                                });
                                            }}
                                            className="border-border/60 dark:border-slate-700/60 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600"
                                        >
                                            {t('common.resetFilters')}
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                get(route('clients.index'), {
                                                    preserveState: true,
                                                    replace: true,
                                                });
                                            }}
                                            className="rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-sm hover:shadow-md transition-shadow duration-200"
                                        >
                                            {t('common.applyFilters')}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </Transition>

                        {/* Bulk action bar */}
                        {selectedClients.length > 0 && (
                            <Card className="sticky top-20 z-10 mt-2 border-none bg-gradient-to-r from-indigo-100 to-purple-100 shadow-md transition-all dark:from-indigo-900/30 dark:to-purple-900/30 dark:border-indigo-800/40">
                                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                                    <div className="flex items-center text-indigo-700 dark:text-indigo-300">
                                        <Check className="mr-2 h-5 w-5" />
                                        <span className="font-medium">
                                            {selectedClients.length} {t('clients.selectedClients')}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            onClick={() => handleBulkAction('sms')}
                                            className="rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-sm hover:shadow-md transition-shadow duration-200"
                                        >
                                            <MessageSquare className="mr-2 h-4 w-4" />
                                            {t('clients.sendMessage')}
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="border-border/60 bg-white/80 dark:border-slate-700/80 dark:bg-slate-800/90 dark:text-gray-200 dark:hover:bg-slate-700/90"
                                                >
                                                    {t('common.moreActions')}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="dark:bg-slate-800 dark:border-slate-700/60">
                                                <DropdownMenuItem onSelect={() => setShowExportModal(true)} className="dark:hover:bg-slate-700/90 dark:focus:bg-slate-700/90">
                                                    {t('clients.exportSelected')}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onSelect={() => handleBulkAction('delete')}
                                                    className="text-rose-600 focus:text-rose-600 dark:text-rose-400 dark:focus:text-rose-400 dark:hover:bg-slate-700/90 dark:focus:bg-slate-700/90"
                                                >
                                                    {t('clients.deleteSelected')}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <Button
                                            variant="outline"
                                            onClick={() => setSelectedClients([])}
                                            className="border-border/60 bg-white/80 dark:border-slate-700/80 dark:bg-slate-800/90 dark:text-gray-200 dark:hover:bg-slate-700/90"
                                        >
                                            <X className="mr-2 h-4 w-4" />
                                            {t('common.cancel')}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Table View */}
                    {viewMode === 'table' && (
                        <Card className="overflow-hidden border-border/60 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/90">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-gray-50/80 dark:bg-slate-700/80">
                                        <TableRow>
                                            <TableHead className="w-10 px-6">
                                                <Checkbox
                                                    checked={clients.data.length > 0 && selectedClients.length === clients.data.length}
                                                    onCheckedChange={toggleAllClients}
                                                    className="border-border/80 dark:border-slate-600"
                                                />
                                            </TableHead>
                                            <TableHead
                                                className="px-6 cursor-pointer"
                                                onClick={() => handleSortChange('name')}
                                            >
                                                <div className="flex items-center">
                                                    {t('common.name')}
                                                    {data.sort_by === 'name' && (
                                                        <span className="ml-1">
                                                            {data.sort_direction === 'asc' ? '↑' : '↓'}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableHead>
                                            <TableHead className="px-6">{t('common.phone')}</TableHead>
                                            <TableHead className="px-6">{t('common.email')}</TableHead>
                                            <TableHead className="px-6">{t('common.tags')}</TableHead>
                                            <TableHead
                                                className="px-6 cursor-pointer"
                                                onClick={() => handleSortChange('birthday')}
                                            >
                                                <div className="flex items-center">
                                                    {t('common.birthday')}
                                                    {data.sort_by === 'birthday' && (
                                                        <span className="ml-1">
                                                            {data.sort_direction === 'asc' ? '↑' : '↓'}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableHead>
                                            <TableHead
                                                className="px-6 cursor-pointer"
                                                onClick={() => handleSortChange('last_contact')}
                                            >
                                                <div className="flex items-center">
                                                    {t('common.lastContact')}
                                                    {data.sort_by === 'last_contact' && (
                                                        <span className="ml-1">
                                                            {data.sort_direction === 'asc' ? '↑' : '↓'}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableHead>
                                            <TableHead className="px-6 text-right">{t('common.actions')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {clients.data.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="h-96 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <Users2 className="h-12 w-12 text-gray-400" />
                                                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">{t('clients.noClients')}</h3>
                                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('clients.noClientsDescription')}</p>
                                                        <div className="mt-6">
                                                            <Link
                                                                href={route('clients.create')}
                                                                className="inline-flex items-center rounded-md border border-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                                            >
                                                                <PlusCircle className="mr-2 h-4 w-4" />
                                                                {t('common.addClient')}
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            clients.data.map((client) => (
                                                <TableRow key={client.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/70 dark:border-slate-700/60">
                                                    <TableCell className="px-6">
                                                        <Checkbox
                                                            checked={selectedClients.includes(client.id)}
                                                            onCheckedChange={() => toggleClient(client.id)}
                                                            className="border-border/80 dark:border-slate-600"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="px-6">
                                                        <Link
                                                            href={route('clients.show', client.id)}
                                                            className="flex items-center"
                                                        >
                                                            <Avatar className={`${getAvatarColor(client.name)} text-white h-9 w-9`}>
                                                                <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
                                                            </Avatar>
                                                            <span className="ml-3 font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200">
                                                                {client.name}
                                                            </span>
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell className="px-6 text-sm text-gray-500 dark:text-gray-400">
                                                        <div className="flex items-center">
                                                            <Phone className="mr-2 h-4 w-4" />
                                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                                {formatPhoneNumber(client.phone)}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-6 text-sm text-gray-500 dark:text-gray-400">
                                                        {client.email && (
                                                            <a href={`mailto:${client.email}`} className="flex items-center hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200">
                                                                <Mail className="mr-2 h-4 w-4" />
                                                                <span className="truncate max-w-[150px]">{client.email}</span>
                                                            </a>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-6 text-sm text-gray-500 dark:text-gray-400">
                                                        {client.tags && client.tags.length > 0 && (
                                                            <div className="flex flex-wrap gap-1">
                                                                {client.tags.map(tag => (
                                                                    <Badge
                                                                        key={tag.id}
                                                                        variant="secondary"
                                                                        className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
                                                                    >
                                                                        {tag.name}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-6 text-sm text-gray-500 dark:text-gray-400">
                                                        {client.birthday && (
                                                            <div className="flex items-center">
                                                                <Calendar className="mr-2 h-4 w-4" />
                                                                {formatDate(client.birthday)}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-6 text-sm text-gray-500 dark:text-gray-400">
                                                        {client.lastContact && (
                                                            <div className="flex items-center">
                                                                <Clock className="mr-2 h-4 w-4" />
                                                                {formatDate(client.lastContact)}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-6 text-sm text-right">
                                                        <div className="flex space-x-2 justify-end">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 px-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:text-indigo-300 dark:hover:bg-indigo-900/30"
                                                                asChild
                                                            >
                                                                <Link href={route('clients.show', client.id)}>
                                                                    <Eye className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 px-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:text-indigo-300 dark:hover:bg-indigo-900/30"
                                                                asChild
                                                            >
                                                                <Link href={route('clients.edit', client.id)}>
                                                                    <Edit className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 px-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-900/30"
                                                                onClick={() => {
                                                                    setClientToDelete(client.id);
                                                                    setShowDeleteConfirmModal(true);
                                                                }}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {clients.links.length > 3 && (
                                <div className="border-t border-border/60 px-4 py-3 dark:border-slate-700/60 sm:px-6">
                                    <div className="flex items-center justify-between">
                                        <div className="hidden sm:block">
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                {t('pagination.showing')} <span className="font-medium">{clients.data.length}</span> {t('pagination.of')} <span className="font-medium">{clients.total}</span> {t('pagination.results')}
                                            </p>
                                        </div>
                                        <div className="flex flex-1 justify-between sm:justify-end">
                                            {clients.links.map((link, i) => {
                                                // Skip the non-page links
                                                if (i === 0 || i === clients.links.length - 1 || !link.url) {
                                                    return null;
                                                }

                                                return (
                                                    <Link
                                                        key={i}
                                                        href={link.url}
                                                        className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${link.active
                                                            ? 'z-10 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-sm focus:z-20'
                                                            : 'bg-white text-gray-500 hover:bg-gray-50 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700/90'
                                                            } border border-border/60 dark:border-slate-700/60 mx-1 rounded-md`}
                                                    >
                                                        {link.label.replace('&laquo;', '←').replace('&raquo;', '→')}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Card>
                    )}

                    {/* Grid View */}
                    {viewMode === 'grid' && (
                        <div className="space-y-6">
                            {clients.data.length === 0 ? (
                                <Card className="mt-6 px-6 py-12 text-center border-border/60 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/90">
                                    <div className="flex flex-col items-center">
                                        <Users2 className="h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">{t('clients.noClients')}</h3>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('clients.noClientsDescription')}</p>
                                        <div className="mt-6">
                                            <Link
                                                href={route('clients.create')}
                                                className="inline-flex items-center rounded-lg border border-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                            >
                                                <PlusCircle className="mr-2 h-4 w-4" />
                                                {t('common.addClient')}
                                            </Link>
                                        </div>
                                    </div>
                                </Card>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                        {clients.data.map((client) => (
                                            <Card key={client.id} className="relative overflow-hidden border-border/60 transition-all hover:shadow-md dark:border-slate-700/60 dark:bg-slate-800/90">
                                                {/* Header with checkbox */}
                                                <div className="relative">
                                                    <div className="absolute left-3 top-3 z-10">
                                                        <Checkbox
                                                            checked={selectedClients.includes(client.id)}
                                                            onCheckedChange={() => toggleClient(client.id)}
                                                            className="border-border/80 dark:border-slate-600"
                                                        />
                                                    </div>
                                                    <div className="absolute right-3 top-3 z-10">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 rounded-full p-0 hover:bg-white/80 dark:hover:bg-slate-700/80"
                                                                >
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent className="dark:bg-slate-800 dark:border-slate-700/60">
                                                                <DropdownMenuItem className="dark:hover:bg-slate-700/90 dark:focus:bg-slate-700/90">
                                                                    <Link
                                                                        href={route('clients.edit', client.id)}
                                                                        className="w-full flex"
                                                                    >
                                                                        {t('common.edit')}
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="text-rose-600 focus:text-rose-600 dark:text-rose-400 dark:focus:text-rose-400 dark:hover:bg-slate-700/90 dark:focus:bg-slate-700/90"
                                                                    onSelect={(e) => {
                                                                        e.preventDefault();
                                                                        setClientToDelete(client.id);
                                                                        setShowDeleteConfirmModal(true);
                                                                    }}
                                                                >
                                                                    {t('common.delete')}
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>

                                                    {/* Avatar and client name */}
                                                    <div className="flex flex-col items-center p-5">
                                                        <Avatar className={`${getAvatarColor(client.name)} mb-3 h-16 w-16 text-xl font-bold text-white shadow-md`}>
                                                            <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
                                                        </Avatar>
                                                        <Link
                                                            href={route('clients.show', client.id)}
                                                            className="mt-1 truncate text-center text-lg font-medium text-gray-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400 transition-colors duration-200"
                                                        >
                                                            {client.name}
                                                        </Link>

                                                        {/* Tags */}
                                                        {client.tags && client.tags.length > 0 && (
                                                            <div className="mt-2 flex flex-wrap justify-center gap-1">
                                                                {client.tags.slice(0, 2).map(tag => (
                                                                    <Badge
                                                                        key={tag.id}
                                                                        variant="secondary"
                                                                        className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
                                                                    >
                                                                        {tag.name}
                                                                    </Badge>
                                                                ))}
                                                                {client.tags.length > 2 && (
                                                                    <Badge variant="outline" className="text-gray-600 dark:text-gray-300 border-border/60 dark:border-slate-700/60">
                                                                        +{client.tags.length - 2}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Contact info */}
                                                <Separator className="dark:bg-slate-700/60" />
                                                <div className="p-4">
                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                                                            <Phone className="mr-2 h-3.5 w-3.5 text-gray-500 dark:text-gray-500" />
                                                            <div className="flex items-center">
                                                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                                                    {formatPhoneNumber(client.phone)}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {client.email && (
                                                            <div className="flex items-center text-gray-600 dark:text-gray-400">
                                                                <Mail className="mr-2 h-3.5 w-3.5 text-gray-500 dark:text-gray-500" />
                                                                <a href={`mailto:${client.email}`} className="truncate hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200">
                                                                    {client.email}
                                                                </a>
                                                            </div>
                                                        )}

                                                        {client.birthday && (
                                                            <div className="flex items-center text-gray-600 dark:text-gray-400">
                                                                <Calendar className="mr-2 h-3.5 w-3.5 text-gray-500 dark:text-gray-500" />
                                                                {formatDate(client.birthday)}
                                                            </div>
                                                        )}

                                                        {client.lastContact && (
                                                            <div className="flex items-center text-gray-600 dark:text-gray-400">
                                                                <Clock className="mr-2 h-3.5 w-3.5 text-gray-500 dark:text-gray-500" />
                                                                {formatDate(client.lastContact)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Quick actions */}
                                                <Separator className="dark:bg-slate-700/60" />
                                                <div className="grid grid-cols-2 divide-x divide-border/60 dark:divide-slate-700/60">
                                                    <Link
                                                        href={route('clients.show', client.id)}
                                                        className="flex items-center justify-center py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-indigo-50 hover:text-indigo-700 dark:text-gray-400 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-300"
                                                    >
                                                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                                                        {t('common.show')}
                                                    </Link>
                                                    <Link
                                                        href={route('clients.edit', client.id)}
                                                        className="flex items-center justify-center py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-indigo-50 hover:text-indigo-700 dark:text-gray-400 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-300"
                                                    >
                                                        <Edit className="mr-1.5 h-3.5 w-3.5" />
                                                        {t('common.edit')}
                                                    </Link>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>

                                    {/* Pagination */}
                                    {clients.links.length > 3 && (
                                        <div className="mt-6 flex items-center justify-between border-t border-border/60 px-4 py-3 dark:border-slate-700/60 sm:px-6">
                                            <div className="hidden sm:block">
                                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                                    {t('pagination.showing')} <span className="font-medium">{clients.data.length}</span> {t('pagination.of')} <span className="font-medium">{clients.total}</span> {t('pagination.results')}
                                                </p>
                                            </div>
                                            <div className="flex flex-1 justify-between sm:justify-end">
                                                {clients.links.map((link, i) => {
                                                    // Skip non-page links
                                                    if (i === 0 || i === clients.links.length - 1 || !link.url) {
                                                        return null;
                                                    }

                                                    return (
                                                        <Link
                                                            key={i}
                                                            href={link.url}
                                                            className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${link.active
                                                                ? 'z-10 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-sm focus:z-20'
                                                                : 'bg-white text-gray-500 hover:bg-gray-50 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700/90'
                                                                } border border-border/60 dark:border-slate-700/60 mx-1 rounded-md`}
                                                        >
                                                            {link.label.replace('&laquo;', '←').replace('&raquo;', '→')}
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {/* Import CSV Modal */}
            <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
                <DialogContent className="sm:max-w-lg dark:bg-slate-800 dark:border-slate-700/60">
                    <DialogHeader>
                        <DialogTitle>{t('import.title')}</DialogTitle>
                        <DialogDescription className="dark:text-gray-400">
                            {t('import.description')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4">
                        <Label htmlFor="file_import">{t('import.selectFile')}</Label>
                        <Input
                            id="file_import"
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="mt-1 bg-white border-border/60 dark:bg-slate-700 dark:border-slate-600"
                            disabled={importLoading}
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {t('import.fileFormats')}
                        </p>
                    </div>

                    {previewData.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {t('import.preview')}
                            </h3>
                            <ScrollArea className="mt-2 h-40 rounded-md border border-border/60 bg-gray-50/80 p-2 dark:border-slate-700/60 dark:bg-slate-700/80">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="dark:border-slate-600">
                                            {Object.keys(previewData[0]).map(header => (
                                                <TableHead key={header} className="px-3 py-2 text-xs">
                                                    {header}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {previewData.map((row, rowIndex) => (
                                            <TableRow key={rowIndex} className="dark:border-slate-600">
                                                {Object.entries(row).map(([key, value]) => (
                                                    <TableCell key={key} className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                                                        {value}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </div>
                    )}

                    {Object.keys(fieldMapping).length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {t('import.fieldMapping')}
                            </h3>
                            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                {t('import.fieldMappingDescription')}
                            </p>
                            <ScrollArea className="mt-2 h-60 pr-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {Object.entries(fieldMapping).map(([csvField, appField]) => (
                                        <div key={csvField}>
                                            <Label htmlFor={`mapping_${csvField}`}>{csvField}</Label>
                                            <Select
                                                value={appField}
                                                onValueChange={(val) => setFieldMapping({
                                                    ...fieldMapping,
                                                    [csvField]: val,
                                                })}
                                                disabled={importLoading}
                                            >
                                                <SelectTrigger id={`mapping_${csvField}`} className="mt-1 w-full border-border/60 dark:bg-slate-700 dark:border-slate-600">
                                                    <SelectValue placeholder={t('import.ignore')} />
                                                </SelectTrigger>
                                                <SelectContent className="dark:bg-slate-800 dark:border-slate-700/60">
                                                    <SelectItem value="ignore">{t('import.ignore')}</SelectItem>
                                                    <SelectItem value="name">{t('common.name')}</SelectItem>
                                                    <SelectItem value="phone">{t('common.phone')}</SelectItem>
                                                    <SelectItem value="email">{t('common.email')}</SelectItem>
                                                    <SelectItem value="birthday">{t('common.birthday')}</SelectItem>
                                                    <SelectItem value="address">{t('common.address')}</SelectItem>
                                                    <SelectItem value="notes">{t('common.notes')}</SelectItem>
                                                    <SelectItem value="tags">{t('common.tags')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    )}

                    <DialogFooter className="mt-6">
                        <Button
                            variant="outline"
                            onClick={() => setShowImportModal(false)}
                            disabled={importLoading}
                            className="border-border/60 dark:border-slate-700/60 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600"
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            onClick={handleImport}
                            disabled={importLoading || !selectedFile || Object.values(fieldMapping).filter(Boolean).length === 0}
                            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-sm hover:shadow-md transition-shadow duration-200 disabled:opacity-70"
                        >
                            {importLoading ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    {t('import.importing')}
                                </>
                            ) : t('import.import')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Simple Import Modal */}
            <Dialog open={showSimpleImportModal} onOpenChange={setShowSimpleImportModal}>
                <DialogContent className="sm:max-w-md dark:bg-slate-800 dark:border-slate-700/60">
                    <DialogHeader>
                        <DialogTitle>{t('import.simpleTitle')}</DialogTitle>
                        <DialogDescription className="dark:text-gray-400">
                            {t('import.simpleDescription')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4">
                        <Label htmlFor="contacts_text">{t('import.contactList')}</Label>
                        <Textarea
                            id="contacts_text"
                            value={contactsText}
                            onChange={(e) => setContactsText(e.target.value)}
                            rows={10}
                            placeholder={t('import.contactsPlaceholder')}
                            className="mt-1 border-border/60 dark:bg-slate-700 dark:border-slate-600"
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {t('import.contactsExample')}
                        </p>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button
                            variant="outline"
                            onClick={() => setShowSimpleImportModal(false)}
                            disabled={importLoading}
                            className="border-border/60 dark:border-slate-700/60 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600"
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            onClick={handleSimpleImport}
                            disabled={importLoading || !contactsText.trim()}
                            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-sm hover:shadow-md transition-shadow duration-200"
                        >
                            {importLoading ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    {t('import.importing')}
                                </>
                            ) : t('import.import')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Export Modal */}
            <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
                <DialogContent className="sm:max-w-md dark:bg-slate-800 dark:border-slate-700/60">
                    <DialogHeader>
                        <DialogTitle>{t('export.title')}</DialogTitle>
                        <DialogDescription className="dark:text-gray-400">
                            {selectedClients.length > 0
                                ? t('export.selectedDescription', { count: selectedClients.length })
                                : t('export.description')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {t('export.format')}
                        </h3>
                        <div className="mt-2 space-y-3">
                            <Button
                                variant="outline"
                                onClick={() => handleExport('csv')}
                                className="w-full justify-between border-border/60 bg-white/80 px-6 py-4 text-left hover:bg-indigo-50 dark:border-slate-700/60 dark:bg-slate-800/90 dark:text-gray-200 dark:hover:bg-indigo-900/20"
                            >
                                <div className="flex items-center">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-600 dark:from-indigo-900/50 dark:to-indigo-800/50 dark:text-indigo-400 mr-3">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <span className="block font-medium">CSV</span>
                                        <span className="block text-xs text-gray-500 dark:text-gray-400">{t('export.csvDescription')}</span>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-gray-400" />
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => handleExport('excel')}
                                className="w-full justify-between border-border/60 bg-white/80 px-6 py-4 text-left hover:bg-green-50 dark:border-slate-700/60 dark:bg-slate-800/90 dark:text-gray-200 dark:hover:bg-green-900/20"
                            >
                                <div className="flex items-center">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-green-100 to-green-200 text-green-600 dark:from-green-900/50 dark:to-green-800/50 dark:text-green-400 mr-3">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <span className="block font-medium">Excel</span>
                                        <span className="block text-xs text-gray-500 dark:text-gray-400">{t('export.excelDescription')}</span>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-gray-400" />
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Bulk SMS Modal */}
            <Dialog open={showBulkSmsModal} onOpenChange={setShowBulkSmsModal}>
                <DialogContent className="sm:max-w-md dark:bg-slate-800 dark:border-slate-700/60">
                    <DialogHeader>
                        <DialogTitle>{t('sms.sendToSelected', { count: selectedClients.length })}</DialogTitle>
                        <DialogDescription className="dark:text-gray-400">
                            {t('sms.bulkDescription')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4">
                        <Label htmlFor="bulk_sms_content">{t('sms.content')}</Label>
                        <Textarea
                            id="bulk_sms_content"
                            value={bulkSmsContent}
                            onChange={(e) => setBulkSmsContent(e.target.value)}
                            rows={5}
                            className="mt-1 border-border/60 dark:bg-slate-700 dark:border-slate-600"
                        />
                        <div className="mt-2 flex justify-between text-xs">
                            <span className="text-gray-500 dark:text-gray-400">
                                {bulkSmsContent.length} {t('sms.characters')}
                                ({smsPreviewInfo.segments} {t('sms.segments')})
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 dark:text-indigo-400 dark:hover:text-indigo-300 dark:hover:bg-indigo-900/50"
                                onClick={() => setShowSmsPreviewModal(true)}
                            >
                                {t('sms.preview')}
                            </Button>
                        </div>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button
                            variant="outline"
                            onClick={() => setShowBulkSmsModal(false)}
                            className="border-border/60 dark:border-slate-700/60 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600"
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            onClick={handleBulkSms}
                            disabled={!bulkSmsContent.trim()}
                            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-sm hover:shadow-md transition-shadow duration-200"
                        >
                            <MessageSquarePlus className="mr-2 h-4 w-4" />
                            {t('sms.send')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* SMS Preview Modal */}
            <Dialog open={showSmsPreviewModal} onOpenChange={setShowSmsPreviewModal}>
                <DialogContent className="sm:max-w-md dark:bg-slate-800 dark:border-slate-700/60">
                    <DialogHeader>
                        <DialogTitle>{t('sms.preview')}</DialogTitle>
                    </DialogHeader>

                    <div className="mt-4 rounded-lg bg-gray-100 p-4 dark:bg-slate-700/50">
                        <div className="mb-4 max-w-xs rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-3 text-white">
                            <p className="whitespace-pre-wrap">{bulkSmsContent}</p>
                        </div>

                        <div className="text-sm text-gray-600 dark:text-gray-300">
                            <p className="mb-1">{t('sms.characterCount')}: <span className="font-medium">{smsPreviewInfo.characters}</span></p>
                            <p className="mb-1">{t('sms.segmentCount')}: <span className="font-medium">{smsPreviewInfo.segments}</span></p>
                            <p className="mb-1">{t('sms.recipientCount')}: <span className="font-medium">{selectedClients.length}</span></p>
                            <p className="font-bold">{t('sms.totalMessages')}: <span>{smsPreviewInfo.segments * selectedClients.length}</span></p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            onClick={() => setShowSmsPreviewModal(false)}
                            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-sm hover:shadow-md transition-shadow duration-200"
                        >
                            {t('common.close')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Quick Add Modal */}
            <Dialog open={showQuickAddModal} onOpenChange={setShowQuickAddModal}>
                <DialogContent className="sm:max-w-md dark:bg-slate-800 dark:border-slate-700/60">
                    <DialogHeader>
                        <DialogTitle>{t('clients.quickAdd')}</DialogTitle>
                        <DialogDescription className="dark:text-gray-400">
                            {t('clients.quickAddDescription')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4 space-y-4">
                        <div>
                            <Label htmlFor="quick_name">{t('common.name')}</Label>
                            <Input
                                id="quick_name"
                                value={quickAddForm.name}
                                onChange={e => setQuickAddForm({ ...quickAddForm, name: e.target.value })}
                                className="mt-1 border-border/60 dark:bg-slate-700 dark:border-slate-600"
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="quick_phone">{t('common.phone')}</Label>
                            <div className="relative mt-1">
                                <Input
                                    id="quick_phone"
                                    type="tel"
                                    value={quickAddForm.phone}
                                    onChange={e => {
                                        const newValue = e.target.value;
                                        setQuickAddForm({ ...quickAddForm, phone: newValue });
                                        validateAndFormatPhone(newValue);
                                    }}
                                    className={`pr-10 border-border/60 dark:bg-slate-700 dark:border-slate-600 ${quickAddForm.phone && !phoneValidation.isValid ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : ''}`}
                                    placeholder="+237 6XX XXX XXX ou 6XX XXX XXX"
                                    required
                                />
                                {quickAddForm.phone && (
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                        {phoneValidation.isValid ? (
                                            <Check className="h-5 w-5 text-green-500" />
                                        ) : (
                                            <X className="h-5 w-5 text-rose-500" />
                                        )}
                                    </div>
                                )}
                            </div>

                            {quickAddForm.phone && (
                                <div className="mt-1">
                                    {phoneValidation.isValid ? (
                                        <p className="text-xs text-green-600 dark:text-green-400">
                                            {phoneValidation.country && `✓ ${phoneValidation.country}: `}
                                            {phoneValidation.formattedNumber}
                                        </p>
                                    ) : (
                                        <p className="text-xs text-rose-600 dark:text-rose-400">
                                            {phoneValidation.errorType === 'format' &&
                                                "Format invalide. Utilisez +237 pour le Cameroun ou +33 pour la France."}
                                            {phoneValidation.errorType === 'length' &&
                                                "Nombre de chiffres incorrect. Cameroun: 9 chiffres, France: 10 chiffres."}
                                            {phoneValidation.errorType === 'characters' &&
                                                "Caractères non autorisés. Utilisez uniquement des chiffres, +, espaces."}
                                        </p>
                                    )}
                                </div>
                            )}

                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Formats acceptés: +237 6XX XXX XXX (Cameroun), +33 X XX XX XX XX (France)
                            </p>
                        </div>

                        <div>
                            <Label htmlFor="quick_gender">{t('common.gender')}</Label>
                            <Select
                                value={quickAddForm.gender}
                                onValueChange={(value) => setQuickAddForm({ ...quickAddForm, gender: value })}
                            >
                                <SelectTrigger id="quick_gender" className="mt-1 border-border/60 dark:bg-slate-700 dark:border-slate-600">
                                    <SelectValue placeholder={t('clients.selectGender')} />
                                </SelectTrigger>
                                <SelectContent className="dark:bg-slate-800 dark:border-slate-700/60">
                                    <SelectItem value="male">{t('gender.male')}</SelectItem>
                                    <SelectItem value="female">{t('gender.female')}</SelectItem>
                                    <SelectItem value="other">{t('gender.other')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="quick_tags">{t('common.tags')}</Label>
                            <div className="mt-1 flex flex-wrap gap-2 border border-border/60 rounded-md p-2 dark:border-slate-700/60 dark:bg-slate-700/50">
                                {tags.map(tag => (
                                    <div
                                        key={tag.id}
                                        onClick={() => {
                                            // Toggle tag selection
                                            const newTagIds = quickAddForm.tagIds.includes(tag.id)
                                                ? quickAddForm.tagIds.filter(id => id !== tag.id)
                                                : [...quickAddForm.tagIds, tag.id];
                                            setQuickAddForm({ ...quickAddForm, tagIds: newTagIds });
                                        }}
                                        className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors duration-200 ${quickAddForm.tagIds.includes(tag.id)
                                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300'
                                            : 'bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-gray-300'
                                            }`}
                                    >
                                        {tag.name}
                                    </div>
                                ))}
                                {tags.length === 0 && (
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {t('tags.noTagsAvailable')}
                                    </span>
                                )}
                            </div>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {t('clients.tagsDescription')}
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button
                            variant="outline"
                            onClick={() => setShowQuickAddModal(false)}
                            className="border-border/60 dark:border-slate-700/60 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600"
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            onClick={handleQuickAdd}
                            disabled={!quickAddForm.name || !quickAddForm.phone}
                            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-sm hover:shadow-md transition-shadow duration-200"
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {t('common.save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={showDeleteConfirmModal} onOpenChange={setShowDeleteConfirmModal}>
                <DialogContent className="sm:max-w-md dark:bg-slate-800 dark:border-slate-700/60">
                    <DialogHeader>
                        <DialogTitle className="text-rose-600 dark:text-rose-400">
                            {clientToDelete
                                ? t('clients.deleteConfirmation')
                                : t('clients.bulkDeleteConfirmation', { count: clientsToDelete.length })}
                        </DialogTitle>
                        <DialogDescription className="dark:text-gray-400">
                            {clientToDelete
                                ? t('clients.deleteWarning')
                                : t('clients.bulkDeleteWarning', { count: clientsToDelete.length })}
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="mt-6">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setClientToDelete(null);
                                setClientsToDelete([]);
                                setShowDeleteConfirmModal(false);
                            }}
                            className="border-border/60 dark:border-slate-700/60 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600"
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            className="bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-700"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('common.delete')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );

    function ShieldCheck(props: React.SVGProps<SVGSVGElement>) {
        return (
            <svg
                {...props}
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                <path d="m9 12 2 2 4-4" />
            </svg>
        );
    }

    function ChevronRight(props: React.SVGProps<SVGSVGElement>) {
        return (
            <svg
                {...props}
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M9 18l6-6-6-6" />
            </svg>
        );
    }

    function Import(props: React.SVGProps<SVGSVGElement>) {
        return (
            <svg
                {...props}
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M12 3v12"></path>
                <path d="m8 11 4 4 4-4"></path>
                <path d="M8 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4"></path>
            </svg>
        );
    }

    function UserPlus(props: React.SVGProps<SVGSVGElement>) {
        return (
            <svg
                {...props}
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <line x1="19" x2="19" y1="8" y2="14"></line>
                <line x1="22" x2="16" y1="11" y2="11"></line>
            </svg>
        );
    }
}