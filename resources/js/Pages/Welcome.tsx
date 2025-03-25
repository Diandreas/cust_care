import { Link, Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

export default function Welcome({
    auth,
    laravelVersion,
    phpVersion,
}: PageProps<{ laravelVersion: string; phpVersion: string }>) {
    const { t, i18n } = useTranslation();
    const [isScrolled, setIsScrolled] = useState(false);

    // Effet pour détecter le défilement
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        localStorage.setItem('language', lng);
    };

    return (
        <>
            <Head title="Welcome" />
            <div className="relative min-h-screen bg-gradient-to-b from-indigo-900 to-purple-900 text-white">
                {/* Header */}
                <header className={`fixed w-full transition-all duration-300 z-50 ${isScrolled ? 'bg-indigo-900 shadow-lg py-3' : 'bg-transparent py-6'}`}>
                    <div className="container mx-auto px-6">
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
                    </div>
                </header>

                {/* Hero Section with animation and images */}
                <div className="pt-32 pb-20 overflow-hidden">
                    <div className="container mx-auto px-6">
                        <div className="flex flex-col md:flex-row items-center">
                            {/* Left side - Text Content */}
                            <div className="md:w-1/2 md:pr-12">
                                <h1 className="mb-6 font-serif text-5xl font-bold leading-tight md:text-6xl">
                                    {t('welcome.hero.title', 'Connectez avec vos clients par SMS comme jamais auparavant')}
                                </h1>
                                <p className="mb-8 text-xl text-gray-100">
                                    {t('welcome.hero.subtitle', 'Plateforme professionnelle pour gérer vos campagnes SMS, automatiser vos événements et fidéliser vos clients.')}
                                </p>
                                <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                                    <Link
                                        href={route('register')}
                                        className="rounded-full bg-gradient-to-r from-green-400 to-blue-500 px-8 py-4 text-center text-lg font-semibold text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition duration-300"
                                    >
                                        {t('welcome.hero.startButton', 'Commencer gratuitement')}
                                    </Link>
                                    <a
                                        href="#features"
                                        className="rounded-full border border-white px-8 py-4 text-center text-lg font-semibold text-white hover:bg-white hover:bg-opacity-10 transition duration-300"
                                    >
                                        {t('welcome.hero.learnMoreButton', 'En savoir plus')}
                                    </a>
                                </div>
                            </div>

                            {/* Right side - Image/Illustration */}
                            <div className="md:w-1/2 mt-12 md:mt-0 flex justify-center">
                                <div className="relative">
                                    {/* Phone mockup */}
                                    <div className="w-64 h-auto border-8 border-gray-800 rounded-3xl shadow-xl overflow-hidden">
                                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 aspect-[9/16] relative">
                                            {/* Placeholder for phone screen content */}
                                            <div className="absolute inset-0 flex flex-col p-4">
                                                <div className="bg-white bg-opacity-10 rounded-lg p-2 mb-3 flex items-center">
                                                    <div className="w-8 h-8 rounded-full bg-white bg-opacity-20 mr-2"></div>
                                                    <div className="w-32 h-3 bg-white bg-opacity-20 rounded"></div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="bg-white bg-opacity-10 rounded-lg p-3">
                                                        <div className="w-full h-2 bg-white bg-opacity-20 rounded mb-1"></div>
                                                        <div className="w-3/4 h-2 bg-white bg-opacity-20 rounded"></div>
                                                    </div>
                                                    <div className="bg-white bg-opacity-10 rounded-lg p-3 ml-auto w-3/4">
                                                        <div className="w-full h-2 bg-white bg-opacity-20 rounded mb-1"></div>
                                                        <div className="w-1/2 h-2 bg-white bg-opacity-20 rounded"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Decorative elements */}
                                    <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-green-400 shadow-lg"></div>
                                    <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-blue-500 shadow-lg"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Testimonial section with user images */}
                <div className="bg-indigo-800 py-20">
                    <div className="container mx-auto px-6">
                        <div className="mb-16 text-center">
                            <h2 className="mb-4 font-serif text-4xl font-bold text-white">
                                {t('welcome.testimonials.title', 'Ils utilisent déjà EliteSMS')}
                            </h2>
                            <p className="mx-auto text-xl text-indigo-200 md:w-2/3">
                                {t('welcome.testimonials.subtitle', 'Découvrez comment des entreprises comme la vôtre transforment leur communication client')}
                            </p>
                        </div>

                        {/* Testimonial cards with image placeholders */}
                        <div className="flex flex-wrap -mx-4">
                            {/* Testimonial 1 */}
                            <div className="w-full md:w-1/3 px-4 mb-8">
                                <div className="bg-white rounded-lg shadow-xl overflow-hidden transform hover:scale-105 transition duration-300">
                                    <div className="h-48 bg-gray-200 relative">
                                        {/* Image placeholder */}
                                        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                                            <img src="/api/placeholder/400/320" alt="Testimonial 1" className="w-full h-full object-cover" />
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <p className="text-gray-600 mb-4 italic">"{t('welcome.testimonials.quote1', 'Grâce à EliteSMS, nous avons augmenté notre taux de fidélisation de 30% en seulement 3 mois. Un outil indispensable pour notre boutique.')}"</p>
                                        <div className="flex items-center">
                                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                                                <span className="text-indigo-600 font-bold">AM</span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800">Amadou Mbaye</p>
                                                <p className="text-gray-600 text-sm">Boutique Mode Dakar</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Testimonial 2 */}
                            <div className="w-full md:w-1/3 px-4 mb-8">
                                <div className="bg-white rounded-lg shadow-xl overflow-hidden transform hover:scale-105 transition duration-300">
                                    <div className="h-48 bg-gray-200 relative">
                                        {/* Image placeholder */}
                                        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                                            <img src="/api/placeholder/400/320" alt="Testimonial 2" className="w-full h-full object-cover" />
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <p className="text-gray-600 mb-4 italic">"{t('welcome.testimonials.quote2', 'L\'automatisation des messages d\'anniversaire a créé un lien fort avec nos clients. Ils apprécient cette attention personnalisée.')}"</p>
                                        <div className="flex items-center">
                                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                                                <span className="text-indigo-600 font-bold">FT</span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800">Fatou Touré</p>
                                                <p className="text-gray-600 text-sm">Restaurant Le Baobab</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Testimonial 3 */}
                            <div className="w-full md:w-1/3 px-4 mb-8">
                                <div className="bg-white rounded-lg shadow-xl overflow-hidden transform hover:scale-105 transition duration-300">
                                    <div className="h-48 bg-gray-200 relative">
                                        {/* Image placeholder */}
                                        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                                            <img src="/api/placeholder/400/320" alt="Testimonial 3" className="w-full h-full object-cover" />
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <p className="text-gray-600 mb-4 italic">"{t('welcome.testimonials.quote3', 'Le rapport qualité-prix est imbattable. Nous gérons efficacement notre communication avec plus de 1500 clients grâce à cette plateforme.')}"</p>
                                        <div className="flex items-center">
                                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                                                <span className="text-indigo-600 font-bold">OS</span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800">Ousmane Sow</p>
                                                <p className="text-gray-600 text-sm">Pharmacie Centrale</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Section with illustrations */}
                <div id="features" className="bg-white py-20 text-gray-800 relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-indigo-100 -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-blue-100 -ml-32 -mb-32"></div>

                    <div className="container mx-auto px-6 relative z-10">
                        <div className="mb-16 text-center">
                            <h2 className="mb-4 font-serif text-4xl font-bold">{t('welcome.features.title', 'Fonctionnalités puissantes')}</h2>
                            <p className="mx-auto text-xl text-gray-600 md:w-2/3">{t('welcome.features.subtitle', 'Tout ce dont vous avez besoin pour gérer efficacement vos communications par SMS')}</p>
                        </div>

                        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
                            {/* Feature 1 */}
                            <div className="rounded-xl bg-gradient-to-br from-white to-indigo-50 p-8 shadow-lg transform hover:scale-105 transition duration-300">
                                <div className="mb-6 inline-block rounded-full bg-indigo-100 p-4">
                                    <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <h3 className="mb-3 text-2xl font-bold">{t('welcome.features.feature1.title', 'Gestion des clients')}</h3>
                                <p className="text-gray-600 mb-4">{t('welcome.features.feature1.description', 'Organisez vos contacts par catégories et conservez toutes les informations importantes.')}</p>
                                <ul className="text-gray-600 space-y-2">
                                    <li className="flex items-center">
                                        <svg className="h-5 w-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                        </svg>
                                        Importation facile des contacts
                                    </li>
                                    <li className="flex items-center">
                                        <svg className="h-5 w-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                        </svg>
                                        Segmentation avancée
                                    </li>
                                </ul>
                            </div>

                            {/* Feature 2 */}
                            <div className="rounded-xl bg-gradient-to-br from-white to-indigo-50 p-8 shadow-lg transform hover:scale-105 transition duration-300">
                                <div className="mb-6 inline-block rounded-full bg-indigo-100 p-4">
                                    <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                    </svg>
                                </div>
                                <h3 className="mb-3 text-2xl font-bold">{t('welcome.features.feature2.title', 'Campagnes SMS')}</h3>
                                <p className="text-gray-600 mb-4">{t('welcome.features.feature2.description', 'Créez et programmez des campagnes SMS ciblées pour atteindre vos clients au bon moment.')}</p>
                                <ul className="text-gray-600 space-y-2">
                                    <li className="flex items-center">
                                        <svg className="h-5 w-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                        </svg>
                                        Programmation avancée
                                    </li>
                                    <li className="flex items-center">
                                        <svg className="h-5 w-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                        </svg>
                                        Analyse des performances
                                    </li>
                                </ul>
                            </div>

                            {/* Feature 3 */}
                            <div className="rounded-xl bg-gradient-to-br from-white to-indigo-50 p-8 shadow-lg transform hover:scale-105 transition duration-300">
                                <div className="mb-6 inline-block rounded-full bg-indigo-100 p-4">
                                    <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="mb-3 text-2xl font-bold">{t('welcome.features.feature3.title', 'Événements automatiques')}</h3>
                                <p className="text-gray-600 mb-4">{t('welcome.features.feature3.description', 'Automatisez les messages pour les anniversaires, fêtes et autres événements importants.')}</p>
                                <ul className="text-gray-600 space-y-2">
                                    <li className="flex items-center">
                                        <svg className="h-5 w-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                        </svg>
                                        Messages personnalisés
                                    </li>
                                    <li className="flex items-center">
                                        <svg className="h-5 w-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                        </svg>
                                        Envoi à date précise
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* How it works section with visual steps */}
                <div className="bg-gray-50 py-20">
                    <div className="container mx-auto px-6">
                        <div className="mb-16 text-center">
                            <h2 className="mb-4 font-serif text-4xl font-bold text-gray-800">
                                {t('welcome.howItWorks.title', 'Comment ça marche')}
                            </h2>
                            <p className="mx-auto text-xl text-gray-600 md:w-2/3">
                                {t('welcome.howItWorks.subtitle', 'En trois étapes simples, vous pouvez commencer à communiquer efficacement avec vos clients')}
                            </p>
                        </div>

                        <div className="flex flex-col md:flex-row items-center justify-center space-y-12 md:space-y-0 md:space-x-8">
                            {/* Step 1 */}
                            <div className="flex flex-col items-center max-w-xs text-center">
                                <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mb-6 shadow-md">
                                    <span className="text-3xl font-bold text-indigo-600">1</span>
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-gray-800">{t('welcome.howItWorks.step1.title', 'Créez votre compte')}</h3>
                                <p className="text-gray-600">{t('welcome.howItWorks.step1.description', 'Inscrivez-vous en quelques minutes et configurez votre espace personnel')}</p>
                            </div>

                            {/* Arrow */}
                            <div className="hidden md:block">
                                <svg className="w-12 h-12 text-indigo-300" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
                                </svg>
                            </div>

                            {/* Step 2 */}
                            <div className="flex flex-col items-center max-w-xs text-center">
                                <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mb-6 shadow-md">
                                    <span className="text-3xl font-bold text-indigo-600">2</span>
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-gray-800">{t('welcome.howItWorks.step2.title', 'Importez vos contacts')}</h3>
                                <p className="text-gray-600">{t('welcome.howItWorks.step2.description', 'Ajoutez vos clients et organisez-les en segments pertinents')}</p>
                            </div>

                            {/* Arrow */}
                            <div className="hidden md:block">
                                <svg className="w-12 h-12 text-indigo-300" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
                                </svg>
                            </div>

                            {/* Step 3 */}
                            <div className="flex flex-col items-center max-w-xs text-center">
                                <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mb-6 shadow-md">
                                    <span className="text-3xl font-bold text-indigo-600">3</span>
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-gray-800">{t('welcome.howItWorks.step3.title', 'Lancez vos campagnes')}</h3>
                                <p className="text-gray-600">{t('welcome.howItWorks.step3.description', 'Créez, planifiez et suivez vos campagnes SMS en toute simplicité')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pricing Section with hover effects */}
                <div id="pricing" className="bg-gradient-to-b from-gray-50 to-white py-20">
                    <div className="container mx-auto px-6">
                        <div className="mb-16 text-center">
                            <h2 className="mb-4 font-serif text-4xl font-bold text-gray-800">{t('welcome.pricing.title', 'Plans tarifaires')}</h2>
                            <p className="mx-auto text-xl text-gray-600 md:w-2/3">{t('welcome.pricing.subtitle', 'Choisissez le plan qui correspond le mieux à vos besoins')}</p>
                        </div>

                        <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
                            {/* Starter Plan */}
                            <div className="flex flex-col rounded-2xl bg-white p-8 shadow-xl border border-gray-100 hover:shadow-2xl hover:scale-105 transition-all duration-300">
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
                                <a href={route('register')} className="mt-auto rounded-md bg-indigo-600 px-5 py-3 text-center font-medium text-white hover:bg-indigo-700 transition-colors">
                                    {t('welcome.pricing.button', 'Commencer')}
                                </a>
                            </div>

                            {/* Business Plan */}
                            <div className="relative flex flex-col rounded-2xl bg-white p-8 shadow-xl border border-indigo-100 z-10 hover:shadow-2xl hover:scale-105 transition-all duration-300">
                                <div className="absolute -top-4 left-0 right-0 mx-auto w-32 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-lg">
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
                                <a href={route('register')} className="mt-auto rounded-md bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 text-center font-medium text-white shadow-md hover:from-indigo-700 hover:to-purple-700 transition-colors">
                                    {t('welcome.pricing.button', 'Commencer')}
                                </a>
                            </div>

                            {/* Enterprise Plan */}
                            <div className="flex flex-col rounded-2xl bg-white p-8 shadow-xl border border-gray-100 hover:shadow-2xl hover:scale-105 transition-all duration-300">
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
                                <a href={route('register')} className="mt-auto rounded-md bg-indigo-600 px-5 py-3 text-center font-medium text-white hover:bg-indigo-700 transition-colors">
                                    {t('welcome.pricing.button', 'Commencer')}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Image gallery section */}
                <div className="bg-indigo-50 py-20">
                    <div className="container mx-auto px-6">
                        <div className="mb-16 text-center">
                            <h2 className="mb-4 font-serif text-4xl font-bold text-gray-800">
                                {t('welcome.gallery.title', 'EliteSMS en action')}
                            </h2>
                            <p className="mx-auto text-xl text-gray-600 md:w-2/3">
                                {t('welcome.gallery.subtitle', 'Découvrez notre plateforme à travers ces captures d\'écran')}
                            </p>
                        </div>

                        {/* Image gallery grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Image 1 */}
                            <div className="rounded-xl overflow-hidden shadow-lg transform hover:scale-105 transition duration-300">
                                <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                                    <img src="/api/placeholder/400/320" alt="Dashboard" className="w-full h-full object-cover" />
                                </div>
                                <div className="p-4 bg-white">
                                    <h3 className="font-bold text-lg text-gray-800">Tableau de bord intuitif</h3>
                                    <p className="text-gray-600">Visualisez toutes vos statistiques en un coup d'œil</p>
                                </div>
                            </div>

                            {/* Image 2 */}
                            <div className="rounded-xl overflow-hidden shadow-lg transform hover:scale-105 transition duration-300">
                                <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                                    <img src="/api/placeholder/400/320" alt="Campaign Creation" className="w-full h-full object-cover" />
                                </div>
                                <div className="p-4 bg-white">
                                    <h3 className="font-bold text-lg text-gray-800">Création de campagne</h3>
                                    <p className="text-gray-600">Interface simple pour créer des campagnes efficaces</p>
                                </div>
                            </div>

                            {/* Image 3 */}
                            <div className="rounded-xl overflow-hidden shadow-lg transform hover:scale-105 transition duration-300">
                                <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                                    <img src="/api/placeholder/400/320" alt="Client Management" className="w-full h-full object-cover" />
                                </div>
                                <div className="p-4 bg-white">
                                    <h3 className="font-bold text-lg text-gray-800">Gestion des clients</h3>
                                    <p className="text-gray-600">Organisez et segmentez votre base de contacts</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Call To Action */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-700 py-16 relative overflow-hidden">
                    {/* Decorative circles */}
                    <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-white opacity-5 -mt-32 -ml-32"></div>
                    <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-white opacity-5 -mb-32 -mr-32"></div>

                    <div className="container mx-auto px-6 text-center relative z-10">
                        <h2 className="mb-6 font-serif text-3xl font-bold text-white md:text-4xl">
                            {t('welcome.cta.title', 'Prêt à améliorer vos communications par SMS?')}
                        </h2>
                        <p className="mb-8 text-xl text-indigo-200">
                            {t('welcome.cta.subtitle', 'Inscrivez-vous aujourd\'hui et obtenez 50 SMS gratuits pour essayer notre service')}
                        </p>
                        <a href={route('register')} className="inline-block rounded-full bg-white px-8 py-4 text-lg font-semibold text-indigo-800 shadow-lg hover:bg-opacity-90 transform hover:scale-105 transition duration-300">
                            {t('welcome.cta.button', 'Créer un compte gratuitement')}
                        </a>
                    </div>
                </div>

                {/* Footer */}
                <footer className="bg-gray-900 py-12 text-white">
                    <div className="container mx-auto px-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <div className="col-span-1">
                                <div className="flex items-center mb-4">
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
                                        <span className="text-lg font-bold">E</span>
                                    </div>
                                    <span className="ml-2 text-xl font-semibold">{t('app.name')}</span>
                                </div>
                                <p className="text-gray-400 mb-4">Plateforme professionnelle de gestion SMS pour fidéliser vos clients et développer votre business.</p>
                                <div className="flex space-x-4">
                                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path></svg>
                                    </a>
                                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"></path></svg>
                                    </a>
                                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path></svg>
                                    </a>
                                </div>
                            </div>

                            <div className="col-span-1">
                                <h3 className="font-bold text-lg mb-4">Produit</h3>
                                <ul className="space-y-2">
                                    <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">Fonctionnalités</a></li>
                                    <li><a href="#pricing" className="text-gray-400 hover:text-white transition-colors">Tarifs</a></li>
                                    <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Témoignages</a></li>
                                    <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Guide d'utilisation</a></li>
                                </ul>
                            </div>

                            <div className="col-span-1">
                                <h3 className="font-bold text-lg mb-4">Ressources</h3>
                                <ul className="space-y-2">
                                    <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
                                    <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Tutoriels</a></li>
                                    <li><a href="#" className="text-gray-400 hover:text-white transition-colors">FAQ</a></li>
                                    <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Support</a></li>
                                </ul>
                            </div>

                            <div className="col-span-1">
                                <h3 className="font-bold text-lg mb-4">Légal</h3>
                                <ul className="space-y-2">
                                    <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Confidentialité</a></li>
                                    <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Conditions d'utilisation</a></li>
                                    <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Mentions légales</a></li>
                                    <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
                                </ul>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-gray-800 text-center">
                            <p className="text-gray-400">
                                &copy; {new Date().getFullYear()} EliteSMS. {t('welcome.footer.rights', 'Tous droits réservés.')}
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}