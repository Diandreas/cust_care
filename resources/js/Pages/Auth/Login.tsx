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
    error,
}: {
    status?: string;
    canResetPassword: boolean;
    error?: string;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const [loginError, setLoginError] = useState<string | null>(error || null);

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

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-white px-2 text-gray-500 dark:bg-gray-900 dark:text-gray-400">Ou</span>
                    </div>
                </div>

                <div className="mt-2">
                    <a
                        href={route('socialite.google.redirect')}
                        className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-center text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-100 focus:ring focus:ring-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:focus:ring-gray-700"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="currentColor">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Connexion avec Google
                    </a>
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
