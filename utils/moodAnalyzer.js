// utils/moodAnalyzer.js

const moodKeywords = {
  happy: ["happy", "joy", "excited", "good", "smile", "glad"],
  sad: ["sad", "down", "depressed", "unhappy", "cry"],
  angry: ["angry", "mad", "furious", "annoyed"],
  stressed: ["stressed", "overwhelmed", "pressure"],
  anxiety: ["anxious", "nervous", "worried", "panic"],
  emotional: ["emotional", "tears", "sensitive"],
};

function detectMoodFromText(message) {
  const scores = {};
  Object.keys(moodKeywords).forEach((m) => (scores[m] = 0));

  const words = message.toLowerCase().split(/\W+/);
  words.forEach((word) => {
    Object.keys(moodKeywords).forEach((m) => {
      if (moodKeywords[m].includes(word)) scores[m]++;
    });
  });

  let maxMood = "neutral";
  let maxScore = 0;
  Object.entries(scores).forEach(([mood, score]) => {
    if (score > maxScore) {
      maxScore = score;
      maxMood = mood;
    }
  });

  return {
    mood: maxMood,
    score: maxScore,
    keywords: words.filter((w) => Object.values(moodKeywords).flat().includes(w)),
  };
}

module.exports = detectMoodFromText;
