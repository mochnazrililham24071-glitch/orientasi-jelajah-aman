import { useState, useCallback } from "react";
import { View, Text, Button, Alert } from "react-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ambilSemuaFavorit, hapusFavorit } from "../../services/favoritStorage";
import { KotaFavorit } from "../../../types/favorit";

export default function TabRiwayat() {
  const [daftarFavorit, setDaftarFavorit] = useState<KotaFavorit[]>([]);

  useFocusEffect(
    useCallback(() => {
      ambilSemuaFavorit().then(setDaftarFavorit);
    }, [])
  );

  // Fungsi Konfirmasi Murni React Native Alert
  const mintaKonfirmasiHapus = (id: number, nama: string) => {
    Alert.alert(
      "Konfirmasi Hapus",
      `Yakin hapus ${nama}?`,
      [
        {
          text: "Batal",
          style: "cancel",
        },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            await hapusFavorit(id);
            setDaftarFavorit((prev) => prev.filter((k) => k.id !== id));
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "bold" }}>Kota Favorit</Text>

      {/* Informasi Jumlah Kota Tersimpan */}
      <Text style={{ fontSize: 14, color: "#666" }}>
        Tersimpan {daftarFavorit.length} kota
      </Text>

      {daftarFavorit.length === 0 && (
        <Text style={{ marginTop: 8 }}>Belum ada kota favorit</Text>
      )}

      {daftarFavorit.map((kota) => (
        <View
          key={kota.id}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingVertical: 8,
            borderBottomWidth: 1,
            borderBottomColor: "#eee",
          }}
        >
          <Text style={{ fontSize: 16 }}>{kota.nama}</Text>
          <Button
            title="Hapus"
            color="red"
            onPress={() => mintaKonfirmasiHapus(kota.id, kota.nama)}
          />
        </View>
      ))}
    </SafeAreaView>
  );
}