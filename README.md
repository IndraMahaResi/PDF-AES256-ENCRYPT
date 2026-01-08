🎯 Ringkasan Proyek
Sistem Enkripsi PDF AES-256 Web3 adalah aplikasi web yang memungkinkan pengguna untuk mengamankan dokumen PDF mereka dengan enkripsi tingkat militer menggunakan algoritma AES-256. Sistem ini menggabungkan teknologi kriptografi modern dengan antarmuka pengguna bergaya Web3 untuk pengalaman yang profesional dan aman.

🎯 Tujuan Utama:
✅ Enkripsi file PDF dengan algoritma AES-256-CBC

✅ Dekripsi file dengan password yang benar

✅ Interface Web3 yang modern dan responsif

✅ Proses tanpa penyimpanan data (zero-knowledge)

✅ Validasi file dan password yang kuat

✨ Fitur Utama
🔐 Enkripsi & Dekripsi
Enkripsi PDF: Mengubah file PDF menjadi format .aes256 yang aman

Dekripsi: Mengembalikan file .aes256 ke PDF asli

Password Protection: Perlindungan berbasis password dengan minimum 4 karakter

🎨 Antarmuka Pengguna
Desain Web3: Tema gelap dengan gradien neon dan animasi

Responsif: Berfungsi optimal di desktop dan mobile

Drag & Drop: Unggah file dengan mudah

Real-time Feedback: Indikator kekuatan password dan status proses

🔒 Keamanan
Zero-Knowledge: File diproses di memori, tidak disimpan permanen

Validasi File: Verifikasi integritas PDF sebelum proses

Error Handling: Pesan error yang informatif dan aman

Auto Cleanup: File temporary dihapus otomatis setelah 1 jam

📊 Monitoring
Status Sistem: Monitoring real-time komponen sistem

Log Proses: Visualisasi alur kriptografi

File Info: Informasi detail file yang diunggah

🛠️ Teknologi yang Digunakan
Backend (Python)
Flask: Framework web minimalis

PyCryptodome: Library kriptografi untuk AES-256

Werkzeug: Utility untuk file handling dan security

Frontend (HTML/CSS/JS)
HTML5: Struktur halaman web

CSS3: Styling dengan variabel CSS dan animasi

JavaScript ES6: Logika client-side

Font Awesome: Ikon vektor

Google Fonts: Font Orbitron dan Exo 2

Kriptografi
Algoritma: AES-256-CBC

Mode: Cipher Block Chaining (CBC)

Key Derivation: PBKDF2 dengan 100,000 iterasi

Transformasi Tambahan: XOR layer untuk keamanan ekstra

📁 Struktur Proyek
text
pdf-aes-web3/
│
├── app.py                      # Aplikasi Flask utama
├── requirements.txt            # Dependensi Python
├── README.md                   # Dokumentasi ini
│
├── static/
│   ├── css/
│   │   └── style.css          # Stylesheet utama
│   └── js/
│       └── script.js          # JavaScript client-side
│
├── templates/
│   └── index.html             # Template HTML utama
│
├── uploads/                    # Folder untuk file PDF terdekripsi
│   └── (file temporary)
│
└── encrypted/                  # Folder untuk file terenkripsi
    └── (file .aes256)
⚙️ Instalasi & Menjalankan
Prasyarat
Python 3.8 atau lebih baru

pip (Python package manager)

Browser web modern

Langkah-langkah Instalasi
Clone/Download Proyek

bash
git clone [repository-url]
cd pdf-aes-web3
Buat Virtual Environment (Opsional tapi Disarankan)

bash
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate
Instal Dependensi

bash
pip install -r requirements.txt
Jalankan Aplikasi

bash
python app.py
Akses di Browser

text
http://localhost:5000
Port Alternatif
bash
# Jika port 5000 sedang digunakan
python app.py --port=8080
📖 Panduan Penggunaan
1. Enkripsi File PDF
Buka tab "Eksekusi"

Klik area unggah atau "Pilih File"

Pilih file PDF yang ingin dienkripsi

Masukkan password (minimal 4 karakter)

Klik tombol "Enkripsi PDF"

Tunggu proses selesai

Klik "Unduh File" untuk mendapatkan file .aes256

2. Dekripsi File
Buka tab "Eksekusi"

Unggah file dengan ekstensi .aes256

Masukkan password yang sama dengan saat enkripsi

Klik tombol "Dekripsi PDF"

Tunggu proses selesai

Klik "Unduh File" untuk mendapatkan PDF asli

3. Informasi Tambahan
Tab "Alur Proses": Visualisasi langkah-langkah kriptografi

Tab "Panduan": Dokumentasi lengkap dan FAQ

Status Footer: Monitoring kesehatan sistem

⚠️ Catatan Penting
Password TIDAK DAPAT dipulihkan jika lupa

File temporary dihapus otomatis setelah 1 jam

Ukuran file maksimal: 16MB

Format yang didukung: .pdf dan .aes256
