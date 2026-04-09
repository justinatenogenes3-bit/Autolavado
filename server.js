// ─── Servidor Express para recibir y servir fotos de evidencia ───────────────
// Instala dependencias: npm install express multer cors
// Corre con: node server.js
// Deja corriendo mientras usas la app

const express = require('express');
const multer  = require('multer');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
const os      = require('os');

const app  = express();
const PORT = 3001;

// ── Carpeta donde se guardan las fotos ───────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

// ── Configuración de multer (recibe el archivo) ──────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename:    (req, file, cb) => {
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    cb(null, name);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB max

app.use(cors());
app.use(express.json());

// ── Servir las fotos guardadas ───────────────────────────────────────────────
app.use('/uploads', express.static(UPLOADS_DIR));

// ── Endpoint para subir foto ─────────────────────────────────────────────────
app.post('/upload', upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió ninguna foto' });

  // Obtener IP local de la computadora
  const interfaces = os.networkInterfaces();
  let localIP = 'localhost';
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        localIP = iface.address;
        break;
      }
    }
  }

  const url = `http://${localIP}:${PORT}/uploads/${req.file.filename}`;
  console.log(`Foto recibida: ${url}`);
  res.json({ url });
});

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/ping', (req, res) => res.json({ ok: true }));

// ── Iniciar servidor ─────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  const interfaces = os.networkInterfaces();
  let localIP = 'localhost';
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        localIP = iface.address;
        break;
      }
    }
  }
  console.log('\n✅ Servidor corriendo');
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Red:     http://${localIP}:${PORT}`);
  console.log(`\n📱 Usa esta IP en tu app: ${localIP}`);
  console.log('   Ctrl+C para detener\n');
});