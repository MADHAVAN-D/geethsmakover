import { NextResponse, type NextRequest } from 'next/server';
import { clientIp, rateLimit } from '@/lib/security/rate-limit';
import { createBooking } from '@/lib/booking/service';
import type { BookingInput } from '@/lib/validate';
import { businessWaLink, newBookingWaMessage } from '@/lib/whatsapp';

function pickString(v: unknown, max: number): string {
  return typeof v === 'string' ? v.slice(0, max) : '';
}

/**
 * Public: create a booking request (status starts as "pending" —
 * the business always confirms before it is a confirmed appointment).
 * POST /api/bookings
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = clientIp(req);
  if (!rateLimit(`booking:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json(
      {
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many booking attempts. Please wait a while and try again.',
        },
      },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json(
      { error: { code: 'INVALID_INPUT', message: 'Invalid request.' } },
      { status: 400 },
    );
  }

  const input: BookingInput = {
    name: pickString((body as Record<string, unknown>).name, 80),
    phone: pickString((body as Record<string, unknown>).phone, 20),
    whatsapp: pickString((body as Record<string, unknown>).whatsapp, 20),
    email: pickString((body as Record<string, unknown>).email, 120),
    notes: pickString((body as Record<string, unknown>).notes, 600),
    serviceLocation: pickString((body as Record<string, unknown>).serviceLocation, 300),
    area: pickString((body as Record<string, unknown>).area, 80),
    service: pickString((body as Record<string, unknown>).service, 80),
    date: pickString((body as Record<string, unknown>).date, 10),
    time: pickString((body as Record<string, unknown>).time, 5),
  };

  const result = await createBooking(input);
  if (result.ok) {
    const b = result.booking;
    return NextResponse.json(
      {
        booking: {
          id: b.id,
          status: b.status,
          serviceName: b.serviceName,
          date: b.date,
          startTime: b.startTime,
          endTime: b.endTime,
          name: b.customer.name,
          phone: b.customer.phoneDisplay,
          serviceLocation: b.serviceLocation,
          area: b.area,
          notes: b.notes,
        },
        waLink: businessWaLink(
          newBookingWaMessage({
            reference: b.id,
            name: b.customer.name,
            phone: b.customer.phoneDisplay,
            serviceName: b.serviceName,
            date: b.date,
            start: b.startTime,
            end: b.endTime,
            serviceLocation: b.serviceLocation,
            area: b.area,
            notes: b.notes,
          }),
        ),
      },
      { status: 201 },
    );
  }

  const status =
    result.code === 'INVALID_INPUT'
      ? 400
      : result.code === 'SERVICE_NOT_FOUND'
        ? 404
        : result.code === 'DB_ERROR'
          ? 500
          : 409;
  return NextResponse.json({ error: { code: result.code, message: result.message, step: result.step } }, { status });
}
