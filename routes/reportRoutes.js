const express = require('express');
const router = express.Router();
const multer = require('multer');
let sharp = null;
let createWorker = null;

try {
  sharp = require('sharp');
} catch (e) {
  console.warn('Optional dependency `sharp` not installed. Image normalization disabled.');
}

try {
  ({ createWorker } = require('tesseract.js'));
} catch (e) {
  console.warn('Optional dependency `tesseract.js` not installed. OCR disabled.');
}
const HospitalReport = require('../models/HospitalReport');

// Memory storage for multer (we'll store the buffer into MongoDB)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Simple analysis: extract numbers, dates, and detect common test names
function analyzeText(text) {
  const lower = (text || '').toLowerCase();
  const numbers = (text || '').match(/\b\d+[.,]?\d*\b/g) || [];
  const dates = (text || '').match(/\b\d{1,2}[-\/.]\d{1,2}[-\/.]\d{2,4}\b/g) || [];
  const tests = [];
  const keywords = ['hemoglobin','hb','rbc','wbc','platelet','cholesterol','sugar','glucose','ecg','x-ray','xray','ct','mri','blood pressure','bp','pulse'];
  keywords.forEach(k => { if (lower.includes(k)) tests.push(k); });

  // short summary: first 300 chars of OCR text
  const summary = (text || '').replace(/\s+/g, ' ').trim().slice(0, 300);
  return { numbers, dates, tests, summary };
}

// POST /api/reports/upload
// form-data: userId, userName (optional), image (file)
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const { userId, userName } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    if (!req.file) return res.status(400).json({ error: 'image file required' });

    // Normalize image with sharp to a reasonable size to help OCR (optional)
    let imgBuffer = req.file.buffer;
    if (sharp) {
      try {
        imgBuffer = await sharp(imgBuffer).resize({ width: 1600, withoutEnlargement: true }).toFormat('png').toBuffer();
      } catch (e) {
        console.warn('Image normalization failed, using original buffer');
      }
    }

    // Run OCR using tesseract.js (optional)
    let ocrText = '';
    if (createWorker) {
      const worker = createWorker({ logger: m => {} });
      try {
        await worker.load();
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        const { data: { text } } = await worker.recognize(imgBuffer);
        ocrText = (text || '').trim();
      } catch (e) {
        console.warn('OCR failed:', e && e.message ? e.message : e);
      } finally {
        try { await worker.terminate(); } catch (e) {}
      }
    } else {
      // OCR not available; leave ocrText empty
      ocrText = '';
    }
    const analysis = analyzeText(ocrText);

    // Save to DB
    const report = await HospitalReport.create({
      userId,
      userName: userName || undefined,
      image: imgBuffer,
      imageMime: 'image/png',
      ocrText,
      analysis
    });

    res.json({ ok: true, reportId: report._id, analysis });
  } catch (err) {
    console.error('Report upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/:userId - return latest report summary or all reports when ?all=1
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const all = req.query.all === '1' || req.query.all === 'true';
    if (!userId) return res.status(400).json({ error: 'userId required' });

    if (all) {
      const reports = await HospitalReport.find({ userId }).sort({ createdAt: -1 }).lean();
      const mapped = reports.map(r => ({ id: r._id, createdAt: r.createdAt, ocrText: r.ocrText, analysis: r.analysis }));
      return res.json({ ok: true, exists: mapped.length > 0, reports: mapped });
    }

    const report = await HospitalReport.findOne({ userId }).sort({ createdAt: -1 }).lean();
    if (!report) return res.json({ ok: true, exists: false });
    // Do not include image buffer in listing
    const { _id, createdAt, ocrText, analysis } = report;
    res.json({ ok: true, exists: true, report: { id: _id, createdAt, ocrText, analysis } });
  } catch (err) {
    console.error('Get report error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/image/:id - stream image
router.get('/image/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const report = await HospitalReport.findById(id).lean();
    if (!report || !report.image) return res.status(404).json({ error: 'Image not found' });
    res.set('Content-Type', report.imageMime || 'application/octet-stream');
    res.send(report.image);
  } catch (err) {
    console.error('Get report image error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
