import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "@/../../resources/css/shadcn-big-calendar.css";

const localizer = momentLocalizer(moment);

interface BigCalendarProps {
    events: Array<{
        id: number;
        title: string;
        start: Date;
        end: Date;
        allDay?: boolean;
        resource?: any;
    }>;
    onSelectEvent?: (event: any) => void;
    onSelectSlot?: (slotInfo: any) => void;
    selectable?: boolean;
    defaultView?: "month" | "week" | "day" | "agenda";
    defaultDate?: Date;
}

export default function BigCalendar({
    events,
    onSelectEvent,
    onSelectSlot,
    selectable = true,
    defaultView = "month",
    defaultDate = new Date(),
}: BigCalendarProps) {
    return (
        <div className="rounded-md border bg-card h-[600px]">
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                defaultView={defaultView}
                selectable={selectable}
                onSelectEvent={onSelectEvent}
                onSelectSlot={onSelectSlot}
                defaultDate={defaultDate}
                style={{ height: "100%" }}
            />
        </div>
    );
} 