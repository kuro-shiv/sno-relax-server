const express = require('express');
const router = express.Router();
const ChatHistory = require('../models/ChatHistory');
const Mood = require('../models/Mood');
const User = require('../models/User');
const fetch = require('node-fetch');

const COHERE_API_KEY = process.env.COHERE_API_KEY;

async function callCohereGuide(prompt) {
  if (!COHERE_API_KEY) throw new Error('Cohere API key not configured');
  const url = 'https://api.cohere.ai/v1/generate';
  const enhanced = `You are SnoBot, a compassionate mental health assistant. Given the user's concise history and mood data, produce a short JSON object with keys: summary (one short paragraph), urgent (true/false), recommendations (array of objects with title, type("yoga"|"exercise"|"breathing"|"lifestyle"), durationMinutes, intensity("low"|"moderate"|"high"), steps (array of short step instructions)). Keep responses safe and do not provide medical diagnoses. User data:\n${prompt}\nRespond ONLY with valid JSON.`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${COHERE_API_KEY}` },
    body: JSON.stringify({ model: 'xlarge', prompt: enhanced, max_tokens: 300, temperature: 0.7 }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cohere failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  const text = data?.generations?.[0]?.text || '';
  // Try to extract JSON
  const jsonStart = text.indexOf('{');
  const jsonText = jsonStart !== -1 ? text.slice(jsonStart) : text;
  try {
    const obj = JSON.parse(jsonText);
    return obj;
  } catch (e) {
    // If parsing fails, return a fallback structure
    return { summary: text.trim().split('\n')[0] || '', urgent: false, recommendations: [] };
  }
}

// Local JS fallback generator (no third-party)
function localGuideFromData({ history, moods, profile }) {
  const recent = (history || []).slice(-10).map(h => h.userMessage || h.userMessage || '').join(' \n ');
  const moodKeywords = (moods || []).map(m => m.note || m.mood || '').join(' ').toLowerCase();
  const textBlob = `${recent} ${moodKeywords} ${profile?.history || ''}`.toLowerCase();

  const contains = (words) => words.some(w => textBlob.includes(w));

  const recs = [];
  // Breathing exercises for stress/anxiety
  if (contains(['stress','anx','panic','overwhelm','overwhelmed','worry'])) {
    recs.push({ title: '4-7-8 Breathing', type: 'breathing', durationMinutes: 5, intensity: 'low', steps: ['Sit comfortably','Inhale for 4 seconds','Hold for 7 seconds','Exhale slowly for 8 seconds','Repeat 4 cycles'] });
    recs.push({ title: 'Gentle Yoga Flow', type: 'yoga', durationMinutes: 10, intensity: 'low', steps: ['Child pose - 1 min','Cat-Cow - 1 min','Downward dog - 1 min','Low lunge each side - 1 min','Savasana - 3 min'] });
  }

  // Low energy -> light movement + sleep hygiene
  if (contains(['tired','fatigue','sleep','insomnia','sleeping'])) {
    recs.push({ title: 'Evening Stretch & Wind-down', type: 'lifestyle', durationMinutes: 12, intensity: 'low', steps: ['Gentle neck rolls - 1 min','Seated forward fold - 2 min','Legs up the wall - 5 min','Deep breathing - 4 min'] });
  }

  // General fitness suggestions
  if (recs.length === 0) {
    recs.push({ title: 'Quick Bodyweight Circuit', type: 'exercise', durationMinutes: 12, intensity: 'moderate', steps: ['Jumping jacks - 1 min','Bodyweight squats - 1 min','Push-ups (knees ok) - 1 min','Plank - 45s','Rest 30s and repeat 2x'] });
    recs.push({ title: 'Morning Mobility', type: 'yoga', durationMinutes: 8, intensity: 'low', steps: ['Neck circles - 30s','Shoulder rolls - 30s','Hip circles - 1 min','Sun salutations x3 - 5 min'] });
  }

  return { summary: (recent || 'No significant chat history available.').slice(0, 300), urgent: false, recommendations: recs };
}

router.post('/guide', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    // Fetch recent chat history
    const history = await ChatHistory.find({ userId }).sort({ timestamp: 1 }).limit(200);
    // Fetch recent moods
    let moods = [];
    try { moods = await Mood.find({ userId }).sort({ createdAt: -1 }).limit(7); } catch (e) {}
    // User profile
    let profile = {};
    try { profile = (await User.findOne({ $or: [{ userId }, { _id: userId }] })) || {}; } catch (e) {}

    // Prepare compact prompt
    const compact = {
      history: history.slice(-20).map(h => ({ userMessage: h.userMessage, botReply: h.botReply })),
      moods: moods.map(m => ({ mood: m.mood, note: m.notes, date: m.createdAt })),
      profile: { firstName: profile.firstName, history: profile.history }
    };

    // Try Cohere first
    if (COHERE_API_KEY) {
      try {
        const prompt = JSON.stringify(compact);
        const guide = await callCohereGuide(prompt);
        return res.json({ ok: true, guide });
      } catch (err) {
        console.warn('Cohere guide failed, falling back to local generator:', err.message);
      }
    }

    // Local fallback
    const guide = localGuideFromData(compact);
    res.json({ ok: true, guide });
  } catch (err) {
    console.error('AI guide error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
