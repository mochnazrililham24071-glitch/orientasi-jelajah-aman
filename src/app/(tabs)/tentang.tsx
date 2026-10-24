import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Teks from "../../components/Teks";
import { typeScale } from "../../constants/styles";
import { useTema } from "../../context/TemaContext";

export default function TabDetail() {
  const { warna } = useTema();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: warna.latar }]}>
      <View
        style={[styles.kartu, { backgroundColor: warna.kartu ?? warna.latar }]}
      >
        <View style={styles.header}>
          <Teks
            accessibilityLabel="Nama aplikasi Jelajah Aman"
            style={[
              styles.judul,
              { fontSize: typeScale.judul, color: warna.teks },
            ]}
          >
            Jelajah Aman
          </Teks>

          <Teks style={[styles.subjudul, { color: warna.teks }]}>
            Informasi Aplikasi
          </Teks>
        </View>

        <View style={[styles.garis, { backgroundColor: warna.teks }]} />

        <View style={styles.baris}>
          <Teks style={[styles.label, { color: warna.teks }]}>
            Versi Aplikasi
          </Teks>
          <Teks style={[styles.nilai, { color: warna.teks }]}>1.0.0</Teks>
        </View>

        <View style={[styles.pemisah, { borderBottomColor: warna.teks }]} />

        <View style={styles.baris}>
          <Teks style={[styles.label, { color: warna.teks }]}>Pembuat</Teks>
          <Teks style={[styles.nilai, { color: warna.teks }]}>
            Moch. Nazril Ilham
          </Teks>
        </View>

        <View style={styles.baris}>
          <Teks style={[styles.label, { color: warna.teks }]}>NIM</Teks>
          <Teks style={[styles.nilai, { color: warna.teks }]}>60324071</Teks>
        </View>
      </View>

      <View style={styles.footer}>
        <Teks style={[styles.footerText, { color: warna.teks }]}>
          Jelajah Aman
        </Teks>
        <Teks style={[styles.footerText, { color: warna.teks }]}>
          Versi 1.0.0
        </Teks>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
  },
  kartu: {
    borderRadius: 14,
    padding: 20,
    marginTop: 12,
    elevation: 2,
  },
  header: {
    alignItems: "center",
    paddingVertical: 12,
    gap: 6,
  },
  judul: {
    fontWeight: "bold",
    textAlign: "center",
  },
  subjudul: {
    fontSize: 14,
    opacity: 0.75,
  },
  garis: {
    height: 2,
    opacity: 0.2,
    marginVertical: 12,
  },
  baris: {
    paddingVertical: 12,
    gap: 5,
  },
  label: {
    fontSize: 13,
    opacity: 0.7,
  },
  nilai: {
    fontSize: 16,
    fontWeight: "600",
  },
  pemisah: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    opacity: 0.25,
  },
  footer: {
    alignItems: "center",
    paddingBottom: 12,
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    opacity: 0.6,
  },
});
