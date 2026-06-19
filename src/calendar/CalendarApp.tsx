import React, { useMemo, useRef, useState, useEffect, type JSX } from 'react';
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

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

const TODAY = new Date();

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

// ─── Rail day-panel slide state ────────────────────────────────────────────
// Mirrors the main day-view slide logic but lives inside the left rail.

function useDaySlide(selectedDate: Date) {
  const prevKeyRef  = useRef<string>(toDateKey(selectedDate));
  const [exitKey,  setExitKey]  = useState<string | null>(null);
  const [exitDir,  setExitDir]  = useState<SlideDir>('left');
  const [enterDir, setEnterDir] = useState<SlideDir>('left');

  function slide(next: Date) {
    const dir: SlideDir = next > selectedDate ? 'left' : 'right';
    setExitKey(prevKeyRef.current);
    setExitDir(dir);
    setEnterDir(dir);
    prevKeyRef.current = toDateKey(next);
    window.setTimeout(() => setExitKey(null), 320);
  }

  return { exitKey, exitDir, enterDir, slide };
}

export default function CalendarApp(): JSX.Element {
  const [selectedDate, setSelectedDate]     = useState<Date>(new Date(2026, 5, 19));
  const [viewMode, setViewMode]             = useState<CalendarViewMode>('day');
  const [slideDir, setSlideDir]             = useState<SlideDir>('left');
  const [weekAnimState, setWeekAnimState]   = useState<WeekAnimState>('idle');
  const [originColIndex, setOriginColIndex] = useState<number>(0);
  const [moreOpen, setMoreOpen]             = useState(false);
  const moreBtnRef                          = useRef<HTMLDivElement>(null);
  const [moreAnchor, setMoreAnchor]         = useState<DOMRect | null>(null);

  // ─── Main day-view slide ──────────────────────────────────────────────────
  const prevKeyRef = useRef<string>(toDateKey(new Date(2026, 5, 19)));
  const [exitKey, setExitKey] = useState<string | null>(null);
  const [exitDir, setExitDir] = useState<SlideDir>('left');

  // ─── Month-view slide ─────────────────────────────────────────────────────
  const prevMonthKeyRef = useRef<string>('');
  const [monthSlideDir, setMonthSlideDir]   = useState<SlideDir | null>(null);
  const [monthExitKey, setMonthExitKey]     = useState<string | null>(null);
  const [monthExitDir, setMonthExitDir]     = useState<SlideDir>('left');
  const [displayedMonth, setDisplayedMonth] = useState<Date>(new Date(2026, 5, 1));

  // ─── Rail panel crossfade state ───────────────────────────────────────────
  // We track the "committed" rail mode with a short lag so both panels
  // overlap during the crossfade.
  const [railMode, setRailMode]           = useState<'mini' | 'day'>(viewMode === 'month' ? 'day' : 'mini');
  const [railCrossfading, setRailCrossfading] = useState(false);
  const [railCrossfadeDir, setRailCrossfadeDir] = useState<'to-day' | 'to-mini'>('to-day');

  // ─── Rail day-panel slide ─────────────────────────────────────────────────
  const railPrevKeyRef   = useRef<string>(toDateKey(selectedDate));
  const [railExitKey,   setRailExitKey]  = useState<string | null>(null);
  const [railExitDir,   setRailExitDir]  = useState<SlideDir>('left');
  const [railEnterDir,  setRailEnterDir] = useState<SlideDir>('left');

  function slideRailDay(next: Date, current: Date) {
    const dir: SlideDir = next > current ? 'left' : 'right';
    setRailExitKey(railPrevKeyRef.current);
    setRailExitDir(dir);
    setRailEnterDir(dir);
    railPrevKeyRef.current = toDateKey(next);
    window.setTimeout(() => setRailExitKey(null), 320);
  }

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

    const toMonth = next === 'month';
    const fromMonth = viewMode === 'month';

    // Crossfade rail whenever we cross the month/non-month boundary
    if (toMonth !== fromMonth) {
      const dir: 'to-day' | 'to-mini' = toMonth ? 'to-day' : 'to-mini';
      setRailCrossfadeDir(dir);
      setRailCrossfading(true);
      window.setTimeout(() => {
        setRailMode(toMonth ? 'day' : 'mini');
        setRailCrossfading(false);
      }, 280);
    }

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

  function handleToday(): void {
    const today = new Date();
    if (viewMode === 'month') {
      const dir: SlideDir = today < selectedDate ? 'right' : 'left';
      const sameMonth =
        today.getFullYear() === selectedDate.getFullYear() &&
        today.getMonth() === selectedDate.getMonth();
      if (!sameMonth) {
        const exitMonthKey = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}`;
        setMonthExitKey(exitMonthKey);
        setMonthExitDir(dir);
        setMonthSlideDir(dir);
        window.setTimeout(() => setMonthExitKey(null), 320);
      }
      setSelectedDate(today);
      setDisplayedMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    } else if (viewMode === 'week') {
      setSelectedDate(today);
    } else {
      navigate(today < selectedDate ? 'right' : 'left', today);
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
      const dir: SlideDir = day.date > selectedDate ? 'left' : 'right';
      slideRailDay(day.date, selectedDate);
      setSelectedDate(day.date);
    } else {
      const dir: SlideDir = day.date > selectedDate ? 'left' : 'right';
      navigate(dir, day.date);
    }
  }

  // ─── Rail navigation (used inside rail controls) ───────────────────────────

  function handleRailPrev(): void {
    if (railMode === 'day') {
      // navigate selected day backward
      const prev = new Date(selectedDate);
      prev.setDate(prev.getDate() - 1);
      slideRailDay(prev, selectedDate);
      setSelectedDate(prev);
    } else {
      // navigate mini-month rail backward
      navigateMonth('right');
    }
  }

  function handleRailNext(): void {
    if (railMode === 'day') {
      const next = new Date(selectedDate);
      next.setDate(next.getDate() + 1);
      slideRailDay(next, selectedDate);
      setSelectedDate(next);
    } else {
      navigateMonth('left');
    }
  }

  function handleRailToday(): void {
    const today = new Date();
    if (railMode === 'day') {
      if (!isSameDay(today, selectedDate)) {
        const dir: SlideDir = today > selectedDate ? 'left' : 'right';
        slideRailDay(today, selectedDate);
        setSelectedDate(today);
      }
    } else {
      // jump mini-month to today's month
      const sameMonth =
        today.getFullYear() === selectedDate.getFullYear() &&
        today.getMonth() === selectedDate.getMonth();
      if (!sameMonth) {
        const dir: SlideDir = today > selectedDate ? 'left' : 'right';
        navigateMonth(dir);
      }
      setSelectedDate(today);
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

  const dateKey     = toDateKey(selectedDate);
  const isWeekView  = viewMode === 'week';
  const isDayView   = viewMode === 'day';
  const isMonthView = viewMode === 'month';
  const monthKey    = `${visibleMonth.getFullYear()}-${visibleMonth.getMonth()}`;

  const isAtToday = isSameDay(selectedDate, TODAY);

  // ─── Rail label ────────────────────────────────────────────────────────────
  function getRailLabel(): string {
    if (railMode === 'day') {
      return `${getDayHeading(selectedDate)} — ${getDaySubheading(selectedDate)}`;
    }
    return getMonthLabel(visibleMonth);
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="calendar-appShell">
      <div className="calendar-appShell__frame">
        <div className="calendar-appShell__content">

          {/* ─── Left rail ─── */}
          <div className="calendar-appShell__railWrap">
            <Panel>
              <div className={`calendar-appShell__railInner${
                railMode === 'day' ? ' calendar-appShell__railInner--dayPanel' : ''
              }`}>

                {/* Rail nav bar */}
                <div className="calendar-rail__navBar">
                  <button
                    type="button"
                    className="calendar-rail__navBtn"
                    onClick={handleRailPrev}
                    aria-label="Previous"
                  >‹</button>
                  <button
                    type="button"
                    className={`calendar-rail__todayBtn${
                      isAtToday && railMode === 'day' ? ' calendar-rail__todayBtn--active' : ''
                    }`}
                    onClick={handleRailToday}
                  >Today</button>
                  <button
                    type="button"
                    className="calendar-rail__navBtn"
                    onClick={handleRailNext}
                    aria-label="Next"
                  >›</button>
                </div>

                {/* Crossfade wrapper */}
                <div className={`calendar-rail__crossfadeWrap${
                  railCrossfading ? ` calendar-rail__crossfadeWrap--fading-${railCrossfadeDir}` : ''
                }`}>

                  {railMode === 'day' ? (
                    /* Day panel — slide viewport */
                    <div className="calendar-rail__dayViewport">
                      {railExitKey && railExitKey !== dateKey && (
                        <div
                          key={`exit-${railExitKey}`}
                          className={`calendar-rail__dayPane calendar-rail__dayPane--exit-${railExitDir}`}
                          aria-hidden="true"
                        >
                          {/* ghost — the exiting day just slides away empty */}
                        </div>
                      )}
                      <div
                        key={dateKey}
                        className={`calendar-rail__dayPane calendar-rail__dayPane--enter-${railEnterDir}`}
                      >
                        <CalendarDayCanvas
                          selectedDate={selectedDate}
                          events={events}
                          variant="day"
                        />
                      </div>
                    </div>
                  ) : (
                    /* Mini-month rail */
                    <CalendarMonthRail
                      visibleMonth={visibleMonth}
                      selectedDate={selectedDate}
                      dayMetaMap={demoDayMeta}
                      onSelectDay={handleSelectDay}
                    />
                  )}

                </div>

              </div>
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
                    <Button onClick={handleToday}>Today</Button>
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
