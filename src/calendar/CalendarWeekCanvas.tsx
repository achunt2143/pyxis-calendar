import React, { useMemo, type JSX } from 'react';
import CalendarDayCanvas from './CalendarDayCanvas';
import {
  getWeekDays,
  getWeekColHeading,
  toDateKey,
  demoEventsByDate,
  isSameDay
} from './calendarMonthUtils';

interface CalendarWeekCanvasProps {
  /** Any date in the target week — Sunday of that week will be the anchor. */
  selectedDate: Date;
  /** Index (0–6) of the column that is the "origin" of the grow animation. */
  originColIndex: number;
  /** 'enter' = columns grow in, 'exit' = columns shrink out */
  animState: 'enter' | 'exit' | 'idle';
}

export default function CalendarWeekCanvas({
  selectedDate,
  originColIndex,
  animState
}: CalendarWeekCanvasProps): JSX.Element {
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  const today = useMemo(() => new Date(), []);

  return (
    <div className="calendar-week">
      {weekDays.map((day, colIndex) => {
        const key = toDateKey(day);
        const events = demoEventsByDate[key] ?? [];
        const isToday = isSameDay(day, today);
        const isSelected = isSameDay(day, selectedDate);
        // distance from origin drives the stagger delay
        const dist = Math.abs(colIndex - originColIndex);
        const delay = dist * 28;

        return (
          <div
            key={key}
            className={
              `calendar-week__col${
                isToday ? ' calendar-week__col--today' : ''
              }${
                isSelected ? ' calendar-week__col--selected' : ''
              }${
                animState === 'enter' ? ' calendar-week__col--enter' : ''
              }${
                animState === 'exit' ? ' calendar-week__col--exit' : ''
              }`
            }
            style={{ '--col-delay': `${delay}ms` } as React.CSSProperties}
          >
            <CalendarDayCanvas
              selectedDate={day}
              events={events}
              variant="week-col"
              headingProps={{ heading: getWeekColHeading(day) }}
            />
          </div>
        );
      })}
    </div>
  );
}
