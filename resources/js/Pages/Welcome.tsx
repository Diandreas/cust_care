import { Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import GuestLayout from '@/Layouts/GuestLayout';

const features = [
    {
        title: 'Gestion des Clients',
        description: 'Organisez vos contacts efficacement avec des catégories personnalisées.',
        icon: '👥'
    },
    {
        title: 'Campagnes SMS',
        description: 'Créez et programmez des campagnes SMS ciblées en quelques clics.',
        icon: '📱'
    },
    {
        title: 'Messages Automatiques',
        description: 'Automatisez vos communications pour les événements importants.',
        icon: '⚡'
    },
    {
        title: 'Modèles Personnalisés',
        description: 'Créez et réutilisez vos modèles de messages pour gagner du temps.',
        icon: '📝'
    }
];

const plans = [
    {
        name: 'Starter',
        price: '5,000',
        features: [
            '100 clients maximum',
            '200 SMS par mois',
            '2 campagnes simultanées',
            'Messages personnels limités'
        ]
    },
    {
        name: 'Business',
        price: '15,000',
        features: [
            '500 clients maximum',
            '1000 SMS par mois',
            '4 campagnes simultanées',
            'Messages personnels illimités'
        ]
    },
    {
        name: 'Enterprise',
        price: '30,000',
        features: [
            '2000 clients maximum',
            '4000 SMS par mois',
            '8 campagnes simultanées',
            'Support prioritaire'
        ]
    }
];

const testimonials = [
    {
        name: 'Marie Dubois',
        role: 'Directrice Marketing',
        content: 'EliteSMS a transformé notre communication client. Simple et efficace !',
        avatar: '👩'
    },
    {
        name: 'Jean Martin',
        role: 'Propriétaire de Restaurant',
        content: 'Grâce aux messages automatiques, nos clients reviennent plus souvent.',
        avatar: '👨'
    }
];

export default function Welcome({ auth, laravelVersion, phpVersion }: PageProps<{ laravelVersion: string, phpVersion: string }>) {
    return (
        <GuestLayout>
            <div className="relative min-h-screen bg-gradient-to-br from-violet-600 to-indigo-800">
                {/* Hero Section */}
                <div className="relative pt-24 pb-32 flex content-center items-center justify-center min-h-screen-75">
                    <div className="container relative mx-auto px-4">
                        <div className="items-center flex flex-wrap">
                            <div className="w-full lg:w-6/12 px-4 ml-auto mr-auto text-center">
                                <div className="text-white">
                                    <h1 className="font-playfair text-5xl font-bold leading-tight mb-4">
                                        Communication Client Premium
                                    </h1>
                                    <p className="font-montserrat text-lg leading-relaxed mt-4 mb-4">
                                        Simplifiez votre communication client avec notre plateforme SMS professionnelle.
                                    </p>
                                    <Link
                                        href={route('register')}
                                        className="bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:from-violet-600 hover:to-indigo-700 transition duration-300 inline-block mt-8"
                                    >
                                        Commencer Maintenant
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <section className="py-20 bg-white">
                    <div className="container mx-auto px-4">
                        <div className="flex flex-wrap justify-center text-center mb-24">
                            <div className="w-full lg:w-6/12 px-4">
                                <h2 className="font-playfair text-4xl font-bold">Fonctionnalités Premium</h2>
                                <p className="font-montserrat text-lg leading-relaxed m-4 text-gray-600">
                                    Tout ce dont vous avez besoin pour une communication client efficace
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap">
                            {features.map((feature, index) => (
                                <div key={index} className="lg:w-3/12 px-4 text-center">
                                    <div className="bg-white rounded-lg p-8 shadow-lg border-t-2 border-violet-500">
                                        <div className="text-4xl mb-4">{feature.icon}</div>
                                        <h3 className="font-playfair text-2xl font-bold mb-2">{feature.title}</h3>
                                        <p className="font-montserrat text-gray-600">{feature.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Pricing Section */}
                <section className="py-20 bg-gray-100">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <h2 className="font-playfair text-4xl font-bold mb-4">Plans Tarifaires</h2>
                            <p className="font-montserrat text-lg text-gray-600">
                                Choisissez le plan qui correspond à vos besoins
                            </p>
                        </div>
                        <div className="flex flex-wrap justify-center">
                            {plans.map((plan, index) => (
                                <div key={index} className="w-full md:w-4/12 px-4 mb-8">
                                    <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300">
                                        <div className="px-6 py-8 border-b border-gray-200 bg-gradient-to-r from-violet-500 to-indigo-600 text-white">
                                            <h3 className="font-playfair text-2xl font-bold mb-2">{plan.name}</h3>
                                            <div className="text-4xl font-bold mb-4">{plan.price} FCFA</div>
                                            <p className="text-sm opacity-75">par mois</p>
                                        </div>
                                        <div className="p-6">
                                            <ul className="mb-8">
                                                {plan.features.map((feature, featureIndex) => (
                                                    <li key={featureIndex} className="mb-4 flex items-center font-montserrat">
                                                        <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                                        </svg>
                                                        {feature}
                                                    </li>
                                                ))}
                                            </ul>
                                            <Link
                                                href={route('register')}
                                                className="block text-center bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:from-violet-600 hover:to-indigo-700 transition duration-300"
                                            >
                                                Choisir ce Plan
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Testimonials Section */}
                <section className="py-20 bg-white">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <h2 className="font-playfair text-4xl font-bold mb-4">Témoignages Clients</h2>
                            <p className="font-montserrat text-lg text-gray-600">
                                Ce que nos clients disent de nous
                            </p>
                        </div>
                        <div className="flex flex-wrap justify-center">
                            {testimonials.map((testimonial, index) => (
                                <div key={index} className="w-full md:w-6/12 lg:w-4/12 px-4 mb-8">
                                    <div className="bg-white rounded-lg p-8 shadow-lg border-t-2 border-violet-500">
                                        <div className="text-4xl mb-4">{testimonial.avatar}</div>
                                        <p className="font-montserrat text-gray-600 mb-4">"{testimonial.content}"</p>
                                        <h4 className="font-playfair text-xl font-bold">{testimonial.name}</h4>
                                        <p className="font-montserrat text-gray-500">{testimonial.role}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 bg-gradient-to-r from-violet-600 to-indigo-800 text-white">
                    <div className="container mx-auto px-4 text-center">
                        <h2 className="font-playfair text-4xl font-bold mb-4">Prêt à Commencer ?</h2>
                        <p className="font-montserrat text-lg mb-8">
                            Rejoignez les entreprises qui font confiance à EliteSMS pour leur communication client
                        </p>
                        <Link
                            href={route('register')}
                            className="bg-white text-indigo-600 font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition duration-300 inline-block"
                        >
                            Créer un Compte
                        </Link>
                    </div>
                </section>
            </div>
        </GuestLayout>
    );
}
