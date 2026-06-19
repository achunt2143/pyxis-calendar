import React, { useRef, useState, useEffect, type JSX } from 'react';
import { Divider } from 'remochi';
import {
  buildMiniMonthGrid,
  type CalendarDay,
  type CalendarDayMetadata,
  getMonthLabel
} from './calendarMonthUtils';

const WEEKDAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THR', 'FRI', 'SAT'];

// ─── MiniMonth ────────────────────────────────────────────────────────────────

interface MiniMonthProps {
  viewDate: Date;
  selectedDate: Date;
  dayMetaMap: Record<string, CalendarDayMetadata>;
  onSelectDay: (day: CalendarDay) => void;
}

function MiniMonth({ viewDate, selectedDate, dayMetaMap, onSelectDay }: MiniMonthProps): JSX.Element {
  const days = buildMiniMonthGrid(viewDate, selectedDate, dayMetaMap);

  return (
    <div className="calendar-rail__monthBlock">
      <div className="calendar-rail__monthLabel">{getMonthLabel(viewDate)}</div>

      <div className="calendar-rail__weekdayRow">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="calendar-rail__weekday">{label}</div>
        ))}
      </div>

      <div className="calendar-rail__grid">
        {days.map((day) => {
          if (!day.inMonth) {
            return <div key={day.key} className="calendar-rail__emptyCell" aria-hidden="true" />;
          }

          const className = [
            'calendar-rail__dayButton',
            day.isSelected                      ? 'calendar-rail__dayButton--selected'  : '',
            day.isToday && !day.isSelected      ? 'calendar-rail__dayButton--today'     : '',
            day.hasEvents                       ? 'calendar-rail__dayButton--hasEvents' : '',
            day.isDisabled                      ? 'calendar-rail__dayButton--disabled'  : ''
          ].filter(Boolean).join(' ');

          return (
            <div key={day.key} className="calendar-rail__cellWrap">
              <button
                type="button"
                className={className}
                onClick={() => onSelectDay(day)}
                disabled={day.isDisabled}
                aria-pressed={day.isSelected}
                aria-label={`${getMonthLabel(viewDate)} ${day.dayNumber}`}
              >
                <span className="calendar-rail__dayNumber">{day.dayNumber}</span>
                {day.hasEvents ? <span className="calendar-rail__eventDot" aria-hidden="true" /> : null}
                {day.isToday && !day.isSelected ? (
                  <span className="calendar-rail__todayBar" aria-hidden="true" />
                ) : null}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Rail ─────────────────────────────────────────────────────────────────────

export interface CalendarMonthRailProps {
  visibleMonth: Date;
  selectedDate: Date;
  dayMetaMap: Record<string, CalendarDayMetadata>;
  onSelectDay: (day: CalendarDay) => void;
}

type SlideDir = 'left' | 'right' | null;

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}`;
}

export default function CalendarMonthRail({
  visibleMonth,
  selectedDate,
  dayMetaMap,
  onSelectDay,
}: CalendarMonthRailProps): JSX.Element {
  const prevMonthRef  = useRef<Date>(visibleMonth);
  const [slideDir, setSlideDir]       = useState<SlideDir>(null);
  const [exitMonth, setExitMonth]     = useState<Date | null>(null);
  const [exitNextMonth, setExitNextMonth] = useState<Date | null>(null);

  // Detect when visibleMonth changes and kick off slide
  useEffect(() => {
    const prev = prevMonthRef.current;
    if (monthKey(prev) === monthKey(visibleMonth)) return;

    const goingForward =
      visibleMonth.getFullYear() > prev.getFullYear() ||
      (visibleMonth.getFullYear() === prev.getFullYear() &&
        visibleMonth.getMonth() > prev.getMonth());

    const prevNext = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);

    setExitMonth(prev);
    setExitNextMonth(prevNext);
    setSlideDir(goingForward ? 'left' : 'right');
    prevMonthRef.current = visibleMonth;

    const id = window.setTimeout(() => {
      setExitMonth(null);
      setExitNextMonth(null);
      setSlideDir(null);
    }, 320);

    return () => window.clearTimeout(id);
  }, [visibleMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentNext = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);

  const enterClass = slideDir === 'left'
    ? 'calendar-rail__slide calendar-rail__slide--enter-left'
    : slideDir === 'right'
      ? 'calendar-rail__slide calendar-rail__slide--enter-right'
      : 'calendar-rail__slide';

  const exitClass = slideDir === 'left'
    ? 'calendar-rail__slide calendar-rail__slide--exit-left'
    : 'calendar-rail__slide calendar-rail__slide--exit-right';

  return (
    <div className="calendar-rail">
      <div className="calendar-rail__slideViewport">

        {/* Exiting pair */}
        {exitMonth && (
          <div key={`exit-${monthKey(exitMonth)}`} className={`calendar-rail__slidePane ${exitClass}`} aria-hidden="true">
            <MiniMonth viewDate={exitMonth}     selectedDate={selectedDate} dayMetaMap={dayMetaMap} onSelectDay={onSelectDay} />
            <div className="calendar-rail__dividerWrap"><Divider /></div>
            <MiniMonth viewDate={exitNextMonth!} selectedDate={selectedDate} dayMetaMap={dayMetaMap} onSelectDay={onSelectDay} />
          </div>
        )}

        {/* Entering pair */}
        <div key={monthKey(visibleMonth)} className={`calendar-rail__slidePane ${enterClass}`}>
          <MiniMonth viewDate={visibleMonth}  selectedDate={selectedDate} dayMetaMap={dayMetaMap} onSelectDay={onSelectDay} />
          <div className="calendar-rail__dividerWrap"><Divider /></div>
          <MiniMonth viewDate={currentNext}   selectedDate={selectedDate} dayMetaMap={dayMetaMap} onSelectDay={onSelectDay} />
        </div>

      </div>

      <div className="calendar-rail__footer">
        <button type="button" className="calendar-rail__newEvent">( New Event )</button>
      </div>
    </div>
  );
}
