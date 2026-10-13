import { Text, View } from "react-native";
import { spacing, typeScale } from "../../constants/styles";

export default function Tentang() {
  return (
    <View
      style={{
        flex: 1,
        padding: spacing.besar,
        gap: spacing.sedang,
      }}
    >
      <Text
        accessible
        accessibilityLabel="Halaman Tentang Jelajah Aman"
        style={{
          fontSize: typeScale.judul,
          fontWeight: "bold",
        }}
      >
        Tentang Jelajah Aman
      </Text>

      <Text style={{ fontSize: typeScale.isi }}>
        Nama Aplikasi: Jelajah Aman
      </Text>

      <Text style={{ fontSize: typeScale.isi }}>Versi: 1.0.0</Text>

      <Text style={{ fontSize: typeScale.isi }}>
        Nama Pembuat: Moch. Nazril Ilham
      </Text>
    </View>
  );
}
