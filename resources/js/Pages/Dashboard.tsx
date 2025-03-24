import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

interface DashboardProps extends PageProps {
    stats: {
        totalClients: number;
        totalMessages: number;
        totalCampaigns: number;
        messagesSentToday: number;
        messagesSentThisMonth: number;
        deliveryRate: number;
        monthlyStats: Array<{
            month: string;
            messages: number;
            campaigns: number;
        }>;
        categoryDistribution: Array<{
            name: string;
            count: number;
        }>;
    };
}

export default function Dashboard({ auth, stats }: DashboardProps) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-playfair text-xl font-semibold leading-tight text-gray-800">Tableau de Bord</h2>}
        >
            <Head title="Tableau de Bord" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="overflow-hidden rounded-lg bg-white p-6 shadow-lg">
                            <div className="flex items-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100">
                                    <svg className="h-6 w-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <h3 className="font-montserrat text-sm font-medium text-gray-500">Total Clients</h3>
                                    <p className="font-playfair text-2xl font-semibold text-gray-900">{stats.totalClients}</p>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-lg bg-white p-6 shadow-lg">
                            <div className="flex items-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
                                    <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <h3 className="font-montserrat text-sm font-medium text-gray-500">Messages Envoyés (Aujourd'hui)</h3>
                                    <p className="font-playfair text-2xl font-semibold text-gray-900">{stats.messagesSentToday}</p>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-lg bg-white p-6 shadow-lg">
                            <div className="flex items-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100">
                                    <svg className="h-6 w-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <h3 className="font-montserrat text-sm font-medium text-gray-500">Campagnes Actives</h3>
                                    <p className="font-playfair text-2xl font-semibold text-gray-900">{stats.totalCampaigns}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
                        {/* Monthly Messages Chart */}
                        <div className="overflow-hidden rounded-lg bg-white p-6 shadow-lg">
                            <h3 className="font-playfair text-lg font-semibold text-gray-900">Activité Mensuelle</h3>
                            <div className="mt-4 h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={stats.monthlyStats}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="messages" name="Messages" stroke="#8b5cf6" />
                                        <Line type="monotone" dataKey="campaigns" name="Campagnes" stroke="#6366f1" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Category Distribution Chart */}
                        <div className="overflow-hidden rounded-lg bg-white p-6 shadow-lg">
                            <h3 className="font-playfair text-lg font-semibold text-gray-900">Distribution par Catégorie</h3>
                            <div className="mt-4 h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.categoryDistribution}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="count" name="Clients" fill="#8b5cf6" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Additional Stats */}
                    <div className="mt-8 overflow-hidden rounded-lg bg-white p-6 shadow-lg">
                        <h3 className="font-playfair text-lg font-semibold text-gray-900">Performance Globale</h3>
                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 p-4 text-white">
                                <h4 className="font-montserrat text-sm font-medium">Messages ce Mois</h4>
                                <p className="font-playfair text-2xl font-semibold">{stats.messagesSentThisMonth}</p>
                            </div>
                            <div className="rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 p-4 text-white">
                                <h4 className="font-montserrat text-sm font-medium">Total Messages</h4>
                                <p className="font-playfair text-2xl font-semibold">{stats.totalMessages}</p>
                            </div>
                            <div className="rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 p-4 text-white">
                                <h4 className="font-montserrat text-sm font-medium">Taux de Livraison</h4>
                                <p className="font-playfair text-2xl font-semibold">{stats.deliveryRate}%</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
