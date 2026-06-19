import React, { type JSX } from 'react';
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

export default function CalendarDayCanvas({
  selectedDate,
  events
}: CalendarDayCanvasProps): JSX.Element {
  const hours = getHours();
  const rowHeight = 88;
  const timelineHeight = hours.length * rowHeight;

  return (
    <div className="calendar-day">
      <div className="calendar-day__headingWrap">
        <div className="calendar-day__heading">{getDayHeading(selectedDate)}</div>
        <div className="calendar-day__subheading">{getDaySubheading(selectedDate)}</div>
      </div>

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
  );
}