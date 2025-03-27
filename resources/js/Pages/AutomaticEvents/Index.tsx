import React, { useState, useEffect, useMemo } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useTranslation } from 'react-i18next';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Filter,
    Users,
    PieChart,
    AlertTriangle,
    CheckCircle2,
    Info,
    Settings,
    BarChart3
} from 'lucide-react';

// Types pour les événements
interface Event {
    id: number;
    code: string;
    name: string;
    description: string;
    event_type: string;
    date?: string;
    is_active: boolean;
    audience_size: number;
    category: string;
    template: string;
    audience_logic: string;
    audience_override?: any;
}

interface DayEvents {
    date: Date;
    events: Event[];
    isToday: boolean;
    isPast: boolean;
    isHoliday: boolean;
}

interface EventsCalendarProps {
    events: Event[];
    categories: {
        id: string;
        name: string;
        description: string;
    }[];
    stats: {
        total_events: number;
        active_events: number;
        upcoming_events: number;
        sms_quota: {
            available: number;
            used: number;
            total: number;
        },
        clients: {
            total: number;
            with_birthday: number;
            categories: {id: number, name: string, count: number}[];
        }
    };
}

export default function EventsCalendar({
                                           events,
                                           categories,
                                           stats
                                       }: EventsCalendarProps) {
    const { t } = useTranslation();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [calendarView, setCalendarView] = useState<'month' | 'year'>('month');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [activationConfirm, setActivationConfirm] = useState<{
        eventIds: number[];
        smsRequired: number;
        period: string;
    } | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Calcul des jours du mois actuel avec leurs événements
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // Premier jour du mois
        const firstDay = new Date(year, month, 1);
        // Dernier jour du mois
        const lastDay = new Date(year, month + 1, 0);

        // Jour de la semaine du premier jour (0 = dimanche, 1 = lundi, etc.)
        const firstDayOfWeek = firstDay.getDay();

        // Nombre de jours à afficher avant le premier jour du mois (pour compléter la semaine)
        const daysFromPreviousMonth = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

        // Calculer le premier jour à afficher dans le calendrier
        const startDate = new Date(year, month, 1 - daysFromPreviousMonth);

        // Nombre total de jours à afficher (6 semaines maximum)
        const totalDays = 42;

        const days: DayEvents[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < totalDays; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            date.setHours(0, 0, 0, 0);

            // Filtrer les événements pour cette date
            const dayEvents = events.filter(event => {
                if (!event.date) return false;
                const eventDate = new Date(event.date);
                return eventDate.getDate() === date.getDate() &&
                    eventDate.getMonth() === date.getMonth() &&
                    eventDate.getFullYear() === date.getFullYear();
            });

            // Filtrer par catégorie si nécessaire
            const filteredEvents = activeCategory
                ? dayEvents.filter(event => event.category === activeCategory)
                : dayEvents;

            days.push({
                date,
                events: filteredEvents,
                isToday: date.getTime() === today.getTime(),
                isPast: date.getTime() < today.getTime(),
                isHoliday: dayEvents.some(event => event.category === 'holiday')
            });
        }

        return days;
    }, [currentDate, events, activeCategory]);

    // Passer au mois précédent
    const goToPreviousMonth = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() - 1);
            return newDate;
        });
    };

    // Passer au mois suivant
    const goToNextMonth = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + 1);
            return newDate;
        });
    };

    // Nom des mois et jours de la semaine
    const months = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const weekdays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

    // Calcul des statistiques d'utilisation des SMS
    const smsQuotaPercentage = Math.round((stats.sms_quota.used / stats.sms_quota.total) * 100);

    // Vérifier si l'activation est possible (SMS suffisants)
    const canActivateEvents = (requiredSms: number): boolean => {
        return requiredSms <= stats.sms_quota.available;
    };

    // Calculer combien de SMS seraient nécessaires pour activer tous les événements d'une période
    const calculateRequiredSms = (eventIds: number[]): number => {
        return eventIds.reduce((total, id) => {
            const event = events.find(e => e.id === id);
            return total + (event?.audience_size || 0);
        }, 0);
    };

    // Activer tous les événements d'un jour
    const activateDayEvents = (day: DayEvents) => {
        const eventIds = day.events.map(event => event.id);
        const requiredSms = calculateRequiredSms(eventIds);

        // Vérifier s'il y a assez de SMS disponibles
        if (!canActivateEvents(requiredSms)) {
            setActivationConfirm({
                eventIds,
                smsRequired: requiredSms,
                period: `le ${day.date.getDate()} ${months[day.date.getMonth()]}`
            });
            return;
        }

        // Sinon, activer directement
        confirmActivation(eventIds);
    };

    // Activer tous les événements du mois
    const activateMonthEvents = () => {
        // Filtrer pour n'inclure que les événements du mois actuel
        const monthDays = calendarDays.filter(day =>
            day.date.getMonth() === currentDate.getMonth() &&
            day.date.getFullYear() === currentDate.getFullYear()
        );

        const allEventIds: number[] = [];
        monthDays.forEach(day => {
            day.events.forEach(event => {
                if (!allEventIds.includes(event.id)) {
                    allEventIds.push(event.id);
                }
            });
        });

        const requiredSms = calculateRequiredSms(allEventIds);

        // Vérifier s'il y a assez de SMS disponibles
        if (!canActivateEvents(requiredSms)) {
            setActivationConfirm({
                eventIds: allEventIds,
                smsRequired: requiredSms,
                period: `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`
            });
            return;
        }

        // Sinon, activer directement
        confirmActivation(allEventIds);
    };

    // Fonction pour confirmer l'activation (après vérification)
    const confirmActivation = (eventIds: number[]) => {
        // Ici nous simulerons l'appel API pour activer les événements
        console.log(`Activation de ${eventIds.length} événements`);

        // Réinitialiser le dialogue de confirmation
        setActivationConfirm(null);

        // Dans une implémentation réelle, vous feriez un appel API puis afficheriez une notification de succès
        // axios.post(route('events.bulk-activate'), { event_ids: eventIds })
        //   .then(() => {
        //     // Afficher notification de succès
        //   })
        //   .catch(error => {
        //     // Gérer l'erreur
        //   });
    };

    // Annuler l'activation
    const cancelActivation = () => {
        setActivationConfirm(null);
    };

    // Ouvrir le modal d'édition d'un événement
    const editEvent = (event: Event) => {
        setSelectedEvent(event);
        setIsEditing(true);
    };

    // Fermer le modal d'édition
    const closeEditModal = () => {
        setSelectedEvent(null);
        setIsEditing(false);
    };

    // Rendu de l'en-tête du calendrier
    const renderCalendarHeader = () => (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
                <button
                    onClick={goToPreviousMonth}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                    <ChevronLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>

                <button
                    onClick={goToNextMonth}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                    <ChevronRight className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
            </div>

            <div className="flex items-center space-x-2">
                {/* Filtrer par catégorie */}
                <div className="relative">
                    <button
                        className="flex items-center space-x-1 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 border border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
                    >
                        <Filter className="h-4 w-4" />
                        <span>Filtrer</span>
                    </button>

                    {/* Menu déroulant (caché par défaut) */}
                </div>

                {/* Activer tous les événements du mois */}
                <button
                    onClick={activateMonthEvents}
                    className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                    Activer le mois
                </button>
            </div>
        </div>
    );

    // Rendu des jours de la semaine
    const renderWeekdays = () => (
        <div className="grid grid-cols-7 mb-1">
            {weekdays.map((day, index) => (
                <div
                    key={index}
                    className="py-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
                >
                    {day}
                </div>
            ))}
        </div>
    );

    // Rendu des jours du calendrier
    const renderCalendarDays = () => (
        <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
                // Déterminer si le jour fait partie du mois en cours
                const isCurrentMonth = day.date.getMonth() === currentDate.getMonth();

                return (
                    <div
                        key={index}
                        onClick={() => setSelectedDate(day.date)}
                        className={`
              min-h-[100px] p-2 border rounded-md transition-colors
              ${isCurrentMonth
                            ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                            : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 opacity-50'}
              ${day.isToday ? 'ring-2 ring-indigo-500 dark:ring-indigo-400' : ''}
              ${day.isHoliday ? 'bg-red-50 dark:bg-red-900/20' : ''}
              ${selectedDate && day.date.getTime() === selectedDate.getTime()
                            ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}
              hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer
            `}
                    >
                        {/* Numéro du jour */}
                        <div className="flex justify-between items-center mb-1">
              <span className={`
                text-sm font-medium rounded-full h-6 w-6 flex items-center justify-center
                ${day.isToday ? 'bg-indigo-500 text-white' : 'text-gray-700 dark:text-gray-300'}
              `}>
                {day.date.getDate()}
              </span>

                            {/* Pastille indiquant le nombre d'événements */}
                            {day.events.length > 0 && (
                                <span className="text-xs px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-full dark:bg-indigo-900 dark:text-indigo-300">
                  {day.events.length}
                </span>
                            )}
                        </div>

                        {/* Liste des événements du jour (limité à 3) */}
                        <div className="space-y-1">
                            {day.events.slice(0, 3).map(event => (
                                <div
                                    key={event.id}
                                    className={`
                    text-xs px-1.5 py-1 rounded truncate
                    ${event.is_active
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}
                  `}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedEvent(event);
                                    }}
                                >
                                    {event.name}
                                </div>
                            ))}

                            {/* Indicateur pour plus d'événements */}
                            {day.events.length > 3 && (
                                <div className="text-xs text-center text-gray-500 dark:text-gray-400">
                                    +{day.events.length - 3} autres
                                </div>
                            )}
                        </div>

                        {/* Bouton d'activation pour les jours avec événements */}
                        {day.events.length > 0 && isCurrentMonth && !day.isPast && (
                            <div className="mt-1 text-right">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        activateDayEvents(day);
                                    }}
                                    className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                                >
                                    Activer
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );

    // Rendu du panneau latéral avec les statistiques
    const renderSidebar = () => (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-6">
            {/* Quota SMS */}
            <div>
                <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Quota SMS
                </h3>

                <div className="space-y-2">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500 dark:text-gray-400">Disponible: {stats.sms_quota.available}</span>
                        <span className="text-gray-500 dark:text-gray-400">Total: {stats.sms_quota.total}</span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div
                            className={`h-2.5 rounded-full ${
                                smsQuotaPercentage > 80 ? 'bg-red-600' :
                                    smsQuotaPercentage > 60 ? 'bg-yellow-500' : 'bg-green-600'
                            }`}
                            style={{ width: `${smsQuotaPercentage}%` }}
                        ></div>
                    </div>

                    <div className="flex items-center mt-1">
                        {smsQuotaPercentage > 80 ? (
                            <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                        ) : smsQuotaPercentage > 60 ? (
                            <Info className="h-4 w-4 text-yellow-500 mr-1" />
                        ) : (
                            <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                        )}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
              {smsQuotaPercentage}% utilisé
            </span>
                    </div>
                </div>
            </div>

            {/* Statistiques des événements */}
            <div>
                <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Événements
                </h3>

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Total:</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{stats.total_events}</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Actifs:</span>
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">{stats.active_events}</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400">À venir:</span>
                        <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{stats.upcoming_events}</span>
                    </div>
                </div>
            </div>

            {/* Statistiques des clients */}
            <div>
                <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Clients
                </h3>

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Total:</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{stats.clients.total}</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Avec anniversaire:</span>
                        <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{stats.clients.with_birthday}</span>
                    </div>
                </div>

                {/* Distribution par catégorie - petit graphique */}
                <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Distribution par catégorie</span>
                        <PieChart className="h-3 w-3 text-gray-400" />
                    </div>

                    <div className="space-y-1">
                        {stats.clients.categories.map(category => (
                            <div key={category.id} className="flex items-center text-xs">
                                <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700 mr-2">
                                    <div
                                        className="bg-indigo-600 h-1.5 rounded-full"
                                        style={{ width: `${(category.count / stats.clients.total) * 100}%` }}
                                    ></div>
                                </div>
                                <span className="whitespace-nowrap text-gray-500 dark:text-gray-400">
                  {category.name} ({category.count})
                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Liens rapides */}
            <div>
                <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-2">Actions rapides</h3>

                <div className="space-y-2">
                    <Link
                        href="/campaigns/create"
                        className="block w-full text-center px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
                    >
                        Créer une campagne
                    </Link>

                    <Link
                        href="/clients/create"
                        className="block w-full text-center px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        Ajouter un client
                    </Link>
                </div>
            </div>
        </div>
    );

    // Rendu du modal d'événement sélectionné
    const renderEventModal = () => {
        if (!selectedEvent) return null;

        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {isEditing ? "Modifier l'événement" : "Détails de l'événement"}
                        </h2>
                        <button
                            onClick={() => setSelectedEvent(null)}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="p-4">
                        {isEditing ? (
                            // Formulaire d'édition
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Nom de l'événement
                                    </label>
                                    <input
                                        type="text"
                                        value={selectedEvent.name}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Modèle de message
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={selectedEvent.template}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Audience cible
                                    </label>
                                    <select
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    >
                                        <option value="all">Tous les clients</option>
                                        <option value="male">Hommes uniquement</option>
                                        <option value="female">Femmes uniquement</option>
                                        <option value="custom">Personnalisé</option>
                                    </select>
                                </div>

                                <div className="flex items-center pt-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedEvent.is_active}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                                    />
                                    <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                        Activer cet événement
                                    </label>
                                </div>
                            </div>
                        ) : (
                            // Affichage des détails
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Type</span>
                                        <span className="text-sm text-gray-900 dark:text-white">{selectedEvent.event_type}</span>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Date</span>
                                        <span className="text-sm text-gray-900 dark:text-white">
                      {selectedEvent.date ? new Date(selectedEvent.date).toLocaleDateString() : 'Variable'}
                    </span>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Statut</span>
                                        <span className={`text-sm px-2 py-1 rounded-full ${
                                            selectedEvent.is_active
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                        }`}>
                      {selectedEvent.is_active ? 'Actif' : 'Inactif'}
                    </span>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Audience estimée</span>
                                        <span className="text-sm text-gray-900 dark:text-white">
                      {selectedEvent.audience_size} clients
                    </span>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">SMS nécessaires</span>
                                        <span className="text-sm text-gray-900 dark:text-white">
                      {selectedEvent.audience_size}
                    </span>
                                    </div>

                                    {selectedEvent.audience_size > stats.sms_quota.available && (
                                        <div className="text-xs text-red-600 dark:text-red-400 flex items-center">
                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                            <span>Quota SMS insuffisant pour cet événement</span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</span>
                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{selectedEvent.description}</p>
                                </div>

                                <div>
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Modèle de message</span>
                                    <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                                        <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{selectedEvent.template}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                        <div>
                            {!isEditing && (
                                <button
                                    onClick={() => editEvent(selectedEvent)}
                                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                                >
                                    <Settings className="h-4 w-4 mr-1" />
                                    Configurer
                                </button>
                            )}
                        </div>

                        <div className="flex space-x-2">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={closeEditModal}
                                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Enregistrer
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => {
                                        // Simulation d'activation/désactivation
                                        setSelectedEvent({
                                            ...selectedEvent,
                                            is_active: !selectedEvent.is_active
                                        });
                                    }}
                                    className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white ${
                                        selectedEvent.is_active
                                            ? 'bg-red-600 hover:bg-red-700'
                                            : 'bg-green-600 hover:bg-green-700'
                                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                                    disabled={!selectedEvent.is_active && selectedEvent.audience_size > stats.sms_quota.available}
                                >
                                    {selectedEvent.is_active ? 'Désactiver' : 'Activer'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Rendu du modal de confirmation d'activation
    const renderActivationConfirmModal = () => {
        if (!activationConfirm) return null;

        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Confirmation d'activation
                        </h2>
                    </div>

                    <div className="p-4">
                        <div className="flex items-center mb-4">
                            <AlertTriangle className="h-6 w-6 text-yellow-500 mr-2" />
                            <div>
                                <p className="text-gray-700 dark:text-gray-300">
                                    Vous êtes sur le point d'activer {activationConfirm.eventIds.length} événements pour {activationConfirm.period}.
                                </p>
                                <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                                    Cette action nécessite {activationConfirm.smsRequired} SMS, mais vous n'en avez que {stats.sms_quota.available} disponibles.
                                </p>
                            </div>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Souhaitez-vous acheter des SMS supplémentaires ou procéder avec un nombre réduit d'événements ?
                        </p>
                    </div>

                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-2 justify-end">
                        <button
                            onClick={cancelActivation}
                            className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md bg-white hover:bg-gray-50 text-sm font-medium dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                        >
                            Annuler
                        </button>

                        <Link
                            href="/subscription/top-up"
                            className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
                        >
                            Acheter des SMS
                        </Link>

                        <button
                            onClick={() => confirmActivation(activationConfirm.eventIds)}
                            className="px-3 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-sm font-medium"
                        >
                            Activer quand même
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="lg:w-3/4">
                    {renderCalendarHeader()}
                    {renderWeekdays()}
                    {renderCalendarDays()}
                </div>

                <div className="lg:w-1/4">
                    {renderSidebar()}
                </div>
            </div>

            {/* Modals */}
            {renderEventModal()}
            {renderActivationConfirmModal()}
        </div>
    );
}
