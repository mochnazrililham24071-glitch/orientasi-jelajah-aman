import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Button, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KotaFavorit } from "../../../types/favorit";
import { ambilSemuaFavorit, hapusFavorit } from "../../services/favoritStorage";

export default function TabRiwayat() {
  const [daftarFavorit, setDaftarFavorit] = useState<KotaFavorit[]>([]);
  const [modalTerbuka, setModalTerbuka] = useState(false);
  const [judulAlert, setJudulAlert] = useState("");
  const [pesanAlert, setPesanAlert] = useState("");
  const [kotaDipilih, setKotaDipilih] = useState<{
    id: number;
    nama: string;
  } | null>(null);
  const [sedangMenghapus, setSedangMenghapus] = useState(false);

  useFocusEffect(
    useCallback(() => {
      ambilSemuaFavorit()
        .then(setDaftarFavorit)
        .catch(() => {
          setJudulAlert("Gagal Memuat");
          setPesanAlert("Daftar kota favorit gagal dimuat.");
          setModalTerbuka(true);
        });
    }, []),
  );

  // Konfirmasi hapus menggunakan Modal lintas platform
  const mintaKonfirmasiHapus = (id: number, nama: string) => {
    setKotaDipilih({ id, nama });
    setJudulAlert("Konfirmasi Hapus");
    setPesanAlert(`Yakin hapus ${nama}?`);
    setModalTerbuka(true);
  };

  // Tutup alert
  const tutupAlert = () => {
    if (sedangMenghapus) return;
    setModalTerbuka(false);
    setKotaDipilih(null);
  };

  // Proses hapus kota favorit
  const konfirmasiHapus = async () => {
    if (!kotaDipilih || sedangMenghapus) return;

    const { id, nama } = kotaDipilih;
    setSedangMenghapus(true);

    try {
      await hapusFavorit(id);

      setDaftarFavorit((prev) => prev.filter((kota) => kota.id !== id));

      setKotaDipilih(null);
      setJudulAlert("Berhasil");
      setPesanAlert(`${nama} berhasil dihapus dari favorit.`);
    } catch {
      setKotaDipilih(null);
      setJudulAlert("Gagal");
      setPesanAlert(`Kota ${nama} gagal dihapus. Silakan coba lagi.`);
    } finally {
      setSedangMenghapus(false);
    }
  };

  const sedangKonfirmasi =
    kotaDipilih !== null && judulAlert === "Konfirmasi Hapus";

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

      {/* Alert untuk desktop/web dan HP */}
      <Modal
        visible={modalTerbuka}
        transparent
        animationType="fade"
        onRequestClose={tutupAlert}
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          <View
            style={styles.dialog}
            accessibilityRole="alert"
            accessibilityLabel={judulAlert}
          >
            <Text style={styles.judul}>{judulAlert}</Text>

            <Text style={styles.pesan}>{pesanAlert}</Text>

            <View style={styles.tombolContainer}>
              {sedangKonfirmasi && (
                <Pressable
                  accessibilityRole="button"
                  disabled={sedangMenghapus}
                  onPress={tutupAlert}
                  style={({ pressed }) => [
                    styles.tombol,
                    styles.tombolBatal,
                    pressed && styles.ditekan,
                  ]}
                >
                  <Text style={styles.teksBatal}>Batal</Text>
                </Pressable>
              )}

              <Pressable
                accessibilityRole="button"
                disabled={sedangMenghapus}
                onPress={() => {
                  if (sedangKonfirmasi) {
                    void konfirmasiHapus();
                  } else {
                    tutupAlert();
                  }
                }}
                style={({ pressed }) => [
                  styles.tombol,
                  sedangKonfirmasi ? styles.tombolHapus : styles.tombolUtama,
                  pressed && styles.ditekan,
                ]}
              >
                <Text style={styles.teksUtama}>
                  {sedangMenghapus
                    ? "Menghapus..."
                    : sedangKonfirmasi
                      ? "Hapus"
                      : "Mengerti"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  dialog: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  judul: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
    marginBottom: 12,
  },
  pesan: {
    fontSize: 16,
    lineHeight: 24,
    color: "#555",
    marginBottom: 24,
  },
  tombolContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: 10,
  },
  tombol: {
    minHeight: 44,
    minWidth: 88,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  tombolBatal: {
    backgroundColor: "#eee",
  },
  tombolUtama: {
    backgroundColor: "#2563eb",
  },
  tombolHapus: {
    backgroundColor: "#dc2626",
  },
  teksBatal: {
    color: "#333",
    fontWeight: "600",
  },
  teksUtama: {
    color: "#fff",
    fontWeight: "600",
  },
  ditekan: {
    opacity: 0.75,
  },
});
