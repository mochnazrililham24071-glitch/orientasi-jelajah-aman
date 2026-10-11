import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Button,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";

import SearchBox from "../../../components/SearchBox";
import WeatherCard from "../../../components/WeatherCard";
import AtribusiCuaca from "../../components/AtribusiCuaca";

import { useDebounce } from "../../hooks/use-debounce";
import { cariKota } from "../../services/geocodingService";
import { ambilCuaca } from "../../services/weatherService";
import { ambilKualitasUdara } from "../../services/airQualityService";
import { konversiTingkatAQI } from "../../services/weatherAdapter";
import { labelKodeCuaca } from "../../../constants/weatherCodes";

import { HasilGeocoding } from "../../../types/geocoding";
import {
  DataCuacaLengkap,
  DataKualitasUdara,
} from "../../../types/weather";

import { mintaIzinLokasi, ambilKoordinatSaatIni } from "../../services/locationService";
import { ambilSemuaFavorit } from "../../services/favoritStorage";

export default function HalamanUtama() {
  const [teksCari, setTeksCari] = useState("");
  const [hasilPencarian, setHasilPencarian] = useState<HasilGeocoding[]>([]);
  const [kotaTerpilih, setKotaTerpilih] = useState<HasilGeocoding | null>(null);
  const [cuaca, setCuaca] = useState<DataCuacaLengkap | null>(null);
  const [kualitasUdara, setKualitasUdara] = useState<DataKualitasUdara | null>(null);
  const [sedangMemuat, setSedangMemuat] = useState(false);
  const [pesanError, setPesanError] = useState<string | null>(null);
  const [pesanLokasi, setPesanLokasi] = useState<string | null>(null);
  
  // State untuk melacak status favorit kota
  const [sudahFavorit, setSudahFavorit] = useState(false);

  const teksTertunda = useDebounce(teksCari, 500);
  const requestIdRef = useRef(0);

  // Fungsi untuk memeriksa apakah kotaTerpilih sudah ada di AsyncStorage
  const cekStatusFavorit = useCallback(async (kota: HasilGeocoding | null) => {
    if (!kota) {
      setSudahFavorit(false);
      return;
    }
    const daftar = await ambilSemuaFavorit();
    const ada = daftar.some(
      (k) => k.id === kota.id || k.nama === kota.name
    );
    setSudahFavorit(ada);
  }, []);

  // Periksa status favorit setiap kali kotaTerpilih berubah atau tab beranda difokuskan kembali
  useFocusEffect(
    useCallback(() => {
      cekStatusFavorit(kotaTerpilih);
    }, [kotaTerpilih, cekStatusFavorit])
  );

  useEffect(() => {
    if (teksTertunda.trim().length === 0) {
      setHasilPencarian([]);
      return;
    }

    cariKota(teksTertunda)
      .then(setHasilPencarian)
      .catch(() => setHasilPencarian([]));
  }, [teksTertunda]);

  async function pilihKota(kota: HasilGeocoding) {
    setKotaTerpilih(kota);
    cekStatusFavorit(kota);

    const idSaatIni = ++requestIdRef.current;

    setSedangMemuat(true);
    setPesanError(null);

    try {
      const [dataCuaca, dataAQI] = await Promise.all([
        ambilCuaca(kota.latitude, kota.longitude),
        ambilKualitasUdara(kota.latitude, kota.longitude),
      ]);

      if (idSaatIni !== requestIdRef.current) return;

      setCuaca(dataCuaca);
      setKualitasUdara(dataAQI);
    } catch (err) {
      if (idSaatIni !== requestIdRef.current) return;

      setPesanError("Gagal memuat data cuaca. Periksa koneksi internet Anda.");
    } finally {
      if (idSaatIni === requestIdRef.current) {
        setSedangMemuat(false);
      }
    }
  }

  async function gunakanLokasiSaatIni() {
    const status = await mintaIzinLokasi();
    if (status === "denied") {
      setPesanLokasi("Izin lokasi ditolak. Silakan cari kota secara manual di atas.");
      return;
    }
    if (status === "unavailable") {
      setPesanLokasi("Layanan lokasi tidak aktif di perangkat ini. Silakan cari kota secara manual.");
      return;
    }

    setPesanLokasi(null);
    const koordinat = await ambilKoordinatSaatIni();
    pilihKota({
      id: -1,
      name: "Lokasi Saat Ini",
      latitude: koordinat.latitude,
      longitude: koordinat.longitude,
      country: "",
    });
  }

  return (
    <SafeAreaView style={{ flex: 1, padding: 16, gap: 16 }}>
      <ScrollView>
        <SearchBox onCari={setTeksCari} />

        <Button title="Gunakan Lokasi Saat Ini" onPress={gunakanLokasiSaatIni} />
        {pesanLokasi && <Text>{pesanLokasi}</Text>}

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
              onPress={() => kotaTerpilih && pilihKota(kotaTerpilih)}
            />
          </View>
        )}

        {cuaca && kualitasUdara && kotaTerpilih && !sedangMemuat && (
          <View style={{ gap: 12, marginTop: 16 }}>
            <WeatherCard
              kota={kotaTerpilih.name}
              suhu={cuaca.saatIni.suhu}
              tingkatAQI={konversiTingkatAQI(kualitasUdara.indeksAQI)}
              indeksAQI={kualitasUdara.indeksAQI}
            />

            {/* Tombol Tambahkan ke Favorit (dinonaktifkan jika sudah favorit) */}
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
              PM2.5: {kualitasUdara.pm25} µg/m³ | PM10: {kualitasUdara.pm10} µg/m³
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