import AsyncStorage from "@react-native-async-storage/async-storage";

import { HasilGeocoding } from "../../types/geocoding";

const AWALAN = "cache:";
const KUNCI_RIWAYAT = "riwayatKota";
const KUNCI_KOTA_TERAKHIR = "kotaTerakhir";
const MAKS_RIWAYAT = 50;

export type EntriCache<T> = { data: T; waktu: number };

export async function simpanCache<T>(kunci: string, data: T): Promise<void> {
  try {
    const entri: EntriCache<T> = { data, waktu: Date.now() };
    await AsyncStorage.setItem(AWALAN + kunci, JSON.stringify(entri));
  } catch {
    // gagal menyimpan cache tidak boleh merusak alur utama
  }
}

export async function ambilCache<T>(kunci: string): Promise<EntriCache<T> | null> {
  try {
    const mentah = await AsyncStorage.getItem(AWALAN + kunci);
    return mentah ? (JSON.parse(mentah) as EntriCache<T>) : null;
  } catch {
    return null;
  }
}

/* ---------- Riwayat kota (dipakai sebagai "database" pencarian offline) ---------- */

export async function ambilRiwayatKota(): Promise<HasilGeocoding[]> {
  try {
    const mentah = await AsyncStorage.getItem(KUNCI_RIWAYAT);
    return mentah ? (JSON.parse(mentah) as HasilGeocoding[]) : [];
  } catch {
    return [];
  }
}

export async function simpanRiwayatKota(kota: HasilGeocoding): Promise<void> {
  if (kota.id === -1) return; // "Lokasi Saat Ini" bukan nama kota
  const daftar = await ambilRiwayatKota();
  const baru = [kota, ...daftar.filter((k) => k.id !== kota.id)].slice(
    0,
    MAKS_RIWAYAT,
  );
  await AsyncStorage.setItem(KUNCI_RIWAYAT, JSON.stringify(baru));
}

/* ---------- Kota terakhir dilihat ---------- */

export async function simpanKotaTerakhir(kota: HasilGeocoding): Promise<void> {
  await AsyncStorage.setItem(KUNCI_KOTA_TERAKHIR, JSON.stringify(kota));
}

export async function ambilKotaTerakhir(): Promise<HasilGeocoding | null> {
  try {
    const mentah = await AsyncStorage.getItem(KUNCI_KOTA_TERAKHIR);
    return mentah ? (JSON.parse(mentah) as HasilGeocoding) : null;
  } catch {
    return null;
  }
}
