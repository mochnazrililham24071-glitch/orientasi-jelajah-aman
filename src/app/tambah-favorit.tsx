import { useState, useEffect } from "react";
import { View, Text, Button } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { tambahFavorit, ambilSemuaFavorit } from "../services/favoritStorage";

export default function ModalTambahFavorit() {
  const { id, nama, lat, lon } = useLocalSearchParams<{
    id: string;
    nama: string;
    lat: string;
    lon: string;
  }>();

  const [sudahAda, setSudahAda] = useState(false);

  useEffect(() => {
    async function cekStatus() {
      const daftar = await ambilSemuaFavorit();
      const ada = daftar.some((k) => k.id === Number(id) || k.nama === nama);
      setSudahAda(ada);
    }
    cekStatus();
  }, [id, nama]);

  async function simpan() {
    await tambahFavorit({
      id: id ? Number(id) : Date.now(),
      nama: nama || "Lokasi Saat Ini",
      latitude: Number(lat),
      longitude: Number(lon),
    });
    router.back();
  }

  return (
    <View style={{ padding: 16, gap: 16 }}>
      {sudahAda ? (
        <>
          <Text>{nama} sudah ada di dalam daftar favorit Anda.</Text>
          <Button title="Kembali" onPress={() => router.back()} />
        </>
      ) : (
        <>
          <Text>Tambahkan {nama} ke daftar favorit?</Text>
          <Button title="Simpan" onPress={simpan} />
          <Button title="Batal" color="#888" onPress={() => router.back()} />
        </>
      )}
    </View>
  );
}