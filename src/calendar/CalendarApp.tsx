import React, { useMemo, useRef, useState, type JSX } from 'react';
import { Panel } from 'remochi';
import CalendarMonthRail from './CalendarMonthRail';
import CalendarDayCanvas from './CalendarDayCanvas';
import CalendarViewSwitcher, { type CalendarViewMode } from './CalendarViewSwitcher';
import { type CalendarDay, demoDayMeta, demoEventsByDate, toDateKey } from './calendarMonthUtils';
import './calendar.css';

type SlideDir = 'left' | 'right';

export default function CalendarApp(): JSX.Element {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 5, 19));
  const [viewMode, setViewMode] = useState<CalendarViewMode>('day');
  const [slideDir, setSlideDir] = useState<SlideDir>('left');
  // Track previous canvas so we can animate it out
  const prevKeyRef = useRef<string>(toDateKey(new Date(2026, 5, 19)));
  const [exitKey, setExitKey] = useState<string | null>(null);
  const [exitDir, setExitDir] = useState<SlideDir>('left');

  const visibleMonth = useMemo(() => {
    return new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  }, [selectedDate]);

  const events = useMemo(() => {
    return demoEventsByDate[toDateKey(selectedDate)] ?? [];
  }, [selectedDate]);

  function navigate(dir: SlideDir, next: Date): void {
    const currentKey = prevKeyRef.current;
    setExitKey(currentKey);
    setExitDir(dir);
    setSlideDir(dir);
    setSelectedDate(next);
    prevKeyRef.current = toDateKey(next);
    // Remove exit ghost after animation finishes
    window.setTimeout(() => setExitKey(null), 320);
  }

  function handleSelectDay(day: CalendarDay): void {
    const dir: SlideDir = day.date > selectedDate ? 'left' : 'right';
    navigate(dir, day.date);
  }

  function handlePrevDay(): void {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    navigate('right', prev);
  }

  function handleNextDay(): void {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    navigate('left', next);
  }

  const dateKey = toDateKey(selectedDate);

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
                <div className="calendar-day__slideViewport">
                  {/* Outgoing ghost — animates out */}
                  {exitKey && exitKey !== dateKey && (
                    <div
                      key={`exit-${exitKey}`}
                      className={
                        `calendar-day__slidePane calendar-day__slidePane--exit-${
                          exitDir === 'left' ? 'left' : 'right'
                        }`
                      }
                    >
                      {/* intentionally empty — just a visual placeholder that slides out */}
                      <div className="calendar-day__slideGhost" />
                    </div>
                  )}

                  {/* Incoming — animates in */}
                  <div
                    key={dateKey}
                    className={
                      `calendar-day__slidePane calendar-day__slidePane--enter-${
                        slideDir === 'left' ? 'left' : 'right'
                      }`
                    }
                  >
                    <CalendarDayCanvas
                      selectedDate={selectedDate}
                      events={events}
                      onPrevDay={handlePrevDay}
                      onNextDay={handleNextDay}
                    />
                  </div>
                </div>

                <CalendarViewSwitcher value={viewMode} onChange={setViewMode} />
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
