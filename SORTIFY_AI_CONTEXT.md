# Sortify --- Panduan Proyek untuk AI Agent di VS Code

> Dokumen ini menjadi konteks utama bagi AI coding agent (misalnya
> GitHub Copilot, Continue, Cline, Roo Code, atau agent lain) saat
> membantu mengembangkan Sortify.
>
> **Aturan utama:** baca dokumen ini dan periksa kondisi repository yang
> sebenarnya sebelum mengubah kode. Jangan menganggap semua fitur atau
> file yang disebut sebagai rencana sudah tersedia.

------------------------------------------------------------------------

## 1. Identitas dan tujuan proyek

**Nama proyek:** Sortify\
**Jenis aplikasi:** aplikasi web untuk membantu pengelolaan dan
penyortiran paket marketplace berdasarkan barcode/resi.\
**Tujuan utama:** Seller mengimpor daftar pesanan, lalu Petugas memindai
barcode paket. Sistem mengenali paket dan ekspedisi secara otomatis
berdasarkan data paket dan aturan prefix yang dikelola Admin.

Sortify bukan aplikasi marketplace dan tidak bertujuan menggantikan
sistem marketplace atau ekspedisi. Untuk versi yang sedang dikembangkan,
data pesanan diperoleh dari file Excel/CSV yang diunggah Seller. Jangan
menambahkan integrasi API marketplace atau ekspedisi kecuali diminta
secara eksplisit.

### Prinsip produk

1.  Data paket berasal dari file impor Seller.
2.  Pemindaian dilakukan berdasarkan barcode/resi yang tersimpan di
    database.
3.  Pengenalan ekspedisi dilakukan menggunakan aturan prefix yang
    dikelola Admin.
4.  Seluruh percobaan scan harus tercatat, termasuk scan gagal.
5.  Data lama tidak boleh tertimpa diam-diam oleh proses import.
6.  Fitur harus mengikuti role dan hak akses pengguna.
7.  Utamakan implementasi yang sederhana, dapat diuji, dan mudah
    dipelihara.

------------------------------------------------------------------------

## 2. Teknologi dan lingkungan pengembangan

Teknologi yang telah dipilih:

-   **Framework:** Next.js dengan App Router.
-   **Bahasa:** TypeScript.
-   **Database:** PostgreSQL.
-   **ORM:** Prisma ORM versi 7.x.
-   **UI:** Tailwind CSS dan shadcn/ui.
-   **Linting:** ESLint.
-   **React Compiler:** diaktifkan pada setup awal.
-   **Direktori source:** `src/`.
-   **Package manager:** npm (gunakan `package-lock.json` yang ada;
    jangan mengganti package manager tanpa alasan dan persetujuan).

Lingkungan pengembangan yang diketahui:

-   OS: Windows 11.
-   Terminal yang sering digunakan: Git Bash.
-   Lokasi proyek saat terakhir dikonfirmasi: `D:\Project Web\sortify`.
-   Database PostgreSQL lokal: `sortify`.
-   Host database: `localhost:5432`.
-   Branch Git terakhir yang terlihat: `main`.

### Versi dan konfigurasi yang perlu diperiksa

Versi dapat berubah. Sebelum memberi instruksi yang bergantung pada
versi, periksa:

``` bash
node -v
npm -v
npx next --version
npx prisma -v
```

Jangan mengasumsikan dokumentasi Prisma versi lama berlaku untuk Prisma
7. Periksa konfigurasi proyek terlebih dahulu.

------------------------------------------------------------------------

## 3. Kondisi setup yang sudah pernah berhasil

Hal-hal berikut telah berhasil dilakukan sebelumnya:

-   Proyek Next.js berjalan menggunakan `npm run dev`.
-   PostgreSQL aktif pada port `5432`.
-   Database `sortify` berhasil dibuat ulang.
-   Prisma 7 telah dikonfigurasi.
-   `npx prisma validate` berhasil.
-   Migration awal `init_sortify` telah berhasil diterapkan.
-   `npx prisma migrate status` menghasilkan:

``` text
1 migration found in prisma/migrations
Database schema is up to date!
```

-   `npx prisma studio` berhasil dibuka dan tujuh tabel dasar terlihat.

Konfigurasi Prisma yang telah digunakan:

-   Schema: `prisma/schema.prisma`
-   File konfigurasi Prisma: `prisma7.config.ts`
-   Generator menggunakan provider `prisma-client`.
-   Output Prisma Client: `generated/prisma`.

**Penting:** Sebelum mengubah atau membuat file, periksa repository
aktual. Jangan membuat ulang file konfigurasi yang sudah ada atau
mengasumsikan nama file berbeda.

------------------------------------------------------------------------

## 4. Peran pengguna dan hak akses

Sortify memiliki tiga role:

### 4.1 Admin

Admin bertanggung jawab atas konfigurasi dan pengelolaan sistem.

Kemampuan yang direncanakan:

-   Login dan logout.
-   Mengelola akun pengguna.
-   Membuat akun Petugas dan Seller.
-   Mengelola data marketplace.
-   Mengelola data toko.
-   Menetapkan Seller yang mengelola toko.
-   Mengelola data ekspedisi.
-   Mengelola aturan prefix ekspedisi.
-   Melihat data paket.
-   Melihat seluruh riwayat scan.
-   Memantau statistik dan kondisi paket.

Admin adalah pihak yang membuat akun Petugas dan Seller. Jangan
menyediakan pendaftaran publik untuk role tersebut kecuali diminta.

### 4.2 Petugas

Petugas menjalankan kegiatan pemindaian dan penanganan paket.

Kemampuan yang direncanakan:

-   Login dan logout.
-   Membuka halaman scan.
-   Memindai barcode paket.
-   Melihat hasil scan.
-   Melihat informasi paket yang ditemukan.
-   Melihat riwayat scan sesuai kebijakan akses aplikasi.
-   Memperbarui status pengamanan paket sesuai kewenangan.

Petugas tidak mengelola master data marketplace, toko, ekspedisi, atau
prefix.

### 4.3 Seller

Seller mengelola toko yang ditugaskan kepadanya dan memasukkan daftar
pesanan.

Kemampuan yang direncanakan:

-   Login dan logout.
-   Melihat toko yang menjadi tanggung jawabnya.
-   Memilih salah satu toko yang dikelolanya saat melakukan import.
-   Mengunggah file Excel/CSV.
-   Melihat ringkasan hasil import.
-   Melihat paket milik toko yang menjadi tanggung jawabnya.

Seller tidak boleh mengakses atau mengubah data toko Seller lain.

### 4.4 Aturan relasi Seller dan toko

-   Satu Seller dapat mengelola banyak toko.
-   Satu toko hanya dikelola oleh satu Seller.
-   Hubungan ini menggunakan `sellerId` pada tabel `stores`.
-   Tidak diperlukan tabel penghubung `seller_stores` untuk aturan
    bisnis ini.
-   `sellerId` harus mengacu pada pengguna dengan role `SELLER`. Foreign
    key biasa tidak dapat memastikan nilai role; validasi ini harus
    dilakukan pada service/controller dan bila perlu diperkuat dengan
    constraint database.

------------------------------------------------------------------------

## 5. Aturan master data

### 5.1 Marketplace

Tabel `marketplaces` menyimpan nama marketplace, misalnya Shopee,
Tokopedia, atau Lazada.

Nama marketplace harus dikelola sebagai master data. Jangan membuat nama
marketplace baru secara otomatis dari teks bebas saat import tanpa
aturan yang disepakati.

### 5.2 Toko

Tabel `stores` menyimpan:

-   Marketplace yang terkait.
-   Seller yang mengelola toko.
-   Nama toko.

Satu toko terkait dengan satu marketplace dan satu Seller. Kombinasi
marketplace dan nama toko direncanakan unik.

Seller memilih toko saat import. Marketplace dapat diketahui dari toko
yang dipilih sehingga file import tidak perlu menyediakan kolom
marketplace.

### 5.3 Ekspedisi

Tabel `expeditions` menyimpan daftar ekspedisi. Satu ekspedisi dapat
memiliki banyak aturan prefix.

### 5.4 Aturan prefix

Tabel `prefix_rules` menyimpan pola untuk mengenali ekspedisi dari
barcode.

Kolom penting:

-   `expeditionId`: ekspedisi pemilik aturan.
-   `awalan`: teks yang harus berada di awal barcode; opsional.
-   `akhiran`: teks yang harus berada di akhir barcode; opsional.
-   `panjang`: panjang barcode yang diwajibkan; opsional.

Ketentuan:

1.  Minimal salah satu dari `awalan` atau `akhiran` harus diisi.
2.  `panjang` boleh kosong. Jika diisi, panjang barcode harus sama
    persis.
3.  Jika `awalan` diisi, barcode harus diawali nilai tersebut.
4.  Jika `akhiran` diisi, barcode harus diakhiri nilai tersebut.
5.  Jika keduanya diisi, keduanya harus cocok.
6.  Aturan yang saling tumpang tindih dan dapat menghasilkan lebih dari
    satu ekspedisi harus ditolak atau ditangani dengan kebijakan
    eksplisit. Jangan memilih ekspedisi secara acak.
7.  Normalisasi barcode dan aturan prefix harus konsisten. Jangan
    mengubah huruf besar/kecil atau menghapus karakter tanpa kebijakan
    yang jelas.
8.  Validasi benturan pola perlu dilakukan di service sebelum aturan
    disimpan. Constraint unik sederhana belum tentu dapat mendeteksi
    semua pola yang tumpang tindih.

Jika tidak ada aturan yang cocok, ekspedisi tidak boleh ditebak.

------------------------------------------------------------------------

## 6. Aturan import Excel/CSV

### 6.1 Format file

File import berisi dua kolom utama:

  Kolom             Keterangan
  ----------------- ------------------------------------------------------------
  `nomor pesanan`   Nomor pesanan dari marketplace
  `resi`            Nomor resi/barcode paket; boleh kosong jika belum tersedia

Nama header dapat dinormalisasi agar variasi huruf besar/kecil atau
spasi tidak menyebabkan kegagalan yang tidak perlu, tetapi jangan
menerima format yang ambigu.

Seller memilih toko sebelum mengunggah file. Dari toko tersebut sistem
mengetahui marketplace dan Seller pemiliknya.

### 6.2 Relasi dan batas unik

-   Satu nomor pesanan hanya boleh memiliki satu paket pada toko yang
    sama.
-   Nomor pesanan unik berdasarkan kombinasi `storeId + nomorPesanan`.
-   Satu barcode/resi hanya boleh dimiliki oleh satu paket di seluruh
    sistem.
-   Barcode boleh `NULL` ketika resi belum tersedia.
-   Barcode yang sama pada baris berbeda tidak boleh membuat dua paket.
-   Pertahankan constraint database, bukan hanya validasi di sisi
    aplikasi.

### 6.3 Keputusan import

Gunakan aturan berikut sebagai acuan:

  -----------------------------------------------------------------------
  Kondisi                             Tindakan
  ----------------------------------- -----------------------------------
  Nomor pesanan baru, barcode baru    Buat paket baru

  Nomor pesanan baru, barcode kosong  Buat paket baru dengan barcode
                                      `NULL`

  Nomor pesanan sama dan barcode sama Lewati sebagai data yang sudah ada

  Nomor pesanan sama, barcode lama    Perbarui barcode pada paket yang
  `NULL`, barcode baru terisi         sudah ada

  Nomor pesanan sama, barcode lama    Konflik; jangan timpa data lama
  dan baru sama-sama terisi tetapi    
  berbeda                             

  Barcode sudah digunakan paket lain  Konflik; jangan buat paket yang
                                      melanggar unique constraint

  Barcode tidak memiliki prefix yang  Paket tetap disimpan; tandai
  dikenal                             `PREFIX_TIDAK_DIKENAL`

  Baris tidak valid atau nomor        Tolak baris tersebut dan jelaskan
  pesanan kosong                      alasannya
  -----------------------------------------------------------------------

**Catatan:** Barcode `NULL` bukan barcode yang berbeda. Ini mewakili
resi yang belum tersedia. Karena itu, barcode baru boleh mengisi nilai
kosong pada nomor pesanan yang sama.

### 6.4 Hasil import

Tampilkan ringkasan yang mudah dipahami, setidaknya:

-   Jumlah baris yang dibaca.
-   Jumlah paket baru.
-   Jumlah paket yang diperbarui karena resi baru tersedia.
-   Jumlah data yang dilewati karena sudah ada.
-   Jumlah konflik.
-   Jumlah baris tidak valid.
-   Jumlah paket dengan prefix tidak dikenal.

Jika memungkinkan, tampilkan nomor baris dan alasan konflik agar Seller
dapat memperbaiki file sumber.

### 6.5 Konsistensi dan transaksi

-   Validasi file sebelum menyimpan data.
-   Jangan mengandalkan validasi frontend.
-   Gunakan transaksi database untuk operasi yang perlu atomik.
-   Tangani unique constraint dan race condition di database.
-   Prisma error `P2002` dapat digunakan untuk mengenali pelanggaran
    unique constraint, tetapi tangani berdasarkan konteks
    field/constraint dan jangan menganggap semua error adalah duplikat
    yang sama.
-   Jangan menimpa data lama ketika terjadi konflik.
-   Jangan membuat tabel import batch atau import batch detail.
    Keputusan proyek saat ini adalah tidak menyimpan riwayat batch
    import.
-   Ringkasan hasil import dapat dikembalikan sebagai response untuk
    ditampilkan kepada Seller; bukan berarti harus disimpan sebagai
    tabel permanen.

------------------------------------------------------------------------

## 7. Aturan data paket

Tabel `packages` menyimpan data paket.

Kolom penting yang direncanakan:

-   `storeId`: toko asal pesanan.
-   `expeditionId`: ekspedisi hasil pengenalan prefix; nullable jika
    belum diketahui.
-   `createdById`: pengguna yang membuat/mengimpor data paket.
-   `nomorPesanan`: nomor pesanan.
-   `barcode`: resi/barcode; nullable dan unique global.
-   `statusScan`: status apakah paket sudah dipindai.
-   `statusPaket`: kondisi paket.
-   `statusPengamanan`: status penanganan keamanan.
-   `createdAt` dan `updatedAt`.

`createdById` dipertahankan untuk mengetahui siapa yang membuat atau
mengimpor paket. Field ini berbeda dari `storeId` dan `sellerId`.

### 7.1 Status scan

Enum `PackageScanStatus`:

-   `BELUM_DISCAN`
-   `SUDAH_DISCAN`

Status ini menjelaskan apakah paket pernah berhasil diproses melalui
scan sesuai aturan sistem. Jangan mencampurkannya dengan kondisi paket.

### 7.2 Kondisi paket

Enum `PackageCondition`:

-   `NORMAL`
-   `PENDING`
-   `BATAL`
-   `DUPLIKAT`
-   `PREFIX_TIDAK_DIKENAL`

Paket bermasalah tetap disimpan dan tetap dapat ditampilkan pada daftar
paket. Jangan menghapus paket hanya karena statusnya bermasalah.

### 7.3 Status pengamanan

Enum `SecurityStatus`:

-   `TIDAK_PERLU`
-   `PERLU_DIAMANKAN`
-   `SUDAH_DIAMANKAN`

Ketentuan bisnis:

-   Ketika kondisi paket berubah menjadi `PENDING`, `BATAL`, atau
    `DUPLIKAT`, status pengamanan perlu diubah menjadi
    `PERLU_DIAMANKAN`.
-   Petugas melakukan tindakan pengamanan.
-   Setelah selesai, Petugas dapat mengubah status menjadi
    `SUDAH_DIAMANKAN`.
-   Jangan otomatis menandai paket sudah diamankan tanpa konfirmasi
    tindakan.
-   Perubahan status harus divalidasi berdasarkan role dan dicatat bila
    dibutuhkan untuk audit.

### 7.4 Pemulihan prefix tidak dikenal

Jika paket tersimpan dengan kondisi `PREFIX_TIDAK_DIKENAL`:

1.  Admin menambahkan aturan prefix yang sesuai.
2.  Ketika barcode dipindai kembali atau proses pengenalan ulang
    dijalankan, sistem mencari aturan yang cocok.
3.  Jika ditemukan tepat satu ekspedisi yang valid, isi `expeditionId`.
4.  Ubah kondisi `PREFIX_TIDAK_DIKENAL` menjadi `NORMAL` hanya jika
    kondisi paket memang masih `PREFIX_TIDAK_DIKENAL`.
5.  Jangan menimpa kondisi `PENDING`, `BATAL`, atau `DUPLIKAT`.
6.  Jika tetap tidak cocok atau lebih dari satu aturan cocok, jangan
    menebak ekspedisinya.

------------------------------------------------------------------------

## 8. Aturan scan barcode

Fitur scan menggunakan alur **auto-sort**. Tidak ada fitur manual-sort
dalam rancangan saat ini.

### 8.1 Alur scan yang diharapkan

1.  Petugas login.
2.  Petugas membuka halaman scan.
3.  Barcode dipindai atau dimasukkan melalui input scanner.
4.  Sistem mencari paket berdasarkan barcode secara exact match setelah
    normalisasi yang telah ditetapkan.
5.  Sistem mencatat percobaan scan ke `scan_histories`.
6.  Jika paket ditemukan, sistem mengambil informasi paket, toko,
    marketplace, dan ekspedisi.
7.  Sistem memeriksa kondisi paket dan status scan.
8.  Sistem menampilkan hasil yang jelas kepada Petugas.
9.  Status paket diperbarui sesuai hasil scan yang valid.
10. Setiap hasil, termasuk kegagalan, tetap tercatat.

### 8.2 Hasil scan

Enum `ScanResult` yang direncanakan:

-   `BERHASIL`
-   `BARCODE_TIDAK_DIKENAL`
-   `PREFIX_TIDAK_DIKENAL`
-   `SUDAH_PERNAH_DISCAN`
-   `PAKET_PENDING`
-   `PAKET_BATAL`
-   `PAKET_DUPLIKAT`
-   `GAGAL`

Definisi dan prioritas hasil harus konsisten. Contohnya, jika barcode
tidak ditemukan, hasilnya `BARCODE_TIDAK_DIKENAL`; jika paket ditemukan
tetapi ekspedisi belum dikenali, hasilnya dapat `PREFIX_TIDAK_DIKENAL`.

Jangan menampilkan hasil `BERHASIL` jika transaksi pembaruan database
gagal.

### 8.3 Riwayat scan

Tabel `scan_histories` harus mencatat semua percobaan scan, termasuk:

-   Scan berhasil.
-   Barcode tidak ditemukan.
-   Prefix tidak dikenal.
-   Paket sudah pernah discan.
-   Paket berstatus pending.
-   Paket batal.
-   Paket duplikat.
-   Kegagalan pemrosesan.

Kolom penting:

-   `packageId`: nullable karena barcode yang tidak dikenal tidak
    memiliki paket.
-   `userId`: Petugas yang melakukan scan.
-   `barcode`: snapshot barcode yang dipindai; tetap disimpan walaupun
    `packageId` null.
-   `hasilScan`: hasil percobaan.
-   `statusPaket` dan `statusPengamanan`: snapshot opsional pada saat
    scan.
-   `keterangan`: penjelasan tambahan.
-   `scannedAt`: waktu scan.

Jangan hanya menyimpan relasi `packageId` dan menghilangkan barcode.
Nilai barcode pada riwayat berguna untuk audit walaupun paket kemudian
diubah atau dihapus.

### 8.4 Transaksi scan

Jika scan menyebabkan perubahan paket dan pembuatan riwayat,
pertimbangkan transaksi agar hasilnya konsisten. Pastikan kegagalan
transaksi tidak meninggalkan status paket yang berubah tanpa riwayat
yang semestinya.

------------------------------------------------------------------------

## 9. Rancangan tabel database saat ini

Database dasar yang telah berhasil dibuat memiliki tujuh tabel:

1.  `users`
2.  `marketplaces`
3.  `stores`
4.  `expeditions`
5.  `prefix_rules`
6.  `packages`
7.  `scan_histories`

### 9.1 Constraint utama

-   `users.username` unique.
-   `marketplaces.nama` unique.
-   `expeditions.nama` unique.
-   `stores` memiliki unique gabungan `marketplaceId + nama`.
-   `packages` memiliki unique gabungan `storeId + nomorPesanan`.
-   `packages.barcode` unique global dan nullable.
-   `prefix_rules` terkait ke satu `expedition`.
-   `scan_histories.packageId` nullable.
-   `scan_histories.userId` wajib.

**Peringatan desain:** PostgreSQL umumnya mengizinkan beberapa nilai
`NULL` pada unique constraint. Ini sesuai untuk barcode yang belum
tersedia. Jangan menghapus unique constraint barcode hanya untuk
mengizinkan nilai kosong.

### 9.2 Relasi utama

-   User (Seller) 1:N Store.
-   Marketplace 1:N Store.
-   Store 1:N Package.
-   User 1:N Package melalui `createdById`.
-   Expedition 1:N PrefixRule.
-   Expedition 1:N Package (relasi paket opsional).
-   User 1:N ScanHistory.
-   Package 1:N ScanHistory (relasi riwayat ke paket opsional).

------------------------------------------------------------------------

## 10. Struktur arsitektur aplikasi yang disarankan

Proyek menggunakan Next.js App Router. Gunakan pemisahan tanggung jawab
yang terinspirasi MVC dengan service layer. Jangan memaksakan pola MVC
Laravel secara persis ke Next.js.

Struktur target yang dapat dikembangkan secara bertahap:

``` text
sortify/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── generated/
│   └── prisma/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   ├── (dashboard)/
│   │   │   ├── admin/
│   │   │   ├── petugas/
│   │   │   └── seller/
│   │   ├── api/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/
│   │   └── shared/
│   ├── controllers/
│   ├── services/
│   ├── models/
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth/
│   │   └── validations/
│   ├── hooks/
│   └── types/
├── prisma7.config.ts
├── .env
├── package.json
└── ...
```

Ini adalah **struktur target**, bukan pernyataan bahwa semua folder
tersebut sudah ada. Periksa struktur aktual sebelum membuat folder atau
memindahkan file.

### 10.1 Tanggung jawab folder

  -----------------------------------------------------------------------
  Folder                              Tanggung jawab
  ----------------------------------- -----------------------------------
  `app/`                              Routing, layout, halaman, dan
                                      endpoint Route Handler

  `components/`                       Komponen UI yang dapat digunakan
                                      ulang

  `controllers/`                      Mengatur alur request, validasi
                                      awal, pemanggilan service, dan
                                      response

  `services/`                         Logika bisnis utama

  `models/`                           Akses data dan query Prisma yang
                                      dipisahkan bila bermanfaat

  `lib/`                              Inisialisasi Prisma, autentikasi,
                                      helper, dan konfigurasi

  `hooks/`                            Custom React hooks

  `types/`                            Tipe TypeScript bersama
  -----------------------------------------------------------------------

### 10.2 Prinsip arsitektur

-   Komponen UI tidak boleh langsung mengakses database.
-   Logika bisnis tidak boleh tersebar di banyak halaman.
-   Service layer menjadi tempat aturan import, scan, prefix, dan
    pengamanan.
-   Route Handler atau Server Action bertugas memanggil
    controller/service sesuai pola yang dipilih.
-   Validasi dilakukan di server.
-   Jangan mengirim password hash atau data sensitif ke client.
-   Hindari duplikasi query dan aturan bisnis.
-   Gunakan TypeScript secara konsisten.
-   Gunakan Server Components secara default; gunakan Client Components
    hanya jika interaktivitas browser diperlukan.
-   Jangan membuat API Route hanya untuk memanggil fungsi server
    internal jika Server Action atau pemanggilan service server-side
    lebih tepat. Pilih satu pola secara konsisten.

------------------------------------------------------------------------

## 11. Keamanan dan autentikasi

Fitur autentikasi belum boleh dianggap selesai hanya karena tabel
`users` tersedia.

Persyaratan keamanan:

1.  Password harus disimpan sebagai hash menggunakan algoritma yang
    sesuai, bukan plaintext.
2.  Login harus memverifikasi hash password.
3.  Session harus dikelola dengan aman.
4.  Cookie session harus menggunakan konfigurasi aman yang sesuai
    lingkungan deployment.
5.  Endpoint dan halaman harus memeriksa autentikasi di sisi server.
6.  Role harus diperiksa di server, bukan hanya dengan menyembunyikan
    tombol di frontend.
7.  Seller hanya dapat mengakses toko dan paket miliknya.
8.  Petugas tidak boleh mengubah master data.
9.  Admin memiliki hak pengelolaan sesuai kebijakan aplikasi.
10. Jangan menaruh secret, password database, atau token di source code.
11. Jangan pernah mengirim `DATABASE_URL` ke client.
12. Jangan membuat akun Admin default dengan password lemah tanpa
    mekanisme setup yang aman.

Sebelum memilih library autentikasi, periksa dependency dan kebutuhan
proyek. Jangan memasang beberapa library autentikasi sekaligus.

------------------------------------------------------------------------

## 12. Standar kualitas kode

AI agent harus mengikuti standar berikut:

### 12.1 Sebelum mengubah kode

1.  Baca file yang relevan.
2.  Periksa struktur folder dan dependency.
3.  Identifikasi apakah fitur sudah ada.
4.  Jelaskan file yang akan dibuat atau diubah.
5.  Hindari mengubah file yang tidak berhubungan.

### 12.2 Saat mengubah kode

-   Gunakan TypeScript dengan tipe yang jelas.
-   Hindari `any` kecuali benar-benar diperlukan dan diberi alasan.
-   Gunakan nama variabel dan fungsi yang deskriptif.
-   Pisahkan logika bisnis dari tampilan.
-   Tangani error secara eksplisit.
-   Jangan menelan error menggunakan `catch` kosong.
-   Jangan menggunakan data dummy sebagai pengganti implementasi tanpa
    memberi label.
-   Jangan mengubah kontrak database secara diam-diam.
-   Jangan menghapus fitur atau file yang sudah ada tanpa persetujuan.
-   Jangan menambahkan dependency baru jika kemampuan yang sama sudah
    tersedia.
-   Ikuti pola komponen dan styling yang sudah digunakan di proyek.
-   Gunakan komponen shadcn/ui jika sesuai, bukan membuat ulang komponen
    dasar tanpa alasan.

### 12.3 Setelah mengubah kode

Jalankan pemeriksaan yang relevan, misalnya:

``` bash
npx prisma validate
npx tsc --noEmit
npm run lint
npm run build
```

Tidak semua perintah harus dijalankan setiap kali. Pilih sesuai
perubahan. Jika suatu perintah gagal karena masalah yang sudah ada
sebelumnya, jelaskan dan bedakan dari error yang disebabkan perubahan
terbaru.

### 12.4 Pelaporan perubahan

Setiap selesai mengerjakan tugas, AI agent harus menyampaikan:

-   Ringkasan perubahan.
-   File yang dibuat.
-   File yang diubah.
-   Dependency baru (jika ada) dan alasan.
-   Perintah yang dijalankan.
-   Hasil validasi/test.
-   Hal yang belum selesai atau asumsi yang digunakan.

------------------------------------------------------------------------

## 13. Aturan khusus perubahan database

Database sudah memiliki migration awal yang berhasil diterapkan.

Karena itu:

-   Jangan menghapus database.
-   Jangan menjalankan `DROP DATABASE`.
-   Jangan menghapus folder `prisma/migrations`.
-   Jangan menjalankan reset migration atau `prisma migrate reset` tanpa
    persetujuan eksplisit.
-   Jangan mengedit migration yang sudah diterapkan untuk mengubah
    schema saat ini.
-   Untuk perubahan schema, edit `prisma/schema.prisma`, validasi, lalu
    buat migration baru dengan nama yang deskriptif.
-   Periksa SQL migration sebelum diterapkan pada perubahan yang
    berisiko.
-   Jangan menggunakan `prisma db push` sebagai pengganti migration
    dalam alur pengembangan normal proyek ini.
-   Jangan mengubah atau menghapus constraint unik yang melindungi
    integritas data tanpa analisis dampak dan persetujuan.
-   Setelah perubahan schema, jalankan `npx prisma generate` bila
    diperlukan.

Perintah migration pengembangan:

``` bash
npx prisma format
npx prisma validate
npx prisma migrate dev --name nama_perubahan
npx prisma generate
```

Nama migration harus menggambarkan perubahan, misalnya
`add_package_notes` atau `add_scan_metadata`.

------------------------------------------------------------------------

## 14. Prioritas roadmap pengembangan

Kembangkan aplikasi secara bertahap. Jangan membangun semua fitur
sekaligus.

### Tahap 1 --- Fondasi backend

-   Periksa struktur proyek.
-   Pastikan Prisma Client dapat digunakan dari Next.js.
-   Buat singleton Prisma Client yang sesuai untuk development.
-   Uji koneksi database melalui server-side code.
-   Tetapkan pola response dan error handling.

### Tahap 2 --- Autentikasi dan role

-   Implementasi login dan logout.
-   Hash password.
-   Session management.
-   Proteksi route.
-   Role-based access control.
-   Setup Admin awal dengan cara aman.

### Tahap 3 --- Master data

Urutan yang disarankan:

1.  Marketplace.
2.  User dan Seller.
3.  Toko.
4.  Ekspedisi.
5.  Aturan prefix.

Pastikan validasi role dan kepemilikan toko berjalan.

### Tahap 4 --- Import paket

-   Pilih toko.
-   Upload Excel/CSV.
-   Validasi header dan isi file.
-   Normalisasi data secara konsisten.
-   Cek nomor pesanan.
-   Cek barcode global.
-   Terapkan aturan insert, update resi kosong, skip, dan konflik.
-   Simpan paket secara aman.
-   Tampilkan ringkasan import.

### Tahap 5 --- Scan barcode

-   Buat antarmuka scan.
-   Terima input scanner barcode yang bertindak seperti keyboard.
-   Cari paket berdasarkan barcode.
-   Kenali ekspedisi melalui prefix.
-   Tentukan hasil scan.
-   Perbarui status yang sesuai.
-   Simpan semua percobaan ke scan history.
-   Tangani scan berulang dan kondisi paket khusus.

### Tahap 6 --- Pengelolaan paket

-   Daftar paket.
-   Pencarian dan filter.
-   Detail paket.
-   Pengelolaan kondisi paket.
-   Pengelolaan status pengamanan.
-   Pemulihan paket dengan prefix yang sebelumnya tidak dikenal.

### Tahap 7 --- Dashboard dan laporan

-   Statistik paket.
-   Statistik scan.
-   Paket belum discan.
-   Paket bermasalah.
-   Paket yang perlu diamankan.
-   Filter berdasarkan toko, marketplace, ekspedisi, status, dan rentang
    tanggal sesuai hak akses.

------------------------------------------------------------------------

## 15. Hal yang belum boleh diasumsikan oleh AI agent

Jika belum ada keputusan eksplisit atau implementasi yang dapat
diperiksa, jangan mengarang hal berikut:

-   Nama lengkap semua halaman dan menu.
-   Desain final dashboard.
-   Kebijakan masa berlaku session.
-   Apakah Petugas dapat melihat semua riwayat scan atau hanya miliknya.
-   Apakah Seller dapat mengedit atau menghapus paket setelah import.
-   Apakah paket boleh dihapus permanen atau hanya diarsipkan.
-   Apakah scan ulang paket normal harus ditolak atau dicatat sebagai
    scan berulang.
-   Detail aturan normalisasi barcode.
-   Prioritas jika pola prefix saling tumpang tindih.
-   Batas ukuran file import dan jumlah baris maksimal.
-   Format file Excel/CSV tambahan di luar dua kolom utama.
-   Fitur ekspor laporan.
-   Integrasi API eksternal.
-   Fitur notifikasi.
-   Deployment dan hosting produksi.

Jika suatu keputusan diperlukan agar implementasi dapat dilanjutkan,
ajukan pertanyaan singkat yang spesifik. Jangan membuat asumsi yang
dapat mengubah aturan bisnis atau struktur data.

------------------------------------------------------------------------

## 16. Instruksi awal untuk AI agent

Saat pertama kali membuka repository Sortify:

1.  Baca file ini sampai selesai.
2.  Periksa `package.json`, `prisma/schema.prisma`, `prisma7.config.ts`,
    `.env.example` jika tersedia, dan struktur `src/`.
3.  Jangan menampilkan isi rahasia `.env` di chat atau log.
4.  Periksa migration yang sudah ada.
5.  Periksa apakah Prisma Client dan helper koneksi sudah dibuat.
6.  Laporkan kondisi aktual proyek: apa yang sudah ada, apa yang belum
    ada, dan apakah ada perbedaan dengan dokumen ini.
7.  Jangan langsung melakukan perubahan besar.
8.  Untuk setiap tugas, usulkan langkah implementasi kecil dan kerjakan
    sesuai permintaan.
9.  Jangan menghapus database, migration, atau file konfigurasi.
10. Jika dokumen ini bertentangan dengan implementasi aktual atau
    instruksi terbaru pemilik proyek, tunjukkan perbedaannya dan minta
    konfirmasi sebelum melakukan perubahan yang berisiko.

### Prompt singkat untuk memulai agent

Gunakan prompt berikut setelah menambahkan dokumen ini ke repository:

> Baca `SORTIFY_AI_CONTEXT.md` secara menyeluruh. Setelah itu, audit
> repository Sortify tanpa mengubah file apa pun. Periksa struktur
> folder, package.json, konfigurasi Prisma, schema database, migration,
> dan implementasi yang sudah tersedia. Jangan membaca atau menampilkan
> secret dari file .env. Berikan laporan kondisi proyek, perbedaan
> antara implementasi aktual dan dokumen konteks, serta rekomendasi
> langkah berikutnya. Jangan membuat perubahan sebelum saya
> menyetujuinya.

------------------------------------------------------------------------

## 17. Prinsip keputusan paling penting

Jika AI agent hanya mengingat beberapa hal, prioritaskan ini:

1.  Sortify menggunakan Next.js, TypeScript, PostgreSQL, Prisma 7,
    Tailwind CSS, dan shadcn/ui.
2.  Role aplikasi adalah Admin, Petugas, dan Seller.
3.  Seller mengimpor file Excel/CSV dengan kolom nomor pesanan dan resi
    setelah memilih toko.
4.  Satu nomor pesanan hanya satu paket per toko; satu barcode hanya
    boleh dimiliki satu paket secara global.
5.  Resi boleh kosong dan dapat diisi ketika tersedia kemudian.
6.  Auto-sort mengenali ekspedisi melalui prefix; tidak ada manual-sort.
7.  Semua percobaan scan harus tercatat, termasuk yang gagal.
8.  Jangan menimpa data lama ketika import menemukan konflik.
9.  Tidak ada tabel import batch dalam rancangan saat ini.
10. Jangan reset database atau menghapus migration tanpa persetujuan
    eksplisit.

**Akhir dokumen konteks Sortify.**
