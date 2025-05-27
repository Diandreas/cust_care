import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/Components/ui/use-toast';
import axios from 'axios';
import {
    CalendarDays, Phone, Mail, MapPin, Tag, Clock, MessageSquare,
    CheckCircle, AlertCircle, FileText, User, MessageCircle, Home,
    Edit, Save, X, Plus, Check, ArrowLeft, Send, ChevronDown,
    Calendar, Activity, PieChart, Users, Copy, Share2, Trash2,
    MessageCircleOff, PlusCircle, Star, MoreVertical, ExternalLink,
    Briefcase, Heart, TrendingUp, Archive, Bell, Settings,
    Building, Globe, Smartphone, Zap, Target, Eye
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
    const [activeTab, setActiveTab] = useState<'overview' | 'messages' | 'visits' | 'activity'>('overview');
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
                return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800';
            case 'failed':
                return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
            case 'pending':
                return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'delivered':
                return <CheckCircle className="h-3 w-3 mr-1" />;
            case 'failed':
                return <AlertCircle className="h-3 w-3 mr-1" />;
            case 'pending':
                return <Clock className="h-3 w-3 mr-1" />;
            default:
                return null;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'delivered':
                return 'Livré';
            case 'failed':
                return 'Échec';
            case 'pending':
                return 'En attente';
            default:
                return 'Inconnu';
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

    // Function to generate avatar gradient based on name
    const getAvatarGradient = (name: string) => {
        const gradients = [
            'from-violet-500 via-purple-500 to-purple-600',
            'from-blue-500 via-blue-600 to-indigo-600',
            'from-emerald-500 via-teal-500 to-cyan-600',
            'from-orange-500 via-amber-500 to-yellow-500',
            'from-pink-500 via-rose-500 to-red-500',
            'from-indigo-500 via-purple-500 to-pink-500',
            'from-green-500 via-emerald-500 to-teal-500',
            'from-red-500 via-pink-500 to-rose-500',
        ];
        const index = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % gradients.length;
        return gradients[index];
    };

    // Calculate statistics
    const messageStats = {
        total: client.messages_count || 0,
        delivered: client.successful_messages_count || 0,
        failedOrPending: (client.messages_count || 0) - (client.successful_messages_count || 0)
    };

    const deliveryRate = messageStats.total > 0
        ? Math.round((messageStats.delivered / messageStats.total) * 100)
        : 0;

    const totalVisits = visits.length;

    // Handle visit registration
    const registerVisit = () => {
        if (!visitNotes.trim()) {
            error('Les notes de visite sont requises');
            return;
        }

        setIsLoadingVisit(true);
        axios.post(`/api/clients/${client.id}/visit`, {
            notes: visitNotes
        })
            .then(response => {
                success('Visite enregistrée avec succès');

                // Add the new visit to the visits state
                const newVisit = response.data.visit;
                setVisits([newVisit, ...visits]);

                // Update the client's last_visit_date
                setClient(prevClient => ({
                    ...prevClient,
                    last_visit_date: newVisit.visit_date
                }));

                // Reset form and close modal
                setIsAddingVisit(false);
                setVisitNotes('');
            })
            .catch(err => {
                error('Erreur lors de l\'enregistrement de la visite');
            })
            .finally(() => {
                setIsLoadingVisit(false);
            });
    };

    // Handle direct message sending
    const sendDirectMessage = () => {
        if (!messageContent.trim()) {
            error('Le contenu du message est requis');
            return;
        }

        setIsLoadingMessage(true);
        axios.post(`/api/clients/${client.id}/message`, {
            content: messageContent
        })
            .then(response => {
                success('Message envoyé avec succès');

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

                // Reset form and close modal
                setIsAddingMessage(false);
                setMessageContent('');
            })
            .catch(err => {
                error('Erreur lors de l\'envoi du message');
            })
            .finally(() => {
                setIsLoadingMessage(false);
            });
    };

    // Handle client update
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Use axios.patch to send the form data
        axios.patch(route('clients.update', client.id), {
            ...data,
            tag_ids: selectedTagsState
        })
            .then(response => {
                success('Client mis à jour avec succès');

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
                    error('Erreur lors de la mise à jour du client');
                }
            });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link
                            href={route('clients.index')}
                            className="inline-flex items-center justify-center rounded-xl h-10 w-10 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 transition-all duration-200"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div className="flex items-center space-x-3">
                            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${getAvatarGradient(client.name)} flex items-center justify-center shadow-lg`}>
                                <span className="text-white text-lg font-bold">
                                    {client.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {client.name}
                                </h1>
                                <div className="flex items-center space-x-2 mt-1">
                                    {client.is_active ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></div>
                                            Actif
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                            <div className="w-1.5 h-1.5 bg-gray-500 rounded-full mr-1.5"></div>
                                            Inactif
                                        </span>
                                    )}
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        Client depuis {formatTimeAgo(client.created_at)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setIsAddingMessage(true)}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors duration-200"
                        >
                            <Send className="h-4 w-4 mr-2" />
                            Envoyer SMS
                        </button>
                        <button
                            onClick={() => setIsAddingVisit(true)}
                            className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors duration-200"
                        >
                            <Home className="h-4 w-4 mr-2" />
                            Nouvelle visite
                        </button>
                        <div className="relative">
                            <button
                                onClick={() => setShowActionsMenu(!showActionsMenu)}
                                className="inline-flex items-center px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-colors duration-200"
                            >
                                <MoreVertical className="h-4 w-4" />
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
                                <div className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-xl bg-white dark:bg-gray-800 shadow-xl ring-1 ring-black ring-opacity-5 border border-gray-200 dark:border-gray-700">
                                    <div className="py-1">
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        >
                                            <Edit className="mr-3 h-4 w-4" />
                                            Modifier
                                        </button>
                                        <button className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <Star className="mr-3 h-4 w-4" />
                                            Marquer favoris
                                        </button>
                                        <button className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <Archive className="mr-3 h-4 w-4" />
                                            Archiver
                                        </button>
                                        <div className="border-t border-gray-100 dark:border-gray-700"></div>
                                        <button className="flex w-full items-center px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                                            <Trash2 className="mr-3 h-4 w-4" />
                                            Supprimer
                                        </button>
                                    </div>
                                </div>
                            </Transition>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={`Client: ${client.name}`} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Quick Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Messages envoyés</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">{messageStats.total}</p>
                                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                    {deliveryRate}% de réussite
                                </p>
                            </div>
                            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                <MessageCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Visites totales</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalVisits}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {client.last_visit_date ? `Dernière: ${formatTimeAgo(client.last_visit_date)}` : 'Aucune visite'}
                                </p>
                            </div>
                            <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                                <Home className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Taux de livraison</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">{deliveryRate}%</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {messageStats.delivered}/{messageStats.total} messages
                                </p>
                            </div>
                            <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Dernière activité</p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {client.lastContact ? formatTimeAgo(client.lastContact) : 'Jamais'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Dernier contact
                                </p>
                            </div>
                            <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                                <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Sidebar - Client Info */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Profile Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            {/* Profile Header */}
                            <div className={`relative bg-gradient-to-br ${getAvatarGradient(client.name)} px-6 py-8`}>
                                <div className="absolute top-4 right-4">
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="p-2 bg-white/20 rounded-lg text-white hover:bg-white/30 transition-colors"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="text-center">
                                    <div className="h-20 w-20 mx-auto bg-white/20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-4">
                                        {client.name.charAt(0).toUpperCase()}
                                    </div>
                                    <h3 className="text-xl font-bold text-white">{client.name}</h3>
                                    {client.birthday && (
                                        <p className="text-white/80 text-sm mt-1">
                                            {calculateAge(client.birthday)} ans
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Contact Information */}
                            {!isEditing ? (
                                <div className="p-6 space-y-4">
                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                                <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">Téléphone</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{client.phone}</p>
                                            </div>
                                            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                                <Copy className="h-4 w-4" />
                                            </button>
                                        </div>

                                        {client.email && (
                                            <div className="flex items-center space-x-3">
                                                <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                                                    <Mail className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">Email</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">{client.email}</p>
                                                </div>
                                                <a
                                                    href={`mailto:${client.email}`}
                                                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            </div>
                                        )}

                                        {client.address && (
                                            <div className="flex items-start space-x-3">
                                                <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                                                    <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">Adresse</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">{client.address}</p>
                                                </div>
                                                <a
                                                    href={`https://maps.google.com/?q=${encodeURIComponent(client.address)}`}
                                                    target="_blank"
                                                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            </div>
                                        )}

                                        {client.birthday && (
                                            <div className="flex items-center space-x-3">
                                                <div className="h-10 w-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                                                    <CalendarDays className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">Anniversaire</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(client.birthday)}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Tags */}
                                    {client.tags.length > 0 && (
                                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Tags</p>
                                            <div className="flex flex-wrap gap-2">
                                                {client.tags.map(tag => (
                                                    <span
                                                        key={tag.id}
                                                        className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                                    >
                                                        <Tag className="h-3 w-3 mr-1" />
                                                        {tag.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Notes */}
                                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Notes</p>
                                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                                                {client.notes || 'Aucune note'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Edit Form */
                                <div className="p-6">
                                    <form className="space-y-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Modifier le profil</h4>
                                            <button
                                                type="button"
                                                onClick={() => setIsEditing(false)}
                                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Nom complet
                                            </label>
                                            <input
                                                type="text"
                                                value={data.name}
                                                onChange={e => setData('name', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Téléphone
                                            </label>
                                            <input
                                                type="text"
                                                value={data.phone}
                                                onChange={e => setData('phone', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={data.email}
                                                onChange={e => setData('email', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Adresse
                                            </label>
                                            <input
                                                type="text"
                                                value={data.address}
                                                onChange={e => setData('address', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Date de naissance
                                                </label>
                                                <input
                                                    type="date"
                                                    value={data.birthday}
                                                    onChange={e => setData('birthday', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Genre
                                                </label>
                                                <select
                                                    value={data.gender}
                                                    onChange={e => setData('gender', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                                >
                                                    <option value="">Sélectionner</option>
                                                    <option value="male">Homme</option>
                                                    <option value="female">Femme</option>
                                                    <option value="other">Autre</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Notes
                                            </label>
                                            <textarea
                                                rows={3}
                                                value={data.notes}
                                                onChange={e => setData('notes', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                            />
                                        </div>

                                        <div className="flex justify-end space-x-3 pt-4">
                                            <button
                                                type="button"
                                                onClick={() => setIsEditing(false)}
                                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                            >
                                                Annuler
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                Sauvegarder
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions rapides</h3>
                            <div className="grid grid-cols-1 gap-3">
                                <button
                                    onClick={() => setIsAddingMessage(true)}
                                    className="flex items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                >
                                    <Send className="h-5 w-5 mr-3" />
                                    <span className="font-medium">Envoyer SMS</span>
                                </button>
                                <button
                                    onClick={() => setIsAddingVisit(true)}
                                    className="flex items-center justify-center p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                                >
                                    <Home className="h-5 w-5 mr-3" />
                                    <span className="font-medium">Nouvelle visite</span>
                                </button>
                                {client.email && (
                                    <a
                                        href={`mailto:${client.email}`}
                                        className="flex items-center justify-center p-4 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                                    >
                                        <Mail className="h-5 w-5 mr-3" />
                                        <span className="font-medium">Envoyer email</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-6">


                        {/* Tabs Navigation */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                                <nav className="flex space-x-8 px-6">
                                    {[
                                        { id: 'overview', label: 'Vue d\'ensemble', icon: Eye, count: null },
                                        { id: 'messages', label: 'Messages', icon: MessageCircle, count: client.messages_count },
                                        { id: 'visits', label: 'Visites', icon: Home, count: totalVisits },
                                        { id: 'activity', label: 'Activité', icon: Activity, count: null }
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id as any)}
                                            className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                                }`}
                                        >
                                            <tab.icon className="h-4 w-4 mr-2" />
                                            {tab.label}
                                            {tab.count !== null && (
                                                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs font-medium ${activeTab === tab.id
                                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                                    }`}>
                                                    {tab.count}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </nav>
                            </div>

                            {/* Tab Contents */}
                            <div className="p-6">
                                {activeTab === 'overview' && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Résumé du client</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Messages échangés</p>
                                                            <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">{messageStats.total}</p>
                                                            <p className="text-xs text-blue-600 dark:text-blue-400">
                                                                {messageStats.delivered} livrés avec succès
                                                            </p>
                                                        </div>
                                                        <MessageCircle className="h-8 w-8 text-blue-500" />
                                                    </div>
                                                </div>

                                                <div className="bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Visites effectuées</p>
                                                            <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-300">{totalVisits}</p>
                                                            <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                                                {client.last_visit_date ? formatTimeAgo(client.last_visit_date) : 'Aucune visite'}
                                                            </p>
                                                        </div>
                                                        <Home className="h-8 w-8 text-emerald-500" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Activité récente</h4>
                                            <div className="space-y-3">
                                                {client.messages.slice(0, 3).map((message, index) => (
                                                    <div key={message.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                                        <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                                            <MessageCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm text-gray-900 dark:text-white truncate">
                                                                Message envoyé
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                {formatTimeAgo(message.sent_at)}
                                                            </p>
                                                        </div>
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(message.status)}`}>
                                                            {getStatusIcon(message.status)}
                                                            {getStatusLabel(message.status)}
                                                        </span>
                                                    </div>
                                                ))}
                                                {visits.slice(0, 2).map((visit, index) => (
                                                    <div key={visit.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                                        <div className="h-8 w-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                                                            <Home className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm text-gray-900 dark:text-white">
                                                                Visite effectuée
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                {formatTimeAgo(visit.visit_date)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'messages' && (
                                    <div className="space-y-4">
                                        {client.messages.length === 0 ? (
                                            <div className="text-center py-12">
                                                <div className="h-16 w-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                                                    <MessageCircleOff className="h-8 w-8 text-gray-400" />
                                                </div>
                                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Aucun message</h3>
                                                <p className="text-gray-500 dark:text-gray-400 mt-1">
                                                    Commencez la conversation avec ce client
                                                </p>
                                                <button
                                                    onClick={() => setIsAddingMessage(true)}
                                                    className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                >
                                                    <Send className="h-4 w-4 mr-2" />
                                                    Envoyer le premier message
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {client.messages.map((message) => (
                                                    <div key={message.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <div className="flex items-center space-x-2 mb-2">
                                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                                        {formatDateTime(message.sent_at)}
                                                                    </span>
                                                                    {message.campaign && (
                                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                                                            <Activity className="h-3 w-3 mr-1" />
                                                                            {message.campaign.name}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                                                    {message.content}
                                                                </p>
                                                            </div>
                                                            <span className={`ml-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(message.status)}`}>
                                                                {getStatusIcon(message.status)}
                                                                {getStatusLabel(message.status)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'visits' && (
                                    <div className="space-y-4">
                                        {visits.length === 0 ? (
                                            <div className="text-center py-12">
                                                <div className="h-16 w-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                                                    <Home className="h-8 w-8 text-gray-400" />
                                                </div>
                                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Aucune visite</h3>
                                                <p className="text-gray-500 dark:text-gray-400 mt-1">
                                                    Enregistrez la première visite chez ce client
                                                </p>
                                                <button
                                                    onClick={() => setIsAddingVisit(true)}
                                                    className="mt-4 inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                                                >
                                                    <Home className="h-4 w-4 mr-2" />
                                                    Enregistrer une visite
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {visits.map((visit) => (
                                                    <div key={visit.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                                                        <div className="flex items-start space-x-4">
                                                            <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                                                                <Home className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                                                                        Visite du {formatDate(visit.visit_date)}
                                                                    </h4>
                                                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                                                        {formatTimeAgo(visit.visit_date)}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                                                    Enregistrée le {formatDateTime(visit.created_at)}
                                                                </p>
                                                                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                                                                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                                                                        {visit.notes || "Aucune note pour cette visite"}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'activity' && (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Historique complet</h3>
                                        <div className="space-y-4">
                                            {/* Combine messages and visits, sort by date */}
                                            {[...client.messages.map(m => ({ ...m, type: 'message' })), ...visits.map(v => ({ ...v, type: 'visit' }))]
                                                .sort((a, b) => new Date(b.created_at || b.sent_at).getTime() - new Date(a.created_at || a.sent_at).getTime())
                                                .slice(0, 10)
                                                .map((item, index) => (
                                                    <div key={`${item.type}-${item.id}`} className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${item.type === 'message'
                                                                ? 'bg-blue-100 dark:bg-blue-900/30'
                                                                : 'bg-emerald-100 dark:bg-emerald-900/30'
                                                            }`}>
                                                            {item.type === 'message' ? (
                                                                <MessageCircle className={`h-5 w-5 ${item.type === 'message'
                                                                        ? 'text-blue-600 dark:text-blue-400'
                                                                        : 'text-emerald-600 dark:text-emerald-400'
                                                                    }`} />
                                                            ) : (
                                                                <Home className={`h-5 w-5 ${item.type === 'message'
                                                                        ? 'text-blue-600 dark:text-blue-400'
                                                                        : 'text-emerald-600 dark:text-emerald-400'
                                                                    }`} />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                    {item.type === 'message' ? 'Message envoyé' : 'Visite effectuée'}
                                                                </p>
                                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                    {formatTimeAgo(item.type === 'message' ? item.sent_at : item.visit_date)}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                                {item.type === 'message'
                                                                    ? (item.content?.length > 100 ? item.content.substring(0, 100) + '...' : item.content)
                                                                    : (item.notes?.length > 100 ? item.notes.substring(0, 100) + '...' : item.notes || 'Aucune note')
                                                                }
                                                            </p>
                                                            {item.type === 'message' && item.status && (
                                                                <span className={`inline-flex items-center mt-2 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                                                                    {getStatusIcon(item.status)}
                                                                    {getStatusLabel(item.status)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal pour l'ajout de message */}
            <Transition show={isAddingMessage} as={React.Fragment}>
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <Transition
                            enter="ease-out duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsAddingMessage(false)} />
                        </Transition>

                        <Transition
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-lg">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center space-x-3">
                                        <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                            <Send className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Nouveau message SMS</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Envoyer un message direct à {client.name}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsAddingMessage(false)}
                                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                            Contenu du message
                                        </label>
                                        <textarea
                                            rows={5}
                                            value={messageContent}
                                            onChange={(e) => setMessageContent(e.target.value)}
                                            placeholder="Tapez votre message ici..."
                                            maxLength={320}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                                        />
                                        <div className="flex justify-between items-center mt-3">
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {messageContent.length} caractères
                                            </span>
                                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${messageContent.length > 160
                                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                                    : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                }`}>
                                                {Math.ceil(messageContent.length / 160)} SMS
                                            </span>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Modèles rapides :</p>
                                        <div className="grid grid-cols-1 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setMessageContent(`Bonjour ${client.name}, j'espère que vous allez bien. Confirmez-vous notre rendez-vous ?`)}
                                                className="px-4 py-2 text-sm text-left bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                            >
                                                Confirmation de rendez-vous
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setMessageContent(`Bonjour ${client.name}, j'ai une proposition qui pourrait vous intéresser. Pouvons-nous en discuter ?`)}
                                                className="px-4 py-2 text-sm text-left bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                            >
                                                Proposition commerciale
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setMessageContent(`Merci ${client.name} pour votre confiance lors de notre dernière rencontre !`)}
                                                className="px-4 py-2 text-sm text-left bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                            >
                                                Remerciement
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <button
                                            onClick={() => setIsAddingMessage(false)}
                                            className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            onClick={sendDirectMessage}
                                            disabled={isLoadingMessage || !messageContent.trim()}
                                            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                                        >
                                            {isLoadingMessage ? (
                                                <>
                                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                                    Envoi...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="h-4 w-4 mr-2" />
                                                    Envoyer le message
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Transition>
                    </div>
                </div>
            </Transition>

            {/* Modal pour l'ajout de visite */}
            <Transition show={isAddingVisit} as={React.Fragment}>
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <Transition
                            enter="ease-out duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsAddingVisit(false)} />
                        </Transition>

                        <Transition
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-lg">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center space-x-3">
                                        <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                                            <Home className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Enregistrer une visite</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Documenter la visite chez {client.name}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsAddingVisit(false)}
                                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                            Notes de visite
                                        </label>
                                        <textarea
                                            rows={6}
                                            value={visitNotes}
                                            onChange={(e) => setVisitNotes(e.target.value)}
                                            placeholder="Décrivez ce qui s'est passé lors de cette visite, les besoins du client, les points à retenir..."
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                                            Décrivez les points importants de cette visite, les besoins exprimés par le client, les actions à suivre, etc.
                                        </p>
                                    </div>

                                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <button
                                            onClick={() => setIsAddingVisit(false)}
                                            className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            onClick={registerVisit}
                                            disabled={isLoadingVisit || !visitNotes.trim()}
                                            className="px-6 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                                        >
                                            {isLoadingVisit ? (
                                                <>
                                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                                    Enregistrement...
                                                </>
                                            ) : (
                                                <>
                                                    <Check className="h-4 w-4 mr-2" />
                                                    Enregistrer la visite
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Transition>
                    </div>
                </div>
            </Transition>
        </AuthenticatedLayout>
    );
}