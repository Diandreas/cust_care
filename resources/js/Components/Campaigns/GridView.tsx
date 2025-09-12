import React from 'react';
import { Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Campaign } from '@/types';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { ScrollArea } from '@/Components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    Clock,
    Users,
    Eye,
    Settings,
    Trash2,
    Plus,
    CheckSquare,
    Square,
    CalendarIcon
} from 'lucide-react';

interface GridViewProps {
    filteredCampaigns: Campaign[];
    selectionMode: boolean;
    selectedCampaignIds: number[];
    handleCampaignSelection: (id: number) => void;
    getStatusVariant: (status: string) => string;
    getStatusIcon: (status: string) => React.ReactNode;
    getStatusName: (status: string) => string;
    formatDate: (date: string) => string;
    handleDeleteCampaign: (campaign: Campaign) => void;
    setShowQuickAddModal: (show: boolean) => void;
    t: (key: string, params?: any) => string;
    route: (name: string, params?: any) => string;
}

export default function GridView({
    filteredCampaigns,
    selectionMode,
    selectedCampaignIds,
    handleCampaignSelection,
    getStatusVariant,
    getStatusIcon,
    getStatusName,
    formatDate,
    handleDeleteCampaign,
    setShowQuickAddModal,
    t,
    route
}: GridViewProps) {
    return (
        <div className="h-full p-4">
            <div className="h-full backdrop-blur-xl bg-gradient-to-br from-white/20 via-white/10 to-white/5 border border-white/25 rounded-2xl p-4">
                <ScrollArea className="h-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
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
                                        <Card className="backdrop-blur-sm bg-white/20 border-white/25 hover:bg-white/30 transition-all duration-200 hover:scale-105 hover:shadow-xl rounded-xl h-full">
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

                                                <CardTitle className="text-sm font-semibold truncate pr-8">
                                                    {campaign.name}
                                                </CardTitle>

                                                <Badge
                                                    variant={getStatusVariant(campaign.status) as any}
                                                    className="mt-1 flex w-fit items-center gap-1 text-[10px] px-2 py-1"
                                                >
                                                    <div className="flex items-center space-x-1">
                                                        {getStatusIcon(campaign.status)}
                                                        <span>{getStatusName(campaign.status)}</span>
                                                    </div>
                                                </Badge>
                                            </CardHeader>

                                            <CardContent className="pb-2">
                                                <div className="space-y-1 text-xs">
                                                    {campaign.subject && (
                                                        <p className="text-muted-foreground truncate">{campaign.subject}</p>
                                                    )}
                                                    {campaign.scheduled_at && (
                                                        <p className="text-muted-foreground">
                                                            {formatDate(campaign.scheduled_at)}
                                                        </p>
                                                    )}
                                                    <p className="text-muted-foreground">
                                                        {campaign.recipients_count || 0} destinataires
                                                    </p>
                                                </div>
                                            </CardContent>

                                            {!selectionMode && (
                                                <CardFooter className="pt-2">
                                                    <div className="flex w-full space-x-1">
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Link href={route('campaigns.show', campaign.id)}>
                                                                        <Button size="sm" variant="outline" className="flex-1 h-7 text-xs backdrop-blur-sm bg-white/10 border-white/20 hover:bg-white/20 rounded-lg">
                                                                            <Eye className="h-3 w-3 mr-1" />
                                                                            Voir
                                                                        </Button>
                                                                    </Link>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Voir les détails</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>

                                                        {campaign.status !== 'sent' && (
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Link href={route('campaigns.edit', campaign.id)}>
                                                                            <Button size="sm" variant="outline" className="flex-1 h-7 text-xs backdrop-blur-sm bg-white/10 border-white/20 hover:bg-white/20 rounded-lg">
                                                                                <Settings className="h-3 w-3 mr-1" />
                                                                                Modifier
                                                                            </Button>
                                                                        </Link>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>Modifier la campagne</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        )}

                                                        {!['sent', 'sending', 'partially_sent'].includes(campaign.status) && (
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleDeleteCampaign(campaign);
                                                                            }}
                                                                            className="h-7 w-7 p-0 backdrop-blur-sm bg-red-500/10 border-red-200/50 hover:bg-red-500/20 rounded-lg text-red-600"
                                                                        >
                                                                            <Trash2 className="h-3 w-3" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>Supprimer</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        )}
                                                    </div>
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
                                    <Card className="backdrop-blur-xl bg-gradient-to-br from-white/30 via-white/20 to-white/10 border border-white/25 rounded-2xl p-6 text-center">
                                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/20 mb-4 backdrop-blur-sm">
                                            <CalendarIcon className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <CardTitle className="text-lg mb-2">Aucune campagne trouvée</CardTitle>
                                        <p className="text-muted-foreground mb-6">Commencez par créer votre première campagne</p>
                                        <div className="flex justify-center">
                                            <Button 
                                                onClick={() => setShowQuickAddModal(true)}
                                                className="backdrop-blur-xl bg-gradient-to-r from-indigo-500/90 via-purple-500/90 to-pink-500/90 text-white hover:shadow-xl transition-all duration-300 rounded-xl border border-white/25"
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Créer une campagne
                                            </Button>
                                        </div>
                                    </Card>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}