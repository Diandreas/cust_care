import { Link, Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useTranslation } from '@/i18n';
import { useState, useEffect, useRef } from 'react';

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
    const [visibleSections, setVisibleSections] = useState(new Set());
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    // Détection des préférences de mouvement
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReducedMotion(mediaQuery.matches);

        const handleChange = (e) => setPrefersReducedMotion(e.matches);
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    // Gestion du scroll
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Intersection Observer pour les animations
    useEffect(() => {
        if (prefersReducedMotion) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setVisibleSections(prev => new Set([...prev, entry.target.id]));
                    }
                });
            },
            { threshold: 0.2 }
        );

        document.querySelectorAll('[data-section]').forEach(el => {
            observer.observe(el);
        });

        return () => observer.disconnect();
    }, [prefersReducedMotion]);

    // Animation des statistiques
    useEffect(() => {
        if (prefersReducedMotion || !visibleSections.has('stats')) return;

        const animateStats = () => {
            const duration = 1500;
            const targets = { clients: 8500, messages: 500000, satisfaction: 99 };
            const startTime = Date.now();

            const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

            const updateStats = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = easeOutQuart(progress);

                setAnimatedStats({
                    clients: Math.floor(targets.clients * easedProgress),
                    messages: Math.floor(targets.messages * easedProgress),
                    satisfaction: Math.floor(targets.satisfaction * easedProgress)
                });

                if (progress < 1) {
                    requestAnimationFrame(updateStats);
                }
            };

            requestAnimationFrame(updateStats);
        };

        animateStats();
    }, [visibleSections, prefersReducedMotion]);

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        localStorage.setItem('language', lng);
    };

    return (
        <>
            <Head title="HelloBoost - Plateforme SMS Intelligente" />

            <div className="min-h-screen bg-white text-gray-900">
                {/* Header Modern & Clean */}
                <header className={`fixed w-full top-0 z-50 transition-all duration-300 ${
                    isScrolled
                        ? 'bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm'
                        : 'bg-transparent'
                }`}>
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            {/* Logo */}
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                                    <span className="text-white text-sm font-bold">H</span>
                                </div>
                                <span className="text-xl font-semibold text-gray-900">HelloBoost</span>
                            </div>

                            {/* Navigation */}
                            <nav className="hidden md:flex items-center space-x-8">
                                <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
                                    Fonctionnalités
                                </a>
                                <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
                                    Tarifs
                                </a>
                                <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors">
                                    Témoignages
                                </a>
                            </nav>

                            {/* Actions */}
                            <div className="flex items-center space-x-4">
                                {/* Language Switcher */}
                                <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                                    <button
                                        onClick={() => changeLanguage('fr')}
                                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                                            i18n.language === 'fr'
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        FR
                                    </button>
                                    <button
                                        onClick={() => changeLanguage('en')}
                                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                                            i18n.language === 'en'
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        EN
                                    </button>
                                </div>

                                {auth.user ? (
                                    <Link
                                        href={route('dashboard')}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                    >
                                        Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={route('login')}
                                            className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
                                        >
                                            Connexion
                                        </Link>
                                        <Link
                                            href={route('register')}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                        >
                                            Commencer
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Hero Section - Clean & Modern */}
                <section className="pt-24 pb-16 lg:pt-32 lg:pb-24" data-section id="hero">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="text-center max-w-4xl mx-auto">
                            {/* Badge */}
                            <div className={`inline-flex items-center px-4 py-2 bg-blue-50 rounded-full text-blue-700 text-sm font-medium mb-8 ${
                                visibleSections.has('hero') && !prefersReducedMotion ? 'animate-fade-in' : ''
                            }`}>
                                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                Plateforme SMS N°1 en Afrique de l'Ouest
                            </div>

                            {/* Main Headline */}
                            <h1 className={`text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight ${
                                visibleSections.has('hero') && !prefersReducedMotion ? 'animate-fade-in-up' : ''
                            }`} style={{ animationDelay: '0.1s' }}>
                                SMS intelligent.
                                <br />
                                <span className="text-blue-600">Business boosté.</span>
                            </h1>

                            {/* Subtitle */}
                            <p className={`text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed ${
                                visibleSections.has('hero') && !prefersReducedMotion ? 'animate-fade-in-up' : ''
                            }`} style={{ animationDelay: '0.2s' }}>
                                Transformez votre communication client avec l'IA.
                                Automatisation intelligente, résultats garantis.
                            </p>

                            {/* CTA Buttons */}
                            <div className={`flex flex-col sm:flex-row gap-4 justify-center mb-16 ${
                                visibleSections.has('hero') && !prefersReducedMotion ? 'animate-fade-in-up' : ''
                            }`} style={{ animationDelay: '0.3s' }}>
                                <Link
                                    href={route('register')}
                                    className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-all duration-200 transform hover:scale-105"
                                >
                                    Démarrer gratuitement
                                </Link>
                                <button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-200">
                                    Voir la démo
                                </button>
                            </div>

                            {/* Trust Indicators */}
                            <div className={`flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-gray-500 ${
                                visibleSections.has('hero') && !prefersReducedMotion ? 'animate-fade-in-up' : ''
                            }`} style={{ animationDelay: '0.4s' }}>
                                <div className="flex items-center">
                                    <span className="text-yellow-500 mr-1">★★★★★</span>
                                    <span>4.9/5 sur 2,847 avis</span>
                                </div>
                                <div className="flex items-center">
                                    <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                    </svg>
                                    <span>Essai gratuit - Sans engagement</span>
                                </div>
                            </div>
                        </div>

                        {/* Product Preview */}
                        <div className={`mt-16 max-w-4xl mx-auto ${
                            visibleSections.has('hero') && !prefersReducedMotion ? 'animate-fade-in-up' : ''
                        }`} style={{ animationDelay: '0.5s' }}>
                            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                                        <span className="ml-4 text-sm text-gray-500 font-medium">HelloBoost Dashboard</span>
                                    </div>
                                </div>
                                <div className="p-8">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Campagne Active */}
                                        <div className="bg-blue-50 rounded-lg p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="font-semibold text-gray-900">Campagne Active</h3>
                                                <span className="text-green-600 text-sm font-medium">En cours</span>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Taux d'ouverture</span>
                                                    <span className="font-semibold text-blue-600">98%</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Messages envoyés</span>
                                                    <span className="font-semibold">2,847</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Analytics */}
                                        <div className="bg-green-50 rounded-lg p-6">
                                            <h3 className="font-semibold text-gray-900 mb-4">Performance</h3>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">ROI</span>
                                                    <span className="font-semibold text-green-600">+247%</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Conversions</span>
                                                    <span className="font-semibold">1,245</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Automation */}
                                        <div className="bg-purple-50 rounded-lg p-6">
                                            <h3 className="font-semibold text-gray-900 mb-4">Automatisation</h3>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Workflows actifs</span>
                                                    <span className="font-semibold">12</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Temps économisé</span>
                                                    <span className="font-semibold text-purple-600">85%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="py-16 bg-gray-50" data-section id="stats">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                            {[
                                {
                                    value: animatedStats.clients,
                                    suffix: "+",
                                    label: "Clients actifs",
                                    sublabel: "dans toute l'Afrique de l'Ouest"
                                },
                                {
                                    value: animatedStats.messages,
                                    suffix: "+",
                                    label: "Messages envoyés",
                                    sublabel: "chaque mois"
                                },
                                {
                                    value: animatedStats.satisfaction,
                                    suffix: "%",
                                    label: "Taux de satisfaction",
                                    sublabel: "de nos utilisateurs"
                                }
                            ].map((stat, index) => (
                                <div key={index} className={`${
                                    visibleSections.has('stats') && !prefersReducedMotion ? 'animate-fade-in-up' : ''
                                }`} style={{ animationDelay: `${index * 0.1}s` }}>
                                    <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">
                                        {stat.value.toLocaleString()}{stat.suffix}
                                    </div>
                                    <div className="text-xl font-semibold text-gray-900 mb-1">{stat.label}</div>
                                    <div className="text-gray-600">{stat.sublabel}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-24" data-section id="features">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className={`text-3xl md:text-4xl font-bold text-gray-900 mb-4 ${
                                visibleSections.has('features') && !prefersReducedMotion ? 'animate-fade-in-up' : ''
                            }`}>
                                Tout ce dont vous avez besoin
                            </h2>
                            <p className={`text-xl text-gray-600 max-w-2xl mx-auto ${
                                visibleSections.has('features') && !prefersReducedMotion ? 'animate-fade-in-up' : ''
                            }`} style={{ animationDelay: '0.1s' }}>
                                Des outils puissants pour transformer votre communication client
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[
                                {
                                    icon: "🚀",
                                    title: "Envoi Ultra-Rapide",
                                    description: "Livraison instantanée avec notre infrastructure optimisée"
                                },
                                {
                                    icon: "🤖",
                                    title: "IA Intelligente",
                                    description: "Personnalisation automatique et segmentation avancée"
                                },
                                {
                                    icon: "📊",
                                    title: "Analytics Avancées",
                                    description: "Insights en temps réel et rapports détaillés"
                                },
                                {
                                    icon: "🔄",
                                    title: "Automatisation",
                                    description: "Workflows intelligents et déclencheurs personnalisés"
                                },
                                {
                                    icon: "🔒",
                                    title: "Sécurité Maximum",
                                    description: "Chiffrement de niveau bancaire et conformité RGPD"
                                },
                                {
                                    icon: "🌐",
                                    title: "Intégrations",
                                    description: "Connectez vos outils existants en quelques clics"
                                }
                            ].map((feature, index) => (
                                <div key={index} className={`bg-white p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 ${
                                    visibleSections.has('features') && !prefersReducedMotion ? 'animate-fade-in-up' : ''
                                }`} style={{ animationDelay: `${index * 0.1}s` }}>
                                    <div className="text-3xl mb-4">{feature.icon}</div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Testimonials Section */}
                <section className="py-24 bg-gray-50" data-section id="testimonials">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className={`text-3xl md:text-4xl font-bold text-gray-900 mb-4 ${
                                visibleSections.has('testimonials') && !prefersReducedMotion ? 'animate-fade-in-up' : ''
                            }`}>
                                Ils nous font confiance
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                {
                                    quote: "HelloBoost a révolutionné ma communication avec mes patients. Plus de rendez-vous manqués !",
                                    author: "Dr. Aminata Diallo",
                                    role: "Chirurgien-Dentiste",
                                    metric: "+73% présence aux RDV"
                                },
                                {
                                    quote: "Mes ventes ont explosé grâce à la personnalisation intelligente des messages.",
                                    author: "Fatou Touré",
                                    role: "Propriétaire Boutique",
                                    metric: "+180% chiffre d'affaires"
                                },
                                {
                                    quote: "L'automatisation me fait économiser 4h par jour. Incroyable !",
                                    author: "Ousmane Sow",
                                    role: "Restaurateur",
                                    metric: "+95% taux de retour"
                                }
                            ].map((testimonial, index) => (
                                <div key={index} className={`bg-white p-8 rounded-xl border border-gray-200 ${
                                    visibleSections.has('testimonials') && !prefersReducedMotion ? 'animate-fade-in-up' : ''
                                }`} style={{ animationDelay: `${index * 0.1}s` }}>
                                    <div className="text-blue-600 font-semibold text-sm mb-4">{testimonial.metric}</div>
                                    <p className="text-gray-700 mb-6 italic">"{testimonial.quote}"</p>
                                    <div className="flex items-center">
                                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                                            <span className="text-blue-600 font-semibold">
                                                {testimonial.author.split(' ').map(n => n[0]).join('')}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900">{testimonial.author}</div>
                                            <div className="text-gray-600 text-sm">{testimonial.role}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Pricing Section */}
                <section className="py-24" data-section id="pricing">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className={`text-3xl md:text-4xl font-bold text-gray-900 mb-4 ${
                                visibleSections.has('pricing') && !prefersReducedMotion ? 'animate-fade-in-up' : ''
                            }`}>
                                Tarifs simples et transparents
                            </h2>
                            <p className={`text-xl text-gray-600 ${
                                visibleSections.has('pricing') && !prefersReducedMotion ? 'animate-fade-in-up' : ''
                            }`} style={{ animationDelay: '0.1s' }}>
                                Choisissez le plan parfait pour votre business
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                            {[
                                {
                                    name: "Starter",
                                    price: "7.500",
                                    description: "Parfait pour débuter",
                                    features: [
                                        "Jusqu'à 150 contacts",
                                        "300 SMS/mois",
                                        "Support email",
                                        "Analytics de base"
                                    ],
                                    popular: false
                                },
                                {
                                    name: "Business",
                                    price: "18.000",
                                    description: "Le plus populaire",
                                    features: [
                                        "Jusqu'à 750 contacts",
                                        "1.500 SMS/mois",
                                        "Support prioritaire",
                                        "Analytics avancées",
                                        "Automatisation"
                                    ],
                                    popular: true
                                },
                                {
                                    name: "Enterprise",
                                    price: "35.000",
                                    description: "Pour les leaders",
                                    features: [
                                        "Jusqu'à 3.000 contacts",
                                        "6.000 SMS/mois",
                                        "Support 24/7",
                                        "API complète",
                                        "Analytics prédictives"
                                    ],
                                    popular: false
                                }
                            ].map((plan, index) => (
                                <div key={index} className={`relative bg-white border-2 rounded-xl p-8 ${
                                    plan.popular ? 'border-blue-500 shadow-lg' : 'border-gray-200'
                                } ${visibleSections.has('pricing') && !prefersReducedMotion ? 'animate-fade-in-up' : ''}`}
                                     style={{ animationDelay: `${index * 0.1}s` }}>
                                    {plan.popular && (
                                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                            <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                                                Plus populaire
                                            </span>
                                        </div>
                                    )}

                                    <div className="text-center mb-8">
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                                        <p className="text-gray-600 mb-4">{plan.description}</p>
                                        <div className="flex items-baseline justify-center">
                                            <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                                            <span className="text-gray-600 ml-2">FCFA/mois</span>
                                        </div>
                                    </div>

                                    <ul className="space-y-3 mb-8">
                                        {plan.features.map((feature, featureIndex) => (
                                            <li key={featureIndex} className="flex items-center">
                                                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                                </svg>
                                                <span className="text-gray-700">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <Link
                                        href={route('register')}
                                        className={`w-full py-3 px-6 rounded-lg text-center font-semibold transition-colors ${
                                            plan.popular
                                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                : 'border-2 border-gray-300 text-gray-700 hover:border-gray-400'
                                        }`}
                                    >
                                        Choisir ce plan
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Final */}
                <section className="py-24 bg-blue-600">
                    <div className="max-w-4xl mx-auto text-center px-6 lg:px-8">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                            Prêt à booster votre business ?
                        </h2>
                        <p className="text-xl text-blue-100 mb-10">
                            Rejoignez les 8,500+ entrepreneurs qui transforment leur communication
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href={route('register')}
                                className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
                            >
                                Commencer gratuitement
                            </Link>
                            <button className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
                                Planifier une démo
                            </button>
                        </div>
                        <p className="text-blue-200 text-sm mt-6">
                            Essai gratuit • Sans engagement • Support inclus
                        </p>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-gray-900 text-white py-16">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            {/* Logo & Description */}
                            <div className="col-span-1 md:col-span-2">
                                <div className="flex items-center mb-4">
                                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                                        <span className="text-white text-sm font-bold">H</span>
                                    </div>
                                    <span className="text-xl font-semibold">HelloBoost</span>
                                </div>
                                <p className="text-gray-400 mb-6 max-w-md">
                                    La plateforme SMS intelligente qui propulse votre business vers de nouveaux sommets.
                                </p>
                                <div className="flex space-x-4">
                                    {['Twitter', 'Facebook', 'LinkedIn'].map((social) => (
                                        <a key={social} href="#" className="text-gray-400 hover:text-white transition-colors">
                                            <span className="sr-only">{social}</span>
                                            <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors">
                                                <span className="text-sm">{social[0]}</span>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>

                            {/* Links */}
                            <div>
                                <h3 className="font-semibold mb-4">Produit</h3>
                                <ul className="space-y-2 text-gray-400">
                                    <li><a href="#" className="hover:text-white transition-colors">Fonctionnalités</a></li>
                                    <li><a href="#" className="hover:text-white transition-colors">Tarifs</a></li>
                                    <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-4">Support</h3>
                                <ul className="space-y-2 text-gray-400">
                                    <li><a href="#" className="hover:text-white transition-colors">Centre d'aide</a></li>
                                    <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                                    <li><a href="#" className="hover:text-white transition-colors">Statut</a></li>
                                </ul>
                            </div>
                        </div>

                        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
                            <p className="text-gray-400 text-sm">
                                © 2024 HelloBoost. Tous droits réservés.
                            </p>
                            <div className="flex space-x-6 text-sm text-gray-400 mt-4 md:mt-0">
                                <a href="#" className="hover:text-white transition-colors">Confidentialité</a>
                                <a href="#" className="hover:text-white transition-colors">Conditions</a>
                                <a href="#" className="hover:text-white transition-colors">Mentions légales</a>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>

            {/* CSS Animations */}
            <style jsx>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes fade-in-up {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-fade-in {
                    animation: fade-in 0.6s ease-out forwards;
                    opacity: 0;
                }

                .animate-fade-in-up {
                    animation: fade-in-up 0.6s ease-out forwards;
                    opacity: 0;
                }

                @media (prefers-reduced-motion: reduce) {
                    .animate-fade-in,
                    .animate-fade-in-up {
                        animation: none;
                        opacity: 1;
                        transform: none;
                    }
                }

                /* Smooth scroll */
                html {
                    scroll-behavior: smooth;
                }
            `}</style>
        </>
    );
}
