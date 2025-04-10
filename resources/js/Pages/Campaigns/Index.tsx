// resources/js/Pages/Campaigns/Index.tsx
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';
import { Campaign } from '@/types';
import { Calendar, momentLocalizer, Views, SlotInfo } from 'react-big-calendar';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import moment from 'moment';
import 'moment/locale/fr';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import axios from 'axios';

// Importation des icônes Lucide
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Search,
    Plus,
    Menu,
    Grid,
    Clock,
    Users,
    Settings,
    Sliders,
    MoreVertical,
    X,
    Mail,
    AlertTriangle,
    Check,
    RefreshCw,
    Copy,
    Download,
    Upload,
    Trash2,
    Bell,
    PieChart,
    Zap,
    Tag,
    FileText,
    Eye,
    Filter,
    Bookmark,
    Star,
    Moon,
    Sun,
    Loader,
    AlertCircle,
    Clipboard,
    Save,
    BarChart2,
    HelpCircle
} from 'lucide-react';

interface CampaignsIndexProps {
    campaigns: {
        data: Campaign[];
        links: any[];
        total: number;
    };
    templates?: Array<{
        id: number;
        name: string;
        description: string;
    }>;
    stats?: {
        deliveryRate: number;
        openRate: number;
        clickRate: number;
        totalSent: number;
    };
    [key: string]: unknown;
}

// Type pour le drag and drop
interface DragItem {
    type: string;
    id: number;
    index: number;
    campaign: Campaign;
    originalDate: Date;
}

// Types pour notifications
interface Notification {
    id: number;
    type: 'info' | 'warning' | 'success' | 'error';
    message: string;
    read: boolean;
    time: string;
}

// Configurer le localisateur pour react-big-calendar
moment.locale('fr');
const localizer = momentLocalizer(moment);

export default function CampaignsIndex({
    auth,
    campaigns,
    templates = [],
    stats = {
        deliveryRate: 89.7,
        openRate: 32.5,
        clickRate: 12.3,
        totalSent: 45678
    }
}: PageProps<CampaignsIndexProps>) {
    const { t } = useTranslation();

    // États principaux
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [tagFilter, setTagFilter] = useState<string>('all');
    const [calendarView, setCalendarView] = useState(Views.MONTH);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showEventDetails, setShowEventDetails] = useState<number | null>(null);
    const [eventDetailsPosition, setEventDetailsPosition] = useState({ top: 0, left: 0 });
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showHelpModal, setShowHelpModal] = useState(false);

    // États avancés
    const [currentMonth, setCurrentMonth] = useState(moment().format('MMMM YYYY'));
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [newCampaignData, setNewCampaignData] = useState({
        name: '',
        subject: '',
        scheduled_at: moment().add(1, 'day').format('YYYY-MM-DDTHH:mm'),
        template_id: '',
        tags: [] as string[]
    });
    const [notifications, setNotifications] = useState<Notification[]>([
        { id: 1, type: 'warning', message: t('campaigns.notification.upcomingCampaign'), read: false, time: '5m' },
        { id: 2, type: 'info', message: t('campaigns.notification.campaignPrepared'), read: false, time: '1h' },
        { id: 3, type: 'success', message: t('campaigns.notification.campaignSent'), read: true, time: '3h' }
    ]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(2);
    const [availableTags, setAvailableTags] = useState(['newsletter', 'promo', 'event', 'announcement', 'update']);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [draggedCampaign, setDraggedCampaign] = useState<Campaign | null>(null);
    const [calendarType, setCalendarType] = useState<'month' | 'schedule'>('month');

    // Refs
    const popoverRef = useRef<HTMLDivElement>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);

    // Effets
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setShowEventDetails(null);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node) && showNotifications) {
                setShowNotifications(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [popoverRef, notificationsRef, showNotifications]);

    // Calculer le nombre de notifications non lues
    useEffect(() => {
        setUnreadCount(notifications.filter(n => !n.read).length);
    }, [notifications]);

    // Navigation du calendrier
    const navigateCalendar = (action: 'PREV' | 'NEXT' | 'TODAY') => {
        const current = moment(selectedDate);
        let newDate;

        if (action === 'PREV') {
            if (calendarView === Views.MONTH) {
                newDate = current.subtract(1, 'month').toDate();
            } else if (calendarView === Views.WEEK) {
                newDate = current.subtract(1, 'week').toDate();
            } else {
                newDate = current.subtract(1, 'day').toDate();
            }
        } else if (action === 'NEXT') {
            if (calendarView === Views.MONTH) {
                newDate = current.add(1, 'month').toDate();
            } else if (calendarView === Views.WEEK) {
                newDate = current.add(1, 'week').toDate();
            } else {
                newDate = current.add(1, 'day').toDate();
            }
        } else {
            newDate = new Date();
        }

        setSelectedDate(newDate);
        updateCurrentMonth(newDate);
    };

    const updateCurrentMonth = (date: Date) => {
        setCurrentMonth(moment(date).format('MMMM YYYY'));
    };

    // Changement de vue du calendrier
    const handleViewChange = (view: string) => {
        setCalendarView(view);
    };

    // Formatting
    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return moment(dateString).format('DD/MM/YYYY HH:mm');
    };

    // Gestion des statuts
    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'draft':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
            case 'scheduled':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case 'sending':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
            case 'sent':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'partially_sent':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            case 'paused':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            case 'failed':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            case 'cancelled':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return '#9CA3AF'; // gray-400
            case 'scheduled': return '#3B82F6'; // blue-500
            case 'sending': return '#8B5CF6'; // purple-500
            case 'sent': return '#10B981'; // green-500
            case 'partially_sent': return '#F59E0B'; // yellow-500
            case 'paused': return '#FBBF24'; // yellow-400
            case 'failed': return '#EF4444'; // red-500
            case 'cancelled': return '#6B7280'; // gray-500
            default: return '#D1D5DB'; // gray-300
        }
    };

    const getStatusName = (status: string) => {
        switch (status) {
            case 'draft':
                return t('campaigns.status.draft');
            case 'scheduled':
                return t('campaigns.status.scheduled');
            case 'sending':
                return t('campaigns.status.sending');
            case 'sent':
                return t('campaigns.status.sent');
            case 'partially_sent':
                return t('campaigns.status.partiallySent');
            case 'paused':
                return t('campaigns.status.paused');
            case 'failed':
                return t('campaigns.status.failed');
            case 'cancelled':
                return t('campaigns.status.cancelled');
            default:
                return status;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'draft':
                return <Mail className="h-4 w-4" />;
            case 'scheduled':
                return <Clock className="h-4 w-4" />;
            case 'sending':
                return <RefreshCw className="h-4 w-4" />;
            case 'sent':
                return <Check className="h-4 w-4" />;
            case 'partially_sent':
                return <AlertTriangle className="h-4 w-4" />;
            case 'paused':
                return <AlertTriangle className="h-4 w-4" />;
            case 'failed':
                return <AlertTriangle className="h-4 w-4" />;
            case 'cancelled':
                return <X className="h-4 w-4" />;
            default:
                return <Mail className="h-4 w-4" />;
        }
    };

    // Filtrage des campagnes
    const filteredCampaigns = useMemo(() => {
        return campaigns.data.filter(campaign => {
            // Filtre par statut
            const statusMatches = statusFilter === 'all' || campaign.status === statusFilter;

            // Filtre par recherche
            const searchMatches = searchTerm === "" ||
                campaign.name.toLowerCase().includes(searchTerm.toLowerCase());

            // Filtre par tag (simulé puisque nous n'avons pas de tags dans les données originales)
            const tags = campaign.tags || [];
            const tagMatches = tagFilter === 'all' || (Array.isArray(tags) && tags.includes(tagFilter));

            return statusMatches && searchMatches && tagMatches;
        });
    }, [campaigns.data, statusFilter, searchTerm, tagFilter]);

    // Groupement de campagnes par statut pour la barre latérale
    const campaignsByStatus = useMemo(() => {
        const result: { [key: string]: Campaign[] } = {
            draft: [],
            scheduled: [],
            sending: [],
            sent: [],
            paused: [],
            failed: [],
        };

        campaigns.data.forEach(campaign => {
            if (campaign.status && result.hasOwnProperty(campaign.status)) {
                result[campaign.status].push(campaign);
            }
        });

        return result;
    }, [campaigns.data]);

    // Campagnes aujourd'hui
    const todayCampaigns = useMemo(() => {
        const today = moment().startOf('day');
        return campaigns.data.filter(campaign => {
            if (!campaign.scheduled_at) return false;
            const campaignDate = moment(campaign.scheduled_at).startOf('day');
            return campaignDate.isSame(today);
        });
    }, [campaigns.data]);

    // Campagnes à venir cette semaine
    const upcomingCampaigns = useMemo(() => {
        const today = moment().startOf('day');
        const endOfWeek = moment().endOf('week');
        return campaigns.data.filter(campaign => {
            if (!campaign.scheduled_at) return false;
            const campaignDate = moment(campaign.scheduled_at).startOf('day');
            return campaignDate.isAfter(today) && campaignDate.isBefore(endOfWeek);
        });
    }, [campaigns.data]);

    // Transform campaigns for react-big-calendar
    const calendarEvents = useMemo(() => {
        return filteredCampaigns.map(campaign => {
            // Utilisez scheduled_at s'il existe, sinon utilisez created_at comme fallback
            const startDate = campaign.scheduled_at ? new Date(campaign.scheduled_at) : new Date(campaign.created_at);

            // End date is start date + 1 hour for visualization
            const endDate = new Date(startDate);
            endDate.setHours(endDate.getHours() + 1);

            return {
                id: campaign.id,
                title: campaign.name,
                start: startDate,
                end: endDate,
                status: campaign.status,
                campaign: campaign, // Store the entire campaign object for easy access
                resource: campaign.status
            };
        });
    }, [filteredCampaigns]);

    // Fonctions pour la gestion des notifications
    const markAllAsRead = () => {
        setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
        setUnreadCount(0);
    };

    const markAsRead = (id: number) => {
        setNotifications(prev =>
            prev.map(notification =>
                notification.id === id
                    ? { ...notification, read: true }
                    : notification
            )
        );
    };

    const removeNotification = (id: number) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    };

    // Fonctions pour les actions sur les campagnes
    const handleCopyCampaign = (campaign: Campaign) => {
        setIsLoading(true);

        // Simulation API call pour copier une campagne
        setTimeout(() => {
            setSuccess(t('campaigns.copiedSuccessfully', { name: campaign.name }));
            setIsLoading(false);

            // Fermer la notification de succès après 3 secondes
            setTimeout(() => {
                setSuccess(null);
            }, 3000);
        }, 1000);
    };

    const handleCancelCampaign = (campaign: Campaign) => {
        if (window.confirm(t('campaigns.confirmCancel'))) {
            setIsLoading(true);

            // Simulation API call pour annuler une campagne
            setTimeout(() => {
                setSuccess(t('campaigns.cancelledSuccessfully', { name: campaign.name }));
                setIsLoading(false);

                // Fermer la notification de succès après 3 secondes
                setTimeout(() => {
                    setSuccess(null);
                }, 3000);
            }, 1000);
        }
    };

    const handleDeleteCampaign = (campaign: Campaign) => {
        if (window.confirm(t('campaigns.confirmDelete'))) {
            setIsLoading(true);

            // Appel à l'API pour supprimer
            router.delete(route('campaigns.destroy', campaign.id), {
                onSuccess: () => {
                    setSuccess(t('campaigns.deletedSuccessfully', { name: campaign.name }));
                    setIsLoading(false);
                    setShowEventDetails(null);

                    // Fermer la notification de succès après 3 secondes
                    setTimeout(() => {
                        setSuccess(null);
                    }, 3000);
                },
                onError: () => {
                    setError(t('campaigns.errorDeleting'));
                    setIsLoading(false);

                    // Fermer la notification d'erreur après 3 secondes
                    setTimeout(() => {
                        setError(null);
                    }, 3000);
                }
            });
        }
    };

    // Fonctions pour drag and drop
    const handleEventDrop = (event: any) => {
        setIsLoading(true);

        const { campaign, start } = event;

        // Simulation d'un appel API pour mettre à jour la date planifiée
        setTimeout(() => {
            setSuccess(t('campaigns.rescheduledSuccessfully', {
                name: campaign.name,
                date: moment(start).format('DD/MM/YYYY HH:mm')
            }));
            setIsLoading(false);

            // Fermer la notification de succès après 3 secondes
            setTimeout(() => {
                setSuccess(null);
            }, 3000);
        }, 1000);
    };

    // Custom event component for the calendar
    const EventComponent = ({ event, ...rest }: any) => {
        const campaign = event.campaign;
        const handleClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            setSelectedEvent(event);
            setShowEventDetails(campaign.id);
            setEventDetailsPosition({
                top: e.clientY,
                left: e.clientX
            });
        };

        // Configuration drag-and-drop pour les événements déplaçables
        const isDraggable = campaign.status === 'draft' || campaign.status === 'scheduled' || campaign.status === 'paused';

        return (
            <div
                onClick={handleClick}
                style={{
                    backgroundColor: getStatusColor(campaign.status),
                    borderRadius: '4px',
                    color: 'white',
                    padding: '2px 4px',
                    fontSize: '12px',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    cursor: 'pointer',
                    border: '1px solid rgba(0,0,0,0.1)',
                    opacity: isDraggable ? 1 : 0.8,
                    position: 'relative'
                }}
                title={isDraggable ? t('campaigns.dragToReschedule') : ''}
                {...rest}
            >
                {/* Indicateur visuel pour les campagnes qui peuvent être déplacées */}
                {isDraggable && (
                    <div className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-white border border-gray-300"></div>
                )}

                <div className="flex items-center">
                    {getStatusIcon(campaign.status)}
                    <span className="ml-1 font-medium">{campaign.name}</span>
                </div>
                {calendarView !== Views.MONTH && (
                    <div style={{ fontSize: '10px' }}>
                        {campaign.recipients_count} {t('campaigns.recipients')}
                    </div>
                )}
            </div>
        );
    };

    // Handle event selection
    const handleSelectEvent = (event: any) => {
        setSelectedEvent(event);
        setShowEventDetails(event.campaign.id);
    };

    // Handle selecting a date or slot
    const handleSelectSlot = (slotInfo: SlotInfo) => {
        // Pré-remplir la date dans le formulaire de création
        setNewCampaignData({
            ...newCampaignData,
            scheduled_at: moment(slotInfo.start).format('YYYY-MM-DDTHH:mm')
        });
        setShowCreateModal(true);
    };

    // Fonction pour créer une nouvelle campagne
    const handleCreateCampaign = () => {
        setIsLoading(true);

        const formData = {
            name: newCampaignData.name,
            subject: newCampaignData.subject,
            scheduled_at: newCampaignData.scheduled_at,
            template_id: newCampaignData.template_id,
            tags: newCampaignData.tags
        };

        // Simulation d'un appel API
        setTimeout(() => {
            // Simuler une réussite
            setSuccess(t('campaigns.createdSuccessfully', { name: formData.name }));
            setIsLoading(false);
            setShowCreateModal(false);

            // Réinitialiser le formulaire
            setNewCampaignData({
                name: '',
                subject: '',
                scheduled_at: moment().add(1, 'day').format('YYYY-MM-DDTHH:mm'),
                template_id: '',
                tags: []
            });

            // Fermer la notification de succès après 3 secondes
            setTimeout(() => {
                setSuccess(null);
            }, 3000);
        }, 1500);
    };

    // Fonction pour exporter des données
    const handleExport = (format: 'csv' | 'json' | 'xlsx') => {
        setIsLoading(true);

        // Simulation d'un téléchargement
        setTimeout(() => {
            setSuccess(t('campaigns.exportedSuccessfully', { format: format.toUpperCase() }));
            setIsLoading(false);
            setShowExportModal(false);

            // Fermer la notification de succès après 3 secondes
            setTimeout(() => {
                setSuccess(null);
            }, 3000);
        }, 1500);
    };

    // Fonction pour importer des données
    const handleImport = (file: File | null) => {
        if (!file) {
            setError(t('campaigns.noFileSelected'));
            return;
        }

        setIsLoading(true);

        // Simuler traitement du fichier
        setTimeout(() => {
            setSuccess(t('campaigns.importedSuccessfully', { count: 5 }));
            setIsLoading(false);
            setShowImportModal(false);

            // Fermer la notification de succès après 3 secondes
            setTimeout(() => {
                setSuccess(null);
            }, 3000);
        }, 2000);
    };

    // Composant pour l'en-tête du calendrier (style Google Calendar)
    const CustomHeader = () => {
        return (
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <Menu className="h-5 w-5 text-gray-500 dark:text-gray-300" />
                    </button>

                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                        {t('common.campaigns')}
                    </h2>

                    <div className="flex space-x-1">
                        <button
                            onClick={() => navigateCalendar('TODAY')}
                            className="px-4 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            {t('campaigns.today')}
                        </button>

                        <button
                            onClick={() => navigateCalendar('PREV')}
                            className="p-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                        </button>

                        <button
                            onClick={() => navigateCalendar('NEXT')}
                            className="p-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                        </button>

                        <div className="ml-3 text-lg font-medium text-gray-700 dark:text-gray-300">
                            {currentMonth}
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder={t('common.search')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 w-64 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                    </div>

                    <div className="flex space-x-1">
                        <button
                            onClick={() => setCalendarView(Views.MONTH)}
                            className={`px-4 py-2 rounded-md text-sm ${calendarView === Views.MONTH
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        >
                            {t('campaigns.month')}
                        </button>

                        <button
                            onClick={() => setCalendarView(Views.WEEK)}
                            className={`px-4 py-2 rounded-md text-sm ${calendarView === Views.WEEK
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        >
                            {t('campaigns.week')}
                        </button>

                        <button
                            onClick={() => setCalendarView(Views.DAY)}
                            className={`px-4 py-2 rounded-md text-sm ${calendarView === Views.DAY
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        >
                            {t('campaigns.day')}
                        </button>
                    </div>

                    {/* Mode sombre / clair */}
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                        title={isDarkMode ? t('common.lightMode') : t('common.darkMode')}
                    >
                        {isDarkMode ? (
                            <Sun className="h-5 w-5 text-gray-500 dark:text-gray-300" />
                        ) : (
                            <Moon className="h-5 w-5 text-gray-500 dark:text-gray-300" />
                        )}
                    </button>

                    {/* Bouton Analytics */}
                    <button
                        onClick={() => setShowAnalyticsModal(true)}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                        title={t('campaigns.analytics')}
                    >
                        <BarChart2 className="h-5 w-5 text-gray-500 dark:text-gray-300" />
                    </button>

                    {/* Bouton Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <Bell className="h-5 w-5 text-gray-500 dark:text-gray-300" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Dropdown des notifications */}
                        {showNotifications && (
                            <div
                                ref={notificationsRef}
                                className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10"
                            >
                                <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
                                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('campaigns.notifications')}</h3>
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                    >
                                        {t('campaigns.markAllAsRead')}
                                    </button>
                                </div>

                                <div className="max-h-80 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                            {t('campaigns.noNotifications')}
                                        </div>
                                    ) : (
                                        notifications.map(notification => (
                                            <div
                                                key={notification.id}
                                                className={`p-3 border-b border-gray-200 dark:border-gray-700 ${!notification.read ? 'bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20' : ''}`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start">
                                                        {notification.type === 'success' && <Check className="h-4 w-4 text-green-500 mt-0.5 mr-2" />}
                                                        {notification.type === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 mr-2" />}
                                                        {notification.type === 'info' && <Bell className="h-4 w-4 text-blue-500 mt-0.5 mr-2" />}
                                                        {notification.type === 'error' && <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2" />}
                                                        <div>
                                                            <p className="text-sm text-gray-800 dark:text-gray-200">{notification.message}</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{notification.time}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => removeNotification(notification.id)}
                                                        className="text-gray-400 hover:text-gray-500"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                                {!notification.read && (
                                                    <button
                                                        onClick={() => markAsRead(notification.id)}
                                                        className="mt-2 text-xs text-blue-600 dark:text-blue-400"
                                                    >
                                                        {t('campaigns.markAsRead')}
                                                    </button>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bouton Paramètres */}
                    <button
                        onClick={() => setShowSettingsModal(true)}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <Settings className="h-5 w-5 text-gray-500 dark:text-gray-300" />
                    </button>

                    {/* Bouton Aide */}
                    <button
                        onClick={() => setShowHelpModal(true)}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <HelpCircle className="h-5 w-5 text-gray-500 dark:text-gray-300" />
                    </button>
                </div>
            </div>
        );
    };

    // Mini Calendar Component pour la barre latérale
    const MiniCalendar = () => {
        const [currentDate, setCurrentDate] = useState(new Date());
        const weekdays = moment.weekdaysMin();
        const firstDay = moment(currentDate).startOf('month').startOf('week');
        const days = [];

        for (let i = 0; i < 42; i++) {
            const day = moment(firstDay).add(i, 'days');
            days.push(day);
        }

        const isCurrentMonth = (day: moment.Moment) => day.month() === moment(currentDate).month();
        const isToday = (day: moment.Moment) => day.isSame(moment(), 'day');
        const isSelected = (day: moment.Moment) => day.isSame(moment(selectedDate), 'day');

        const hasEvents = (day: moment.Moment) => {
            return calendarEvents.some(event =>
                moment(event.start).isSame(day, 'day')
            );
        };

        const prevMonth = () => {
            setCurrentDate(moment(currentDate).subtract(1, 'month').toDate());
        };

        const nextMonth = () => {
            setCurrentDate(moment(currentDate).add(1, 'month').toDate());
        };

        const selectDay = (day: moment.Moment) => {
            setSelectedDate(day.toDate());
            if (calendarView !== Views.DAY) {
                setCalendarView(Views.DAY);
            }
        };

        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 mb-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-gray-700 dark:text-gray-300">
                        {moment(currentDate).format('MMMM YYYY')}
                    </div>
                    <div className="flex">
                        <button
                            onClick={prevMonth}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                            <ChevronLeft className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        </button>
                        <button
                            onClick={nextMonth}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                            <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-1">
                    {weekdays.map((day, i) => (
                        <div key={i} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                    {days.map((day, i) => (
                        <button
                            key={i}
                            onClick={() => selectDay(day)}
                            className={`flex items-center justify-center h-8 w-8 rounded-full text-xs ${isToday(day)
                                ? 'bg-blue-500 text-white'
                                : isSelected(day)
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                    : isCurrentMonth(day)
                                        ? 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        : 'text-gray-400 dark:text-gray-600'
                                }`}
                        >
                            <div className="relative">
                                {day.format('D')}
                                {hasEvents(day) && (
                                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full"></div>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    // Popover pour les détails d'une campagne
    const EventDetailsPopover = () => {
        if (!selectedEvent || !showEventDetails) return null;

        const campaign = selectedEvent.campaign;

        return (
            <div
                ref={popoverRef}
                className="absolute z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
                style={{
                    top: eventDetailsPosition.top,
                    left: eventDetailsPosition.left,
                    maxWidth: '350px'
                }}
            >
                <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {campaign.name}
                        </h3>
                        <button
                            onClick={() => setShowEventDetails(null)}
                            className="text-gray-400 hover:text-gray-500"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="mb-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(campaign.status)}`}>
                            {getStatusIcon(campaign.status)}
                            <span className="ml-1">{getStatusName(campaign.status)}</span>
                        </span>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                        {campaign.scheduled_at && (
                            <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2 text-gray-400" />
                                {formatDate(campaign.scheduled_at)}
                            </div>
                        )}

                        <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2 text-gray-400" />
                            {campaign.recipients_count} {t('campaigns.recipients')}
                        </div>

                        {/* Tags (simulés) */}
                        <div className="flex flex-wrap gap-1 pt-1">
                            {(campaign.tags || ['newsletter']).map((tag: string, index: number) => (
                                <span
                                    key={index}
                                    className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full text-xs"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>

                        {campaign.status === 'sent' && (
                            <div className="mt-2">
                                <div className="mb-1 flex items-center justify-between">
                                    <span className="text-xs text-gray-600 dark:text-gray-300">Progrès</span>
                                    <span className="text-xs font-medium">{Math.round((campaign.delivered_count / campaign.recipients_count) * 100)}%</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                                    <div
                                        className="h-2 rounded-full bg-green-500"
                                        style={{ width: `${(campaign.delivered_count / campaign.recipients_count) * 100}%` }}
                                    ></div>
                                </div>
                                <div className="mt-1 text-xs">
                                    {campaign.delivered_count} {t('campaigns.delivered')}, {campaign.failed_count} {t('campaigns.failed')}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                        <Link
                            href={route('campaigns.show', campaign.id)}
                            className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                        >
                            <Eye className="h-4 w-4 mr-2" />
                            {t('common.details')}
                        </Link>

                        {campaign.status !== 'sent' && (
                            <Link
                                href={route('campaigns.edit', campaign.id)}
                                className="inline-flex items-center justify-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                            >
                                <Settings className="h-4 w-4 mr-2" />
                                {t('common.edit')}
                            </Link>
                        )}

                        <button
                            onClick={() => {
                                handleCopyCampaign(campaign);
                                setShowEventDetails(null);
                            }}
                            className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                        >
                            <Copy className="h-4 w-4 mr-2" />
                            {t('common.copy')}
                        </button>

                        {campaign.status !== 'sent' && (
                            <button
                                onClick={() => {
                                    handleDeleteCampaign(campaign);
                                }}
                                className="inline-flex items-center justify-center px-3 py-2 border border-red-300 dark:border-red-700 rounded-md shadow-sm text-sm font-medium text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900 dark:hover:bg-opacity-20"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t('common.delete')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Modal de création de campagne
    const CreateCampaignModal = () => {
        if (!showCreateModal) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {t('campaigns.create')}
                        </h3>
                        <button
                            onClick={() => setShowCreateModal(false)}
                            className="text-gray-400 hover:text-gray-500"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="p-6">
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('campaigns.name')}
                            </label>
                            <input
                                type="text"
                                value={newCampaignData.name}
                                onChange={(e) => setNewCampaignData({ ...newCampaignData, name: e.target.value })}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder={t('campaigns.namePlaceholder')}
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('campaigns.subject')}
                            </label>
                            <input
                                type="text"
                                value={newCampaignData.subject}
                                onChange={(e) => setNewCampaignData({ ...newCampaignData, subject: e.target.value })}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder={t('campaigns.subjectPlaceholder')}
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('campaigns.scheduledAt')}
                            </label>
                            <input
                                type="datetime-local"
                                value={newCampaignData.scheduled_at}
                                onChange={(e) => setNewCampaignData({ ...newCampaignData, scheduled_at: e.target.value })}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('campaigns.template')}
                            </label>
                            <div className="flex">
                                <select
                                    value={newCampaignData.template_id}
                                    onChange={(e) => setNewCampaignData({ ...newCampaignData, template_id: e.target.value })}
                                    className="w-full rounded-l-md border-r-0 border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="">{t('campaigns.selectTemplate')}</option>
                                    {templates.map(template => (
                                        <option key={template.id} value={template.id.toString()}>{template.name}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => setShowTemplateModal(true)}
                                    className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                                >
                                    <FileText className="h-4 w-4" />
                                </button>
                            </div>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {t('campaigns.templateHelp')}
                            </p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('campaigns.tags')}
                            </label>
                            <div className="flex flex-wrap gap-2 p-2 border border-gray-300 dark:border-gray-600 rounded-md min-h-[40px]">
                                {newCampaignData.tags.map((tag, index) => (
                                    <div key={index} className="flex items-center bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full px-2 py-1 text-xs">
                                        <span>{tag}</span>
                                        <button
                                            onClick={() => setNewCampaignData({
                                                ...newCampaignData,
                                                tags: newCampaignData.tags.filter((_, i) => i !== index)
                                            })}
                                            className="ml-1 text-blue-500 hover:text-blue-700"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                                <div className="relative">
                                    <select
                                        className="text-sm border-0 bg-transparent focus:ring-0 text-gray-600 dark:text-gray-300"
                                        onChange={(e) => {
                                            if (e.target.value && !newCampaignData.tags.includes(e.target.value)) {
                                                setNewCampaignData({
                                                    ...newCampaignData,
                                                    tags: [...newCampaignData.tags, e.target.value]
                                                });
                                            }
                                            e.target.value = '';
                                        }}
                                    >
                                        <option value="">{t('campaigns.addTag')}</option>
                                        {availableTags
                                            .filter(tag => !newCampaignData.tags.includes(tag))
                                            .map((tag, index) => (
                                                <option key={index} value={tag}>{tag}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-2 mt-6">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                {t('common.cancel')}
                            </button>

                            <button
                                onClick={handleCreateCampaign}
                                disabled={isLoading || !newCampaignData.name || !newCampaignData.subject}
                                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 ${(isLoading || !newCampaignData.name || !newCampaignData.subject) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isLoading ? (
                                    <Loader className="h-5 w-5 animate-spin" />
                                ) : t('campaigns.create')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Modal Templates
    const TemplatesModal = () => {
        if (!showTemplateModal) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full">
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {t('campaigns.templates')}
                        </h3>
                        <button
                            onClick={() => setShowTemplateModal(false)}
                            className="text-gray-400 hover:text-gray-500"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {templates.map(template => (
                                <div
                                    key={template.id}
                                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 cursor-pointer hover:border-blue-500 dark:hover:border-blue-500"
                                    onClick={() => {
                                        setNewCampaignData({ ...newCampaignData, template_id: template.id.toString() });
                                        setShowTemplateModal(false);
                                    }}
                                >
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">{template.name}</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{template.description}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setShowTemplateModal(false)}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                {t('common.cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Modal Analytiques
    const AnalyticsModal = () => {
        if (!showAnalyticsModal) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full">
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                            <PieChart className="h-5 w-5 mr-2 text-blue-500" />
                            {t('campaigns.analytics')}
                        </h3>
                        <button
                            onClick={() => setShowAnalyticsModal(false)}
                            className="text-gray-400 hover:text-gray-500"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 p-4 rounded-lg">
                                <div className="text-blue-500 font-medium text-lg">{stats.deliveryRate}%</div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">{t('campaigns.deliveryRate')}</div>
                            </div>

                            <div className="bg-green-50 dark:bg-green-900 dark:bg-opacity-20 p-4 rounded-lg">
                                <div className="text-green-500 font-medium text-lg">{stats.openRate}%</div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">{t('campaigns.openRate')}</div>
                            </div>

                            <div className="bg-purple-50 dark:bg-purple-900 dark:bg-opacity-20 p-4 rounded-lg">
                                <div className="text-purple-500 font-medium text-lg">{stats.clickRate}%</div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">{t('campaigns.clickRate')}</div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <div className="text-gray-700 dark:text-gray-200 font-medium text-lg">{stats.totalSent.toLocaleString()}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">{t('campaigns.totalSent')}</div>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-4">{t('campaigns.recentCampaigns')}</h4>

                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead>
                                    <tr>
                                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            {t('common.name')}
                                        </th>
                                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            {t('common.date')}
                                        </th>
                                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            {t('campaigns.recipients')}
                                        </th>
                                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            {t('campaigns.opens')}
                                        </th>
                                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            {t('campaigns.clicks')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {campaigns.data
                                        .filter(campaign => campaign.status === 'sent')
                                        .slice(0, 5)
                                        .map(campaign => (
                                            <tr key={campaign.id}>
                                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                                                    <Link
                                                        href={route('campaigns.show', campaign.id)}
                                                        className="hover:text-blue-600 dark:hover:text-blue-400"
                                                    >
                                                        {campaign.name}
                                                    </Link>
                                                </td>
                                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {formatDate(campaign.scheduled_at || campaign.created_at)}
                                                </td>
                                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {campaign.recipients_count}
                                                </td>
                                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {Math.floor(campaign.recipients_count * (Math.random() * 0.3 + 0.2))}
                                                    <span className="text-xs ml-1 text-gray-400">
                                                        ({Math.floor(Math.random() * 30 + 20)}%)
                                                    </span>
                                                </td>
                                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {Math.floor(campaign.recipients_count * (Math.random() * 0.1 + 0.05))}
                                                    <span className="text-xs ml-1 text-gray-400">
                                                        ({Math.floor(Math.random() * 15 + 5)}%)
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>

                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={() => setShowAnalyticsModal(false)}
                                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    {t('common.close')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Modal de paramètres
    const SettingsModal = () => {
        if (!showSettingsModal) return null;

        const [activeTab, setActiveTab] = useState('general');

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full">
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {t('common.settings')}
                        </h3>
                        <button
                            onClick={() => setShowSettingsModal(false)}
                            className="text-gray-400 hover:text-gray-500"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="flex flex-col md:flex-row">
                        <div className="w-full md:w-48 border-r border-gray-200 dark:border-gray-700">
                            <nav className="p-4 space-y-1">
                                <button
                                    onClick={() => setActiveTab('general')}
                                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'general' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                >
                                    {t('settings.general')}
                                </button>
                                <button
                                    onClick={() => setActiveTab('display')}
                                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'display' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                >
                                    {t('settings.display')}
                                </button>
                                <button
                                    onClick={() => setActiveTab('notifications')}
                                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'notifications' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                >
                                    {t('settings.notifications')}
                                </button>
                                <button
                                    onClick={() => setActiveTab('import')}
                                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'import' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                >
                                    {t('settings.importExport')}
                                </button>
                            </nav>
                        </div>

                        <div className="p-6 flex-1">
                            {activeTab === 'general' && (
                                <div className="space-y-4">
                                    <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">{t('settings.general')}</h4>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {t('settings.language')}
                                        </label>
                                        <select className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                            <option value="en">English</option>
                                            <option value="fr">Français</option>
                                            <option value="es">Español</option>
                                            <option value="de">Deutsch</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {t('settings.timezone')}
                                        </label>
                                        <select className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                            <option value="UTC">UTC</option>
                                            <option value="America/New_York">Eastern Time (ET)</option>
                                            <option value="Europe/Paris">Central European Time (CET)</option>
                                            <option value="Asia/Tokyo">Japan Standard Time (JST)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {t('settings.defaultView')}
                                        </label>
                                        <select className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                            <option value="calendar">{t('campaigns.calendarView')}</option>
                                            <option value="list">{t('campaigns.listView')}</option>
                                            <option value="dashboard">{t('campaigns.dashboard')}</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'display' && (
                                <div className="space-y-4">
                                    <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">{t('settings.display')}</h4>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('settings.darkMode')}
                                        </span>
                                        <button
                                            onClick={() => setIsDarkMode(!isDarkMode)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full ${isDarkMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`}
                                            />
                                        </button>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {t('settings.calendarFirstDay')}
                                        </label>
                                        <select className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                            <option value="0">{t('common.sunday')}</option>
                                            <option value="1">{t('common.monday')}</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {t('settings.theme')}
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            <button className="h-10 rounded-md bg-blue-500 border-2 border-transparent hover:border-blue-700"></button>
                                            <button className="h-10 rounded-md bg-green-500 border-2 border-transparent hover:border-green-700"></button>
                                            <button className="h-10 rounded-md bg-purple-500 border-2 border-transparent hover:border-purple-700"></button>
                                            <button className="h-10 rounded-md bg-red-500 border-2 border-transparent hover:border-red-700"></button>
                                            <button className="h-10 rounded-md bg-yellow-500 border-2 border-transparent hover:border-yellow-700"></button>
                                            <button className="h-10 rounded-md bg-gray-500 border-2 border-transparent hover:border-gray-700"></button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'notifications' && (
                                <div className="space-y-4">
                                    <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">{t('settings.notifications')}</h4>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {t('settings.emailNotifications')}
                                            </span>
                                            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                                                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6" />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {t('settings.browserNotifications')}
                                            </span>
                                            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-gray-700">
                                                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-1" />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {t('settings.campaignStatusAlerts')}
                                            </span>
                                            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                                                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6" />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {t('settings.reminderBeforeSend')}
                                            </span>
                                            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                                                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6" />
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {t('settings.reminderTime')}
                                        </label>
                                        <select className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                            <option value="30">{t('settings.30MinutesBefore')}</option>
                                            <option value="60">{t('settings.1HourBefore')}</option>
                                            <option value="720">{t('settings.12HoursBefore')}</option>
                                            <option value="1440">{t('settings.24HoursBefore')}</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'import' && (
                                <div className="space-y-4">
                                    <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">{t('settings.importExport')}</h4>

                                    <div className="space-y-6">
                                        <div>
                                            <h5 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">{t('settings.importCampaigns')}</h5>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                                {t('settings.importCampaignsDescription')}
                                            </p>
                                            <button
                                                onClick={() => setShowImportModal(true)}
                                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                                            >
                                                <Upload className="h-4 w-4 mr-2" />
                                                {t('settings.import')}
                                            </button>
                                        </div>

                                        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                            <h5 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">{t('settings.exportCampaigns')}</h5>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                                {t('settings.exportCampaignsDescription')}
                                            </p>
                                            <button
                                                onClick={() => setShowExportModal(true)}
                                                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                                            >
                                                <Download className="h-4 w-4 mr-2" />
                                                {t('settings.export')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={() => setShowSettingsModal(false)}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 mr-2"
                                >
                                    {t('common.cancel')}
                                </button>

                                <button
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                                >
                                    {t('common.save')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Modal d'importation
    const ImportModal = () => {
        if (!showImportModal) return null;

        const [selectedFile, setSelectedFile] = useState<File | null>(null);

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {t('settings.importCampaigns')}
                        </h3>
                        <button
                            onClick={() => setShowImportModal(false)}
                            className="text-gray-400 hover:text-gray-500"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="p-6">
                        <div className="mb-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                {t('settings.importInstructions')}
                            </p>

                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md px-6 pt-5 pb-6">
                                <div className="space-y-1 text-center">
                                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                                        <label
                                            htmlFor="file-upload"
                                            className="relative cursor-pointer rounded-md bg-white dark:bg-gray-800 font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 focus-within:outline-none"
                                        >
                                            <span>{t('settings.selectFile')}</span>
                                            <input
                                                id="file-upload"
                                                name="file-upload"
                                                type="file"
                                                className="sr-only"
                                                accept=".csv,.xlsx,.json"
                                                onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                                            />
                                        </label>
                                        <p className="pl-1">{t('settings.dragAndDrop')}</p>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        CSV, XLSX, or JSON
                                    </p>
                                </div>

                                {selectedFile && (
                                    <div className="mt-4 p-2 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded text-sm flex items-center">
                                        <FileText className="h-4 w-4 text-blue-500 mr-2" />
                                        <span className="text-gray-800 dark:text-gray-200">{selectedFile.name}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end space-x-2 mt-6">
                            <button
                                onClick={() => setShowImportModal(false)}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                {t('common.cancel')}
                            </button>

                            <button
                                onClick={() => handleImport(selectedFile)}
                                disabled={isLoading || !selectedFile}
                                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 ${(isLoading || !selectedFile) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isLoading ? (
                                    <Loader className="h-5 w-5 animate-spin" />
                                ) : t('settings.import')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Modal d'exportation
    const ExportModal = () => {
        if (!showExportModal) return null;

        const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'xlsx'>('csv');
        const [exportOption, setExportOption] = useState<'all' | 'filtered' | 'selected'>('all');

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {t('settings.exportCampaigns')}
                        </h3>
                        <button
                            onClick={() => setShowExportModal(false)}
                            className="text-gray-400 hover:text-gray-500"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="p-6">
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('settings.exportFormat')}
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => setExportFormat('csv')}
                                    className={`px-4 py-2 text-sm font-medium rounded-md border ${exportFormat === 'csv'
                                        ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700'
                                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                >
                                    CSV
                                </button>
                                <button
                                    onClick={() => setExportFormat('json')}
                                    className={`px-4 py-2 text-sm font-medium rounded-md border ${exportFormat === 'json'
                                        ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700'
                                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                >
                                    JSON
                                </button>
                                <button
                                    onClick={() => setExportFormat('xlsx')}
                                    className={`px-4 py-2 text-sm font-medium rounded-md border ${exportFormat === 'xlsx'
                                        ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700'
                                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                >
                                    XLSX
                                </button>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('settings.whatToExport')}
                            </label>
                            <div className="space-y-2">
                                <div className="flex items-center">
                                    <input
                                        id="export-all"
                                        name="export-option"
                                        type="radio"
                                        checked={exportOption === 'all'}
                                        onChange={() => setExportOption('all')}
                                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    <label htmlFor="export-all" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {t('settings.allCampaigns')} ({campaigns.data.length})
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        id="export-filtered"
                                        name="export-option"
                                        type="radio"
                                        checked={exportOption === 'filtered'}
                                        onChange={() => setExportOption('filtered')}
                                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    <label htmlFor="export-filtered" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {t('settings.filteredCampaigns')} ({filteredCampaigns.length})
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        id="export-selected"
                                        name="export-option"
                                        type="radio"
                                        checked={exportOption === 'selected'}
                                        onChange={() => setExportOption('selected')}
                                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    <label htmlFor="export-selected" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {t('settings.selectedCampaigns')}
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('settings.includeFields')}
                            </label>
                            <div className="mt-1 space-y-2">
                                <div className="flex items-center">
                                    <input
                                        id="field-basic"
                                        name="field-basic"
                                        type="checkbox"
                                        defaultChecked
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor="field-basic" className="ml-3 block text-sm text-gray-700 dark:text-gray-300">
                                        {t('settings.basicInfo')}
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        id="field-recipients"
                                        name="field-recipients"
                                        type="checkbox"
                                        defaultChecked
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor="field-recipients" className="ml-3 block text-sm text-gray-700 dark:text-gray-300">
                                        {t('settings.recipientsInfo')}
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        id="field-stats"
                                        name="field-stats"
                                        type="checkbox"
                                        defaultChecked
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor="field-stats" className="ml-3 block text-sm text-gray-700 dark:text-gray-300">
                                        {t('settings.statisticsData')}
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        id="field-content"
                                        name="field-content"
                                        type="checkbox"
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor="field-content" className="ml-3 block text-sm text-gray-700 dark:text-gray-300">
                                        {t('settings.contentData')}
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-2 mt-6">
                            <button
                                onClick={() => setShowExportModal(false)}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                {t('common.cancel')}
                            </button>

                            <button
                                onClick={() => handleExport(exportFormat)}
                                disabled={isLoading}
                                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isLoading ? (
                                    <Loader className="h-5 w-5 animate-spin" />
                                ) : (
                                    <span className="flex items-center">
                                        <Download className="h-4 w-4 mr-2" />
                                        {t('settings.export')}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Modal d'aide et documentation
    const HelpModal = () => {
        if (!showHelpModal) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                            <HelpCircle className="h-5 w-5 mr-2 text-blue-500" />
                            {t('help.title')}
                        </h3>
                        <button
                            onClick={() => setShowHelpModal(false)}
                            className="text-gray-400 hover:text-gray-500"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                                    {t('help.gettingStarted')}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    {t('help.gettingStartedDesc')}
                                </p>

                                <div className="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 p-4 rounded-md">
                                    <h5 className="text-md font-medium text-blue-800 dark:text-blue-300 mb-2">
                                        {t('help.quickTips')}
                                    </h5>
                                    <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                        <li>{t('help.tip1')}</li>
                                        <li>{t('help.tip2')}</li>
                                        <li>{t('help.tip3')}</li>
                                        <li>{t('help.tip4')}</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                                    {t('help.calendarView')}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    {t('help.calendarViewDesc')}
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="border border-gray-200 dark:border-gray-700 rounded-md p-4">
                                        <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center">
                                            <Zap className="h-4 w-4 text-yellow-500 mr-2" />
                                            {t('help.dragAndDrop')}
                                        </h5>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {t('help.dragAndDropDesc')}
                                        </p>
                                    </div>

                                    <div className="border border-gray-200 dark:border-gray-700 rounded-md p-4">
                                        <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center">
                                            <Clock className="h-4 w-4 text-blue-500 mr-2" />
                                            {t('help.scheduling')}
                                        </h5>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {t('help.schedulingDesc')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                                    {t('help.campaignStatus')}
                                </h4>

                                <div className="space-y-3">
                                    <div className="flex items-start">
                                        <div className="h-5 w-5 rounded-full bg-gray-400 flex-shrink-0 mt-0.5"></div>
                                        <div className="ml-3">
                                            <h5 className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('campaigns.status.draft')}</h5>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">{t('help.draftDesc')}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <div className="h-5 w-5 rounded-full bg-blue-500 flex-shrink-0 mt-0.5"></div>
                                        <div className="ml-3">
                                            <h5 className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('campaigns.status.scheduled')}</h5>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">{t('help.scheduledDesc')}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <div className="h-5 w-5 rounded-full bg-purple-500 flex-shrink-0 mt-0.5"></div>
                                        <div className="ml-3">
                                            <h5 className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('campaigns.status.sending')}</h5>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">{t('help.sendingDesc')}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <div className="h-5 w-5 rounded-full bg-green-500 flex-shrink-0 mt-0.5"></div>
                                        <div className="ml-3">
                                            <h5 className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('campaigns.status.sent')}</h5>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">{t('help.sentDesc')}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <div className="h-5 w-5 rounded-full bg-yellow-500 flex-shrink-0 mt-0.5"></div>
                                        <div className="ml-3">
                                            <h5 className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('campaigns.status.paused')}</h5>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">{t('help.pausedDesc')}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <div className="h-5 w-5 rounded-full bg-red-500 flex-shrink-0 mt-0.5"></div>
                                        <div className="ml-3">
                                            <h5 className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('campaigns.status.failed')}</h5>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">{t('help.failedDesc')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                                    {t('help.keyboardShortcuts')}
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {t('help.createCampaign')}
                                        </span>
                                        <span className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono">
                                            N
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {t('help.todayView')}
                                        </span>
                                        <span className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono">
                                            T
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {t('help.dayView')}
                                        </span>
                                        <span className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono">
                                            1
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {t('help.weekView')}
                                        </span>
                                        <span className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono">
                                            2
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {t('help.monthView')}
                                        </span>
                                        <span className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono">
                                            3
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {t('help.search')}
                                        </span>
                                        <span className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono">
                                            Ctrl + K
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700">
                        <a
                            href="#"
                            className="text-blue-600 dark:text-blue-400 text-sm flex items-center hover:text-blue-800 dark:hover:text-blue-300"
                        >
                            <FileText className="h-4 w-4 mr-1" />
                            {t('help.fullDocumentation')}
                        </a>

                        <button
                            onClick={() => setShowHelpModal(false)}
                            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            {t('common.close')}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Feedback/Notification system
    const Notifications = () => {
        if (!error && !success) return null;

        return (
            <div className="fixed bottom-4 right-4 z-50 max-w-sm">
                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md mb-2 flex justify-between items-start">
                        <div className="flex">
                            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                            <div>{error}</div>
                        </div>
                        <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                )}

                {success && (
                    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md flex justify-between items-start">
                        <div className="flex">
                            <Check className="h-5 w-5 mr-2 flex-shrink-0" />
                            <div>{success}</div>
                        </div>
                        <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                )}
            </div>
        );
    };

    // Overlay de chargement global
    const LoadingOverlay = () => {
        if (!isLoading) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-20 z-50 flex items-center justify-center">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4">
                    <Loader className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            </div>
        );
    };

    // Définir les styles pour react-big-calendar
    const calendarStyles = {
        height: 'calc(100vh - 150px)',
        // Ajout de styles personnalisés pour ressembler à Google Calendar
        '.rbc-header': {
            padding: '10px 0',
            fontWeight: 'normal',
            fontSize: '0.875rem'
        },
        '.rbc-month-view': {
            border: 'none',
        },
        '.rbc-day-bg': {
            transition: 'background-color 0.3s',
        },
        '.rbc-today': {
            backgroundColor: 'rgba(66, 133, 244, 0.05)',
        },
        '.rbc-event': {
            borderRadius: '4px',
            border: 'none',
            padding: '2px 5px',
            fontSize: '12px',
        },
        '.rbc-event-label': {
            display: 'none'
        },
        '.rbc-show-more': {
            color: '#1976d2',
            backgroundColor: 'transparent',
            fontSize: '12px',
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={null} // Supprimez l'en-tête par défaut
        >
            <Head title={t('common.campaigns')} />

            <div className={`h-screen flex flex-col ${isDarkMode ? 'dark' : ''}`}>
                {/* Header de Google Calendar style */}
                <CustomHeader />

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    {sidebarOpen && (
                        <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 overflow-y-auto">
                            {/* Bouton de création de campagne */}
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="flex items-center justify-center w-full mb-6 px-4 py-2.5 rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                            >
                                <Plus className="h-5 w-5 mr-2" />
                                <span>{t('campaigns.create')}</span>
                            </button>

                            {/* Mini Calendar */}
                            <MiniCalendar />

                            {/* Filtres et listes de campagnes */}
                            <div className="space-y-1 mb-4">
                                <button
                                    onClick={() => setStatusFilter('all')}
                                    className={`flex items-center w-full px-3 py-2 text-sm rounded-lg ${statusFilter === 'all'
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                >
                                    <Grid className="h-4 w-4 mr-3 text-gray-500" />
                                    <span>{t('campaigns.status.all')}</span>
                                    <span className="ml-auto bg-gray-200 dark:bg-gray-700 rounded-full px-2 py-0.5 text-xs">
                                        {campaigns.data.length}
                                    </span>
                                </button>

                                <div className="px-3 pt-4 pb-1">
                                    <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        {t('campaigns.today')}
                                    </h3>
                                </div>

                                {todayCampaigns.length > 0 ? (
                                    <div className="pl-6 space-y-1">
                                        {todayCampaigns.map(campaign => (
                                            <Link
                                                key={campaign.id}
                                                href={route('campaigns.show', campaign.id)}
                                                className="flex items-center px-3 py-1.5 text-sm rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                            >
                                                <div
                                                    className="h-3 w-3 rounded-full mr-3"
                                                    style={{ backgroundColor: getStatusColor(campaign.status) }}
                                                ></div>
                                                <span className="truncate">{campaign.name}</span>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="pl-6 py-2 text-sm text-gray-500 dark:text-gray-400">
                                        {t('campaigns.noCampaignsToday')}
                                    </div>
                                )}

                                <div className="px-3 pt-4 pb-1">
                                    <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        {t('campaigns.upcoming')}
                                    </h3>
                                </div>

                                {upcomingCampaigns.length > 0 ? (
                                    <div className="pl-6 space-y-1">
                                        {upcomingCampaigns.map(campaign => (
                                            <Link
                                                key={campaign.id}
                                                href={route('campaigns.show', campaign.id)}
                                                className="flex items-center px-3 py-1.5 text-sm rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                            >
                                                <div
                                                    className="h-3 w-3 rounded-full mr-3"
                                                    style={{ backgroundColor: getStatusColor(campaign.status) }}
                                                ></div>
                                                <span className="truncate">{campaign.name}</span>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="pl-6 py-2 text-sm text-gray-500 dark:text-gray-400">
                                        {t('campaigns.noUpcomingCampaigns')}
                                    </div>
                                )}

                                <div className="px-3 pt-4 pb-1">
                                    <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        {t('common.status')}
                                    </h3>
                                </div>

                                {Object.entries({
                                    'draft': t('campaigns.status.draft'),
                                    'scheduled': t('campaigns.status.scheduled'),
                                    'sending': t('campaigns.status.sending'),
                                    'sent': t('campaigns.status.sent'),
                                    'paused': t('campaigns.status.paused'),
                                    'failed': t('campaigns.status.failed')
                                }).map(([status, label]) => (
                                    <button
                                        key={status}
                                        onClick={() => setStatusFilter(status)}
                                        className={`flex items-center w-full px-3 py-2 text-sm rounded-lg ${statusFilter === status
                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                    >
                                        <div
                                            className="h-3 w-3 rounded-full mr-3"
                                            style={{ backgroundColor: getStatusColor(status) }}
                                        ></div>
                                        <span>{label}</span>
                                        <span className="ml-auto bg-gray-200 dark:bg-gray-700 rounded-full px-2 py-0.5 text-xs">
                                            {campaignsByStatus[status]?.length || 0}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Tags section */}
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                <div className="px-3 pb-1">
                                    <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        {t('campaigns.tags')}
                                    </h3>
                                </div>

                                <div className="space-y-1">
                                    <button
                                        onClick={() => setTagFilter('all')}
                                        className={`flex items-center w-full px-3 py-2 text-sm rounded-lg ${tagFilter === 'all'
                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                    >
                                        <Tag className="h-4 w-4 mr-3 text-gray-500" />
                                        <span>{t('campaigns.allTags')}</span>
                                    </button>

                                    {availableTags.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => setTagFilter(tag)}
                                            className={`flex items-center w-full px-3 py-2 text-sm rounded-lg ${tagFilter === tag
                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                        >
                                            <Tag className="h-4 w-4 mr-3 text-gray-500" />
                                            <span>{tag}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Calendar Main Content */}
                    <div className="flex-1 overflow-hidden bg-white dark:bg-gray-800">
                        <div className="h-full">
                            <Calendar
                                localizer={localizer}
                                events={calendarEvents}
                                startAccessor="start"
                                endAccessor="end"
                                views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
                                view={calendarView}
                                date={selectedDate}
                                onView={handleViewChange}
                                onNavigate={(date) => {
                                    setSelectedDate(date);
                                    updateCurrentMonth(date);
                                }}
                                style={calendarStyles}
                                components={{
                                    event: EventComponent,
                                    toolbar: () => null // Suppression de la barre d'outils par défaut
                                }}
                                onSelectEvent={handleSelectEvent}
                                onSelectSlot={handleSelectSlot}
                                selectable={true}
                                eventPropGetter={(event) => ({
                                    style: {
                                        backgroundColor: getStatusColor(event.resource),
                                        borderRadius: '4px'
                                    }
                                })}
                                messages={{
                                    today: t('campaigns.today'),
                                    previous: t('campaigns.previous'),
                                    next: t('campaigns.next'),
                                    month: t('campaigns.month'),
                                    week: t('campaigns.week'),
                                    day: t('campaigns.day'),
                                    agenda: t('campaigns.agenda'),
                                    date: t('campaigns.date'),
                                    time: t('campaigns.time'),
                                    event: t('campaigns.event'),
                                    noEventsInRange: t('campaigns.noCampaignsInRange'),
                                    showMore: (total: number) => `+ ${total} ${t('campaigns.more')}`
                                }}
                                onEventDrop={handleEventDrop}
                                resizable={false}
                            />
                        </div>
                    </div>
                </div>

                {/* Event Details Popover */}
                <EventDetailsPopover />

                {/* Create Campaign Modal */}
                <CreateCampaignModal />

                {/* Templates Modal */}
                <TemplatesModal />

                {/* Analytics Modal */}
                <AnalyticsModal />

                {/* Settings Modal */}
                <SettingsModal />

                {/* Import Modal */}
                <ImportModal />

                {/* Export Modal */}
                <ExportModal />

                {/* Help Modal */}
                <HelpModal />

                {/* Toast Notifications */}
                <Notifications />

                {/* Loading Overlay */}
                <LoadingOverlay />

                {/* Floating Action Button for mobile */}
                <div className="md:hidden fixed right-4 bottom-4">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="h-14 w-14 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center"
                    >
                        <Plus className="h-6 w-6" />
                    </button>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}