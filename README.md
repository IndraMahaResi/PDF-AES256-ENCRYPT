🔐 PDF AES-256 Web3 Encryption System

Aplikasi PDF AES-256 Web3 Encryption System adalah aplikasi web modern yang memungkinkan pengguna mengamankan dokumen PDF menggunakan enkripsi tingkat militer AES-256-CBC, dipadukan dengan antarmuka bergaya Web3 yang futuristik, responsif, dan aman.

Sistem ini dirancang dengan prinsip zero-knowledge, di mana file diproses secara sementara di memori tanpa penyimpanan permanen, sehingga privasi pengguna tetap terjaga.

🎯 Tujuan Utama

✅ Enkripsi file PDF menggunakan algoritma AES-256-CBC

✅ Dekripsi file terenkripsi menggunakan password yang valid

✅ Antarmuka Web3 modern dan responsif

✅ Zero-knowledge processing (tanpa penyimpanan permanen)

✅ Validasi file dan password yang kuat

✨ Fitur Utama
🔐 Enkripsi & Dekripsi

Enkripsi PDF
Mengubah file PDF menjadi file terenkripsi dengan ekstensi .aes256

Dekripsi PDF
Mengembalikan file .aes256 menjadi PDF asli

Password Protection
Password minimal 4 karakter dengan validasi client & server

🎨 Antarmuka Pengguna

Desain Web3
Tema gelap, gradien neon, dan animasi modern

Responsif
Optimal untuk desktop maupun mobile

Drag & Drop Upload
Unggah file dengan cepat dan mudah

Real-time Feedback
Indikator kekuatan password & status proses enkripsi

🔒 Keamanan Sistem

Zero-Knowledge Architecture
File hanya diproses di memori

Validasi File
Verifikasi integritas PDF sebelum enkripsi/dekripsi

Error Handling Aman
Pesan error informatif tanpa membocorkan detail sensitif

Auto Cleanup
File temporary otomatis dihapus setelah 1 jam

📊 Monitoring & Informasi

Monitoring status sistem secara real-time

Visualisasi alur proses kriptografi

Informasi detail file yang diunggah

🛠️ Teknologi yang Digunakan
Backend

Python

Flask – Web framework ringan

PyCryptodome – Implementasi AES-256

Werkzeug – File handling & security utility

Frontend

HTML5 – Struktur halaman

CSS3 – Styling, variabel CSS, animasi

JavaScript (ES6) – Logika client-side

Font Awesome – Ikon vektor

Google Fonts – Orbitron & Exo 2

🔑 Spesifikasi Kriptografi

Algoritma: AES-256

Mode: CBC (Cipher Block Chaining)

Key Derivation: PBKDF2

Iterasi: 100.000

Tambahan Keamanan: XOR Layer

📁 Struktur Proyek
pdf-aes-web3/
│
├── app.py                # Aplikasi Flask utama
├── requirements.txt      # Dependensi Python
├── README.md             # Dokumentasi proyek
│
├── static/
│   ├── css/
│   │   └── style.css     # Stylesheet utama
│   └── js/
│       └── script.js     # JavaScript client-side
│
├── templates/
│   └── index.html        # Template HTML utama
│
├── uploads/              # File PDF hasil dekripsi (temporary)
│
└── encrypted/            # File terenkripsi (.aes256)

⚙️ Instalasi & Menjalankan Aplikasi
Prasyarat

Python 3.8+

pip (Python package manager)

Browser web modern

Langkah Instalasi
1️⃣ Clone / Download Proyek
git clone [repository-url]
cd pdf-aes-web3

2️⃣ Buat Virtual Environment (Disarankan)
python -m venv venv


Windows

venv\Scripts\activate


Mac / Linux

source venv/bin/activate

3️⃣ Instal Dependensi
pip install -r requirements.txt

4️⃣ Jalankan Aplikasi
python app.py

5️⃣ Akses di Browser
http://localhost:5000


Port Alternatif

python app.py --port=8080

📖 Panduan Penggunaan
🔐 Enkripsi File PDF

Buka tab Eksekusi

Unggah file PDF (klik atau drag & drop)

Masukkan password (minimal 4 karakter)

Klik Enkripsi PDF

Unduh file hasil enkripsi (.aes256)

🔓 Dekripsi File

Buka tab Eksekusi

Unggah file .aes256

Masukkan password yang sama

Klik Dekripsi PDF

Unduh file PDF asli

📘 Informasi Tambahan

Tab Alur Proses → Visualisasi langkah kriptografi

Tab Panduan → Dokumentasi & FAQ

Footer Status → Monitoring kesehatan sistem

⚠️ Catatan Penting

Password TIDAK DAPAT dipulihkan jika lupa

File temporary dihapus otomatis setelah 1 jam

Maksimal ukuran file: 16 MB

Format yang didukung: .pdf, .aes256

🚀 Penutup

Sistem ini dirancang untuk memberikan keamanan maksimal, privasi penuh, dan pengalaman pengguna modern dengan pendekatan Web3. Cocok untuk penggunaan akademik, profesional, maupun eksperimen kriptografi lanjutan.

Secure your PDFs. Trust no storage. Web3 mindset.
