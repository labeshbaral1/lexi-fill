const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const axios = require('axios'); 
require('dotenv').config();
const Groq = require('groq-sdk');


const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL;


const app = express();
const PORT = process.env.PORT || 8000;

//CONFIGURATIONS
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
app.use(cors());
app.use(express.json());

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        path.extname(file.originalname).toLowerCase() === '.docx') {
      cb(null, true);
    } else {
      cb(new Error('Only .docx files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // Creating a limit for filesize
  }
});


//ROUTES
app.post('/upload', upload.single('document'), async (req, res) => {
  let filePath = null;
  try {
    if (!req.file) {
      return res.status(400).json({ error: '[ERROR] No file found' });
    }

    filePath = req.file.path;
    console.log('File uploaded:', filePath);

    const pythonScript = path.join(__dirname, 'parser', 'parse_doc.py');
    
    const pythonProcess = spawn('python3', [pythonScript, filePath]);
    
    let result = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', async (code) => {
      if (code !== 0) {
        console.error('Python script error:', error);
        return res.status(500).json({ 
          error: 'Failed to parse document',
          details: error 
        });
      }

      try {
        const parsedResult = JSON.parse(result);

        const questions = await generateQuestions(parsedResult.placeholders);
        console.log(questions);
        
        if (parsedResult.placeholders && parsedResult.replacedTemplate) {
          res.json({
            placeholders: parsedResult.placeholders,
            replacedTemplate: parsedResult.replacedTemplate,
            // templateText: parsedResult.templateText || '',
            questions: questions
          });
        } else {
          res.json(parsedResult);
        }
        fs.unlink(filePath, err => {
          if (err) console.error('Error deleting uploaded file:', err);
          else console.log('Deleted:', filePath);
        });
      } catch (parseError) {
        console.error('[ERROR]', parseError);
        res.status(500).json({ 
          error: 'Failed to parse Python script',
          details: parseError.message 
        });
      }
    });

  } catch (error) {
    console.error('[ERROR] Upload error:', error);
    res.status(500).json({ error: '[ERROR] Server error', details: error.message });
  }

  
});

async function generateQuestions(placeholders) {
  
  const prompt = `Given the following placeholder IDs and line numbers, generate a question for each so a user can fill them in a legal document:

  ${placeholders.map(p => `- ${p.id} (line_num: ${p.line_num})`).join('\n')}

  - Ensure that returned questions are in increasing line_num order.
  - Return only valid JSON in the exact format:
  { "questions": [{ "id": "...", "line_num": ..., "question": "..." }, ...] }
  
  Do not include any explanations, comments, or markdown formatting. Only return plain JSON.`;

  const chatCompletion = await groq.chat.completions.create({
    messages: [
      { role: 'user', content: prompt }
    ],
    model: process.env.GROQ_MODEL,
  });

  const responseText = chatCompletion.choices?.[0]?.message?.content || '';
  const cleanedResponse = responseText.replace(/```(?:json)?\r?\n|```/gi, '').trim();

  return JSON.parse(cleanedResponse);
} 

app.get('/sanity', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Lexi-Fill server is running on port ${PORT}`);
  console.log(`Uploads stored in directory: ${uploadsDir}`);
}); 