import { View, Text } from "react-native";
import { Link } from "expo-router";

interface RiwayatListProps {
  daftarKota: string[];
}

export default function RiwayatList({
  daftarKota,
}: RiwayatListProps) {
  return (
    <View>
      {daftarKota.map((kota) => (
        <Link
          key={kota}
          href={{
            pathname: "/detail/[kota]",
            params: { kota },
          }}
          style={{
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              padding: 12,
            }}
          >
            {kota}
          </Text>
        </Link>
      ))}
    </View>
  );
}