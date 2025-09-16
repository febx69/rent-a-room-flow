import React, { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface TimePicker24Props {
  id?: string;
  label?: string;
  value: string; // HH:MM
  onChange: (value: string) => void;
  min?: string; // HH:MM
  max?: string; // HH:MM
  stepMinutes?: number; // default 5
}

const pad = (n: number) => n.toString().padStart(2, '0');
const toMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

export const TimePicker24: React.FC<TimePicker24Props> = ({
  id,
  label,
  value,
  onChange,
  min = '00:00',
  max = '23:55',
  stepMinutes = 5,
}) => {
  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => pad(i)), []);
  const minutes = useMemo(() => Array.from({ length: 60 / stepMinutes }, (_, i) => pad(i * stepMinutes)), [stepMinutes]);

  const [h, m] = (value || '00:00').split(':');

  const minMin = toMinutes(min);
  const maxMin = toMinutes(max);

  const isDisabled = (hh: string, mm: string) => {
    const minutesVal = parseInt(hh, 10) * 60 + parseInt(mm, 10);
    return minutesVal < minMin || minutesVal > maxMin;
  };

  const handleHourChange = (newH: string) => {
    const newVal = `${newH}:${m || '00'}`;
    onChange(newVal);
  };

  const handleMinuteChange = (newM: string) => {
    const newVal = `${h || '00'}:${newM}`;
    onChange(newVal);
  };

  return (
    <div className="space-y-2">
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="flex items-center gap-2">
        <div className="w-24">
          <Select value={h} onValueChange={handleHourChange}>
            <SelectTrigger id={id} className="transition-all duration-200 focus:shadow-soft">
              <SelectValue placeholder="HH" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border shadow-lg z-50 max-h-60">
              {hours.map((hh) => (
                <SelectItem key={hh} value={hh} disabled={minutes.every((mm) => isDisabled(hh, mm))}>
                  {hh}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="opacity-60">:</span>
        <div className="w-24">
          <Select value={m} onValueChange={handleMinuteChange}>
            <SelectTrigger className="transition-all duration-200 focus:shadow-soft">
              <SelectValue placeholder="MM" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border shadow-lg z-50 max-h-60">
              {minutes.map((mm) => (
                <SelectItem key={mm} value={mm} disabled={isDisabled(h || '00', mm)}>
                  {mm}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default TimePicker24;
