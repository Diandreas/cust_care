import { Link, Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useTranslation } from '@/i18n';
import { useState, useEffect } from 'react';

export default function Welcome({
    auth,
    laravelVersion,
    phpVersion,
}: PageProps<{ laravelVersion: string; phpVersion: string }>) {
    const { t, i18n } = useTranslation();
    const [isScrolled, setIsScrolled] = useState(false);
    const [animatedStats, setAnimatedStats] = useState({
        clients: 0,
        messages: 0,
        satisfaction: 0
    });

    // Effet pour détecter le défilement
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Animation des statistiques
    useEffect(() => {
        const animateStats = () => {
            const duration = 2000;
            const steps = 60;
            const stepDuration = duration / steps;

            const targets = {
                clients: 8500,
                messages: 500000,
                satisfaction: 99
            };

            let currentStep = 0;
            const interval = setInterval(() => {
                currentStep++;
                const progress = currentStep / steps;

                setAnimatedStats({
                    clients: Math.floor(targets.clients * progress),
                    messages: Math.floor(targets.messages * progress),
                    satisfaction: Math.floor(targets.satisfaction * progress)
                });

                if (currentStep >= steps) {
                    clearInterval(interval);
                }
            }, stepDuration);
        };

        const timer = setTimeout(animateStats, 1000);
        return () => clearTimeout(timer);
    }, []);

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        localStorage.setItem('language', lng);
    };

    return (
        <>
            <Head title="HelloBoost - Plateforme SMS Nouvelle Génération" />
            <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 text-white overflow-hidden">
                {/* Animated background elements - Enhanced */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 opacity-20 animate-pulse blur-xl"></div>
                    <div className="absolute top-1/3 -left-40 w-80 h-80 rounded-full bg-gradient-to-r from-violet-400 to-purple-500 opacity-15 animate-bounce blur-2xl" style={{ animationDuration: '4s' }}></div>
                    <div className="absolute bottom-1/4 right-1/3 w-72 h-72 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 opacity-10 animate-pulse blur-xl" style={{ animationDelay: '2s' }}></div>
                    <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-gradient-to-r from-pink-400 to-rose-500 opacity-5 animate-spin" style={{ animationDuration: '20s' }}></div>

                    {/* Floating particles */}
                    <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full opacity-30 animate-ping" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-cyan-300 rounded-full opacity-40 animate-ping" style={{ animationDelay: '3s' }}></div>
                    <div className="absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-violet-300 rounded-full opacity-50 animate-ping" style={{ animationDelay: '2s' }}></div>
                </div>

                {/* Header - Enhanced */}
                <header className={`fixed w-full transition-all duration-500 z-50 ${isScrolled ? 'bg-slate-900/90 backdrop-blur-lg shadow-2xl py-3 border-b border-white/10' : 'bg-transparent py-6'}`}>
                    <div className="container mx-auto px-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center group">
                                <div className="relative">
                                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-violet-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-all duration-300">
                                        <span className="text-xl font-bold">🚀</span>
                                    </div>
                                    <div className="absolute -inset-1 bg-gradient-to-tr from-cyan-400 via-blue-500 to-violet-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition-opacity duration-300"></div>
                                </div>
                                <span className="ml-4 text-2xl font-bold bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent">
                                    HelloBoost
                                </span>
                            </div>
                            <div className="flex items-center space-x-6">
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => changeLanguage('fr')}
                                        className={`px-4 py-2 rounded-xl transition-all duration-300 ${i18n.language === 'fr' ? 'bg-white text-slate-900 shadow-lg transform scale-105' : 'text-white border border-white/20 hover:bg-white/10 hover:border-white/40'}`}
                                    >
                                        FR
                                    </button>
                                    <button
                                        onClick={() => changeLanguage('en')}
                                        className={`px-4 py-2 rounded-xl transition-all duration-300 ${i18n.language === 'en' ? 'bg-white text-slate-900 shadow-lg transform scale-105' : 'text-white border border-white/20 hover:bg-white/10 hover:border-white/40'}`}
                                    >
                                        EN
                                    </button>
                                </div>
                                {auth.user ? (
                                    <Link
                                        href={route('dashboard')}
                                        className="group relative rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
                                    >
                                        <span className="relative z-10">Tableau de bord</span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={route('login')}
                                            className="rounded-2xl border border-white/20 backdrop-blur-sm px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 hover:border-white/40 transition-all duration-300"
                                        >
                                            Connexion
                                        </Link>
                                        <Link
                                            href={route('register')}
                                            className="group relative rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
                                        >
                                            <span className="relative z-10">Inscription</span>
                                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Hero Section - Dramatically Enhanced */}
                <div className="pt-32 pb-24 relative z-10">
                    <div className="container mx-auto px-6">
                        <div className="flex flex-col lg:flex-row items-center">
                            {/* Left side - Text Content */}
                            <div className="lg:w-1/2 lg:pr-16 space-y-8">
                                <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 backdrop-blur-sm border border-cyan-400/30 shadow-lg">
                                    <span className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mr-3 animate-pulse shadow-lg"></span>
                                    <span className="text-sm font-semibold bg-gradient-to-r from-cyan-200 to-blue-200 bg-clip-text text-transparent">🚀 Plateforme SMS N°1 en Afrique de l'Ouest</span>
                                </div>

                                <h1 className="font-bold leading-tight">
                                    <span className="block text-6xl lg:text-7xl bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent mb-4">
                                        Boostez
                                    </span>
                                    <span className="block text-5xl lg:text-6xl bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent mb-4">
                                        votre business
                                    </span>
                                    <span className="block text-4xl lg:text-5xl text-gray-200">
                                        avec des SMS intelligents
                                    </span>
                                </h1>

                                <p className="text-xl text-gray-300 leading-relaxed max-w-2xl">
                                    Transformez votre communication client avec notre plateforme SMS nouvelle génération.
                                    <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent font-semibold"> Automatisation intelligente</span>,
                                    <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent font-semibold"> analyses en temps réel</span> et
                                    <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent font-semibold"> fidélisation maximale</span>.
                                </p>

                                {/* Enhanced Features highlights */}
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { icon: "⚡", text: "Activation instantanée", color: "from-yellow-400 to-orange-400" },
                                        { icon: "🎯", text: "Ciblage intelligent", color: "from-cyan-400 to-blue-400" },
                                        { icon: "📊", text: "Analytics avancées", color: "from-violet-400 to-purple-400" },
                                        { icon: "💎", text: "Prix imbattables", color: "from-emerald-400 to-teal-400" }
                                    ].map((feature, index) => (
                                        <div key={index} className="flex items-center group">
                                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${feature.color} bg-opacity-20 backdrop-blur-sm flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300 shadow-lg border border-white/10`}>
                                                <span className="text-lg">{feature.icon}</span>
                                            </div>
                                            <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors duration-300">{feature.text}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Link
                                        href={route('register')}
                                        className="group relative rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-600 px-8 py-4 text-lg font-bold text-white shadow-2xl hover:shadow-cyan-500/25 transform hover:scale-105 transition-all duration-300 overflow-hidden"
                                    >
                                        <span className="relative z-10 flex items-center justify-center">
                                            Démarrer gratuitement
                                            <span className="ml-2 text-xl">🚀</span>
                                        </span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                                    </Link>
                                    <a
                                        href="#features"
                                        className="group rounded-2xl border border-white/20 backdrop-blur-sm px-8 py-4 text-lg font-semibold text-white hover:bg-white/10 hover:border-white/40 transition-all duration-300 text-center"
                                    >
                                        <span className="flex items-center justify-center">
                                            Découvrir les fonctionnalités
                                            <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
                                        </span>
                                    </a>
                                </div>
                            </div>

                            {/* Right side - Enhanced mockup */}
                            <div className="lg:w-1/2 mt-16 lg:mt-0 flex justify-center">
                                <div className="relative">
                                    {/* Main phone mockup */}
                                    <div className="relative w-80 h-auto border-8 border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden transform hover:scale-105 transition-all duration-500 bg-gradient-to-br from-slate-900 to-slate-800">
                                        <div className="bg-gradient-to-br from-slate-800 via-purple-900 to-indigo-900 aspect-[9/16] relative overflow-hidden">
                                            {/* Enhanced status bar */}
                                            <div className="absolute top-0 left-0 right-0 h-10 bg-black/30 backdrop-blur-sm flex items-center justify-between px-6">
                                                <div className="flex space-x-1">
                                                    <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                                                    <div className="w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                                                    <div className="w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                                                </div>
                                                <div className="text-white text-sm font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">HelloBoost</div>
                                                <div className="flex items-center space-x-1">
                                                    <div className="w-6 h-3 border-2 border-white rounded-sm">
                                                        <div className="w-4 h-1 bg-green-400 rounded-sm"></div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Enhanced app content */}
                                            <div className="absolute inset-0 flex flex-col p-6 pt-16">
                                                {/* Header card */}
                                                <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-5 mb-6 flex items-center border border-white/20 shadow-xl">
                                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 mr-4 flex items-center justify-center shadow-lg">
                                                        <span className="text-white font-bold">🚀</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="w-28 h-3 bg-gradient-to-r from-white/40 to-transparent rounded mb-2"></div>
                                                        <div className="w-20 h-2 bg-gradient-to-r from-white/30 to-transparent rounded"></div>
                                                    </div>
                                                </div>

                                                {/* Enhanced message cards with real SMS examples */}
                                                <div className="space-y-4 flex-1">
                                                    {/* Message 1 - Cabinet dentaire anniversaire */}
                                                    <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-4 border border-white/10 shadow-lg">
                                                        <div className="flex items-center mb-2">
                                                            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center justify-center mr-2 text-xs">
                                                                🦷
                                                            </div>
                                                            <span className="text-white/70 text-xs font-medium">Cabinet Dr Diallo</span>
                                                        </div>
                                                        <p className="text-white text-sm leading-relaxed">
                                                            Le cabinet dentaire Dr Diallo vous souhaite un joyeux anniversaire ! 🎉 Profitez de 20% sur votre prochain rdv avec le code ANNIV20
                                                        </p>
                                                        <span className="text-white/50 text-xs">Il y a 2min</span>
                                                    </div>

                                                    {/* Message 2 - Boutique promotion */}
                                                    <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-lg rounded-2xl p-4 ml-auto w-4/5 border border-emerald-400/30 shadow-lg">
                                                        <div className="flex items-center mb-2">
                                                            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 flex items-center justify-center mr-2 text-xs">
                                                                👗
                                                            </div>
                                                            <span className="text-white/70 text-xs font-medium">Boutique Fatou</span>
                                                        </div>
                                                        <p className="text-white text-sm leading-relaxed">
                                                            🔥 FLASH SALE ! Jusqu'à 50% sur toute la collection. Valable jusqu'à demain 18h. Venez vite !
                                                        </p>
                                                        <span className="text-white/50 text-xs">Il y a 1h</span>
                                                    </div>

                                                    {/* Message 3 - Restaurant fidélisation */}
                                                    <div className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 backdrop-blur-lg rounded-2xl p-4 border border-violet-400/30 shadow-lg">
                                                        <div className="flex items-center mb-2">
                                                            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-violet-400 to-purple-400 flex items-center justify-center mr-2 text-xs">
                                                                🍽️
                                                            </div>
                                                            <span className="text-white/70 text-xs font-medium">Restaurant Le Baobab</span>
                                                        </div>
                                                        <p className="text-white text-sm leading-relaxed">
                                                            Bonjour Aminata ! Cela fait un moment... Revenez cette semaine et obtenez votre plat préféré GRATUIT ! 💝
                                                        </p>
                                                        <span className="text-white/50 text-xs">Il y a 3h</span>
                                                    </div>

                                                    {/* Message 4 - Pharmacie rappel */}
                                                    <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-lg rounded-2xl p-4 ml-auto w-4/5 border border-orange-400/30 shadow-lg">
                                                        <div className="flex items-center mb-2">
                                                            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-orange-400 to-red-400 flex items-center justify-center mr-2 text-xs">
                                                                💊
                                                            </div>
                                                            <span className="text-white/70 text-xs font-medium">Pharmacie Centrale</span>
                                                        </div>
                                                        <p className="text-white text-sm leading-relaxed">
                                                            ⏰ Rappel : Votre ordonnance expire demain. Passez nous voir avant 17h pour renouveler vos médicaments.
                                                        </p>
                                                        <span className="text-white/50 text-xs">Il y a 4h</span>
                                                    </div>
                                                </div>

                                                {/* Enhanced bottom action */}
                                                <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-4 flex items-center border border-white/20 shadow-xl">
                                                    <div className="flex-1 h-10 bg-gradient-to-r from-white/20 to-white/10 rounded-xl mr-3"></div>
                                                    <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl shadow-lg"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Enhanced floating elements */}
                                    <div className="absolute -top-8 -right-8 w-20 h-20 rounded-3xl bg-gradient-to-r from-emerald-400 to-teal-500 shadow-2xl flex items-center justify-center animate-bounce">
                                        <span className="text-3xl">📊</span>
                                    </div>
                                    <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-3xl bg-gradient-to-r from-violet-400 to-purple-500 shadow-2xl flex items-center justify-center animate-pulse">
                                        <span className="text-3xl">🎯</span>
                                    </div>
                                    <div className="absolute top-1/2 -right-10 w-16 h-16 rounded-3xl bg-gradient-to-r from-pink-400 to-rose-500 shadow-xl flex items-center justify-center animate-ping">
                                        <span className="text-2xl">💬</span>
                                    </div>
                                    <div className="absolute top-1/4 -left-6 w-14 h-14 rounded-3xl bg-gradient-to-r from-yellow-400 to-orange-500 shadow-xl flex items-center justify-center animate-bounce" style={{ animationDelay: '1s' }}>
                                        <span className="text-xl">⚡</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enhanced Statistics Section */}
                <div className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-xl py-20 relative z-10 border-y border-white/10">
                    <div className="container mx-auto px-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                            {[
                                {
                                    value: animatedStats.clients,
                                    suffix: "+",
                                    label: "Clients conquis",
                                    sublabel: "dans toute l'Afrique de l'Ouest",
                                    color: "from-cyan-400 to-blue-500",
                                    icon: "👥"
                                },
                                {
                                    value: animatedStats.messages,
                                    suffix: "+",
                                    label: "Messages envoyés",
                                    sublabel: "chaque mois",
                                    color: "from-violet-400 to-purple-500",
                                    icon: "📱"
                                },
                                {
                                    value: animatedStats.satisfaction,
                                    suffix: "%",
                                    label: "Taux de satisfaction",
                                    sublabel: "de nos utilisateurs",
                                    color: "from-emerald-400 to-teal-500",
                                    icon: "⭐"
                                }
                            ].map((stat, index) => (
                                <div key={index} className="group">
                                    <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-500">
                                        <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${stat.color} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                            {stat.icon}
                                        </div>
                                        <div className={`text-5xl md:text-6xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300`}>
                                            {stat.value.toLocaleString()}{stat.suffix}
                                        </div>
                                        <div className="text-xl text-white font-semibold mb-2">{stat.label}</div>
                                        <div className="text-gray-300">{stat.sublabel}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Enhanced Testimonial section */}
                <div className="bg-gradient-to-b from-slate-800 to-slate-900 py-24 relative overflow-hidden">
                    <div className="absolute inset-0">
                        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-gradient-to-r from-cyan-400/10 to-blue-500/10 blur-3xl"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-gradient-to-r from-violet-400/10 to-purple-500/10 blur-3xl"></div>
                    </div>

                    <div className="container mx-auto px-6 relative z-10">
                        <div className="mb-20 text-center">
                            <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-sm border border-emerald-400/30 mb-8">
                                <span className="text-sm font-semibold bg-gradient-to-r from-emerald-200 to-teal-200 bg-clip-text text-transparent">💬 Témoignages clients</span>
                            </div>
                            <h2 className="mb-6 text-5xl font-bold">
                                <span className="bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent">Ils ont boosté leur business</span>
                            </h2>
                            <p className="mx-auto text-xl text-gray-300 md:w-2/3 leading-relaxed">
                                Découvrez comment nos clients transforment leur communication et développent leur activité grâce à HelloBoost
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                {
                                    quote: "Grâce à HelloBoost, nous avons augmenté notre chiffre d'affaires de 45% en seulement 4 mois. L'automatisation des campagnes SMS est révolutionnaire !",
                                    author: "Amadou Mbaye",
                                    role: "CEO Boutique Mode Dakar",
                                    avatar: "AM",
                                    color: "from-cyan-400 to-blue-500"
                                },
                                {
                                    quote: "L'intelligence artificielle de HelloBoost a transformé notre relation client. Nos messages sont maintenant ultra-personnalisés et nos clients adorent !",
                                    author: "Fatou Touré",
                                    role: "Directrice Marketing Restaurant Le Baobab",
                                    avatar: "FT",
                                    color: "from-violet-400 to-purple-500"
                                },
                                {
                                    quote: "Le ROI est incroyable ! En 6 mois, nous gérons efficacement plus de 2000 clients avec HelloBoost. Interface intuitive et résultats garantis.",
                                    author: "Ousmane Sow",
                                    role: "Pharmacien Pharmacie Centrale",
                                    avatar: "OS",
                                    color: "from-emerald-400 to-teal-500"
                                }
                            ].map((testimonial, index) => (
                                <div key={index} className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/20 hover:border-white/40 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-500">
                                    <div className="mb-6">
                                        <div className="flex mb-4">
                                            {[...Array(5)].map((_, i) => (
                                                <span key={i} className="text-yellow-400 text-xl">⭐</span>
                                            ))}
                                        </div>
                                        <p className="text-gray-200 text-lg leading-relaxed italic">
                                            "{testimonial.quote}"
                                        </p>
                                    </div>
                                    <div className="flex items-center">
                                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${testimonial.color} flex items-center justify-center mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                            <span className="text-white font-bold text-lg">{testimonial.avatar}</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-lg">{testimonial.author}</p>
                                            <p className="text-gray-400">{testimonial.role}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Enhanced Features Section */}
                <div id="features" className="py-24 bg-gradient-to-b from-transparent to-slate-900/30 relative z-10">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-20">
                            <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 backdrop-blur-sm border border-cyan-400/30 mb-8">
                                <span className="text-sm font-semibold bg-gradient-to-r from-cyan-200 to-blue-200 bg-clip-text text-transparent">✨ Fonctionnalités nouvelle génération</span>
                            </div>
                            <h2 className="text-5xl md:text-6xl font-bold mb-6">
                                <span className="bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent">Tout ce dont vous avez besoin</span>
                            </h2>
                            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                                Des outils puissants et une intelligence artificielle avancée pour transformer votre communication client en machine à succès
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[
                                {
                                    icon: "🚀",
                                    title: "Envoi Ultra-Rapide",
                                    description: "Livraison instantanée avec notre infrastructure mondiale optimisée",
                                    color: "from-cyan-400 to-blue-500",
                                    feature: "Livraison en <1s"
                                },
                                {
                                    icon: "🎯",
                                    title: "Ciblage Intelligent",
                                    description: "IA avancée pour segmenter et personnaliser automatiquement",
                                    color: "from-violet-400 to-purple-500",
                                    feature: "Segmentation IA"
                                },
                                {
                                    icon: "📊",
                                    title: "Analytics Prédictives",
                                    description: "Insights en temps réel avec prédictions comportementales",
                                    color: "from-emerald-400 to-teal-500",
                                    feature: "Prédictions IA"
                                },
                                {
                                    icon: "🤖",
                                    title: "Automatisation Smart",
                                    description: "Workflows intelligents qui s'adaptent au comportement client",
                                    color: "from-pink-400 to-rose-500",
                                    feature: "AutoPilot IA"
                                },
                                {
                                    icon: "🔒",
                                    title: "Sécurité Militaire",
                                    description: "Chiffrement quantique et protection données bancaire",
                                    color: "from-orange-400 to-red-500",
                                    feature: "Chiffrement AES-256"
                                },
                                {
                                    icon: "🌐",
                                    title: "Intégrations Universelles",
                                    description: "Plus de 500 intégrations natives et API GraphQL moderne",
                                    color: "from-yellow-400 to-orange-500",
                                    feature: "500+ intégrations"
                                }
                            ].map((feature, index) => (
                                <div key={index} className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/20 hover:border-white/40 transition-all duration-500 hover:scale-105 hover:shadow-2xl">
                                    <div className={`w-20 h-20 rounded-3xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-xl text-3xl`}>
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-cyan-300 transition-colors duration-300">
                                        {feature.title}
                                    </h3>
                                    <p className="text-gray-300 leading-relaxed mb-4">
                                        {feature.description}
                                    </p>
                                    <div className={`inline-flex items-center text-sm font-semibold bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`}>
                                        <span className="w-2 h-2 bg-current rounded-full mr-2 animate-pulse"></span>
                                        {feature.feature}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Enhanced CTA in features */}
                        <div className="text-center mt-16">
                            <div className="inline-flex items-center space-x-6">
                                <Link
                                    href={route('register')}
                                    className="group relative rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-600 px-10 py-5 text-xl font-bold text-white shadow-2xl hover:shadow-cyan-500/25 transform hover:scale-105 transition-all duration-300 overflow-hidden"
                                >
                                    <span className="relative z-10">Démarrer l'expérience gratuite</span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </Link>
                                <span className="text-gray-300 text-lg">ou</span>
                                <a
                                    href="#pricing"
                                    className="text-white hover:text-cyan-300 font-semibold text-lg transition-colors duration-200 underline decoration-cyan-400 underline-offset-4 hover:decoration-cyan-300"
                                >
                                    Découvrir les tarifs →
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* New Use Cases Section with Real SMS Examples */}
                <div className="bg-gradient-to-b from-slate-900/50 to-slate-800/50 backdrop-blur-sm py-24 relative overflow-hidden border-y border-white/10">
                    <div className="absolute inset-0">
                        <div className="absolute top-1/3 left-1/4 w-80 h-80 rounded-full bg-gradient-to-r from-indigo-400/10 to-purple-500/10 blur-3xl"></div>
                        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 rounded-full bg-gradient-to-r from-emerald-400/10 to-teal-500/10 blur-3xl"></div>
                    </div>

                    <div className="container mx-auto px-6 relative z-10">
                        <div className="text-center mb-20">
                            <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-sm border border-indigo-400/30 mb-8">
                                <span className="text-sm font-semibold bg-gradient-to-r from-indigo-200 to-purple-200 bg-clip-text text-transparent">💼 Cas d'usage concrets</span>
                            </div>
                            <h2 className="text-5xl md:text-6xl font-bold mb-6">
                                <span className="bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">HelloBoost pour votre secteur</span>
                            </h2>
                            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                                Découvrez comment des milliers d'entrepreneurs utilisent HelloBoost pour développer leur activité
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            {[
                                {
                                    sector: "🏥 Secteur Médical",
                                    description: "Rappels de rendez-vous, anniversaires patients, promotions",
                                    color: "from-blue-400 to-cyan-500",
                                    messages: [
                                        {
                                            business: "Cabinet Dr Diallo",
                                            message: "Bonjour Mme Kone ! RDV demain 14h pour contrôle. Merci de confirmer en répondant OUI. Cabinet Dr Diallo 📞 77-123-4567",
                                            type: "Rappel RDV"
                                        },
                                        {
                                            business: "Pharmacie Centrale",
                                            message: "🎉 Joyeux anniversaire Aminata ! Profitez de 15% sur tous vos achats aujourd'hui avec le code ANNIV15. Pharmacie Centrale",
                                            type: "Fidélisation"
                                        }
                                    ]
                                },
                                {
                                    sector: "🛍️ Commerce & Retail",
                                    description: "Promotions, nouveautés, fidélisation client",
                                    color: "from-emerald-400 to-teal-500",
                                    messages: [
                                        {
                                            business: "Boutique Fatou",
                                            message: "🔥 MEGA PROMO ! Robes -50%, Chaussures -40% jusqu'à Dimanche seulement ! Venez vite nous voir. Boutique Fatou - Marché Sandaga",
                                            type: "Promotion Flash"
                                        },
                                        {
                                            business: "Superette Moderne",
                                            message: "Nouveau stock arrivé ! Riz parfumé, huile de qualité et produits frais disponibles. Livraison gratuite > 15.000F 🚚",
                                            type: "Nouveautés"
                                        }
                                    ]
                                },
                                {
                                    sector: "🍽️ Restauration",
                                    description: "Menu du jour, événements spéciaux, fidélisation",
                                    color: "from-orange-400 to-red-500",
                                    messages: [
                                        {
                                            business: "Restaurant Le Baobab",
                                            message: "Menu spécial Vendredi : Thiebou dien + boisson 3.500F seulement ! Réservation conseillée 📞 78-456-7890. Restaurant Le Baobab",
                                            type: "Menu spécial"
                                        },
                                        {
                                            business: "Café Teranga",
                                            message: "Bonsoir Omar ! Votre table préférée vous attend demain soir 19h pour votre anniversaire 🎂 Surprise garantie ! Café Teranga",
                                            type: "Personnalisé"
                                        }
                                    ]
                                },
                                {
                                    sector: "🎓 Éducation & Formation",
                                    description: "Rappels cours, résultats, événements",
                                    color: "from-violet-400 to-purple-500",
                                    messages: [
                                        {
                                            business: "Institut CERCO",
                                            message: "Rappel : Examen de Marketing lundi 8h. N'oubliez pas calculatrice + pièce d'identité. Bon courage ! Institut CERCO",
                                            type: "Rappel important"
                                        },
                                        {
                                            business: "École de Conduite",
                                            message: "🎉 Félicitations Ibrahima ! Permis obtenu avec succès. Passez récupérer votre certificat dès demain. École de Conduite Elite",
                                            type: "Résultats"
                                        }
                                    ]
                                }
                            ].map((sector, index) => (
                                <div key={index} className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/20 hover:border-white/40 shadow-xl hover:shadow-2xl transition-all duration-500">
                                    <div className="mb-8">
                                        <div className={`inline-flex items-center px-4 py-2 rounded-2xl bg-gradient-to-r ${sector.color} bg-opacity-20 backdrop-blur-sm border border-white/20 mb-4`}>
                                            <span className="text-lg font-bold text-white">{sector.sector}</span>
                                        </div>
                                        <p className="text-gray-300 text-lg">{sector.description}</p>
                                    </div>

                                    <div className="space-y-6">
                                        {sector.messages.map((msg, msgIndex) => (
                                            <div key={msgIndex} className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className={`text-sm font-semibold bg-gradient-to-r ${sector.color} bg-clip-text text-transparent`}>
                                                        {msg.business}
                                                    </span>
                                                    <span className="text-xs bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-gray-300">
                                                        {msg.type}
                                                    </span>
                                                </div>
                                                <p className="text-white leading-relaxed text-sm bg-gradient-to-r from-slate-900/50 to-slate-800/50 rounded-xl p-4 border border-white/10">
                                                    "{msg.message}"
                                                </p>
                                                <div className="flex items-center justify-between mt-3">
                                                    <span className="text-xs text-gray-400">📊 Taux d'ouverture: 98%</span>
                                                    <span className="text-xs text-green-400">✅ Livré avec succès</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="text-center mt-16">
                            <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/20 max-w-4xl mx-auto">
                                <h3 className="text-2xl font-bold text-white mb-4">
                                    💡 Votre secteur n'est pas listé ?
                                </h3>
                                <p className="text-gray-300 mb-6 leading-relaxed">
                                    HelloBoost s'adapte à TOUS les secteurs d'activité ! Immobilier, automobile, beauté, fitness, événementiel...
                                    Notre IA vous aide à créer les messages parfaits pour votre audience.
                                </p>
                                <Link
                                    href={route('register')}
                                    className="group relative rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-600 px-8 py-4 text-lg font-bold text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden inline-block"
                                >
                                    <span className="relative z-10">Tester avec mon activité</span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enhanced How it works section */}
                <div className="bg-gradient-to-b from-white/5 to-white/10 backdrop-blur-sm py-24 border-y border-white/10">
                    <div className="container mx-auto px-6">
                        <div className="mb-20 text-center">
                            <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-400/30 mb-8">
                                <span className="text-sm font-semibold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">⚡ Simplicité maximale</span>
                            </div>
                            <h2 className="mb-6 text-5xl font-bold">
                                <span className="bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">Comment ça marche ?</span>
                            </h2>
                            <p className="mx-auto text-xl text-gray-300 md:w-2/3">
                                3 étapes simples pour révolutionner votre communication client
                            </p>
                        </div>

                        <div className="flex flex-col items-center space-y-12 md:flex-row md:items-start md:space-x-8 md:space-y-0 justify-center">
                            {[
                                {
                                    step: "1",
                                    title: "Créez votre compte",
                                    description: "Inscription en 2 minutes, activation instantanée et 50 SMS offerts pour commencer",
                                    color: "from-cyan-400 to-blue-500",
                                    icon: "👤"
                                },
                                {
                                    step: "2",
                                    title: "Importez vos contacts",
                                    description: "Glissez-déposez votre fichier Excel/CSV ou connectez vos outils existants en un clic",
                                    color: "from-violet-400 to-purple-500",
                                    icon: "📋"
                                },
                                {
                                    step: "3",
                                    title: "Lancez vos campagnes",
                                    description: "Créez des messages personnalisés avec l'IA et regardez vos ventes décoller",
                                    color: "from-emerald-400 to-teal-500",
                                    icon: "🚀"
                                }
                            ].map((step, index) => (
                                <div key={index} className="flex flex-col items-center max-w-sm text-center group">
                                    <div className="relative mb-8">
                                        <div className={`w-24 h-24 rounded-3xl bg-gradient-to-r ${step.color} flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-300`}>
                                            <span className="text-3xl">{step.icon}</span>
                                        </div>
                                        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white text-slate-900 flex items-center justify-center font-bold text-lg shadow-lg">
                                            {step.step}
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-cyan-300 transition-colors duration-300">
                                        {step.title}
                                    </h3>
                                    <p className="text-gray-300 leading-relaxed">
                                        {step.description}
                                    </p>

                                    {/* Arrow between steps (hidden on mobile) */}
                                    {index < 2 && (
                                        <div className="hidden md:block absolute top-12 left-full w-16 h-0.5 bg-gradient-to-r from-white/30 to-transparent ml-4">
                                            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-white/30 border-y-2 border-y-transparent"></div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Enhanced Pricing Section */}
                <div id="pricing" className="bg-gradient-to-b from-slate-900 to-slate-800 py-24 relative overflow-hidden">
                    <div className="absolute inset-0">
                        <div className="absolute top-1/3 left-1/3 w-96 h-96 rounded-full bg-gradient-to-r from-cyan-400/5 to-blue-500/5 blur-3xl"></div>
                        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 rounded-full bg-gradient-to-r from-violet-400/5 to-purple-500/5 blur-3xl"></div>
                    </div>

                    <div className="container mx-auto px-6 relative z-10">
                        <div className="mb-20 text-center">
                            <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/30 mb-8">
                                <span className="text-sm font-semibold bg-gradient-to-r from-green-200 to-emerald-200 bg-clip-text text-transparent">💎 Tarifs transparents</span>
                            </div>
                            <h2 className="mb-6 text-5xl font-bold">
                                <span className="bg-gradient-to-r from-white via-green-200 to-emerald-200 bg-clip-text text-transparent">Plans sur mesure</span>
                            </h2>
                            <p className="mx-auto text-xl text-gray-300 md:w-2/3">
                                Choisissez le plan parfait pour booster votre business - sans engagement, changement possible à tout moment
                            </p>
                        </div>

                        <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
                            {[
                                {
                                    name: "Pack Starter",
                                    price: "7.500",
                                    description: "Parfait pour découvrir HelloBoost",
                                    color: "from-cyan-400 to-blue-500",
                                    features: [
                                        "Jusqu'à 150 clients",
                                        "3 campagnes par mois (300 SMS)",
                                        "75 SMS personnalisés par mois",
                                        "Support par email",
                                        "Analytics de base"
                                    ],
                                    popular: false
                                },
                                {
                                    name: "Pack Business",
                                    price: "18.000",
                                    description: "Le choix des entrepreneurs ambitieux",
                                    color: "from-violet-400 to-purple-500",
                                    features: [
                                        "Jusqu'à 750 clients",
                                        "6 campagnes par mois (1.500 SMS)",
                                        "300 SMS personnalisés par mois",
                                        "Report de 15% des SMS non utilisés",
                                        "Support prioritaire",
                                        "Analytics avancées + IA"
                                    ],
                                    popular: true
                                },
                                {
                                    name: "Pack Enterprise",
                                    price: "35.000",
                                    description: "Pour les leaders du marché",
                                    color: "from-emerald-400 to-teal-500",
                                    features: [
                                        "Jusqu'à 3.000 clients",
                                        "12 campagnes par mois (6.000 SMS)",
                                        "750 SMS personnalisés par mois",
                                        "Report de 25% des SMS non utilisés",
                                        "Support dédié 24/7",
                                        "Analytics prédictives IA",
                                        "API complète + Webhooks"
                                    ],
                                    popular: false
                                }
                            ].map((plan, index) => (
                                <div key={index} className={`relative flex flex-col bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-3xl p-8 border ${plan.popular ? 'border-violet-400/50 scale-105' : 'border-white/20'} shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-500`}>
                                    {plan.popular && (
                                        <div className="absolute -top-4 left-0 right-0 mx-auto w-40 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2 text-center text-sm font-bold text-white shadow-xl">
                                            🔥 Plus populaire
                                        </div>
                                    )}

                                    <div className="mb-8 flex flex-col">
                                        <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${plan.color} flex items-center justify-center text-2xl shadow-lg`}>
                                            {index === 0 ? "🚀" : index === 1 ? "⭐" : "👑"}
                                        </div>
                                        <h3 className="text-2xl font-bold text-white text-center mb-2">{plan.name}</h3>
                                        <div className="text-center mb-4">
                                            <div className="flex items-baseline justify-center">
                                                <span className={`text-5xl font-extrabold bg-gradient-to-r ${plan.color} bg-clip-text text-transparent`}>
                                                    {plan.price}
                                                </span>
                                                <span className="ml-2 text-xl text-gray-400">FCFA</span>
                                            </div>
                                            <span className="text-gray-400">/mois</span>
                                        </div>
                                        <p className="text-gray-300 text-center">{plan.description}</p>
                                    </div>

                                    <ul className="mb-8 space-y-4 flex-1">
                                        {plan.features.map((feature, featureIndex) => (
                                            <li key={featureIndex} className="flex items-center">
                                                <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${plan.color} flex items-center justify-center mr-3 text-sm`}>
                                                    ✓
                                                </div>
                                                <span className="text-gray-200">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <Link
                                        href={route('register')}
                                        className={`mt-auto rounded-2xl px-6 py-4 text-center font-bold transition-all duration-300 ${plan.popular
                                            ? `bg-gradient-to-r ${plan.color} text-white shadow-xl hover:shadow-2xl transform hover:scale-105`
                                            : `border border-white/30 text-white hover:bg-white/10`
                                            }`}
                                    >
                                        Choisir ce plan
                                    </Link>
                                </div>
                            ))}
                        </div>

                        <div className="mt-16 text-center">
                            <p className="text-gray-400 mb-4">
                                🎁 <span className="text-white font-semibold">Offre de lancement :</span> 50 SMS gratuits pour tous les nouveaux inscrits
                            </p>
                            <p className="text-gray-500 text-sm">
                                Tous les plans incluent un essai gratuit de 7 jours • Annulation possible à tout moment • Support inclus
                            </p>
                        </div>
                    </div>
                </div>

                {/* Enhanced Gallery section */}
                <div className="bg-gradient-to-b from-slate-800 to-slate-900 py-24 relative overflow-hidden">
                    <div className="absolute inset-0">
                        <div className="absolute top-1/4 right-1/4 w-72 h-72 rounded-full bg-gradient-to-r from-pink-400/10 to-rose-500/10 blur-3xl"></div>
                        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full bg-gradient-to-r from-yellow-400/10 to-orange-500/10 blur-3xl"></div>
                    </div>

                    <div className="container mx-auto px-6 relative z-10">
                        <div className="mb-20 text-center">
                            <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-pink-500/20 to-rose-500/20 backdrop-blur-sm border border-pink-400/30 mb-8">
                                <span className="text-sm font-semibold bg-gradient-to-r from-pink-200 to-rose-200 bg-clip-text text-transparent">🎨 Interface moderne</span>
                            </div>
                            <h2 className="mb-6 text-5xl font-bold">
                                <span className="bg-gradient-to-r from-white via-pink-200 to-rose-200 bg-clip-text text-transparent">Découvrez HelloBoost en action</span>
                            </h2>
                            <p className="mx-auto text-xl text-gray-300 md:w-2/3">
                                Une interface intuitive conçue pour maximiser votre productivité et vos résultats
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[
                                {
                                    title: "Dashboard intelligent",
                                    description: "Visualisez toutes vos métriques en temps réel avec des graphiques interactifs",
                                    color: "from-cyan-400 to-blue-500",
                                    icon: "📊"
                                },
                                {
                                    title: "Créateur de campagne IA",
                                    description: "Interface révolutionnaire pour créer des campagnes personnalisées en quelques clics",
                                    color: "from-violet-400 to-purple-500",
                                    icon: "🎯"
                                },
                                {
                                    title: "Gestion contacts avancée",
                                    description: "Organisez et segmentez votre base client avec des outils d'analyse comportementale",
                                    color: "from-emerald-400 to-teal-500",
                                    icon: "👥"
                                }
                            ].map((item, index) => (
                                <div key={index} className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-3xl overflow-hidden border border-white/20 hover:border-white/40 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-500">
                                    {/* Mock screenshot area */}
                                    <div className="h-48 bg-gradient-to-br from-slate-700 to-slate-800 relative overflow-hidden">
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-r ${item.color} flex items-center justify-center text-3xl shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                                                {item.icon}
                                            </div>
                                        </div>
                                        {/* Decorative elements */}
                                        <div className="absolute top-4 left-4 w-3 h-3 rounded-full bg-red-400"></div>
                                        <div className="absolute top-4 left-10 w-3 h-3 rounded-full bg-yellow-400"></div>
                                        <div className="absolute top-4 left-16 w-3 h-3 rounded-full bg-green-400"></div>

                                        {/* Mock interface elements */}
                                        <div className="absolute bottom-4 left-4 right-4 space-y-2">
                                            <div className="h-2 bg-white/20 rounded"></div>
                                            <div className="h-2 bg-white/15 rounded w-3/4"></div>
                                            <div className="h-2 bg-white/10 rounded w-1/2"></div>
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        <h3 className="font-bold text-xl text-white mb-3 group-hover:text-cyan-300 transition-colors duration-300">
                                            {item.title}
                                        </h3>
                                        <p className="text-gray-300 leading-relaxed">
                                            {item.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Enhanced Call To Action */}
                <div className="bg-gradient-to-r from-cyan-600 via-blue-700 to-violet-800 py-24 relative overflow-hidden">
                    {/* Enhanced decorative elements */}
                    <div className="absolute inset-0">
                        <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-white opacity-5 -mt-48 -ml-48 animate-pulse"></div>
                        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-white opacity-5 -mb-40 -mr-40 animate-pulse" style={{ animationDelay: '1s' }}></div>
                        <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-gradient-to-r from-yellow-400/10 to-orange-500/10 blur-3xl"></div>
                    </div>

                    <div className="container mx-auto px-6 text-center relative z-10">
                        <div className="max-w-4xl mx-auto">
                            <div className="inline-flex items-center px-6 py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8">
                                <span className="text-sm font-semibold text-white">🎉 Offre limitée</span>
                            </div>

                            <h2 className="mb-6 text-5xl font-bold text-white md:text-6xl leading-tight">
                                Prêt à <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">booster</span> votre business ?
                            </h2>

                            <p className="mb-12 text-xl text-blue-100 leading-relaxed max-w-3xl mx-auto">
                                Rejoignez plus de 8 500 entrepreneurs qui ont déjà transformé leur communication client avec HelloBoost.
                                <span className="font-semibold text-white"> Démarrez gratuitement dès aujourd'hui</span> et obtenez vos premiers résultats en moins de 24h !
                            </p>

                            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8">
                                <Link
                                    href={route('register')}
                                    className="group relative rounded-2xl bg-white px-10 py-5 text-xl font-bold text-slate-900 shadow-2xl hover:shadow-white/25 transform hover:scale-105 transition-all duration-300 overflow-hidden"
                                >
                                    <span className="relative z-10 flex items-center">
                                        Commencer gratuitement maintenant
                                        <span className="ml-3 text-2xl group-hover:translate-x-1 transition-transform duration-300">🚀</span>
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-200 to-orange-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </Link>

                                <div className="flex items-center text-blue-100">
                                    <span className="text-lg">💳</span>
                                    <span className="ml-2 font-medium">Aucune carte requise • 50 SMS offerts</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap justify-center items-center gap-8 text-blue-200">
                                <div className="flex items-center">
                                    <span className="text-xl mr-2">⚡</span>
                                    <span className="font-medium">Activation en 2 minutes</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="text-xl mr-2">🛡️</span>
                                    <span className="font-medium">Sécurité bancaire</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="text-xl mr-2">📞</span>
                                    <span className="font-medium">Support 24/7</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enhanced Footer */}
                <footer className="bg-gradient-to-t from-slate-900 to-slate-800 py-20 text-white border-t border-white/10">
                    <div className="container mx-auto px-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                            <div className="col-span-1 md:col-span-2">
                                <div className="flex items-center mb-6">
                                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center shadow-xl mr-4">
                                        <span className="text-xl font-bold">🚀</span>
                                    </div>
                                    <span className="text-3xl font-bold bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent">HelloBoost</span>
                                </div>
                                <p className="text-gray-400 mb-6 max-w-md leading-relaxed">
                                    La plateforme SMS nouvelle génération qui propulse votre business vers de nouveaux sommets.
                                    Conçue par des entrepreneurs, pour des entrepreneurs.
                                </p>
                                <div className="flex space-x-4">
                                    {[
                                        { name: 'Twitter', icon: '🐦' },
                                        { name: 'Facebook', icon: '📘' },
                                        { name: 'LinkedIn', icon: '💼' },
                                        { name: 'Instagram', icon: '📸' }
                                    ].map((social) => (
                                        <a
                                            key={social.name}
                                            href="#"
                                            className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:scale-110"
                                            title={social.name}
                                        >
                                            <span className="text-xl">{social.icon}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>

                            <div className="col-span-1">
                                <h3 className="font-bold text-lg mb-6 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Produit</h3>
                                <ul className="space-y-3">
                                    {['Fonctionnalités', 'Tarifs', 'Témoignages', 'Guide de démarrage', 'API Documentation'].map((item) => (
                                        <li key={item}>
                                            <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 hover:underline">
                                                {item}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="col-span-1">
                                <h3 className="font-bold text-lg mb-6 bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Support</h3>
                                <ul className="space-y-3">
                                    {['Centre d\'aide', 'Tutoriels', 'FAQ', 'Contact', 'Statut système'].map((item) => (
                                        <li key={item}>
                                            <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 hover:underline">
                                                {item}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
                            <p className="text-gray-500 mb-4 md:mb-0">
                                &copy; {new Date().getFullYear()} HelloBoost. Tous droits réservés.
                                <span className="text-red-400 mx-1">♥</span>
                                Made in West Africa
                            </p>
                            <div className="flex space-x-6 text-sm">
                                <a href="#" className="text-gray-500 hover:text-white transition-colors duration-200">Confidentialité</a>
                                <a href="#" className="text-gray-500 hover:text-white transition-colors duration-200">Conditions</a>
                                <a href="#" className="text-gray-500 hover:text-white transition-colors duration-200">Mentions légales</a>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}