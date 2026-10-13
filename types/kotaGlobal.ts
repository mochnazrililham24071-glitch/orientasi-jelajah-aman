export type KotaGlobal = {
  id: number;
  nama: string;
  negara: string;
  kodeNegara: string;
  latitude: number;
  longitude: number;
  populasi?: number;
};

export type CacheCuacaKota<TCuaca = unknown, TAqi = unknown> = {
  kota: KotaGlobal;
  cuaca: TCuaca;
  kualitasUdara: TAqi | null;
  disimpanPada: string;
};
