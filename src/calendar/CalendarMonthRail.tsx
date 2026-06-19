import React, { type JSX } from 'react';
import { Divider } from 'remochi';
import {
  buildMiniMonthGrid,
  type CalendarDay,
  type CalendarDayMetadata,
  getMonthLabel
} from './calendarMonthUtils';

const WEEKDAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THR', 'FRI', 'SAT'];

interface MiniMonthProps {
  viewDate: Date;
  selectedDate: Date;
  dayMetaMap: Record<string, CalendarDayMetadata>;
  onSelectDay: (day: CalendarDay) => void;
}

function MiniMonth({
  viewDate,
  selectedDate,
  dayMetaMap,
  onSelectDay
}: MiniMonthProps): JSX.Element {
  const days = buildMiniMonthGrid(viewDate, selectedDate, dayMetaMap);

  return (
    <div className="calendar-rail__monthBlock">
      <div className="calendar-rail__monthLabel">{getMonthLabel(viewDate)}</div>

      <div className="calendar-rail__weekdayRow">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="calendar-rail__weekday">
            {label}
          </div>
        ))}
      </div>

      <div className="calendar-rail__grid">
        {days.map((day) => {
          if (!day.inMonth) {
            return <div key={day.key} className="calendar-rail__emptyCell" aria-hidden="true" />;
          }

          const className = [
            'calendar-rail__dayButton',
            day.isSelected ? 'calendar-rail__dayButton--selected' : '',
            day.isToday && !day.isSelected ? 'calendar-rail__dayButton--today' : '',
            day.hasEvents ? 'calendar-rail__dayButton--hasEvents' : '',
            day.isDisabled ? 'calendar-rail__dayButton--disabled' : ''
          ]
            .filter(Boolean)
            .join(' ');

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

export interface CalendarMonthRailProps {
  visibleMonth: Date;
  selectedDate: Date;
  dayMetaMap: Record<string, CalendarDayMetadata>;
  onSelectDay: (day: CalendarDay) => void;
}

export default function CalendarMonthRail({
  visibleMonth,
  selectedDate,
  dayMetaMap,
  onSelectDay
}: CalendarMonthRailProps): JSX.Element {
  const nextMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);

  return (
    <div className="calendar-rail">
      <MiniMonth
        viewDate={visibleMonth}
        selectedDate={selectedDate}
        dayMetaMap={dayMetaMap}
        onSelectDay={onSelectDay}
      />

      <div className="calendar-rail__dividerWrap">
        <Divider />
      </div>

      <MiniMonth
        viewDate={nextMonth}
        selectedDate={selectedDate}
        dayMetaMap={dayMetaMap}
        onSelectDay={onSelectDay}
      />

      <div className="calendar-rail__footer">
        <button type="button" className="calendar-rail__newEvent">
          ( New Event )
        </button>
      </div>
    </div>
  );
}