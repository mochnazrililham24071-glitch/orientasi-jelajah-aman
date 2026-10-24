# Jelajah Aman

Aplikasi cuaca dan kualitas udara berbasis **Expo (React Native + TypeScript)** yang dapat digunakan secara offline melalui penyimpanan cache lokal menggunakan SQLite.

## Status Data: Cache-Segar, Cache-Basi, dan First-Run Offline

- **Cache-segar:** Data yang tersimpan di perangkat berumur kurang dari 30 menit (_Time to Live_ / TTL), sehingga aplikasi dapat langsung menggunakannya tanpa mengambil data baru dari internet.
- **Cache-basi:** Data yang tersimpan berumur 30 menit atau lebih dan koneksi internet gagal dijangkau. Aplikasi tetap menampilkan data lama dengan label oranye: **"Mode offline - data tersimpan mungkin sudah usang"**.
- **First-run offline:** Belum ada cache yang tersimpan dan perangkat tidak memiliki koneksi internet. Aplikasi tidak dapat menampilkan data cuaca dan kualitas udara, sehingga pengguna hanya melihat pesan kesalahan beserta tombol **Coba Lagi**.

Label status ini membantu mengetahui apakah informasi suhu dan kualitas udara yang ditampilkan merupakan data terbaru atau salinan lama yang tersimpan di perangkat. Hal ini penting agar pengguna dapat mempertimbangkan kebaruan data sebelum mengambil keputusan, terutama ketika kualitas udara berada pada kondisi tidak sehat.

## Fitur Penyempurnaan UTS

1. **Ikon tab bar dan label navigasi** — setiap tab menggunakan ikon Ionicons dari pustaka `@expo/vector-icons`. Label tab Riwayat diperbarui menjadi **Favorit & Riwayat**.
2. **Riwayat pencarian** — menyimpan maksimal 10 kota terakhir menggunakan AsyncStorage. Pengguna dapat mengetuk salah satu kota untuk menjalankan pencarian kembali di halaman Beranda.
3. **Penghapusan cache per kota** — menyediakan tombol **Hapus** pada daftar **Tersimpan di perangkat**, dilengkapi dialog konfirmasi menggunakan `Alert` pada perangkat mobile dan `window.confirm` pada browser web.
4. **Tema Terang, Gelap, dan Ikuti Sistem** — pengguna dapat memilih tema melalui menu Pengaturan. Pilihan disimpan dan diterapkan pada seluruh layar aplikasi.

### Catatan Platform

Pada perangkat mobile, cache menggunakan SQLite melalui `cacheRepository.ts`. Pada browser web, cache menggunakan `cacheRepository.web.ts` berbasis AsyncStorage dengan fungsi yang sama.

# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
