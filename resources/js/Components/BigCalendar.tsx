import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import { motion } from "framer-motion";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "@/../../resources/css/shadcn-big-calendar.css";
import "moment/locale/fr";

// Configuration locale française
moment.locale('fr');
const localizer = momentLocalizer(moment);

interface BigCalendarProps {
    events: Array<{
        id: number;
        title: string;
        start: Date;
        end: Date;
        allDay?: boolean;
        resource?: any;
        status?: string;
        campaign?: any;
    }>;
    onSelectEvent?: (event: any) => void;
    onSelectSlot?: (slotInfo: any) => void;
    selectable?: boolean;
    view?: "month" | "week" | "day" | "agenda";
    date?: Date;
    onView?: (view: string) => void;
    onNavigate?: (date: Date) => void;
    className?: string;
    style?: React.CSSProperties;
    components?: any;
    formats?: any;
    messages?: any;
}

export default function BigCalendar({
    events,
    onSelectEvent,
    onSelectSlot,
    selectable = true,
    view = "month",
    date = new Date(),
    onView,
    onNavigate,
    className = "",
    style,
    components,
    formats,
    messages,
}: BigCalendarProps) {
    const calendarStyle = {
        height: '100%',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '14px',
        ...style
    };

    const defaultFormats = {
        monthHeaderFormat: 'MMMM YYYY',
        dayHeaderFormat: 'dddd DD MMMM',
        dayRangeHeaderFormat: ({ start, end }, culture, localizer) =>
            localizer?.format(start, 'DD', culture) + ' - ' + 
            localizer?.format(end, 'DD MMMM YYYY', culture),
        agendaDateFormat: 'DD MMMM',
        agendaTimeFormat: 'HH:mm',
        agendaTimeRangeFormat: ({ start, end }, culture, localizer) =>
            localizer?.format(start, 'HH:mm', culture) + ' - ' + 
            localizer?.format(end, 'HH:mm', culture),
        ...formats
    };

    const defaultMessages = {
        next: 'Suivant',
        previous: 'Précédent',
        today: 'Aujourd\'hui',
        month: 'Mois',
        week: 'Semaine',
        day: 'Jour',
        agenda: 'Agenda',
        date: 'Date',
        time: 'Heure',
        event: 'Événement',
        noEventsInRange: 'Aucune campagne dans cette période',
        showMore: (total) => `+${total} de plus`,
        ...messages
    };

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`h-full backdrop-blur-xl bg-gradient-to-br from-white/15 via-white/8 to-white/3 border border-white/20 rounded-2xl overflow-hidden shadow-xl ${className}`}
        >
            <div className="h-full p-1">
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    view={view}
                    date={date}
                    onView={onView}
                    onNavigate={onNavigate}
                    selectable={selectable}
                    onSelectEvent={onSelectEvent}
                    onSelectSlot={onSelectSlot}
                    style={calendarStyle}
                    formats={defaultFormats}
                    messages={defaultMessages}
                    components={components}
                    popup
                    step={60}
                    showMultiDayTimes
                    culture="fr"
                />
            </div>
        </motion.div>
    );
} 