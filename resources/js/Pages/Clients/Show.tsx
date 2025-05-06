import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/Utils/toast';
import axios from 'axios';
import {
    CalendarDays, Phone, Mail, MapPin, Tag, Clock, MessageSquare,
    CheckCircle, AlertCircle, FileText, User, MessageCircle, Home,
    Edit, Save, X, Plus, Check, ArrowLeft, Send, ChevronDown,
    Calendar, Activity, PieChart, Users, Copy, Share2, Trash2, MessageCircleOff, PlusCircle
} from 'lucide-react';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import TagSelector from '@/Components/TagSelector';
import { Transition } from '@headlessui/react';

interface Message {
    id: number;
    content: string;
    status: string;
    sent_at: string;
    created_at: string;
    sent_by_client?: boolean;
    campaign?: {
        id: number;
        name: string;
    };
}

interface Visit {
    id: number;
    client_id: number;
    visit_date: string;
    notes: string | null;
    created_at: string;
}

interface Tag {
    id: number;
    name: string;
}

interface Client {
    id: number;
    name: string;
    email: string;
    phone: string;
    address?: string;
    notes?: string;
    messages: Message[];
    created_at: string;
    messages_count: number;
    successful_messages_count: number;
    visits: Visit[];
    totalSmsCount?: number;
    lastSmsDate?: string;
    lastContact?: string;
    birthday: string | null;
    gender: string | null;
    tags: {
        id: number;
        name: string;
    }[];
    is_active: boolean;
    last_visit_date: string | null;
}

interface ClientShowProps extends PageProps {
    client: Client;
    tags: Tag[];
}

interface ClientFormData {
    name: string;
    phone: string;
    email: string;
    birthday: string;
    gender: string;
    address: string;
    notes: string;
    [key: string]: any;
}

export default function Show({ auth, client: initialClient, tags: initialTags }: ClientShowProps) {
    const { t } = useTranslation();
    const { success, error } = useToast();
    const [isAddingVisit, setIsAddingVisit] = useState(false);
    const [isAddingMessage, setIsAddingMessage] = useState(false);
    const [visitNotes, setVisitNotes] = useState('');
    const [messageContent, setMessageContent] = useState('');
    const [visits, setVisits] = useState<Visit[]>(initialClient.visits || []);
    const [isLoadingVisit, setIsLoadingVisit] = useState(false);
    const [isLoadingMessage, setIsLoadingMessage] = useState(false);
    const [activeTab, setActiveTab] = useState<'messages' | 'visits'>('messages');
    const [isEditing, setIsEditing] = useState(false);
    const [client, setClient] = useState<Client>(initialClient);
    const [tags, setTags] = useState<Tag[]>(initialTags);
    const [selectedTagsState, setSelectedTagsState] = useState<number[]>(initialClient.tags.map(tag => tag.id) || []);
    const [messages, setMessages] = useState<Message[]>(initialClient.messages || []);
    const [showActionsMenu, setShowActionsMenu] = useState(false);

    // Form for client editing
    const { data, setData, post, processing, errors, reset } = useForm<ClientFormData>({
        name: client.name || '',
        phone: client.phone || '',
        email: client.email || '',
        birthday: client.birthday || '',
        gender: client.gender || '',
        address: client.address || '',
        notes: client.notes || '',
    });

    // Calculate age if birthday is available
    const calculateAge = (birthday: string | null) => {
        if (!birthday) return null;
        const today = new Date();
        const birthDate = new Date(birthday);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered':
                return 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400';
            case 'failed':
                return 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'delivered':
                return <CheckCircle className="h-4 w-4 mr-1" />;
            case 'failed':
                return <AlertCircle className="h-4 w-4 mr-1" />;
            case 'pending':
                return <Clock className="h-4 w-4 mr-1" />;
            default:
                return null;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'delivered':
                return t('messages.status.delivered');
            case 'failed':
                return t('messages.status.failed');
            case 'pending':
                return t('messages.status.pending');
            default:
                return t('common.unknown');
        }
    };

    const formatDate = (date: string | null) => {
        if (!date) return '-';
        return format(new Date(date), 'dd MMMM yyyy', { locale: fr });
    };

    const formatDateTime = (date: string) => {
        if (!date) return '-';
        return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: fr });
    };

    const formatTimeAgo = (date: string | null) => {
        if (!date) return '-';
        return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
    };

    const registerVisit = () => {
        if (!visitNotes.trim()) {
            error(t('visits.notesRequired'));
            return;
        }

        setIsLoadingVisit(true);
        axios.post(`/api/clients/${client.id}/visit`, {
            notes: visitNotes
        })
            .then(response => {
                success(t('visits.registeredSuccess'));

                // Add the new visit to the visits state
                const newVisit = response.data.visit;
                setVisits([newVisit, ...visits]);

                // Update the client's last_visit_date
                setClient(prevClient => ({
                    ...prevClient,
                    last_visit_date: newVisit.visit_date
                }));

                // Reset form
                setIsAddingVisit(false);
                setVisitNotes('');
            })
            .catch(err => {
                error(t('visits.registrationError'));
            })
            .finally(() => {
                setIsLoadingVisit(false);
            });
    };

    const sendDirectMessage = () => {
        if (!messageContent.trim()) {
            error(t('messages.contentRequired'));
            return;
        }

        setIsLoadingMessage(true);
        axios.post(`/api/clients/${client.id}/message`, {
            content: messageContent
        })
            .then(response => {
                success(t('messages.sendSuccess'));

                // Add the new message to the messages state
                const newMessage = response.data.sms;
                setMessages(prevMessages => [newMessage, ...prevMessages]);

                // Update client's message counts
                setClient(prevClient => ({
                    ...prevClient,
                    messages_count: (prevClient.messages_count || 0) + 1,
                    successful_messages_count: newMessage.status === 'delivered' ?
                        (prevClient.successful_messages_count || 0) + 1 :
                        prevClient.successful_messages_count,
                    lastContact: new Date().toISOString()
                }));

                // Reset form
                setIsAddingMessage(false);
                setMessageContent('');
            })
            .catch(err => {
                error(t('messages.sendError'));
            })
            .finally(() => {
                setIsLoadingMessage(false);
            });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Use axios.patch to send the form data
        axios.patch(route('clients.update', client.id), {
            ...data,
            tag_ids: selectedTagsState
        })
            .then(response => {
                success(t('clients.updateSuccess'));

                // Update the client state with the new data
                const updatedClient = response.data.client || {
                    ...client,
                    name: data.name,
                    phone: data.phone,
                    email: data.email,
                    address: data.address,
                    notes: data.notes,
                    birthday: data.birthday,
                    gender: data.gender
                };

                // Update tags
                const selectedTags = tags.filter(tag => selectedTagsState.includes(tag.id));
                updatedClient.tags = selectedTags;

                setClient(updatedClient);
                setIsEditing(false);
            })
            .catch(err => {
                if (err.response && err.response.data && err.response.data.errors) {
                    const serverErrors = err.response.data.errors;
                    // Display validation errors
                    for (const key in serverErrors) {
                        error(`${key}: ${serverErrors[key][0]}`);
                    }
                } else {
                    error(t('clients.updateError'));
                }
            });
    };

    // Function to generate avatar gradient based on name
    const getAvatarGradient = (name: string) => {
        const colors = [
            'from-red-500 to-pink-500',
            'from-orange-500 to-amber-500',
            'from-yellow-500 to-lime-500',
            'from-green-500 to-emerald-500',
            'from-teal-500 to-cyan-500',
            'from-blue-500 to-indigo-500',
            'from-indigo-500 to-purple-500',
            'from-purple-500 to-pink-500',
        ];
        const index = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length;
        return colors[index];
    };

    // Calculate statistics
    const messageStats = {
        total: client.messages_count || 0,
        delivered: client.successful_messages_count || 0,
        failedOrPending: (client.messages_count || 0) - (client.successful_messages_count || 0)
    };

    // Get total visits count
    const totalVisits = visits.length;

    // Calculate delivery rate percentage
    const deliveryRate = messageStats.total > 0
        ? Math.round((messageStats.delivered / messageStats.total) * 100)
        : 0;

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Link
                            href={route('clients.index')}
                            className="inline-flex items-center justify-center rounded-full h-8 w-8 bg-white dark:bg-gray-800 shadow-sm text-gray-600 transition-colors hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-white flex items-center gap-2">
                            {client.name}
                            {client.is_active ? (
                                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-800/30 dark:text-green-300">
                                    {t('common.active')}
                                </span>
                            ) : (
                                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                    {t('common.inactive')}
                                </span>
                            )}
                        </h2>
                    </div>

                    <div className="flex items-center space-x-2">
                        <div className="relative">
                            <button
                                onClick={() => setShowActionsMenu(!showActionsMenu)}
                                className="inline-flex items-center rounded-md bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none"
                            >
                                {t('common.actions')}
                                <ChevronDown className="ml-2 h-4 w-4" />
                            </button>
                            <Transition
                                show={showActionsMenu}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                            >
                                <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5">
                                    <div className="py-1" role="menu">
                                        <button
                                            onClick={() => setIsAddingMessage(true)}
                                            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                            role="menuitem"
                                        >
                                            <Send className="mr-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
                                            {t('common.send')}
                                        </button>
                                        <button
                                            onClick={() => setIsAddingVisit(true)}
                                            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                            role="menuitem"
                                        >
                                            <Home className="mr-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
                                            {t('visits.register')}
                                        </button>
                                        <button
                                            onClick={() => setIsEditing(!isEditing)}
                                            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                            role="menuitem"
                                        >
                                            <Edit className="mr-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
                                            {t('common.edit')}
                                        </button>
                                        <div className="border-t border-gray-100 dark:border-gray-700"></div>
                                        <button
                                            className="flex w-full items-center px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            role="menuitem"
                                        >
                                            <Trash2 className="mr-3 h-4 w-4" />
                                            {t('common.delete')}
                                        </button>
                                    </div>
                                </div>
                            </Transition>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={`${t('clients.client')}: ${client.name}`} />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Formulaire d'ajout de visite */}
                    {isAddingVisit && (
                        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 animate-in fade-in duration-300">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                                    <Home className="h-5 w-5 mr-2 text-indigo-500 dark:text-indigo-400" />
                                    {t('visits.registerNew')}
                                </h3>
                                <button
                                    onClick={() => setIsAddingVisit(false)}
                                    className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="mb-4">
                                <label htmlFor="visitNotes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t('visits.notes')}
                                </label>
                                <textarea
                                    id="visitNotes"
                                    rows={4}
                                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                    value={visitNotes}
                                    onChange={(e) => setVisitNotes(e.target.value)}
                                    placeholder={t('visits.notesPlaceholder')}
                                />
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    {t('visits.notesHint')}
                                </p>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddingVisit(false)}
                                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="button"
                                    onClick={registerVisit}
                                    disabled={isLoadingVisit || !visitNotes.trim()}
                                    className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all dark:bg-indigo-500 dark:hover:bg-indigo-600"
                                >
                                    {isLoadingVisit ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            {t('common.saving')}
                                        </>
                                    ) : (
                                        <>
                                            <Check className="mr-2 h-4 w-4" />
                                            {t('visits.register')}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Formulaire d'envoi de message direct */}
                    {isAddingMessage && (
                        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 animate-in fade-in duration-300">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                                    <MessageCircle className="h-5 w-5 mr-2 text-blue-500" />
                                    {t('messages.sendDirect')}
                                </h3>
                                <button
                                    onClick={() => setIsAddingMessage(false)}
                                    className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="mb-4">
                                <label htmlFor="messageContent" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t('messages.content')}
                                </label>
                                <textarea
                                    id="messageContent"
                                    rows={4}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                    value={messageContent}
                                    onChange={(e) => setMessageContent(e.target.value)}
                                    placeholder={t('messages.contentPlaceholder')}
                                    maxLength={160}
                                />
                                <div className="mt-1 flex justify-between items-center">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{messageContent.length} / 160 {t('messages.characters')}</span>
                                    <span className={`text-xs font-medium ${messageContent.length > 160 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {Math.ceil(messageContent.length / 160)} SMS
                                    </span>
                                </div>

                                {/* Message templates suggestions */}
                                <div className="mt-3">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{t('messages.templates')}:</p>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setMessageContent(`${t('messages.templates.appointment', { name: client.name })}`)}
                                            className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                                        >
                                            {t('messages.templates.appointmentConfirmation')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setMessageContent(`${t('messages.templates.proposal', { name: client.name })}`)}
                                            className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                                        >
                                            {t('messages.templates.appointmentProposal')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setMessageContent(`${t('messages.templates.thanks', { name: client.name })}`)}
                                            className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                                        >
                                            {t('messages.templates.thanksAfterVisit')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddingMessage(false)}
                                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="button"
                                    onClick={sendDirectMessage}
                                    disabled={isLoadingMessage || !messageContent.trim()}
                                    className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all dark:bg-blue-700 dark:hover:bg-blue-600"
                                >
                                    {isLoadingMessage ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            {t('messages.sending')}
                                        </>
                                    ) : (
                                        <>
                                            <Send className="mr-2 h-4 w-4" />
                                            {t('messages.send')}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Informations du client */}
                    <div className="grid gap-6 md:grid-cols-3">
                        {/* Profile et détails */}
                        <div className="md:col-span-1 space-y-6">
                            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <div className={`bg-gradient-to-r ${getAvatarGradient(client.name)} p-6 relative`}>
                                    <div className="flex justify-center">
                                        <div className="h-24 w-24 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center text-3xl font-bold shadow-lg">
                                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                                                {client.name.charAt(0).toUpperCase() + (client.name.split(' ')[1]?.[0]?.toUpperCase() || '')}
                                            </span>
                                        </div>
                                    </div>
                                    <h3 className="mt-4 text-center text-xl font-semibold text-white">
                                        {client.name}
                                    </h3>
                                    {client.birthday && (
                                        <p className="mt-1 text-center text-sm text-white/80">
                                            {calculateAge(client.birthday)} ans
                                        </p>
                                    )}

                                    {/* Quick action buttons */}
                                    <div className="absolute top-2 right-2">
                                        <button onClick={() => setIsEditing(!isEditing)} className="rounded-full p-2 bg-white/20 text-white hover:bg-white/30 transition-colors">
                                            <Edit className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Profil en mode affichage */}
                                {!isEditing ? (
                                    <div className="p-5">
                                        <ul className="space-y-4">
                                            <li className="flex items-start">
                                                <div className="flex-shrink-0">
                                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                                                        <Phone className="h-4 w-4" />
                                                    </span>
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{t('common.phone')}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {client.phone}
                                                    </p>
                                                </div>
                                            </li>

                                            {client.email && (
                                                <li className="flex items-start">
                                                    <div className="flex-shrink-0">
                                                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                                            <Mail className="h-4 w-4" />
                                                        </span>
                                                    </div>
                                                    <div className="ml-3">
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{t('common.email')}</p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            <a href={`mailto:${client.email}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                                                {client.email}
                                                            </a>
                                                        </p>
                                                    </div>
                                                </li>
                                            )}

                                            {client.address && (
                                                <li className="flex items-start">
                                                    <div className="flex-shrink-0">
                                                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                            <MapPin className="h-4 w-4" />
                                                        </span>
                                                    </div>
                                                    <div className="ml-3">
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{t('common.address')}</p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            {client.address}
                                                            <a
                                                                href={`https://maps.google.com/?q=${encodeURIComponent(client.address)}`}
                                                                target="_blank"
                                                                className="block text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 mt-1"
                                                            >
                                                                {t('common.viewOnGoogleMaps', 'Voir sur Google Maps')}
                                                            </a>
                                                        </p>
                                                    </div>
                                                </li>
                                            )}

                                            {client.birthday && (
                                                <li className="flex items-start">
                                                    <div className="flex-shrink-0">
                                                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                                                            <CalendarDays className="h-4 w-4" />
                                                        </span>
                                                    </div>
                                                    <div className="ml-3">
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{t('common.birthday')}</p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            {formatDate(client.birthday)}
                                                        </p>
                                                    </div>
                                                </li>
                                            )}

                                            {client.gender && (
                                                <li className="flex items-start">
                                                    <div className="flex-shrink-0">
                                                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                                                            <User className="h-4 w-4" />
                                                        </span>
                                                    </div>
                                                    <div className="ml-3">
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{t('common.gender')}</p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            {client.gender === 'male' ? t('gender.male') : client.gender === 'female' ? t('gender.female') : t('gender.other')}
                                                        </p>
                                                    </div>
                                                </li>
                                            )}
                                        </ul>

                                        {/* Tags section */}
                                        {client.tags.length > 0 && (
                                            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                <h4 className="flex items-center font-medium text-gray-700 dark:text-gray-300 mb-3">
                                                    <Tag className="h-4 w-4 mr-1 text-gray-500" />
                                                    {t('common.tags')}
                                                </h4>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {client.tags.map(tag => (
                                                        <span
                                                            key={tag.id}
                                                            className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                                                        >
                                                            {tag.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Notes section */}
                                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <h4 className="flex items-center font-medium text-gray-700 dark:text-gray-300 mb-3">
                                                <FileText className="h-4 w-4 mr-1 text-gray-500" />
                                                {t('common.notes')}
                                            </h4>
                                            <div className="rounded-md bg-gray-50 p-3 dark:bg-gray-700/50">
                                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                                                    {client.notes || t('common.noNotes')}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Trackers */}
                                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <h4 className="flex items-center font-medium text-gray-700 dark:text-gray-300 mb-3">
                                                <Clock className="h-4 w-4 mr-1 text-gray-500" />
                                                {t('clients.history')}
                                            </h4>
                                            <ul className="space-y-2">
                                                <li className="flex justify-between text-sm">
                                                    <span className="text-gray-500 dark:text-gray-400">{t('clients.clientSince')}</span>
                                                    <span className="font-medium text-gray-900 dark:text-white">{formatDate(client.created_at)}</span>
                                                </li>
                                                <li className="flex justify-between text-sm">
                                                    <span className="text-gray-500 dark:text-gray-400">{t('clients.lastContact')}</span>
                                                    <span className="font-medium text-gray-900 dark:text-white">{formatTimeAgo(client.lastContact || '')}</span>
                                                </li>
                                                <li className="flex justify-between text-sm">
                                                    <span className="text-gray-500 dark:text-gray-400">{t('clients.lastVisit')}</span>
                                                    <span className="font-medium text-gray-900 dark:text-white">{client.last_visit_date ? formatTimeAgo(client.last_visit_date) : '-'}</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                ) : (
                                    /* Formulaire d'édition */
                                    <div className="p-5 animate-in fade-in duration-300">
                                        <form onSubmit={handleSubmit} className="space-y-5">
                                            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3 mb-4">
                                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('clients.editInfo')}</h3>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsEditing(false)}
                                                    className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700 transition-colors"
                                                >
                                                    <X className="h-5 w-5" />
                                                </button>
                                            </div>

                                            <div>
                                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    {t('clients.name')} *
                                                </label>
                                                <input
                                                    id="name"
                                                    type="text"
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                                    value={data.name}
                                                    onChange={e => setData('name', e.target.value)}
                                                    required
                                                />
                                                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                                            </div>

                                            <div>
                                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    {t('clients.phone')} *
                                                </label>
                                                <input
                                                    id="phone"
                                                    type="text"
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                                    value={data.phone}
                                                    onChange={e => setData('phone', e.target.value)}
                                                    required
                                                />
                                                {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
                                            </div>

                                            <div>
                                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    {t('clients.email')}
                                                </label>
                                                <input
                                                    id="email"
                                                    type="email"
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                                    value={data.email}
                                                    onChange={e => setData('email', e.target.value)}
                                                />
                                                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                                            </div>

                                            <div>
                                                <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    {t('clients.address')}
                                                </label>
                                                <input
                                                    id="address"
                                                    type="text"
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                                    value={data.address}
                                                    onChange={e => setData('address', e.target.value)}
                                                />
                                                {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address}</p>}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label htmlFor="birthday" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Date de naissance
                                                    </label>
                                                    <input
                                                        id="birthday"
                                                        type="date"
                                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                                        value={data.birthday}
                                                        onChange={e => setData('birthday', e.target.value)}
                                                    />
                                                    {errors.birthday && <p className="mt-1 text-xs text-red-600">{errors.birthday}</p>}
                                                </div>

                                                <div>
                                                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Genre
                                                    </label>
                                                    <select
                                                        id="gender"
                                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                                        value={data.gender}
                                                        onChange={e => setData('gender', e.target.value)}
                                                    >
                                                        <option value="">Sélectionner</option>
                                                        <option value="male">Homme</option>
                                                        <option value="female">Femme</option>
                                                        <option value="other">Autre</option>
                                                    </select>
                                                    {errors.gender && <p className="mt-1 text-xs text-red-600">{errors.gender}</p>}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Tags
                                                </label>
                                                <TagSelector
                                                    tags={tags}
                                                    selectedTags={selectedTagsState}
                                                    onTagsChange={(tagIds) => {
                                                        setSelectedTagsState(tagIds);
                                                    }}
                                                    className="mt-1"
                                                />
                                                {errors.tags && <p className="mt-1 text-xs text-red-600">{errors.tags}</p>}
                                            </div>

                                            <div>
                                                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Notes
                                                </label>
                                                <textarea
                                                    id="notes"
                                                    rows={3}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                                    value={data.notes}
                                                    onChange={e => setData('notes', e.target.value)}
                                                />
                                                {errors.notes && <p className="mt-1 text-xs text-red-600">{errors.notes}</p>}
                                            </div>

                                            <div className="pt-2 flex justify-end space-x-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsEditing(false)}
                                                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                                                >
                                                    {t('common.cancel')}
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={processing}
                                                    className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all dark:bg-indigo-500 dark:hover:bg-indigo-600"
                                                >
                                                    {processing ? (
                                                        <>
                                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            {t('common.saving')}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save className="mr-2 h-4 w-4" />
                                                            {t('common.save')}
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}
                            </div>

                            {/* Quick Actions Card */}
                            <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
                                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">Actions rapides</h3>
                                </div>
                                <div className="p-4 grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => setIsAddingMessage(true)}
                                        className="flex flex-col items-center justify-center p-3 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 transition-colors"
                                    >
                                        <Send className="h-5 w-5 mb-1" />
                                        <span className="text-xs font-medium">{t('common.send')}</span>
                                    </button>
                                    <button
                                        onClick={() => setIsAddingVisit(true)}
                                        className="flex flex-col items-center justify-center p-3 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20 transition-colors"
                                    >
                                        <Home className="h-5 w-5 mb-1" />
                                        <span className="text-xs font-medium">{t('visits.register')}</span>
                                    </button>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="flex flex-col items-center justify-center p-3 rounded-lg text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20 transition-colors"
                                    >
                                        <Edit className="h-5 w-5 mb-1" />
                                        <span className="text-xs font-medium">{t('common.edit')}</span>
                                    </button>
                                    {client.email && (
                                        <a
                                            href={`mailto:${client.email}`}
                                            className="flex flex-col items-center justify-center p-3 rounded-lg text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20 transition-colors"
                                        >
                                            <Mail className="h-5 w-5 mb-1" />
                                            <span className="text-xs font-medium">{t('common.email')}</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Statistiques et Activités */}
                        <div className="md:col-span-2 space-y-6">
                            {/* Résumé des statistiques */}
                            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <MessageCircle className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                    {t('stats.totalMessages')}
                                                </dt>
                                                <dd>
                                                    <div className="text-lg font-medium text-gray-900 dark:text-white">
                                                        {client.messages_count}
                                                    </div>
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <Calendar className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                    {t('stats.totalVisits')}
                                                </dt>
                                                <dd>
                                                    <div className="text-lg font-medium text-gray-900 dark:text-white">
                                                        {client.visits.length}
                                                    </div>
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Onglets Messages/Visites */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                                <div className="border-b border-gray-200 dark:border-gray-700">
                                    <nav className="flex">
                                        <button
                                            onClick={() => setActiveTab('messages')}
                                            className={`px-6 py-4 text-sm font-medium transition-colors flex items-center ${activeTab === 'messages'
                                                ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                                }`}
                                        >
                                            <MessageCircle className="h-4 w-4 mr-2" />
                                            Messages
                                            <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                                {client.messages_count}
                                            </span>
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('visits')}
                                            className={`px-6 py-4 text-sm font-medium transition-colors flex items-center ${activeTab === 'visits'
                                                ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                                }`}
                                        >
                                            <Home className="h-4 w-4 mr-2" />
                                            Visites
                                            <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                                {client.visits.length}
                                            </span>
                                        </button>
                                    </nav>
                                </div>

                                <div className="p-4">
                                    {activeTab === 'messages' && (
                                        <div className="overflow-hidden">
                                            {client.messages.length === 0 ? (
                                                <div className="text-center py-10">
                                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                                                        <MessageCircle className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                                                    </div>
                                                    <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-white">Aucun message</h3>
                                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                        Aucun message n'a encore été envoyé à ce client.
                                                    </p>
                                                    <div className="mt-6">
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsAddingMessage(true)}
                                                            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                                                        >
                                                            <Send className="mr-2 h-4 w-4" />
                                                            Envoyer un message
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex justify-between items-center mb-4">
                                                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Historique des messages</h3>
                                                        <button
                                                            onClick={() => setIsAddingMessage(true)}
                                                            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-500 transition-colors dark:bg-blue-700 dark:hover:bg-blue-600"
                                                        >
                                                            <Plus className="mr-1 h-3 w-3" />
                                                            Nouveau message
                                                        </button>
                                                    </div>
                                                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                                            <thead className="bg-gray-50 dark:bg-gray-700">
                                                                <tr>
                                                                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Date</th>
                                                                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Message</th>
                                                                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Type</th>
                                                                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Statut</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                                                {client.messages.slice(0, 5).map((message) => (
                                                                    <tr key={message.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                                                                        <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-500 dark:text-gray-400">
                                                                            {formatDateTime(message.sent_at)}
                                                                        </td>
                                                                        <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-300">
                                                                            <div className="max-w-xs overflow-hidden text-ellipsis" title={message.content}>
                                                                                {message.content}
                                                                            </div>
                                                                        </td>
                                                                        <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-500 dark:text-gray-400">
                                                                            {message.campaign ? (
                                                                                <Link
                                                                                    href={route('campaigns.show', message.campaign.id)}
                                                                                    className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-800/40 transition-colors"
                                                                                >
                                                                                    <Activity className="mr-1 h-3 w-3" />
                                                                                    {message.campaign.name}
                                                                                </Link>
                                                                            ) : (
                                                                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                                                    <MessageCircle className="mr-1 h-3 w-3" />
                                                                                    Message Direct
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                        <td className="whitespace-nowrap px-3 py-3 text-sm">
                                                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(message.status)}`}>
                                                                                {getStatusIcon(message.status)}
                                                                                {getStatusLabel(message.status)}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'visits' && (
                                        <div>
                                            {client.visits.length === 0 ? (
                                                <div className="text-center py-10">
                                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                                                        <Home className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                                                    </div>
                                                    <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-white">Aucune visite</h3>
                                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                        Ce client n'a pas encore reçu de visite.
                                                    </p>
                                                    <div className="mt-6">
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsAddingVisit(true)}
                                                            className="inline-flex items-center rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-500 transition-colors dark:bg-amber-700 dark:hover:bg-amber-600"
                                                        >
                                                            <Home className="mr-2 h-4 w-4" />
                                                            Nouvelle visite
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex justify-between items-center mb-4">
                                                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Historique des visites</h3>
                                                        <button
                                                            onClick={() => setIsAddingVisit(true)}
                                                            className="inline-flex items-center rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-amber-500 transition-colors dark:bg-amber-700 dark:hover:bg-amber-600"
                                                        >
                                                            <Plus className="mr-1 h-3 w-3" />
                                                            Nouvelle visite
                                                        </button>
                                                    </div>
                                                    <div className="space-y-4">
                                                        {client.visits.map((visit) => (
                                                            <div key={visit.id} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:shadow-md transition-shadow">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <div className="flex items-center">
                                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                                                                            <Home className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                                                        </div>
                                                                        <div className="ml-3">
                                                                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                                                                Visite du {formatDate(visit.visit_date)}
                                                                            </h3>
                                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                                Enregistrée le {format(new Date(visit.created_at), 'dd/MM/yyyy à HH:mm')}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                                                                        {formatTimeAgo(visit.visit_date)}
                                                                    </span>
                                                                </div>
                                                                <div className="mt-3 rounded-md bg-gray-50 dark:bg-gray-700/50 p-3">
                                                                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                                                                        {visit.notes || "Aucune note pour cette visite"}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4 flex items-center">
                                    <MessageCircle className="h-5 w-5 mr-2 text-indigo-500" />
                                    {t('messages.lastMessage')}
                                </h3>
                                {client.messages.length > 0 ? (
                                    <div className="overflow-hidden bg-white dark:bg-gray-800 shadow sm:rounded-md">
                                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {client.messages.slice(0, 5).map(message => (
                                                <li key={message.id}>
                                                    <div className="block hover:bg-gray-50 dark:hover:bg-gray-700">
                                                        <div className="px-4 py-4 sm:px-6">
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate">{formatDateTime(message.sent_at)}</p>
                                                                <div className="ml-2 flex-shrink-0 flex">
                                                                    <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                                        {message.sent_by_client ? t('messages.fromClient') : t('messages.fromUser')}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="mt-2 flex justify-between">
                                                                <div className="sm:flex">
                                                                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                                        {message.content}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : (
                                    <div className="text-center py-6 bg-white dark:bg-gray-800 shadow sm:rounded-md">
                                        <MessageCircleOff className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{t('messages.noMessages')}</h3>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('messages.sendFirstMessage')}</p>
                                        <div className="mt-6">
                                            <button
                                                onClick={() => setIsAddingMessage(true)}
                                                className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                            >
                                                <PlusCircle className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                                                {t('messages.newMessage')}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}