import { HasilGeocoding } from "../../types/geocoding";
import { DataCuacaLengkap, DataKualitasUdara } from "../../types/weather";

import { ambilKualitasUdara } from "./airQualityService";
import { ambilCache, ambilRiwayatKota, simpanCache } from "./cacheService";
import { cariKota } from "./geocodingService";
import { ambilCuaca } from "./weatherService";

export type HasilCuacaOffline = {
  cuaca: DataCuacaLengkap;
  aqi: DataKualitasUdara;
  dariCache: boolean;
  waktu: number; // kapan data ini diambil dari server
};

// Dibulatkan 2 desimal (~1 km) agar lokasi GPS yang berdekatan memakai cache yang sama
function kunciCuaca(lat: number, lon: number) {
  return `cuaca:${lat.toFixed(2)},${lon.toFixed(2)}`;
}

export async function ambilCuacaOffline(
  lat: number,
  lon: number,
): Promise<HasilCuacaOffline> {
  const kunci = kunciCuaca(lat, lon);

  try {
    const [cuaca, aqi] = await Promise.all([
      ambilCuaca(lat, lon),
      ambilKualitasUdara(lat, lon),
    ]);
    await simpanCache(kunci, { cuaca, aqi });
    return { cuaca, aqi, dariCache: false, waktu: Date.now() };
  } catch (err) {
    const cache = await ambilCache<{
      cuaca: DataCuacaLengkap;
      aqi: DataKualitasUdara;
    }>(kunci);
    if (cache) {
      return { ...cache.data, dariCache: true, waktu: cache.waktu };
    }
    throw err;
  }
}

export async function cariKotaOffline(teks: string): Promise<HasilGeocoding[]> {
  const kata = teks.trim().toLowerCase();
  const kunci = `cari:${kata}`;

  try {
    const hasil = await cariKota(teks);
    await simpanCache(kunci, hasil);
    return hasil;
  } catch {
    // 1) hasil pencarian yang persis sama pernah disimpan
    const cache = await ambilCache<HasilGeocoding[]>(kunci);
    if (cache) return cache.data;

    // 2) cari di riwayat kota yang pernah dipilih
    const riwayat = await ambilRiwayatKota();
    return riwayat.filter((k) => k.name.toLowerCase().includes(kata));
  }
}
