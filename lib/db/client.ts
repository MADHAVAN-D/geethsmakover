import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { env } from '@/lib/env';

let _db: Database.Database | null = null;

/**
 * SQLite (WAL mode) behind a thin singleton. All SQL in this app lives in
 * lib/db — swap this module for a Postgres client to move off SQLite;
 * the repositories are the only consumers.
 */
export function getDb(): Database.Database {
  if (_db) return _db;
  const dir = path.resolve(process.cwd(), env.dataDir);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'geeths.sqlite');
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  migrate(db);
  _db = db;
  return db;
}

/** Tests only: inject a database instance. */
export function setDbForTests(db: Database.Database): void {
  _db = db;
}

export function closeDb(): void {
  _db?.close();
  _db = null;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT NOT NULL UNIQUE,
  phone_display TEXT NOT NULL,
  whatsapp TEXT,
  name TEXT NOT NULL,
  email TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  service_slug TEXT NOT NULL,
  service_name TEXT NOT NULL,
  price INTEGER,
  duration_min INTEGER,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','completed','cancelled')),
  service_location TEXT,
  area TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings (date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings (status);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings (customer_id);

CREATE TABLE IF NOT EXISTS availability_days (
  day_of_week INTEGER PRIMARY KEY CHECK (day_of_week BETWEEN 0 AND 6),
  enabled INTEGER NOT NULL DEFAULT 1,
  opening_time TEXT NOT NULL DEFAULT '10:00',
  closing_time TEXT NOT NULL DEFAULT '19:00'
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS blocked_dates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  reason TEXT
);

CREATE TABLE IF NOT EXISTS blocked_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  reason TEXT
);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_date ON blocked_slots (date);

CREATE TABLE IF NOT EXISTS local_services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  price INTEGER NOT NULL,
  duration_min INTEGER NOT NULL,
  image TEXT,
  featured INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0
);
`;

function nowIso(): string {
  return new Date().toISOString();
}

function migrate(db: Database.Database): void {
  db.exec(SCHEMA);

  // Forward-compatible migration for databases created before home-service
  // booking locations existed.
  const bookingCols = db.prepare('PRAGMA table_info(bookings)').all() as { name: string }[];
  const colNames = new Set(bookingCols.map((c) => c.name));
  if (!colNames.has('service_location')) {
    db.exec('ALTER TABLE bookings ADD COLUMN service_location TEXT');
  }
  if (!colNames.has('area')) {
    db.exec('ALTER TABLE bookings ADD COLUMN area TEXT');
  }

  // Default weekly availability: Tue–Sun 10:00–19:00, Monday closed.
  const insertDay = db.prepare(
    'INSERT OR IGNORE INTO availability_days (day_of_week, enabled, opening_time, closing_time) VALUES (?, ?, ?, ?)',
  );
  const defaults: Array<[number, number, string, string]> = [
    [0, 1, '10:00', '19:00'],
    [1, 0, '10:00', '19:00'],
    [2, 1, '10:00', '19:00'],
    [3, 1, '10:00', '19:00'],
    [4, 1, '10:00', '19:00'],
    [5, 1, '10:00', '19:00'],
    [6, 1, '10:00', '19:00'],
  ];
  const seedDays = db.transaction(() => {
    for (const row of defaults) insertDay.run(...row);
  });
  seedDays();

  const setDefault = db.prepare(
    'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)',
  );
  setDefault.run('slot_duration_min', '30');
  setDefault.run('booking_lead_min', '60');
  setDefault.run('booking_window_days', '60');
  void nowIso;
}
