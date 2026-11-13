import { describe, expect, it } from 'vitest';
import { almatyLocalToUtc, calculateAvailableSlots } from '@/lib/booking/availability';

const BASE_BRANCH = {
  id: 'b1',
  is_active: true,
  working_hours: {
    mon: '10:00-18:00',
    tue: '10:00-18:00',
    wed: '10:00-18:00',
    thu: '10:00-18:00',
    fri: '10:00-18:00',
    sat: '10:00-16:00',
  },
};

const BASE_SCHEDULE = {
  id: 's1',
  employee_id: 'm1',
  branch_id: 'b1',
  day_of_week: 1, // Monday (2026-11-16 is Monday)
  is_working: true,
  start_time: '10:00',
  end_time: '18:00',
  break_start: '13:00',
  break_end: '14:00',
};

describe('calculateAvailableSlots', () => {
  const dateYmd = '2026-11-16'; // Monday
  const earlyMorning = almatyLocalToUtc(dateYmd, 8 * 60);

  it('excludes lunch break and respects 60-minute service duration', () => {
    const slots = calculateAvailableSlots({
      dateYmd,
      serviceDurationMinutes: 60,
      branch: BASE_BRANCH,
      masters: [
        {
          employeeId: 'm1',
          schedules: [BASE_SCHEDULE],
          exceptions: [],
          blocks: [],
          appointments: [],
        },
      ],
      now: earlyMorning,
    });

    const labels = slots.map((s) => s.label);
    expect(labels).toContain('10:00');
    expect(labels).toContain('12:00'); // 12:00-13:00 fits before 13:00 break
    expect(labels).not.toContain('12:30'); // 12:30-13:30 overlaps break
    expect(labels).not.toContain('13:00'); // during break
    expect(labels).toContain('14:00');
    expect(labels).toContain('17:00'); // 17:00-18:00 fits
    expect(labels).not.toContain('17:30'); // exceeds 18:00
  });

  it('excludes existing active appointments but ignores CANCELLED and NO_SHOW', () => {
    const slots = calculateAvailableSlots({
      dateYmd,
      serviceDurationMinutes: 60,
      branch: BASE_BRANCH,
      masters: [
        {
          employeeId: 'm1',
          schedules: [BASE_SCHEDULE],
          exceptions: [],
          blocks: [],
          appointments: [
            {
              starts_at: almatyLocalToUtc(dateYmd, 10 * 60).toISOString(),
              ends_at: almatyLocalToUtc(dateYmd, 11 * 60).toISOString(),
              status: 'CONFIRMED',
            },
            {
              starts_at: almatyLocalToUtc(dateYmd, 15 * 60).toISOString(),
              ends_at: almatyLocalToUtc(dateYmd, 16 * 60).toISOString(),
              status: 'CANCELLED',
            },
          ],
        },
      ],
      now: earlyMorning,
    });

    const labels = slots.map((s) => s.label);
    expect(labels).not.toContain('10:00');
    expect(labels).not.toContain('10:30');
    expect(labels).toContain('11:00');
    expect(labels).toContain('15:00');
  });

  it('returns no slots on a holiday exception', () => {
    const slots = calculateAvailableSlots({
      dateYmd,
      serviceDurationMinutes: 60,
      branch: BASE_BRANCH,
      masters: [
        {
          employeeId: 'm1',
          schedules: [BASE_SCHEDULE],
          exceptions: [
            {
              id: 'ex1',
              employee_id: 'm1',
              branch_id: 'b1',
              exception_date: dateYmd,
              is_holiday: true,
              start_time: null,
              end_time: null,
              reason: 'Day off',
            },
          ],
          blocks: [],
          appointments: [],
        },
      ],
      now: earlyMorning,
    });

    expect(slots).toHaveLength(0);
  });

  it('excludes slots in the past', () => {
    const noon = almatyLocalToUtc(dateYmd, 12 * 60);
    const slots = calculateAvailableSlots({
      dateYmd,
      serviceDurationMinutes: 60,
      branch: BASE_BRANCH,
      masters: [
        {
          employeeId: 'm1',
          schedules: [BASE_SCHEDULE],
          exceptions: [],
          blocks: [],
          appointments: [],
        },
      ],
      now: noon,
    });

    expect(slots.every((s) => new Date(s.startIso).getTime() > noon.getTime())).toBe(true);
  });

  it('excludes schedule blocks and treats NO_SHOW as available', () => {
    const slots = calculateAvailableSlots({
      dateYmd,
      serviceDurationMinutes: 60,
      branch: BASE_BRANCH,
      masters: [
        {
          employeeId: 'm1',
          schedules: [BASE_SCHEDULE],
          exceptions: [],
          blocks: [
            {
              id: 'blk1',
              employee_id: 'm1',
              branch_id: 'b1',
              starts_at: almatyLocalToUtc(dateYmd, 11 * 60).toISOString(),
              ends_at: almatyLocalToUtc(dateYmd, 12 * 60).toISOString(),
              reason: 'Meeting',
            },
          ],
          appointments: [
            {
              starts_at: almatyLocalToUtc(dateYmd, 16 * 60).toISOString(),
              ends_at: almatyLocalToUtc(dateYmd, 17 * 60).toISOString(),
              status: 'NO_SHOW',
            },
          ],
        },
      ],
      now: earlyMorning,
    });

    const labels = slots.map((s) => s.label);
    expect(labels).not.toContain('11:00');
    expect(labels).toContain('16:00');
  });

  it('aggregates union of slots across multiple masters for Any Available Master', () => {
    const slots = calculateAvailableSlots({
      dateYmd,
      serviceDurationMinutes: 60,
      branch: BASE_BRANCH,
      masters: [
        {
          employeeId: 'm1',
          schedules: [BASE_SCHEDULE],
          exceptions: [],
          blocks: [],
          appointments: [
            {
              starts_at: almatyLocalToUtc(dateYmd, 10 * 60).toISOString(),
              ends_at: almatyLocalToUtc(dateYmd, 11 * 60).toISOString(),
              status: 'CONFIRMED',
            },
          ],
        },
        {
          employeeId: 'm2',
          schedules: [{ ...BASE_SCHEDULE, id: 's2', employee_id: 'm2' }],
          exceptions: [],
          blocks: [],
          appointments: [],
        },
      ],
      now: earlyMorning,
    });

    const tenAm = slots.find((s) => s.label === '10:00');
    expect(tenAm).toBeDefined();
    expect(tenAm?.employeeId).toBe('m2');
  });

  it('returns empty array when branch is inactive', () => {
    const slots = calculateAvailableSlots({
      dateYmd,
      serviceDurationMinutes: 60,
      branch: { ...BASE_BRANCH, is_active: false },
      masters: [
        {
          employeeId: 'm1',
          schedules: [BASE_SCHEDULE],
          exceptions: [],
          blocks: [],
          appointments: [],
        },
      ],
      now: earlyMorning,
    });
    expect(slots).toHaveLength(0);
  });
});
