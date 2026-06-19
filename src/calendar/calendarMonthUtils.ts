export type BusyLevel = 'low' | 'medium' | 'high';

export interface CalendarDayMetadata {
  hasEvents?: boolean;
  eventCount?: number;
  busyLevel?: BusyLevel | null;
  isDisabled?: boolean;
}

export interface CalendarDay {
  key: string;
  date: Date;
  dayNumber: number;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
  hasEvents: boolean;
  eventCount: number;
  busyLevel: BusyLevel | null;
}

export interface CalendarEvent {
  id: string;
  title: string;
  subtitle?: string;
  location?: string;
  startHour: number;
  endHour: number;
  color: 'blue' | 'red' | 'yellow';
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getMonthLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export function getDayHeading(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: 'long' }).toUpperCase();
}

export function getDaySubheading(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

/** Returns the Sunday that starts the week containing `date`. */
export function getWeekStart(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - d.getDay());
  return d;
}

/** Returns all 7 days of the week containing `date`, starting Sunday. */
export function getWeekDays(date: Date): Date[] {
  const start = getWeekStart(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** "Week of June 15, 2026" */
export function getWeekHeading(date: Date): string {
  const start = getWeekStart(date);
  return 'Week of ' + start.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

/** Column heading inside the week grid: "Mon 15" */
export function getWeekColHeading(date: Date): string {
  const weekday = date.toLocaleDateString(undefined, { weekday: 'short' });
  return `${weekday} ${date.getDate()}`;
}

export function buildMonthGrid(viewDate: Date, selectedDate: Date, dayMetaMap: Record<string, CalendarDayMetadata> = {}): CalendarDay[] {
  const firstOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const firstGridDate = addDays(firstOfMonth, -firstOfMonth.getDay());
  const today = startOfDay(new Date());

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(firstGridDate, index);
    const key = toDateKey(date);
    const meta = dayMetaMap[key] ?? {};

    return {
      key,
      date,
      dayNumber: date.getDate(),
      inMonth: date.getMonth() === viewDate.getMonth(),
      isToday: isSameDay(date, today),
      isSelected: isSameDay(date, selectedDate),
      isDisabled: !!meta.isDisabled,
      hasEvents: !!meta.hasEvents,
      eventCount: meta.eventCount ?? 0,
      busyLevel: meta.busyLevel ?? null
    };
  });
}

export function buildMiniMonthGrid(viewDate: Date, selectedDate: Date, dayMetaMap: Record<string, CalendarDayMetadata> = {}): CalendarDay[] {
  return buildMonthGrid(viewDate, selectedDate, dayMetaMap);
}

export function getHours(): number[] {
  return Array.from({ length: 24 }, (_, i) => i + 1);
}

export function formatHour(hour: number): string {
  const suffix = hour >= 12 ? 'pm' : 'am';
  const normalized = hour % 12 === 0 ? 12 : hour % 12;
  return `${normalized} ${suffix}`;
}

export function getEventTop(hour: number, startHour: number): number {
  return (startHour - hour) * 88;
}

export function getEventHeight(startHour: number, endHour: number): number {
  return Math.max((endHour - startHour) * 88 - 8, 48);
}

// Week-view column uses a smaller row height
export function getEventTopCompact(hour: number, startHour: number, rowHeight: number): number {
  return (startHour - hour) * rowHeight;
}

export function getEventHeightCompact(startHour: number, endHour: number, rowHeight: number): number {
  return Math.max((endHour - startHour) * rowHeight - 4, 20);
}

export const demoDayMeta: Record<string, CalendarDayMetadata> = {
  '2026-06-17': { hasEvents: true, eventCount: 2, busyLevel: 'medium' },
  '2026-06-18': { hasEvents: true, eventCount: 1, busyLevel: 'low' },
  '2026-06-19': { hasEvents: true, eventCount: 3, busyLevel: 'high' },
  '2026-06-24': { hasEvents: true, eventCount: 1, busyLevel: 'low' },
  '2026-07-02': { hasEvents: true, eventCount: 1, busyLevel: 'low' }
};

export const demoEventsByDate: Record<string, CalendarEvent[]> = {
  '2026-06-19': [
    {
      id: 'evt-1',
      title: 'Take it to the streets',
      subtitle: 'wake up in the morning and move',
      location: 'the streets',
      startHour: 9,
      endHour: 10,
      color: 'blue'
    },
    {
      id: 'evt-2',
      title: 'Whatever she brings',
      subtitle: 'right there in front of you',
      location: 'scones and crumpets',
      startHour: 10,
      endHour: 11,
      color: 'red'
    },
    {
      id: 'evt-3',
      title: 'Do the tootsie roll',
      subtitle: 'shake it, to the right',
      location: 'right',
      startHour: 10,
      endHour: 11,
      color: 'yellow'
    },
    {
      id: 'evt-4',
      title: 'Shoot at the moon',
      subtitle: 'take the frog and jump',
      location: 'scones and crumpets',
      startHour: 14,
      endHour: 15,
      color: 'red'
    }
  ]
};
