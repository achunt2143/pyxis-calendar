import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type JSX
} from 'react';
import { NubbinDivider } from 'remochi';
import {
  getDayHeading,
  getDaySubheading,
  getEventHeight,
  getEventTop,
  getHours,
  formatHour,
  type CalendarEvent
} from './calendarMonthUtils';

interface CalendarDayCanvasProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onPrevDay: () => void;
  onNextDay: () => void;
}

function getEventClassName(color: CalendarEvent['color']): string {
  if (color === 'blue') return 'calendar-day__event calendar-day__event--blue';
  if (color === 'yellow') return 'calendar-day__event calendar-day__event--yellow';
  return 'calendar-day__event calendar-day__event--red';
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getCurrentTimeTop(hours: number[], rowHeight: number): number {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const firstHour = hours[0];
  return ((currentHour - firstHour) + currentMinute / 60) * rowHeight;
}

const MORE_ITEMS = [
  { id: 'settings',        label: 'Settings' },
  { id: 'connectors',      label: 'Connectors' },
  { id: 'notifications',   label: 'Notifications' },
  { id: 'import',          label: 'Import events' },
  { id: 'export',          label: 'Export events' },
  { id: 'sharing',         label: 'Sharing & permissions' },
  { id: 'keyboard',        label: 'Keyboard shortcuts' },
  { id: 'about',           label: 'About' },
] as const;

export default function CalendarDayCanvas({
  selectedDate,
  events,
  onPrevDay,
  onNextDay
}: CalendarDayCanvasProps): JSX.Element {
  const hours = useMemo(() => getHours(), []);
  const rowHeight = 88;
  const timelineHeight = hours.length * rowHeight;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [timeTop, setTimeTop] = useState(() => getCurrentTimeTop(hours, rowHeight));
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const shouldShowNowBar = isSameDay(selectedDate, today);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
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
  }, [selectedDate, hours]);

  useEffect(() => {
    if (!shouldShowNowBar) return;

    const tick = () => {
      setTimeTop(getCurrentTimeTop(hours, rowHeight));
    };

    tick();

    const intervalId = window.setInterval(tick, 60_000);
    return () => window.clearInterval(intervalId);
  }, [shouldShowNowBar, hours]);

  // Close the More dropdown when clicking outside
  useEffect(() => {
    if (!moreOpen) return;
    function handleOutside(e: MouseEvent): void {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [moreOpen]);

  return (
    <>
      {/* Header row */}
      <div className="calendar-day__header">
        <div className="calendar-day__headingWrap">
          <div className="calendar-day__heading">{getDayHeading(selectedDate)}</div>
          <div className="calendar-day__subheading">{getDaySubheading(selectedDate)}</div>
        </div>

        <div className="calendar-day__headerActions">
          {/* Prev / Next day */}
          <div className="calendar-day__navGroup">
            <button
              className="calendar-day__navBtn"
              aria-label="Previous day"
              onClick={onPrevDay}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              className="calendar-day__navBtn"
              aria-label="Next day"
              onClick={onNextDay}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* New Event */}
          <button className="calendar-day__newEventBtn" aria-label="New event">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            New event
          </button>

          {/* More dropdown */}
          <div className="calendar-day__moreWrap" ref={moreRef}>
            <button
              className="calendar-day__moreBtn"
              aria-label="More options"
              aria-haspopup="menu"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen((o) => !o)}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <circle cx="9" cy="4" r="1.4" fill="currentColor" />
                <circle cx="9" cy="9" r="1.4" fill="currentColor" />
                <circle cx="9" cy="14" r="1.4" fill="currentColor" />
              </svg>
            </button>

            {moreOpen ? (
              <div className="calendar-day__moreDropdown" role="menu">
                {MORE_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    role="menuitem"
                    className="calendar-day__moreItem"
                    onClick={() => setMoreOpen(false)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="calendar-day" ref={scrollerRef}>
        <div className="calendar-day__timelineShell">
          <div className="calendar-day__timelineScroller">
            <div
              className="calendar-day__timeline"
              style={{ minHeight: `${timelineHeight}px` }}
            >
              {hours.map((hour) => (
                <div key={hour} className="calendar-day__row">
                  <div className="calendar-day__timeLabel">{formatHour(hour)}</div>
                  <div className="calendar-day__rowLine" />
                </div>
              ))}

              {shouldShowNowBar ? (
                <div
                  className="calendar-day__nowBar"
                  style={{ top: `${timeTop}px` }}
                >
                  <NubbinDivider side="bottom" />
                </div>
              ) : null}

              <div className="calendar-day__eventsLayer">
                {events.map((event, index) => {
                  const top = getEventTop(hours[0], event.startHour);
                  const height = getEventHeight(event.startHour, event.endHour);
                  const leftOffset = index === 2 ? 58 : 0;
                  const widthAdjust = index === 2 ? 48 : 0;

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
                      <div className="calendar-day__eventTitle">{event.title}</div>
                      {event.subtitle ? (
                        <div className="calendar-day__eventSubtitle">{event.subtitle}</div>
                      ) : null}
                      {event.location ? (
                        <div className="calendar-day__eventLocation">
                          Location: {event.location}
                        </div>
                      ) : null}
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
