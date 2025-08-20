import React, { useState, useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { ScrollArea } from '@/Components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/Components/ui/avatar';
import { Badge } from '@/Components/ui/badge';
import { Separator } from '@/Components/ui/separator';
import {
  MessageCircle, Send, Bot, User, Sparkles, Clock,
  MessageSquare, Zap, RefreshCw, Settings, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  status?: 'sending' | 'sent' | 'delivered' | 'failed';
}

interface ChatProps extends PageProps {
  conversation_history?: Message[];
  whatsapp_connected?: boolean;
  ai_status?: 'online' | 'offline' | 'processing';
}

export default function ChatIndex({ 
  auth, 
  conversation_history = [], 
  whatsapp_connected = false,
  ai_status = 'online'
}: ChatProps) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>(conversation_history);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus sur l'input au chargement
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      role: 'user',
      timestamp: new Date().toISOString(),
      status: 'sending'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await fetch('/marketing/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        },
        body: JSON.stringify({
          message: userMessage.content
        })
      });

      const data = await response.json();

      if (data.success) {
        // Marquer le message utilisateur comme envoyé
        setMessages(prev => prev.map(msg => 
          msg.id === userMessage.id ? { ...msg, status: 'sent' } : msg
        ));

        // Ajouter la réponse de l'IA
        const aiMessage: Message = {
          id: data.message_id || (Date.now() + 1).toString(),
          content: data.content,
          role: 'assistant',
          timestamp: new Date().toISOString(),
          status: 'delivered'
        };

        setTimeout(() => {
          setMessages(prev => [...prev, aiMessage]);
          setIsTyping(false);
        }, 1000);
      } else {
        // Marquer comme échoué
        setMessages(prev => prev.map(msg => 
          msg.id === userMessage.id ? { ...msg, status: 'failed' } : msg
        ));
        setIsTyping(false);
      }
    } catch (error) {
      console.error('Erreur envoi message:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id ? { ...msg, status: 'failed' } : msg
      ));
      setIsTyping(false);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-gray-400 animate-pulse" />;
      case 'sent':
        return <Send className="w-3 h-3 text-blue-500" />;
      case 'delivered':
        return <MessageCircle className="w-3 h-3 text-green-500" />;
      case 'failed':
        return <RefreshCw className="w-3 h-3 text-red-500" />;
      default:
        return null;
    }
  };

  const quickActions = [
    { label: 'Générer post Instagram', action: 'generate_instagram_post', icon: Sparkles },
    { label: 'Créer campagne WhatsApp', action: 'create_whatsapp_campaign', icon: MessageSquare },
    { label: 'Analyser performance', action: 'analyze_performance', icon: Zap },
    { label: 'Générer flyer', action: 'generate_flyer', icon: FileText }
  ];

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title={t('marketing.chat.title', 'Chat IA Marketing')} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-8rem)]">
          
          {/* Sidebar - Actions rapides */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  Actions Rapides
                </CardTitle>
                <CardDescription>
                  Demandez à l'IA de vous aider
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full justify-start h-auto p-3 text-left"
                    onClick={() => setInputMessage(action.label)}
                  >
                    <action.icon className="w-4 h-4 mr-3 text-purple-600" />
                    <span className="text-sm">{action.label}</span>
                  </Button>
                ))}

                <Separator className="my-4" />

                {/* Statut WhatsApp */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">WhatsApp</span>
                    <Badge variant={whatsapp_connected ? 'default' : 'secondary'}>
                      {whatsapp_connected ? 'Connecté' : 'Déconnecté'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">IA Assistant</span>
                    <Badge variant={ai_status === 'online' ? 'default' : 'secondary'}>
                      <div className={cn(
                        "w-2 h-2 rounded-full mr-2",
                        ai_status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                      )} />
                      {ai_status === 'online' ? 'En ligne' : 'Hors ligne'}
                    </Badge>
                  </div>
                </div>

                <Button variant="outline" size="sm" className="w-full mt-4">
                  <Settings className="w-4 h-4 mr-2" />
                  Paramètres Chat
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Zone de chat principale */}
          <div className="lg:col-span-3">
            <Card className="h-full flex flex-col">
              
              {/* Header du chat */}
              <CardHeader className="flex-shrink-0 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                        <Bot className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">Assistant Marketing IA</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        Prêt à vous aider avec votre marketing
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {whatsapp_connected && (
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        <Phone className="w-3 h-3 mr-1" />
                        WhatsApp actif
                      </Badge>
                    )}
                    <Button variant="ghost" size="icon">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Zone des messages */}
              <CardContent className="flex-1 flex flex-col min-h-0 p-0">
                <ScrollArea className="flex-1 p-6">
                  <div className="space-y-4">
                    
                    {/* Message de bienvenue */}
                    {messages.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-8"
                      >
                        <Bot className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Bonjour ! Je suis votre assistant marketing IA
                        </h3>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                          Je peux vous aider à créer du contenu, gérer vos campagnes, 
                          analyser vos performances et automatiser votre marketing.
                        </p>
                        <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
                          {quickActions.slice(0, 4).map((action, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => setInputMessage(action.label)}
                              className="text-xs"
                            >
                              <action.icon className="w-3 h-3 mr-1" />
                              {action.label.split(' ')[0]}
                            </Button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Messages */}
                    <AnimatePresence>
                      {messages.map((message, index) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className={cn(
                            "flex gap-3",
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                          )}
                        >
                          {message.role === 'assistant' && (
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                                <Bot className="w-4 h-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div className={cn(
                            "max-w-[70%] rounded-2xl px-4 py-3",
                            message.role === 'user'
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                              : 'bg-gray-100 text-gray-900 border'
                          )}>
                            <p className="text-sm leading-relaxed">{message.content}</p>
                            <div className={cn(
                              "flex items-center justify-between mt-2 text-xs",
                              message.role === 'user' ? 'text-purple-100' : 'text-gray-500'
                            )}>
                              <span>
                                {new Date(message.timestamp).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              {message.role === 'user' && getStatusIcon(message.status)}
                            </div>
                          </div>

                          {message.role === 'user' && (
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                                <User className="w-4 h-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* Indicateur de frappe */}
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex gap-3"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                            <Bot className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-gray-100 rounded-2xl px-4 py-3 border">
                          <div className="flex items-center gap-1">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                            </div>
                            <span className="text-xs text-gray-500 ml-2">L'IA réfléchit...</span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Zone de saisie */}
                <div className="border-t p-4 flex-shrink-0">
                  <form onSubmit={handleSendMessage} className="flex gap-3">
                    <div className="flex-1 relative">
                      <Input
                        ref={inputRef}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Demandez à l'IA de créer du contenu, analyser vos données..."
                        className="pr-12"
                        disabled={isLoading}
                      />
                      {inputMessage && (
                        <Button
                          type="submit"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </form>
                  
                  <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                    <div className="flex items-center gap-4">
                      <span>Tapez votre message ou sélectionnez une action rapide</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {whatsapp_connected && (
                        <Badge variant="outline" className="text-green-600">
                          <Phone className="w-3 h-3 mr-1" />
                          WhatsApp actif
                        </Badge>
                      )}
                      <Badge variant="outline">
                        <Sparkles className="w-3 h-3 mr-1" />
                        IA {ai_status}
                      </Badge>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}