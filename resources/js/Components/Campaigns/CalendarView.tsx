import React from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/fr';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '@/../../resources/css/shadcn-big-calendar.css';
import { Button } from '@/Components/ui/button';
import {
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

moment.locale('fr');
const localizer = momentLocalizer(moment);

interface CalendarViewProps {
    calendarEvents: any[];
    calendarView: any;
    setCalendarView: (view: any) => void;
    selectedDate: Date;
    navigateCalendar: (action: string) => void;
    currentMonth: string;
    handleSelectEvent: (event: any) => void;
    handleSelectSlot: (slotInfo: any) => void;
    handleViewChange: (view: string) => void;
    EventComponent: any;
    EventWrapper: any;
    t: (key: string) => string;
}

export default function CalendarView({
    calendarEvents,
    calendarView,
    setCalendarView,
    selectedDate,
    navigateCalendar,
    currentMonth,
    handleSelectEvent,
    handleSelectSlot,
    handleViewChange,
    EventComponent,
    EventWrapper,
    t
}: CalendarViewProps) {
    return (
        <div className="h-full relative">
            {/* Floating Control Bar */}
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-20">
                <div className="floating-control-bar flex items-center gap-2 rounded-3xl px-6 py-3">
                    {/* Navigation */}
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigateCalendar('PREV')}
                            className="h-8 w-8 p-0 hover:bg-white/20 rounded-full transition-all duration-200"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigateCalendar('NEXT')}
                            className="h-8 w-8 p-0 hover:bg-white/20 rounded-full transition-all duration-200"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Month/Year */}
                    <div className="flex items-center px-4">
                        <span className="text-sm font-semibold text-gray-700">{currentMonth}</span>
                    </div>

                    {/* Separator */}
                    <div className="w-px h-6 bg-white/20"></div>

                    {/* View Toggles */}
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCalendarView(Views.MONTH)}
                            className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                                calendarView === Views.MONTH ? 'bg-white/30 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-white/15'
                            }`}
                        >
                            Mois
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCalendarView(Views.WEEK)}
                            className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                                calendarView === Views.WEEK ? 'bg-white/30 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-white/15'
                            }`}
                        >
                            Semaine
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCalendarView(Views.DAY)}
                            className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                                calendarView === Views.DAY ? 'bg-white/30 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-white/15'
                            }`}
                        >
                            Jour
                        </Button>
                    </div>

                    {/* Separator */}
                    <div className="w-px h-6 bg-white/20"></div>

                    {/* Today Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigateCalendar('TODAY')}
                        className="px-3 py-1 text-xs bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-700 hover:from-indigo-500/30 hover:to-purple-500/30 rounded-full font-medium transition-all duration-200"
                    >
                        Aujourd'hui
                    </Button>
                </div>
            </div>

            <div className="h-full p-6 pt-20">
                <div className="modern-calendar-container h-full rounded-3xl overflow-hidden">
                    <Calendar
                        localizer={localizer}
                        events={calendarEvents}
                        startAccessor="start"
                        endAccessor="end"
                        views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
                        view={calendarView}
                        date={selectedDate}
                        onView={handleViewChange}
                        onNavigate={(date) => {
                            // Navigation is handled by the floating bar
                        }}
                        style={{
                            height: '100%',
                            fontFamily: 'Inter, system-ui, sans-serif',
                            fontSize: '14px'
                        }}
                        className="custom-calendar h-full"
                        components={{
                            event: EventComponent,
                            eventWrapper: EventWrapper,
                            toolbar: () => null // Remove default toolbar
                        }}
                        onSelectEvent={handleSelectEvent}
                        onSelectSlot={handleSelectSlot}
                        selectable={true}
                        eventPropGetter={(event) => ({
                            className: 'rounded overflow-hidden'
                        })}
                        messages={{
                            today: t('campaigns.today'),
                            previous: t('campaigns.previous'),
                            next: t('campaigns.next'),
                            month: t('campaigns.month'),
                            week: t('campaigns.week'),
                            day: t('campaigns.day'),
                            agenda: t('campaigns.agenda'),
                            date: t('campaigns.date'),
                            time: t('campaigns.time'),
                            event: t('campaigns.event'),
                            noEventsInRange: t('campaigns.noCampaignsInRange'),
                            showMore: (total: number) => `+ ${total} ${t('campaigns.more')}`
                        }}
                    />
                </div>
            </div>
        </div>
    );
}