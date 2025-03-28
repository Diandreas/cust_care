import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/Utils/toast';
import axios from 'axios';
import {
    CalendarDays, Phone, Mail, MapPin, Tag, Clock, MessageSquare,
    CheckCircle, AlertCircle, FileText, User, MessageCircle, Home,
    Edit, Save, X, Plus, Check, ArrowLeft, Send
} from 'lucide-react';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import TagSelector from '@/Components/TagSelector';

interface Message {
    id: number;
    content: string;
    status: string;
    sent_at: string;
    created_at: string;
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered':
                return 'bg-green-100 text-green-800';
            case 'failed':
                return 'bg-red-100 text-red-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'delivered':
                return 'Livré';
            case 'failed':
                return 'Échoué';
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

    const registerVisit = () => {
        if (!visitNotes.trim()) {
            error('Veuillez saisir des notes pour la visite');
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
            error('Veuillez saisir un message');
            return;
        }

        setIsLoadingMessage(true);
        axios.post(`/api/clients/${client.id}/message`, {
            content: messageContent
        })
            .then(response => {
                success('Message envoyé avec succès');

                // Add the new message to the messages state
                const newMessage = response.data.message;
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
                error('Erreur lors de l\'envoi du message');
            })
            .finally(() => {
                setIsLoadingMessage(false);
            });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Use axios.patch to send the form data
        axios.patch(route('clients.update', client.id), data)
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

    // Calculate statistics
    const messageStats = {
        total: client.messages_count || 0,
        delivered: client.successful_messages_count || 0,
        failedOrPending: (client.messages_count || 0) - (client.successful_messages_count || 0)
    };

    // Get total visits count
    const totalVisits = visits.length;

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Link
                            href={route('clients.index')}
                            className="inline-flex items-center text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                        >
                            <ArrowLeft className="h-5 w-5 mr-1" />
                        </Link>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-white flex items-center gap-2">
                            <User className="h-5 w-5" />
                            {client.name}
                            {client.is_active ? (
                                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                    Actif
                                </span>
                            ) : (
                                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                    Inactif
                                </span>
                            )}
                        </h2>
                    </div>

                </div>
            }
        >
            <Head title={`Client: ${client.name}`} />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Formulaire d'ajout de visite */}
                    {isAddingVisit && (
                        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 animate-fadeIn">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Enregistrer une nouvelle visite</h3>
                                <button
                                    onClick={() => setIsAddingVisit(false)}
                                    className="text-gray-400 hover:text-gray-500 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="mb-4">
                                <label htmlFor="visitNotes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Notes de visite
                                </label>
                                <textarea
                                    id="visitNotes"
                                    rows={3}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                    value={visitNotes}
                                    onChange={(e) => setVisitNotes(e.target.value)}
                                    placeholder="Détails de la visite, services rendus, observations..."
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={registerVisit}
                                    disabled={isLoadingVisit || !visitNotes.trim()}
                                    className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                                >
                                    {isLoadingVisit ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Enregistrement...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="mr-2 h-4 w-4" />
                                            Enregistrer la visite
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Formulaire d'envoi de message direct */}
                    {isAddingMessage && (
                        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 animate-fadeIn">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Envoyer un message direct</h3>
                                <button
                                    onClick={() => setIsAddingMessage(false)}
                                    className="text-gray-400 hover:text-gray-500 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="mb-4">
                                <label htmlFor="messageContent" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Contenu du message
                                </label>
                                <textarea
                                    id="messageContent"
                                    rows={3}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                    value={messageContent}
                                    onChange={(e) => setMessageContent(e.target.value)}
                                    placeholder="Saisir votre message ici..."
                                    maxLength={160}
                                />
                                <div className="mt-1 flex justify-between items-center text-xs text-gray-500">
                                    <span>{messageContent.length} / 160 caractères</span>
                                    <span>{Math.ceil(messageContent.length / 160)} SMS</span>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={sendDirectMessage}
                                    disabled={isLoadingMessage || !messageContent.trim()}
                                    className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                                >
                                    {isLoadingMessage ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Envoi en cours...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="mr-2 h-4 w-4" />
                                            Envoyer le message
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Informations du client */}
                    <div className="grid gap-6 md:grid-cols-3">
                        {/* Profile et détails */}
                        <div className="md:col-span-1">
                            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 p-4">
                                    <div className="flex justify-center">
                                        <div className="h-24 w-24 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center text-indigo-600 text-4xl font-bold">
                                            {client.name.charAt(0).toUpperCase()}
                                        </div>
                                    </div>
                                    <h3 className="mt-3 text-center text-xl font-semibold text-white">
                                        {client.name}
                                    </h3>
                                </div>

                                {/* Profil en mode affichage */}
                                {!isEditing && (
                                    <div className="p-4">
                                        <ul className="space-y-3">
                                            <li className="flex items-start gap-3 group">
                                                <Phone className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                                                <div className="flex-1">
                                                    <span className="block text-sm text-gray-700 dark:text-gray-300">{client.phone}</span>
                                                    <a href={`tel:${client.phone}`} className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400">Appeler</a>
                                                </div>
                                            </li>
                                            {client.email && (
                                                <li className="flex items-start gap-3 group">
                                                    <Mail className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                                                    <div className="flex-1">
                                                        <span className="block text-sm text-gray-700 dark:text-gray-300">{client.email}</span>
                                                        <a href={`mailto:${client.email}`} className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400">Envoyer un email</a>
                                                    </div>
                                                </li>
                                            )}
                                            {client.address && (
                                                <li className="flex items-start gap-3 group">
                                                    <MapPin className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                                                    <div className="flex-1">
                                                        <span className="block text-sm text-gray-700 dark:text-gray-300">{client.address}</span>
                                                        <a
                                                            href={`https://maps.google.com/?q=${encodeURIComponent(client.address)}`}
                                                            target="_blank"
                                                            className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                                                        >
                                                            Voir sur la carte
                                                        </a>
                                                    </div>
                                                </li>
                                            )}
                                            {client.birthday && (
                                                <li className="flex items-start gap-3">
                                                    <CalendarDays className="h-5 w-5 text-gray-400" />
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">{formatDate(client.birthday)}</span>
                                                </li>
                                            )}
                                            {client.gender && (
                                                <li className="flex items-start gap-3">
                                                    <User className="h-5 w-5 text-gray-400" />
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                                        {client.gender === 'male' ? 'Homme' : client.gender === 'female' ? 'Femme' : 'Autre'}
                                                    </span>
                                                </li>
                                            )}
                                        </ul>

                                        {client.tags.length > 0 && (
                                            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-2">
                                                    <Tag className="h-4 w-4" /> Tags
                                                </h4>
                                                <div className="flex flex-wrap gap-1">
                                                    {client.tags.map(tag => (
                                                        <span key={tag.id} className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                                            {tag.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-2">
                                                <FileText className="h-4 w-4" /> Notes
                                            </h4>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                                                {client.notes || "Aucune note"}
                                            </p>
                                        </div>

                                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                    Client depuis
                                                </h4>
                                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                                    {formatDate(client.created_at)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                    Dernier contact
                                                </h4>
                                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                                    {formatDate(client.lastContact || null)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                    Dernière visite
                                                </h4>
                                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                                    {formatDate(client.last_visit_date || null)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Formulaire d'édition */}
                                {isEditing && (
                                    <div className="p-4 animate-fadeIn">
                                        <form onSubmit={handleSubmit} className="space-y-5">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Modifier les informations</h3>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsEditing(false)}
                                                    className="text-gray-400 hover:text-gray-500 transition-colors"
                                                >
                                                    <X className="h-5 w-5" />
                                                </button>
                                            </div>

                                            <div>
                                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Nom *
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
                                                    Téléphone *
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
                                                    Email
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
                                                    Adresse
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

                                            <div>
                                                <TagSelector
                                                    tags={tags}
                                                    selectedTags={selectedTagsState}
                                                    onTagsChange={(tagIds) => {
                                                        setSelectedTagsState(tagIds);
                                                        setData('tags', tagIds);
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

                                            <div className="pt-4 flex justify-end">
                                                <button
                                                    type="submit"
                                                    disabled={processing}
                                                    className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                                                >
                                                    {processing ? (
                                                        <>
                                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            Enregistrement...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save className="mr-2 h-4 w-4" />
                                                            Enregistrer
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => setIsAddingVisit(true)}
                                        className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-500 transition-colors"
                                        title="Enregistrer une visite"
                                    >
                                        <Home className="h-4 w-4 mr-1" />
                                        <span className="hidden sm:inline">Visite</span>
                                    </button>
                                    <button
                                        onClick={() => setIsAddingMessage(true)}
                                        className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 transition-colors"
                                        title="Envoyer un message"
                                    >
                                        <Send className="h-4 w-4 mr-1" />
                                        <span className="hidden sm:inline">Message</span>
                                    </button>
                                    <button
                                        onClick={() => setIsEditing(!isEditing)}
                                        className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 transition-colors"
                                        title="Modifier les informations"
                                    >
                                        <Edit className="h-4 w-4 mr-1" />
                                        <span className="hidden sm:inline">Modifier</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Statistiques et Activités */}
                        <div className="md:col-span-2">
                            {/* Résumé des statistiques */}
                            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow group">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 group-hover:scale-110 transition-transform">
                                            <MessageSquare className="h-10 w-10 text-indigo-500" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Messages</p>
                                            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{messageStats.total}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow group">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 group-hover:scale-110 transition-transform">
                                            <CheckCircle className="h-10 w-10 text-green-500" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Messages Livrés</p>
                                            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{messageStats.delivered}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow group">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 group-hover:scale-110 transition-transform">
                                            <Home className="h-10 w-10 text-amber-500" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Visites</p>
                                            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalVisits}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow group">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 group-hover:scale-110 transition-transform">
                                            <Clock className="h-10 w-10 text-blue-500" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Dernière Visite</p>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                {visits.length > 0 ? formatDate(visits[0].visit_date) : 'Aucune'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Onglets Messages/Visites */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                                <div className="border-b border-gray-200 dark:border-gray-700">
                                    <nav className="flex -mb-px">
                                        <button
                                            onClick={() => setActiveTab('messages')}
                                            className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${activeTab === 'messages'
                                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <MessageCircle className="h-4 w-4" />
                                                Messages
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('visits')}
                                            className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${activeTab === 'visits'
                                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Home className="h-4 w-4" />
                                                Visites
                                            </div>
                                        </button>
                                    </nav>
                                </div>

                                <div className="p-4">
                                    {activeTab === 'messages' && (
                                        <div className="overflow-x-auto">
                                            {messages.length === 0 ? (
                                                <div className="text-center py-10">
                                                    <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
                                                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Aucun message</h3>
                                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                        Aucun message n'a encore été envoyé à ce client.
                                                    </p>
                                                    <div className="mt-6">
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsAddingMessage(true)}
                                                            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500"
                                                        >
                                                            <Plus className="mr-1.5 h-4 w-4" />
                                                            Envoyer un message
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex justify-end mb-3">
                                                        <button
                                                            onClick={() => setIsAddingMessage(true)}
                                                            className="inline-flex items-center rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-500 transition-colors"
                                                        >
                                                            <Plus className="mr-1 h-3 w-3" />
                                                            Nouveau message
                                                        </button>
                                                    </div>
                                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                                            <tr>
                                                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Date</th>
                                                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Message</th>
                                                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Campagne</th>
                                                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Statut</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                            {messages.map((message) => (
                                                                <tr key={message.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                                                                    <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-500 dark:text-gray-400">
                                                                        {formatDateTime(message.sent_at)}
                                                                    </td>
                                                                    <td className="px-3 py-3 text-sm text-gray-900 dark:text-gray-200">
                                                                        <div className="max-w-xs overflow-hidden text-ellipsis" title={message.content}>
                                                                            {message.content}
                                                                        </div>
                                                                    </td>
                                                                    <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-500 dark:text-gray-400">
                                                                        {message.campaign ? (
                                                                            <Link
                                                                                href={route('campaigns.show', message.campaign.id)}
                                                                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                                                                            >
                                                                                {message.campaign.name}
                                                                            </Link>
                                                                        ) : (
                                                                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                                                                Message Direct
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td className="whitespace-nowrap px-3 py-3 text-sm">
                                                                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(message.status)}`}>
                                                                            {getStatusLabel(message.status)}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'visits' && (
                                        <div>
                                            {visits.length === 0 ? (
                                                <div className="text-center py-10">
                                                    <Home className="mx-auto h-12 w-12 text-gray-400" />
                                                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Aucune visite</h3>
                                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                        Ce client n'a pas encore reçu de visite.
                                                    </p>
                                                    <div className="mt-6">
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsAddingVisit(true)}
                                                            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 transition-colors"
                                                        >
                                                            <Plus className="mr-1.5 h-4 w-4" />
                                                            Nouvelle visite
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex justify-end mb-3">
                                                        <button
                                                            onClick={() => setIsAddingVisit(true)}
                                                            className="inline-flex items-center rounded-md bg-green-600 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-green-500 transition-colors"
                                                        >
                                                            <Plus className="mr-1 h-3 w-3" />
                                                            Nouvelle visite
                                                        </button>
                                                    </div>
                                                    <div className="space-y-4">
                                                        {visits.map((visit) => (
                                                            <div key={visit.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                                                        Visite du {formatDate(visit.visit_date)}
                                                                    </h3>
                                                                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-700 dark:text-green-100">
                                                                        {format(new Date(visit.created_at), 'HH:mm')}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                                                                    {visit.notes || "Aucune note pour cette visite"}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}


                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}