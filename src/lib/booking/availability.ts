import type {
  Appointment,
  Branch,
  MasterSchedule,
  ScheduleBlock,
  ScheduleException,
  TimeSlot,
} from '@/types/domain';

export const ALMATY_UTC_OFFSET_HOURS = 5; // Asia/Almaty is UTC+5
export const SLOT_STEP_MINUTES = 30;

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

export interface AvailabilityInput {
  dateYmd: string; // YYYY-MM-DD in Asia/Almaty local date
  serviceDurationMinutes: number;
  branch: Pick<Branch, 'id' | 'working_hours' | 'is_active'>;
  masters: Array<{
    employeeId: string;
    schedules: MasterSchedule[];
    exceptions: ScheduleException[];
    blocks: ScheduleBlock[];
    appointments: Pick<Appointment, 'starts_at' | 'ends_at' | 'status'>[];
  }>;
  now?: Date;
  slotStepMinutes?: number;
}

function parseHmToMinutes(hm: string): number {
  const [hStr, mStr] = hm.split(':');
  return Number(hStr) * 60 + Number(mStr);
}

function minutesToHm(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Converts an Almaty local date (YYYY-MM-DD) + minutes from midnight into UTC Date.
 */
export function almatyLocalToUtc(dateYmd: string, minutesFromMidnight: number): Date {
  const [y, m, d] = dateYmd.split('-').map(Number);
  const utcMs =
    Date.UTC(y, m - 1, d, 0, 0, 0, 0) +
    (minutesFromMidnight - ALMATY_UTC_OFFSET_HOURS * 60) * 60_000;
  return new Date(utcMs);
}

/**
 * Returns 0 (Sunday) .. 6 (Saturday) for YYYY-MM-DD.
 */
export function getDayOfWeek(dateYmd: string): number {
  const [y, m, d] = dateYmd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Pure, deterministic availability slot calculator.
 * Never returns past slots, breaks, holidays, blocked periods, or overlapping appointments.
 */
export function calculateAvailableSlots(input: AvailabilityInput): TimeSlot[] {
  if (!input.branch.is_active || input.serviceDurationMinutes <= 0) {
    return [];
  }

  const nowMs = (input.now ?? new Date()).getTime();
  const step = input.slotStepMinutes ?? SLOT_STEP_MINUTES;
  const dow = getDayOfWeek(input.dateYmd);
  const dayKey = DAY_KEYS[dow];

  const branchHoursRaw = input.branch.working_hours?.[dayKey];
  if (!branchHoursRaw || !branchHoursRaw.includes('-')) {
    return [];
  }

  const [branchOpenStr, branchCloseStr] = branchHoursRaw.split('-');
  const branchOpenMin = parseHmToMinutes(branchOpenStr.trim());
  const branchCloseMin = parseHmToMinutes(branchCloseStr.trim());

  const slotsByStartIso = new Map<string, TimeSlot>();

  for (const master of input.masters) {
    // Check branch-wide or master-specific holiday/exception for dateYmd
    const branchException = master.exceptions.find(
      (ex) => ex.exception_date === input.dateYmd && ex.branch_id === input.branch.id && !ex.employee_id
    );
    if (branchException?.is_holiday) {
      continue;
    }

    const masterException = master.exceptions.find(
      (ex) => ex.exception_date === input.dateYmd && ex.employee_id === master.employeeId
    );
    if (masterException?.is_holiday) {
      continue;
    }

    const weekly = master.schedules.find(
      (s) => s.day_of_week === dow && s.branch_id === input.branch.id
    );

    if (!masterException && (!weekly || !weekly.is_working)) {
      continue;
    }

    const masterStartStr = masterException?.start_time ?? weekly?.start_time;
    const masterEndStr = masterException?.end_time ?? weekly?.end_time;
    if (!masterStartStr || !masterEndStr) continue;

    const effectiveStartMin = Math.max(branchOpenMin, parseHmToMinutes(masterStartStr));
    const effectiveEndMin = Math.min(branchCloseMin, parseHmToMinutes(masterEndStr));

    if (effectiveEndMin - effectiveStartMin < input.serviceDurationMinutes) {
      continue;
    }

    const breakStartMs =
      weekly?.break_start ? almatyLocalToUtc(input.dateYmd, parseHmToMinutes(weekly.break_start)).getTime() : null;
    const breakEndMs =
      weekly?.break_end ? almatyLocalToUtc(input.dateYmd, parseHmToMinutes(weekly.break_end)).getTime() : null;

    const busyIntervals: Array<[number, number]> = [];

    if (breakStartMs !== null && breakEndMs !== null) {
      busyIntervals.push([breakStartMs, breakEndMs]);
    }

    for (const blk of master.blocks) {
      busyIntervals.push([new Date(blk.starts_at).getTime(), new Date(blk.ends_at).getTime()]);
    }

    for (const appt of master.appointments) {
      if (appt.status === 'CANCELLED' || appt.status === 'NO_SHOW') continue;
      busyIntervals.push([new Date(appt.starts_at).getTime(), new Date(appt.ends_at).getTime()]);
    }

    for (
      let startMin = effectiveStartMin;
      startMin + input.serviceDurationMinutes <= effectiveEndMin;
      startMin += step
    ) {
      const slotStartDate = almatyLocalToUtc(input.dateYmd, startMin);
      const slotEndDate = almatyLocalToUtc(input.dateYmd, startMin + input.serviceDurationMinutes);
      const slotStartMs = slotStartDate.getTime();
      const slotEndMs = slotEndDate.getTime();

      if (slotStartMs <= nowMs) {
        continue;
      }

      const hasConflict = busyIntervals.some(([bStart, bEnd]) =>
        overlaps(slotStartMs, slotEndMs, bStart, bEnd)
      );

      if (!hasConflict) {
        const startIso = slotStartDate.toISOString();
        if (!slotsByStartIso.has(startIso)) {
          slotsByStartIso.set(startIso, {
            startIso,
            endIso: slotEndDate.toISOString(),
            label: minutesToHm(startMin),
            employeeId: master.employeeId,
          });
        }
      }
    }
  }

  return Array.from(slotsByStartIso.values()).sort((a, b) =>
    a.startIso.localeCompare(b.startIso)
  );
}
