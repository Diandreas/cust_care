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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
    Gift,
    BarChart3,
    TrendingUp,
    Target,
    DollarSign,
    Percent,
    MousePointer,
    Heart,
    Globe
} from 'lucide-react';

// Import modular components
import Sidebar from '@/Components/Campaigns/Sidebar';
import CalendarView from '@/Components/Campaigns/CalendarView';
import GridView from '@/Components/Campaigns/GridView';
import Modals from '@/Components/Campaigns/Modals';

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
    const [calendarView, setCalendarView] = useState<any>(Views.MONTH);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [selectedTag, setSelectedTag] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
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

    // Filtrage des campagnes
    const filteredCampaigns = useMemo(() => {
        let filtered = campaigns.data;

        if (searchTerm) {
            filtered = filtered.filter(campaign =>
                campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (campaign.message_content && campaign.message_content.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        if (selectedStatus !== 'all') {
            filtered = filtered.filter(campaign => campaign.status === selectedStatus);
        }

        if (selectedTag !== 'all') {
            filtered = filtered.filter(campaign =>
                campaign.tag_id && campaign.tag_id.toString() === selectedTag
            );
        }

        return filtered;
    }, [campaigns.data, searchTerm, selectedStatus, selectedTag]);

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

                // Réinitialiser le formulaire
                setQuickAddForm({
                    name: '',
                    subject: '',
                    message_content: '',
                    scheduled_at: moment().add(1, 'day').format('YYYY-MM-DDTHH:mm'),
                    tag_id: '',
                    send_now: false
                });

                // Actualiser les données sans recharger la page
                router.reload({ only: ['campaigns'] });
            })
            .catch(error => {
                console.error('Erreur lors de l\'ajout rapide', error);
                setIsLoading(false);

                // Extraire le message d'erreur de différentes sources possibles
                let errorMessage = t('campaigns.quickAddError');

                if (error.response?.data?.message) {
                    errorMessage = error.response.data.message;
                } else if (error.response?.data?.error) {
                    errorMessage = error.response.data.error;
                } else if (error.message) {
                    errorMessage = error.message;
                }

                toast.error(errorMessage);
            });
    };

    // Regrouper les campagnes par statut pour les stats
    const campaignsByStatus = useMemo(() => {
        return campaigns.data.reduce((acc, campaign) => {
            if (!acc[campaign.status]) {
                acc[campaign.status] = [];
            }
            acc[campaign.status].push(campaign);
            return acc;
        }, {} as { [key: string]: Campaign[] });
    }, [campaigns.data]);

    // Fonctions d'aide pour les status
    const getStatusColor = (status: string) => {
        const colors = {
            draft: '#6B7280',
            scheduled: '#F59E0B',
            sent: '#10B981',
            failed: '#EF4444',
            sending: '#3B82F6',
            partially_sent: '#F59E0B'
        };
        return colors[status as keyof typeof colors] || '#6B7280';
    };

    const getStatusVariant = (status: string) => {
        const variants = {
            draft: 'secondary',
            scheduled: 'outline',
            sent: 'default',
            failed: 'destructive',
            sending: 'default',
            partially_sent: 'outline'
        };
        return variants[status as keyof typeof variants] || 'secondary';
    };

    const getStatusIcon = (status: string) => {
        const icons = {
            draft: <Mail className="h-3 w-3" />,
            scheduled: <Clock className="h-3 w-3" />,
            sent: <Check className="h-3 w-3" />,
            failed: <AlertTriangle className="h-3 w-3" />,
            sending: <RefreshCw className="h-3 w-3 animate-spin" />,
            partially_sent: <AlertTriangle className="h-3 w-3" />
        };
        return icons[status as keyof typeof icons] || <Mail className="h-3 w-3" />;
    };

    const getStatusName = (status: string) => {
        const names = {
            draft: t('campaigns.statuses.draft'),
            scheduled: t('campaigns.statuses.scheduled'),
            sent: t('campaigns.statuses.sent'),
            failed: t('campaigns.statuses.failed'),
            sending: t('campaigns.statuses.sending'),
            partially_sent: t('campaigns.statuses.partially_sent')
        };
        return names[status as keyof typeof names] || status;
    };

    // Calendar event generation
    const calendarEvents = useMemo(() => {
        return campaigns.data
            .filter(campaign => campaign.scheduled_at)
            .map(campaign => ({
                id: campaign.id,
                title: campaign.name,
                start: new Date(campaign.scheduled_at!),
                end: new Date(campaign.scheduled_at!),
                campaign,
                resource: {
                    campaign,
                    color: getStatusColor(campaign.status)
                }
            }));
    }, [campaigns.data]);

    // Handle calendar navigation
    const navigateCalendar = (action: string) => {
        let newDate: Date;

        switch (action) {
            case 'PREV':
                if (calendarView === Views.MONTH) {
                    newDate = moment(selectedDate).subtract(1, 'month').toDate();
                } else if (calendarView === Views.WEEK) {
                    newDate = moment(selectedDate).subtract(1, 'week').toDate();
                } else {
                    newDate = moment(selectedDate).subtract(1, 'day').toDate();
                }
                break;
            case 'NEXT':
                if (calendarView === Views.MONTH) {
                    newDate = moment(selectedDate).add(1, 'month').toDate();
                } else if (calendarView === Views.WEEK) {
                    newDate = moment(selectedDate).add(1, 'week').toDate();
                } else {
                    newDate = moment(selectedDate).add(1, 'day').toDate();
                }
                break;
            case 'TODAY':
                newDate = new Date();
                break;
            default:
                return;
        }

        setSelectedDate(newDate);
        updateCurrentMonth(newDate);
    };

    // Update current month display
    const updateCurrentMonth = (date: Date) => {
        setCurrentMonth(moment(date).format('MMMM YYYY'));
    };

    // Handle calendar events
    const handleSelectEvent = (event: any) => {
        setSelectedEvent(event);
        setShowEventDetailsModal(true);
    };

    const handleSelectSlot = (slotInfo: SlotInfo) => {
        // Optionally handle slot selection for creating new campaigns
        console.log('Selected slot:', slotInfo);
    };

    const handleViewChange = (view: string) => {
        setCalendarView(view);
    };

    // Calendar event components
    const EventComponent = ({ event }: { event: any }) => (
        <div className="text-xs p-1 rounded overflow-hidden">
            <strong>{event.title}</strong>
        </div>
    );

    const EventWrapper = ({ children, event }: { children: React.ReactNode; event: any }) => (
        <div
            className="rbc-event-wrapper"
            style={{
                backgroundColor: event.resource?.color || getStatusColor(event.campaign?.status || 'draft'),
                border: 'none',
                borderRadius: '6px'
            }}
        >
            {children}
        </div>
    );

    // Utility functions for forms
    const getClientCount = (tagId: string) => {
        const tag = tags.find(t => t.id.toString() === tagId);
        return tag?.clients_count || 0;
    };

    const getTagName = (tagId: string) => {
        const tag = tags.find(t => t.id.toString() === tagId);
        return tag?.name || '';
    };

    // Format date for display
    const formatDate = (dateString?: string) => {
        if (!dateString) return t('campaigns.notScheduled');
        return moment(dateString).format('DD/MM/YYYY HH:mm');
    };

    // Bulk actions
    const selectAllCampaigns = () => {
        setSelectedCampaignIds(filteredCampaigns.map(c => c.id));
    };

    const deselectAllCampaigns = () => {
        setSelectedCampaignIds([]);
    };

    const bulkDeleteCampaigns = () => {
        if (selectedCampaignIds.length === 0) return;

        if (confirm(t('campaigns.confirmBulkDelete', { count: selectedCampaignIds.length }))) {
            // Implement bulk delete logic here
            toast.success(t('campaigns.bulkDeleteSuccess', { count: selectedCampaignIds.length }));
            setSelectedCampaignIds([]);
            setSelectionMode(false);
        }
    };

    const bulkDisableCampaigns = () => {
        if (selectedCampaignIds.length === 0) return;
        // Implement bulk disable logic here
        toast.success(t('campaigns.bulkDisableSuccess', { count: selectedCampaignIds.length }));
    };

    const bulkEnableCampaigns = () => {
        if (selectedCampaignIds.length === 0) return;
        // Implement bulk enable logic here
        toast.success(t('campaigns.bulkEnableSuccess', { count: selectedCampaignIds.length }));
    };

    const disableAllCampaigns = () => {
        // Implement disable all logic here
        toast.success(t('campaigns.disableAllSuccess'));
    };

    const disableBirthdayCampaigns = () => {
        // Implement disable birthday campaigns logic here
        toast.success(t('campaigns.disableBirthdaysSuccess'));
    };

    const handleDeleteCampaign = (campaign: Campaign) => {
        if (confirm(t('campaigns.confirmDelete', { name: campaign.name }))) {
            // Implement delete logic here
            toast.success(t('campaigns.deleteSuccess', { name: campaign.name }));
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-white/25 backdrop-blur-xl">
                    <div className="flex flex-col sm:flex-row items-center justify-between py-4 px-6">
                        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                            <div className="flex items-center space-x-3">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setSidebarOpen(!sidebarOpen)}
                                    className="backdrop-blur-sm bg-white/20 border-white/25 hover:bg-white/30 rounded-xl"
                                >
                                    {sidebarOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
                                </Button>

                                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                    {t('common.campaigns')}
                                </h1>

                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant={viewMode === 'calendar' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setViewMode('calendar')}
                                        className={`rounded-xl ${viewMode === 'calendar'
                                            ? 'bg-gradient-to-r from-indigo-500/90 via-purple-500/90 to-pink-500/90 text-white'
                                            : 'backdrop-blur-sm bg-white/20 border-white/25 hover:bg-white/30'
                                            }`}
                                    >
                                        <CalendarIcon className="h-4 w-4 mr-2" />
                                        <span className="hidden sm:inline">{t('campaigns.calendar')}</span>
                                    </Button>
                                    <Button
                                        variant={viewMode === 'grid' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setViewMode('grid')}
                                        className={`rounded-xl ${viewMode === 'grid'
                                            ? 'bg-gradient-to-r from-indigo-500/90 via-purple-500/90 to-pink-500/90 text-white'
                                            : 'backdrop-blur-sm bg-white/20 border-white/25 hover:bg-white/30'
                                            }`}
                                    >
                                        <Grid className="h-4 w-4 mr-2" />
                                        <span className="hidden sm:inline">{t('campaigns.grid')}</span>
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3" ref={searchRef}>
                            {/* Search */}
                            <div className="relative">
                                <div className="flex items-center">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                        <Input
                                            placeholder={t('campaigns.searchPlaceholder')}
                                            value={searchTerm}
                                            onChange={handleSearchChange}
                                            className="pl-10 pr-4 w-64 backdrop-blur-sm bg-white/20 border-white/25 rounded-xl focus:bg-white/30"
                                        />
                                    </div>
                                    {searchTerm && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setSearchTerm('');
                                                setShowSearchResults(false);
                                            }}
                                            className="ml-2 h-8 w-8 p-0 hover:bg-white/20 rounded-lg"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>

                                {/* Search Results Dropdown */}
                                {showSearchResults && searchResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                                        {searchResults.map(campaign => (
                                            <div
                                                key={campaign.id}
                                                className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                                                onClick={() => {
                                                    setShowSearchResults(false);
                                                    setSearchTerm('');
                                                }}
                                            >
                                                <Link href={route('campaigns.show', campaign.id)} className="block">
                                                    <div className="font-medium text-sm">{campaign.name}</div>
                                                    {campaign.message_content && (
                                                        <div className="text-xs text-muted-foreground mt-1 truncate">
                                                            {campaign.message_content.substring(0, 50)}...
                                                        </div>
                                                    )}
                                                    <div className="flex items-center mt-1">
                                                        <Badge variant={getStatusVariant(campaign.status) as any} className="text-xs">
                                                            {getStatusName(campaign.status)}
                                                        </Badge>
                                                    </div>
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={toggleSelectionMode}
                                className={`backdrop-blur-sm border-white/25 rounded-xl ${selectionMode ? 'bg-orange-500/20 border-orange-300/50 hover:bg-orange-500/30' : 'bg-white/20 hover:bg-white/30'}`}
                            >
                                {selectionMode ? (
                                    <>
                                        <X className="h-4 w-4 mr-2" />
                                        <span className="hidden sm:inline">{t('campaigns.exitSelection')}</span>
                                        <span className="sm:hidden">{t('campaigns.exit')}</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckSquare className="h-4 w-4 mr-2" />
                                        <span className="hidden sm:inline">{t('campaigns.selectMode')}</span>
                                        <span className="sm:hidden">{t('campaigns.select')}</span>
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Actions Header */}
                        <div className="flex items-center space-x-2 mt-3 sm:mt-0">
                            {!selectionMode ? (
                                <div className="flex items-center space-x-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 text-orange-700 border-orange-200 hover:from-yellow-500/20 hover:to-orange-500/20 hover:text-orange-800"
                                            >
                                                <Settings className="h-4 w-4 mr-2" />
                                                <span className="hidden sm:inline">{t('campaigns.management')}</span>
                                                <span className="sm:hidden">{t('campaigns.manage')}</span>
                                                <ChevronDown className="h-3 w-3 ml-1" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onClick={disableAllCampaigns}>
                                                <PauseCircle className="mr-2 h-4 w-4 text-yellow-500" />
                                                <span>{t('campaigns.disableAll')}</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={disableBirthdayCampaigns}>
                                                <Gift className="mr-2 h-4 w-4 text-orange-500" />
                                                <span>{t('campaigns.disableBirthdays')}</span>
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
                                        <span className="hidden sm:inline">{t('campaigns.quickAdd')}</span>
                                        <span className="sm:hidden">{t('campaigns.add')}</span>
                                    </Button>

                                    <Link href={route('campaigns.create')}>
                                        <Button className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:shadow-md transition-all duration-200">
                                            <CalendarAdd className="h-4 w-4 mr-2" />
                                            <span className="hidden sm:inline">{t('campaigns.create')}</span>
                                            <span className="sm:hidden">+</span>
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="flex flex-wrap items-center gap-2">
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
                                                <span className="hidden sm:inline">{t('campaigns.actions')}</span>
                                                <span className="sm:hidden">{t('campaigns.menu')}</span>
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
                                                <span>{t('campaigns.pause')}</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={bulkEnableCampaigns}>
                                                <PlayCircle className="mr-2 h-4 w-4 text-green-500" />
                                                <span>{t('campaigns.enable')}</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={bulkDeleteCampaigns}
                                                className="text-destructive focus:text-destructive"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                <span>{t('campaigns.delete')}</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={toggleSelectionMode}
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        <span className="hidden sm:inline">{t('campaigns.cancel')}</span>
                                        <span className="sm:hidden">{t('campaigns.close')}</span>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

            }
        >
            <Head title={t('common.campaigns')} />

            <div className="flex h-screen overflow-hidden bg-gradient-to-br from-indigo-50/80 via-purple-50/60 to-pink-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                {/* Main Content */}
                <div className="flex flex-col w-full">
                    {/* Header */}

                    <div className="flex flex-1 overflow-hidden pt-0">
                        {/* Sidebar with animation */}
                        <AnimatePresence mode="wait" initial={false}>
                            {sidebarOpen && (
                                <Sidebar
                                    campaigns={campaigns.data}
                                    campaignsByStatus={campaignsByStatus}
                                    selectedDate={selectedDate}
                                    setSelectedDate={setSelectedDate}
                                    updateCurrentMonth={updateCurrentMonth}
                                    calendarEvents={calendarEvents}
                                    selectedStatus={selectedStatus}
                                    setSelectedStatus={setSelectedStatus}
                                    selectedTag={selectedTag}
                                    setSelectedTag={setSelectedTag}
                                    tags={tags}
                                />
                            )}
                        </AnimatePresence>

                        {/* Main Content Area with flex-grow */}
                        <div className="flex-1 overflow-auto">

                            {/* Content based on view mode */}
                            {viewMode === 'calendar' ? (
                                <CalendarView
                                    calendarEvents={calendarEvents}
                                    calendarView={calendarView}
                                    setCalendarView={setCalendarView}
                                    selectedDate={selectedDate}
                                    navigateCalendar={navigateCalendar}
                                    currentMonth={currentMonth}
                                    handleSelectEvent={handleSelectEvent}
                                    handleSelectSlot={handleSelectSlot}
                                    handleViewChange={handleViewChange}
                                    EventComponent={EventComponent}
                                    EventWrapper={EventWrapper}
                                    t={t}
                                />
                            ) : (
                                <GridView
                                    filteredCampaigns={filteredCampaigns}
                                    selectionMode={selectionMode}
                                    selectedCampaignIds={selectedCampaignIds}
                                    handleCampaignSelection={handleCampaignSelection}
                                    getStatusVariant={getStatusVariant}
                                    getStatusIcon={getStatusIcon}
                                    getStatusName={getStatusName}
                                    formatDate={formatDate}
                                    handleDeleteCampaign={handleDeleteCampaign}
                                    setShowQuickAddModal={setShowQuickAddModal}
                                    t={t}
                                    route={route}
                                />
                            )}
                        </div>

                        {/* Modals */}
                        <Modals
                            showEventDetailsModal={showEventDetailsModal}
                            setShowEventDetailsModal={setShowEventDetailsModal}
                            selectedEvent={selectedEvent}
                            getStatusColor={getStatusColor}
                            getStatusVariant={getStatusVariant}
                            getStatusIcon={getStatusIcon}
                            getStatusName={getStatusName}
                            formatDate={formatDate}
                            handleDeleteCampaign={handleDeleteCampaign}
                            showQuickAddModal={showQuickAddModal}
                            setShowQuickAddModal={setShowQuickAddModal}
                            quickAddForm={quickAddForm}
                            setQuickAddForm={setQuickAddForm}
                            tags={tags}
                            getClientCount={getClientCount}
                            getTagName={getTagName}
                            handleQuickAdd={handleQuickAdd}
                            isLoading={isLoading}
                            t={t}
                            route={route}
                        />

                        {/* Floating Action Button for mobile */}
                        <div className="md:hidden fixed right-4 bottom-4">
                            <Button size="icon" className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:shadow-xl transition-all duration-200" onClick={() => setShowQuickAddModal(true)}>
                                <Plus className="h-6 w-6" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}