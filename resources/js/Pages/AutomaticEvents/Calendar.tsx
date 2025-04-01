import React, { useState, useEffect } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Toaster, toast } from 'react-hot-toast';
import { ChevronLeft, ChevronRight, CalendarDays, Check, X, Settings, AlertTriangle, Users, Tag, BellRing, MessageSquare } from 'lucide-react';

interface EventType {
    id: number;
    code: string;
    name: string;
    description: string;
    default_template: string;
    is_active: boolean;
    custom_template: string | null;
    days_before: number;
    audience_logic: string;
    audience_override: any | null;
    last_processed_at: string | null;
    has_config: boolean;
}

interface EventCategory {
    name: string;
    description: string;
    events: EventType[];
}

interface MonthEvents {
    [key: string]: EventType[];
}

interface EventCategories {
    [key: string]: EventCategory;
}

interface AutomaticEventsProps {
    eventCategories: EventCategories;
    smsQuota: {
        available: number;
        used: number;
        total: number;
    };
    clientsStats: {
        total: number;
        byCategory: { category: string, count: number }[];
        byTag: { tag: string, count: number }[];
    };
    calendarEvents: {
        fixed: {
            [key: string]: {
                name: string;
                date: string;
                category: string;
                description: string;
                isActive: boolean;
                eventId: number;
            }[];
        };
        personal: {
            count: {
                birthday: number;
                nameDay: number;
                custom: number;
            };
        };
    };
}

export default function EventCalendar({
    auth,
    eventCategories,
    smsQuota,
    clientsStats,
    calendarEvents
}: PageProps<AutomaticEventsProps>) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<'month' | 'year'>('month');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
    const [monthEvents, setMonthEvents] = useState<MonthEvents>({});
    const [showAudienceSettings, setShowAudienceSettings] = useState(false);
    const [confirmingActivation, setConfirmingActivation] = useState<{
        eventIds: number[],
        smsCount: number,
        period: string
    } | null>(null);
    const [showCreateCampaignModal, setShowCreateCampaignModal] = useState(false);
    const [selectedEventForCampaign, setSelectedEventForCampaign] = useState<EventType | null>(null);

    const months = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    // Formulaire pour la configuration d'un événement
    const { data, setData, patch, processing, errors, reset } = useForm({
        is_active: false,
        custom_template: '',
        days_before: 0,
        audience_override: null as any
    });

    // Formulaire pour la création de campagne
    const { data: campaignData, setData: setCampaignData, post: postCampaign, processing: campaignProcessing, errors: campaignErrors, reset: resetCampaign } = useForm<{
        name: string;
        message_content: string;
        client_ids: number[];
        audience_type: string;
        selected_tags: any[];
        send_now: boolean;
        scheduled_at: string;
    }>({
        name: '',
        message_content: '',
        client_ids: [] as number[],
        audience_type: 'all', // all, tags, specific
        selected_tags: [] as any[],
        send_now: false,
        scheduled_at: ''
    });

    // Préparer les événements par mois
    useEffect(() => {
        organizeEventsByMonth();
    }, [currentDate, selectedCategory, eventCategories]);

    // Organiser les événements par mois
    const organizeEventsByMonth = () => {
        const events: MonthEvents = {};

        // Pour chaque catégorie d'événements
        Object.keys(eventCategories).forEach(categoryKey => {
            const category = eventCategories[categoryKey];

            // Si une catégorie est sélectionnée et que ce n'est pas celle-ci, ignorer
            if (selectedCategory && selectedCategory !== categoryKey) return;

            // Parcourir tous les événements de cette catégorie
            category.events.forEach(event => {
                const eventDate = getEventDate(event, categoryKey);
                if (eventDate) {
                    const month = eventDate.getMonth();
                    const monthKey = `${month}`;

                    if (!events[monthKey]) {
                        events[monthKey] = [];
                    }

                    events[monthKey].push(event);
                }
            });
        });

        setMonthEvents(events);
    };

    // Obtenir la date d'un événement (si applicable)
    const getEventDate = (event: EventType, category: string): Date | null => {
        // Pour les événements à date fixe (fêtes, jours fériés)
        if (category === 'calendar') {
            const currentYear = currentDate.getFullYear();
            const fixedEvents = calendarEvents?.fixed || {};

            for (const month in fixedEvents) {
                const monthEvents = fixedEvents[month];
                const matchingEvent = monthEvents.find(e => e.eventId === event.id);

                if (matchingEvent) {
                    // Format de la date: MM/DD
                    const [month, day] = matchingEvent.date.split('/');
                    return new Date(currentYear, parseInt(month) - 1, parseInt(day));
                }
            }
        }

        // Pour les événements personnels (anniversaires, etc.)
        // Ils n'ont pas de date fixe, mais on peut les afficher dans les mois correspondants
        if (category === 'personal') {
            // On peut les distribuer tout au long de l'année pour l'affichage
            if (event.code.includes('birthday')) {
                return new Date(currentDate.getFullYear(), currentDate.getMonth(), 15);
            }
        }

        // Événements marketing et récurrents
        if (category === 'marketing' || category === 'recurring') {
            // Distribuer ces événements sur différents mois pour l'affichage
            const codeSum = event.code.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
            const month = codeSum % 12;
            return new Date(currentDate.getFullYear(), month, 15);
        }

        return null;
    };

    // Calculer le nombre de SMS nécessaires pour un événement
    const calculateRequiredSms = (event: EventType): number => {
        let targetClients = 0;

        switch (event.audience_logic) {
            case 'all':
                targetClients = clientsStats.total;
                break;
            case 'male':
            case 'female':
                // Supposons que chaque genre représente environ la moitié des clients
                targetClients = Math.ceil(clientsStats.total / 2);
                break;
            case 'specific_category':
                targetClients = 0; // Les catégories n'existent plus
                break;
            case 'specific_tags':
                const tagIds = event.audience_override?.tags;
                if (tagIds && tagIds.length > 0) {
                    // Estimation simplifiée - dans un cas réel il faudrait une requête spécifique
                    let tagCount = 0;
                    tagIds.forEach(tagId => {
                        const tag = clientsStats.byTag.find(t => t.tag === tagId);
                        if (tag) tagCount += tag.count;
                    });
                    targetClients = Math.min(tagCount, clientsStats.total);
                }
                break;
            default:
                if (event.code.includes('birthday')) {
                    // Estimation: environ 1/365 des clients ont leur anniversaire un jour donné
                    targetClients = Math.ceil(clientsStats.total / 365);
                } else {
                    // Par défaut, on considère tous les clients
                    targetClients = clientsStats.total;
                }
        }

        return targetClients;
    };

    // Vérifier si l'utilisateur peut activer un événement
    const canActivateEvent = (event: EventType): boolean => {
        const requiredSms = calculateRequiredSms(event);
        return requiredSms <= smsQuota.available;
    };

    // Obtenir la liste des événements pour un mois donné
    const getEventsForMonth = (month: number): EventType[] => {
        return monthEvents[`${month}`] || [];
    };

    // Passer au mois précédent
    const prevMonth = () => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setMonth(prevDate.getMonth() - 1);
            return newDate;
        });
    };

    // Passer au mois suivant
    const nextMonth = () => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setMonth(prevDate.getMonth() + 1);
            return newDate;
        });
    };

    // Passer à l'année précédente
    const prevYear = () => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setFullYear(prevDate.getFullYear() - 1);
            return newDate;
        });
    };

    // Passer à l'année suivante
    const nextYear = () => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setFullYear(prevDate.getFullYear() + 1);
            return newDate;
        });
    };

    // Éditer la configuration d'un événement
    const editEvent = (event: EventType) => {
        setSelectedEvent(event);
        setData({
            is_active: event.is_active,
            custom_template: event.custom_template || event.default_template,
            days_before: event.days_before,
            audience_override: event.audience_override
        });
        setShowAudienceSettings(false);
    };

    // Sauvegarder la configuration d'un événement
    const saveEventConfig = () => {
        if (!selectedEvent) return;

        patch(route('automatic-events.update', selectedEvent.id), {
            onSuccess: () => {
                toast.success('Configuration de l\'événement mise à jour');
                setSelectedEvent(null);
                reset();
            },
            onError: () => {
                toast.error('Erreur lors de la mise à jour');
            }
        });
    };

    // Activer ou désactiver tous les événements d'un mois
    const toggleMonthEvents = (month: number, activate: boolean) => {
        const events = getEventsForMonth(month);
        const eventIds = events.map(e => e.id);
        const smsCount = events.reduce((total, event) => total + calculateRequiredSms(event), 0);

        if (activate && smsCount > smsQuota.available) {
            setConfirmingActivation({
                eventIds,
                smsCount,
                period: `le mois de ${months[month]}`
            });
            return;
        }

        // Sinon activer/désactiver les événements
        activateEvents(eventIds, activate);
    };

    // Activer ou désactiver tous les événements de l'année
    const toggleYearEvents = (activate: boolean) => {
        // Collecter tous les événements de l'année
        const allEvents: EventType[] = [];
        for (let month = 0; month < 12; month++) {
            allEvents.push(...getEventsForMonth(month));
        }

        const eventIds = allEvents.map(e => e.id);
        const smsCount = allEvents.reduce((total, event) => total + calculateRequiredSms(event), 0);

        if (activate && smsCount > smsQuota.available) {
            setConfirmingActivation({
                eventIds,
                smsCount,
                period: `l'année ${currentDate.getFullYear()}`
            });
            return;
        }

        // Sinon activer/désactiver les événements
        activateEvents(eventIds, activate);
    };

    // Activer ou désactiver une liste d'événements
    const activateEvents = (eventIds: number[], activate: boolean) => {
        // Dans un cas réel, on enverrait une requête au serveur
        eventIds.forEach(id => {
            patch(route('automatic-events.update', id), {
                is_active: activate,
            });
        });

        toast.success(`${eventIds.length} événements ${activate ? 'activés' : 'désactivés'}`);
    };

    // Annuler la confirmation d'activation
    const cancelActivation = () => {
        setConfirmingActivation(null);
    };

    // Confirmer l'activation malgré le dépassement de quota
    const confirmActivation = () => {
        if (!confirmingActivation) return;

        activateEvents(confirmingActivation.eventIds, true);
        setConfirmingActivation(null);
    };

    // Initialiser une campagne à partir d'un événement
    const initCampaignFromEvent = (event: EventType) => {
        setSelectedEventForCampaign(event);
        // @ts-ignore
        setCampaignData({
            name: `Campagne basée sur ${event.name}`,
            message_content: event.custom_template || event.default_template,
            client_ids: [],
            audience_type: event.audience_logic || 'all',
            selected_tags: event.audience_override?.tags || [],
            send_now: false,
            scheduled_at: new Date().toISOString().slice(0, 16)
        });
        setShowCreateCampaignModal(true);
    };

    // Soumettre le formulaire de campagne
    const submitCampaignForm = () => {
        // Préparer les données d'audience pour l'envoi au serveur
        let clientIds: number[] = [];

        if (campaignData.audience_type === 'all') {
            // Aucun traitement nécessaire, le serveur considérera tous les clients
        } else if (campaignData.audience_type === 'specific_tags' && campaignData.selected_tags.length > 0) {
            // La sélection des clients sera faite côté serveur basée sur les tags
        }

        // Préparer les données à envoyer
        const formData = {
            name: campaignData.name,
            message_content: campaignData.message_content,
            client_ids: clientIds,
            audience_type: campaignData.audience_type,
            selected_tags: campaignData.selected_tags,
            send_now: campaignData.send_now,
            scheduled_at: campaignData.scheduled_at || undefined,
            event_id: selectedEventForCampaign?.id  // Lier la campagne à l'événement d'origine
        };

        postCampaign(route('campaigns.store'), {
            data: formData,
            onSuccess: () => {
                setShowCreateCampaignModal(false);
                toast.success('Campagne créée avec succès');
                resetCampaign();
            },
            onError: () => {
                toast.error('Erreur lors de la création de la campagne');
            }
        });
    };

    // Rendu du calendrier mensuel
    const renderMonthView = () => {
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        const events = getEventsForMonth(currentMonth);

        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                    <button onClick={prevMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </button>

                    <div className="flex items-center space-x-2">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {months[currentMonth]} {currentYear}
                        </h2>
                        <button
                            onClick={() => setView('year')}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Vue annuelle"
                        >
                            <CalendarDays className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        </button>
                    </div>

                    <button onClick={nextMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>

                <div className="p-4">
                    <div className="mb-4 flex justify-between">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                            {events.length} événements ce mois-ci
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => toggleMonthEvents(currentMonth, true)}
                                className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-md hover:bg-green-200 dark:bg-green-900 dark:text-green-300"
                            >
                                Tout activer
                            </button>
                            <button
                                onClick={() => toggleMonthEvents(currentMonth, false)}
                                className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-md hover:bg-red-200 dark:bg-red-900 dark:text-red-300"
                            >
                                Tout désactiver
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {events.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                Aucun événement ce mois-ci
                            </div>
                        ) : (
                            events.map(event => (
                                <div
                                    key={event.id}
                                    className={`p-3 rounded-lg border ${event.is_active
                                        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/30'
                                        : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
                                        } flex justify-between items-center`}
                                >
                                    <div>
                                        <div className="flex items-center">
                                            {event.is_active ? (
                                                <Check className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                                            ) : (
                                                <X className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
                                            )}
                                            <h3 className="font-medium text-gray-900 dark:text-white">{event.name}</h3>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{event.description}</p>

                                        <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                                            <Users className="h-4 w-4 mr-1" />
                                            <span>~{calculateRequiredSms(event)} destinataires</span>

                                            {!canActivateEvent(event) && (
                                                <span className="ml-2 flex items-center text-amber-600 dark:text-amber-400">
                                                    <AlertTriangle className="h-4 w-4 mr-1" />
                                                    Quota insuffisant
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => editEvent(event)}
                                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                                            title="Configurer"
                                        >
                                            <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                        </button>

                                        <button
                                            onClick={() => initCampaignFromEvent(event)}
                                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                                            title="Créer une campagne à partir de cet événement"
                                        >
                                            <MessageSquare className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                        </button>

                                        <button
                                            onClick={() => patch(route('automatic-events.update', event.id), {
                                                is_active: !event.is_active
                                            })}
                                            className={`p-2 rounded-full ${event.is_active
                                                ? 'hover:bg-red-100 dark:hover:bg-red-900/50'
                                                : 'hover:bg-green-100 dark:hover:bg-green-900/50'
                                                }`}
                                            title={event.is_active ? "Désactiver" : "Activer"}
                                            disabled={!event.is_active && !canActivateEvent(event)}
                                        >
                                            {event.is_active ? (
                                                <X className="h-5 w-5 text-red-600 dark:text-red-400" />
                                            ) : (
                                                <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Rendu du calendrier annuel
    const renderYearView = () => {
        const currentYear = currentDate.getFullYear();

        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                    <button onClick={prevYear} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </button>

                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {currentYear}
                    </h2>

                    <button onClick={nextYear} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>

                <div className="p-4">
                    <div className="mb-4 flex justify-between">
                        <button
                            onClick={() => setView('month')}
                            className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300"
                        >
                            Retour à la vue mensuelle
                        </button>

                        <div className="flex space-x-2">
                            <button
                                onClick={() => toggleYearEvents(true)}
                                className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-md hover:bg-green-200 dark:bg-green-900 dark:text-green-300"
                            >
                                Tout activer
                            </button>
                            <button
                                onClick={() => toggleYearEvents(false)}
                                className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-md hover:bg-red-200 dark:bg-red-900 dark:text-red-300"
                            >
                                Tout désactiver
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {months.map((month, index) => {
                            const events = getEventsForMonth(index);
                            const totalSms = events.reduce((total, event) => event.is_active ? total + calculateRequiredSms(event) : total, 0);

                            return (
                                <div
                                    key={index}
                                    className="p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-medium text-gray-900 dark:text-white">{month}</h3>
                                        <button
                                            onClick={() => {
                                                setCurrentDate(new Date(currentYear, index, 1));
                                                setView('month');
                                            }}
                                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                            Voir détails
                                        </button>
                                    </div>

                                    <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                        {events.length} événements
                                    </div>

                                    <div className="flex justify-between items-center text-xs">
                                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                                            <BellRing className="h-4 w-4 mr-1" />
                                            <span>{events.filter(e => e.is_active).length} actifs</span>
                                        </div>

                                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                                            <span>{totalSms} SMS</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    // Rendu du filtre par catégorie
    const renderCategoryFilter = () => {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Filtrer par type</h3>

                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-3 py-1.5 rounded-md text-sm ${selectedCategory === null
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                    >
                        Tous
                    </button>

                    {Object.keys(eventCategories).map(key => (
                        <button
                            key={key}
                            onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
                            className={`px-3 py-1.5 rounded-md text-sm ${selectedCategory === key
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                }`}
                        >
                            {eventCategories[key].name}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    // Rendu de la barre d'état des quotas
    const renderQuotaStatus = () => {
        const usagePercentage = (smsQuota.used / smsQuota.total) * 100;

        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Quota SMS</h3>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        {smsQuota.available} disponibles sur {smsQuota.total}
                    </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div
                        className={`h-2.5 rounded-full ${usagePercentage > 90 ? 'bg-red-600' : usagePercentage > 70 ? 'bg-amber-500' : 'bg-green-600'
                            }`}
                        style={{ width: `${Math.min(100, usagePercentage)}%` }}
                    ></div>
                </div>

                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {usagePercentage > 90 ? (
                        <span className="flex items-center text-red-600 dark:text-red-400">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Quota presque épuisé
                        </span>
                    ) : usagePercentage > 70 ? (
                        <span className="flex items-center text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Quota limité
                        </span>
                    ) : (
                        <span className="flex items-center text-green-600 dark:text-green-400">
                            <Check className="h-4 w-4 mr-1" />
                            Quota suffisant
                        </span>
                    )}
                </div>
            </div>
        );
    };

    // Rendu du modal de configuration d'événement
    const renderEventConfigModal = () => {
        if (!selectedEvent) return null;

        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Configuration de l'événement
                        </h2>
                        <button
                            onClick={() => setSelectedEvent(null)}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="p-4">
                        <div className="mb-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{selectedEvent.name}</h3>
                                <div className="flex items-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Actif</span>
                                    <button
                                        onClick={() => setData({ ...data, is_active: !data.is_active })}
                                        className={`relative inline-flex items-center h-6 rounded-full w-11 ${data.is_active ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block w-4 h-4 transform transition-transform bg-white rounded-full ${data.is_active ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{selectedEvent.description}</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label htmlFor="custom_template" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Modèle de message
                                    </label>
                                    <button
                                        onClick={() => setData({ ...data, custom_template: selectedEvent.default_template })}
                                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        Réinitialiser
                                    </button>
                                </div>
                                <textarea
                                    id="custom_template"
                                    rows={4}
                                    value={data.custom_template}
                                    onChange={(e) => setData({ ...data, custom_template: e.target.value })}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                ></textarea>
                                {errors.custom_template && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.custom_template}</p>}

                                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    Variables disponibles: {"{client.name}"}, {"{client.phone}"}, {"{date}"}, {"{year}"}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setShowAudienceSettings(!showAudienceSettings)}
                                    className="flex items-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                                >
                                    <Settings className="h-4 w-4 mr-1" />
                                    {showAudienceSettings ? 'Masquer les paramètres avancés' : 'Afficher les paramètres avancés'}
                                </button>

                                {showAudienceSettings && (
                                    <div className="mt-4 space-y-4">
                                        <div>
                                            <label htmlFor="days_before" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Jours avant l'événement
                                            </label>
                                            <input
                                                type="number"
                                                id="days_before"
                                                min="0"
                                                value={data.days_before}
                                                onChange={(e) => setData({ ...data, days_before: parseInt(e.target.value) })}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                            />
                                            {errors.days_before && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.days_before}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Audience ciblée
                                            </label>

                                            {/* Options d'audience personnalisées ici */}
                                            <div className="space-y-2">
                                                <div className="flex items-center">
                                                    <input
                                                        type="radio"
                                                        id="audience_all"
                                                        name="audience_logic"
                                                        value="all"
                                                        checked={!data.audience_override || !data.audience_override.logic}
                                                        onChange={() => setData({ ...data, audience_override: null })}
                                                        className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                                                    />
                                                    <label htmlFor="audience_all" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                                        Tous les clients
                                                    </label>
                                                </div>

                                                <div className="flex items-center">
                                                    <input
                                                        type="radio"
                                                        id="audience_male"
                                                        name="audience_logic"
                                                        value="male"
                                                        checked={data.audience_override?.logic === 'male'}
                                                        onChange={() => setData({ ...data, audience_override: { logic: 'male' } })}
                                                        className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                                                    />
                                                    <label htmlFor="audience_male" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                                        Hommes uniquement
                                                    </label>
                                                </div>

                                                <div className="flex items-center">
                                                    <input
                                                        type="radio"
                                                        id="audience_female"
                                                        name="audience_logic"
                                                        value="female"
                                                        checked={data.audience_override?.logic === 'female'}
                                                        onChange={() => setData({ ...data, audience_override: { logic: 'female' } })}
                                                        className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                                                    />
                                                    <label htmlFor="audience_female" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                                        Femmes uniquement
                                                    </label>
                                                </div>

                                                {/* Autres options d'audience pourraient être ajoutées ici */}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                        <button
                            onClick={() => setSelectedEvent(null)}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={saveEventConfig}
                            disabled={processing}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-700 dark:hover:bg-indigo-600"
                        >
                            {processing ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Rendu du modal de confirmation d'activation
    const renderActivationConfirmation = () => {
        if (!confirmingActivation) return null;

        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Quota SMS insuffisant
                        </h2>
                    </div>

                    <div className="p-4">
                        <div className="flex items-center mb-4">
                            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400 mr-2" />
                            <p className="text-gray-700 dark:text-gray-300">
                                L'activation des événements pour {confirmingActivation.period} nécessite environ {confirmingActivation.smsCount} SMS, mais vous ne disposez que de {smsQuota.available} SMS.
                            </p>
                        </div>

                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Souhaitez-vous quand même activer ces événements? Vous devrez acheter des SMS supplémentaires.
                        </p>
                    </div>

                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                        <button
                            onClick={cancelActivation}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={confirmActivation}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 dark:bg-amber-700 dark:hover:bg-amber-600"
                        >
                            Activer quand même
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Rendu de la modale de création de campagne
    const renderCreateCampaignModal = () => {
        if (!showCreateCampaignModal || !selectedEventForCampaign) return null;

        const availableTags = clientsStats.byTag || [];

        // Calcul du nombre estimé de destinataires
        let estimatedRecipients = 0;
        if (campaignData.audience_type === 'all') {
            estimatedRecipients = clientsStats.total;
        } else if (campaignData.audience_type === 'specific_tags' && campaignData.selected_tags.length > 0) {
            // Calculer le nombre de destinataires pour chaque tag sélectionné
            estimatedRecipients = campaignData.selected_tags.reduce((total, tagId) => {
                const tagInfo = availableTags.find(t => t.tag === tagId);
                return total + (tagInfo ? tagInfo.count : 0);
            }, 0);
        }

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowCreateCampaignModal(false)}></div>
                <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl mx-auto overflow-y-auto max-h-[90vh]">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Création de campagne</h3>
                        <button onClick={() => setShowCreateCampaignModal(false)} className="text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md mb-4">
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                            Vous créez une campagne basée sur l'événement <strong>{selectedEventForCampaign.name}</strong>.
                            Vous pouvez personnaliser le message et l'audience avant de valider.
                        </p>
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); submitCampaignForm(); }} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Nom de la campagne
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={campaignData.name}
                                onChange={(e) => setCampaignData('name', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                required
                            />
                            {campaignErrors.name && <p className="mt-1 text-sm text-red-600">{campaignErrors.name}</p>}
                        </div>

                        <div>
                            <label htmlFor="message_content" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Contenu du message
                            </label>
                            <textarea
                                id="message_content"
                                name="message_content"
                                rows={4}
                                value={campaignData.message_content}
                                onChange={(e) => setCampaignData('message_content', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                required
                            />
                            {campaignErrors.message_content && <p className="mt-1 text-sm text-red-600">{campaignErrors.message_content}</p>}
                            <div className="mt-1 text-xs text-gray-500">
                                Variables disponibles: {"{client.name}"}, {"{client.phone}"}, {"{date}"}
                            </div>
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                Audience
                            </h4>

                            <div className="space-y-3">
                                <div className="flex items-center">
                                    <input
                                        type="radio"
                                        id="audience_all"
                                        name="audience_type"
                                        value="all"
                                        checked={campaignData.audience_type === 'all'}
                                        onChange={() => setCampaignData('audience_type', 'all')}
                                        className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600"
                                    />
                                    <label htmlFor="audience_all" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                        Tous les clients ({clientsStats.total} clients)
                                    </label>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="radio"
                                        id="audience_tags"
                                        name="audience_type"
                                        value="tags"
                                        checked={campaignData.audience_type === 'specific_tags'}
                                        onChange={() => setCampaignData('audience_type', 'specific_tags')}
                                        className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600"
                                    />
                                    <label htmlFor="audience_tags" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                        Clients avec tags spécifiques
                                    </label>
                                </div>

                                {campaignData.audience_type === 'specific_tags' && (
                                    <div className="ml-6 mt-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Sélectionnez les tags
                                        </label>
                                        <div className="max-h-32 overflow-y-auto p-2 border border-gray-300 dark:border-gray-600 rounded-md">
                                            {availableTags.length === 0 ? (
                                                <p className="text-sm text-gray-500">Aucun tag disponible</p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {availableTags.map(tag => (
                                                        <div key={tag.tag} className="flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                id={`tag-${tag.tag}`}
                                                                checked={campaignData.selected_tags.includes(tag.tag)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setCampaignData('selected_tags', [...campaignData.selected_tags, tag.tag]);
                                                                    } else {
                                                                        setCampaignData('selected_tags', campaignData.selected_tags.filter(t => t !== tag.tag));
                                                                    }
                                                                }}
                                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600"
                                                            />
                                                            <label htmlFor={`tag-${tag.tag}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                                                {tag.tag} ({tag.count} clients)
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Programmation
                            </label>
                            <div className="mt-2 space-y-2">
                                <div className="flex items-center">
                                    <input
                                        id="send_now"
                                        name="send_now"
                                        type="checkbox"
                                        checked={campaignData.send_now}
                                        onChange={(e) => setCampaignData('send_now', e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                                    />
                                    <label htmlFor="send_now" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                        Envoyer immédiatement
                                    </label>
                                </div>

                                {!campaignData.send_now && (
                                    <div>
                                        <label htmlFor="scheduled_at" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Date d'envoi programmée
                                        </label>
                                        <input
                                            type="datetime-local"
                                            id="scheduled_at"
                                            name="scheduled_at"
                                            value={campaignData.scheduled_at}
                                            onChange={(e) => setCampaignData('scheduled_at', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                            required={!campaignData.send_now}
                                        />
                                        {campaignErrors.scheduled_at && <p className="mt-1 text-sm text-red-600">{campaignErrors.scheduled_at}</p>}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Ajout du récapitulatif avant validation */}
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                Récapitulatif
                            </h4>

                            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
                                <dl className="divide-y divide-gray-200 dark:divide-gray-700">
                                    <div className="grid grid-cols-3 py-2">
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Événement d'origine</dt>
                                        <dd className="col-span-2 text-sm text-gray-900 dark:text-white">{selectedEventForCampaign.name}</dd>
                                    </div>

                                    <div className="grid grid-cols-3 py-2">
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Destinataires</dt>
                                        <dd className="col-span-2 text-sm text-gray-900 dark:text-white">
                                            {estimatedRecipients} clients ciblés
                                        </dd>
                                    </div>

                                    <div className="grid grid-cols-3 py-2">
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Envoi</dt>
                                        <dd className="col-span-2 text-sm text-gray-900 dark:text-white">
                                            {campaignData.send_now
                                                ? 'Immédiat après création'
                                                : `Programmé pour le ${new Date(campaignData.scheduled_at).toLocaleString()}`
                                            }
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end space-x-2">
                            <button
                                type="button"
                                onClick={() => setShowCreateCampaignModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={campaignProcessing}
                                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {campaignProcessing ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Traitement...
                                    </>
                                ) : (
                                    'Créer la campagne'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Calendrier des Événements Automatiques
                </h2>
            }
        >
            <Head title="Calendrier des Événements" />
            <Toaster position="top-right" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="mb-6 md:flex md:space-x-6">
                        <div className="md:w-3/4">
                            {renderCategoryFilter()}
                            {view === 'month' ? renderMonthView() : renderYearView()}
                        </div>

                        <div className="md:w-1/4 mt-6 md:mt-0">
                            {renderQuotaStatus()}

                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Statistiques</h3>

                                <div className="space-y-3">
                                    <div>
                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Clients total</div>
                                        <div className="text-xl font-semibold text-gray-900 dark:text-white">{clientsStats.total}</div>
                                    </div>

                                    <div>
                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Clients avec anniversaire</div>
                                        <div className="text-xl font-semibold text-gray-900 dark:text-white">{calendarEvents.personal.count.birthday}</div>
                                    </div>

                                    <div>
                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Events programmés ce mois-ci</div>
                                        <div className="text-xl font-semibold text-gray-900 dark:text-white">
                                            {getEventsForMonth(currentDate.getMonth()).filter(e => e.is_active).length}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <Link
                                        href={route('subscription.top-up')}
                                        className="block w-full text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-700 dark:hover:bg-indigo-600"
                                    >
                                        Acheter des SMS
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {renderEventConfigModal()}
            {renderActivationConfirmation()}
            {renderCreateCampaignModal()}
        </AuthenticatedLayout>
    );
}