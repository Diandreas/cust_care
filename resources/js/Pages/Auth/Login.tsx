import React, { FormEventHandler, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import axios from 'axios';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';

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
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState('');

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        setLoginError(null);

        try {
            await axios.get('/sanctum/csrf-cookie', { withCredentials: true });

            post(route('login'), {
                onFinish: () => reset('password'),
                onError: (errors) => {
                    if (errors.email || errors.password) {
                        return;
                    }
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

            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full blur-xl animate-pulse dark:from-indigo-400/20 dark:to-purple-400/20"></div>
                <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-gradient-to-r from-pink-500/10 to-rose-500/10 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
            </div>

            <div className="relative">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl mb-4 shadow-lg transform hover:rotate-12 transition-transform duration-300 hover:scale-110">
                        <svg className="w-8 h-8 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2" style={{animation: 'fadeInUp 0.6s ease-out'}}>
                        Bienvenue sur HelloBoost
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 text-sm" style={{animation: 'fadeInUp 0.6s ease-out 0.2s both'}}>
                        Connectez-vous pour accéder à votre espace
                    </p>
                </div>

                {/* Status Messages */}
                {status && (
                    <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl shadow-sm">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-emerald-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">{status}</p>
                        </div>
                    </div>
                )}

                {loginError && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl shadow-sm">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm text-red-700 dark:text-red-300 font-medium">{loginError}</p>
                        </div>
                    </div>
                )}

                <form onSubmit={submit} className="space-y-6">
                    {/* Email Field */}
                    <div className="space-y-2">
                        <InputLabel htmlFor="email" value="Adresse email" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                        <div className={`relative transform transition-all duration-300 ${focusedField === 'email' ? 'scale-105' : ''}`}>
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className={`w-5 h-5 transition-colors duration-300 ${focusedField === 'email' ? 'text-indigo-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                </svg>
                            </div>
                            <TextInput
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-md"
                                placeholder="votre@email.com"
                                autoComplete="username"
                                isFocused={true}
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField('')}
                                onChange={(e) => setData('email', e.target.value)}
                            />
                        </div>
                        <InputError message={errors.email} className="mt-1" />
                    </div>

                    {/* Password Field */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <InputLabel htmlFor="password" value="Mot de passe" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                            {canResetPassword && (
                                <Link
                                    href={route('password.request')}
                                    className="text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 font-medium transition-colors duration-200"
                                >
                                    Oublié ?
                                </Link>
                            )}
                        </div>
                        <div className={`relative transform transition-all duration-300 ${focusedField === 'password' ? 'scale-105' : ''}`}>
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className={`w-5 h-5 transition-colors duration-300 ${focusedField === 'password' ? 'text-indigo-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <TextInput
                                id="password"
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={data.password}
                                className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-md"
                                placeholder="••••••••"
                                autoComplete="current-password"
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField('')}
                                onChange={(e) => setData('password', e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                                {showPassword ? (
                                    <svg className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        <InputError message={errors.password} className="mt-1" />
                    </div>

                    {/* Remember Me */}
                    <div className="flex items-center">
                        <div className="flex items-center cursor-pointer group" onClick={() => setData('remember', !data.remember)}>
                            <div className="relative">
                                <Checkbox
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', (e.target.checked || false) as false)}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition-all duration-200"
                                />
                                {data.remember && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <svg className="w-3 h-3 text-white" style={{animation: 'bounceIn 0.3s ease-out'}} fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-200">
                                Se souvenir de moi
                            </span>
                        </div>
                    </div>

                    {/* Login Button */}
                    <PrimaryButton
                        className="w-full justify-center py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100 relative overflow-hidden group"
                        disabled={processing}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                        <div className="relative flex items-center justify-center">
                            {processing ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Connexion...
                                </>
                            ) : (
                                <>
                                    <span>Se connecter</span>
                                    <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </>
                            )}
                        </div>
                    </PrimaryButton>

                    {/* Divider */}
                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                ou continuez avec
                            </span>
                        </div>
                    </div>

                    {/* Google Login */}
                    <a
                        href={route('socialite.google.redirect')}
                        className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 transform hover:scale-105 hover:shadow-md group"
                    >
                        <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-200" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continuer avec Google
                    </a>
                </form>

                {/* Sign Up Link */}
                <div className="text-center mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Pas encore de compte ?{' '}
                        <Link
                            href={route('register')}
                            className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-200"
                        >
                            Créer un compte
                        </Link>
                    </p>
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes bounceIn {
                    0% {
                        opacity: 0;
                        transform: scale(0.3);
                    }
                    50% {
                        opacity: 1;
                        transform: scale(1.1);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
            `}</style>
        </GuestLayout>
    );
}
