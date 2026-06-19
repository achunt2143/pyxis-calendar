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

export default function CalendarDayCanvas({
  selectedDate,
  events
}: CalendarDayCanvasProps): JSX.Element {
  const hours = useMemo(() => getHours(), []);
  const rowHeight = 88;
  const timelineHeight = hours.length * rowHeight;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [timeTop, setTimeTop] = useState(() => getCurrentTimeTop(hours, rowHeight));

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

  return (
    <>
      <div className="calendar-day__headingWrap">
        <div className="calendar-day__heading">{getDayHeading(selectedDate)}</div>
        <div className="calendar-day__subheading">{getDaySubheading(selectedDate)}</div>
      </div>

      <div className="calendar-day">
        <div className="calendar-day__timelineShell">
          <div className="calendar-day__timelineScroller" ref={scrollerRef}>
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
                  <NubbinDivider
                    side="bottom"
                  />
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