import React, { type JSX } from 'react';
import { Button } from 'remochi';

export type CalendarViewMode = 'day' | 'week' | 'month' | 'year';

interface CalendarViewSwitcherProps {
  value: CalendarViewMode;
  onChange: (next: CalendarViewMode) => void;
}

const ITEMS: CalendarViewMode[] = ['day', 'week', 'month', 'year'];

export default function CalendarViewSwitcher({ value, onChange }: CalendarViewSwitcherProps): JSX.Element {
  return (
    <div className="calendar-switcher">
      {ITEMS.map((item) => (
        <div key={item} className="calendar-switcher__itemWrap">
          <Button
            variant={value === item ? 'blue' : 'normal'}
            onClick={() => onChange(item)}
            // disabled={item !== 'day'}
          >
            {value === item ? `${item.charAt(0).toUpperCase() + item.slice(1)}` : item.charAt(0).toUpperCase() + item.slice(1)}
          </Button>
        </div>
      ))}
    </div>
  );
}
