import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CacheCuacaKota, KotaGlobal } from "../types/kotaGlobal";

const PREFIX_CACHE_CUACA = "@jelajah_aman/cache-cuaca/v1/";
const KEY_KOTA_TERAKHIR = "@jelajah_aman/kota-terakhir/v1";

function kunciKota(kota: KotaGlobal): string {
  // ID GeoNames/global dataset diutamakan. Koordinat menjadi fallback.
  const identitas = Number.isFinite(kota.id)
    ? String(kota.id)
    : `${kota.latitude.toFixed(4)},${kota.longitude.toFixed(4)}`;
  return `${PREFIX_CACHE_CUACA}${identitas}`;
}

export async function simpanCacheCuaca<TCuaca, TAqi>(
  data: CacheCuacaKota<TCuaca, TAqi>
): Promise<void> {
  const payload: CacheCuacaKota<TCuaca, TAqi> = {
    ...data,
    disimpanPada: data.disimpanPada || new Date().toISOString(),
  };

  await AsyncStorage.multiSet([
    [kunciKota(data.kota), JSON.stringify(payload)],
    [KEY_KOTA_TERAKHIR, JSON.stringify(data.kota)],
  ]);
}

export async function ambilCacheCuaca<TCuaca = unknown, TAqi = unknown>(
  kota: KotaGlobal
): Promise<CacheCuacaKota<TCuaca, TAqi> | null> {
  const json = await AsyncStorage.getItem(kunciKota(kota));
  if (!json) return null;

  try {
    return JSON.parse(json) as CacheCuacaKota<TCuaca, TAqi>;
  } catch {
    await AsyncStorage.removeItem(kunciKota(kota));
    return null;
  }
}

export async function ambilKotaTerakhir(): Promise<KotaGlobal | null> {
  const json = await AsyncStorage.getItem(KEY_KOTA_TERAKHIR);
  if (!json) return null;

  try {
    return JSON.parse(json) as KotaGlobal;
  } catch {
    await AsyncStorage.removeItem(KEY_KOTA_TERAKHIR);
    return null;
  }
}

export async function hapusCacheCuaca(kota: KotaGlobal): Promise<void> {
  await AsyncStorage.removeItem(kunciKota(kota));
}

export async function hapusSemuaCacheCuaca(): Promise<void> {
  const semuaKunci = await AsyncStorage.getAllKeys();
  const kunciCache = semuaKunci.filter(
    (key) => key.startsWith(PREFIX_CACHE_CUACA) || key === KEY_KOTA_TERAKHIR
  );
  if (kunciCache.length > 0) {
    await AsyncStorage.multiRemove(kunciCache);
  }
}
