import React, { useLayoutEffect, useEffect, useMemo, useRef, useState, type JSX } from 'react';
import { NubbinDivider, Button, PopupPanel } from 'remochi';
import {
  getDayHeading,
  getDaySubheading,
  getEventHeight,
  getEventTop,
  getEventTopCompact,
  getEventHeightCompact,
  getHours,
  formatHour,
  isSameDay as utilIsSameDay,
  type CalendarEvent
} from './calendarMonthUtils';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DayCanvasVariant = 'day' | 'week-col';

interface DayCanvasHeadingProps {
  /** Primary large heading text */
  heading: string;
  /** Secondary italic subheading text */
  subheading?: string;
  /** Action buttons rendered in the top-right (day view only) */
  actions?: React.ReactNode;
}

interface CalendarDayCanvasProps {
  selectedDate: Date;
  events: CalendarEvent[];
  /** Controls full day-view vs compact week column rendering. Default: 'day' */
  variant?: DayCanvasVariant;
  /** Override the heading block entirely. If omitted, defaults are derived from selectedDate. */
  headingProps?: DayCanvasHeadingProps;
  onPrevDay?: () => void;
  onNextDay?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getEventClassName(color: CalendarEvent['color']): string {
  if (color === 'blue') return 'calendar-day__event calendar-day__event--blue';
  if (color === 'yellow') return 'calendar-day__event calendar-day__event--yellow';
  return 'calendar-day__event calendar-day__event--red';
}

function getCurrentTimeTop(hours: number[], rowHeight: number): number {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const firstHour = hours[0];
  return ((currentHour - firstHour) + currentMinute / 60) * rowHeight;
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function CalendarDayCanvas({
  selectedDate,
  events,
  variant = 'day',
  headingProps,
  onPrevDay,
  onNextDay
}: CalendarDayCanvasProps): JSX.Element {
  const isWeekCol = variant === 'week-col';
  const rowHeight = isWeekCol ? 40 : 88;

  const hours = useMemo(() => getHours(), []);
  const timelineHeight = hours.length * rowHeight;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [timeTop, setTimeTop] = useState(() => getCurrentTimeTop(hours, rowHeight));
  const [moreOpen, setMoreOpen] = useState(false);
  const moreBtnRef = useRef<HTMLDivElement>(null);
  const [moreAnchor, setMoreAnchor] = useState<DOMRect | null>(null);

  const shouldShowNowBar = utilIsSameDay(selectedDate, new Date());

  // Resolve heading
  const heading = headingProps?.heading ?? getDayHeading(selectedDate);
  const subheading = headingProps?.subheading ?? getDaySubheading(selectedDate);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const applyScroll = () => {
      if (!shouldShowNowBar) {
        scroller.scrollTop = 0;
        return;
      }
      const firstHour = hours[0];
      const currentHour = new Date().getHours();
      const targetHour = Math.max(firstHour, currentHour - 1);
      const targetTop = (targetHour - firstHour) * rowHeight;
      const maxScrollTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
      scroller.scrollTop = Math.min(targetTop, maxScrollTop);
    };

    const id = window.requestAnimationFrame(applyScroll);
    return () => window.cancelAnimationFrame(id);
  }, [selectedDate, shouldShowNowBar, hours, rowHeight]);

  useEffect(() => {
    if (!shouldShowNowBar) return;
    const tick = () => setTimeTop(getCurrentTimeTop(hours, rowHeight));
    tick();
    const intervalId = window.setInterval(tick, 60_000);
    return () => window.clearInterval(intervalId);
  }, [shouldShowNowBar, hours, rowHeight]);

  function handleMoreClick(): void {
    const rect = moreBtnRef.current?.getBoundingClientRect() ?? null;
    setMoreAnchor(rect);
    setMoreOpen((o) => !o);
  }

  // ─── Heading block ────────────────────────────────────────────────────────

  const headingBlock = isWeekCol ? (
    // Week column: compact day label only
    <div className="calendar-day__headingWrap calendar-day__headingWrap--weekCol">
      <div className="calendar-day__heading calendar-day__heading--weekCol">
        {heading}
      </div>
    </div>
  ) : (
    // Day view: full heading + action buttons
    <div className="calendar-day__headingWrap">
      <div className="calendar-day__headingLeft">
        <div className="calendar-day__heading">{heading}</div>
        <div className="calendar-day__subheading">{subheading}</div>
      </div>

      <div className="calendar-day__headingActions">
        {headingProps?.actions ?? (
          <>
            <Button onClick={onPrevDay}>‹</Button>
          <Button onClick={onNextDay}>›</Button>
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
          </>
        )}
      </div>
    </div>
  );

  // ─── Timeline ─────────────────────────────────────────────────────────────

  const timeline = (
    <div
      className={isWeekCol ? 'calendar-day calendar-day--weekCol' : 'calendar-day'}
      ref={scrollerRef}
    >
      <div className="calendar-day__timelineShell">
        <div className="calendar-day__timelineScroller">
          <div
            className={isWeekCol ? 'calendar-day__timeline calendar-day__timeline--weekCol' : 'calendar-day__timeline'}
            style={{ minHeight: `${timelineHeight}px` }}
          >
            {hours.map((hour) => (
              <div
                key={hour}
                className="calendar-day__row"
                style={isWeekCol ? { height: `${rowHeight}px` } : undefined}
              >
                {!isWeekCol && (
                  <div className="calendar-day__timeLabel">{formatHour(hour)}</div>
                )}
                <div className="calendar-day__rowLine" />
              </div>
            ))}

            {shouldShowNowBar && (
              <div className="calendar-day__nowBar" style={{ top: `${timeTop}px` }}>
                <NubbinDivider side="bottom" />
              </div>
            )}

            <div className={isWeekCol ? 'calendar-day__eventsLayer calendar-day__eventsLayer--weekCol' : 'calendar-day__eventsLayer'}>
              {events.map((event, index) => {
                const top = isWeekCol
                  ? getEventTopCompact(hours[0], event.startHour, rowHeight)
                  : getEventTop(hours[0], event.startHour);
                const height = isWeekCol
                  ? getEventHeightCompact(event.startHour, event.endHour, rowHeight)
                  : getEventHeight(event.startHour, event.endHour);
                const leftOffset = (!isWeekCol && index === 2) ? 58 : 0;
                const widthAdjust = (!isWeekCol && index === 2) ? 48 : 0;

                return (
                  <div
                    key={event.id}
                    className={getEventClassName(event.color)}
                    style={{
                      top: `${top}px`,
                      height: `${height}px`,
                      left: `${leftOffset}px`,
                      width: `calc(100% - ${leftOffset + widthAdjust}px)`
                    }}
                  >
                    <div className={isWeekCol ? 'calendar-day__eventTitle calendar-day__eventTitle--weekCol' : 'calendar-day__eventTitle'}>
                      {event.title}
                    </div>
                    {!isWeekCol && event.subtitle && (
                      <div className="calendar-day__eventSubtitle">{event.subtitle}</div>
                    )}
                    {!isWeekCol && event.location && (
                      <div className="calendar-day__eventLocation">Location: {event.location}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {headingBlock}
      {timeline}
    </>
  );
}
