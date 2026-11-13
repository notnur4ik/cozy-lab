export type Locale = 'ru' | 'kk' | 'en';

export const SUPPORTED_LOCALES: readonly Locale[] = ['ru', 'kk', 'en'] as const;
export const DEFAULT_LOCALE: Locale = 'ru';

export type I18nText = Record<Locale, string>;

export type UserRole = 'OWNER' | 'MANAGER' | 'ADMINISTRATOR' | 'MASTER';

export type AppointmentStatus =
  | 'NEW'
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type BookingSource = 'ONLINE' | 'WHATSAPP' | 'ADMIN';

export interface Branch {
  id: string;
  slug: string;
  name: string;
  address: string;
  is_verified_address: boolean;
  phone: string | null;
  whatsapp_phone: string | null;
  instagram_url: string | null;
  working_hours: Record<string, string>;
  latitude: number | null;
  longitude: number | null;
  map_url: string | null;
  interior_photos: string[];
  is_active: boolean;
  sort_order: number;
}

export interface ServiceCategory {
  id: string;
  slug: string;
  name_i18n: I18nText;
  description_i18n: I18nText;
  sort_order: number;
  is_active: boolean;
}

export interface Service {
  id: string;
  category_id: string;
  slug: string;
  name_i18n: I18nText;
  description_i18n: I18nText;
  price_kzt: number | null;
  is_price_verified: boolean;
  duration_minutes: number;
  photo_url: string | null;
  is_placeholder_photo: boolean;
  is_popular: boolean;
  is_active: boolean;
  archived_at: string | null;
}

export interface Employee {
  id: string;
  profile_id: string | null;
  branch_id: string;
  full_name: string;
  specialization_i18n: I18nText;
  bio_i18n: I18nText;
  experience_years: number | null;
  experience_verified: boolean;
  photo_url: string | null;
  is_placeholder_photo: boolean;
  portfolio_urls: string[];
  is_master: boolean;
  is_active: boolean;
}

export interface MasterSchedule {
  id: string;
  employee_id: string;
  branch_id: string;
  day_of_week: number;
  is_working: boolean;
  start_time: string;
  end_time: string;
  break_start: string | null;
  break_end: string | null;
}

export interface ScheduleException {
  id: string;
  employee_id: string | null;
  branch_id: string | null;
  exception_date: string;
  is_holiday: boolean;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
}

export interface ScheduleBlock {
  id: string;
  employee_id: string;
  branch_id: string;
  starts_at: string;
  ends_at: string;
  reason: string | null;
}

export interface Client {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  preferred_master_id: string | null;
  internal_notes: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  booking_code: string;
  branch_id: string;
  service_id: string;
  employee_id: string;
  client_id: string;
  starts_at: string;
  ends_at: string;
  price_kzt: number | null;
  status: AppointmentStatus;
  source: BookingSource;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: string;
  code: string;
  name_i18n: I18nText;
  is_active: boolean;
}

export interface Payment {
  id: string;
  appointment_id: string;
  branch_id: string;
  payment_method_id: string;
  amount_kzt: number;
  recorded_by: string | null;
  paid_at: string;
  notes: string | null;
}

export interface Review {
  id: string;
  branch_id: string | null;
  author_name: string;
  source_name: string;
  external_url: string | null;
  content_i18n: I18nText;
  is_verified: boolean;
  is_published: boolean;
}

export interface GalleryItem {
  id: string;
  branch_id: string | null;
  employee_id: string | null;
  category_id: string | null;
  image_url: string;
  caption_i18n: I18nText;
  is_placeholder: boolean;
  is_published: boolean;
  sort_order: number;
}

export interface TimeSlot {
  startIso: string;
  endIso: string;
  label: string;
  employeeId: string;
}

export interface StaffProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  mfa_enabled: boolean;
  preferred_locale: Locale;
  branch_ids: string[];
}
