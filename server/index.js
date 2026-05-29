require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json({ limit: '10mb' }));

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.post('/api/analyze-food', async (req, res) => {
  const { image, mediaType = 'image/jpeg' } = req.body;

  if (!image) return res.status(400).json({ error: 'No image provided' });

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: image },
            },
            {
              type: 'text',
              text: `Analyze this food image and estimate the nutritional content.
Respond ONLY with a JSON object in this exact format (no markdown, no explanation):
{
  "food_name": "Name of the dish",
  "calories": 450,
  "protein_g": 35,
  "carbs_g": 40,
  "fat_g": 12,
  "notes": "Brief description of what you see and any important notes about the estimate"
}
Be specific about the food name. Base estimates on typical restaurant/home serving sizes.`,
            },
          ],
        },
      ],
    });

    const text = message.content[0].text.trim();

    let result;
    try {
      result = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) result = JSON.parse(match[0]);
      else throw new Error('Could not parse AI response');
    }

    res.json(result);
  } catch (err) {
    console.error('Claude API error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`CalTrack server running on port ${PORT}`);
});
