import React from 'react';
import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Campaign } from '@/types';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { Badge } from '@/Components/ui/badge';
import { Checkbox } from '@/Components/ui/checkbox';
import { Separator } from '@/Components/ui/separator';
import {
    Eye,
    Settings,
    Trash2,
    Loader,
    ArrowRight,
    Clock,
    Users,
    Info
} from 'lucide-react';

interface ModalsProps {
    // Event Details Modal
    showEventDetailsModal: boolean;
    setShowEventDetailsModal: (show: boolean) => void;
    selectedEvent: any;
    getStatusColor: (status: string) => string;
    getStatusVariant: (status: string) => string;
    getStatusIcon: (status: string) => React.ReactNode;
    getStatusName: (status: string) => string;
    formatDate: (date: string) => string;
    handleDeleteCampaign: (campaign: Campaign) => void;

    // Quick Add Modal
    showQuickAddModal: boolean;
    setShowQuickAddModal: (show: boolean) => void;
    quickAddForm: any;
    setQuickAddForm: (form: any) => void;
    tags: any[];
    getClientCount: (tagId: string) => number;
    getTagName: (tagId: string) => string;
    handleQuickAdd: () => void;
    isLoading: boolean;

    // Utilities
    t: (key: string, params?: any) => string;
    route: (name: string, params?: any) => string;
}

export default function Modals({
    showEventDetailsModal,
    setShowEventDetailsModal,
    selectedEvent,
    getStatusColor,
    getStatusVariant,
    getStatusIcon,
    getStatusName,
    formatDate,
    handleDeleteCampaign,
    showQuickAddModal,
    setShowQuickAddModal,
    quickAddForm,
    setQuickAddForm,
    tags,
    getClientCount,
    getTagName,
    handleQuickAdd,
    isLoading,
    t,
    route
}: ModalsProps) {
    return (
        <>
            {/* Event Details Dialog */}
            <Dialog open={showEventDetailsModal} onOpenChange={setShowEventDetailsModal}>
                <DialogContent className="backdrop-blur-xl bg-gradient-to-br from-white/90 via-white/80 to-white/70 border border-white/30 rounded-2xl">
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
                                    {selectedEvent.campaign.subject && (
                                        <p className="text-sm mb-2">
                                            {selectedEvent.campaign.subject.length > 50 
                                                ? selectedEvent.campaign.subject.substring(0, 50) + '...' 
                                                : selectedEvent.campaign.subject
                                            }
                                        </p>
                                    )}
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
                                <div className="backdrop-blur-sm bg-white/20 rounded-xl p-4 space-y-4 border border-white/20">
                                    <div className="grid grid-cols-2 gap-4">
                                        {selectedEvent.campaign.scheduled_at && (
                                            <div>
                                                <p className="text-xs text-muted-foreground">Programmée pour</p>
                                                <div className="flex items-center mt-1">
                                                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                                    <span className="font-medium">{formatDate(selectedEvent.campaign.scheduled_at)}</span>
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <p className="text-xs text-muted-foreground">Destinataires</p>
                                            <div className="flex items-center mt-1">
                                                <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                                                <span className="font-medium">{selectedEvent.campaign.recipients_count || 0} clients</span>
                                            </div>
                                        </div>
                                    </div>

                                    {selectedEvent.campaign.status === 'sent' && selectedEvent.campaign.delivered_count && (
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Progression</p>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs text-muted-foreground">Délivrées</span>
                                                <span className="text-xs font-medium">
                                                    {Math.round((selectedEvent.campaign.delivered_count / selectedEvent.campaign.recipients_count) * 100)}%
                                                </span>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-white/20">
                                                <div
                                                    className="h-2 rounded-full bg-green-500"
                                                    style={{
                                                        width: `${Math.min((selectedEvent.campaign.delivered_count / selectedEvent.campaign.recipients_count) * 100, 100)}%`
                                                    }}
                                                ></div>
                                            </div>
                                            <div className="mt-1 text-xs text-muted-foreground">
                                                {selectedEvent.campaign.delivered_count} délivrées, {selectedEvent.campaign.failed_count || 0} échouées
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
                                <Link href={route('campaigns.show', selectedEvent.campaign.id)} className="w-full sm:w-auto">
                                    <Button variant="outline" className="w-full backdrop-blur-sm bg-white/20 border-white/25 hover:bg-white/30 rounded-xl">
                                        <Eye className="h-4 w-4 mr-2" />
                                        Détails
                                    </Button>
                                </Link>

                                {selectedEvent.campaign.status !== 'sent' && (
                                    <Link href={route('campaigns.edit', selectedEvent.campaign.id)} className="w-full sm:w-auto">
                                        <Button className="w-full backdrop-blur-xl bg-gradient-to-r from-indigo-500/90 via-purple-500/90 to-pink-500/90 text-white hover:shadow-xl transition-all duration-300 rounded-xl border border-white/25">
                                            <Settings className="h-4 w-4 mr-2" />
                                            Modifier
                                        </Button>
                                    </Link>
                                )}

                                {!['sent', 'sending', 'partially_sent'].includes(selectedEvent.campaign.status) && (
                                    !(selectedEvent.campaign.scheduled_at && new Date(selectedEvent.campaign.scheduled_at) < new Date() && selectedEvent.campaign.status !== 'draft') && (
                                        <Button
                                            variant="destructive"
                                            onClick={() => handleDeleteCampaign(selectedEvent.campaign)}
                                            className="w-full sm:w-auto backdrop-blur-sm bg-red-500/20 border-red-300/50 hover:bg-red-500/30 rounded-xl"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Supprimer
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
                <DialogContent className="backdrop-blur-xl bg-gradient-to-br from-white/90 via-white/80 to-white/70 border border-white/30 rounded-2xl max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Ajout Rapide de Campagne</DialogTitle>
                        <DialogDescription>
                            Créez rapidement une nouvelle campagne
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="name" className="font-medium">Nom de la campagne *</Label>
                                <Input
                                    id="name"
                                    value={quickAddForm.name || ''}
                                    onChange={(e) => setQuickAddForm({ ...quickAddForm, name: e.target.value })}
                                    placeholder="Ex: Promo Black Friday 2024"
                                    className="mt-1.5 backdrop-blur-sm bg-white/20 border-white/25 rounded-lg"
                                />
                            </div>

                            <div>
                                <Label htmlFor="subject" className="font-medium">Sujet</Label>
                                <Input
                                    id="subject"
                                    value={quickAddForm.subject || ''}
                                    onChange={(e) => setQuickAddForm({ ...quickAddForm, subject: e.target.value })}
                                    placeholder="Sujet du message"
                                    className="mt-1.5 backdrop-blur-sm bg-white/20 border-white/25 rounded-lg"
                                />
                            </div>
                        </div>

                        <Separator className="bg-white/20" />

                        <div>
                            <Label htmlFor="message_content" className="font-medium">Contenu du message *</Label>
                            <Textarea
                                id="message_content"
                                value={quickAddForm.message_content || ''}
                                onChange={(e) => setQuickAddForm({ ...quickAddForm, message_content: e.target.value })}
                                placeholder="Rédigez votre message ici..."
                                className="mt-1.5 backdrop-blur-sm bg-white/20 border-white/25 rounded-lg"
                                rows={4}
                            />
                        </div>

                        <Separator className="bg-white/20" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="tag_id" className="font-medium">Sélectionner un tag *</Label>
                                <Select
                                    value={quickAddForm.tag_id || ''}
                                    onValueChange={(value) => setQuickAddForm({ ...quickAddForm, tag_id: value })}
                                >
                                    <SelectTrigger className="mt-1.5 backdrop-blur-sm bg-white/20 border-white/25 rounded-lg">
                                        <SelectValue placeholder="Choisir un groupe de clients" />
                                    </SelectTrigger>
                                    <SelectContent className="backdrop-blur-xl bg-white/90">
                                        {tags.map((tag) => (
                                            <SelectItem key={tag.id} value={tag.id.toString()}>
                                                <div className="flex items-center justify-between w-full">
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
                                            Sera envoyé à {getClientCount(quickAddForm.tag_id)} clients du groupe "{getTagName(quickAddForm.tag_id)}"
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="scheduled_at" className="font-medium">Date d'envoi</Label>
                                <Input
                                    id="scheduled_at"
                                    type="datetime-local"
                                    value={quickAddForm.scheduled_at || ''}
                                    onChange={(e) => setQuickAddForm({ ...quickAddForm, scheduled_at: e.target.value })}
                                    className="mt-1.5 backdrop-blur-sm bg-white/20 border-white/25 rounded-lg"
                                />

                                <div className="flex items-center space-x-2 mt-3">
                                    <Checkbox
                                        id="send_now"
                                        checked={quickAddForm.send_now || false}
                                        onCheckedChange={(checked) => setQuickAddForm({ ...quickAddForm, send_now: checked as boolean })}
                                    />
                                    <Label htmlFor="send_now" className="cursor-pointer text-sm">
                                        Envoyer immédiatement
                                    </Label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowQuickAddModal(false)}
                            className="backdrop-blur-sm bg-white/20 border-white/25 hover:bg-white/30 rounded-xl"
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={handleQuickAdd}
                            disabled={isLoading || !quickAddForm.name || !quickAddForm.message_content || !quickAddForm.tag_id}
                            className="backdrop-blur-xl bg-gradient-to-r from-indigo-500/90 via-purple-500/90 to-pink-500/90 text-white hover:shadow-xl transition-all duration-300 rounded-xl border border-white/25"
                        >
                            {isLoading ? (
                                <>
                                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                                    Création...
                                </>
                            ) : (
                                <>
                                    <ArrowRight className="h-4 w-4 mr-2" />
                                    Créer rapidement
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
                    <div className="backdrop-blur-xl bg-gradient-to-br from-white/90 via-white/80 to-white/70 border border-white/30 rounded-2xl shadow-2xl p-6 flex items-center space-x-4">
                        <Loader className="h-6 w-6 animate-spin text-primary" />
                        <span className="font-medium">Traitement en cours...</span>
                    </div>
                </motion.div>
            )}
        </>
    );
}