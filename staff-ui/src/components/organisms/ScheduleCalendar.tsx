import React, { useEffect, useMemo } from 'react';
import 'temporal-polyfill/global';
import { useCalendarApp, ScheduleXCalendar } from '@schedule-x/react';
import { createViewWeek, createViewDay } from '@schedule-x/calendar';
import { createDragAndDropPlugin } from '@schedule-x/drag-and-drop';
import { createEventsServicePlugin } from '@schedule-x/events-service';
import { createEventRecurrencePlugin } from '@schedule-x/event-recurrence';
import '@schedule-x/theme-default/dist/index.css';
import { Box } from '@mui/material';
import { useShiftOccurrences, useUpdateShift } from '@/hooks/useSchedule';
import type { ShiftOccurrence } from '@/types/schedule';

interface ScheduleCalendarProps {
  businessId: string | null;
  locationId?: string;
  staffMemberId?: string;
  startDate: string;
  endDate: string;
  onShiftClick?: (shift: ShiftOccurrence) => void;
  onDateClick?: (date: string, staffMemberId?: string) => void;
  view?: 'week' | 'day';
}

// Color mapping for shift types
const SHIFT_TYPE_COLORS: Record<string, string> = {
  Opening: '#2196F3', // blue
  Mid: '#4CAF50', // green
  Closing: '#FF9800', // orange
  Custom: '#9C27B0', // purple
  TimeOff: '#F44336', // red
};

const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({
  businessId,
  locationId,
  staffMemberId,
  startDate,
  endDate,
  onShiftClick,
  onDateClick,
  view = 'week',
}) => {
  const { data: shiftOccurrences = [], isLoading } = useShiftOccurrences(
    businessId,
    startDate,
    endDate,
    staffMemberId,
    locationId
  );
  const updateShiftMutation = useUpdateShift(businessId || '');

  // Create calendar plugins
  const eventsServicePlugin = useMemo(() => createEventsServicePlugin(), []);
  const dragAndDropPlugin = useMemo(() => createDragAndDropPlugin(), []);
  const eventRecurrencePlugin = useMemo(() => createEventRecurrencePlugin(), []);

  // Create calendar instance
  const calendar = useCalendarApp({
    views: view === 'week' ? [createViewWeek()] : [createViewDay()],
    defaultView: view === 'week' ? 'week' : 'day',
    plugins: [eventsServicePlugin, dragAndDropPlugin, eventRecurrencePlugin],
    calendars: {
      Opening: {
        colorName: 'Opening',
        lightColors: {
          main: SHIFT_TYPE_COLORS.Opening,
          container: '#E3F2FD',
          onContainer: '#0D47A1',
        },
      },
      Mid: {
        colorName: 'Mid',
        lightColors: {
          main: SHIFT_TYPE_COLORS.Mid,
          container: '#E8F5E9',
          onContainer: '#1B5E20',
        },
      },
      Closing: {
        colorName: 'Closing',
        lightColors: {
          main: SHIFT_TYPE_COLORS.Closing,
          container: '#FFF3E0',
          onContainer: '#E65100',
        },
      },
      Custom: {
        colorName: 'Custom',
        lightColors: {
          main: SHIFT_TYPE_COLORS.Custom,
          container: '#F3E5F5',
          onContainer: '#4A148C',
        },
      },
      TimeOff: {
        colorName: 'TimeOff',
        lightColors: {
          main: SHIFT_TYPE_COLORS.TimeOff,
          container: '#FFEBEE',
          onContainer: '#B71C1C',
        },
      },
    },
    callbacks: {
      onEventUpdate: async (updatedEvent) => {
        try {
          // Parse the updated event to extract shift ID and new date/time
          const shiftId = updatedEvent.id.split('-')[0]; // Extract shift ID from event ID
          const shift = shiftOccurrences.find((s) => s.shiftId === shiftId);

          if (!shift || !shift.shiftId) {
            console.warn('Cannot update shift without shiftId');
            return;
          }

          // Extract new date and time from the updated event
          const newStartDateTime = new Date(updatedEvent.start);
          const newEndDateTime = new Date(updatedEvent.end);

          const newDate = newStartDateTime.toISOString().split('T')[0];
          const newStartTime = `${String(newStartDateTime.getHours()).padStart(2, '0')}:${String(
            newStartDateTime.getMinutes()
          ).padStart(2, '0')}`;
          const newEndTime = `${String(newEndDateTime.getHours()).padStart(2, '0')}:${String(
            newEndDateTime.getMinutes()
          ).padStart(2, '0')}`;

          // Update shift via API
          await updateShiftMutation.mutateAsync({
            shiftId: shift.shiftId,
            data: {
              date: newDate,
              startTime: newStartTime,
              endTime: newEndTime,
            },
          });
        } catch (err) {
          console.error('Failed to update shift:', err);
        }
      },
      onEventClick: (clickedEvent) => {
        // Find the corresponding shift occurrence
        const shiftId = clickedEvent.id.split('-')[0];
        const shift = shiftOccurrences.find((s) => s.shiftId === shiftId);

        if (shift && onShiftClick) {
          onShiftClick(shift);
        }
      },
      onClickDate: (clickedDate) => {
        // Extract date string from clicked date
        const dateStr = new Date(clickedDate).toISOString().split('T')[0];
        if (onDateClick) {
          onDateClick(dateStr, staffMemberId);
        }
      },
    },
  });

  // Map ShiftOccurrence to Schedule-X event format
  const events = useMemo(() => {
    return shiftOccurrences.map((shift) => {
      // Construct ISO datetime strings for start and end
      const startDateTime = `${shift.date}T${shift.startTime}:00`;
      const endDateTime = `${shift.date}T${shift.endTime}:00`;

      // Generate unique event ID (use shiftId if available, otherwise pattern-based ID)
      const eventId = shift.shiftId || `pattern-${shift.patternId}-${shift.date}`;

      return {
        id: eventId,
        title: `${shift.staffMemberName} - ${shift.shiftType}`,
        start: startDateTime,
        end: endDateTime,
        calendarId: shift.shiftType, // Use shift type for color coding
        description: shift.notes || undefined,
      };
    });
  }, [shiftOccurrences]);

  // Update events service when data changes
  useEffect(() => {
    if (eventsServicePlugin && events.length > 0) {
      eventsServicePlugin.set(events);
    } else if (eventsServicePlugin) {
      eventsServicePlugin.set([]);
    }
  }, [events, eventsServicePlugin]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 400,
        }}
      >
        Loading schedule...
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: 'calc(100vh - 180px)',
        minHeight: 400,
        '& .sx__event': {
          cursor: 'pointer',
        },
      }}
    >
      <ScheduleXCalendar calendarApp={calendar} />
    </Box>
  );
};

export default ScheduleCalendar;
