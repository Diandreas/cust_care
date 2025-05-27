// resources/js/Pages/Clients/Create.tsx
import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/Components/ui/use-toast';
import { Link } from '@inertiajs/react';
import axios from 'axios';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import { Check, X } from 'lucide-react';

// Make sure CSRF token is included in all requests
axios.defaults.withCredentials = true;

interface Tag {
    id: number;
    name: string;
}

// Interface pour la validation du téléphone
interface PhoneValidation {
    isValid: boolean;
    formattedNumber: string;
    errorType: string;
    country: string;
}

export default function Create({ auth, tags }: PageProps<{ tags: Tag[] }>) {
    const { t } = useTranslation();
    const { success, error } = useToast();

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        phone: '',
        email: '',
        birthday: '',
        address: '',
        notes: '',
        gender: '',
        tags: [] as number[]
    });

    const [selectedTags, setSelectedTags] = useState<number[]>([]);
    const [newTagName, setNewTagName] = useState('');
    const [isAddingTag, setIsAddingTag] = useState(false);

    // État pour la validation du téléphone
    const [phoneValidation, setPhoneValidation] = useState<PhoneValidation>({
        isValid: true,
        formattedNumber: '',
        errorType: '',
        country: '',
    });

    useEffect(() => {
        setData('tags', selectedTags);
    }, [selectedTags]);

    // Ensure CSRF token is properly set
    useEffect(() => {
        // Get CSRF token from meta tag
        const token = document.head.querySelector('meta[name="csrf-token"]');
        if (token) {
            axios.defaults.headers.common['X-CSRF-TOKEN'] = token.getAttribute('content');
        } else {
            console.error('CSRF token not found');
        }
    }, []);

    // Validation et formatage avancés du numéro de téléphone
    const validateAndFormatPhone = (phone: string): PhoneValidation => {
        // Réinitialiser la validation
        const validation = {
            isValid: false,
            formattedNumber: '',
            errorType: '',
            country: '',
        };

        // Ignorer si vide
        if (!phone.trim()) {
            validation.isValid = true;
            return validation;
        }

        // Nettoyage du numéro
        const cleanedPhone = phone.replace(/\s+/g, '').replace(/[()-]/g, '');

        // Détecter le format international
        const isInternational = /^(\+|00)/.test(cleanedPhone);

        // Tests spécifiques aux pays
        if (isInternational) {
            // Format international
            if (/^\+237[6-9][0-9]{8}$/.test(cleanedPhone)) {
                validation.isValid = true;
                validation.formattedNumber = cleanedPhone;
                validation.country = 'Cameroun';
            } else if (/^\+33[1-9][0-9]{8}$/.test(cleanedPhone)) {
                validation.isValid = true;
                validation.formattedNumber = cleanedPhone;
                validation.country = 'France';
            } else if (/^\+241[0-7][0-9]{7}$/.test(cleanedPhone)) {
                validation.isValid = true;
                validation.formattedNumber = cleanedPhone;
                validation.country = 'Gabon';
            } else if (/^\+225[0-9]{8,10}$/.test(cleanedPhone)) {
                validation.isValid = true;
                validation.formattedNumber = cleanedPhone;
                validation.country = 'Côte d\'Ivoire';
            } else if (/^\+221[7,6][0-9]{8}$/.test(cleanedPhone)) {
                validation.isValid = true;
                validation.formattedNumber = cleanedPhone;
                validation.country = 'Sénégal';
            } else if (/^\+32[0-9]{8,9}$/.test(cleanedPhone)) {
                validation.isValid = true;
                validation.formattedNumber = cleanedPhone;
                validation.country = 'Belgique';
            } else if (/^\+41[0-9]{9}$/.test(cleanedPhone)) {
                validation.isValid = true;
                validation.formattedNumber = cleanedPhone;
                validation.country = 'Suisse';
            } else if (/^\+[0-9]{10,14}$/.test(cleanedPhone)) {
                validation.isValid = true;
                validation.formattedNumber = cleanedPhone;
                validation.country = 'International';
            } else {
                validation.errorType = 'format';
            }
        } else {
            // Formats locaux
            // Cameroun: commence par 6 et a 9 chiffres
            if (/^6[0-9]{8}$/.test(cleanedPhone)) {
                validation.isValid = true;
                validation.formattedNumber = `+237${cleanedPhone}`;
                validation.country = 'Cameroun';
            }
            // France: commence par 0 et a 10 chiffres
            else if (/^0[1-9][0-9]{8}$/.test(cleanedPhone)) {
                validation.isValid = true;
                validation.formattedNumber = `+33${cleanedPhone.substring(1)}`;
                validation.country = 'France';
            }
            // Gabon: commence par 0 et a 8 chiffres
            else if (/^0[1-7][0-9]{6}$/.test(cleanedPhone)) {
                validation.isValid = true;
                validation.formattedNumber = `+241${cleanedPhone.substring(1)}`;
                validation.country = 'Gabon';
            }
            // Côte d'Ivoire
            else if (/^0[1-9][0-9]{7,9}$/.test(cleanedPhone)) {
                validation.isValid = true;
                validation.formattedNumber = `+225${cleanedPhone.substring(1)}`;
                validation.country = 'Côte d\'Ivoire';
            }
            // Sénégal
            else if (/^(7|6)[0-9]{8}$/.test(cleanedPhone)) {
                validation.isValid = true;
                validation.formattedNumber = `+221${cleanedPhone}`;
                validation.country = 'Sénégal';
            }
            // Belgique
            else if (/^0[0-9]{8,9}$/.test(cleanedPhone)) {
                validation.isValid = true;
                validation.formattedNumber = `+32${cleanedPhone.substring(1)}`;
                validation.country = 'Belgique';
            }
            // Suisse
            else if (/^0[0-9]{9}$/.test(cleanedPhone)) {
                validation.isValid = true;
                validation.formattedNumber = `+41${cleanedPhone.substring(1)}`;
                validation.country = 'Suisse';
            } else {
                // Déterminer le type d'erreur pour un message adapté
                if (/^[0-9]+$/.test(cleanedPhone)) {
                    validation.errorType = 'length';
                } else {
                    validation.errorType = 'characters';
                }
            }
        }

        return validation;
    };

    // Mise à jour de la validation du téléphone lors de la modification
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setData('phone', newValue);

        const validation = validateAndFormatPhone(newValue);
        setPhoneValidation(validation);

        // Si le numéro est valide, stockez également le format E.164
        if (validation.isValid && validation.formattedNumber) {
            // Nous gardons le numéro visible tel que saisi par l'utilisateur pour une meilleure UX
            // Mais nous pouvons stocker le format normalisé si nécessaire
            // setData('phone', validation.formattedNumber);
        }
    };

    const handleTagToggle = (tagId: number) => {
        setSelectedTags(prev =>
            prev.includes(tagId)
                ? prev.filter(id => id !== tagId)
                : [...prev, tagId]
        );
    };

    const handleCreateTag = () => {
        if (!newTagName.trim()) {
            error(t('tags.nameRequired'));
            return;
        }

        // Make sure to get fresh CSRF token
        const token = document.head.querySelector('meta[name="csrf-token"]');
        if (token) {
            axios.defaults.headers.common['X-CSRF-TOKEN'] = token.getAttribute('content');
        }

        // First, try to get a new CSRF token
        axios.get('/sanctum/csrf-cookie', { withCredentials: true })
            .then(() => {
                // Now make the actual request with the refreshed token
                return axios.post(route('tags.store'), {
                    name: newTagName,
                });
            })
            .then(response => {
                success(t('tags.createSuccess'));
                setNewTagName('');
                setIsAddingTag(false);
                const newTag = response.data.tag;
                handleTagToggle(newTag.id);
                window.location.reload();
            })
            .catch(err => {
                error(t('tags.createError'));
                if (err.response && err.response.status === 419) {
                    error("Session expirée. Veuillez recharger la page.");
                }
            });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Valider le numéro de téléphone avant de soumettre
        const validation = validateAndFormatPhone(data.phone);
        if (!validation.isValid) {
            error(t('clients.invalidPhoneFormat'));
            return;
        }

        // Ensure CSRF token is fresh
        const token = document.head.querySelector('meta[name="csrf-token"]');
        if (token) {
            axios.defaults.headers.common['X-CSRF-TOKEN'] = token.getAttribute('content');
        }

        // Utiliser le numéro formaté pour la soumission
        const formData = { ...data, phone: validation.formattedNumber };

        // Refresh CSRF token first, then submit
        axios.get('/sanctum/csrf-cookie', { withCredentials: true })
            .then(() => {
                // Now submit the form with the refreshed token
                post(route('clients.store', formData), {
                    onSuccess: () => {
                        success(t('clients.createSuccess'));
                        reset();
                    },
                    onError: (errors) => {
                        if (errors.limit) {
                            error(t('subscription.limit.upgradeRequired'));
                        } else if (errors.csrf) {
                            error("Erreur CSRF. Veuillez recharger la page.");
                        } else {
                            error(t('common.error'));
                        }
                    }
                });
            })
            .catch(err => {
                error("Erreur lors du rafraîchissement du token. Veuillez recharger la page.");
                console.error("CSRF refresh error:", err);
            });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">{t('clients.create')}</h2>}
        >
            <Head title={t('clients.create')} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm dark:bg-gray-800 sm:rounded-lg">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            <form onSubmit={handleSubmit}>
                                <div className="mb-6 grid grid-cols-1 gap-y-6 gap-x-4 md:grid-cols-2">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('common.name')} *
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                            required
                                        />
                                        {errors.name && (
                                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('common.phone')} *
                                        </label>
                                        <div className="relative mt-1">
                                            <input
                                                type="tel"
                                                id="phone"
                                                name="phone"
                                                value={data.phone}
                                                onChange={handlePhoneChange}
                                                className={`block w-full rounded-md pr-10 shadow-sm focus:outline-none dark:bg-gray-700 dark:text-white ${errors.phone || (data.phone && !phoneValidation.isValid)
                                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                                    : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600'
                                                    }`}
                                                placeholder="+237 6XX XXX XXX, +33 6XX XXX XXX, ..."
                                                required
                                            />
                                            {data.phone && (
                                                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                                    {phoneValidation.isValid ? (
                                                        <Check className="h-5 w-5 text-green-500" />
                                                    ) : (
                                                        <X className="h-5 w-5 text-red-500" />
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {data.phone && (
                                            <div className="mt-1">
                                                {phoneValidation.isValid ? (
                                                    <p className="text-xs text-green-600 dark:text-green-400">
                                                        {phoneValidation.country && `✓ ${phoneValidation.country}: `}
                                                        {phoneValidation.formattedNumber}
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-red-600 dark:text-red-400">
                                                        {phoneValidation.errorType === 'format' &&
                                                            t('phone.formatError', "Format invalide. Utilisez le format international (+XXX) ou local.")}
                                                        {phoneValidation.errorType === 'length' &&
                                                            t('phone.lengthError', "Nombre de chiffres incorrect. Vérifiez le format selon votre pays.")}
                                                        {phoneValidation.errorType === 'characters' &&
                                                            t('phone.charactersError', "Caractères non autorisés. Utilisez uniquement des chiffres, +, espaces.")}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            {t('phone.acceptedFormats', "Formats acceptés: international (+XXX) ou local (selon le pays)")}
                                        </p>

                                        {errors.phone && (
                                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.phone}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('common.email')}
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        />
                                        {errors.email && (
                                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="birthday" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('common.birthday')}
                                        </label>
                                        <input
                                            type="date"
                                            id="birthday"
                                            name="birthday"
                                            value={data.birthday}
                                            onChange={(e) => setData('birthday', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        />
                                        {errors.birthday && (
                                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.birthday}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('common.gender')}
                                        </label>
                                        <select
                                            id="gender"
                                            name="gender"
                                            value={data.gender}
                                            onChange={(e) => setData('gender', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        >
                                            <option value="">{t('clients.selectGender')}</option>
                                            <option value="male">{t('gender.male')}</option>
                                            <option value="female">{t('gender.female')}</option>
                                            <option value="other">{t('gender.other')}</option>
                                        </select>
                                        {errors.gender && (
                                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.gender}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('common.address')}
                                        </label>
                                        <input
                                            type="text"
                                            id="address"
                                            name="address"
                                            value={data.address}
                                            onChange={(e) => setData('address', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        />
                                        {errors.address && (
                                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.address}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {t('common.notes')}
                                    </label>
                                    <textarea
                                        id="notes"
                                        name="notes"
                                        rows={4}
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    ></textarea>
                                    {errors.notes && (
                                        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.notes}</p>
                                    )}
                                </div>

                                <div className="mb-6">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('common.tags')}
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setIsAddingTag(!isAddingTag)}
                                            className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                        >
                                            {isAddingTag ? t('common.cancel') : t('tags.createNew')}
                                        </button>
                                    </div>

                                    {isAddingTag && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <TextInput
                                                value={newTagName}
                                                onChange={(e) => setNewTagName(e.target.value)}
                                                placeholder={t('tags.newTagPlaceholder')}
                                                className="flex-1"
                                            />
                                            <PrimaryButton type="button" onClick={handleCreateTag} className="whitespace-nowrap">
                                                {t('common.add')}
                                            </PrimaryButton>
                                        </div>
                                    )}

                                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                                        {tags.length > 0 ? (
                                            tags.map((tag) => (
                                                <div key={tag.id} className="flex items-center">
                                                    <input
                                                        id={`tag-${tag.id}`}
                                                        type="checkbox"
                                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                        checked={selectedTags.includes(tag.id)}
                                                        onChange={() => handleTagToggle(tag.id)}
                                                    />
                                                    <label htmlFor={`tag-${tag.id}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                                        {tag.name}
                                                    </label>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('tags.noTagsAvailable')}</p>
                                        )}
                                    </div>
                                    <div className="mt-2">
                                        <Link
                                            href={route('tags.index')}
                                            className="text-sm text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                        >
                                            {t('tags.manageTagsLink')}
                                        </Link>
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <a
                                        href={route('clients.index')}
                                        className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                    >
                                        {t('common.cancel')}
                                    </a>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-700 dark:hover:bg-indigo-600"
                                    >
                                        {t('common.save')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}