'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, CheckCircle2, Clock, MessageCircle } from 'lucide-react';
import { Button, Card, Input, Textarea } from '@/components/ui/primitives';
import { getDictionary, pickI18n } from '@/lib/i18n/dictionaries';
import { buildReplayHeaders, getAlmatyTodayYmd } from '@/lib/client-security';
import { cn, formatKzt } from '@/lib/utils';
import type {
  Branch,
  Employee,
  Locale,
  Service,
  ServiceCategory,
  TimeSlot,
} from '@/types/domain';

export function BookingWizard({
  locale,
  branches,
  categories,
  services,
  masters,
  branchServices,
  employeeServices,
  initialBranchId,
  initialServiceId,
  initialMasterId,
}: {
  locale: Locale;
  branches: Branch[];
  categories: ServiceCategory[];
  services: Service[];
  masters: Employee[];
  branchServices: Array<{ branch_id: string; service_id: string; price_override_kzt: number | null }>;
  employeeServices: Array<{ employee_id: string; service_id: string }>;
  initialBranchId?: string;
  initialServiceId?: string;
  initialMasterId?: string;
}) {
  const t = getDictionary(locale);
  const [method, setMethod] = useState<'ONLINE' | 'WHATSAPP'>('ONLINE');

  const [branchId, setBranchId] = useState<string>(initialBranchId || branches[0]?.id || '');
  const initialSvc = services.find((s) => s.id === initialServiceId);
  const [categoryId, setCategoryId] = useState<string>(
    initialSvc?.category_id || categories[0]?.id || ''
  );
  const [serviceId, setServiceId] = useState<string>(initialServiceId || '');
  const [employeeId, setEmployeeId] = useState<string>(initialMasterId || 'ANY');

  const todayYmd = useMemo(() => getAlmatyTodayYmd(), []);
  const [dateYmd, setDateYmd] = useState<string>(todayYmd);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [comment, setComment] = useState('');
  const [preferredTimeWa, setPreferredTimeWa] = useState('12:00');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<{
    bookingCode: string;
    startsAt: string;
  } | null>(null);

  // Self-service cancel / reschedule state
  const [manageCode, setManageCode] = useState('');
  const [managePhone, setManagePhone] = useState('');
  const [manageReason, setManageReason] = useState('');
  const [managePreferredDate, setManagePreferredDate] = useState('');
  const [manageFeedback, setManageFeedback] = useState<string | null>(null);

  const availableServices = useMemo(() => {
    return services.filter((s) => {
      if (categoryId && s.category_id !== categoryId) return false;
      if (branchId && !branchServices.some((bs) => bs.branch_id === branchId && bs.service_id === s.id)) {
        return false;
      }
      return true;
    });
  }, [services, categoryId, branchId, branchServices]);

  const availableMasters = useMemo(() => {
    return masters.filter((m) => {
      if (branchId && m.branch_id !== branchId) return false;
      if (serviceId && !employeeServices.some((es) => es.employee_id === m.id && es.service_id === serviceId)) {
        return false;
      }
      return true;
    });
  }, [masters, branchId, serviceId, employeeServices]);

  useEffect(() => {
    if (method !== 'ONLINE' || !branchId || !serviceId || !dateYmd) {
      setSlots([]);
      return;
    }

    let cancelled = false;
    setLoadingSlots(true);
    setSelectedSlot(null);

    const qs = new URLSearchParams({
      branchId,
      serviceId,
      employeeId: employeeId || 'ANY',
      dateYmd,
    });

    fetch(`/api/booking/availability?${qs.toString()}`)
      .then((res) => res.json())
      .then((data: { slots?: TimeSlot[] }) => {
        if (!cancelled) {
          setSlots(data.slots ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });

    return () => {
      cancelled = true;
    };
  }, [method, branchId, serviceId, employeeId, dateYmd]);

  async function handleOnlineSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    if (!branchId || !serviceId || !selectedSlot) {
      setErrorMsg('Please select branch, service, and an available time slot.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: buildReplayHeaders('bk'),
        body: JSON.stringify({
          branchId,
          serviceId,
          employeeId: employeeId === 'ANY' ? 'ANY' : employeeId,
          startsAtIso: selectedSlot.startIso,
          customerName,
          customerPhone,
          comment: comment || undefined,
          locale,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data?.error?.message || 'Booking failed.');
        return;
      }

      setConfirmedBooking({
        bookingCode: data.booking.bookingCode,
        startsAt: data.booking.startsAt,
      });
    } catch {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleWhatsAppBooking() {
    setErrorMsg(null);
    if (!branchId) {
      setErrorMsg('Please select a branch first.');
      return;
    }
    const branch = branches.find((b) => b.id === branchId);
    const service = services.find((s) => s.id === serviceId);
    const master = masters.find((m) => m.id === employeeId);

    const messageText = [
      locale === 'kk'
        ? 'Сәлеметсіз бе! COZY LAB салонына жазылғым келеді:'
        : locale === 'en'
          ? 'Hello! I would like to book at COZY LAB:'
          : 'Здравствуйте! Хочу записаться в COZY LAB:',
      branch ? `Филиал: ${branch.name}` : null,
      service ? `Услуга: ${pickI18n(service.name_i18n, locale)}` : null,
      master ? `Мастер: ${master.full_name}` : null,
      dateYmd ? `Дата: ${dateYmd}` : null,
      preferredTimeWa ? `Время: ${preferredTimeWa}` : null,
      customerName ? `Имя: ${customerName}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    const res = await fetch('/api/whatsapp/inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        branchId,
        serviceId: serviceId || undefined,
        employeeId: employeeId !== 'ANY' ? employeeId : undefined,
        preferredDate: dateYmd,
        preferredTime: preferredTimeWa,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        messageText,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data?.error?.message || 'WhatsApp booking unavailable.');
      return;
    }

    if (data.whatsappUrl) {
      window.open(data.whatsappUrl, '_blank', 'noopener,noreferrer');
    }
  }

  async function handleSelfService(action: 'CANCEL_REQUEST' | 'RESCHEDULE_REQUEST') {
    setManageFeedback(null);
    const res = await fetch('/api/booking/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingCode: manageCode,
        phone: managePhone,
        action,
        reason: manageReason || undefined,
        preferredDateIso: managePreferredDate || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setManageFeedback(data?.error?.message || 'Request failed.');
      return;
    }
    setManageFeedback(`Request submitted for ${data.bookingCode}.`);
  }

  if (confirmedBooking) {
    return (
      <Card className="mx-auto max-w-xl p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-mocha" />
        <h2 className="mt-4 font-serif text-3xl text-dark">{t.booking.confirmedTitle}</h2>
        <p className="mt-2 text-sm text-mocha">{t.booking.confirmedSubtitle}</p>
        <div className="mt-6 rounded-lg border border-sand bg-ivory p-4">
          <p className="text-xs uppercase tracking-widest text-taupe">
            {t.booking.bookingCodeLabel}
          </p>
          <p className="mt-1 font-mono text-xl font-semibold text-dark">
            {confirmedBooking.bookingCode}
          </p>
        </div>
        <Button
          className="mt-6"
          onClick={() => {
            setConfirmedBooking(null);
            setSelectedSlot(null);
          }}
        >
          {t.nav.bookOnline}
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-12">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setMethod('ONLINE')}
          className={cn(
            'inline-flex items-center gap-2 rounded-md px-5 py-3 text-sm font-medium transition-colors',
            method === 'ONLINE'
              ? 'bg-mocha text-white'
              : 'border border-sand bg-white text-dark hover:bg-sand/40'
          )}
        >
          <Calendar className="h-4 w-4" />
          {t.booking.methodOnline}
        </button>
        <button
          type="button"
          onClick={() => setMethod('WHATSAPP')}
          className={cn(
            'inline-flex items-center gap-2 rounded-md px-5 py-3 text-sm font-medium transition-colors',
            method === 'WHATSAPP'
              ? 'bg-mocha text-white'
              : 'border border-sand bg-white text-dark hover:bg-sand/40'
          )}
        >
          <MessageCircle className="h-4 w-4" />
          {t.booking.methodWhatsApp}
        </button>
      </div>

      <form onSubmit={handleOnlineSubmit} className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          {/* Step 1: Branch */}
          <Card className="p-6">
            <h2 className="font-serif text-2xl text-dark">{t.booking.stepBranch}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {branches.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    setBranchId(b.id);
                    setServiceId('');
                    setEmployeeId('ANY');
                  }}
                  className={cn(
                    'rounded-lg border p-4 text-left transition-colors',
                    branchId === b.id
                      ? 'border-mocha bg-ivory'
                      : 'border-sand bg-white hover:bg-ivory/50'
                  )}
                >
                  <p className="font-medium text-dark">{b.name}</p>
                  <p className="mt-1 text-xs text-mocha">{b.address}</p>
                </button>
              ))}
            </div>
          </Card>

          {/* Step 2 & 3: Category & Service */}
          <Card className="p-6">
            <h2 className="font-serif text-2xl text-dark">{t.booking.stepCategory}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setCategoryId(c.id);
                    setServiceId('');
                  }}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-xs font-medium',
                    categoryId === c.id ? 'bg-mocha text-white' : 'bg-sand/60 text-dark'
                  )}
                >
                  {pickI18n(c.name_i18n, locale)}
                </button>
              ))}
            </div>

            <h3 className="mt-6 font-serif text-2xl text-dark">{t.booking.stepService}</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {availableServices.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setServiceId(s.id)}
                  className={cn(
                    'rounded-lg border p-4 text-left transition-colors',
                    serviceId === s.id
                      ? 'border-mocha bg-ivory'
                      : 'border-sand bg-white hover:bg-ivory/50'
                  )}
                >
                  <p className="font-medium text-dark">{pickI18n(s.name_i18n, locale)}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-mocha">
                    <span>
                      {s.duration_minutes} {t.common.minutesShort}
                    </span>
                    <span className="font-semibold text-dark">
                      {formatKzt(s.price_kzt, t.common.priceOnRequest)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Step 4: Master */}
          <Card className="p-6">
            <h2 className="font-serif text-2xl text-dark">{t.booking.stepMaster}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setEmployeeId('ANY')}
                className={cn(
                  'rounded-lg border p-4 text-left',
                  employeeId === 'ANY' ? 'border-mocha bg-ivory' : 'border-sand bg-white'
                )}
              >
                <p className="font-medium text-dark">{t.common.anyAvailableMaster}</p>
              </button>
              {availableMasters.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setEmployeeId(m.id)}
                  className={cn(
                    'rounded-lg border p-4 text-left',
                    employeeId === m.id ? 'border-mocha bg-ivory' : 'border-sand bg-white'
                  )}
                >
                  <p className="font-medium text-dark">{m.full_name}</p>
                  <p className="mt-1 text-xs text-mocha">
                    {pickI18n(m.specialization_i18n, locale)}
                  </p>
                </button>
              ))}
            </div>
          </Card>

          {/* Step 5 & 6: Date & Time */}
          <Card className="p-6">
            <h2 className="font-serif text-2xl text-dark">{t.booking.stepDate}</h2>
            <Input
              type="date"
              min={todayYmd}
              value={dateYmd}
              onChange={(e) => setDateYmd(e.target.value)}
              className="mt-3 max-w-xs"
            />

            <h3 className="mt-6 font-serif text-2xl text-dark">{t.booking.stepTime}</h3>
            {method === 'ONLINE' ? (
              <div className="mt-3">
                {loadingSlots ? (
                  <p className="text-sm text-mocha">{t.common.loading}</p>
                ) : slots.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot.startIso}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-md border px-3.5 py-2 text-xs font-medium',
                          selectedSlot?.startIso === slot.startIso
                            ? 'border-mocha bg-mocha text-white'
                            : 'border-sand bg-white text-dark hover:bg-sand/40'
                        )}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        {slot.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-mocha">{t.booking.noSlots}</p>
                )}
              </div>
            ) : (
              <div className="mt-3">
                <Input
                  type="time"
                  value={preferredTimeWa}
                  onChange={(e) => setPreferredTimeWa(e.target.value)}
                  className="max-w-xs"
                />
                <p className="mt-2 text-xs text-mocha">{t.booking.whatsappNote}</p>
              </div>
            )}
          </Card>
        </div>

        {/* Step 7 & 8: Details & Confirm */}
        <div className="lg:col-span-4">
          <Card className="sticky top-24 space-y-4 p-6">
            <h2 className="font-serif text-2xl text-dark">{t.booking.stepDetails}</h2>
            <div>
              <label className="mb-1 block text-xs font-medium text-mocha">
                {t.booking.customerName}
              </label>
              <Input
                required={method === 'ONLINE'}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Айгерим"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-mocha">
                {t.booking.customerPhone}
              </label>
              <Input
                required={method === 'ONLINE'}
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+7 700 000 00 00"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-mocha">
                {t.booking.comment}
              </label>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} />
            </div>

            {errorMsg ? (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {errorMsg}
              </p>
            ) : null}

            {method === 'ONLINE' ? (
              <Button type="submit" className="w-full" disabled={submitting || !selectedSlot}>
                {submitting ? t.booking.submitting : t.booking.submitBooking}
              </Button>
            ) : (
              <Button type="button" className="w-full" onClick={handleWhatsAppBooking}>
                <MessageCircle className="h-4 w-4" />
                {t.booking.openWhatsApp}
              </Button>
            )}
          </Card>
        </div>
      </form>

      {/* Self-service cancel/reschedule */}
      <Card className="p-6">
        <h2 className="font-serif text-2xl text-dark">{t.booking.manageTitle}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <Input
            value={manageCode}
            onChange={(e) => setManageCode(e.target.value)}
            placeholder={t.booking.manageCodePlaceholder}
          />
          <Input
            value={managePhone}
            onChange={(e) => setManagePhone(e.target.value)}
            placeholder={t.booking.managePhonePlaceholder}
          />
          <Input
            value={manageReason}
            onChange={(e) => setManageReason(e.target.value)}
            placeholder={t.booking.reasonPlaceholder}
          />
          <Input
            value={managePreferredDate}
            onChange={(e) => setManagePreferredDate(e.target.value)}
            placeholder={t.booking.preferredDateLabel}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSelfService('RESCHEDULE_REQUEST')}
          >
            {t.booking.requestReschedule}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleSelfService('CANCEL_REQUEST')}
          >
            {t.booking.requestCancel}
          </Button>
        </div>
        {manageFeedback ? <p className="mt-3 text-xs text-mocha">{manageFeedback}</p> : null}
      </Card>
    </div>
  );
}
