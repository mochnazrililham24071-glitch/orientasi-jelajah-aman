import AsyncStorage from "@react-native-async-storage/async-storage";

import { HasilGeocoding } from "../../types/geocoding";

const AWALAN = "cache:";
const KUNCI_INDEKS = "riwayatKota";
const KUNCI_KOTA_TERAKHIR = "kotaTerakhir";
const MAKS_INDEKS = 200;

export type EntriCache<T> = { data: T; waktu: number };

export async function simpanCache<T>(kunci: string, data: T): Promise<void> {
  try {
    const entri: EntriCache<T> = { data, waktu: Date.now() };
    await AsyncStorage.setItem(AWALAN + kunci, JSON.stringify(entri));
  } catch {
    // gagal menyimpan cache tidak boleh merusak alur utama
  }
}

export async function ambilCache<T>(
  kunci: string,
): Promise<EntriCache<T> | null> {
  try {
    const mentah = await AsyncStorage.getItem(AWALAN + kunci);
    return mentah ? (JSON.parse(mentah) as EntriCache<T>) : null;
  } catch {
    return null;
  }
}

/* ---------- Indeks kota: semua kota yang pernah muncul di hasil pencarian ---------- */

export async function ambilRiwayatKota(): Promise<HasilGeocoding[]> {
  try {
    const mentah = await AsyncStorage.getItem(KUNCI_INDEKS);
    return mentah ? (JSON.parse(mentah) as HasilGeocoding[]) : [];
  } catch {
    return [];
  }
}

export async function simpanIndeksKota(kota: HasilGeocoding[]): Promise<void> {
  try {
    const lama = await ambilRiwayatKota();
    const ids = new Set(kota.map((k) => k.id));
    const gabung = [...kota, ...lama.filter((k) => !ids.has(k.id))].slice(
      0,
      MAKS_INDEKS,
    );
    await AsyncStorage.setItem(KUNCI_INDEKS, JSON.stringify(gabung));
  } catch {
    // abaikan
  }
}

export async function simpanRiwayatKota(kota: HasilGeocoding): Promise<void> {
  if (kota.id === -1) return; // "Lokasi Saat Ini" bukan nama kota
  await simpanIndeksKota([kota]);
}

/* ---------- Kota terakhir dilihat ---------- */

export async function simpanKotaTerakhir(kota: HasilGeocoding): Promise<void> {
  try {
    await AsyncStorage.setItem(KUNCI_KOTA_TERAKHIR, JSON.stringify(kota));
  } catch {
    // abaikan
  }
}

export async function ambilKotaTerakhir(): Promise<HasilGeocoding | null> {
  try {
    const mentah = await AsyncStorage.getItem(KUNCI_KOTA_TERAKHIR);
    return mentah ? (JSON.parse(mentah) as HasilGeocoding) : null;
  } catch {
    return null;
  }
}
