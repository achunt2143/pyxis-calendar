import React, { useRef, useState, useEffect, useCallback, type JSX } from 'react';
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
          const cls = [
            'calendar-rail__dayButton',
            day.isSelected                 ? 'calendar-rail__dayButton--selected'  : '',
            day.isToday && !day.isSelected ? 'calendar-rail__dayButton--today'     : '',
            day.hasEvents                  ? 'calendar-rail__dayButton--hasEvents' : '',
            day.isDisabled                 ? 'calendar-rail__dayButton--disabled'  : '',
          ].filter(Boolean).join(' ');
          return (
            <div key={day.key} className="calendar-rail__cellWrap">
              <button
                type="button"
                className={cls}
                onClick={() => onSelectDay(day)}
                disabled={day.isDisabled}
                aria-pressed={day.isSelected}
                aria-label={`${getMonthLabel(viewDate)} ${day.dayNumber}`}
              >
                <span className="calendar-rail__dayNumber">{day.dayNumber}</span>
                {day.hasEvents ? <span className="calendar-rail__eventDot" aria-hidden="true" /> : null}
                {day.isToday && !day.isSelected
                  ? <span className="calendar-rail__todayBar" aria-hidden="true" />
                  : null}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MiniMonthPair ─────────────────────────────────────────────────────────────
// One "slide" = two consecutive mini months + divider.

interface PairProps {
  first: Date;
  selectedDate: Date;
  dayMetaMap: Record<string, CalendarDayMetadata>;
  onSelectDay: (day: CalendarDay) => void;
}

function MiniMonthPair({ first, selectedDate, dayMetaMap, onSelectDay }: PairProps): JSX.Element {
  const second = new Date(first.getFullYear(), first.getMonth() + 1, 1);
  return (
    <>
      <MiniMonth viewDate={first}  selectedDate={selectedDate} dayMetaMap={dayMetaMap} onSelectDay={onSelectDay} />
      <div className="calendar-rail__dividerWrap"><Divider /></div>
      <MiniMonth viewDate={second} selectedDate={selectedDate} dayMetaMap={dayMetaMap} onSelectDay={onSelectDay} />
    </>
  );
}

// ─── Rail ─────────────────────────────────────────────────────────────────────

export interface CalendarMonthRailProps {
  visibleMonth: Date;
  selectedDate: Date;
  dayMetaMap: Record<string, CalendarDayMetadata>;
  onSelectDay: (day: CalendarDay) => void;
}

type SlideDir = 'left' | 'right';

function mkKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}`;
}

// We keep a small ring of slides: [prev, current, next].
// The track translates so the middle item is always in view.
// On a navigation, we shift the track one position and when the
// CSS transition ends we re-centre (instant, no visible jump).

const SLIDE_DURATION_MS = 320;

export default function CalendarMonthRail({
  visibleMonth,
  selectedDate,
  dayMetaMap,
  onSelectDay,
}: CalendarMonthRailProps): JSX.Element {
  // "committed" month — the one currently centred with no animation running
  const committedRef = useRef<Date>(visibleMonth);

  // Slides rendered in the track: [left-offscreen, visible, right-offscreen]
  // Each entry is the *first* month of a pair.
  const [slides, setSlides] = useState<[Date, Date, Date]>(() => [
    new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1),
    visibleMonth,
    new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1),
  ]);

  // offsetIndex: how many slots the track is shifted right of the centred position
  //   0  = centred   (translateX 0%   of one-third-width, i.e. translateX(-33.333%))
  //  -1  = shifted left one slot  (shows the right slide)
  //  +1  = shifted right one slot (shows the left slide)
  // We always render as translateX(calc(-33.333% + offsetIndex * -33.333%))
  // which simplifies to translateX(calc((-1 - offsetIndex) * 33.333%))
  const [offsetIndex, setOffsetIndex] = useState<0 | -1 | 1>(0);
  const [animating, setAnimating]     = useState(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerSlide = useCallback((dir: SlideDir, nextMonth: Date) => {
    if (animating) return;

    // Build new 3-slide ring centred on nextMonth
    const newSlides: [Date, Date, Date] = [
      new Date(nextMonth.getFullYear(), nextMonth.getMonth() - 1, 1),
      nextMonth,
      new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 1),
    ];

    // Position the track so the OLD month (committedRef) is still visible
    // before the transition starts, then we animate to centre.
    //
    // After the rebuild, committedRef lives at:
    //   dir=left  → old month is now in slot 0 (left), so we pre-offset to +1
    //               then animate back to 0
    //   dir=right → old month is now in slot 2 (right), so we pre-offset to -1
    //               then animate back to 0
    const preOffset: 1 | -1 = dir === 'left' ? 1 : -1;

    setSlides(newSlides);
    setOffsetIndex(preOffset);   // instant — place old month in view
    committedRef.current = nextMonth;
    setAnimating(true);

    // On the next frame, begin the CSS transition back to centre (offsetIndex 0)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setOffsetIndex(0);
      });
    });

    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => {
      setAnimating(false);
    }, SLIDE_DURATION_MS + 50);
  }, [animating]);

  // React to external visibleMonth changes (e.g. nav via main header)
  useEffect(() => {
    if (mkKey(visibleMonth) === mkKey(committedRef.current)) return;
    const goingForward =
      visibleMonth > committedRef.current;
    triggerSlide(goingForward ? 'left' : 'right', visibleMonth);
  }, [visibleMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track translateX: the track is 300% wide (3 panels × 100%).
  // Panel 0 starts at 0%, panel 1 at 100%, panel 2 at 200% of the *track*.
  // To show panel N we translate the track by -(N * 100% / 3) of the track,
  // which is -(N * 33.333%) of the track width.
  // Centre (panel 1) = -33.333%. Apply offsetIndex to shift:
  //   translateX(calc((-1 + offsetIndex) * -33.333%))
  //   = translateX(calc((1 - offsetIndex) * -33.333%))
  const translatePct = (-33.3333 * (1 - offsetIndex));
  const trackStyle: React.CSSProperties = {
    transform: `translateX(${translatePct.toFixed(4)}%)`,
    transition: animating && offsetIndex === 0
      ? `transform ${SLIDE_DURATION_MS}ms cubic-bezier(0.32, 0, 0.18, 1)`
      : 'none',
  };

  return (
    <div className="calendar-rail">
      <div className="calendar-rail__carousel">
        <div className="calendar-rail__carouselTrack" style={trackStyle}>
          {slides.map((month, i) => (
            <div
              key={`${mkKey(month)}-${i}`}
              className="calendar-rail__carouselSlide"
              aria-hidden={i !== 1 ? 'true' : undefined}
            >
              <MiniMonthPair
                first={month}
                selectedDate={selectedDate}
                dayMetaMap={dayMetaMap}
                onSelectDay={onSelectDay}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="calendar-rail__footer">
        <button type="button" className="calendar-rail__newEvent">( New Event )</button>
      </div>
    </div>
  );
}
