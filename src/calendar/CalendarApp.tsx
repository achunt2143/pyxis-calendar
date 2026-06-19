import React, { useMemo, useState, type JSX } from 'react';
import { Panel } from 'remochi';
import CalendarMonthRail from './CalendarMonthRail';
import CalendarDayCanvas from './CalendarDayCanvas';
import CalendarViewSwitcher, { type CalendarViewMode } from './CalendarViewSwitcher';
import { type CalendarDay, demoDayMeta, demoEventsByDate, toDateKey } from './calendarMonthUtils';
import './calendar.css';

export default function CalendarApp(): JSX.Element {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 5, 19));
  const [viewMode, setViewMode] = useState<CalendarViewMode>('day');

  const visibleMonth = useMemo(() => {
    return new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  }, [selectedDate]);

  const events = useMemo(() => {
    return demoEventsByDate[toDateKey(selectedDate)] ?? [];
  }, [selectedDate]);

  function handleSelectDay(day: CalendarDay): void {
    setSelectedDate(day.date);
  }

  function handlePrevDay(): void {
    setSelectedDate((d) => {
      const prev = new Date(d);
      prev.setDate(prev.getDate() - 1);
      return prev;
    });
  }

  function handleNextDay(): void {
    setSelectedDate((d) => {
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      return next;
    });
  }

  return (
    <div className="calendar-appShell">
      <div className="calendar-appShell__frame">
        <div className="calendar-appShell__content">
          <div className="calendar-appShell__railWrap">
            <Panel>
              <div className="calendar-appShell__railInner">
                <CalendarMonthRail
                  visibleMonth={visibleMonth}
                  selectedDate={selectedDate}
                  dayMetaMap={demoDayMeta}
                  onSelectDay={handleSelectDay}
                />
              </div>
            </Panel>
          </div>

          <div className="calendar-appShell__mainWrap">
            <Panel>
              <div className="calendar-appShell__mainInner">
                <CalendarDayCanvas
                  selectedDate={selectedDate}
                  events={events}
                  onPrevDay={handlePrevDay}
                  onNextDay={handleNextDay}
                />
                <CalendarViewSwitcher value={viewMode} onChange={setViewMode} />
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
