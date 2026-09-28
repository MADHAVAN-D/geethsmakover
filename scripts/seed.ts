/**
 * Demo data seeder (development/preview only).
 *
 *   npm run seed           → seeds only if the bookings table is empty
 *   npm run seed -- --force → adds demo data on top of existing data
 *
 * The seeded customers and bookings are FICTIONAL PLACEHOLDERS (obviously fake
 * names, numbers like 910000000001 and "Sample" addresses). They live only in
 * the local database — production databases start clean. Delete the data/
 * folder (or the rows) to remove them.
 */
import { getDb, closeDb } from '../lib/db/client';
import * as repo from '../lib/db/repositories';
import { LOCAL_SERVICES } from '../lib/content/local';
import { addDays, todayISO } from '../lib/utils';
import { dayOfWeekOf } from '../lib/booking/engine';

const force = process.argv.includes('--force');

function log(msg: string) {
  console.log(`[seed] ${msg}`);
}

function daysAheadOpen(offsetFrom: number, maxLook = 14): string {
  for (let i = Math.max(0, offsetFrom); i <= maxLook; i++) {
    const date = addDays(todayISO(), i);
    const dow = dayOfWeekOf(date);
    const day = repo.getAvailabilityDays().find((d) => d.dayOfWeek === dow);
    if (day?.enabled && !repo.listBlockedDates().some((b) => b.date === date)) {
      return date;
    }
  }
  return addDays(todayISO(), Math.max(0, offsetFrom));
}

function seedCustomer(name: string, phone: string, email?: string) {
  return repo.upsertCustomer({
    name,
    phone,
    phoneDisplay: `+91 ${phone.slice(-10).slice(0, 5)} ${phone.slice(-5)}`,
    email: email ?? null,
  });
}

function addBooking(
  customer: repo.Customer,
  service: { slug: string; name: string; price: number; durationMin: number },
  date: string,
  start: string,
  status: repo.BookingStatus,
  opts: { notes?: string; location?: string; area?: string } = {},
) {
  const startMin = start.split(':').reduce((a, p) => a * 60 + Number(p), 0);
  const endMin = startMin + service.durationMin;
  const end = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;
  const id = `DEMO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  repo.createBookingRow({
    id,
    customerId: customer.id,
    serviceSlug: service.slug,
    serviceName: service.name,
    price: service.price,
    durationMin: service.durationMin,
    date,
    startTime: start,
    endTime: end,
    serviceLocation: opts.location ?? null,
    area: opts.area ?? null,
    notes: opts.notes ?? null,
  });
  if (status !== 'pending') repo.updateBookingStatus(id, status);
  return id;
}

function main() {
  if (!force && repo.countAllBookings() > 0) {
    log('Bookings already exist — nothing to do (use --force to seed more).');
    closeDb();
    process.exit(0);
  }

  const services = repo.listLocalServices();
  if (services.length === 0) {
    repo.seedLocalServicesIfEmpty(
      LOCAL_SERVICES.map((s) => ({
        slug: s.slug,
        name: s.name,
        category: s.category ?? null,
        description: s.description,
        price: s.price,
        durationMin: s.durationMin,
        image: s.image ?? null,
        featured: s.featured,
        active: s.active,
        displayOrder: s.displayOrder,
      })),
    );
  }
  const svc = {
    bridal: repo.getLocalServiceBySlug('bridal-airbrush'),
    trial: repo.getLocalServiceBySlug('bridal-trial'),
    party: repo.getLocalServiceBySlug('party-makeup'),
    engagement: repo.getLocalServiceBySlug('engagement'),
    hair: repo.getLocalServiceBySlug('hair-updo'),
  };

  // Clearly fake placeholder customers (do NOT use real-looking names/numbers).
  const c1 = seedCustomer('Sample Customer 1', '910000000001', 'sample1@example.com');
  const c2 = seedCustomer('Sample Customer 2', '910000000002');
  const c3 = seedCustomer('Sample Customer 3', '910000000003', 'sample3@example.com');
  const c4 = seedCustomer('Sample Customer 4', '910000000004');
  const c5 = seedCustomer('Sample Customer 5', '910000000005');

  const loc = (n: number) => ({
    location: `Sample Residence ${n}, Demo Street, Sample Town`,
    area: 'Sample Area',
  });

  let count = 0;
  const tx = getDb().transaction(() => {
    // Today (fictional walk-ins / pre-booked)
    if (svc.bridal) {
      addBooking(c1, svc.bridal, daysAheadOpen(0), '11:00', 'confirmed', {
        ...loc(1),
        notes: 'Sample note — wedding at 6 PM.',
      });
      count++;
    }
    if (svc.party) {
      addBooking(c2, svc.party, daysAheadOpen(0), '15:30', 'pending', {
        ...loc(2),
        notes: 'Sample note — sangeet at home.',
      });
      count++;
    }
    // Tomorrow
    if (svc.trial) {
      addBooking(c3, svc.trial, daysAheadOpen(1), '12:00', 'confirmed', loc(3));
      count++;
    }
    // Next few days
    if (svc.engagement) {
      addBooking(c4, svc.engagement, daysAheadOpen(3), '11:00', 'pending', {
        ...loc(4),
        notes: 'Sample note — engagement ceremony at 5 PM.',
      });
      count++;
    }
    if (svc.hair) {
      addBooking(c5, svc.hair, daysAheadOpen(5), '16:00', 'pending', loc(5));
      count++;
    }
    // Past history
    if (svc.bridal) {
      addBooking(c1, svc.bridal, addDays(todayISO(), -45), '10:00', 'completed', {
        ...loc(1),
        notes: 'Sample note — reception follow-up look.',
      });
      count++;
    }
    if (svc.party) {
      addBooking(c2, svc.party, addDays(todayISO(), -21), '14:00', 'completed', loc(2));
      count++;
    }
    if (svc.trial) {
      addBooking(c3, svc.trial, addDays(todayISO(), -10), '11:00', 'cancelled', {
        ...loc(3),
        notes: 'Sample note — rescheduled.',
      });
      count++;
    }
  });
  tx();

  log(`Seeded ${count} demo bookings (all clearly-fictional sample data).`);
  log('These are FICTIONAL demo records. Remove them for production (see README).');
  closeDb();
}

main();
