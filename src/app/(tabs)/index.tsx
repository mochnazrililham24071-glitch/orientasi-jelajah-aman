import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Button,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AtribusiCuaca from "../../components/AtribusiCuaca";
import SearchBox from "../../components/SearchBox";
import WeatherCard from "../../components/WeatherCard";

import { labelKodeCuaca } from "../../constants/weatherCodes";
import { useDebounce } from "../../hooks/use-debounce";
import { ambilKualitasUdara } from "../../services/airQualityService";
import { ambilSemuaFavorit } from "../../services/favoritStorage";
import { cariKota } from "../../services/geocodingService";
import {
  ambilKoordinatSaatIni,
  mintaIzinLokasi,
} from "../../services/locationService";
import { konversiTingkatAQI } from "../../services/weatherAdapter";
import { ambilCuaca } from "../../services/weatherService";

import { HasilGeocoding } from "../../../types/geocoding";
import { DataCuacaLengkap, DataKualitasUdara } from "../../../types/weather";

const KUNCI_CACHE_CUACA = "@orientasi_jelajah_aman_cache_cuaca";

type CacheCuaca = {
  kota: HasilGeocoding;
  cuaca: DataCuacaLengkap;
  kualitasUdara: DataKualitasUdara;
  diperbaruiPada: string;
};

export default function HalamanUtama() {
  const [teksCari, setTeksCari] = useState("");
  const [hasilPencarian, setHasilPencarian] = useState<HasilGeocoding[]>([]);
  const [kotaTerpilih, setKotaTerpilih] = useState<HasilGeocoding | null>(null);
  const [cuaca, setCuaca] = useState<DataCuacaLengkap | null>(null);
  const [kualitasUdara, setKualitasUdara] = useState<DataKualitasUdara | null>(
    null,
  );
  const [sedangMemuat, setSedangMemuat] = useState(false);
  const [pesanError, setPesanError] = useState<string | null>(null);
  const [pesanLokasi, setPesanLokasi] = useState<string | null>(null);
  const [sudahFavorit, setSudahFavorit] = useState(false);
  const [waktuPembaruan, setWaktuPembaruan] = useState<string | null>(null);
  const [menggunakanCache, setMenggunakanCache] = useState(false);

  const teksTertunda = useDebounce(teksCari, 500);
  const requestIdRef = useRef(0);

  // Memulihkan data cuaca terakhir saat aplikasi dibuka.
  useEffect(() => {
    async function pulihkanCache() {
      try {
        const tersimpan = await AsyncStorage.getItem(KUNCI_CACHE_CUACA);

        if (tersimpan) {
          const cache: CacheCuaca = JSON.parse(tersimpan);

          setKotaTerpilih(cache.kota);
          setCuaca(cache.cuaca);
          setKualitasUdara(cache.kualitasUdara);
          setWaktuPembaruan(cache.diperbaruiPada);
          setMenggunakanCache(true);
        }
      } catch {
        setPesanError("Data cuaca tersimpan tidak dapat dibaca.");
      }
    }

    pulihkanCache();
  }, []);

  const cekStatusFavorit = useCallback(async (kota: HasilGeocoding | null) => {
    if (!kota) {
      setSudahFavorit(false);
      return;
    }

    try {
      const daftar = await ambilSemuaFavorit();
      const ada = daftar.some((k) => k.id === kota.id || k.nama === kota.name);
      setSudahFavorit(ada);
    } catch {
      setSudahFavorit(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cekStatusFavorit(kotaTerpilih);
    }, [kotaTerpilih, cekStatusFavorit]),
  );

  // Pencarian kota menggunakan API saat tersedia.
  useEffect(() => {
    if (teksTertunda.trim().length === 0) {
      setHasilPencarian([]);
      return;
    }

    let masihAktif = true;

    cariKota(teksTertunda)
      .then((hasil) => {
        if (masihAktif) setHasilPencarian(hasil);
      })
      .catch(() => {
        if (masihAktif) setHasilPencarian([]);
      });

    return () => {
      masihAktif = false;
    };
  }, [teksTertunda]);

  async function pilihKota(kota: HasilGeocoding) {
    setKotaTerpilih(kota);
    void cekStatusFavorit(kota);

    const idSaatIni = ++requestIdRef.current;

    setSedangMemuat(true);
    setPesanError(null);
    setMenggunakanCache(false);

    try {
      const [dataCuaca, dataAQI] = await Promise.all([
        ambilCuaca(kota.latitude, kota.longitude),
        ambilKualitasUdara(kota.latitude, kota.longitude),
      ]);

      if (idSaatIni !== requestIdRef.current) return;

      const cacheBaru: CacheCuaca = {
        kota,
        cuaca: dataCuaca,
        kualitasUdara: dataAQI,
        diperbaruiPada: new Date().toISOString(),
      };

      // Simpan hasil terbaru agar bisa dibuka saat offline.
      await AsyncStorage.setItem(KUNCI_CACHE_CUACA, JSON.stringify(cacheBaru));

      if (idSaatIni !== requestIdRef.current) return;

      setCuaca(dataCuaca);
      setKualitasUdara(dataAQI);
      setWaktuPembaruan(cacheBaru.diperbaruiPada);
      setMenggunakanCache(false);
    } catch {
      if (idSaatIni !== requestIdRef.current) return;

      // Jika API gagal, gunakan cache untuk kota yang sama.
      try {
        const tersimpan = await AsyncStorage.getItem(KUNCI_CACHE_CUACA);

        if (idSaatIni !== requestIdRef.current) return;

        if (tersimpan) {
          const cache: CacheCuaca = JSON.parse(tersimpan);

          const kotaSama =
            cache.kota.name.toLowerCase() === kota.name.toLowerCase() &&
            Math.abs(cache.kota.latitude - kota.latitude) < 0.01 &&
            Math.abs(cache.kota.longitude - kota.longitude) < 0.01;

          if (kotaSama) {
            setKotaTerpilih(cache.kota);
            setCuaca(cache.cuaca);
            setKualitasUdara(cache.kualitasUdara);
            setWaktuPembaruan(cache.diperbaruiPada);
            setMenggunakanCache(true);
            setPesanError(
              "Offline: menampilkan data tersimpan, bukan data terkini.",
            );
          } else {
            setPesanError(
              "Data kota ini belum tersimpan. Hubungkan internet untuk mengambil data.",
            );
          }
        } else {
          setPesanError(
            "Belum ada data offline. Hubungkan internet untuk mengambil data cuaca.",
          );
        }
      } catch {
        setPesanError("Gagal membaca data offline.");
      }
    } finally {
      if (idSaatIni === requestIdRef.current) {
        setSedangMemuat(false);
      }
    }
  }

  async function gunakanLokasiSaatIni() {
    try {
      const status = await mintaIzinLokasi();

      if (status === "denied") {
        setPesanLokasi("Izin lokasi ditolak. Silakan cari kota secara manual.");
        return;
      }

      if (status === "unavailable") {
        setPesanLokasi(
          "Layanan lokasi tidak aktif. Silakan cari kota secara manual.",
        );
        return;
      }

      setPesanLokasi(null);
      const koordinat = await ambilKoordinatSaatIni();

      await pilihKota({
        id: -1,
        name: "Lokasi Saat Ini",
        latitude: koordinat.latitude,
        longitude: koordinat.longitude,
        country: "",
      });
    } catch {
      setPesanLokasi(
        "Lokasi gagal diperoleh. Silakan cari kota secara manual.",
      );
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <ScrollView>
        <SearchBox onCari={setTeksCari} />

        <View style={{ marginTop: 12, marginBottom: 8 }}>
          <Button
            title="Gunakan Lokasi Saat Ini"
            onPress={gunakanLokasiSaatIni}
          />
        </View>

        {pesanLokasi && (
          <Text style={{ marginBottom: 8, color: "#d97706" }}>
            {pesanLokasi}
          </Text>
        )}

        {hasilPencarian.map((kota) => (
          <TouchableOpacity key={kota.id} onPress={() => pilihKota(kota)}>
            <Text style={{ paddingVertical: 8 }}>{kota.name}</Text>
          </TouchableOpacity>
        ))}

        {sedangMemuat && <ActivityIndicator style={{ marginTop: 16 }} />}

        {pesanError && (
          <View style={{ marginTop: 16 }}>
            <Text>{pesanError}</Text>
            <Button
              title="Coba Lagi"
              onPress={() => {
                if (kotaTerpilih) void pilihKota(kotaTerpilih);
              }}
            />
          </View>
        )}

        {cuaca && kualitasUdara && kotaTerpilih && !sedangMemuat && (
          <View style={{ gap: 12, marginTop: 16 }}>
            {menggunakanCache && (
              <Text style={{ color: "#b45309" }}>
                Mode offline — data terakhir tersimpan
              </Text>
            )}

            {waktuPembaruan && (
              <Text style={{ fontSize: 12, color: "#666" }}>
                Data diperbarui:{" "}
                {new Date(waktuPembaruan).toLocaleString("id-ID")}
              </Text>
            )}

            <WeatherCard
              kota={kotaTerpilih.name}
              suhu={cuaca.saatIni.suhu}
              tingkatAQI={konversiTingkatAQI(kualitasUdara.indeksAQI)}
              indeksAQI={kualitasUdara.indeksAQI}
            />

            <Button
              title={sudahFavorit ? "Sudah di Favorit" : "Tambahkan ke Favorit"}
              disabled={sudahFavorit}
              onPress={() =>
                router.push({
                  pathname: "/tambah-favorit",
                  params: {
                    id: String(kotaTerpilih.id),
                    nama: kotaTerpilih.name,
                    lat: String(kotaTerpilih.latitude),
                    lon: String(kotaTerpilih.longitude),
                  },
                })
              }
            />

            <Text style={{ fontSize: 14 }}>
              Maks: {cuaca.harian.suhuMaksimal[0]}°C | Min:{" "}
              {cuaca.harian.suhuMinimal[0]}°C
            </Text>

            <Text style={{ fontSize: 12, color: "#888" }}>
              Kondisi: {labelKodeCuaca(cuaca.saatIni.kodeCuaca)} • Angin{" "}
              {cuaca.saatIni.kecepatanAngin} km/j
            </Text>

            <Text style={{ fontSize: 14, color: "#555" }}>
              PM2.5: {kualitasUdara.pm25} µg/m³ | PM10: {kualitasUdara.pm10}{" "}
              µg/m³
            </Text>
          </View>
        )}

        <View style={{ marginTop: 16 }}>
          <AtribusiCuaca />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
