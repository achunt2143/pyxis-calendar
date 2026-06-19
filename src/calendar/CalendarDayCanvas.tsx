import React, { useLayoutEffect, useEffect, useMemo, useRef, useState, type JSX } from 'react';
import { NubbinDivider, Button, PopupPanel } from 'remochi';
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
  const moreBtnRef = useRef<HTMLDivElement>(null);
  const [moreAnchor, setMoreAnchor] = useState<DOMRect | null>(null);

  const shouldShowNowBar = isSameDay(selectedDate, new Date());

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
  }, [selectedDate, shouldShowNowBar, hours]);

  useEffect(() => {
    if (!shouldShowNowBar) return;

    const tick = () => setTimeTop(getCurrentTimeTop(hours, rowHeight));
    tick();

    const intervalId = window.setInterval(tick, 60_000);
    return () => window.clearInterval(intervalId);
  }, [shouldShowNowBar, hours]);

  function handleMoreClick(): void {
    const rect = moreBtnRef.current?.getBoundingClientRect() ?? null;
    setMoreAnchor(rect);
    setMoreOpen((o) => !o);
  }

  return (
    <>
      <div className="calendar-day__headingWrap">
        <div className="calendar-day__headingLeft">
          <div className="calendar-day__heading">{getDayHeading(selectedDate)}</div>
          <div className="calendar-day__subheading">{getDaySubheading(selectedDate)}</div>
        </div>

        <div className="calendar-day__headingActions">
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
        </div>
      </div>

      <div className="calendar-day" ref={scrollerRef}>
        <div className="calendar-day__timelineShell">
          <div className="calendar-day__timelineScroller">
            <div className="calendar-day__timeline" style={{ minHeight: `${timelineHeight}px` }}>
              {hours.map((hour) => (
                <div key={hour} className="calendar-day__row">
                  <div className="calendar-day__timeLabel">{formatHour(hour)}</div>
                  <div className="calendar-day__rowLine" />
                </div>
              ))}

              {shouldShowNowBar ? (
                <div className="calendar-day__nowBar" style={{ top: `${timeTop}px` }}>
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
