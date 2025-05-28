import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import axios from 'axios';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const [loginError, setLoginError] = useState<string | null>(null);

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        setLoginError(null);

        try {
            // Tenter de récupérer un nouveau token CSRF d'abord
            await axios.get('/sanctum/csrf-cookie', { withCredentials: true });

            // Ensuite, soumettre le formulaire avec Inertia
            post(route('login'), {
                onFinish: () => reset('password'),
                onError: (errors) => {
                    if (errors.email || errors.password) {
                        // Afficher les erreurs normales
                        return;
                    }
                    // Si nous avons une erreur générale (peut-être CSRF), l'afficher
                    setLoginError("Erreur de connexion. Veuillez réessayer.");
                }
            });
        } catch (error) {
            console.error("Erreur lors de la connexion:", error);
            setLoginError("Erreur de connexion. Veuillez réessayer.");
        }
    };

    return (
        <GuestLayout>
            <Head title="Connexion" />

            <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                    Connexion à HelloBoost
                </h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Entrez vos identifiants pour accéder à votre compte
                </p>
            </div>

            {status && (
                <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm font-medium text-green-600 dark:bg-green-900/20 dark:text-green-400">
                    {status}
                </div>
            )}

            {loginError && (
                <div className="mb-4 rounded-lg bg-rose-50 p-3 text-sm font-medium text-rose-600 dark:bg-rose-900/20 dark:text-rose-400">
                    {loginError}
                </div>
            )}

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900/50"
                        autoComplete="username"
                        isFocused={true}
                        onChange={(e) => setData('email', e.target.value)}
                    />

                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="mt-4">
                    <div className="flex items-center justify-between">
                        <InputLabel htmlFor="password" value="Mot de passe" />
                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="text-xs text-gray-600 underline hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                            >
                                Mot de passe oublié ?
                            </Link>
                        )}
                    </div>

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900/50"
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4 block">
                    <label className="flex items-center">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) =>
                                setData(
                                    'remember',
                                    (e.target.checked || false) as false,
                                )
                            }
                        />
                        <span className="ms-2 text-sm text-gray-600 dark:text-gray-400">
                            Se souvenir de moi
                        </span>
                    </label>
                </div>

                <div className="mt-6">
                    <PrimaryButton className="w-full justify-center py-2.5" disabled={processing}>
                        Connexion
                    </PrimaryButton>
                </div>

                <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                    Pas encore de compte ?{' '}
                    <Link href={route('register')} className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                        Créer un compte
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
