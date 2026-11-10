const express = require('express');
const path = require('path');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({ dest: 'uploads/' });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes

// Get all questions from Neon DB
app.get('/api/questions', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM questions ORDER BY id ASC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// CSV Upload API Route
app.post('/api/questions/upload-csv', upload.single('csvFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Please upload a CSV file.' });
  }

  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      // Remove temp uploaded CSV file
      fs.unlinkSync(req.file.path);

      try {
        let insertedCount = 0;
        for (const row of results) {
          const section = row.section || 'General';
          const question = row.question;
          const code = row.code || '';
          const options = [
            row.option_a || row.optionA || '',
            row.option_b || row.optionB || '',
            row.option_c || row.optionC || '',
            row.option_d || row.optionD || ''
          ];
          const answer = parseInt(row.answer, 10) || 0;
          const explanation = row.explanation || '';

          if (question && options[0] && options[1]) {
            await db.query(
              `INSERT INTO questions (section, question, code, options, answer, explanation)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [section, question, code, JSON.stringify(options), answer, explanation]
            );
            insertedCount++;
          }
        }
        res.json({ success: true, message: `Successfully imported ${insertedCount} questions into database.` });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });
});

// Delete question from Neon DB
app.delete('/api/questions/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM questions WHERE id = $1', [id]);
    res.json({ success: true, message: 'Question deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve frontend pages
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public/pages/login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public/pages/register.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public/pages/dashboard.html')));
app.get('/test', (req, res) => res.sendFile(path.join(__dirname, 'public/pages/test.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public/pages/admin.html')));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
