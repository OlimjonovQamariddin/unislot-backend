import express from 'express';
import multer from 'multer';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Anthropic SDK
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Multer (rasmlarni xotirada saqlash uchun)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Healthcheck endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Unislot API is running'
  });
});

// Dars jadvali rasmini JSON ga o'giruvchi API endpoint
app.post('/api/parse-schedule', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Rasm yuklanmadi' });
    }

    const base64Image = req.file.buffer.toString('base64');
    const mediaType = req.file.mimetype;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: 'Ushbu universitet dars jadvali rasmini tahlil qiling va uni aniq JSON formatiga o\'giring. Strukturasi: {"days": [{"day": "Dushanba", "lessons": [{"subject": "", "time": "", "room": "", "teacher": ""}]}]}. Faqat toza JSON qaytaring.',
            },
          ],
        },
      ],
    });

    const resultText = response.content[0].text;
    res.json({ success: true, data: resultText });
  } catch (error) {
    console.error('Xatolik:', error);
    res.status(500).json({ error: 'Rasm qayta ishlanmadi', details: error.message });
  }
});

// Serverni ishga tushirish (0.0.0.0 Render uchun shart)
app.listen(port, '0.0.0.0', () => {
  console.log(`Server ${port}-portda ishlamoqda`);
});
