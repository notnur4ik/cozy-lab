import { z } from 'zod';

export const uuidSchema = z.string().uuid();

export const createBookingSchema = z.object({
  branchId: uuidSchema,
  serviceId: uuidSchema,
  employeeId: z.union([uuidSchema, z.literal('ANY')]),
  startsAtIso: z.string().datetime({ offset: true }),
  customerName: z.string().trim().min(2).max(120),
  customerPhone: z
    .string()
    .trim()
    .min(10)
    .max(20)
    .regex(/^[+\d\s()-]+$/, 'Invalid phone format'),
  comment: z.string().trim().max(500).optional(),
  locale: z.enum(['ru', 'kk', 'en']).default('ru'),
});

export const bookingSelfServiceSchema = z.object({
  bookingCode: z.string().trim().min(4).max(32),
  phone: z.string().trim().min(10).max(20),
  action: z.enum(['CANCEL_REQUEST', 'RESCHEDULE_REQUEST']),
  reason: z.string().trim().max(500).optional(),
  preferredDateIso: z.string().optional(),
});

export const transitionStatusSchema = z.object({
  status: z.enum([
    'NEW',
    'PENDING',
    'CONFIRMED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW',
  ]),
  reason: z.string().trim().max(500).optional(),
});

export const recordPaymentSchema = z.object({
  appointmentId: uuidSchema,
  paymentMethodId: uuidSchema,
  amountKzt: z.number().int().min(0).max(50_000_000),
  notes: z.string().trim().max(500).optional(),
});

export const whatsappInquirySchema = z.object({
  branchId: uuidSchema,
  serviceId: uuidSchema.optional(),
  employeeId: uuidSchema.optional(),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  customerName: z.string().trim().max(120).optional(),
  customerPhone: z.string().trim().max(20).optional(),
  messageText: z.string().trim().min(1).max(2000),
});
