import { ambilCuaca } from "./weatherService";
import { ambilKualitasUdara } from "./airQualityService";
import { ambilCache, simpanCache } from "./cacheRepository";
import {
  HasilCuacaOffline,
  KotaUntukCache,
} from "../../types/cache";

export const TTL_SEGAR_MS = 30 * 60 * 1000;
export const BATAS_CACHE_MS = 7 * 24 * 60 * 60 * 1000;

interface OpsiAmbil {
  paksaPerbarui?: boolean;
}

export async function ambilCuacaOfflineFirst(
  kota: KotaUntukCache,
  opsi: OpsiAmbil = {}
): Promise<HasilCuacaOffline> {
  const cache = await ambilCache(
    kota.latitude,
    kota.longitude
  );

  const umur = cache
    ? Date.now() - cache.disimpanPada
    : Infinity;

  // Cache masih segar: tidak perlu mengakses internet.
  if (
    cache &&
    umur < TTL_SEGAR_MS &&
    !opsi.paksaPerbarui
  ) {
    return { ...cache, sumber: "cache-segar" };
  }

  // Coba mengambil cuaca dan AQI terbaru.
  const dariJaringan = await Promise.all([
    ambilCuaca(kota.latitude, kota.longitude),
    ambilKualitasUdara(kota.latitude, kota.longitude),
  ]).catch(() => null);

  // Internet gagal: gunakan cache lama jika tersedia.
  if (!dariJaringan) {
    if (cache) {
      return { ...cache, sumber: "cache-basi" };
    }

    throw new Error(
      "Tidak ada koneksi dan belum ada data tersimpan"
    );
  }

  // Internet berhasil: simpan data baru ke cache.
  const [cuaca, kualitasUdara] = dariJaringan;

  try {
    await simpanCache(kota, cuaca, kualitasUdara);
  } catch {
    // Kegagalan menyimpan cache tidak membatalkan data baru.
  }

  return {
    cuaca,
    kualitasUdara,
    disimpanPada: Date.now(),
    sumber: "jaringan",
  };
}
