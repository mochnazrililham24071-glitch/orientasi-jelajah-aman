// src/app/detail/[kota].tsx
import { router, useLocalSearchParams } from "expo-router";
import { Button, View } from "react-native";
import WeatherCard from "../../components/WeatherCard";
import { useTema } from "../../context/TemaContext";

export default function HalamanDetail() {
  const { kota } = useLocalSearchParams<{ kota: string }>();
  const { warna } = useTema();

  return (
    <View
      style={{ flex: 1, padding: 16, gap: 16, backgroundColor: warna.latar }}
    >
      <WeatherCard kota={kota ?? ""} suhu={29} tingkatAQI="BAIK" />
      <Button
        title="Tambahkan ke Favorit"
        onPress={() =>
          router.push({
            pathname: "/tambah-favorit",
            params: {
              id: "0",
              nama: kota ?? "",
              lat: "0",
              lon: "0",
            },
          })
        }
      />
    </View>
  );
}
