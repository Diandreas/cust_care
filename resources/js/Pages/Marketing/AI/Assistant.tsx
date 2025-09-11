import React, { useState, useEffect, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { 
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
import { Separator } from '@/Components/ui/separator';
import { ScrollArea } from '@/Components/ui/scroll-area';
import {
    Bot,
    User,
    Send,
    Sparkles,
    MessageCircle,
    Lightbulb,
    TrendingUp,
    FileText,
    Zap
} from 'lucide-react';
import { toast } from 'sonner';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface AssistantProps {
    user: any;
    conversation_history?: Message[];
    suggested_prompts?: string[];
    ai_status?: 'online' | 'offline';
}

export default function Assistant({ user, conversation_history = [], suggested_prompts = [], ai_status = 'online' }: AssistantProps) {
    const [messages, setMessages] = useState<Message[]>(conversation_history);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const defaultPrompts = [
        "Comment améliorer mon taux d'engagement ?",
        "Créer une campagne WhatsApp",
        "Idées de contenu pour les réseaux sociaux",
        "Automatiser les messages d'anniversaire",
        "Analyser les performances de mes campagnes",
        "Créer un flyer promotionnel"
    ];

    const prompts = suggested_prompts.length > 0 ? suggested_prompts : defaultPrompts;

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async () => {
        if (!userInput.trim() || isLoading) return;
        if (ai_status === 'offline') {
            toast.error('L\'assistant IA n\'est pas disponible actuellement');
            return;
        }

        const newMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: userInput.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, newMessage]);
        setUserInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/marketing/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({
                    message: newMessage.content,
                    context: 'marketing'
                })
            });

            const data = await response.json();

            if (response.ok) {
                const aiMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: data.response || 'Désolé, je n\'ai pas pu traiter votre demande.',
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, aiMessage]);
            } else {
                throw new Error(data.message || 'Erreur de communication avec l\'IA');
            }
        } catch (error) {
            console.error('Erreur chat IA:', error);
            toast.error('Erreur lors de la communication avec l\'IA');
            
            // Message d'erreur de l'IA
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Désolé, je rencontre des difficultés techniques. Veuillez réessayer dans quelques instants.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePromptClick = (prompt: string) => {
        setUserInput(prompt);
    };

    const formatTime = (timestamp: Date) => {
        return new Intl.DateTimeFormat('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(timestamp));
    };

    const clearChat = () => {
        setMessages([]);
    };

    return (
        <AuthenticatedLayout user={user}>
            <Head title="Assistant IA Marketing" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                                Assistant IA Marketing
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400 mt-2">
                                Votre assistant intelligent pour optimiser vos campagnes marketing
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge 
                                variant={ai_status === 'online' ? 'default' : 'secondary'}
                                className={ai_status === 'online' ? 'bg-green-100 text-green-700' : ''}
                            >
                                <Bot className="h-3 w-3 mr-1" />
                                IA {ai_status === 'online' ? 'En ligne' : 'Hors ligne'}
                            </Badge>
                            {messages.length > 0 && (
                                <Button
                                    onClick={clearChat}
                                    variant="outline"
                                    size="sm"
                                >
                                    Effacer le chat
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Chat Principal */}
                        <div className="lg:col-span-3">
                            <Card className="h-[600px] flex flex-col">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-2">
                                        <MessageCircle className="h-5 w-5" />
                                        Conversation avec l'IA
                                    </CardTitle>
                                    <CardDescription>
                                        Posez vos questions marketing et obtenez des conseils personnalisés
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="flex-1 flex flex-col p-0">
                                    {/* Messages */}
                                    <ScrollArea className="flex-1 px-6" ref={chatContainerRef}>
                                        {messages.length === 0 ? (
                                            <div className="flex items-center justify-center h-full text-center">
                                                <div className="space-y-4">
                                                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                                                        <Bot className="h-8 w-8 text-white" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                                            Bonjour ! Je suis votre assistant IA marketing
                                                        </h3>
                                                        <p className="text-slate-600 dark:text-slate-400 mt-2">
                                                            Je peux vous aider avec vos campagnes, analyser vos données, créer du contenu et bien plus !
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4 py-4">
                                                {messages.map((message) => (
                                                    <div
                                                        key={message.id}
                                                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                                    >
                                                        <div className={`flex items-start gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                                message.role === 'user' 
                                                                    ? 'bg-blue-600 text-white' 
                                                                    : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                                                            }`}>
                                                                {message.role === 'user' ? (
                                                                    <User className="h-4 w-4" />
                                                                ) : (
                                                                    <Bot className="h-4 w-4" />
                                                                )}
                                                            </div>
                                                            <div className={`rounded-lg px-4 py-3 ${
                                                                message.role === 'user'
                                                                    ? 'bg-blue-600 text-white'
                                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                                                            }`}>
                                                                <div className="text-sm whitespace-pre-wrap">
                                                                    {message.content}
                                                                </div>
                                                                <div className={`text-xs mt-2 ${
                                                                    message.role === 'user' ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                                                                }`}>
                                                                    {formatTime(message.timestamp)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                
                                                {isLoading && (
                                                    <div className="flex justify-start">
                                                        <div className="flex items-start gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center">
                                                                <Bot className="h-4 w-4" />
                                                            </div>
                                                            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-3">
                                                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent"></div>
                                                                    L'IA réfléchit...
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </ScrollArea>

                                    <Separator />

                                    {/* Zone de saisie */}
                                    <div className="p-6">
                                        <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-3">
                                            <Input
                                                value={userInput}
                                                onChange={(e) => setUserInput(e.target.value)}
                                                placeholder={ai_status === 'online' ? "Posez votre question marketing..." : "IA hors ligne"}
                                                disabled={isLoading || ai_status === 'offline'}
                                                className="flex-1"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        sendMessage();
                                                    }
                                                }}
                                            />
                                            <Button
                                                type="submit"
                                                disabled={isLoading || !userInput.trim() || ai_status === 'offline'}
                                                className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                                            >
                                                <Send className="h-4 w-4" />
                                                Envoyer
                                            </Button>
                                        </form>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar avec suggestions */}
                        <div className="space-y-6">
                            {/* Suggestions rapides */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <Lightbulb className="h-4 w-4" />
                                        Questions Suggérées
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {prompts.map((prompt, index) => (
                                        <Button
                                            key={index}
                                            onClick={() => handlePromptClick(prompt)}
                                            variant="ghost"
                                            size="sm"
                                            className="w-full text-left justify-start h-auto py-2 px-3 text-xs whitespace-normal"
                                            disabled={isLoading || ai_status === 'offline'}
                                        >
                                            <Sparkles className="h-3 w-3 mr-2 flex-shrink-0" />
                                            {prompt}
                                        </Button>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* Actions rapides */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <Zap className="h-4 w-4" />
                                        Actions Rapides
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <Button
                                        onClick={() => handlePromptClick("Créer une campagne WhatsApp pour mes clients")}
                                        variant="outline"
                                        size="sm"
                                        className="w-full justify-start gap-2"
                                        disabled={isLoading || ai_status === 'offline'}
                                    >
                                        <MessageCircle className="h-4 w-4" />
                                        Campagne WhatsApp
                                    </Button>
                                    <Button
                                        onClick={() => handlePromptClick("Générer des idées de contenu pour mes réseaux sociaux")}
                                        variant="outline"
                                        size="sm"
                                        className="w-full justify-start gap-2"
                                        disabled={isLoading || ai_status === 'offline'}
                                    >
                                        <FileText className="h-4 w-4" />
                                        Contenu Social
                                    </Button>
                                    <Button
                                        onClick={() => handlePromptClick("Analyser les performances de mes dernières campagnes")}
                                        variant="outline"
                                        size="sm"
                                        className="w-full justify-start gap-2"
                                        disabled={isLoading || ai_status === 'offline'}
                                    >
                                        <TrendingUp className="h-4 w-4" />
                                        Analyser Performance
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Statistiques */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm">Statistiques</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-600 dark:text-slate-400">Messages envoyés</span>
                                        <Badge variant="secondary">{messages.filter(m => m.role === 'user').length}</Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-600 dark:text-slate-400">Réponses IA</span>
                                        <Badge variant="secondary">{messages.filter(m => m.role === 'assistant').length}</Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}