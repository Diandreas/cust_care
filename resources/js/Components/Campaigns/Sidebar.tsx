import React from 'react';
import { motion } from 'framer-motion';
import moment from 'moment';
import { Campaign } from '@/types';
import { Button } from '@/Components/ui/button';
import { ScrollArea } from '@/Components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import {
    CalendarIcon,
    Check,
    Clock,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

interface SidebarProps {
    campaigns: Campaign[];
    campaignsByStatus: { [key: string]: Campaign[] };
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
    updateCurrentMonth: (date: Date) => void;
    calendarEvents: any[];
    selectedStatus: string;
    setSelectedStatus: (status: string) => void;
    selectedTag: string;
    setSelectedTag: (tag: string) => void;
    tags: any[];
}

export default function Sidebar({
    campaigns,
    campaignsByStatus,
    selectedDate,
    setSelectedDate,
    updateCurrentMonth,
    calendarEvents,
    selectedStatus,
    setSelectedStatus,
    selectedTag,
    setSelectedTag,
    tags
}: SidebarProps) {
    return (
        <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-r border-white/25 backdrop-blur-xl bg-gradient-to-b from-white/25 via-white/15 to-white/5 overflow-hidden"
        >
            <ScrollArea className="h-full px-4 py-4">
                {/* Stats Compactes en Une Ligne - 30px hauteur */}
                <div className="mb-4">
                    <div className="flex items-center justify-between h-[30px] backdrop-blur-xl bg-gradient-to-r from-white/30 via-white/20 to-white/10 border border-white/25 rounded-2xl px-4">
                        <TooltipProvider>
                            <div className="flex items-center space-x-4">
                                <Tooltip>
                                    <TooltipTrigger className="flex items-center space-x-1">
                                        <CalendarIcon className="h-4 w-4 text-indigo-600" />
                                        <span className="text-sm font-semibold">{campaigns.length}</span>
                                    </TooltipTrigger>
                                    <TooltipContent>Total Campagnes</TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                    <TooltipTrigger className="flex items-center space-x-1">
                                        <Check className="h-4 w-4 text-green-600" />
                                        <span className="text-sm font-semibold">{campaignsByStatus.sent?.length || 0}</span>
                                    </TooltipTrigger>
                                    <TooltipContent>Envoyées</TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                    <TooltipTrigger className="flex items-center space-x-1">
                                        <Clock className="h-4 w-4 text-yellow-600" />
                                        <span className="text-sm font-semibold">{campaignsByStatus.scheduled?.length || 0}</span>
                                    </TooltipTrigger>
                                    <TooltipContent>Programmées</TooltipContent>
                                </Tooltip>
                            </div>
                        </TooltipProvider>
                    </div>
                </div>

                {/* Mini Calendrier Compact */}
                <div className="mb-4">
                    <div className="backdrop-blur-xl bg-gradient-to-br from-white/25 via-white/15 to-white/5 border border-white/25 rounded-2xl p-3">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold">{moment(selectedDate).format('MMMM YYYY')}</h3>
                            <div className="flex space-x-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        const newDate = moment(selectedDate).subtract(1, 'month').toDate();
                                        setSelectedDate(newDate);
                                        updateCurrentMonth(newDate);
                                    }}
                                    className="h-6 w-6 hover:bg-white/20 rounded-lg"
                                >
                                    <ChevronLeft className="h-3 w-3" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        const newDate = moment(selectedDate).add(1, 'month').toDate();
                                        setSelectedDate(newDate);
                                        updateCurrentMonth(newDate);
                                    }}
                                    className="h-6 w-6 hover:bg-white/20 rounded-lg"
                                >
                                    <ChevronRight className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                        
                        <div className="text-[10px]">
                            <div className="grid grid-cols-7 text-center font-medium text-muted-foreground mb-1">
                                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => (
                                    <div key={i} className="py-1">{day}</div>
                                ))}
                            </div>
                            
                            <div className="grid grid-cols-7 text-center gap-0.5">
                                {(() => {
                                    const date = moment(selectedDate);
                                    const firstDay = moment(date).startOf('month');
                                    const daysInMonth = date.daysInMonth();
                                    const firstDayOfWeek = (firstDay.day() + 6) % 7;
                                    const days = [];

                                    for (let i = 0; i < firstDayOfWeek; i++) {
                                        const prevMonthDay = moment(firstDay).subtract(firstDayOfWeek - i, 'days');
                                        days.push({
                                            day: prevMonthDay.date(),
                                            inMonth: false,
                                            date: prevMonthDay.toDate(),
                                            isToday: prevMonthDay.isSame(moment(), 'day')
                                        });
                                    }

                                    for (let i = 1; i <= daysInMonth; i++) {
                                        const currentDate = moment(firstDay).date(i);
                                        days.push({
                                            day: i,
                                            inMonth: true,
                                            date: currentDate.toDate(),
                                            isToday: currentDate.isSame(moment(), 'day'),
                                            hasEvents: calendarEvents.some(event =>
                                                moment(event.start).isSame(currentDate, 'day')
                                            )
                                        });
                                    }

                                    const remainingDays = 35 - days.length;
                                    for (let i = 1; i <= remainingDays; i++) {
                                        const nextMonthDay = moment(date).endOf('month').add(i, 'days');
                                        days.push({
                                            day: i,
                                            inMonth: false,
                                            date: nextMonthDay.toDate(),
                                            isToday: nextMonthDay.isSame(moment(), 'day')
                                        });
                                    }

                                    return days.slice(0, 35).map((day, i) => (
                                        <div
                                            key={i}
                                            className={`h-6 w-6 flex items-center justify-center cursor-pointer rounded-md hover:bg-white/20 text-[9px] transition-colors ${
                                                !day.inMonth ? 'text-muted-foreground/40' : ''
                                            } ${
                                                day.isToday ? 'bg-indigo-500/20 text-indigo-700 font-bold' : ''
                                            } ${
                                                day.hasEvents && !day.isToday ? 'font-semibold text-blue-600 bg-blue-50/50' : ''
                                            }`}
                                            onClick={() => setSelectedDate(day.date)}
                                        >
                                            {day.day}
                                            {day.hasEvents && !day.isToday && (
                                                <div className="h-1 w-1 bg-blue-500 rounded-full mx-auto mt-0.5"></div>
                                            )}
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filtres Compacts */}
                <div className="space-y-2">
                    <div className="backdrop-blur-xl bg-gradient-to-br from-white/25 via-white/15 to-white/5 border border-white/25 rounded-2xl p-3">
                        <h3 className="text-xs font-semibold mb-2 text-gray-700">Filtres</h3>
                        <div className="space-y-2">
                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger className="h-8 text-xs backdrop-blur-sm bg-white/20 border-white/20 rounded-lg">
                                    <SelectValue placeholder="Statut" />
                                </SelectTrigger>
                                <SelectContent className="backdrop-blur-xl bg-white/90">
                                    <SelectItem value="all">Tous les statuts</SelectItem>
                                    <SelectItem value="draft">Brouillons</SelectItem>
                                    <SelectItem value="scheduled">Programmées</SelectItem>
                                    <SelectItem value="sent">Envoyées</SelectItem>
                                    <SelectItem value="failed">Échouées</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={selectedTag} onValueChange={setSelectedTag}>
                                <SelectTrigger className="h-8 text-xs backdrop-blur-sm bg-white/20 border-white/20 rounded-lg">
                                    <SelectValue placeholder="Tag" />
                                </SelectTrigger>
                                <SelectContent className="backdrop-blur-xl bg-white/90">
                                    <SelectItem value="all">Tous les tags</SelectItem>
                                    {tags.map((tag) => (
                                        <SelectItem key={tag.id} value={tag.id.toString()}>
                                            {tag.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </motion.div>
    );
}