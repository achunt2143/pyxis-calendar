import React, { useMemo, type JSX } from 'react';
import CalendarDayCanvas from './CalendarDayCanvas';
import {
  buildMiniMonthGrid,
  type CalendarDay,
  type CalendarDayMetadata,
  type CalendarEvent,
  demoEventsByDate,
  toDateKey,
  isSameDay,
} from './calendarMonthUtils';

const WEEKDAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

interface CalendarMonthCanvasProps {
  visibleMonth: Date;
  selectedDate: Date;
  dayMetaMap: Record<string, CalendarDayMetadata>;
  onSelectDay: (day: CalendarDay) => void;
}

export default function CalendarMonthCanvas({
  visibleMonth,
  selectedDate,
  dayMetaMap,
  onSelectDay,
}: CalendarMonthCanvasProps): JSX.Element {
  const days = useMemo(
    () => buildMiniMonthGrid(visibleMonth, selectedDate, dayMetaMap),
    [visibleMonth, selectedDate, dayMetaMap]
  );

  const selectedEvents: CalendarEvent[] = useMemo(
    () => demoEventsByDate[toDateKey(selectedDate)] ?? [],
    [selectedDate]
  );

  return (
    <div className="calendar-month">

      {/* ─── Left: day canvas for selected date ─── */}
      <div className="calendar-month__dayPanel">
        <CalendarDayCanvas
          selectedDate={selectedDate}
          events={selectedEvents}
          variant="day"
        />
      </div>

      {/* ─── Right: full month grid ─── */}
      <div className="calendar-month__gridPanel">

        <div className="calendar-month__weekdayRow">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="calendar-month__weekdayLabel">
              {label}
            </div>
          ))}
        </div>

        <div className="calendar-month__grid">
          {days.map((day) => {
            if (!day.inMonth) {
              return (
                <div
                  key={day.key}
                  className="calendar-month__cell calendar-month__cell--outOfMonth"
                  aria-hidden="true"
                />
              );
            }

            const isSelected = isSameDay(day.date, selectedDate);
            const isToday    = day.isToday;

            const cellClass = [
              'calendar-month__cell',
              isSelected ? 'calendar-month__cell--selected' : '',
              isToday && !isSelected ? 'calendar-month__cell--today' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <button
                key={day.key}
                type="button"
                className={cellClass}
                onClick={() => onSelectDay(day)}
                aria-pressed={isSelected}
                aria-label={`${day.date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}${
                  day.eventCount > 0 ? `, ${day.eventCount} events` : ''
                }`}
              >
                <span className="calendar-month__cellDate">{day.dayNumber}</span>
                {day.eventCount > 0 && (
                  <span className="calendar-month__eventBadge">
                    {day.eventCount} {day.eventCount === 1 ? 'Event' : 'Events'}
                  </span>
                )}
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
