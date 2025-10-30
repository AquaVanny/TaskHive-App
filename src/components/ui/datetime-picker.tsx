import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DateTimePickerProps {
  date?: Date;
  setDate: (date: Date | undefined) => void;
  placeholder?: string;
}

export function DateTimePicker({ date, setDate, placeholder = "Pick a date and time" }: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date);
  const [selectedTime, setSelectedTime] = React.useState<string>(
    date ? format(date, "HH:mm") : "09:00"
  );

  const handleDateSelect = (newDate: Date | undefined) => {
    if (!newDate) {
      setSelectedDate(undefined);
      return;
    }

    const [hours, minutes] = selectedTime.split(":").map(Number);
    newDate.setHours(hours, minutes, 0, 0);
    setSelectedDate(newDate);
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    if (selectedDate) {
      const [hours, minutes] = time.split(":").map(Number);
      const newDate = new Date(selectedDate);
      newDate.setHours(hours, minutes, 0, 0);
      setSelectedDate(newDate);
    }
  };

  const handleApply = () => {
    if (selectedDate) {
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const newDate = new Date(selectedDate);
      newDate.setHours(hours, minutes, 0, 0);
      setDate(newDate);
    } else {
      setDate(undefined);
    }
    // This will close the popover
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  };

  // Generate time options (every 5 minutes)
  const timeOptions = React.useMemo(() => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 5) {
        const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        options.push(time);
      }
    }
    return options;
  }, []);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? (
            format(selectedDate, "PPP 'at' HH:mm")
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[calc(100vw-2rem)] sm:w-auto p-0 rounded-lg overflow-hidden border-0 shadow-xl" 
        align="center"
        side="bottom"
        sideOffset={8}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <div className="flex flex-col max-h-[80vh] overflow-y-auto">
          <div className="flex flex-col sm:flex-row">
            <div className="p-3">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                initialFocus
                className="p-0 m-0"
              />
            </div>
            <div className="border-t sm:border-t-0 sm:border-l p-3 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Select Time</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {['09:00', '12:00', '15:00', '18:00', '21:00'].map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? 'default' : 'outline'}
                    size="sm"
                    className="min-w-[60px]"
                    onClick={() => setSelectedTime(time)}
                  >
                    {time}
                  </Button>
                ))}
              </div>
              <div className="mt-2">
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Custom time" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Sticky footer for mobile */}
          <div className="sticky bottom-0 bg-background border-t p-3 z-50">
            <div className="flex justify-between gap-2">
              <Button 
                type="button"
                variant="outline" 
                className="flex-1 h-12 text-base"
                onClick={() => {
                  setSelectedDate(date);
                  setSelectedTime(date ? format(date, "HH:mm") : "09:00");
                  // Close the popover
                  const popover = document.querySelector('[role="dialog"]');
                  if (popover) {
                    (popover as HTMLElement).style.display = 'none';
                  }
                }}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1 h-12 text-base"
                onClick={() => {
                  // Close the popover without saving
                  const popover = document.querySelector('[role="dialog"]');
                  if (popover) {
                    (popover as HTMLElement).style.display = 'none';
                  }
                }}
              >
                Reset
              </Button>
              <Button 
                type="button" 
                className="flex-1 h-12 text-base gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => {
                  handleApply();
                  // Close the popover
                  const popover = document.querySelector('[role="dialog"]');
                  if (popover) {
                    (popover as HTMLElement).style.display = 'none';
                  }
                }}
              >
                <Check className="h-5 w-5" />
                <span>Set Time</span>
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}