import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import axios from 'axios';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Check, X, Save, UserPlus } from 'lucide-react';

interface Tag {
    id: number;
    name: string;
}

interface QuickAddModalProps {
    isOpen: boolean;
    onClose: () => void;
    tags: Tag[];
    onSuccess: () => void;
}

interface PhoneValidation {
    isValid: boolean;
    formattedNumber: string;
    errorType: string;
    country: string;
}

export default function QuickAddModal({ isOpen, onClose, tags, onSuccess }: QuickAddModalProps) {
    const { t } = useTranslation();

    // Form state
    const [form, setForm] = useState({
        name: '',
        phone: '',
        gender: '',
        tagIds: [] as number[]
    });

    // Loading state
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Phone validation state
    const [phoneValidation, setPhoneValidation] = useState<PhoneValidation>({
        isValid: true,
        formattedNumber: '',
        errorType: '',
        country: '',
    });

    // Validate and format phone number
    const validateAndFormatPhone = (phone: string): PhoneValidation => {
        const validation: PhoneValidation = {
            isValid: false,
            formattedNumber: '',
            errorType: '',
            country: '',
        };

        // Ignore if empty
        if (!phone.trim()) {
            validation.isValid = true;
            return validation;
        }

        // Clean the number
        const cleanedPhone = phone.replace(/\s+/g, '').replace(/[()-]/g, '');

        // Detect international format
        const isInternational = /^(\+|00)/.test(cleanedPhone);

        if (isInternational) {
            // International format
            if (/^\+237[6-9][0-9]{8}$/.test(cleanedPhone)) {
                validation.isValid = true;
                validation.formattedNumber = cleanedPhone;
                validation.country = 'Cameroun';
            } else if (/^\+33[1-9][0-9]{8}$/.test(cleanedPhone)) {
                validation.isValid = true;
                validation.formattedNumber = cleanedPhone;
                validation.country = 'France';
            } else if (/^\+[0-9]{10,14}$/.test(cleanedPhone)) {
                validation.isValid = true;
                validation.formattedNumber = cleanedPhone;
                validation.country = 'International';
            } else {
                validation.errorType = 'format';
            }
        } else {
            // Local format
            if (/^6[0-9]{8}$/.test(cleanedPhone)) {
                // Cameroon local format
                validation.isValid = true;
                validation.formattedNumber = `+237${cleanedPhone}`;
                validation.country = 'Cameroun';
            } else if (/^0[1-9][0-9]{8}$/.test(cleanedPhone)) {
                // France local format
                validation.isValid = true;
                validation.formattedNumber = `+33${cleanedPhone.substring(1)}`;
                validation.country = 'France';
            } else {
                // Determine error type
                if (/^[0-9]+$/.test(cleanedPhone)) {
                    validation.errorType = 'length';
                } else {
                    validation.errorType = 'characters';
                }
            }
        }

        return validation;
    };

    // Handle phone input change
    const handlePhoneChange = (value: string) => {
        setForm({ ...form, phone: value });
        const validation = validateAndFormatPhone(value);
        setPhoneValidation(validation);
    };

    // Handle form submission
    const handleSubmit = async () => {
        if (!form.name || !form.phone) {
            toast.error(t('clients.missingRequiredFields'));
            return;
        }

        // Validate phone number
        const phoneCheck = validateAndFormatPhone(form.phone);
        if (!phoneCheck.isValid) {
            toast.error(t('clients.invalidPhoneFormat'));
            return;
        }

        setIsSubmitting(true);

        try {
            // Get fresh CSRF token
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

            if (token) {
                axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
            }

            // Refresh CSRF cookie
            await axios.get('/sanctum/csrf-cookie', { withCredentials: true });

            // Submit the form
            const response = await axios.post(route('clients.store'), {
                name: form.name,
                phone: phoneCheck.formattedNumber,
                gender: form.gender || null,
                tag_ids: form.tagIds
            }, {
                withCredentials: true
            });

            toast.success(t('clients.added'));
            handleClose();
            onSuccess();
        } catch (err: any) {
            if (err.response?.status === 419) {
                toast.error("Session expirée. Veuillez recharger la page.");
            } else if (err.response?.status === 403) {
                toast.error(t('subscription.limit.upgradeRequired'));
            } else if (err.response?.status === 422) {
                // Validation errors
                const errors = err.response.data.errors;
                const errorMessages = Object.values(errors).flat().join(', ');
                toast.error(`Erreur de validation: ${errorMessages}`);
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
        setForm({
            name: '',
            phone: '',
            gender: '',
            tagIds: []
        });
        setPhoneValidation({
            isValid: true,
            formattedNumber: '',
            errorType: '',
            country: '',
        });
        onClose();
    };

    // Handle tag toggle
    const toggleTag = (tagId: number) => {
        const newTagIds = form.tagIds.includes(tagId)
            ? form.tagIds.filter(id => id !== tagId)
            : [...form.tagIds, tagId];
        setForm({ ...form, tagIds: newTagIds });
    };

    // Get error message for phone validation
    const getPhoneErrorMessage = () => {
        if (phoneValidation.errorType === 'format') {
            return "Format invalide. Utilisez +237 pour le Cameroun ou +33 pour la France.";
        }
        if (phoneValidation.errorType === 'length') {
            return "Nombre de chiffres incorrect. Cameroun: 9 chiffres, France: 10 chiffres.";
        }
        if (phoneValidation.errorType === 'characters') {
            return "Caractères non autorisés. Utilisez uniquement des chiffres, +, espaces.";
        }
        return '';
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md dark:bg-slate-800 dark:border-slate-700/60">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        {t('clients.quickAdd')}
                    </DialogTitle>
                    <DialogDescription className="dark:text-gray-400">
                        {t('clients.quickAddDescription')}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    {/* Name field */}
                    <div>
                        <Label htmlFor="quick_name" className="text-sm font-medium">
                            {t('common.name')} <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                            id="quick_name"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="mt-1 border-border/60 dark:bg-slate-700 dark:border-slate-600"
                            placeholder="Nom complet du client"
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Phone field */}
                    <div>
                        <Label htmlFor="quick_phone" className="text-sm font-medium">
                            {t('common.phone')} <span className="text-rose-500">*</span>
                        </Label>
                        <div className="relative mt-1">
                            <Input
                                id="quick_phone"
                                type="tel"
                                value={form.phone}
                                onChange={(e) => handlePhoneChange(e.target.value)}
                                className={`pr-10 border-border/60 dark:bg-slate-700 dark:border-slate-600 ${form.phone && !phoneValidation.isValid
                                    ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                                    : ''
                                    }`}
                                placeholder="+237 6XX XXX XXX ou 6XX XXX XXX"
                                required
                                disabled={isSubmitting}
                            />
                            {form.phone && (
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                    {phoneValidation.isValid ? (
                                        <Check className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <X className="h-5 w-5 text-rose-500" />
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Phone validation feedback */}
                        {form.phone && (
                            <div className="mt-1">
                                {phoneValidation.isValid ? (
                                    <p className="text-xs text-green-600 dark:text-green-400">
                                        {phoneValidation.country && `✓ ${phoneValidation.country}: `}
                                        {phoneValidation.formattedNumber}
                                    </p>
                                ) : (
                                    <p className="text-xs text-rose-600 dark:text-rose-400">
                                        {getPhoneErrorMessage()}
                                    </p>
                                )}
                            </div>
                        )}

                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Formats acceptés: +237 6XX XXX XXX (Cameroun), +33 X XX XX XX XX (France)
                        </p>
                    </div>

                    {/* Gender field */}
                    <div>
                        <Label htmlFor="quick_gender" className="text-sm font-medium">
                            {t('common.gender')}
                        </Label>
                        <Select
                            value={form.gender}
                            onValueChange={(value) => setForm({ ...form, gender: value })}
                            disabled={isSubmitting}
                        >
                            <SelectTrigger id="quick_gender" className="mt-1 border-border/60 dark:bg-slate-700 dark:border-slate-600">
                                <SelectValue placeholder={t('clients.selectGender')} />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-slate-800 dark:border-slate-700/60">
                                <SelectItem value="male">{t('gender.male')}</SelectItem>
                                <SelectItem value="female">{t('gender.female')}</SelectItem>
                                <SelectItem value="other">{t('gender.other')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Tags field */}
                    <div>
                        <Label htmlFor="quick_tags" className="text-sm font-medium">
                            {t('common.tags')}
                        </Label>
                        <div className="mt-1 flex flex-wrap gap-2 border border-border/60 rounded-md p-3 min-h-[3rem] dark:border-slate-700/60 dark:bg-slate-700/50">
                            {tags.length > 0 ? (
                                tags.map(tag => (
                                    <button
                                        key={tag.id}
                                        type="button"
                                        onClick={() => toggleTag(tag.id)}
                                        disabled={isSubmitting}
                                        className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors duration-200 ${form.tagIds.includes(tag.id)
                                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300'
                                            : 'bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {tag.name}
                                    </button>
                                ))
                            ) : (
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {t('tags.noTagsAvailable')}
                                </span>
                            )}
                        </div>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {t('clients.tagsDescription')}
                        </p>
                    </div>
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
                        onClick={handleSubmit}
                        disabled={isSubmitting || !form.name || !form.phone || !phoneValidation.isValid}
                        className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-sm hover:shadow-md transition-shadow duration-200 disabled:opacity-70"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                {t('common.saving')}
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                {t('common.save')}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
