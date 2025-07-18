"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type Props = {
  date: string;
  time: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
};

const ScheduleSection = ({ date, time, onDateChange, onTimeChange }: Props) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="schedule-date">Schedule Date</Label>
        <Input
          id="schedule-date"
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="mt-3"
        />
      </div>
      <div>
        <Label htmlFor="schedule-time">Schedule Time</Label>
        <Input
          id="schedule-time"
          type="time"
          value={time}
          onChange={(e) => onTimeChange(e.target.value)}
          className="mt-3"
        />
      </div>
    </div>
  );
};

export default ScheduleSection;
