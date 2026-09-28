import { getDb } from './client';

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export type Customer = {
  id: number;
  phone: string;
  phoneDisplay: string;
  whatsapp: string | null;
  name: string;
  email: string | null;
  createdAt: string;
};

export type CustomerWithStats = Customer & {
  bookingCount: number;
  upcomingCount: number;
  lastBookingDate: string | null;
};

export type Booking = {
  id: string;
  customerId: number;
  serviceSlug: string;
  serviceName: string;
  price: number | null;
  durationMin: number | null;
  date: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  /** Customer's service location (home service) — private, admin-only. */
  serviceLocation: string | null;
  area: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BookingWithCustomer = Booking & { customer: Customer };

export type DayAvailability = {
  dayOfWeek: number;
  enabled: boolean;
  openingTime: string;
  closingTime: string;
};

export type BlockedDate = { id: number; date: string; reason: string | null };
export type BlockedSlot = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  reason: string | null;
};

export type LocalService = {
  id: number;
  slug: string;
  name: string;
  category: string | null;
  description: string | null;
  price: number;
  durationMin: number;
  image: string | null;
  featured: boolean;
  active: boolean;
  displayOrder: number;
};

type Row = Record<string, unknown>;

function nowIso(): string {
  return new Date().toISOString();
}

function rowToCustomer(row: Row): Customer {
  return {
    id: row.id as number,
    phone: row.phone as string,
    phoneDisplay: row.phone_display as string,
    whatsapp: (row.whatsapp as string | null) ?? null,
    name: row.name as string,
    email: (row.email as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

function rowToBooking(row: Row): Booking {
  return {
    id: row.id as string,
    customerId: row.customer_id as number,
    serviceSlug: row.service_slug as string,
    serviceName: row.service_name as string,
    price: (row.price as number | null) ?? null,
    durationMin: (row.duration_min as number | null) ?? null,
    date: row.date as string,
    startTime: row.start_time as string,
    endTime: row.end_time as string,
    status: row.status as BookingStatus,
    serviceLocation: (row.service_location as string | null) ?? null,
    area: (row.area as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ---------------------------------------------------------------- settings

export function getSetting(key: string, fallback: string): string {
  const row = getDb()
    .prepare('SELECT value FROM settings WHERE key = ?')
    .get(key) as Row | undefined;
  return row ? (row.value as string) : fallback;
}

export function setSetting(key: string, value: string): void {
  getDb()
    .prepare(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    )
    .run(key, value);
}

export function getSlotDurationMin(): number {
  return Math.max(15, parseInt(getSetting('slot_duration_min', '30'), 10) || 30);
}

// -------------------------------------------------------------- customers

export function findCustomerByPhone(phone: string): Customer | null {
  const row = getDb().prepare('SELECT * FROM customers WHERE phone = ?').get(phone) as Row | undefined;
  return row ? rowToCustomer(row) : null;
}

export function getCustomer(id: number): Customer | null {
  const row = getDb().prepare('SELECT * FROM customers WHERE id = ?').get(id) as Row | undefined;
  return row ? rowToCustomer(row) : null;
}

export function upsertCustomer(input: {
  name: string;
  phone: string; // normalised digits (unique key)
  phoneDisplay: string;
  whatsapp?: string | null;
  email?: string | null;
}): Customer {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM customers WHERE phone = ?').get(input.phone) as Row | undefined;
  if (existing) {
    db.prepare(
      `UPDATE customers
         SET name = ?,
             phone_display = ?,
             whatsapp = COALESCE(?, whatsapp),
             email = COALESCE(?, email),
             updated_at = ?
       WHERE id = ?`,
    ).run(
      input.name,
      input.phoneDisplay,
      input.whatsapp ?? null,
      input.email ?? null,
      nowIso(),
      existing.id,
    );
  } else {
    db.prepare(
      `INSERT INTO customers (phone, phone_display, whatsapp, name, email, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      input.phone,
      input.phoneDisplay,
      input.whatsapp ?? null,
      input.name,
      input.email ?? null,
      nowIso(),
      nowIso(),
    );
  }
  return findCustomerByPhone(input.phone)!;
}

export function listCustomers(search?: string): CustomerWithStats[] {
  const db = getDb();
  const q = (search ?? '').trim();
  let rows: Row[];
  if (q) {
    const like = `%${q.replace(/[%_]/g, '')}%`;
    rows = db
      .prepare(
        `SELECT c.*,
                (SELECT COUNT(*) FROM bookings b WHERE b.customer_id = c.id) AS booking_count,
                (SELECT COUNT(*) FROM bookings b WHERE b.customer_id = c.id
                   AND b.status IN ('pending','confirmed') AND b.date >= date('now')) AS upcoming_count,
                (SELECT MAX(b.date) FROM bookings b WHERE b.customer_id = c.id
                   AND b.status NOT IN ('cancelled')) AS last_booking_date
           FROM customers c
          WHERE c.name LIKE ? OR c.phone LIKE ? OR c.phone_display LIKE ?
          ORDER BY c.name COLLATE NOCASE ASC
          LIMIT 100`,
      )
      .all(like, `%${q.replace(/[%_]/g, '')}%`, like) as Row[];
  } else {
    rows = db
      .prepare(
        `SELECT c.*,
                (SELECT COUNT(*) FROM bookings b WHERE b.customer_id = c.id) AS booking_count,
                (SELECT COUNT(*) FROM bookings b WHERE b.customer_id = c.id
                   AND b.status IN ('pending','confirmed') AND b.date >= date('now')) AS upcoming_count,
                (SELECT MAX(b.date) FROM bookings b WHERE b.customer_id = c.id
                   AND b.status NOT IN ('cancelled')) AS last_booking_date
           FROM customers c
          ORDER BY c.name COLLATE NOCASE ASC
          LIMIT 200`,
      )
      .all() as Row[];
  }
  return rows.map((r) => ({
    ...rowToCustomer(r),
    bookingCount: r.booking_count as number,
    upcomingCount: r.upcoming_count as number,
    lastBookingDate: (r.last_booking_date as string | null) ?? null,
  }));
}

// --------------------------------------------------------------- bookings

export function createBookingRow(b: {
  id: string;
  customerId: number;
  serviceSlug: string;
  serviceName: string;
  price: number | null;
  durationMin: number | null;
  date: string;
  startTime: string;
  endTime: string;
  serviceLocation: string | null;
  area: string | null;
  notes: string | null;
}): Booking {
  const ts = nowIso();
  getDb()
    .prepare(
      `INSERT INTO bookings
         (id, customer_id, service_slug, service_name, price, duration_min,
          date, start_time, end_time, status, service_location, area, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)`,
    )
    .run(
      b.id,
      b.customerId,
      b.serviceSlug,
      b.serviceName,
      b.price,
      b.durationMin,
      b.date,
      b.startTime,
      b.endTime,
      b.serviceLocation,
      b.area,
      b.notes,
      ts,
      ts,
    );
  return getBooking(b.id)!;
}

export function getBooking(id: string): BookingWithCustomer | null {
  const row = getDb()
    .prepare(
      `SELECT b.*, c.id AS c_id, c.phone AS c_phone, c.phone_display AS c_phone_display,
              c.whatsapp AS c_whatsapp, c.name AS c_name, c.email AS c_email, c.created_at AS c_created_at
         FROM bookings b
         JOIN customers c ON c.id = b.customer_id
        WHERE b.id = ?`,
    )
    .get(id) as Row | undefined;
  if (!row) return null;
  const { c_id, c_phone, c_phone_display, c_whatsapp, c_name, c_email, c_created_at, ...rest } = row;
  return {
    ...rowToBooking(rest as Row),
    customer: {
      id: c_id as number,
      phone: c_phone as string,
      phoneDisplay: c_phone_display as string,
      whatsapp: (c_whatsapp as string | null) ?? null,
      name: c_name as string,
      email: (c_email as string | null) ?? null,
      createdAt: c_created_at as string,
    },
  };
}

export type BookingFilter = {
  status?: BookingStatus | 'all';
  q?: string;
  from?: string;
  to?: string;
  limit?: number;
};

export function listBookings(filter: BookingFilter = {}): BookingWithCustomer[] {
  const db = getDb();
  const where: string[] = [];
  const params: unknown[] = [];

  if (filter.status && filter.status !== 'all') {
    where.push('b.status = ?');
    params.push(filter.status);
  }
  if (filter.from) {
    where.push('b.date >= ?');
    params.push(filter.from);
  }
  if (filter.to) {
    where.push('b.date <= ?');
    params.push(filter.to);
  }
  const q = (filter.q ?? '').trim();
  if (q) {
    const like = `%${q.replace(/[%_]/g, '')}%`;
    where.push('(b.id LIKE ? OR c.name LIKE ? OR c.phone LIKE ? OR c.phone_display LIKE ?)');
    params.push(like, like, like, like);
  }

  const sql = `
    SELECT b.*, c.id AS c_id, c.phone AS c_phone, c.phone_display AS c_phone_display,
           c.whatsapp AS c_whatsapp, c.name AS c_name, c.email AS c_email, c.created_at AS c_created_at
      FROM bookings b
      JOIN customers c ON c.id = b.customer_id
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY b.date DESC, b.start_time ASC, b.created_at DESC
     LIMIT ?`;
  params.push(Math.min(filter.limit ?? 200, 500));

  const rows = db.prepare(sql).all(...params) as Row[];
  return rows.map((row) => {
    const { c_id, c_phone, c_phone_display, c_whatsapp, c_name, c_email, c_created_at, ...rest } = row;
    return {
      ...rowToBooking(rest as Row),
      customer: {
        id: c_id as number,
        phone: c_phone as string,
        phoneDisplay: c_phone_display as string,
        whatsapp: (c_whatsapp as string | null) ?? null,
        name: c_name as string,
        email: (c_email as string | null) ?? null,
        createdAt: c_created_at as string,
      },
    };
  });
}

/** Active (slot-occupying) bookings on a date, for conflict checks. */
export function listActiveBookingsForDate(date: string): {
  startTime: string;
  endTime: string;
  status: BookingStatus;
}[] {
  const rows = getDb()
    .prepare(
      `SELECT start_time, end_time, status FROM bookings
        WHERE date = ? AND status IN ('pending','confirmed')
        ORDER BY start_time ASC`,
    )
    .all(date) as Row[];
  return rows.map((r) => ({
    startTime: r.start_time as string,
    endTime: r.end_time as string,
    status: r.status as BookingStatus,
  }));
}

export function listBookingsByCustomer(customerId: number): BookingWithCustomer[] {
  const rows = getDb()
    .prepare(
      `SELECT b.*, c.id AS c_id, c.phone AS c_phone, c.phone_display AS c_phone_display,
              c.whatsapp AS c_whatsapp, c.name AS c_name, c.email AS c_email, c.created_at AS c_created_at
         FROM bookings b
         JOIN customers c ON c.id = b.customer_id
        WHERE b.customer_id = ?
        ORDER BY b.date DESC, b.start_time DESC
        LIMIT 200`,
    )
    .all(customerId) as Row[];
  return rows.map((row) => {
    const { c_id, c_phone, c_phone_display, c_whatsapp, c_name, c_email, c_created_at, ...rest } = row;
    return {
      ...rowToBooking(rest as Row),
      customer: {
        id: c_id as number,
        phone: c_phone as string,
        phoneDisplay: c_phone_display as string,
        whatsapp: (c_whatsapp as string | null) ?? null,
        name: c_name as string,
        email: (c_email as string | null) ?? null,
        createdAt: c_created_at as string,
      },
    };
  });
}

export function countAllBookings(): number {
  const row = getDb().prepare('SELECT COUNT(*) AS n FROM bookings').get() as Row;
  return row.n as number;
}

export function countByStatus(): Record<BookingStatus, number> {
  const rows = getDb()
    .prepare('SELECT status, COUNT(*) AS n FROM bookings GROUP BY status')
    .all() as Row[];
  const out: Record<BookingStatus, number> = {
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  };
  for (const r of rows) out[r.status as BookingStatus] = r.n as number;
  return out;
}

export function updateBookingStatus(id: string, status: BookingStatus): boolean {
  const info = getDb()
    .prepare('UPDATE bookings SET status = ?, updated_at = ? WHERE id = ?')
    .run(status, nowIso(), id);
  return info.changes > 0;
}

// ----------------------------------------------------------- availability

export function getAvailabilityDays(): DayAvailability[] {
  const rows = getDb()
    .prepare('SELECT * FROM availability_days ORDER BY day_of_week ASC')
    .all() as Row[];
  return rows.map((r) => ({
    dayOfWeek: r.day_of_week as number,
    enabled: Boolean(r.enabled),
    openingTime: r.opening_time as string,
    closingTime: r.closing_time as string,
  }));
}

export function setAvailabilityDays(days: DayAvailability[]): void {
  const stmt = getDb().prepare(
    `INSERT INTO availability_days (day_of_week, enabled, opening_time, closing_time)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(day_of_week) DO UPDATE SET
       enabled = excluded.enabled,
       opening_time = excluded.opening_time,
       closing_time = excluded.closing_time`,
  );
  const tx = getDb().transaction(() => {
    for (const d of days) {
      stmt.run(d.dayOfWeek, d.enabled ? 1 : 0, d.openingTime, d.closingTime);
    }
  });
  tx();
}

// --------------------------------------------------------------- blocking

export function listBlockedDates(): BlockedDate[] {
  const rows = getDb()
    .prepare('SELECT * FROM blocked_dates ORDER BY date ASC')
    .all() as Row[];
  return rows.map((r) => ({
    id: r.id as number,
    date: r.date as string,
    reason: (r.reason as string | null) ?? null,
  }));
}

export function addBlockedDate(date: string, reason: string | null): BlockedDate {
  getDb()
    .prepare('INSERT INTO blocked_dates (date, reason) VALUES (?, ?)')
    .run(date, reason);
  const row = getDb()
    .prepare('SELECT * FROM blocked_dates WHERE date = ?')
    .get(date) as Row;
  return { id: row.id as number, date: row.date as string, reason: (row.reason as string | null) ?? null };
}

export function removeBlockedDate(id: number): boolean {
  return getDb().prepare('DELETE FROM blocked_dates WHERE id = ?').run(id).changes > 0;
}

export function listBlockedSlots(): BlockedSlot[] {
  const rows = getDb()
    .prepare('SELECT * FROM blocked_slots ORDER BY date ASC, start_time ASC')
    .all() as Row[];
  return rows.map((r) => ({
    id: r.id as number,
    date: r.date as string,
    startTime: r.start_time as string,
    endTime: r.end_time as string,
    reason: (r.reason as string | null) ?? null,
  }));
}

export function getBlockedSlotsForDate(date: string): { startTime: string; endTime: string }[] {
  const rows = getDb()
    .prepare('SELECT start_time, end_time FROM blocked_slots WHERE date = ?')
    .all(date) as Row[];
  return rows.map((r) => ({ startTime: r.start_time as string, endTime: r.end_time as string }));
}

export function addBlockedSlot(
  date: string,
  startTime: string,
  endTime: string,
  reason: string | null,
): BlockedSlot {
  const info = getDb()
    .prepare('INSERT INTO blocked_slots (date, start_time, end_time, reason) VALUES (?, ?, ?, ?)')
    .run(date, startTime, endTime, reason);
  const row = getDb()
    .prepare('SELECT * FROM blocked_slots WHERE id = ?')
    .get(info.lastInsertRowid) as Row;
  return {
    id: row.id as number,
    date: row.date as string,
    startTime: row.start_time as string,
    endTime: row.end_time as string,
    reason: (row.reason as string | null) ?? null,
  };
}

export function removeBlockedSlot(id: number): boolean {
  return getDb().prepare('DELETE FROM blocked_slots WHERE id = ?').run(id).changes > 0;
}

// -------------------------------------------------------- local services
// Used only when CONTENT_MODE=local (Sanity is the source of truth otherwise).

export function listLocalServices(): LocalService[] {
  const rows = getDb()
    .prepare('SELECT * FROM local_services ORDER BY display_order ASC, id ASC')
    .all() as Row[];
  return rows.map((r) => ({
    id: r.id as number,
    slug: r.slug as string,
    name: r.name as string,
    category: (r.category as string | null) ?? null,
    description: (r.description as string | null) ?? null,
    price: r.price as number,
    durationMin: r.duration_min as number,
    image: (r.image as string | null) ?? null,
    featured: Boolean(r.featured),
    active: Boolean(r.active),
    displayOrder: r.display_order as number,
  }));
}

export function getLocalServiceBySlug(slug: string): LocalService | null {
  const row = getDb()
    .prepare('SELECT * FROM local_services WHERE slug = ?')
    .get(slug) as Row | undefined;
  if (!row) return null;
  return {
    id: row.id as number,
    slug: row.slug as string,
    name: row.name as string,
    category: (row.category as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    price: row.price as number,
    durationMin: row.duration_min as number,
    image: (row.image as string | null) ?? null,
    featured: Boolean(row.featured),
    active: Boolean(row.active),
    displayOrder: row.display_order as number,
  };
}

export function seedLocalServicesIfEmpty(services: Omit<LocalService, 'id'>[]): number {
  const count = getDb().prepare('SELECT COUNT(*) AS n FROM local_services').get() as Row;
  if ((count.n as number) > 0) return 0;
  const stmt = getDb().prepare(
    `INSERT INTO local_services (slug, name, category, description, price, duration_min, image, featured, active, display_order)
     VALUES (@slug, @name, @category, @description, @price, @durationMin, @image, @featured, @active, @displayOrder)`,
  );
  let inserted = 0;
  const tx = getDb().transaction(() => {
    for (const s of services) {
      stmt.run({ ...s, featured: s.featured ? 1 : 0, active: s.active ? 1 : 0 });
      inserted += 1;
    }
  });
  tx();
  return inserted;
}

export function createLocalService(input: Omit<LocalService, 'id'>): LocalService {
  const info = getDb()
    .prepare(
      `INSERT INTO local_services (slug, name, category, description, price, duration_min, image, featured, active, display_order)
       VALUES (@slug, @name, @category, @description, @price, @durationMin, @image, @featured, @active, @displayOrder)`,
    )
    .run({ ...input, featured: input.featured ? 1 : 0, active: input.active ? 1 : 0 });
  const row = getDb()
    .prepare('SELECT * FROM local_services WHERE id = ?')
    .get(info.lastInsertRowid) as Row;
  return {
    id: row.id as number,
    slug: row.slug as string,
    name: row.name as string,
    category: (row.category as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    price: row.price as number,
    durationMin: row.duration_min as number,
    image: (row.image as string | null) ?? null,
    featured: Boolean(row.featured),
    active: Boolean(row.active),
    displayOrder: row.display_order as number,
  };
}

export function updateLocalService(id: number, input: Partial<Omit<LocalService, 'id'>>): LocalService | null {
  const current = getDb()
    .prepare('SELECT * FROM local_services WHERE id = ?')
    .get(id) as Row | undefined;
  if (!current) return null;
  const next = {
    slug: input.slug ?? current.slug,
    name: input.name ?? current.name,
    category: input.category !== undefined ? input.category : current.category,
    description: input.description !== undefined ? input.description : current.description,
    price: input.price ?? current.price,
    durationMin: input.durationMin ?? current.duration_min,
    image: input.image !== undefined ? input.image : current.image,
    featured: input.featured !== undefined ? (input.featured ? 1 : 0) : current.featured,
    active: input.active !== undefined ? (input.active ? 1 : 0) : current.active,
    displayOrder: input.displayOrder ?? current.display_order,
  };
  getDb()
    .prepare(
      `UPDATE local_services
          SET slug = @slug, name = @name, category = @category, description = @description,
              price = @price, duration_min = @durationMin, image = @image,
              featured = @featured, active = @active, display_order = @displayOrder
        WHERE id = ?`,
    )
    .run({ ...next, id });
  return listLocalServices().find((s) => s.id === id) ?? null;
}

export function reorderLocalServices(orderedIds: number[]): void {
  const stmt = getDb().prepare('UPDATE local_services SET display_order = ? WHERE id = ?');
  const tx = getDb().transaction(() => {
    orderedIds.forEach((id, i) => stmt.run(i, id));
  });
  tx();
}
