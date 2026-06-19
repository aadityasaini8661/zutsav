const { getGeminiResponse } = require('../utils/gemini');

// POST /api/ai/chat
exports.chat = async (req, res, next) => {
  try {
    const { history } = req.body;

    if (!Array.isArray(history) || history.length === 0) {
      return res.status(400).json({ success: false, message: 'history array is required' });
    }

    const lastMsg = history[history.length - 1];
    if (!lastMsg?.text || lastMsg.role !== 'user') {
      return res.status(400).json({ success: false, message: 'Last message must be a user message with text' });
    }

    if (history.length > 20) {
      return res.status(400).json({ success: false, message: 'History too long (max 20 messages)' });
    }

    const reply = await getGeminiResponse(history);
    res.json({ success: true, reply });
  } catch (err) {
    if (err.response?.status === 400 || err.message?.includes('API key')) {
      return res.status(503).json({ success: false, message: 'AI service is temporarily unavailable' });
    }
    next(err);
  }
};
