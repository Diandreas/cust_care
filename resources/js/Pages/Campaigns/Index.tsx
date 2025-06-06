import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';
import { Campaign } from '@/types';
import { Calendar, momentLocalizer, Views, SlotInfo } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/fr';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import axios from 'axios';

// Import shadcn components
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/Components/ui/dropdown-menu';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/Components/ui/card';
import { Checkbox } from '@/Components/ui/checkbox';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { Badge } from '@/Components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/Components/ui/tooltip';
import { Separator } from '@/Components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/Components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { ScrollArea } from '@/Components/ui/scroll-area';

// Lucide icons
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
    Grid,
    ChevronDown,
    PanelLeft,
    PanelRightClose,
    Tag as TagIcon,
    ArrowRight,
    Info,
    Zap,
    Gift
} from 'lucide-react';

interface CampaignsIndexProps {
    campaigns: {
        data: Campaign[];
        links: any[];
        total: number;
    };
    tags: {
        id: number;
        name: string;
        clients_count: number;
    }[];
    [key: string]: unknown;
}

// Configure localization for react-big-calendar
moment.locale('fr');
const localizer = momentLocalizer(moment);

export default function CampaignsIndex({
    auth,
    campaigns,
    tags = [], // Provide a default empty array if tags is undefined
}: PageProps<CampaignsIndexProps>) {
    const { t } = useTranslation();

    // Detect dark mode from HTML class
    const isDarkMode = document.documentElement.classList.contains('dark');

    // Principal states with useForm for better form management
    const { data: filterData, setData: setFilterData, get, processing } = useForm({
        search: '',
        statusFilter: 'all',
        sort_by: 'name',
        sort_direction: 'asc',
    });

    // UI State
    const [viewMode, setViewMode] = useState<'calendar' | 'grid'>('calendar');
    const [calendarView, setCalendarView] = useState(Views.MONTH);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [eventDetailsPosition, setEventDetailsPosition] = useState({ top: 0, left: 0 });
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [currentMonth, setCurrentMonth] = useState(moment().format('MMMM YYYY'));

    // Modal management - utilisation d'états booléens séparés comme dans ClientsIndex
    const [showQuickAddModal, setShowQuickAddModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);

    // Selections & search
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedCampaignIds, setSelectedCampaignIds] = useState<number[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<Campaign[]>([]);
    const [showSearchResults, setShowSearchResults] = useState(false);

    // Loading & notifications
    const [isLoading, setIsLoading] = useState(false);

    // Forms data - utilisation de useState comme dans ClientsIndex
    const [newCampaignData, setNewCampaignData] = useState({
        name: '',
        subject: '',
        scheduled_at: moment().add(1, 'day').format('YYYY-MM-DDTHH:mm')
    });

    const [quickAddForm, setQuickAddForm] = useState({
        name: '',
        subject: '',
        message_content: '',
        scheduled_at: moment().add(1, 'day').format('YYYY-MM-DDTHH:mm'),
        tag_id: '',
        send_now: false
    });

    // Refs for debounce and element references
    const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);

    // Filtered campaigns with useMemo for performance
    const filteredCampaigns = useMemo(() => {
        return campaigns.data.filter(campaign => {
            // Status filter
            const statusMatches = filterData.statusFilter === 'all' || campaign.status === filterData.statusFilter;

            // Search filter
            const searchMatches = filterData.search === "" ||
                campaign.name.toLowerCase().includes(filterData.search.toLowerCase()) ||
                (campaign.message_content && campaign.message_content.toLowerCase().includes(filterData.search.toLowerCase()));

            return statusMatches && searchMatches;
        });
    }, [campaigns.data, filterData.statusFilter, filterData.search]);

    // Handle search form submission
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        get(route('campaigns.index'), {
            preserveState: true,
            replace: true,
        });
    };

    // Handle search change (implémentation simplifiée comme dans ClientsIndex)
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        setFilterData('search', value);

        // Clear existing timeout
        if (searchDebounceRef.current) {
            clearTimeout(searchDebounceRef.current);
        }

        // Set new timeout for search results
        searchDebounceRef.current = setTimeout(() => {
            if (value.length >= 2) {
                const results = campaigns.data.filter(campaign =>
                    campaign.name.toLowerCase().includes(value.toLowerCase()) ||
                    (campaign.message_content && campaign.message_content.toLowerCase().includes(value.toLowerCase()))
                );
                setSearchResults(results);
                setShowSearchResults(true);
            } else {
                setSearchResults([]);
                setShowSearchResults(false);
            }
        }, 300); // 300ms delay for better performance
    };

    // Effects
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setShowEventDetailsModal(false);
            }
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSearchResults(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [popoverRef, searchRef]);

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

        setSelectedCampaignIds(prevIds => {
            if (prevIds.includes(campaignId)) {
                return prevIds.filter(id => id !== campaignId);
            } else {
                return [...prevIds, campaignId];
            }
        });
    };

    // Gestion du formulaire Quick Add
    const handleQuickAdd = () => {
        console.log('Début de handleQuickAdd', quickAddForm);

        // Validation des champs obligatoires
        if (!quickAddForm.name || !quickAddForm.message_content) {
            console.error('Champs obligatoires manquants', {
                name: quickAddForm.name,
                message_content: quickAddForm.message_content
            });
            toast.error(t('campaigns.quickAddRequiredFields'));
            return;
        }

        if (!quickAddForm.tag_id) {
            console.error('Tag obligatoire manquant');
            toast.error(t('campaigns.tagRequired'));
            return;
        }

        setIsLoading(true);
        console.log('Envoi de la requête POST vers campaigns.quick-add', {
            formData: quickAddForm,
            routeExists: typeof route === 'function' && route('campaigns.quick-add') !== undefined
        });

        // Utiliser Axios plutôt que Inertia ici pour un formulaire simple
        axios.post(route('campaigns.quick-add'), {
            name: quickAddForm.name,
            subject: quickAddForm.subject,
            message_content: quickAddForm.message_content,
            scheduled_at: quickAddForm.scheduled_at,
            tag_id: quickAddForm.tag_id,
            send_now: quickAddForm.send_now
        })
            .then(response => {
                console.log('Réponse de succès reçue', response.data);
                toast.success(t('campaigns.quickAddSuccessfully', { name: quickAddForm.name }));
                setIsLoading(false);
                setShowQuickAddModal(false);

                // Reset form
                setQuickAddForm({
                    name: '',
                    subject: '',
                    message_content: '',
                    scheduled_at: moment().add(1, 'day').format('YYYY-MM-DDTHH:mm'),
                    tag_id: '',
                    send_now: false
                });

                // Reload the campaigns list
                window.location.reload();
            })
            .catch(err => {
                console.error('Erreur lors de l\'ajout de la campagne', {
                    status: err.response?.status,
                    statusText: err.response?.statusText,
                    data: err.response?.data,
                    message: err.message,
                    error: err
                });

                // Extraire le message d'erreur de la réponse
                const errorMessage = err.response?.data?.error ||
                    err.response?.data?.message ||
                    t('campaigns.errorQuickAdd');

                toast.error(errorMessage);
                setIsLoading(false);
            });
    };

    // Optimiser les fonctions liées à la sélection après la déclaration de filteredCampaigns
    const selectAllCampaigns = () => {
        const allVisibleIds = filteredCampaigns.map(campaign => campaign.id);
        setSelectedCampaignIds(allVisibleIds);
    };

    // Deselect all campaigns
    const deselectAllCampaigns = () => {
        setSelectedCampaignIds([]);
    };

    // Calendar navigation
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

    // Calendar view change
    const handleViewChange = (view: string) => {
        setCalendarView(view as any);
    };

    // Formatting
    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return moment(dateString).format('DD/MM/YYYY HH:mm');
    };

    // Get tag name by id
    const getTagName = (tagId: string) => {
        const tag = tags.find(t => t.id.toString() === tagId);
        return tag ? tag.name : '';
    };

    // Get client count by tag id
    const getClientCount = (tagId: string) => {
        const tag = tags.find(t => t.id.toString() === tagId);
        return tag ? tag.clients_count : 0;
    };

    // Status management
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

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'draft': return 'secondary';
            case 'scheduled': return 'default';
            case 'sending': return 'default';
            case 'sent': return 'success';
            case 'partially_sent': return 'warning';
            case 'paused': return 'warning';
            case 'failed': return 'destructive';
            case 'cancelled': return 'secondary';
            default: return 'secondary';
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

    // Campaigns by status for sidebar
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

    // Today's campaigns
    const todayCampaigns = useMemo(() => {
        const today = moment().startOf('day');
        return campaigns.data.filter(campaign => {
            if (!campaign.scheduled_at) return false;
            const campaignDate = moment(campaign.scheduled_at).startOf('day');
            return campaignDate.isSame(today);
        });
    }, [campaigns.data]);

    // Upcoming campaigns this week
    const upcomingCampaigns = useMemo(() => {
        const today = moment().startOf('day');
        const endOfWeek = moment().endOf('week');
        return campaigns.data.filter(campaign => {
            if (!campaign.scheduled_at) return false;
            const campaignDate = moment(campaign.scheduled_at).startOf('day');
            return campaignDate.isAfter(today) && campaignDate.isBefore(endOfWeek);
        });
    }, [campaigns.data]);

    // Calendar events transformation
    const calendarEvents = useMemo(() => {
        return filteredCampaigns.map(campaign => {
            // Use scheduled_at if it exists, otherwise use created_at as fallback
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

    // Delete a campaign with improved error handling
    const handleDeleteCampaign = (campaign: Campaign) => {
        // Check if campaign is already sent or past
        if (campaign.status === 'sent' ||
            campaign.status === 'sending' ||
            campaign.status === 'partially_sent') {
            toast.error(t('campaigns.cannotDeleteSentCampaign'));
            return;
        }

        // Check if campaign date is in the past
        const campaignDate = campaign.scheduled_at ? new Date(campaign.scheduled_at) : null;
        if (campaignDate && campaignDate < new Date() && campaign.status !== 'draft') {
            toast.error(t('campaigns.cannotDeletePastCampaign'));
            return;
        }

        if (window.confirm(t('campaigns.confirmDelete'))) {
            setIsLoading(true);

            // API call to delete
            router.delete(route('campaigns.destroy', campaign.id), {
                onSuccess: () => {
                    toast.success(t('campaigns.deletedSuccessfully', { name: campaign.name }));
                    setIsLoading(false);
                    setShowEventDetailsModal(false);
                },
                onError: () => {
                    toast.error(t('campaigns.errorDeleting'));
                    setIsLoading(false);
                }
            });
        }
    };

    // Bulk disable upcoming campaigns
    const bulkDisableCampaigns = () => {
        if (selectedCampaignIds.length === 0) {
            toast.error(t('campaigns.noCampaignsSelected'));
            return;
        }

        if (window.confirm(t('campaigns.confirmBulkDisable'))) {
            setIsLoading(true);

            router.post(route('campaigns.bulk-disable'), { campaign_ids: selectedCampaignIds }, {
                onSuccess: () => {
                    toast.success(t('campaigns.bulkDisabledSuccessfully', { count: selectedCampaignIds.length }));
                    setIsLoading(false);
                    setSelectionMode(false);
                    setSelectedCampaignIds([]);
                },
                onError: () => {
                    toast.error(t('campaigns.errorBulkDisabling'));
                    setIsLoading(false);
                }
            });
        }
    };

    // Bulk enable campaigns
    const bulkEnableCampaigns = () => {
        if (selectedCampaignIds.length === 0) {
            toast.error(t('campaigns.noCampaignsSelected'));
            return;
        }

        if (window.confirm(t('campaigns.confirmBulkEnable'))) {
            setIsLoading(true);

            router.post(route('campaigns.bulk-enable'), { campaign_ids: selectedCampaignIds }, {
                onSuccess: () => {
                    toast.success(t('campaigns.bulkEnabledSuccessfully', { count: selectedCampaignIds.length }));
                    setIsLoading(false);
                    setSelectionMode(false);
                    setSelectedCampaignIds([]);
                },
                onError: () => {
                    toast.error(t('campaigns.errorBulkEnabling'));
                    setIsLoading(false);
                }
            });
        }
    };

    // Bulk delete campaigns
    const bulkDeleteCampaigns = () => {
        if (selectedCampaignIds.length === 0) {
            toast.error(t('campaigns.noCampaignsSelected'));
            return;
        }

        if (window.confirm(t('campaigns.confirmBulkDelete'))) {
            setIsLoading(true);

            router.post(route('campaigns.bulk-delete'), { campaign_ids: selectedCampaignIds }, {
                onSuccess: () => {
                    toast.success(t('campaigns.bulkDeletedSuccessfully', { count: selectedCampaignIds.length }));
                    setIsLoading(false);
                    setSelectionMode(false);
                    setSelectedCampaignIds([]);
                },
                onError: () => {
                    toast.error(t('campaigns.errorBulkDeleting'));
                    setIsLoading(false);
                }
            });
        }
    };

    // Enable all upcoming campaigns
    const enableAllUpcomingCampaigns = () => {
        if (window.confirm(t('campaigns.confirmEnableAllUpcoming'))) {
            setIsLoading(true);

            // Filter upcoming campaigns that aren't already active
            const upcomingCampaignIds = campaigns.data
                .filter(campaign => {
                    // Check if campaign is scheduled for the future
                    const isUpcoming = campaign.scheduled_at && new Date(campaign.scheduled_at) > new Date();
                    // Check if campaign is in draft or paused state
                    const canBeEnabled = campaign.status === 'draft' || campaign.status === 'paused';
                    return isUpcoming && canBeEnabled;
                })
                .map(campaign => campaign.id);

            if (upcomingCampaignIds.length === 0) {
                toast.info(t('campaigns.noUpcomingCampaigns'));
                setIsLoading(false);
                return;
            }

            router.post(route('campaigns.bulk-enable'), { campaign_ids: upcomingCampaignIds }, {
                onSuccess: () => {
                    toast.success(t('campaigns.allUpcomingEnabledSuccessfully', { count: upcomingCampaignIds.length }));
                    setIsLoading(false);
                },
                onError: () => {
                    toast.error(t('campaigns.errorBulkEnabling'));
                    setIsLoading(false);
                }
            });
        }
    };

    // Disable all campaigns
    const disableAllCampaigns = () => {
        if (window.confirm(t('campaigns.confirmDisableAll'))) {
            setIsLoading(true);

            // Filter campaigns that can be disabled (not already sent or sending)
            const disableCampaignIds = campaigns.data
                .filter(campaign => {
                    return !['sent', 'sending', 'partially_sent'].includes(campaign.status);
                })
                .map(campaign => campaign.id);

            if (disableCampaignIds.length === 0) {
                toast.info(t('campaigns.noDisableableCampaigns'));
                setIsLoading(false);
                return;
            }

            router.post(route('campaigns.bulk-disable'), { campaign_ids: disableCampaignIds }, {
                onSuccess: () => {
                    toast.success(t('campaigns.allCampaignsDisabledSuccessfully', { count: disableCampaignIds.length }));
                    setIsLoading(false);
                },
                onError: () => {
                    toast.error(t('campaigns.errorBulkDisabling'));
                    setIsLoading(false);
                }
            });
        }
    };

    // Disable birthday campaigns
    const disableBirthdayCampaigns = () => {
        if (window.confirm(t('campaigns.confirmDisableBirthday'))) {
            setIsLoading(true);

            // Filter birthday campaigns
            // Assuming birthday campaigns have "birthday" or "anniversaire" in their name or message content
            const birthdayCampaignIds = campaigns.data
                .filter(campaign => {
                    const nameIncludes = campaign.name.toLowerCase().includes('birthday') ||
                        campaign.name.toLowerCase().includes('anniversaire');
                    const messageIncludes = campaign.message_content &&
                        (campaign.message_content.toLowerCase().includes('birthday') ||
                            campaign.message_content.toLowerCase().includes('anniversaire'));
                    const canBeDisabled = !['sent', 'sending', 'partially_sent'].includes(campaign.status);

                    return (nameIncludes || messageIncludes) && canBeDisabled;
                })
                .map(campaign => campaign.id);

            if (birthdayCampaignIds.length === 0) {
                toast.info(t('campaigns.noBirthdayCampaigns'));
                setIsLoading(false);
                return;
            }

            router.post(route('campaigns.bulk-disable'), { campaign_ids: birthdayCampaignIds }, {
                onSuccess: () => {
                    toast.success(t('campaigns.birthdayCampaignsDisabledSuccessfully', { count: birthdayCampaignIds.length }));
                    setIsLoading(false);
                },
                onError: () => {
                    toast.error(t('campaigns.errorDisablingBirthday'));
                    setIsLoading(false);
                }
            });
        }
    };

    // Handle drag and drop for calendar events
    const handleEventDrop = (event: any) => {
        // Check if campaign is already sent
        if (['sent', 'sending', 'partially_sent'].includes(event.campaign.status)) {
            toast.error(t('campaigns.cannotRescheduleSentCampaign'));
            return;
        }

        setIsLoading(true);

        const { campaign, start } = event;

        // API call to update scheduled date
        router.put(route('campaigns.reschedule', campaign.id), {
            scheduled_at: moment(start).format('YYYY-MM-DD HH:mm:ss')
        }, {
            onSuccess: () => {
                toast.success(t('campaigns.rescheduledSuccessfully', {
                    name: campaign.name,
                    date: moment(start).format('DD/MM/YYYY HH:mm')
                }));
                setIsLoading(false);
            },
            onError: () => {
                toast.error(t('campaigns.errorRescheduling'));
                setIsLoading(false);
            }
        });
    };

    // Handle event selection
    const handleSelectEvent = (event: any) => {
        if (selectionMode) {
            handleCampaignSelection(event.campaign.id);
        } else {
            setSelectedEvent(event);
            setShowEventDetailsModal(true);
        }
    };

    // Handle selecting a date or slot
    const handleSelectSlot = (slotInfo: SlotInfo) => {
        // Don't open creation modal in selection mode
        if (selectionMode) {
            return;
        }

        // Set date for quick-add modal
        setQuickAddForm({
            ...quickAddForm,
            scheduled_at: moment(slotInfo.start).format('YYYY-MM-DDTHH:mm')
        });
        setShowQuickAddModal(true);
    };

    // Create a new campaign
    const handleCreateCampaign = () => {
        if (!newCampaignData.name) {
            toast.error(t('campaigns.nameRequired'));
            return;
        }

        setIsLoading(true);

        axios.post(route('campaigns.store'), newCampaignData)
            .then(() => {
                toast.success(t('campaigns.createdSuccessfully', { name: newCampaignData.name }));
                setIsLoading(false);
                setShowCreateModal(false);

                // Reset form
                setNewCampaignData({
                    name: '',
                    subject: '',
                    scheduled_at: moment().add(1, 'day').format('YYYY-MM-DDTHH:mm')
                });

                // Refresh the campaigns list
                get(route('campaigns.index'), {
                    preserveState: true,
                    only: ['campaigns']
                });
            })
            .catch(err => {
                const errorMessage = err.response?.data?.message || t('campaigns.errorCreating');
                toast.error(errorMessage);
                setIsLoading(false);
            });
    };

    // Custom event component for the calendar
    const EventComponent = ({ event, ...props }: any) => {
        const campaign = event.campaign;
        const handleClick = (e: React.MouseEvent) => {
            if (selectionMode) {
                handleCampaignSelection(campaign.id, e);
            } else {
                e.stopPropagation();
                setSelectedEvent(event);
                setShowEventDetailsModal(true);
                setEventDetailsPosition({
                    top: e.clientY,
                    left: e.clientX
                });
            }
        };

        // Extraire les propriétés non-standard pour éviter les avertissements React
        const domProps = { ...props };
        delete domProps.slotEnd;
        delete domProps.slotStart;
        delete domProps.isAllDay;
        delete domProps.continuesPrior;
        delete domProps.continuesAfter;

        // Configure drag-and-drop for movable events
        const isDraggable = campaign.status === 'draft' || campaign.status === 'scheduled' || campaign.status === 'paused';
        const isSelected = selectedCampaignIds.includes(campaign.id);

        // Classes Tailwind pour les couleurs d'état
        const getStatusBgClass = () => {
            switch (campaign.status) {
                case 'draft': return 'bg-gray-400';
                case 'scheduled': return 'bg-blue-500';
                case 'sending': return 'bg-purple-500';
                case 'sent': return 'bg-green-500';
                case 'partially_sent': return 'bg-yellow-500';
                case 'paused': return 'bg-yellow-400';
                case 'failed': return 'bg-red-500';
                case 'cancelled': return 'bg-gray-500';
                default: return 'bg-gray-300';
            }
        };

        return (
            <div
                onClick={handleClick}
                className={`${getStatusBgClass()} rounded text-white px-1 py-0.5 text-xs truncate cursor-pointer ${isSelected ? 'border-2 border-white' : 'border border-opacity-10 border-black'
                    } ${isDraggable ? 'opacity-100' : 'opacity-80'} relative`}
                title={isDraggable ? t('campaigns.dragToReschedule') : ''}
                {...domProps}
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

                {/* Visual indicator for movable campaigns */}
                {isDraggable && (
                    <div className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-white border border-gray-300"></div>
                )}

                <div className="flex items-center">
                    {getStatusIcon(campaign.status)}
                    <span className="ml-1 font-medium">{campaign.name}</span>
                </div>
                {calendarView !== Views.MONTH && (
                    <div className="text-[10px]">
                        {campaign.recipients_count} {t('campaigns.recipients')}
                    </div>
                )}
            </div>
        );
    };

    // Event Wrapper component to filter props
    const EventWrapper = ({ event, children }: any) => {
        // Instead of explicitly trying to remove specific props,
        // let's extract only the safe DOM props that we want to keep
        // and create a clean props object for the DOM element
        const child = React.Children.only(children);

        // Create a new clean props object
        const cleanProps = {
            className: child.props.className,
            style: child.props.style,
            onClick: child.props.onClick,
            onDoubleClick: child.props.onDoubleClick,
            // Add any other standard DOM props you want to keep
        };

        // Clone the element with only the clean props
        return React.cloneElement(child, cleanProps);
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={

                <div className="p-4 border-b bg-card">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="mr-2"
                            >
                                {sidebarOpen ? <PanelRightClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
                            </Button>

                            <h1 className="text-xl font-semibold">{t('common.campaigns')}</h1>

                            <div className="ml-4 flex items-center">
                                <Tabs
                                    value={viewMode}
                                    onValueChange={(value) => setViewMode(value as 'calendar' | 'grid')}
                                    className="w-auto"
                                >
                                    <TabsList className="grid w-auto grid-cols-2">
                                        <TabsTrigger value="calendar" className="px-3">
                                            <CalendarIcon className="h-4 w-4 mr-2" />
                                            <span className="hidden sm:inline">{t('campaigns.calendar')}</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="grid" className="px-3">
                                            <Grid className="h-4 w-4 mr-2" />
                                            <span className="hidden sm:inline">{t('campaigns.grid')}</span>
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                            <div className="relative w-full sm:w-auto" ref={searchRef}>
                                <form onSubmit={handleSearch}>
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder={t('common.searchCampaigns')}
                                        value={searchTerm}
                                        onChange={handleSearchChange}
                                        className="pl-9 w-full sm:w-[200px] md:w-[300px]"
                                    />
                                </form>

                                {/* Search results dropdown */}
                                {showSearchResults && searchResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-popover rounded-md border shadow-md z-10 max-h-64 overflow-y-auto">
                                        {searchResults.map(campaign => (
                                            <Link
                                                key={campaign.id}
                                                href={route('campaigns.show', campaign.id)}
                                                className="flex items-center p-3 hover:bg-muted border-b last:border-b-0"
                                            >
                                                <div
                                                    className="h-3 w-3 rounded-full mr-3 flex-shrink-0"
                                                    style={{ backgroundColor: getStatusColor(campaign.status) }}
                                                ></div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="font-medium truncate">{campaign.name}</div>
                                                    {campaign.message_content && (
                                                        <div className="text-xs text-muted-foreground truncate">{campaign.message_content.substring(0, 50)}{campaign.message_content.length > 50 ? '...' : ''}</div>
                                                    )}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {campaign.scheduled_at ? formatDate(campaign.scheduled_at) : '-'}
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}

                                {showSearchResults && searchResults.length === 0 && searchTerm.length >= 2 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-popover rounded-md border shadow-md z-10 p-4 text-center text-muted-foreground">
                                        {t('campaigns.noSearchResults')}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            {!selectionMode ? (
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={toggleSelectionMode}
                                    >
                                        <CheckSquare className="h-4 w-4 mr-2" />
                                        <span>{t('campaigns.selectMode')}</span>
                                    </Button>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 text-indigo-700 border-indigo-200 hover:from-indigo-500/20 hover:via-purple-500/20 hover:to-pink-500/20 hover:text-indigo-800 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 dark:text-indigo-400 dark:border-indigo-800/30 dark:hover:from-indigo-900/30 dark:hover:via-purple-900/30 dark:hover:to-pink-900/30"
                                            >
                                                <Zap className="h-4 w-4 mr-2" />
                                                <span>{t('campaigns.quickActions')}</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={enableAllUpcomingCampaigns}>
                                                <PlayCircle className="mr-2 h-4 w-4 text-green-500" />
                                                <span>{t('campaigns.enableAllUpcoming')}</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={disableAllCampaigns}>
                                                <PauseCircle className="mr-2 h-4 w-4 text-yellow-500" />
                                                <span>{t('campaigns.disableAllCampaigns')}</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={disableBirthdayCampaigns}>
                                                <Gift className="mr-2 h-4 w-4 text-orange-500" />
                                                <span>{t('campaigns.disableBirthdayCampaigns')}</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowQuickAddModal(true)}
                                        className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-700 border-green-200 hover:from-green-500/20 hover:to-emerald-500/20 hover:text-green-800"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        <span>{t('campaigns.quickAdd')}</span>
                                    </Button>

                                    <Link href={route('campaigns.create')}>
                                        <Button className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:shadow-md transition-all duration-200">
                                            <CalendarAdd className="h-4 w-4 mr-2" />
                                            <span>{t('campaigns.create')}</span>
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline">
                                        {selectedCampaignIds.length} {t('campaigns.selected')}
                                    </Badge>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={selectedCampaignIds.length === 0}
                                            >
                                                <MoreHorizontal className="h-4 w-4 mr-2" />
                                                <span>{t('campaigns.actions')}</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onClick={selectAllCampaigns}>
                                                <CheckSquare className="mr-2 h-4 w-4" />
                                                <span>{t('campaigns.selectAll')}</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={deselectAllCampaigns}>
                                                <Square className="mr-2 h-4 w-4" />
                                                <span>{t('campaigns.deselectAll')}</span>
                                            </DropdownMenuItem>
                                            <Separator />
                                            <DropdownMenuItem onClick={bulkDisableCampaigns}>
                                                <PauseCircle className="mr-2 h-4 w-4 text-yellow-500" />
                                                <span>{t('campaigns.pauseSelected')}</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={bulkEnableCampaigns}>
                                                <PlayCircle className="mr-2 h-4 w-4 text-green-500" />
                                                <span>{t('campaigns.enableSelected')}</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={bulkDeleteCampaigns}
                                                className="text-destructive focus:text-destructive"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                <span>{t('campaigns.deleteSelected')}</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={toggleSelectionMode}
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        <span>{t('campaigns.cancel')}</span>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Calendar control header */}
                    {viewMode === 'calendar' && (
                        <div className="flex flex-wrap justify-between items-center mt-4 gap-2">
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigateCalendar('TODAY')}
                                    className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 hover:from-indigo-500/20 hover:via-purple-500/20 hover:to-pink-500/20"
                                >
                                    {t('campaigns.today')}
                                </Button>

                                <div className="flex items-center">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => navigateCalendar('PREV')}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => navigateCalendar('NEXT')}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>

                                    <span className="ml-3 text-base font-medium">
                                        {currentMonth}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center">
                                <Tabs
                                    value={calendarView}
                                    onValueChange={handleViewChange}
                                    className="w-auto"
                                >
                                    <TabsList className="grid grid-cols-3">
                                        <TabsTrigger value={Views.MONTH} className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500/10 data-[state=active]:via-purple-500/10 data-[state=active]:to-pink-500/10 data-[state=active]:text-indigo-600 dark:data-[state=active]:from-indigo-900/30 dark:data-[state=active]:via-purple-900/30 dark:data-[state=active]:to-pink-900/30 dark:data-[state=active]:text-indigo-400">{t('campaigns.month')}</TabsTrigger>
                                        <TabsTrigger value={Views.WEEK} className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500/10 data-[state=active]:via-purple-500/10 data-[state=active]:to-pink-500/10 data-[state=active]:text-indigo-600 dark:data-[state=active]:from-indigo-900/30 dark:data-[state=active]:via-purple-900/30 dark:data-[state=active]:to-pink-900/30 dark:data-[state=active]:text-indigo-400">{t('campaigns.week')}</TabsTrigger>
                                        <TabsTrigger value={Views.MONTH}>{t('campaigns.month')}</TabsTrigger>
                                        <TabsTrigger value={Views.WEEK}>{t('campaigns.week')}</TabsTrigger>
                                        <TabsTrigger value={Views.DAY}>{t('campaigns.day')}</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>
                        </div>
                    )}
                </div>

            }
        >
            <Head title={t('common.campaigns')} />

            <div className="flex h-screen overflow-hidden bg-background">
                {/* Main Content */}
                <div className="flex flex-col w-full">
                    {/* Header */}

                    <div className="flex flex-1 overflow-hidden pt-0">
                        {/* Sidebar with animation */}
                        <AnimatePresence mode="wait" initial={false}>
                            {sidebarOpen && (
                                <motion.div
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: 256, opacity: 1 }}
                                    exit={{ width: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="border-r border-border bg-card overflow-hidden"
                                >
                                    <ScrollArea className="h-full px-4 py-4">
                                        {/* Mini Calendar */}
                                        <Card className="mb-4">
                                            <CardHeader className="pb-2">
                                                <div className="flex items-center justify-between">
                                                    <CardTitle className="text-sm font-medium">
                                                        {moment(selectedDate).format('MMMM YYYY')}
                                                    </CardTitle>
                                                    <div className="flex">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => {
                                                                const newDate = moment(selectedDate).subtract(1, 'month').toDate();
                                                                setSelectedDate(newDate);
                                                                updateCurrentMonth(newDate);
                                                            }}
                                                            className="h-7 w-7"
                                                        >
                                                            <ChevronLeft className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => {
                                                                const newDate = moment(selectedDate).add(1, 'month').toDate();
                                                                setSelectedDate(newDate);
                                                                updateCurrentMonth(newDate);
                                                            }}
                                                            className="h-7 w-7"
                                                        >
                                                            <ChevronRight className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="px-2 pb-2">
                                                {/* Mini-calendrier */}
                                                <div className="text-xs">
                                                    {/* Jours de la semaine */}
                                                    <div className="grid grid-cols-7 text-center font-medium text-muted-foreground mb-1">
                                                        {['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map((day, i) => (
                                                            <div key={i} className="py-1">
                                                                {day}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Jours du mois */}
                                                    <div className="grid grid-cols-7 text-center">
                                                        {(() => {
                                                            // Générer les jours du mois pour le mini-calendrier
                                                            const date = moment(selectedDate);
                                                            const firstDay = moment(date).startOf('month');
                                                            const lastDay = moment(date).endOf('month');
                                                            const daysInMonth = date.daysInMonth();

                                                            // Décalage pour commencer le 1er jour au bon endroit (0 = lundi, 6 = dimanche)
                                                            const firstDayOfWeek = (firstDay.day() + 6) % 7; // Ajuste pour que lundi soit le premier jour

                                                            // Tableau contenant tous les jours à afficher
                                                            const days = [];

                                                            // Jours du mois précédent
                                                            for (let i = 0; i < firstDayOfWeek; i++) {
                                                                const prevMonthDay = moment(firstDay).subtract(firstDayOfWeek - i, 'days');
                                                                days.push({
                                                                    day: prevMonthDay.date(),
                                                                    inMonth: false,
                                                                    date: prevMonthDay.toDate(),
                                                                    isToday: prevMonthDay.isSame(moment(), 'day')
                                                                });
                                                            }

                                                            // Jours du mois courant
                                                            for (let i = 1; i <= daysInMonth; i++) {
                                                                const currentDate = moment(firstDay).date(i);
                                                                days.push({
                                                                    day: i,
                                                                    inMonth: true,
                                                                    date: currentDate.toDate(),
                                                                    isToday: currentDate.isSame(moment(), 'day'),
                                                                    hasEvents: calendarEvents.some(event =>
                                                                        moment(event.start).isSame(currentDate, 'day')
                                                                    )
                                                                });
                                                            }

                                                            // Jours du mois suivant pour compléter les 6 semaines (42 jours)
                                                            const remainingDays = 42 - days.length;
                                                            for (let i = 1; i <= remainingDays; i++) {
                                                                const nextMonthDay = moment(lastDay).add(i, 'days');
                                                                days.push({
                                                                    day: i,
                                                                    inMonth: false,
                                                                    date: nextMonthDay.toDate(),
                                                                    isToday: nextMonthDay.isSame(moment(), 'day')
                                                                });
                                                            }

                                                            return days.map((day, i) => (
                                                                <div
                                                                    key={i}
                                                                    className={`py-1 cursor-pointer rounded-full hover:bg-muted ${!day.inMonth ? 'text-muted-foreground opacity-40' : ''
                                                                        } ${day.isToday ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''
                                                                        } ${day.hasEvents && !day.isToday ? 'font-medium text-blue-600 dark:text-blue-400' : ''
                                                                        }`}
                                                                    onClick={() => {
                                                                        setSelectedDate(day.date);
                                                                        updateCurrentMonth(day.date);
                                                                    }}
                                                                >
                                                                    {day.day}
                                                                    {day.hasEvents && !day.isToday && (
                                                                        <div className="h-1 w-1 bg-blue-500 rounded-full mx-auto mt-0.5"></div>
                                                                    )}
                                                                </div>
                                                            ));
                                                        })()}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Status filters */}
                                        <div className="space-y-1 mb-4">
                                            <h3 className="px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                {t('campaigns.filterByStatus')}
                                            </h3>

                                            <button
                                                onClick={() => setFilterData('statusFilter', 'all')}
                                                className={`flex items-center w-full px-3 py-2 text-sm rounded-md ${filterData.statusFilter === 'all'
                                                    ? 'bg-primary/10 text-primary font-medium'
                                                    : 'text-foreground hover:bg-muted'}`}
                                            >
                                                <Filter className="h-4 w-4 mr-3 text-muted-foreground" />
                                                <span>{t('campaigns.status.all')}</span>
                                                <Badge variant="outline" className="ml-auto">
                                                    {campaigns.data.length}
                                                </Badge>
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
                                                    onClick={() => {
                                                        setFilterData('statusFilter', status);
                                                        get(route('campaigns.index'), {
                                                            preserveState: true,
                                                            replace: true,
                                                        });
                                                    }}
                                                    className={`flex items-center w-full px-3 py-2 text-sm rounded-md ${filterData.statusFilter === status
                                                        ? 'bg-primary/10 text-primary font-medium'
                                                        : 'text-foreground hover:bg-muted'}`}
                                                >
                                                    <div
                                                        className="h-3 w-3 rounded-full mr-3"
                                                        style={{ backgroundColor: getStatusColor(status) }}
                                                    ></div>
                                                    <span>{label}</span>
                                                    <Badge variant="outline" className="ml-auto">
                                                        {campaignsByStatus[status]?.length || 0}
                                                    </Badge>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Today's campaigns */}
                                        <div className="mt-6">
                                            <h3 className="px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                {t('campaigns.today')}
                                            </h3>

                                            {todayCampaigns.length > 0 ? (
                                                <div className="space-y-1">
                                                    {todayCampaigns.map(campaign => (
                                                        <Link
                                                            key={campaign.id}
                                                            href={route('campaigns.show', campaign.id)}
                                                            className="flex items-center px-3 py-1.5 text-sm rounded-md text-foreground hover:bg-muted"
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
                                                <div className="px-3 py-2 text-sm text-muted-foreground">
                                                    {t('campaigns.noCampaignsToday')}
                                                </div>
                                            )}
                                        </div>

                                        {/* Upcoming campaigns */}
                                        <div className="mt-4">
                                            <h3 className="px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                {t('campaigns.upcoming')}
                                            </h3>

                                            {upcomingCampaigns.length > 0 ? (
                                                <div className="space-y-1">
                                                    {upcomingCampaigns.map(campaign => (
                                                        <Link
                                                            key={campaign.id}
                                                            href={route('campaigns.show', campaign.id)}
                                                            className="flex items-center px-3 py-1.5 text-sm rounded-md text-foreground hover:bg-muted"
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
                                                <div className="px-3 py-2 text-sm text-muted-foreground">
                                                    {t('campaigns.noUpcomingCampaigns')}
                                                </div>
                                            )}
                                        </div>

                                        {/* Tags Section */}
                                        <div className="mt-6">
                                            <h3 className="px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                {t('common.tags')}
                                            </h3>

                                            {tags.length > 0 ? (
                                                <div className="space-y-1">
                                                    {tags.map(tag => (
                                                        <div
                                                            key={tag.id}
                                                            className="flex items-center px-3 py-1.5 text-sm rounded-md text-foreground hover:bg-muted group"
                                                        >
                                                            <TagIcon className="h-3 w-3 mr-3 text-muted-foreground" />
                                                            <span className="truncate flex-1">{tag.name}</span>
                                                            <Badge variant="outline" className="ml-2">
                                                                {tag.clients_count}
                                                            </Badge>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 p-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={() => {
                                                                    setQuickAddForm({
                                                                        ...quickAddForm,
                                                                        tag_id: tag.id.toString()
                                                                    });
                                                                    setShowQuickAddModal(true);
                                                                }}
                                                                title={t('campaigns.createCampaignWithTag', { tag: tag.name })}
                                                            >
                                                                <Plus className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="px-3 py-2 text-sm text-muted-foreground">
                                                    {t('campaigns.noTags')}
                                                </div>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Main Content Area with flex-grow */}
                        <div className="flex-1 overflow-auto">
                            {/* Content based on view mode */}
                            {viewMode === 'calendar' ? (
                                <div className="h-full p-4">
                                    <div className="bg-card h-full rounded-lg shadow-sm overflow-hidden border">
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
                                            style={{ height: 'calc(100vh - 190px)' }}
                                            className="custom-calendar h-[calc(100vh-190px)]"
                                            components={{
                                                event: EventComponent,
                                                eventWrapper: EventWrapper,
                                                toolbar: () => null // Remove default toolbar
                                            }}
                                            onSelectEvent={handleSelectEvent}
                                            onSelectSlot={handleSelectSlot}
                                            selectable={true}
                                            eventPropGetter={(event) => ({
                                                className: 'rounded overflow-hidden'
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
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                                    <AnimatePresence>
                                        {filteredCampaigns.length > 0 ? (
                                            filteredCampaigns.map(campaign => (
                                                <motion.div
                                                    key={campaign.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    transition={{ duration: 0.2 }}
                                                    className={selectionMode ? 'cursor-pointer' : ''}
                                                    onClick={() => selectionMode && handleCampaignSelection(campaign.id)}
                                                >
                                                    <Card className="h-full">
                                                        <CardHeader className="pb-2 relative">
                                                            {selectionMode && (
                                                                <div
                                                                    className="absolute right-4 top-4"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleCampaignSelection(campaign.id);
                                                                    }}
                                                                >
                                                                    {selectedCampaignIds.includes(campaign.id) ? (
                                                                        <CheckSquare className="h-5 w-5 text-primary" />
                                                                    ) : (
                                                                        <Square className="h-5 w-5 text-muted-foreground" />
                                                                    )}
                                                                </div>
                                                            )}

                                                            <CardTitle className="text-base truncate pr-8">
                                                                {campaign.name}
                                                            </CardTitle>

                                                            <Badge
                                                                variant={getStatusVariant(campaign.status) as any}
                                                                className="mt-1 flex w-fit items-center gap-1"
                                                            >
                                                                {getStatusIcon(campaign.status)}
                                                                <span>{getStatusName(campaign.status)}</span>
                                                            </Badge>
                                                        </CardHeader>

                                                        <CardContent className="pb-2">
                                                            {campaign.message_content && (
                                                                <p className="text-sm text-muted-foreground mb-2 truncate">
                                                                    {campaign.message_content.substring(0, 50)}{campaign.message_content.length > 50 ? '...' : ''}
                                                                </p>
                                                            )}

                                                            <div className="space-y-1 text-sm">
                                                                <div className="flex items-center text-muted-foreground">
                                                                    <Clock className="h-3.5 w-3.5 mr-1.5" />
                                                                    <span className="truncate">{formatDate(campaign.scheduled_at)}</span>
                                                                </div>
                                                                <div className="flex items-center text-muted-foreground">
                                                                    <Users className="h-3.5 w-3.5 mr-1.5" />
                                                                    <span>{campaign.recipients_count} {t('campaigns.recipients')}</span>
                                                                </div>
                                                            </div>
                                                        </CardContent>

                                                        {!selectionMode && (
                                                            <CardFooter className="pt-1 pb-3 flex justify-between gap-2">
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Link href={route('campaigns.show', campaign.id)}>
                                                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                                    <Eye className="h-4 w-4" />
                                                                                    <span className="sr-only">{t('common.view')}</span>
                                                                                </Button>
                                                                            </Link>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>{t('common.view')}</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>

                                                                {campaign.status !== 'sent' && (
                                                                    <TooltipProvider>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Link href={route('campaigns.edit', campaign.id)}>
                                                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                                        <Settings className="h-4 w-4" />
                                                                                        <span className="sr-only">{t('common.edit')}</span>
                                                                                    </Button>
                                                                                </Link>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>
                                                                                <p>{t('common.edit')}</p>
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    </TooltipProvider>
                                                                )}

                                                                {!['sent', 'sending', 'partially_sent'].includes(campaign.status) && (
                                                                    <TooltipProvider>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleDeleteCampaign(campaign);
                                                                                    }}
                                                                                >
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                    <span className="sr-only">{t('common.delete')}</span>
                                                                                </Button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>
                                                                                <p>{t('common.delete')}</p>
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    </TooltipProvider>
                                                                )}
                                                            </CardFooter>
                                                        )}
                                                    </Card>
                                                </motion.div>
                                            ))
                                        ) : (
                                            <motion.div
                                                className="col-span-full"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <Card className="p-6 text-center">
                                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                                                        <CalendarIcon className="h-6 w-6 text-muted-foreground" />
                                                    </div>
                                                    <CardTitle className="text-lg mb-2">{t('campaigns.noCampaignsFound')}</CardTitle>
                                                    <p className="text-muted-foreground mb-6">{t('campaigns.startByCreatingCampaign')}</p>
                                                    <div className="flex justify-center">
                                                        <Button onClick={() => setShowQuickAddModal(true)}>
                                                            <Plus className="h-4 w-4 mr-2" />
                                                            {t('campaigns.createCampaign')}
                                                        </Button>
                                                    </div>
                                                </Card>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Modals - maintenant directement intégrés comme dans ClientsIndex */}
                {/* Event Details Dialog */}
                <Dialog open={showEventDetailsModal} onOpenChange={setShowEventDetailsModal}>
                    <DialogContent className="sm:max-w-md">
                        {selectedEvent && (
                            <>
                                <DialogHeader>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="h-4 w-4 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: getStatusColor(selectedEvent.campaign.status) }}
                                        ></div>
                                        <DialogTitle className="text-lg font-semibold">{selectedEvent.campaign.name}</DialogTitle>
                                    </div>
                                    <DialogDescription className="mt-1.5">
                                        {selectedEvent.campaign.message_content && <p className="text-sm mb-2">{selectedEvent.campaign.message_content.substring(0, 50)}{selectedEvent.campaign.message_content.length > 50 ? '...' : ''}</p>}
                                        <Badge
                                            variant={getStatusVariant(selectedEvent.campaign.status) as any}
                                            className="flex w-fit items-center gap-1"
                                        >
                                            {getStatusIcon(selectedEvent.campaign.status)}
                                            <span>{getStatusName(selectedEvent.campaign.status)}</span>
                                        </Badge>
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4 mt-2">
                                    <div className="bg-muted/30 rounded-lg p-4 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            {selectedEvent.campaign.scheduled_at && (
                                                <div>
                                                    <p className="text-xs text-muted-foreground">{t('campaigns.scheduledAt')}</p>
                                                    <div className="flex items-center mt-1">
                                                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                                        <span className="font-medium">{formatDate(selectedEvent.campaign.scheduled_at)}</span>
                                                    </div>
                                                </div>
                                            )}

                                            <div>
                                                <p className="text-xs text-muted-foreground">{t('campaigns.recipients')}</p>
                                                <div className="flex items-center mt-1">
                                                    <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                                                    <span className="font-medium">{selectedEvent.campaign.recipients_count} {t('common.clients')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {selectedEvent.campaign.status === 'sent' && (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">{t('campaigns.progress')}</p>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs text-muted-foreground">
                                                        {t('campaigns.delivered')}
                                                    </span>
                                                    <span className="text-xs font-medium">
                                                        {Math.round((selectedEvent.campaign.delivered_count / selectedEvent.campaign.recipients_count) * 100)}%
                                                    </span>
                                                </div>
                                                <div className="h-2 w-full rounded-full bg-muted">
                                                    <div
                                                        className="h-2 rounded-full bg-green-500"
                                                        style={{
                                                            width: `${Math.min((selectedEvent.campaign.delivered_count / selectedEvent.campaign.recipients_count) * 100, 100)}%`
                                                        }}
                                                    ></div>
                                                </div>
                                                <div className="mt-1 text-xs text-muted-foreground">
                                                    {selectedEvent.campaign.delivered_count} {t('campaigns.delivered')}, {selectedEvent.campaign.failed_count} {t('campaigns.failed')}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
                                    <Link href={route('campaigns.show', selectedEvent.campaign.id)} className="w-full sm:w-auto">
                                        <Button variant="outline" className="w-full">
                                            <Eye className="h-4 w-4 mr-2" />
                                            {t('common.details')}
                                        </Button>
                                    </Link>

                                    {selectedEvent.campaign.status !== 'sent' && (
                                        <Link href={route('campaigns.edit', selectedEvent.campaign.id)} className="w-full sm:w-auto">
                                            <Button className="w-full">
                                                <Settings className="h-4 w-4 mr-2" />
                                                {t('common.edit')}
                                            </Button>
                                        </Link>
                                    )}

                                    {!['sent', 'sending', 'partially_sent'].includes(selectedEvent.campaign.status) && (
                                        !(selectedEvent.campaign.scheduled_at && new Date(selectedEvent.campaign.scheduled_at) < new Date() && selectedEvent.campaign.status !== 'draft') && (
                                            <Button
                                                variant="destructive"
                                                onClick={() => handleDeleteCampaign(selectedEvent.campaign)}
                                                className="w-full sm:w-auto"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                {t('common.delete')}
                                            </Button>
                                        )
                                    )}
                                </DialogFooter>
                            </>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Quick Add Form Dialog */}
                <Dialog open={showQuickAddModal} onOpenChange={setShowQuickAddModal}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{t('campaigns.quickAdd')}</DialogTitle>
                            <DialogDescription>
                                {t('campaigns.quickAddDescription')}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="name" className="font-medium">{t('campaigns.name')} *</Label>
                                    <Input
                                        id="name"
                                        value={quickAddForm.name}
                                        onChange={(e) => setQuickAddForm({ ...quickAddForm, name: e.target.value })}
                                        placeholder={t('campaigns.namePlaceholder')}
                                        className="mt-1.5"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="subject" className="font-medium">{t('campaigns.subject')}</Label>
                                    <Input
                                        id="subject"
                                        value={quickAddForm.subject}
                                        onChange={(e) => setQuickAddForm({ ...quickAddForm, subject: e.target.value })}
                                        placeholder={t('campaigns.subjectPlaceholder')}
                                        className="mt-1.5"
                                    />
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <Label htmlFor="message_content" className="font-medium">{t('campaigns.messageContent')} *</Label>
                                <Textarea
                                    id="message_content"
                                    value={quickAddForm.message_content}
                                    onChange={(e) => setQuickAddForm({ ...quickAddForm, message_content: e.target.value })}
                                    placeholder={t('campaigns.messagePlaceholder')}
                                    className="mt-1.5"
                                    rows={5}
                                />
                            </div>

                            <Separator />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="tag_id" className="font-medium">{t('campaigns.selectTag')} *</Label>
                                    <Select
                                        value={quickAddForm.tag_id}
                                        onValueChange={(value) => setQuickAddForm({ ...quickAddForm, tag_id: value })}
                                    >
                                        <SelectTrigger className="mt-1.5">
                                            <SelectValue placeholder={t('campaigns.selectTagPlaceholder')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {tags.map((tag) => (
                                                <SelectItem key={tag.id} value={tag.id.toString()}>
                                                    <div className="flex items-center">
                                                        <span>{tag.name}</span>
                                                        <Badge variant="outline" className="ml-2">
                                                            {tag.clients_count}
                                                        </Badge>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {quickAddForm.tag_id && (
                                        <div className="flex items-center mt-2 text-sm text-muted-foreground">
                                            <Info className="h-4 w-4 mr-1" />
                                            <span>
                                                {t('campaigns.willSendTo', {
                                                    count: getClientCount(quickAddForm.tag_id),
                                                    tag: getTagName(quickAddForm.tag_id)
                                                })}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="scheduled_at" className="font-medium">{t('campaigns.scheduledAt')}</Label>
                                    <Input
                                        id="scheduled_at"
                                        type="datetime-local"
                                        value={quickAddForm.scheduled_at}
                                        onChange={(e) => setQuickAddForm({ ...quickAddForm, scheduled_at: e.target.value })}
                                        className="mt-1.5"
                                    />

                                    <div className="flex items-center space-x-2 mt-3">
                                        <Checkbox
                                            id="send_now"
                                            checked={quickAddForm.send_now}
                                            onCheckedChange={(checked) => setQuickAddForm({ ...quickAddForm, send_now: checked as boolean })}
                                        />
                                        <Label htmlFor="send_now" className="cursor-pointer text-sm">
                                            {t('campaigns.sendImmediately')}
                                        </Label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setShowQuickAddModal(false)}
                            >
                                {t('common.cancel')}
                            </Button>
                            <Button
                                onClick={handleQuickAdd}
                                disabled={isLoading || !quickAddForm.name || !quickAddForm.message_content || !quickAddForm.tag_id}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                                        {t('common.processing')}
                                    </>
                                ) : (
                                    <>
                                        <ArrowRight className="h-4 w-4 mr-2" />
                                        {t('campaigns.createQuickly')}
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Loading Overlay */}
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"
                    >
                        <div className="bg-card rounded-lg shadow-lg p-6 flex items-center space-x-4">
                            <Loader className="h-6 w-6 animate-spin text-primary" />
                            <span className="font-medium">{t('common.loading')}</span>
                        </div>
                    </motion.div>
                )}

                {/* Floating Action Button for mobile */}
                <div className="md:hidden fixed right-4 bottom-4">
                    <Button size="icon" className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:shadow-xl transition-all duration-200" onClick={() => setShowQuickAddModal(true)}>
                        <Plus className="h-6 w-6" />
                    </Button>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
