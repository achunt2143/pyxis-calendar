import React, { useLayoutEffect, useEffect, useMemo, useRef, useState, type JSX } from 'react';
import { NubbinDivider } from 'remochi';
import {
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

export interface DayCanvasHeadingProps {
  /** Primary large heading text */
  heading: string;
  /** Secondary italic subheading text */
  subheading?: string;
}

interface CalendarDayCanvasProps {
  selectedDate: Date;
  events: CalendarEvent[];
  /** Controls full day-view vs compact week column rendering. Default: 'day' */
  variant?: DayCanvasVariant;
  /**
   * In 'week-col' variant: supply heading to show the compact day label.
   * In 'day' variant: ignored — heading is owned by CalendarApp.
   */
  headingProps?: DayCanvasHeadingProps;
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function CalendarDayCanvas({
  selectedDate,
  events,
  variant = 'day',
  headingProps,
}: CalendarDayCanvasProps): JSX.Element {
  const isWeekCol = variant === 'week-col';
  const rowHeight = isWeekCol ? 40 : 88;

  const hours = useMemo(() => getHours(), []);
  const timelineHeight = hours.length * rowHeight;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [timeTop, setTimeTop] = useState(() => getCurrentTimeTop(hours, rowHeight));

  const shouldShowNowBar = utilIsSameDay(selectedDate, new Date());

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const applyScroll = () => {
      if (!shouldShowNowBar) { scroller.scrollTop = 0; return; }
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

  return (
    <>
      {/* Week-col compact day label only — day variant renders no heading here */}
      {isWeekCol && headingProps && (
        <div className="calendar-day__headingWrap calendar-day__headingWrap--weekCol">
          <div className="calendar-day__heading calendar-day__heading--weekCol">
            {headingProps.heading}
          </div>
        </div>
      )}

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
                  const top    = isWeekCol ? getEventTopCompact(hours[0], event.startHour, rowHeight)    : getEventTop(hours[0], event.startHour);
                  const height = isWeekCol ? getEventHeightCompact(event.startHour, event.endHour, rowHeight) : getEventHeight(event.startHour, event.endHour);
                  const leftOffset  = (!isWeekCol && index === 2) ? 58 : 0;
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
    </>
  );
}
