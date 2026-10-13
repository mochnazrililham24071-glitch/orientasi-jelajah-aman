import * as SQLite from "expo-sqlite";
import type { KotaGlobal } from "../types/kotaGlobal";

const NAMA_DATABASE = "jelajah_aman.db";
let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function bukaDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(NAMA_DATABASE);
  }
  return databasePromise;
}

/**
 * Jalankan sekali saat aplikasi mulai.
 * Membuat tabel lokal untuk pencarian kota secara offline.
 */
export async function siapkanDatabaseKota(): Promise<void> {
  const db = await bukaDatabase();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS kota (
      id INTEGER PRIMARY KEY NOT NULL,
      nama TEXT NOT NULL,
      nama_normal TEXT NOT NULL,
      negara TEXT NOT NULL,
      kode_negara TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      populasi INTEGER DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_kota_nama_normal ON kota(nama_normal);
    CREATE INDEX IF NOT EXISTS idx_kota_negara ON kota(negara);
  `);
}

/**
 * Masukkan dataset global ke SQLite.
 * Panggil dengan data dari file JSON lokal, bukan dari internet.
 * Format setiap item: { id, nama, negara, kodeNegara, latitude, longitude, populasi? }
 */
export async function imporDatabaseKota(data: KotaGlobal[]): Promise<void> {
  await siapkanDatabaseKota();
  const db = await bukaDatabase();

  await db.withTransactionAsync(async () => {
    for (const kota of data) {
      const nama = kota.nama.trim();
      const negara = kota.negara.trim();
      if (!nama || !negara || !Number.isFinite(kota.latitude) || !Number.isFinite(kota.longitude)) {
        continue;
      }

      await db.runAsync(
        `INSERT OR REPLACE INTO kota
         (id, nama, nama_normal, negara, kode_negara, latitude, longitude, populasi)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        kota.id,
        nama,
        normalisasi(nama),
        negara,
        kota.kodeNegara,
        kota.latitude,
        kota.longitude,
        kota.populasi ?? 0
      );
    }
  });
}

function normalisasi(teks: string): string {
  return teks
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .trim();
}

/**
 * Pencarian dilakukan di SQLite lokal, sehingga tetap berjalan tanpa internet.
 */
export async function cariKotaOffline(teks: string, batas = 30): Promise<KotaGlobal[]> {
  await siapkanDatabaseKota();
  const q = normalisasi(teks);
  if (!q) return [];

  const db = await bukaDatabase();
  const hasil = await db.getAllAsync<{
    id: number;
    nama: string;
    negara: string;
    kode_negara: string;
    latitude: number;
    longitude: number;
    populasi: number;
  }>(
    `SELECT id, nama, negara, kode_negara, latitude, longitude, populasi
     FROM kota
     WHERE nama_normal LIKE ?
        OR lower(negara) LIKE ?
     ORDER BY
       CASE WHEN nama_normal = ? THEN 0
            WHEN nama_normal LIKE ? THEN 1
            ELSE 2 END,
       populasi DESC,
       nama ASC
     LIMIT ?`,
    `%${q}%`,
    `%${q}%`,
    q,
    `${q}%`,
    batas
  );

  return hasil.map((item) => ({
    id: item.id,
    nama: item.nama,
    negara: item.negara,
    kodeNegara: item.kode_negara,
    latitude: item.latitude,
    longitude: item.longitude,
    populasi: item.populasi ?? 0,
  }));
}

export async function hitungKotaTersimpan(): Promise<number> {
  await siapkanDatabaseKota();
  const db = await bukaDatabase();
  const hasil = await db.getFirstAsync<{ total: number }>(
    "SELECT COUNT(*) AS total FROM kota"
  );
  return hasil?.total ?? 0;
}
