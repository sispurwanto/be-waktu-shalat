const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

// Inisialisasi Express
const app = express();
app.use(cors());
app.use(express.json()); // Parsing JSON request body

// TODO: Pastikan file serviceAccountKey.json dari Firebase diletakkan di folder yang sama
// Anda bisa mendownloadnya dari Firebase Console -> Project Settings -> Service Accounts -> Generate new private key
try {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin SDK berhasil diinisialisasi.');
} catch (error) {
  console.error('Peringatan: Gagal memuat serviceAccountKey.json. Pastikan file tersebut ada.');
}

const db = admin.firestore();

// Endpoint untuk Test Server
app.get('/api/ping', (req, res) => {
  res.json({ message: 'Server be_jadwal_shalat aktif!', status: 'OK' });
});

// Endpoint untuk Mengambil Data Masjid berdasarkan ID
app.get('/api/masjid/:masjidId', async (req, res) => {
  try {
    const { masjidId } = req.params;
    const docRef = db.collection('masjid').doc(masjidId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Data masjid tidak ditemukan' });
    }

    res.json({
      id: doc.id,
      data: doc.data()
    });
  } catch (error) {
    console.error('Error fetching masjid data:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// Endpoint untuk Menambahkan atau Mengupdate Data Masjid
// Sesuai dengan struktur JSON yang diinginkan
app.post('/api/masjid/:masjidId', async (req, res) => {
  try {
    const { masjidId } = req.params;
    const bodyData = req.body;

    // Struktur Data Validasi/Mapping
    const masjidData = {
      nama: bodyData.nama || 'Nama Masjid Default',
      lokasi: bodyData.lokasi || 'Lokasi Default',
      background_url: bodyData.background_url || '',
      durasi_slide: bodyData.durasi_slide || 5,
      latitude: bodyData.latitude || 0.0,
      longitude: bodyData.longitude || 0.0,
      iqomah: bodyData.iqomah || {
        subuh: { waktu_iqomah: 20, waktu_shalat: 15 },
        dzuhur: { waktu_iqomah: 20, waktu_shalat: 15 },
        ashar: { waktu_iqomah: 20, waktu_shalat: 15 },
        maghrib: { waktu_iqomah: 10, waktu_shalat: 15 },
        isya: { waktu_iqomah: 15, waktu_shalat: 15 }
      },
      nasehat: bodyData.nasehat || [],     // Array Dinamis
      informasi: bodyData.informasi || []  // Array Dinamis
    };

    const masjidRef = db.collection('masjid').doc(masjidId);
    
    // Gunakan merge: true untuk mengupdate data yang ada tanpa menghapus field lain
    await masjidRef.set(masjidData, { merge: true });

    res.json({
      message: `Data masjid ${masjidId} berhasil disimpan!`,
      data: masjidData
    });
  } catch (error) {
    console.error('Error updating masjid data:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server saat menyimpan data' });
  }
});

// Jalankan server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend API Masjid berjalan di http://localhost:${PORT}`);
  console.log(`\nContoh Request POST:`);
  console.log(`URL: http://localhost:${PORT}/api/masjid/al_muhajirin_yiami`);
  console.log(`Body (JSON):`);
  console.log(`{
  "nama": "Mushola Al Muhajirin Yiami",
  "lokasi": "Cileungsi - Bogor",
  "background_url": "",
  "durasi_slide": 5,
  "latitude": -6.4023,
  "longitude": 106.9705,
  "iqomah": {
    "subuh": { "waktu_iqomah": 20, "waktu_shalat": 15 },
    "dzuhur": { "waktu_iqomah": 20, "waktu_shalat": 15 },
    "ashar": { "waktu_iqomah": 20, "waktu_shalat": 15 },
    "maghrib": { "waktu_iqomah": 10, "waktu_shalat": 15 },
    "isya": { "waktu_iqomah": 15, "waktu_shalat": 15 }
  },
  "nasehat": [
    { "id": "1", "dalil": "QS Al Baqoroh 255", "isi": "Ayat Kursi..." }
  ],
  "informasi": [
    { "id": "1", "title": "Kajian", "content": "Rutin" }
  ]
}`);
});
