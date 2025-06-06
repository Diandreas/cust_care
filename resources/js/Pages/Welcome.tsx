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
    const [currentExample, setCurrentExample] = useState(0);

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

    // Rotation des exemples
    useEffect(() => {
        if (prefersReducedMotion) return;

        const interval = setInterval(() => {
            setCurrentExample(prev => (prev + 1) % realExamples.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [prefersReducedMotion]);

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        localStorage.setItem('language', lng);
    };

    // Exemples concrets d'utilisation
    const realExamples = [
        {
            title: "Messages d'anniversaire automatiques",
            example: '"Joyeux anniversaire Aminata ! 🎉 Profitez de 20% de réduction sur votre prochain RDV avec le code ANNIV20"',
            business: "Cabinet Dr Diallo",
            result: "73% des patients reviennent dans le mois"
        },
        {
            title: "Rappels de rendez-vous intelligents",
            example: '"Bonjour Mme Kone, votre RDV est demain à 14h. Confirmez en répondant OUI. Merci ! 📅"',
            business: "Pharmacie Centrale",
            result: "95% de taux de présence aux RDV"
        },
        {
            title: "Promotions ciblées automatiques",
            example: '"🔥 FLASH SALE ! 50% sur vos articles préférés jusqu\'à demain 18h. Venez vite !"',
            business: "Boutique Fatou",
            result: "+180% de ventes le jour J"
        },
        {
            title: "Fidélisation personnalisée",
            example: '"Salut Omar ! Cela fait 2 semaines... Revenez cette semaine et obtenez votre plat GRATUIT ! 🍽️"',
            business: "Restaurant Le Baobab",
            result: "87% des clients inactifs reviennent"
        }
    ];

    return (
        <>
            <Head title="HelloBoost - Messages Automatiques pour Votre Business" />

            <div className="min-h-screen bg-white text-gray-900">
                {/* Header Modern avec gradient */}
                <header className={`fixed w-full top-0 z-50 transition-all duration-300 ${
                    isScrolled
                        ? 'bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm'
                        : 'bg-transparent'
                }`}>
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            {/* Logo avec gradient */}
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mr-3">
                                    <span className="text-white text-sm font-bold">H</span>
                                </div>
                                <span className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                    HelloBoost
                                </span>
                            </div>

                            {/* Navigation */}
                            <nav className="hidden md:flex items-center space-x-8">
                                <a href="#examples" className="text-gray-600 hover:text-purple-600 transition-colors">
                                    Exemples concrets
                                </a>
                                <a href="#pricing" className="text-gray-600 hover:text-purple-600 transition-colors">
                                    Tarifs
                                </a>
                                <a href="#testimonials" className="text-gray-600 hover:text-purple-600 transition-colors">
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
                                        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition-all"
                                    >
                                        Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={route('login')}
                                            className="text-gray-600 hover:text-purple-600 px-3 py-2 text-sm font-medium transition-colors"
                                        >
                                            Connexion
                                        </Link>
                                        <Link
                                            href={route('register')}
                                            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition-all"
                                        >
                                            Commencer
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Hero Section - Très explicite */}
                <section className="pt-24 pb-16 lg:pt-32 lg:pb-24" data-section id="hero">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="text-center max-w-4xl mx-auto">
                            {/* Badge explicite */}
                            <div className={`inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full text-purple-700 text-sm font-medium mb-8 ${
                                visibleSections.has('hero') && !prefersReducedMotion ? 'animate-fade-in' : ''
                            }`}>
                                <span className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mr-2"></span>
                                Vos clients reçoivent automatiquement les bons messages au bon moment
                            </div>

                            {/* Headline ultra-claire */}
                            <h1 className={`text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight ${
                                visibleSections.has('hero') && !prefersReducedMotion ? 'animate-fade-in-up' : ''
                            }`} style={{ animationDelay: '0.1s' }}>
                                Envoyez des messages
                                <br />
                                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                    automatiques
                                </span>
                                <br />
                                à vos clients
                            </h1>

                            {/* Bénéfices concrets */}
                            <div className={`text-xl text-gray-600 mb-10 max-w-2xl mx-auto ${
                                visibleSections.has('hero') && !prefersReducedMotion ? 'animate-fade-in-up' : ''
                            }`} style={{ animationDelay: '0.2s' }}>
                                <p className="mb-4 leading-relaxed">
                                    <strong className="text-gray-900">Messages d'anniversaire, rappels de RDV, promotions ciblées...</strong>
                                </p>
                                <p className="text-lg">
                                    HelloBoost envoie automatiquement les messages que vos clients attendent,
                                    <span className="font-semibold text-purple-600"> sans que vous ayez rien à faire.</span>
                                </p>
                            </div>

                            {/* CTA Buttons */}
                            <div className={`flex flex-col sm:flex-row gap-4 justify-center mb-16 ${
                                visibleSections.has('hero') && !prefersReducedMotion ? 'animate-fade-in-up' : ''
                            }`} style={{ animationDelay: '0.3s' }}>
                                <Link
                                    href={route('register')}
                                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105"
                                >
                                    Automatiser mes messages
                                </Link>
                                <button className="border-2 border-purple-300 text-purple-700 px-8 py-4 rounded-lg text-lg font-semibold hover:border-purple-400 hover:bg-purple-50 transition-all duration-200">
                                    Voir comment ça marche
                                </button>
                            </div>

                            {/* Promesse claire */}
                            <div className={`bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 mb-16 ${
                                visibleSections.has('hero') && !prefersReducedMotion ? 'animate-fade-in-up' : ''
                            }`} style={{ animationDelay: '0.4s' }}>
                                <p className="text-lg font-semibold text-gray-900 mb-2">
                                    🎯 Résultat garanti en 24h
                                </p>
                                <p className="text-gray-700">
                                    Configurez une fois, vos clients reçoivent des messages personnalisés pour toujours
                                </p>
                            </div>
                        </div>

                        {/* Démonstration Live */}
                        <div className={`mt-16 max-w-5xl mx-auto ${
                            visibleSections.has('hero') && !prefersReducedMotion ? 'animate-fade-in-up' : ''
                        }`} style={{ animationDelay: '0.5s' }}>
                            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                                {/* Header de l'interface */}
                                <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4 text-white">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold">Campagne automatique en cours</h3>
                                        <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                                            {realExamples[currentExample].business}
                                        </span>
                                    </div>
                                </div>

                                {/* Contenu changeant */}
                                <div className="p-8">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                                        {/* Message example */}
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-4 text-lg">
                                                {realExamples[currentExample].title}
                                            </h4>
                                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-l-4 border-purple-500">
                                                <p className="text-gray-800 italic text-lg leading-relaxed">
                                                    {realExamples[currentExample].example}
                                                </p>
                                                <div className="mt-4 flex items-center justify-between">
                                                    <span className="text-sm text-gray-600">Envoyé automatiquement</span>
                                                    <span className="text-green-600 text-sm font-medium">✅ Livré</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Résultat */}
                                        <div className="text-center">
                                            <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                                                <div className="text-3xl font-bold text-green-600 mb-2">
                                                    {realExamples[currentExample].result}
                                                </div>
                                                <p className="text-gray-700 font-medium">
                                                    Résultat automatique
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Indicateurs */}
                                    <div className="flex justify-center mt-6 space-x-2">
                                        {realExamples.map((_, index) => (
                                            <div
                                                key={index}
                                                className={`w-2 h-2 rounded-full transition-colors ${
                                                    index === currentExample
                                                        ? 'bg-purple-500'
                                                        : 'bg-gray-300'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section "Comment ça marche" - Très explicite */}
                <section className="py-24 bg-gradient-to-r from-purple-50 to-pink-50" data-section id="examples">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className={`text-3xl md:text-4xl font-bold text-gray-900 mb-4 ${
                                visibleSections.has('examples') && !prefersReducedMotion ? 'animate-fade-in-up' : ''
                            }`}>
                                Concrètement, qu'est-ce que vos clients vont recevoir ?
                            </h2>
                            <p className={`text-xl text-gray-600 max-w-3xl mx-auto ${
                                visibleSections.has('examples') && !prefersReducedMotion ? 'animate-fade-in-up' : ''
                            }`} style={{ animationDelay: '0.1s' }}>
                                Voici exactement ce que HelloBoost envoie automatiquement à vos clients
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[
                                {
                                    icon: "🎂",
                                    title: "Messages d'anniversaire",
                                    description: "Le jour J, vos clients reçoivent automatiquement un message personnalisé avec une offre spéciale",
                                    example: '"Joyeux anniversaire Marie ! 🎉 Profitez de 25% sur tout aujourd\'hui avec ANNIV25"',
                                    frequency: "Automatique chaque année"
                                },
                                {
                                    icon: "📅",
                                    title: "Rappels de rendez-vous",
                                    description: "24h avant leur RDV, vos clients reçoivent un rappel automatique pour éviter les absences",
                                    example: '"Rappel : RDV demain 14h chez Dr Diallo. Confirmez en répondant OUI"',
                                    frequency: "24h avant chaque RDV"
                                },
                                {
                                    icon: "🔥",
                                    title: "Promotions ciblées",
                                    description: "Vos clients fidèles reçoivent en priorité vos offres spéciales et nouveautés",
                                    example: '"FLASH SALE ! 50% sur vos articles favoris jusqu\'à ce soir. Venez vite !"',
                                    frequency: "Selon vos campagnes"
                                },
                                {
                                    icon: "💔",
                                    title: "Reconquête clients perdus",
                                    description: "Après 30 jours d'absence, vos anciens clients reçoivent une offre de retour personnalisée",
                                    example: '"Salut Omar ! On vous a manqué... Revenez avec 30% de réduction !"',
                                    frequency: "Après 30 jours d'inactivité"
                                },
                                {
                                    icon: "🎁",
                                    title: "Fidélisation automatique",
                                    description: "Après 5 visites, vos clients fidèles reçoivent automatiquement des avantages VIP",
                                    example: '"Bravo Fatou ! Vous êtes VIP. Voici 20% sur votre prochaine commande"',
                                    frequency: "Après X achats/visites"
                                },
                                {
                                    icon: "📦",
                                    title: "Nouveautés & Stock",
                                    description: "Vos clients sont prévenus en premier quand leurs produits préférés arrivent",
                                    example: '"Bonne nouvelle ! Vos chaussures préférées sont de retour en stock !"',
                                    frequency: "Dès que disponible"
                                }
                            ].map((feature, index) => (
                                <div key={index} className={`bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 ${
                                    visibleSections.has('examples') && !prefersReducedMotion ? 'animate-fade-in-up' : ''
                                }`} style={{ animationDelay: `${index * 0.1}s` }}>
                                    <div className="text-4xl mb-4">{feature.icon}</div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                                    <p className="text-gray-600 mb-4 leading-relaxed">{feature.description}</p>

                                    {/* Exemple de message */}
                                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 mb-4 border-l-4 border-purple-400">
                                        <p className="text-sm italic text-gray-800">{feature.example}</p>
                                    </div>

                                    <div className="text-sm font-medium text-purple-600">
                                        📱 {feature.frequency}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* CTA dans la section */}
                        <div className="text-center mt-16">
                            <div className="bg-white rounded-xl p-8 shadow-lg inline-block">
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                                    ✨ Tout cela se configure en 2 minutes et fonctionne pour toujours
                                </h3>
                                <Link
                                    href={route('register')}
                                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 inline-block"
                                >
                                    Configurer mes messages automatiques
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="py-16" data-section id="stats">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                            {[
                                {
                                    value: animatedStats.clients,
                                    suffix: "+",
                                    label: "Entrepreneurs",
                                    sublabel: "qui automatisent leurs messages"
                                },
                                {
                                    value: animatedStats.messages,
                                    suffix: "+",
                                    label: "Messages automatiques",
                                    sublabel: "envoyés chaque mois"
                                },
                                {
                                    value: animatedStats.satisfaction,
                                    suffix: "%",
                                    label: "Clients satisfaits",
                                    sublabel: "qui recommandent HelloBoost"
                                }
                            ].map((stat, index) => (
                                <div key={index} className={`${
                                    visibleSections.has('stats') && !prefersReducedMotion ? 'animate-fade-in-up' : ''
                                }`} style={{ animationDelay: `${index * 0.1}s` }}>
                                    <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                                        {stat.value.toLocaleString()}{stat.suffix}
                                    </div>
                                    <div className="text-xl font-semibold text-gray-900 mb-1">{stat.label}</div>
                                    <div className="text-gray-600">{stat.sublabel}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Testimonials avec résultats concrets */}
                <section className="py-24 bg-gradient-to-r from-purple-50 to-pink-50" data-section id="testimonials">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className={`text-3xl md:text-4xl font-bold text-gray-900 mb-4 ${
                                visibleSections.has('testimonials') && !prefersReducedMotion ? 'animate-fade-in-up' : ''
                            }`}>
                                Résultats concrets de nos clients
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                {
                                    quote: "Depuis que j'utilise HelloBoost, mes patients ne ratent plus jamais leurs RDV. Les rappels automatiques ont révolutionné ma pratique !",
                                    author: "Dr. Aminata Diallo",
                                    role: "Chirurgien-Dentiste, Dakar",
                                    metric: "+73% présence aux RDV",
                                    detail: "Économie de 6h/semaine en appels de rappel"
                                },
                                {
                                    quote: "Les messages d'anniversaire automatiques avec code promo ont boosté mes ventes. Mes clientes adorent cette attention personnalisée !",
                                    author: "Fatou Touré",
                                    role: "Boutique Mode, Dakar",
                                    metric: "+180% CA le jour d'anniversaire",
                                    detail: "2,400 messages d'anniversaire automatiques/an"
                                },
                                {
                                    quote: "HelloBoost reconquête automatiquement mes anciens clients. Chaque mois, 30% de mes clients 'perdus' reviennent grâce aux messages de reconquête.",
                                    author: "Ousmane Sow",
                                    role: "Restaurant Le Baobab",
                                    metric: "+95% taux de retour",
                                    detail: "347 clients reconquis automatiquement"
                                }
                            ].map((testimonial, index) => (
                                <div key={index} className={`bg-white p-8 rounded-xl shadow-lg border border-gray-100 ${
                                    visibleSections.has('testimonials') && !prefersReducedMotion ? 'animate-fade-in-up' : ''
                                }`} style={{ animationDelay: `${index * 0.1}s` }}>
                                    <div className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold mb-4 inline-block">
                                        {testimonial.metric}
                                    </div>
                                    <p className="text-gray-700 mb-6 italic leading-relaxed">"{testimonial.quote}"</p>
                                    <div className="border-t pt-4">
                                        <div className="flex items-center mb-2">
                                            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-4">
                                                <span className="text-white font-semibold">
                                                    {testimonial.author.split(' ').map(n => n[0]).join('')}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900">{testimonial.author}</div>
                                                <div className="text-gray-600 text-sm">{testimonial.role}</div>
                                            </div>
                                        </div>
                                        <div className="text-sm text-purple-600 font-medium">
                                            📊 {testimonial.detail}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Pricing avec bénéfices concrets */}
                <section className="py-24" data-section id="pricing">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className={`text-3xl md:text-4xl font-bold text-gray-900 mb-4 ${
                                visibleSections.has('pricing') && !prefersReducedMotion ? 'animate-fade-in-up' : ''
                            }`}>
                                Combien coûte l'automatisation de vos messages ?
                            </h2>
                            <p className={`text-xl text-gray-600 ${
                                visibleSections.has('pricing') && !prefersReducedMotion ? 'animate-fade-in-up' : ''
                            }`} style={{ animationDelay: '0.1s' }}>
                                Moins que ce que vous dépensez en café par mois
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                            {[
                                {
                                    name: "Starter",
                                    price: "7.500",
                                    description: "Automatisation de base",
                                    features: [
                                        "150 clients maximum",
                                        "Messages d'anniversaire automatiques",
                                        "Rappels de RDV basiques",
                                        "Support par email"
                                    ],
                                    popular: false,
                                    result: "Économise 2h/semaine"
                                },
                                {
                                    name: "Business",
                                    price: "18.000",
                                    description: "Automatisation complète",
                                    features: [
                                        "750 clients maximum",
                                        "Tous les types de messages auto",
                                        "Reconquête clients perdus",
                                        "Promotions ciblées automatiques",
                                        "Analytics détaillées"
                                    ],
                                    popular: true,
                                    result: "Économise 8h/semaine + augmente CA"
                                },
                                {
                                    name: "Enterprise",
                                    price: "35.000",
                                    description: "Automatisation sur-mesure",
                                    features: [
                                        "3.000 clients maximum",
                                        "Automatisation personnalisée",
                                        "Intégrations avancées",
                                        "Support dédié 24/7",
                                        "Formation incluse"
                                    ],
                                    popular: false,
                                    result: "ROI garanti sous 30 jours"
                                }
                            ].map((plan, index) => (
                                <div key={index} className={`relative bg-white border-2 rounded-xl p-8 ${
                                    plan.popular ? 'border-purple-500 shadow-xl ring-4 ring-purple-100' : 'border-gray-200 shadow-lg'
                                } ${visibleSections.has('pricing') && !prefersReducedMotion ? 'animate-fade-in-up' : ''}`}
                                     style={{ animationDelay: `${index * 0.1}s` }}>
                                    {plan.popular && (
                                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                            <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                                                ⭐ Plus choisi
                                            </span>
                                        </div>
                                    )}

                                    <div className="text-center mb-8">
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                                        <p className="text-gray-600 mb-4">{plan.description}</p>
                                        <div className="flex items-baseline justify-center mb-4">
                                            <span className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                                {plan.price}
                                            </span>
                                            <span className="text-gray-600 ml-2">FCFA/mois</span>
                                        </div>
                                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3">
                                            <span className="text-purple-700 font-medium text-sm">
                                                🎯 {plan.result}
                                            </span>
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
                                        className={`w-full py-3 px-6 rounded-lg text-center font-semibold transition-all block ${
                                            plan.popular
                                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                                                : 'border-2 border-purple-300 text-purple-700 hover:border-purple-400 hover:bg-purple-50'
                                        }`}
                                    >
                                        Automatiser maintenant
                                    </Link>
                                </div>
                            ))}
                        </div>

                        {/* Garantie */}
                        <div className="text-center mt-12">
                            <div className="bg-green-50 border border-green-200 rounded-xl p-6 inline-block">
                                <div className="flex items-center justify-center text-green-700">
                                    <span className="text-2xl mr-2">🛡️</span>
                                    <span className="font-semibold">
                                        Garantie satisfait ou remboursé 30 jours
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Final très concret */}
                <section className="py-24 bg-gradient-to-r from-purple-600 to-pink-600">
                    <div className="max-w-4xl mx-auto text-center px-6 lg:px-8">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                            Prêt à automatiser vos messages ?
                        </h2>
                        <p className="text-xl text-purple-100 mb-10">
                            <strong className="text-white">En 2 minutes</strong>, configurez vos messages automatiques.
                            <br />
                            <strong className="text-white">Pour toujours</strong>, vos clients reçoivent les bons messages au bon moment.
                        </p>

                        {/* Promesses concrètes */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 text-purple-100">
                            <div className="bg-white/10 rounded-lg p-4">
                                <div className="text-2xl mb-2">⏱️</div>
                                <div className="font-medium">Configuration en 2min</div>
                            </div>
                            <div className="bg-white/10 rounded-lg p-4">
                                <div className="text-2xl mb-2">🎁</div>
                                <div className="font-medium">100 SMS gratuits</div>
                            </div>
                            <div className="bg-white/10 rounded-lg p-4">
                                <div className="text-2xl mb-2">📈</div>
                                <div className="font-medium">Résultats en 24h</div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href={route('register')}
                                className="bg-white text-purple-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
                            >
                                Automatiser mes messages maintenant
                            </Link>
                        </div>
                        <p className="text-purple-200 text-sm mt-6">
                            ✅ Essai gratuit • ✅ Sans engagement • ✅ Configuration en 2 minutes
                        </p>
                    </div>
                </section>

                {/* Footer Simple */}
                <footer className="bg-gray-900 text-white py-16">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <div className="col-span-1 md:col-span-2">
                                <div className="flex items-center mb-4">
                                    <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mr-3">
                                        <span className="text-white text-sm font-bold">H</span>
                                    </div>
                                    <span className="text-xl font-semibold">HelloBoost</span>
                                </div>
                                <p className="text-gray-400 mb-6 max-w-md">
                                    Automatisez vos messages clients en 2 minutes.
                                    Résultats garantis en 24h.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-4">Automatisation</h3>
                                <ul className="space-y-2 text-gray-400">
                                    <li>Messages d'anniversaire</li>
                                    <li>Rappels de RDV</li>
                                    <li>Reconquête clients</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-4">Support</h3>
                                <ul className="space-y-2 text-gray-400">
                                    <li>Configuration gratuite</li>
                                    <li>Support 24/7</li>
                                    <li>Formation incluse</li>
                                </ul>
                            </div>
                        </div>

                        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
                            <p className="text-gray-400 text-sm">
                                © 2024 HelloBoost. Messages automatiques pour votre business.
                            </p>
                            <div className="flex space-x-6 text-sm text-gray-400 mt-4 md:mt-0">
                                <a href="#" className="hover:text-white transition-colors">Confidentialité</a>
                                <a href="#" className="hover:text-white transition-colors">Conditions</a>
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

                html {
                    scroll-behavior: smooth;
                }
            `}</style>
        </>
    );
}
