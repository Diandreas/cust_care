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
            title: t('welcome.examples.birthday.title'),
            example: t('welcome.examples.birthday.example'),
            business: t('welcome.examples.birthday.business'),
            result: t('welcome.examples.birthday.result')
        },
        {
            title: t('welcome.examples.appointment.title'),
            example: t('welcome.examples.appointment.example'),
            business: t('welcome.examples.appointment.business'),
            result: t('welcome.examples.appointment.result')
        },
        {
            title: t('welcome.examples.promotion.title'),
            example: t('welcome.examples.promotion.example'),
            business: t('welcome.examples.promotion.business'),
            result: t('welcome.examples.promotion.result')
        },
        {
            title: t('welcome.examples.loyalty.title'),
            example: t('welcome.examples.loyalty.example'),
            business: t('welcome.examples.loyalty.business'),
            result: t('welcome.examples.loyalty.result')
        }
    ];

    return (
        <>
            <Head title={t('welcome.meta.title')} />

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
                                    {t('welcome.header.brand')}
                                </span>
                            </div>

                            {/* Navigation */}
                            <nav className="hidden md:flex items-center space-x-8">
                                <a href="#examples" className="text-gray-600 hover:text-purple-600 transition-colors">
                                    {t('welcome.header.nav.examples')}
                                </a>
                                <a href="#pricing" className="text-gray-600 hover:text-purple-600 transition-colors">
                                    {t('welcome.header.nav.pricing')}
                                </a>
                                <a href="#testimonials" className="text-gray-600 hover:text-purple-600 transition-colors">
                                    {t('welcome.header.nav.testimonials')}
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
                                        {t('welcome.header.dashboard')}
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={route('login')}
                                            className="text-gray-600 hover:text-purple-600 px-3 py-2 text-sm font-medium transition-colors"
                                        >
                                            {t('welcome.header.login')}
                                        </Link>
                                        <Link
                                            href={route('register')}
                                            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition-all"
                                        >
                                            {t('welcome.header.getStarted')}
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
                                {t('welcome.hero.badge')}
                            </div>

                            {/* Headline ultra-claire */}
                            <h1 className={`text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight ${
                                visibleSections.has('hero') && !prefersReducedMotion ? 'animate-fade-in-up' : ''
                            }`} style={{ animationDelay: '0.1s' }}>
                                {t('welcome.hero.title.line1')}
                                <br />
                                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                    {t('welcome.hero.title.line2')}
                                </span>
                                <br />
                                {t('welcome.hero.title.line3')}
                            </h1>

                            {/* Bénéfices concrets */}
                            <div className={`text-xl text-gray-600 mb-10 max-w-2xl mx-auto ${
                                visibleSections.has('hero') && !prefersReducedMotion ? 'animate-fade-in-up' : ''
                            }`} style={{ animationDelay: '0.2s' }}>
                                <p className="mb-4 leading-relaxed">
                                    <strong className="text-gray-900">{t('welcome.hero.subtitle.highlight')}</strong>
                                </p>
                                <p className="text-lg">
                                    {t('welcome.hero.subtitle.description')}
                                    <span className="font-semibold text-purple-600"> {t('welcome.hero.subtitle.emphasis')}</span>
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
                                    {t('welcome.hero.cta.primary')}
                                </Link>
                                <button className="border-2 border-purple-300 text-purple-700 px-8 py-4 rounded-lg text-lg font-semibold hover:border-purple-400 hover:bg-purple-50 transition-all duration-200">
                                    {t('welcome.hero.cta.secondary')}
                                </button>
                            </div>

                            {/* Promesse claire */}
                            <div className={`bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 mb-16 ${
                                visibleSections.has('hero') && !prefersReducedMotion ? 'animate-fade-in-up' : ''
                            }`} style={{ animationDelay: '0.4s' }}>
                                <p className="text-lg font-semibold text-gray-900 mb-2">
                                    {t('welcome.hero.promise.title')}
                                </p>
                                <p className="text-gray-700">
                                    {t('welcome.hero.promise.description')}
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
                                        <h3 className="font-semibold">{t('welcome.demo.header.title')}</h3>
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
                                                    <span className="text-sm text-gray-600">{t('welcome.demo.automaticSend')}</span>
                                                    <span className="text-green-600 text-sm font-medium">{t('welcome.demo.delivered')}</span>
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
                                                    {t('welcome.demo.automaticResult')}
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
                                {t('welcome.howItWorks.title')}
                            </h2>
                            <p className={`text-xl text-gray-600 max-w-3xl mx-auto ${
                                visibleSections.has('examples') && !prefersReducedMotion ? 'animate-fade-in-up' : ''
                            }`} style={{ animationDelay: '0.1s' }}>
                                {t('welcome.howItWorks.subtitle')}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[
                                {
                                    icon: "🎂",
                                    title: t('welcome.features.birthday.title'),
                                    description: t('welcome.features.birthday.description'),
                                    example: t('welcome.features.birthday.example'),
                                    frequency: t('welcome.features.birthday.frequency')
                                },
                                {
                                    icon: "📅",
                                    title: t('welcome.features.reminder.title'),
                                    description: t('welcome.features.reminder.description'),
                                    example: t('welcome.features.reminder.example'),
                                    frequency: t('welcome.features.reminder.frequency')
                                },
                                {
                                    icon: "🔥",
                                    title: t('welcome.features.promotion.title'),
                                    description: t('welcome.features.promotion.description'),
                                    example: t('welcome.features.promotion.example'),
                                    frequency: t('welcome.features.promotion.frequency')
                                },
                                {
                                    icon: "💔",
                                    title: t('welcome.features.winback.title'),
                                    description: t('welcome.features.winback.description'),
                                    example: t('welcome.features.winback.example'),
                                    frequency: t('welcome.features.winback.frequency')
                                },
                                {
                                    icon: "🎁",
                                    title: t('welcome.features.loyalty.title'),
                                    description: t('welcome.features.loyalty.description'),
                                    example: t('welcome.features.loyalty.example'),
                                    frequency: t('welcome.features.loyalty.frequency')
                                },
                                {
                                    icon: "📦",
                                    title: t('welcome.features.stock.title'),
                                    description: t('welcome.features.stock.description'),
                                    example: t('welcome.features.stock.example'),
                                    frequency: t('welcome.features.stock.frequency')
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
                                    {t('welcome.features.cta.title')}
                                </h3>
                                <Link
                                    href={route('register')}
                                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 inline-block"
                                >
                                    {t('welcome.features.cta.button')}
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
                                    label: t('welcome.stats.clients.label'),
                                    sublabel: t('welcome.stats.clients.sublabel')
                                },
                                {
                                    value: animatedStats.messages,
                                    suffix: "+",
                                    label: t('welcome.stats.messages.label'),
                                    sublabel: t('welcome.stats.messages.sublabel')
                                },
                                {
                                    value: animatedStats.satisfaction,
                                    suffix: "%",
                                    label: t('welcome.stats.satisfaction.label'),
                                    sublabel: t('welcome.stats.satisfaction.sublabel')
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
                                {t('welcome.testimonials.title')}
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                {
                                    quote: t('welcome.testimonials.testimonial1.quote'),
                                    author: t('welcome.testimonials.testimonial1.author'),
                                    role: t('welcome.testimonials.testimonial1.role'),
                                    metric: t('welcome.testimonials.testimonial1.metric'),
                                    detail: t('welcome.testimonials.testimonial1.detail')
                                },
                                {
                                    quote: t('welcome.testimonials.testimonial2.quote'),
                                    author: t('welcome.testimonials.testimonial2.author'),
                                    role: t('welcome.testimonials.testimonial2.role'),
                                    metric: t('welcome.testimonials.testimonial2.metric'),
                                    detail: t('welcome.testimonials.testimonial2.detail')
                                },
                                {
                                    quote: t('welcome.testimonials.testimonial3.quote'),
                                    author: t('welcome.testimonials.testimonial3.author'),
                                    role: t('welcome.testimonials.testimonial3.role'),
                                    metric: t('welcome.testimonials.testimonial3.metric'),
                                    detail: t('welcome.testimonials.testimonial3.detail')
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
                                {t('welcome.pricing.title')}
                            </h2>
                            <p className={`text-xl text-gray-600 ${
                                visibleSections.has('pricing') && !prefersReducedMotion ? 'animate-fade-in-up' : ''
                            }`} style={{ animationDelay: '0.1s' }}>
                                {t('welcome.pricing.subtitle')}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                            {[
                                {
                                    name: t('welcome.pricing.starter.name'),
                                    price: t('welcome.pricing.starter.price'),
                                    description: t('welcome.pricing.starter.description'),
                                    features: [
                                        t('welcome.pricing.starter.feature1'),
                                        t('welcome.pricing.starter.feature2'),
                                        t('welcome.pricing.starter.feature3'),
                                        t('welcome.pricing.starter.feature4')
                                    ],
                                    popular: false,
                                    result: t('welcome.pricing.starter.result')
                                },
                                {
                                    name: t('welcome.pricing.business.name'),
                                    price: t('welcome.pricing.business.price'),
                                    description: t('welcome.pricing.business.description'),
                                    features: [
                                        t('welcome.pricing.business.feature1'),
                                        t('welcome.pricing.business.feature2'),
                                        t('welcome.pricing.business.feature3'),
                                        t('welcome.pricing.business.feature4'),
                                        t('welcome.pricing.business.feature5')
                                    ],
                                    popular: true,
                                    result: t('welcome.pricing.business.result')
                                },
                                {
                                    name: t('welcome.pricing.enterprise.name'),
                                    price: t('welcome.pricing.enterprise.price'),
                                    description: t('welcome.pricing.enterprise.description'),
                                    features: [
                                        t('welcome.pricing.enterprise.feature1'),
                                        t('welcome.pricing.enterprise.feature2'),
                                        t('welcome.pricing.enterprise.feature3'),
                                        t('welcome.pricing.enterprise.feature4'),
                                        t('welcome.pricing.enterprise.feature5')
                                    ],
                                    popular: false,
                                    result: t('welcome.pricing.enterprise.result')
                                }
                            ].map((plan, index) => (
                                <div key={index} className={`relative bg-white border-2 rounded-xl p-8 ${
                                    plan.popular ? 'border-purple-500 shadow-xl ring-4 ring-purple-100' : 'border-gray-200 shadow-lg'
                                } ${visibleSections.has('pricing') && !prefersReducedMotion ? 'animate-fade-in-up' : ''}`}
                                     style={{ animationDelay: `${index * 0.1}s` }}>
                                    {plan.popular && (
                                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                            <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                                                {t('welcome.pricing.popular')}
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
                                            <span className="text-gray-600 ml-2">{t('welcome.pricing.currency')}</span>
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
                                        {t('welcome.pricing.cta')}
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
                                        {t('welcome.pricing.guarantee')}
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
                            {t('welcome.finalCta.title')}
                        </h2>
                        <p className="text-xl text-purple-100 mb-10">
                            <strong className="text-white">{t('welcome.finalCta.subtitle.part1')}</strong>
                            {t('welcome.finalCta.subtitle.part2')}
                            <br />
                            <strong className="text-white">{t('welcome.finalCta.subtitle.part3')}</strong>
                            {t('welcome.finalCta.subtitle.part4')}
                        </p>

                        {/* Promesses concrètes */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 text-purple-100">
                            <div className="bg-white/10 rounded-lg p-4">
                                <div className="text-2xl mb-2">⏱️</div>
                                <div className="font-medium">{t('welcome.finalCta.features.setup')}</div>
                            </div>
                            <div className="bg-white/10 rounded-lg p-4">
                                <div className="text-2xl mb-2">🎁</div>
                                <div className="font-medium">{t('welcome.finalCta.features.freeSms')}</div>
                            </div>
                            <div className="bg-white/10 rounded-lg p-4">
                                <div className="text-2xl mb-2">📈</div>
                                <div className="font-medium">{t('welcome.finalCta.features.results')}</div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href={route('register')}
                                className="bg-white text-purple-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
                            >
                                {t('welcome.finalCta.button')}
                            </Link>
                        </div>
                        <p className="text-purple-200 text-sm mt-6">
                            {t('welcome.finalCta.benefits')}
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
                                    <span className="text-xl font-semibold">{t('welcome.footer.brand')}</span>
                                </div>
                                <p className="text-gray-400 mb-6 max-w-md">
                                    {t('welcome.footer.description')}
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-4">{t('welcome.footer.automation.title')}</h3>
                                <ul className="space-y-2 text-gray-400">
                                    <li>{t('welcome.footer.automation.birthday')}</li>
                                    <li>{t('welcome.footer.automation.appointments')}</li>
                                    <li>{t('welcome.footer.automation.winback')}</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-4">{t('welcome.footer.support.title')}</h3>
                                <ul className="space-y-2 text-gray-400">
                                    <li>{t('welcome.footer.support.setup')}</li>
                                    <li>{t('welcome.footer.support.support24')}</li>
                                    <li>{t('welcome.footer.support.training')}</li>
                                </ul>
                            </div>
                        </div>

                        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
                            <p className="text-gray-400 text-sm">
                                {t('welcome.footer.copyright')}
                            </p>
                            <div className="flex space-x-6 text-sm text-gray-400 mt-4 md:mt-0">
                                <a href="#" className="hover:text-white transition-colors">{t('welcome.footer.privacy')}</a>
                                <a href="#" className="hover:text-white transition-colors">{t('welcome.footer.terms')}</a>
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
