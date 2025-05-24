import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import axios from 'axios';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Card, CardContent } from '@/Components/ui/card';
import { MessageSquare, MessageSquarePlus, Eye, Send } from 'lucide-react';

interface BulkSmsModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedClients: number[];
    onSuccess: () => void;
}

interface SmsPreviewInfo {
    characters: number;
    segments: number;
    cost: number;
}

export default function BulkSmsModal({ isOpen, onClose, selectedClients, onSuccess }: BulkSmsModalProps) {
    const { t } = useTranslation();

    // States
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [smsInfo, setSmsInfo] = useState<SmsPreviewInfo>({
        characters: 0,
        segments: 1,
        cost: 0
    });

    // Calculate SMS info when content changes
    useEffect(() => {
        if (content) {
            const characters = content.length;
            const segments = Math.ceil(characters / 160);
            const totalMessages = segments * selectedClients.length;

            setSmsInfo({
                characters,
                segments,
                cost: totalMessages * 0.05 // Assuming 0.05 per SMS
            });
        } else {
            setSmsInfo({
                characters: 0,
                segments: 1,
                cost: 0
            });
        }
    }, [content, selectedClients.length]);

    // Handle SMS sending
    const handleSendSms = async () => {
        if (!content.trim()) {
            toast.error(t('sms.contentRequired'));
            return;
        }

        if (selectedClients.length === 0) {
            toast.error(t('clients.noClientsSelected'));
            return;
        }

        setIsSubmitting(true);

        try {
            // Get fresh CSRF token
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

            if (token) {
                axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
            }

            // Send bulk SMS
            const response = await axios.post(route('messages.bulkSend'), {
                client_ids: selectedClients,
                content: content.trim(),
            }, {
                withCredentials: true
            });

            toast.success(t('sms.sendSuccess', {
                count: response.data.sent || selectedClients.length
            }));

            handleClose();
            onSuccess();
        } catch (err: any) {
            if (err.response?.status === 403) {
                toast.error(t('subscription.limit.upgradeRequired'));
            } else if (err.response?.status === 422) {
                const errors = err.response.data.errors;
                const errorMessages = Object.values(errors).flat().join(', ');
                toast.error(`Erreur de validation: ${errorMessages}`);
            } else if (err.response?.status === 400) {
                toast.error(err.response.data.message || t('sms.sendError'));
            } else {
                toast.error(t('common.error', {
                    details: err.response?.data?.message || t('common.unknownError')
                }));
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle modal close
    const handleClose = () => {
        setContent('');
        setShowPreview(false);
        setSmsInfo({
            characters: 0,
            segments: 1,
            cost: 0
        });
        onClose();
    };

    // Get character limit color
    const getCharacterLimitColor = () => {
        if (smsInfo.characters > 800) return 'text-rose-600 dark:text-rose-400';
        if (smsInfo.characters > 480) return 'text-orange-600 dark:text-orange-400';
        return 'text-gray-500 dark:text-gray-400';
    };

    return (
        <>
            {/* Main SMS Modal */}
            <Dialog open={isOpen && !showPreview} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-lg dark:bg-slate-800 dark:border-slate-700/60">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            {t('sms.sendToSelected', { count: selectedClients.length })}
                        </DialogTitle>
                        <DialogDescription className="dark:text-gray-400">
                            {t('sms.bulkDescription')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                        {/* Message content */}
                        <div>
                            <Label htmlFor="sms_content" className="text-sm font-medium">
                                {t('sms.content')} <span className="text-rose-500">*</span>
                            </Label>
                            <Textarea
                                id="sms_content"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={6}
                                className="mt-1 border-border/60 dark:bg-slate-700 dark:border-slate-600 resize-none"
                                placeholder="Tapez votre message ici..."
                                disabled={isSubmitting}
                                maxLength={1000}
                            />

                            {/* Character count and info */}
                            <div className="mt-2 flex justify-between items-center text-xs">
                                <span className={getCharacterLimitColor()}>
                                    {smsInfo.characters}/1000 {t('sms.characters')}
                                    {smsInfo.segments > 1 && (
                                        <span className="ml-2">
                                            ({smsInfo.segments} {t('sms.segments')})
                                        </span>
                                    )}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 dark:text-indigo-400 dark:hover:text-indigo-300 dark:hover:bg-indigo-900/50"
                                    onClick={() => setShowPreview(true)}
                                    disabled={!content.trim()}
                                >
                                    <Eye className="h-3 w-3 mr-1" />
                                    {t('sms.preview')}
                                </Button>
                            </div>
                        </div>

                        {/* SMS Info Card */}
                        <Card className="border-indigo-200 bg-indigo-50/50 dark:border-indigo-800/50 dark:bg-indigo-900/20">
                            <CardContent className="p-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-600 dark:text-gray-400">{t('sms.recipients')}:</span>
                                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                            {selectedClients.length}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 dark:text-gray-400">{t('sms.segments')}:</span>
                                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                            {smsInfo.segments}
                                        </span>
                                    </div>
                                    <div className="col-span-2 pt-2 border-t border-indigo-200 dark:border-indigo-800/50">
                                        <span className="text-gray-600 dark:text-gray-400">{t('sms.totalMessages')}:</span>
                                        <span className="ml-2 font-bold text-indigo-600 dark:text-indigo-400">
                                            {smsInfo.segments * selectedClients.length}
                                        </span>
                                        <span className="ml-4 text-gray-600 dark:text-gray-400">
                                            (~{smsInfo.cost.toFixed(2)} €)
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Warning for large messages */}
                        {smsInfo.segments > 3 && (
                            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg dark:bg-orange-900/20 dark:border-orange-800/50">
                                <p className="text-sm text-orange-800 dark:text-orange-300">
                                    ⚠️ {t('sms.longMessageWarning')}
                                </p>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="mt-6">
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="border-border/60 dark:border-slate-700/60 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600"
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            onClick={handleSendSms}
                            disabled={isSubmitting || !content.trim()}
                            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-sm hover:shadow-md transition-shadow duration-200 disabled:opacity-70"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    {t('sms.sending')}
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-4 w-4" />
                                    {t('sms.send')}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* SMS Preview Modal */}
            <Dialog open={showPreview} onOpenChange={() => setShowPreview(false)}>
                <DialogContent className="sm:max-w-md dark:bg-slate-800 dark:border-slate-700/60">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Eye className="h-5 w-5" />
                            {t('sms.preview')}
                        </DialogTitle>
                        <DialogDescription className="dark:text-gray-400">
                            {t('sms.previewDescription')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4">
                        {/* Phone mockup */}
                        <div className="mx-auto max-w-xs">
                            <div className="bg-gray-100 dark:bg-slate-700 rounded-lg p-4">
                                <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg p-3 text-white max-w-[80%] ml-auto">
                                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                        {content}
                                    </p>
                                    <div className="text-xs opacity-75 mt-2 text-right">
                                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SMS Details */}
                        <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                            <div className="flex justify-between">
                                <span>{t('sms.characterCount')}:</span>
                                <span className="font-medium">{smsInfo.characters}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>{t('sms.segmentCount')}:</span>
                                <span className="font-medium">{smsInfo.segments}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>{t('sms.recipientCount')}:</span>
                                <span className="font-medium">{selectedClients.length}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-slate-600">
                                <span className="font-bold">{t('sms.totalMessages')}:</span>
                                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                    {smsInfo.segments * selectedClients.length}
                                </span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button
                            variant="outline"
                            onClick={() => setShowPreview(false)}
                            className="border-border/60 dark:border-slate-700/60 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600"
                        >
                            {t('common.back')}
                        </Button>
                        <Button
                            onClick={() => {
                                setShowPreview(false);
                                handleSendSms();
                            }}
                            disabled={isSubmitting}
                            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-sm hover:shadow-md transition-shadow duration-200"
                        >
                            <Send className="mr-2 h-4 w-4" />
                            {t('sms.send')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}