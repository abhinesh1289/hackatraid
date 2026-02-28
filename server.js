const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serves your HTML file

// API Route for Analysis
app.post('/api/analyze', async (req, res) => {
    const { text, language, detailLevel } = req.body;

    if (!text) {
        return res.status(400).json({ error: "No text provided" });
    }

    const prompt = `You are a medical report simplifier. A patient has uploaded their medical report. Your job is to explain it in simple, easy-to-understand ${language}.

    IMPORTANT RULES:
    - Never make a diagnosis. Always add disclaimers.
    - Use simple language a non-medical person can understand.
    - Be compassionate and avoid causing unnecessary anxiety.

    Medical Report Text:
    """
    ${text}
    """

    Respond ONLY with valid JSON in this exact structure:
    {
      "simple": "Plain English explanation (2-3 paragraphs)",
      "bullets": ["bullet 1", "bullet 2", "bullet 3", "bullet 4", "bullet 5"],
      "short": "One paragraph short summary",
      "detailed": "Detailed explanation with all findings discussed",
      "keyFindings": ["finding 1", "finding 2", "finding 3"],
      "riskLevel": "low|medium|high",
      "riskReason": "Brief reason for risk level",
      "conditions": ["possible condition 1", "possible condition 2"],
      "terms": {"term1": "simple definition", "term2": "simple definition", "term3": "simple definition"},
      "doctorQuestions": ["question 1", "question 2", "question 3", "question 4", "question 5"]
    }`;

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const rawContent = response.data.choices[0].message.content.replace(/```json|```/g, '').trim();
        res.json(JSON.parse(rawContent));

    } catch (error) {
        console.error("OpenAI Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Failed to analyze report." });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});