import React, { useMemo, type JSX } from 'react';
import {
  buildMiniMonthGrid,
  type CalendarDay,
  type CalendarDayMetadata,
  isSameDay,
} from './calendarMonthUtils';

const WEEKDAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

interface CalendarMonthCanvasProps {
  visibleMonth: Date;
  selectedDate: Date;
  dayMetaMap: Record<string, CalendarDayMetadata>;
  onSelectDay: (day: CalendarDay) => void;
  /** 'enter-left' | 'enter-right' | undefined — drives slide-in animation */
  slideDir?: 'left' | 'right' | null;
}

export default function CalendarMonthCanvas({
  visibleMonth,
  selectedDate,
  dayMetaMap,
  onSelectDay,
  slideDir,
}: CalendarMonthCanvasProps): JSX.Element {
  const days = useMemo(
    () => buildMiniMonthGrid(visibleMonth, selectedDate, dayMetaMap),
    [visibleMonth, selectedDate, dayMetaMap]
  );

  const gridClass = [
    'calendar-month__grid',
    slideDir === 'left'  ? 'calendar-month__grid--enter-left'  : '',
    slideDir === 'right' ? 'calendar-month__grid--enter-right' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="calendar-month">
      <div className="calendar-month__weekdayRow">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="calendar-month__weekdayLabel">
            {label}
          </div>
        ))}
      </div>

      <div className={gridClass}>
        {days.map((day, i) => {
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

          const cellClass = [
            'calendar-month__cell',
            isSelected              ? 'calendar-month__cell--selected' : '',
            day.isToday && !isSelected ? 'calendar-month__cell--today' : '',
          ].filter(Boolean).join(' ');

          // stagger delay: row * 30ms + col * 10ms
          const row = Math.floor(i / 7);
          const col = i % 7;
          const staggerDelay = `${row * 30 + col * 10}ms`;

          return (
            <button
              key={day.key}
              type="button"
              className={cellClass}
              style={{ '--cell-delay': staggerDelay } as React.CSSProperties}
              onClick={() => onSelectDay(day)}
              aria-pressed={isSelected}
              aria-label={`${
                day.date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
              }${day.eventCount > 0 ? `, ${day.eventCount} events` : ''}`}
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
  );
}
