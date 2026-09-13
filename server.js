import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// Google Gemini ob'ektini yaratamiz
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Unislot API is running' });
});

app.post('/api/parse-schedule', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Rasm fayli yuklanmadi' });
    }

 const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }, { apiVersion: 'v1' });

    const prompt = `Ushbu dars jadvali rasmidan barcha ma'lumotlarni o'qib ol va ularni faqat va faqat quyidagi toza JSON formatida qaytar. Ortiqcha yozuv yoki markdown yozma:
    {
      "days": [
        {
          "day": "Hafta kuni",
          "lessons": [
            {
              "subject": "Fan nomi",
              "time": "Vaqti",
              "room": "Xona/Xona raqami",
              "teacher": "O'qituvchi"
            }
          ]
        }
      ]
    }`;

    const imagePart = {
      inlineData: {
        data: req.file.buffer.toString('base64'),
        mimeType: req.file.mimetype,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();

    // Olingan javobdan toza JSON hosil qilish
    const cleanJsonText = responseText.replace(/```json|```/g, '').trim();
    const parsedData = JSON.parse(cleanJsonText);

    res.json({
      success: true,
      data: parsedData,
    });
  } catch (error) {
    console.error('Xatolik:', error);
    res.status(500).json({
      error: 'Rasm qayta ishlanmadi',
      details: error.message,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
