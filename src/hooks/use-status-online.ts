import NetInfo from "@react-native-community/netinfo";

import { HasilGeocoding } from "../../types/geocoding";
import { DataCuacaLengkap, DataKualitasUdara } from "../../types/weather";

import { KOTA_BAWAAN } from "../constants/kotaBawaan";
import { ambilKualitasUdara } from "../services/airQualityService";
import {
  ambilCache,
  ambilRiwayatKota,
  simpanCache,
  simpanIndeksKota,
} from "../services/cacheService";
import { cariKota } from "../services/geocodingService";
import { ambilCuaca } from "../services/weatherService";

export type HasilCuacaOffline = {
  cuaca: DataCuacaLengkap;
  aqi: DataKualitasUdara;
  dariCache: boolean;
  waktu: number; // kapan data ini diambil dari server
};

async function cekOnline(): Promise<boolean> {
  try {
    const s = await NetInfo.fetch();
    return !!s.isConnected && s.isInternetReachable !== false;
  } catch {
    return false;
  }
}

// Request yang menggantung saat sinyal jelek dianggap gagal setelah batas waktu
function denganTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

// Dibulatkan 2 desimal (~1 km) agar lokasi GPS yang berdekatan memakai cache yang sama
function kunciCuaca(lat: number, lon: number) {
  return `cuaca:${lat.toFixed(2)},${lon.toFixed(2)}`;
}

export async function ambilCuacaOffline(
  lat: number,
  lon: number,
): Promise<HasilCuacaOffline> {
  const kunci = kunciCuaca(lat, lon);

  if (await cekOnline()) {
    try {
      const [cuaca, aqi] = await denganTimeout(
        Promise.all([ambilCuaca(lat, lon), ambilKualitasUdara(lat, lon)]),
        10000,
      );
      await simpanCache(kunci, { cuaca, aqi });
      return { cuaca, aqi, dariCache: false, waktu: Date.now() };
    } catch {
      // lanjut ke cache
    }
  }

  const cache = await ambilCache<{
    cuaca: DataCuacaLengkap;
    aqi: DataKualitasUdara;
  }>(kunci);
  if (cache) {
    return { ...cache.data, dariCache: true, waktu: cache.waktu };
  }
  throw new Error("Tidak ada data tersimpan");
}

/* ---------- Pencarian kota ---------- */

async function cariLokal(
  kata: string,
  kunci: string,
): Promise<HasilGeocoding[]> {
  const cache = await ambilCache<HasilGeocoding[]>(kunci);
  const riwayat = await ambilRiwayatKota();

  const semua = [...(cache?.data ?? []), ...riwayat, ...KOTA_BAWAAN];
  const dilihat = new Set<string>();
  const cocok: HasilGeocoding[] = [];

  for (const k of semua) {
    if (!k.name.toLowerCase().includes(kata)) continue;
    const id = `${k.name.toLowerCase()}|${k.latitude.toFixed(1)}|${k.longitude.toFixed(1)}`;
    if (dilihat.has(id)) continue;
    dilihat.add(id);
    cocok.push(k);
  }

  // Yang diawali kata kunci ditaruh paling atas
  cocok.sort((a, b) => {
    const aa = a.name.toLowerCase().startsWith(kata) ? 0 : 1;
    const bb = b.name.toLowerCase().startsWith(kata) ? 0 : 1;
    return aa - bb;
  });

  return cocok.slice(0, 10);
}

export async function cariKotaOffline(teks: string): Promise<HasilGeocoding[]> {
  const kata = teks.trim().toLowerCase();
  if (!kata) return [];
  const kunci = `cari:${kata}`;

  if (await cekOnline()) {
    try {
      const hasil = await denganTimeout(cariKota(teks), 6000);
      if (hasil.length > 0) {
        await simpanCache(kunci, hasil);
        await simpanIndeksKota(hasil); // semua kota di hasil bisa dicari offline nanti
        return hasil;
      }
    } catch {
      // lanjut ke pencarian lokal
    }
  }

  return cariLokal(kata, kunci);
}
