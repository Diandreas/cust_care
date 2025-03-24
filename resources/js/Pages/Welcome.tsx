// resources/js/Pages/Welcome.tsx
import { Link, Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useTranslation } from 'react-i18next';

export default function Welcome({
    auth,
    laravelVersion,
    phpVersion,
}: PageProps<{ laravelVersion: string; phpVersion: string }>) {
    const { t, i18n } = useTranslation();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        localStorage.setItem('language', lng);
    };

    return (
        <>
            <Head title="Welcome" />
            <div className="relative min-h-screen bg-gradient-to-b from-purple-700 to-indigo-900 text-white">
                {/* Header */}
                <header className="container mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
                                <span className="text-xl font-bold">E</span>
                            </div>
                            <span className="ml-3 text-2xl font-semibold">{t('app.name')}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => changeLanguage('fr')}
                                    className={`px-2 py-1 rounded ${i18n.language === 'fr' ? 'bg-white text-indigo-600' : 'text-white border border-white'}`}
                                >
                                    FR
                                </button>
                                <button
                                    onClick={() => changeLanguage('en')}
                                    className={`px-2 py-1 rounded ${i18n.language === 'en' ? 'bg-white text-indigo-600' : 'text-white border border-white'}`}
                                >
                                    EN
                                </button>
                            </div>
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="rounded-full bg-white px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-opacity-90"
                                >
                                    {t('common.dashboard')}
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="rounded-full border border-white px-4 py-2 text-sm font-medium text-white hover:bg-white hover:bg-opacity-10"
                                    >
                                        {t('auth.login')}
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="rounded-full bg-white px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-opacity-90"
                                    >
                                        {t('auth.register')}
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Hero Section */}
                <div className="container mx-auto px-6 py-20">
                    <div className="md:w-2/3">
                        <h1 className="mb-6 font-serif text-5xl font-bold leading-tight md:text-6xl">
                            {t('welcome.hero.title', 'Connectez avec vos clients par SMS comme jamais auparavant')}
                        </h1>
                        <p className="mb-8 text-xl text-gray-100">
                            {t('welcome.hero.subtitle', 'Plateforme professionnelle pour gérer vos campagnes SMS, automatiser vos événements et fidéliser vos clients.')}
                        </p>
                        <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                            <Link
                                href={route('register')}
                                className="rounded-full bg-gradient-to-r from-green-400 to-blue-500 px-8 py-4 text-center text-lg font-semibold text-white shadow-lg hover:shadow-xl"
                            >
                                {t('welcome.hero.startButton', 'Commencer gratuitement')}
                            </Link>
                            <a
                                href="#features"
                                className="rounded-full border border-white px-8 py-4 text-center text-lg font-semibold text-white hover:bg-white hover:bg-opacity-10"
                            >
                                {t('welcome.hero.learnMoreButton', 'En savoir plus')}
                            </a>
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <div id="features" className="bg-white py-20 text-gray-800">
                    <div className="container mx-auto px-6">
                        <div className="mb-16 text-center">
                            <h2 className="mb-4 font-serif text-4xl font-bold">{t('welcome.features.title', 'Fonctionnalités puissantes')}</h2>
                            <p className="mx-auto text-xl text-gray-600 md:w-2/3">{t('welcome.features.subtitle', 'Tout ce dont vous avez besoin pour gérer efficacement vos communications par SMS')}</p>
                        </div>

                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {/* Feature 1 */}
                            <div className="rounded-lg bg-gray-50 p-8 shadow-md">
                                <div className="mb-4 inline-block rounded-full bg-indigo-100 p-3">
                                    <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <h3 className="mb-3 text-xl font-bold">{t('welcome.features.feature1.title', 'Gestion des clients')}</h3>
                                <p className="text-gray-600">{t('welcome.features.feature1.description', 'Organisez vos contacts par catégories et conservez toutes les informations importantes.')}</p>
                            </div>

                            {/* Feature 2 */}
                            <div className="rounded-lg bg-gray-50 p-8 shadow-md">
                                <div className="mb-4 inline-block rounded-full bg-indigo-100 p-3">
                                    <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                    </svg>
                                </div>
                                <h3 className="mb-3 text-xl font-bold">{t('welcome.features.feature2.title', 'Campagnes SMS')}</h3>
                                <p className="text-gray-600">{t('welcome.features.feature2.description', 'Créez et programmez des campagnes SMS ciblées pour atteindre vos clients au bon moment.')}</p>
                            </div>

                            {/* Feature 3 */}
                            <div className="rounded-lg bg-gray-50 p-8 shadow-md">
                                <div className="mb-4 inline-block rounded-full bg-indigo-100 p-3">
                                    <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="mb-3 text-xl font-bold">{t('welcome.features.feature3.title', 'Événements automatiques')}</h3>
                                <p className="text-gray-600">{t('welcome.features.feature3.description', 'Automatisez les messages pour les anniversaires, fêtes et autres événements importants.')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pricing Section */}
                <div id="pricing" className="bg-gray-50 py-20">
                    <div className="container mx-auto px-6">
                        <div className="mb-16 text-center">
                            <h2 className="mb-4 font-serif text-4xl font-bold text-gray-800">{t('welcome.pricing.title', 'Plans tarifaires')}</h2>
                            <p className="mx-auto text-xl text-gray-600 md:w-2/3">{t('welcome.pricing.subtitle', 'Choisissez le plan qui correspond le mieux à vos besoins')}</p>
                        </div>

                        <div className="grid gap-8 md:grid-cols-3">
                            {/* Starter Plan */}
                            <div className="flex flex-col rounded-lg bg-white p-6 shadow-lg">
                                <div className="mb-6 flex flex-col">
                                    <h3 className="text-2xl font-bold text-gray-800">{t('welcome.pricing.starter.name', 'Pack Starter')}</h3>
                                    <div className="mt-4 flex items-baseline">
                                        <span className="text-5xl font-extrabold tracking-tight">5.000</span>
                                        <span className="ml-1 text-2xl font-medium text-gray-500">FCFA</span>
                                        <span className="ml-1 text-xl font-medium text-gray-500">/mois</span>
                                    </div>
                                    <p className="mt-5 text-lg text-gray-500">{t('welcome.pricing.starter.description', 'Idéal pour les petites entreprises et les débutants')}</p>
                                </div>
                                <ul className="mb-8 space-y-4 text-left">
                                    <li className="flex items-center">
                                        <svg className="h-5 w-5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                                        <span className="ml-2 text-gray-600">
                                            {t('welcome.pricing.starter.feature1', 'Jusqu\'à 100 clients')}
                                        </span>
                                    </li>
                                    <li className="flex items-center">
                                        <svg className="h-5 w-5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                                        <span className="ml-2 text-gray-600">
                                            {t('welcome.pricing.starter.feature2', '2 campagnes par mois (200 SMS)')}
                                        </span>
                                    </li>
                                    <li className="flex items-center">
                                        <svg className="h-5 w-5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                                        <span className="ml-2 text-gray-600">
                                            {t('welcome.pricing.starter.feature3', '50 SMS personnalisés par mois')}
                                        </span>
                                    </li>
                                    <li className="flex items-center">
                                        <svg className="h-5 w-5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                                        <span className="ml-2 text-gray-600">
                                            {t('welcome.pricing.starter.feature4', 'Support par email')}
                                        </span>
                                    </li>
                                </ul>
                                <a href={route('register')} className="mt-auto rounded-md bg-indigo-600 px-5 py-3 text-center font-medium text-white hover:bg-indigo-700">
                                    {t('welcome.pricing.button', 'Commencer')}
                                </a>
                            </div>

                            {/* Business Plan */}
                            <div className="relative flex flex-col rounded-lg bg-white p-6 shadow-xl">
                                <div className="absolute -top-4 left-0 right-0 mx-auto w-32 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-3 py-2 text-center text-sm font-semibold text-white">
                                    {t('welcome.pricing.popular', 'Plus populaire')}
                                </div>
                                <div className="mb-6 flex flex-col">
                                    <h3 className="text-2xl font-bold text-gray-800">{t('welcome.pricing.business.name', 'Pack Business')}</h3>
                                    <div className="mt-4 flex items-baseline">
                                        <span className="text-5xl font-extrabold tracking-tight">15.000</span>
                                        <span className="ml-1 text-2xl font-medium text-gray-500">FCFA</span>
                                        <span className="ml-1 text-xl font-medium text-gray-500">/mois</span>
                                    </div>
                                    <p className="mt-5 text-lg text-gray-500">{t('welcome.pricing.business.description', 'Parfait pour les entreprises en croissance')}</p>
                                </div>
                                <ul className="mb-8 space-y-4 text-left">
                                    <li className="flex items-center">
                                        <svg className="h-5 w-5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                                        <span className="ml-2 text-gray-600">
                                            {t('welcome.pricing.business.feature1', 'Jusqu\'à 500 clients')}
                                        </span>
                                    </li>
                                    <li className="flex items-center">
                                        <svg className="h-5 w-5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                                        <span className="ml-2 text-gray-600">
                                            {t('welcome.pricing.business.feature2', '4 campagnes par mois (1.000 SMS)')}
                                        </span>
                                    </li>
                                    <li className="flex items-center">
                                        <svg className="h-5 w-5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                                        <span className="ml-2 text-gray-600">
                                            {t('welcome.pricing.business.feature3', '200 SMS personnalisés par mois')}
                                        </span>
                                    </li>
                                    <li className="flex items-center">
                                        <svg className="h-5 w-5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                                        <span className="ml-2 text-gray-600">
                                            {t('welcome.pricing.business.feature4', 'Report de 10% des SMS non utilisés')}
                                        </span>
                                    </li>
                                    <li className="flex items-center">
                                        <svg className="h-5 w-5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                                        <span className="ml-2 text-gray-600">
                                            {t('welcome.pricing.business.feature5', 'Support prioritaire')}
                                        </span>
                                    </li>
                                </ul>
                                // Suite de Welcome.tsx (partie manquante)
                                <a href={route('register')} className="mt-auto rounded-md bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 text-center font-medium text-white shadow-md hover:from-indigo-700 hover:to-purple-700">
                                    {t('welcome.pricing.button', 'Commencer')}
                                </a>
                            </div>

                            {/* Enterprise Plan */}
                            <div className="flex flex-col rounded-lg bg-white p-6 shadow-lg">
                                <div className="mb-6 flex flex-col">
                                    <h3 className="text-2xl font-bold text-gray-800">{t('welcome.pricing.enterprise.name', 'Pack Enterprise')}</h3>
                                    <div className="mt-4 flex items-baseline">
                                        <span className="text-5xl font-extrabold tracking-tight">30.000</span>
                                        <span className="ml-1 text-2xl font-medium text-gray-500">FCFA</span>
                                        <span className="ml-1 text-xl font-medium text-gray-500">/mois</span>
                                    </div>
                                    <p className="mt-5 text-lg text-gray-500">{t('welcome.pricing.enterprise.description', 'Pour les entreprises avec besoins importants')}</p>
                                </div>
                                <ul className="mb-8 space-y-4 text-left">
                                    <li className="flex items-center">
                                        <svg className="h-5 w-5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                                        <span className="ml-2 text-gray-600">
                                            {t('welcome.pricing.enterprise.feature1', 'Jusqu\'à 2.000 clients')}
                                        </span>
                                    </li>
                                    <li className="flex items-center">
                                        <svg className="h-5 w-5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                                        <span className="ml-2 text-gray-600">
                                            {t('welcome.pricing.enterprise.feature2', '8 campagnes par mois (4.000 SMS)')}
                                        </span>
                                    </li>
                                    <li className="flex items-center">
                                        <svg className="h-5 w-5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                                        <span className="ml-2 text-gray-600">
                                            {t('welcome.pricing.enterprise.feature3', '500 SMS personnalisés par mois')}
                                        </span>
                                    </li>
                                    <li className="flex items-center">
                                        <svg className="h-5 w-5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                                        <span className="ml-2 text-gray-600">
                                            {t('welcome.pricing.enterprise.feature4', 'Report de 20% des SMS non utilisés')}
                                        </span>
                                    </li>
                                    <li className="flex items-center">
                                        <svg className="h-5 w-5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                                        <span className="ml-2 text-gray-600">
                                            {t('welcome.pricing.enterprise.feature5', 'Support dédié 24/7')}
                                        </span>
                                    </li>
                                </ul>
                                <a href={route('register')} className="mt-auto rounded-md bg-indigo-600 px-5 py-3 text-center font-medium text-white hover:bg-indigo-700">
                                    {t('welcome.pricing.button', 'Commencer')}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Call To Action */}
                <div className="bg-indigo-800 py-16">
                    <div className="container mx-auto px-6 text-center">
                        <h2 className="mb-6 font-serif text-3xl font-bold text-white md:text-4xl">
                            {t('welcome.cta.title', 'Prêt à améliorer vos communications par SMS?')}
                        </h2>
                        <p className="mb-8 text-xl text-indigo-200">
                            {t('welcome.cta.subtitle', 'Inscrivez-vous aujourd\'hui et obtenez 50 SMS gratuits pour essayer notre service')}
                        </p>
                        <a href={route('register')} className="inline-block rounded-full bg-white px-8 py-4 text-lg font-semibold text-indigo-800 shadow-lg hover:bg-opacity-90">
                            {t('welcome.cta.button', 'Créer un compte gratuitement')}
                        </a>
                    </div>
                </div>

                {/* Footer */}
                <footer className="bg-gray-900 py-12 text-white">
                    <div className="container mx-auto px-6">
                        <div className="flex flex-col items-center justify-between md:flex-row">
                            <div className="mb-6 flex items-center md:mb-0">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
                                    <span className="text-lg font-bold">E</span>
                                </div>
                                <span className="ml-2 text-xl font-semibold">{t('app.name')}</span>
                            </div>
                            <div className="mb-6 flex space-x-6 md:mb-0">
                                <a href="#" className="text-gray-400 hover:text-white">
                                    {t('welcome.footer.privacy', 'Confidentialité')}
                                </a>
                                <a href="#" className="text-gray-400 hover:text-white">
                                    {t('welcome.footer.terms', 'Conditions')}
                                </a>
                                <a href="#" className="text-gray-400 hover:text-white">
                                    {t('welcome.footer.contact', 'Contact')}
                                </a>
                            </div>
                            <div className="text-gray-400">
                                &copy; {new Date().getFullYear()} EliteSMS. {t('welcome.footer.rights', 'Tous droits réservés.')}
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}