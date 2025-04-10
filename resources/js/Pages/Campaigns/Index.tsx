// resources/js/Pages/Campaigns/Index.tsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';
import { Campaign } from '@/types';
import { Calendar, momentLocalizer, Views, SlotInfo } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/fr';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import debounce from 'lodash/debounce';

// Importation des icônes Lucide
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Search,
    Plus,
    Menu,
    Clock,
    Users,
    Settings,
    X,
    Mail,
    AlertTriangle,
    Check,
    RefreshCw,
    Trash2,
    Eye,
    Filter,
    Loader,
    CheckSquare,
    Square,
    MoreHorizontal,
    PlayCircle,
    PauseCircle,
    Calendar as CalendarAdd,
    MessageCircle,
    ListFilter,
    Grid,
    List,
    CalendarDays
} from 'lucide-react';

interface CampaignsIndexProps {
    campaigns: {
        data: Campaign[];
        links: any[];
        total: number;
    };
    [key: string]: unknown;
}

// Configurer le localisateur pour react-big-calendar
moment.locale('fr');
const localizer = momentLocalizer(moment);

export default function CampaignsIndex({
    auth,
    campaigns,
}: PageProps<CampaignsIndexProps>) {
    const { t } = useTranslation();

    // États principaux
    const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'grid'>('calendar');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [calendarView, setCalendarView] = useState(Views.MONTH);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showEventDetails, setShowEventDetails] = useState<number | null>(null);
    const [eventDetailsPosition, setEventDetailsPosition] = useState({ top: 0, left: 0 });
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<Campaign[]>([]);
    const [showSearchResults, setShowSearchResults] = useState(false);

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);

    // États avancés
    const [currentMonth, setCurrentMonth] = useState(moment().format('MMMM YYYY'));
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [newCampaignData, setNewCampaignData] = useState({
        name: '',
        subject: '',
        scheduled_at: moment().add(1, 'day').format('YYYY-MM-DDTHH:mm')
    });

    // États pour la sélection en masse
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedCampaignIds, setSelectedCampaignIds] = useState<number[]>([]);
    const [showBulkActionMenu, setShowBulkActionMenu] = useState(false);
    const [bulkActionMenuPosition, setBulkActionMenuPosition] = useState({ top: 0, left: 0 });
    const [showQuickAddModal, setShowQuickAddModal] = useState(false);

    // État pour le quick add
    const [quickAddData, setQuickAddData] = useState({
        name: '',
        subject: '',
        message_content: '',
        scheduled_at: moment().add(1, 'day').format('YYYY-MM-DDTHH:mm'),
        client_ids: [] as number[],
        send_now: false
    });

    // Refs
    const popoverRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const bulkActionMenuRef = useRef<HTMLDivElement>(null);

    // Debounced search function to prevent excessive re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedSearch = useRef(
        debounce((term: string) => {
            if (term.length >= 2) {
                const results = campaigns.data.filter(campaign =>
                    campaign.name.toLowerCase().includes(term.toLowerCase()) ||
                    (campaign.subject && campaign.subject.toLowerCase().includes(term.toLowerCase()))
                );
                setSearchResults(results);
                setShowSearchResults(true);
            } else {
                setSearchResults([]);
                setShowSearchResults(false);
            }
        }, 300)
    ).current;

    // Effets
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setShowEventDetails(null);
            }
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSearchResults(false);
            }
            if (bulkActionMenuRef.current && !bulkActionMenuRef.current.contains(event.target as Node)) {
                setShowBulkActionMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [popoverRef, searchRef, bulkActionMenuRef]);

    // Recherche avancée
    useEffect(() => {
        debouncedSearch(searchTerm);
        return () => {
            debouncedSearch.cancel();
        };
    }, [searchTerm, debouncedSearch]);

    // Handle search input
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    // Toggle selection mode
    const toggleSelectionMode = () => {
        if (selectionMode) {
            // If exiting selection mode, clear selected campaigns
            setSelectedCampaignIds([]);
        }
        setSelectionMode(!selectionMode);
    };

    // Handle campaign selection
    const handleCampaignSelection = (campaignId: number, event?: React.MouseEvent) => {
        if (event) {
            event.stopPropagation();
        }

        if (selectedCampaignIds.includes(campaignId)) {
            setSelectedCampaignIds(selectedCampaignIds.filter(id => id !== campaignId));
        } else {
            setSelectedCampaignIds([...selectedCampaignIds, campaignId]);
        }
    };

    // Select all visible campaigns
    const selectAllCampaigns = () => {
        const allVisibleIds = filteredCampaigns.map(campaign => campaign.id);
        setSelectedCampaignIds(allVisibleIds);
    };

    // Deselect all campaigns
    const deselectAllCampaigns = () => {
        setSelectedCampaignIds([]);
    };

    // Show bulk action menu
    const showBulkActions = (event: React.MouseEvent) => {
        event.preventDefault();
        setBulkActionMenuPosition({ top: event.clientY, left: event.clientX });
        setShowBulkActionMenu(true);
    };

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
                campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (campaign.subject && campaign.subject.toLowerCase().includes(searchTerm.toLowerCase()));

            return statusMatches && searchMatches;
        });
    }, [campaigns.data, statusFilter, searchTerm]);

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

    // Fonction pour supprimer une campagne
    const handleDeleteCampaign = (campaign: Campaign) => {
        // Vérifier si la campagne est déjà envoyée ou passée
        if (campaign.status === 'sent' ||
            campaign.status === 'sending' ||
            campaign.status === 'partially_sent') {
            setError(t('campaigns.cannotDeleteSentCampaign'));
            setTimeout(() => setError(null), 3000);
            return;
        }

        // Vérifier si la date de la campagne est passée
        const campaignDate = campaign.scheduled_at ? new Date(campaign.scheduled_at) : null;
        if (campaignDate && campaignDate < new Date() && campaign.status !== 'draft') {
            setError(t('campaigns.cannotDeletePastCampaign'));
            setTimeout(() => setError(null), 3000);
            return;
        }

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

    // Bulk disable upcoming campaigns
    const bulkDisableCampaigns = () => {
        if (selectedCampaignIds.length === 0) {
            setError(t('campaigns.noCampaignsSelected'));
            setTimeout(() => setError(null), 3000);
            return;
        }

        if (window.confirm(t('campaigns.confirmBulkDisable'))) {
            setIsLoading(true);

            router.post(route('campaigns.bulk-disable'), { campaign_ids: selectedCampaignIds }, {
                onSuccess: () => {
                    setSuccess(t('campaigns.bulkDisabledSuccessfully', { count: selectedCampaignIds.length }));
                    setIsLoading(false);
                    setShowBulkActionMenu(false);
                    setSelectionMode(false);
                    setSelectedCampaignIds([]);

                    // Reset success message after 3 seconds
                    setTimeout(() => {
                        setSuccess(null);
                    }, 3000);
                },
                onError: () => {
                    setError(t('campaigns.errorBulkDisabling'));
                    setIsLoading(false);

                    // Reset error message after 3 seconds
                    setTimeout(() => {
                        setError(null);
                    }, 3000);
                }
            });
        }
    };

    // Bulk enable campaigns
    const bulkEnableCampaigns = () => {
        if (selectedCampaignIds.length === 0) {
            setError(t('campaigns.noCampaignsSelected'));
            setTimeout(() => setError(null), 3000);
            return;
        }

        if (window.confirm(t('campaigns.confirmBulkEnable'))) {
            setIsLoading(true);

            router.post(route('campaigns.bulk-enable'), { campaign_ids: selectedCampaignIds }, {
                onSuccess: () => {
                    setSuccess(t('campaigns.bulkEnabledSuccessfully', { count: selectedCampaignIds.length }));
                    setIsLoading(false);
                    setShowBulkActionMenu(false);
                    setSelectionMode(false);
                    setSelectedCampaignIds([]);

                    // Reset success message after 3 seconds
                    setTimeout(() => {
                        setSuccess(null);
                    }, 3000);
                },
                onError: () => {
                    setError(t('campaigns.errorBulkEnabling'));
                    setIsLoading(false);

                    // Reset error message after 3 seconds
                    setTimeout(() => {
                        setError(null);
                    }, 3000);
                }
            });
        }
    };

    // Bulk delete campaigns
    const bulkDeleteCampaigns = () => {
        if (selectedCampaignIds.length === 0) {
            setError(t('campaigns.noCampaignsSelected'));
            setTimeout(() => setError(null), 3000);
            return;
        }

        if (window.confirm(t('campaigns.confirmBulkDelete'))) {
            setIsLoading(true);

            router.post(route('campaigns.bulk-delete'), { campaign_ids: selectedCampaignIds }, {
                onSuccess: () => {
                    setSuccess(t('campaigns.bulkDeletedSuccessfully', { count: selectedCampaignIds.length }));
                    setIsLoading(false);
                    setShowBulkActionMenu(false);
                    setSelectionMode(false);
                    setSelectedCampaignIds([]);

                    // Reset success message after 3 seconds
                    setTimeout(() => {
                        setSuccess(null);
                    }, 3000);
                },
                onError: () => {
                    setError(t('campaigns.errorBulkDeleting'));
                    setIsLoading(false);

                    // Reset error message after 3 seconds
                    setTimeout(() => {
                        setError(null);
                    }, 3000);
                }
            });
        }
    };

    // Handle quick add campaign
    const handleQuickAddCampaign = () => {
        if (!quickAddData.name || !quickAddData.message_content) {
            setError(t('campaigns.quickAddRequiredFields'));
            setTimeout(() => setError(null), 3000);
            return;
        }

        setIsLoading(true);

        router.post(route('campaigns.quick-add'), quickAddData, {
            onSuccess: () => {
                setSuccess(t('campaigns.quickAddSuccessfully', { name: quickAddData.name }));
                setIsLoading(false);
                setShowQuickAddModal(false);

                // Reset form
                setQuickAddData({
                    name: '',
                    subject: '',
                    message_content: '',
                    scheduled_at: moment().add(1, 'day').format('YYYY-MM-DDTHH:mm'),
                    client_ids: [],
                    send_now: false
                });

                // Reset success message after 3 seconds
                setTimeout(() => {
                    setSuccess(null);
                }, 3000);
            },
            onError: () => {
                setError(t('campaigns.errorQuickAdd'));
                setIsLoading(false);

                // Reset error message after 3 seconds
                setTimeout(() => {
                    setError(null);
                }, 3000);
            }
        });
    };

    // Fonctions pour drag and drop
    const handleEventDrop = (event: any) => {
        // Vérifier si la campagne est déjà envoyée
        if (['sent', 'sending', 'partially_sent'].includes(event.campaign.status)) {
            setError(t('campaigns.cannotRescheduleSentCampaign'));
            setTimeout(() => setError(null), 3000);
            return;
        }

        setIsLoading(true);

        const { campaign, start } = event;

        // Appel API pour mettre à jour la date planifiée
        router.put(route('campaigns.reschedule', campaign.id), {
            scheduled_at: moment(start).format('YYYY-MM-DD HH:mm:ss')
        }, {
            onSuccess: () => {
                setSuccess(t('campaigns.rescheduledSuccessfully', {
                    name: campaign.name,
                    date: moment(start).format('DD/MM/YYYY HH:mm')
                }));
                setIsLoading(false);

                // Fermer la notification de succès après 3 secondes
                setTimeout(() => {
                    setSuccess(null);
                }, 3000);
            },
            onError: () => {
                setError(t('campaigns.errorRescheduling'));
                setIsLoading(false);

                // Fermer la notification d'erreur après 3 secondes
                setTimeout(() => {
                    setError(null);
                }, 3000);
            }
        });
    };

    // Custom event component for the calendar
    const EventComponent = ({ event, ...rest }: any) => {
        const campaign = event.campaign;
        const handleClick = (e: React.MouseEvent) => {
            if (selectionMode) {
                handleCampaignSelection(campaign.id, e);
            } else {
                e.stopPropagation();
                setSelectedEvent(event);
                setShowEventDetails(campaign.id);
                setEventDetailsPosition({
                    top: e.clientY,
                    left: e.clientX
                });
            }
        };

        // Configuration drag-and-drop pour les événements déplaçables
        const isDraggable = campaign.status === 'draft' || campaign.status === 'scheduled' || campaign.status === 'paused';
        const isSelected = selectedCampaignIds.includes(campaign.id);

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
                    border: isSelected ? '2px solid white' : '1px solid rgba(0,0,0,0.1)',
                    opacity: isDraggable ? 1 : 0.8,
                    position: 'relative'
                }}
                title={isDraggable ? t('campaigns.dragToReschedule') : ''}
                {...rest}
            >
                {/* Selection checkbox for bulk mode */}
                {selectionMode && (
                    <div
                        className="absolute -left-1 -top-1 z-10"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleCampaignSelection(campaign.id);
                        }}
                    >
                        {isSelected ? (
                            <CheckSquare className="h-4 w-4 bg-white rounded-sm text-blue-600" />
                        ) : (
                            <Square className="h-4 w-4 bg-white rounded-sm text-gray-400" />
                        )}
                    </div>
                )}

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
        if (selectionMode) {
            handleCampaignSelection(event.campaign.id);
        } else {
            setSelectedEvent(event);
            setShowEventDetails(event.campaign.id);
        }
    };

    // Handle selecting a date or slot
    const handleSelectSlot = (slotInfo: SlotInfo) => {
        // Si on est en mode sélection, ne pas ouvrir la modale de création
        if (selectionMode) {
            return;
        }

        // Ouvrir modale quick-add à la place
        setQuickAddData({
            ...quickAddData,
            scheduled_at: moment(slotInfo.start).format('YYYY-MM-DDTHH:mm')
        });
        setShowQuickAddModal(true);
    };

    // Fonction pour créer une nouvelle campagne
    const handleCreateCampaign = () => {
        setIsLoading(true);

        const formData = {
            name: newCampaignData.name,
            subject: newCampaignData.subject,
            scheduled_at: newCampaignData.scheduled_at
        };

        router.post(route('campaigns.store'), formData, {
            onSuccess: () => {
                setSuccess(t('campaigns.createdSuccessfully', { name: formData.name }));
                setIsLoading(false);
                setShowCreateModal(false);

                // Réinitialiser le formulaire
                setNewCampaignData({
                    name: '',
                    subject: '',
                    scheduled_at: moment().add(1, 'day').format('YYYY-MM-DDTHH:mm')
                });

                // Fermer la notification de succès après 3 secondes
                setTimeout(() => {
                    setSuccess(null);
                }, 3000);
            },
            onError: () => {
                setError(t('campaigns.errorCreating'));
                setIsLoading(false);

                // Fermer la notification d'erreur après 3 secondes
                setTimeout(() => {
                    setError(null);
                }, 3000);
            }
        });
    };

    // Composant pour l'en-tête du calendrier (style moderne)
    const Header = () => {
        return (
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4">
                        <div className="flex items-center mb-4 sm:mb-0">
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="mr-4 sm:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <Menu className="h-5 w-5 text-gray-500 dark:text-gray-300" />
                            </button>

                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('common.campaigns')}</h1>

                            <div className="ml-4 flex items-center space-x-2">
                                <button
                                    onClick={() => setViewMode('calendar')}
                                    className={`p-1.5 rounded-md ${viewMode === 'calendar' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                >
                                    <CalendarDays className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                >
                                    <List className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                >
                                    <Grid className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 w-full sm:w-auto">
                            <div className="relative flex-1 sm:flex-none max-w-md w-full" ref={searchRef}>
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder={t('common.searchCampaigns')}
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-400" />
                                </div>

                                {/* Résultats de recherche */}
                                {showSearchResults && searchResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                                        {searchResults.map(campaign => (
                                            <Link
                                                key={campaign.id}
                                                href={route('campaigns.show', campaign.id)}
                                                className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0"
                                            >
                                                <div
                                                    className="h-3 w-3 rounded-full mr-3 flex-shrink-0"
                                                    style={{ backgroundColor: getStatusColor(campaign.status) }}
                                                ></div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{campaign.name}</div>
                                                    {campaign.subject && (
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{campaign.subject}</div>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                                    {campaign.scheduled_at ? formatDate(campaign.scheduled_at) : '-'}
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}

                                {showSearchResults && searchResults.length === 0 && searchTerm.length >= 2 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 p-4 text-center text-gray-500 dark:text-gray-400">
                                        {t('campaigns.noSearchResults')}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex">
                                {!selectionMode ? (
                                    <button
                                        onClick={toggleSelectionMode}
                                        className="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none"
                                    >
                                        <CheckSquare className="mr-1 h-4 w-4" />
                                        <span className="hidden sm:inline">{t('campaigns.selectMode')}</span>
                                    </button>
                                ) : (
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
                                            {selectedCampaignIds.length} {t('campaigns.selected')}
                                        </span>
                                        <button
                                            onClick={showBulkActions}
                                            disabled={selectedCampaignIds.length === 0}
                                            className={`inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium ${selectedCampaignIds.length === 0 ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                        >
                                            <MoreHorizontal className="h-4 w-4 sm:mr-1" />
                                            <span className="hidden sm:inline">{t('campaigns.actions')}</span>
                                        </button>
                                        <button
                                            onClick={toggleSelectionMode}
                                            className="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        >
                                            <X className="h-4 w-4 sm:mr-1" />
                                            <span className="hidden sm:inline">{t('campaigns.cancel')}</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setShowQuickAddModal(true)}
                                className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none"
                            >
                                <Plus className="h-4 w-4 sm:mr-1" />
                                <span className="hidden sm:inline">{t('campaigns.quickAdd')}</span>
                            </button>

                            <Link
                                href={route('campaigns.create')}
                                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none"
                            >
                                <CalendarAdd className="h-4 w-4 sm:mr-1" />
                                <span className="hidden sm:inline">{t('campaigns.create')}</span>
                            </Link>
                        </div>
                    </div>

                    {/* Sous-en-tête spécifique au calendrier */}
                    {viewMode === 'calendar' && (
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center space-x-2 mb-3 sm:mb-0">
                                <button
                                    onClick={() => navigateCalendar('TODAY')}
                                    className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    {t('campaigns.today')}
                                </button>

                                <div className="flex items-center space-x-1">
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
                                </div>

                                <div className="text-base font-medium text-gray-700 dark:text-gray-300">
                                    {currentMonth}
                                </div>
                            </div>

                            <div className="flex items-center self-start sm:self-auto">
                                <div className="flex border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
                                    <button
                                        onClick={() => setCalendarView(Views.MONTH)}
                                        className={`px-3 py-1.5 text-sm ${calendarView === Views.MONTH
                                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                    >
                                        {t('campaigns.month')}
                                    </button>

                                    <button
                                        onClick={() => setCalendarView(Views.WEEK)}
                                        className={`px-3 py-1.5 text-sm border-l border-r border-gray-300 dark:border-gray-600 ${calendarView === Views.WEEK
                                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                    >
                                        {t('campaigns.week')}
                                    </button>

                                    <button
                                        onClick={() => setCalendarView(Views.DAY)}
                                        className={`px-3 py-1.5 text-sm ${calendarView === Views.DAY
                                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                    >
                                        {t('campaigns.day')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
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
        const canDelete = !['sent', 'sending', 'partially_sent'].includes(campaign.status);
        const campaignDate = campaign.scheduled_at ? new Date(campaign.scheduled_at) : null;
        const isPastCampaign = campaignDate && campaignDate < new Date() && campaign.status !== 'draft';

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

                        {campaign.status === 'sent' && (
                            <div className="mt-2">
                                <div className="mb-1 flex items-center justify-between">
                                    <span className="text-xs text-gray-600 dark:text-gray-300">Progrès</span>
                                    <span className="text-xs font-medium">
                                        {Math.round((campaign.delivered_count / campaign.recipients_count) * 100)}%
                                    </span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                                    <div
                                        className="h-2 rounded-full bg-green-500"
                                        style={{
                                            width: `${Math.min((campaign.delivered_count / campaign.recipients_count) * 100, 100)}%`
                                        }}
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

                        {canDelete && !isPastCampaign && (
                            <button
                                onClick={() => {
                                    handleDeleteCampaign(campaign);
                                }}
                                className="inline-flex items-center justify-center px-3 py-2 border border-red-300 dark:border-red-700 rounded-md shadow-sm text-sm font-medium text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900 dark:hover:bg-opacity-20 col-span-2"
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

    // Bulk Action Menu Component
    const BulkActionMenu = () => {
        if (!showBulkActionMenu) return null;

        return (
            <div
                ref={bulkActionMenuRef}
                className="absolute z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
                style={{
                    top: bulkActionMenuPosition.top,
                    left: bulkActionMenuPosition.left,
                    minWidth: '200px'
                }}
            >
                <div className="p-1">
                    <button
                        onClick={bulkDisableCampaigns}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                    >
                        <PauseCircle className="mr-2 h-4 w-4 text-yellow-500" />
                        {t('campaigns.pauseSelected')}
                    </button>
                    <button
                        onClick={bulkEnableCampaigns}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                    >
                        <PlayCircle className="mr-2 h-4 w-4 text-green-500" />
                        {t('campaigns.enableSelected')}
                    </button>
                    <button
                        onClick={bulkDeleteCampaigns}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 dark:hover:bg-opacity-20 flex items-center"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t('campaigns.deleteSelected')}
                    </button>
                </div>
            </div>
        );
    };

    // Quick Add Modal Component
    const QuickAddModal = () => {
        if (!showQuickAddModal) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {t('campaigns.quickAdd')}
                        </h3>
                        <button
                            onClick={() => setShowQuickAddModal(false)}
                            className="text-gray-400 hover:text-gray-500"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="p-6">
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('campaigns.name')} *
                            </label>
                            <input
                                type="text"
                                value={quickAddData.name}
                                onChange={(e) => setQuickAddData({ ...quickAddData, name: e.target.value })}
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
                                value={quickAddData.subject}
                                onChange={(e) => setQuickAddData({ ...quickAddData, subject: e.target.value })}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder={t('campaigns.subjectPlaceholder')}
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('campaigns.messageContent')} *
                            </label>
                            <textarea
                                rows={3}
                                value={quickAddData.message_content}
                                onChange={(e) => setQuickAddData({ ...quickAddData, message_content: e.target.value })}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder={t('campaigns.messagePlaceholder')}
                            ></textarea>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('campaigns.scheduledAt')}
                            </label>
                            <input
                                type="datetime-local"
                                value={quickAddData.scheduled_at}
                                onChange={(e) => setQuickAddData({ ...quickAddData, scheduled_at: e.target.value })}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>

                        <div className="mb-4">
                            <div className="flex justify-between items-center">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t('campaigns.quickSelectRecipients')}
                                </label>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {quickAddData.client_ids.length} {t('common.selected')}
                                </span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        // In a real app, this would open a recipient selector
                                        // For this demo, we'll simulate selecting all clients
                                        const allClientIds = [1, 2, 3]; // Example IDs
                                        setQuickAddData({ ...quickAddData, client_ids: allClientIds });
                                    }}
                                    className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                                >
                                    <Users className="mr-1 h-4 w-4" />
                                    {t('campaigns.selectRecipients')}
                                </button>
                            </div>
                        </div>

                        <div className="mb-4">
                            <div className="flex items-center">
                                <input
                                    id="send_now"
                                    type="checkbox"
                                    checked={quickAddData.send_now}
                                    onChange={(e) => setQuickAddData({ ...quickAddData, send_now: e.target.checked })}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                                />
                                <label htmlFor="send_now" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                    {t('campaigns.sendImmediately')}
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-2 mt-6">
                            <button
                                onClick={() => setShowQuickAddModal(false)}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                {t('common.cancel')}
                            </button>

                            <button
                                onClick={handleQuickAddCampaign}
                                disabled={isLoading || !quickAddData.name || !quickAddData.message_content || quickAddData.client_ids.length === 0}
                                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 ${(isLoading || !quickAddData.name || !quickAddData.message_content || quickAddData.client_ids.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isLoading ? (
                                    <Loader className="h-5 w-5 animate-spin" />
                                ) : t('campaigns.createQuickly')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Campaign List View
    const CampaignListView = () => {
        return (
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-850">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">{t('campaigns.allCampaigns')}</h3>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`px-2 py-1 text-xs rounded-md ${statusFilter === 'all' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}
                        >
                            {t('campaigns.all')}
                        </button>
                        {['scheduled', 'sent', 'draft', 'paused'].map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-2 py-1 text-xs rounded-md ${statusFilter === status ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}
                            >
                                {getStatusName(status)}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredCampaigns.length > 0 ? (
                        filteredCampaigns.map(campaign => (
                            <div key={campaign.id} className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-750 ${selectionMode ? 'cursor-pointer' : ''}`} onClick={() => selectionMode && handleCampaignSelection(campaign.id)}>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3">
                                        {selectionMode && (
                                            <div
                                                className="pt-0.5"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCampaignSelection(campaign.id);
                                                }}
                                            >
                                                {selectedCampaignIds.includes(campaign.id) ? (
                                                    <CheckSquare className="h-5 w-5 text-blue-600" />
                                                ) : (
                                                    <Square className="h-5 w-5 text-gray-400" />
                                                )}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center">
                                                <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">{campaign.name}</h4>
                                                <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(campaign.status)}`}>
                                                    {getStatusName(campaign.status)}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                {campaign.subject || t('campaigns.noSubject')}
                                            </p>
                                            <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
                                                <Clock className="h-3 w-3 mr-1" />
                                                {formatDate(campaign.scheduled_at)}
                                                <span className="mx-2">•</span>
                                                <Users className="h-3 w-3 mr-1" />
                                                {campaign.recipients_count} {t('campaigns.recipients')}
                                            </div>
                                        </div>
                                    </div>

                                    {!selectionMode && (
                                        <div className="flex space-x-2">
                                            <Link
                                                href={route('campaigns.show', campaign.id)}
                                                className="inline-flex items-center p-1 border border-transparent rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                            {campaign.status !== 'sent' && (
                                                <Link
                                                    href={route('campaigns.edit', campaign.id)}
                                                    className="inline-flex items-center p-1 border border-transparent rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                >
                                                    <Settings className="h-4 w-4" />
                                                </Link>
                                            )}
                                            {!['sent', 'sending', 'partially_sent'].includes(campaign.status) && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteCampaign(campaign);
                                                    }}
                                                    className="inline-flex items-center p-1 border border-transparent rounded-full text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 dark:hover:bg-opacity-20"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 mb-4">
                                <CalendarIcon className="h-6 w-6" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">{t('campaigns.noCampaignsFound')}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('campaigns.startByCreatingCampaign')}</p>
                            <button
                                onClick={() => setShowQuickAddModal(true)}
                                className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                {t('campaigns.createCampaign')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Campaign Grid View
    const CampaignGridView = () => {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredCampaigns.length > 0 ? (
                    filteredCampaigns.map(campaign => (
                        <div
                            key={campaign.id}
                            className={`bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition duration-150 overflow-hidden border border-gray-200 dark:border-gray-700 ${selectionMode ? 'cursor-pointer' : ''}`}
                            onClick={() => selectionMode && handleCampaignSelection(campaign.id)}
                        >
                            <div className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1 min-w-0">
                                        {selectionMode && (
                                            <div className="absolute right-2 top-2" onClick={(e) => {
                                                e.stopPropagation();
                                                handleCampaignSelection(campaign.id);
                                            }}>
                                                {selectedCampaignIds.includes(campaign.id) ? (
                                                    <CheckSquare className="h-5 w-5 text-blue-600" />
                                                ) : (
                                                    <Square className="h-5 w-5 text-gray-400" />
                                                )}
                                            </div>
                                        )}
                                        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">{campaign.name}</h4>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2 mb-2">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(campaign.status)}`}>
                                        {getStatusIcon(campaign.status)}
                                        <span className="ml-1">{getStatusName(campaign.status)}</span>
                                    </span>
                                    <div className="flex-1"></div>
                                </div>

                                {campaign.subject && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 truncate">
                                        {campaign.subject}
                                    </p>
                                )}

                                <div className="flex flex-col space-y-1 text-xs text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center">
                                        <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                                        <span className="truncate">{formatDate(campaign.scheduled_at)}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Users className="h-3 w-3 mr-1 flex-shrink-0" />
                                        <span>{campaign.recipients_count} {t('campaigns.recipients')}</span>
                                    </div>
                                </div>
                            </div>

                            {!selectionMode && (
                                <div className="border-t border-gray-200 dark:border-gray-700 p-2 bg-gray-50 dark:bg-gray-750 flex justify-between">
                                    <Link
                                        href={route('campaigns.show', campaign.id)}
                                        className="inline-flex items-center px-2 py-1 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                    >
                                        <Eye className="h-3 w-3 mr-1" />
                                        {t('common.view')}
                                    </Link>

                                    {campaign.status !== 'sent' && (
                                        <Link
                                            href={route('campaigns.edit', campaign.id)}
                                            className="inline-flex items-center px-2 py-1 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                        >
                                            <Settings className="h-3 w-3 mr-1" />
                                            {t('common.edit')}
                                        </Link>
                                    )}

                                    {!['sent', 'sending', 'partially_sent'].includes(campaign.status) && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteCampaign(campaign);
                                            }}
                                            className="inline-flex items-center px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 dark:hover:bg-opacity-20 rounded"
                                        >
                                            <Trash2 className="h-3 w-3 mr-1" />
                                            {t('common.delete')}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="col-span-full p-8 bg-white dark:bg-gray-800 rounded-lg shadow text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 mb-4">
                            <CalendarIcon className="h-6 w-6" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">{t('campaigns.noCampaignsFound')}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('campaigns.startByCreatingCampaign')}</p>
                        <button
                            onClick={() => setShowQuickAddModal(true)}
                            className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            {t('campaigns.createCampaign')}
                        </button>
                    </div>
                )}
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
                            <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                            <div>{error}</div>
                        </div>
                        <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 ml-4">
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
                        <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700 ml-4">
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
        height: 'calc(100vh - 190px)',
        // Ajout de styles personnalisés pour ressembler à Google Calendar
        '.rbc-header': {
            padding: '10px 0',
            fontWeight: 'normal',
            fontSize: '0.875rem'
        },
        '.rbc-month-view': {
            border: 'none',
            borderRadius: '8px',
            overflow: 'hidden'
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
            header={null}
        >
            <Head title={t('common.campaigns')} />

            <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
                {/* Header principal */}
                <Header />

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    {sidebarOpen && (
                        <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 overflow-y-auto">
                            {/* Mini Calendar */}
                            <MiniCalendar />

                            {/* Filtres par statut */}
                            <div className="space-y-1 mb-4">
                                <div className="px-3 py-2">
                                    <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        {t('campaigns.filterByStatus')}
                                    </h3>
                                </div>

                                <button
                                    onClick={() => setStatusFilter('all')}
                                    className={`flex items-center w-full px-3 py-2 text-sm rounded-lg ${statusFilter === 'all'
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                >
                                    <Filter className="h-4 w-4 mr-3 text-gray-500" />
                                    <span>{t('campaigns.status.all')}</span>
                                    <span className="ml-auto bg-gray-200 dark:bg-gray-700 rounded-full px-2 py-0.5 text-xs">
                                        {campaigns.data.length}
                                    </span>
                                </button>

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

                            {/* Campagnes d'aujourd'hui */}
                            <div className="mt-6">
                                <div className="px-3 py-2">
                                    <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        {t('campaigns.today')}
                                    </h3>
                                </div>

                                {todayCampaigns.length > 0 ? (
                                    <div className="space-y-1">
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
                                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                                        {t('campaigns.noCampaignsToday')}
                                    </div>
                                )}
                            </div>

                            {/* Campagnes à venir */}
                            <div className="mt-4">
                                <div className="px-3 py-2">
                                    <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        {t('campaigns.upcoming')}
                                    </h3>
                                </div>

                                {upcomingCampaigns.length > 0 ? (
                                    <div className="space-y-1">
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
                                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                                        {t('campaigns.noUpcomingCampaigns')}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Main Content Area */}
                    <div className="flex-1 overflow-auto p-4">
                        {/* Content based on view mode */}
                        {viewMode === 'calendar' && (
                            <div className="h-full bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
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
                        )}

                        {viewMode === 'list' && (
                            <CampaignListView />
                        )}

                        {viewMode === 'grid' && (
                            <CampaignGridView />
                        )}
                    </div>
                </div>

                {/* Event Details Popover */}
                <EventDetailsPopover />

                {/* Create Campaign Modal */}
                <CreateCampaignModal />

                {/* Quick Add Modal */}
                <QuickAddModal />

                {/* Bulk Action Menu */}
                <BulkActionMenu />

                {/* Toast Notifications */}
                <Notifications />

                {/* Loading Overlay */}
                <LoadingOverlay />

                {/* Floating Action Button for mobile */}
                <div className="md:hidden fixed right-4 bottom-4">
                    <button
                        onClick={() => setShowQuickAddModal(true)}
                        className="h-14 w-14 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center"
                    >
                        <Plus className="h-6 w-6" />
                    </button>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}