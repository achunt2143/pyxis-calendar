import React, { useMemo, useRef, useState, type JSX } from 'react';
import { Panel, Button, PopupPanel } from 'remochi';
import CalendarMonthRail from './CalendarMonthRail';
import CalendarDayCanvas from './CalendarDayCanvas';
import CalendarWeekCanvas from './CalendarWeekCanvas';
import CalendarMonthCanvas from './CalendarMonthCanvas';
import CalendarViewSwitcher, { type CalendarViewMode } from './CalendarViewSwitcher';
import {
  type CalendarDay,
  demoDayMeta,
  demoEventsByDate,
  toDateKey,
  getWeekHeading,
  getDayHeading,
  getDaySubheading,
  getMonthLabel,
} from './calendarMonthUtils';
import './calendar.css';

type SlideDir = 'left' | 'right';
type WeekAnimState = 'enter' | 'exit' | 'idle';

function getColIndex(date: Date): number {
  return date.getDay();
}

const MORE_ACTIONS = [
  { label: 'Settings',              onClick: () => {} },
  { label: 'Connectors',            onClick: () => {} },
  { label: 'Notifications',         onClick: () => {} },
  { label: 'Import events',         onClick: () => {} },
  { label: 'Export events',         onClick: () => {} },
  { label: 'Sharing & permissions', onClick: () => {} },
  { label: 'Keyboard shortcuts',    onClick: () => {} },
  { label: 'About',                 onClick: () => {} },
];

export default function CalendarApp(): JSX.Element {
  const [selectedDate, setSelectedDate]     = useState<Date>(new Date(2026, 5, 19));
  const [viewMode, setViewMode]             = useState<CalendarViewMode>('day');
  const [slideDir, setSlideDir]             = useState<SlideDir>('left');
  const [weekAnimState, setWeekAnimState]   = useState<WeekAnimState>('idle');
  const [originColIndex, setOriginColIndex] = useState<number>(0);
  const [moreOpen, setMoreOpen]             = useState(false);
  const moreBtnRef                          = useRef<HTMLDivElement>(null);
  const [moreAnchor, setMoreAnchor]         = useState<DOMRect | null>(null);

  // Day-view slide state
  const prevKeyRef = useRef<string>(toDateKey(new Date(2026, 5, 19)));
  const [exitKey, setExitKey] = useState<string | null>(null);
  const [exitDir, setExitDir] = useState<SlideDir>('left');

  // Month-view slide state
  const prevMonthKeyRef = useRef<string>('');
  const [monthSlideDir, setMonthSlideDir]     = useState<SlideDir | null>(null);
  const [monthExitKey, setMonthExitKey]       = useState<string | null>(null);
  const [monthExitDir, setMonthExitDir]       = useState<SlideDir>('left');
  const [displayedMonth, setDisplayedMonth]   = useState<Date>(new Date(2026, 5, 1));

  const visibleMonth = useMemo(() =>
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
    [selectedDate]
  );

  const events = useMemo(() =>
    demoEventsByDate[toDateKey(selectedDate)] ?? [],
    [selectedDate]
  );

  // ─── View transitions ──────────────────────────────────────────────────────

  function handleViewChange(next: CalendarViewMode): void {
    if (next === viewMode) return;
    if (next === 'week') {
      setOriginColIndex(getColIndex(selectedDate));
      setWeekAnimState('enter');
      setViewMode(next);
      window.setTimeout(() => setWeekAnimState('idle'), 350);
    } else if (viewMode === 'week' && next !== 'week') {
      setOriginColIndex(getColIndex(selectedDate));
      setWeekAnimState('exit');
      window.setTimeout(() => { setViewMode(next); setWeekAnimState('idle'); }, 350);
    } else {
      setViewMode(next);
    }
  }

  // ─── Month navigation ──────────────────────────────────────────────────────

  function navigateMonth(dir: SlideDir): void {
    const delta = dir === 'left' ? 1 : -1;
    const next  = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + delta, 1);

    const exitMonthKey = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}`;
    setMonthExitKey(exitMonthKey);
    setMonthExitDir(dir);
    setMonthSlideDir(dir);
    setSelectedDate(next);
    setDisplayedMonth(next);
    prevMonthKeyRef.current = exitMonthKey;
    window.setTimeout(() => setMonthExitKey(null), 320);
  }

  // ─── Day navigation ────────────────────────────────────────────────────────

  function handlePrev(): void {
    if (viewMode === 'week') {
      const prev = new Date(selectedDate);
      prev.setDate(prev.getDate() - 7);
      setSelectedDate(prev);
    } else if (viewMode === 'month') {
      navigateMonth('right');
    } else {
      const prev = new Date(selectedDate);
      prev.setDate(prev.getDate() - 1);
      navigate('right', prev);
    }
  }

  function handleNext(): void {
    if (viewMode === 'week') {
      const next = new Date(selectedDate);
      next.setDate(next.getDate() + 7);
      setSelectedDate(next);
    } else if (viewMode === 'month') {
      navigateMonth('left');
    } else {
      const next = new Date(selectedDate);
      next.setDate(next.getDate() + 1);
      navigate('left', next);
    }
  }

  function navigate(dir: SlideDir, next: Date): void {
    const currentKey = prevKeyRef.current;
    setExitKey(currentKey);
    setExitDir(dir);
    setSlideDir(dir);
    setSelectedDate(next);
    prevKeyRef.current = toDateKey(next);
    window.setTimeout(() => setExitKey(null), 320);
  }

  function handleSelectDay(day: CalendarDay): void {
    if (viewMode === 'month') {
      setSelectedDate(day.date);
    } else {
      const dir: SlideDir = day.date > selectedDate ? 'left' : 'right';
      navigate(dir, day.date);
    }
  }

  function handleMoreClick(): void {
    const rect = moreBtnRef.current?.getBoundingClientRect() ?? null;
    setMoreAnchor(rect);
    setMoreOpen((o) => !o);
  }

  // ─── Header label ──────────────────────────────────────────────────────────

  function getHeading(): string {
    if (viewMode === 'week')  return getWeekHeading(selectedDate);
    if (viewMode === 'month') return getMonthLabel(visibleMonth);
    return getDayHeading(selectedDate);
  }

  const dateKey      = toDateKey(selectedDate);
  const isWeekView   = viewMode === 'week';
  const isDayView    = viewMode === 'day';
  const isMonthView  = viewMode === 'month';
  const monthKey     = `${visibleMonth.getFullYear()}-${visibleMonth.getMonth()}`;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="calendar-appShell">
      <div className="calendar-appShell__frame">
        <div className="calendar-appShell__content">

          {/* ─── Left rail ─── */}
          <div className="calendar-appShell__railWrap">
            <Panel>
              {isMonthView ? (
                // Month view: show day canvas for selected date
                <div className="calendar-appShell__railInner calendar-appShell__railInner--dayPanel">
                  <div className="calendar-month__railDayHeading">
                    <div className="calendar-month__railDayTitle">
                      {getDayHeading(selectedDate)}
                    </div>
                    <div className="calendar-month__railDaySubtitle">
                      {getDaySubheading(selectedDate)}
                    </div>
                  </div>
                  <CalendarDayCanvas
                    selectedDate={selectedDate}
                    events={events}
                    variant="day"
                  />
                </div>
              ) : (
                // Day / week view: normal mini-calendar rail
                <div className="calendar-appShell__railInner">
                  <CalendarMonthRail
                    visibleMonth={visibleMonth}
                    selectedDate={selectedDate}
                    dayMetaMap={demoDayMeta}
                    onSelectDay={handleSelectDay}
                  />
                </div>
              )}
            </Panel>
          </div>

          {/* ─── Main canvas ─── */}
          <div className="calendar-appShell__mainWrap">
            <Panel>
              <div className="calendar-appShell__mainInner">

                {/* Single shared header */}
                <div className="calendar-day__headingWrap">
                  <div className="calendar-day__headingLeft">
                    <div className="calendar-day__heading">{getHeading()}</div>
                    {isDayView && (
                      <div className="calendar-day__subheading">
                        {getDaySubheading(selectedDate)}
                      </div>
                    )}
                  </div>
                  <div className="calendar-day__headingActions">
                    <Button onClick={handlePrev}>‹</Button>
                    <Button onClick={handleNext}>›</Button>
                    <Button variant="affirmative" onClick={() => {}}>+ New event</Button>
                    <div ref={moreBtnRef}>
                      <Button onClick={handleMoreClick}>···</Button>
                    </div>
                    <PopupPanel
                      isOpen={moreOpen}
                      onClose={() => setMoreOpen(false)}
                      anchorRect={moreAnchor}
                      actions={MORE_ACTIONS}
                    />
                  </div>
                </div>

                {/* Canvas area */}
                {isDayView && (
                  <div className="calendar-day__slideViewport">
                    {exitKey && exitKey !== dateKey && (
                      <div
                        key={`exit-${exitKey}`}
                        className={`calendar-day__slidePane calendar-day__slidePane--exit-${
                          exitDir === 'left' ? 'left' : 'right'
                        }`}
                      >
                        <div className="calendar-day__slideGhost" />
                      </div>
                    )}
                    <div
                      key={dateKey}
                      className={`calendar-day__slidePane calendar-day__slidePane--enter-${
                        slideDir === 'left' ? 'left' : 'right'
                      }`}
                    >
                      <CalendarDayCanvas
                        selectedDate={selectedDate}
                        events={events}
                        variant="day"
                      />
                    </div>
                  </div>
                )}

                {isWeekView && (
                  <CalendarWeekCanvas
                    selectedDate={selectedDate}
                    originColIndex={originColIndex}
                    animState={weekAnimState}
                  />
                )}

                {isMonthView && (
                  <div className="calendar-month__slideViewport">
                    {/* Exiting month grid */}
                    {monthExitKey && monthExitKey !== monthKey && (
                      <div
                        key={`exit-${monthExitKey}`}
                        className={`calendar-month__slidePane calendar-month__slidePane--exit-${
                          monthExitDir === 'left' ? 'left' : 'right'
                        }`}
                      >
                        <div className="calendar-month__slideGhost" />
                      </div>
                    )}
                    {/* Entering month grid */}
                    <div
                      key={monthKey}
                      className={`calendar-month__slidePane calendar-month__slidePane--enter-${
                        monthSlideDir === 'left' ? 'left' : 'right'
                      }`}
                    >
                      <CalendarMonthCanvas
                        visibleMonth={visibleMonth}
                        selectedDate={selectedDate}
                        dayMetaMap={demoDayMeta}
                        onSelectDay={handleSelectDay}
                        slideDir={monthSlideDir}
                      />
                    </div>
                  </div>
                )}

                <CalendarViewSwitcher value={viewMode} onChange={handleViewChange} />
              </div>
            </Panel>
          </div>

        </div>
      </div>
    </div>
  );
}
