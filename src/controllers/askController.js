const aiService = require("../services/aiService");
const knowledgeService = require("../services/knowledgeService");
const logger = require("../utils/logger");

async function handleAsk(req, res) {
  const startTime = Date.now();
  const { question, conversationHistory = [] } = req.body;

  try {
    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "Question is required" });
    }

    logger.log(`\n📝 Question received: "${question}"`);
    logger.log(`📜 Conversation history: ${conversationHistory.length} messages`);

    // Search knowledge base
    const relevantDocs = knowledgeService.searchKnowledge(question);
    logger.log(`📚 Found ${relevantDocs.length} relevant documents`);

    // Get AI response with context and history
    const answer = await aiService.askAI(question, conversationHistory);
    const duration = Date.now() - startTime;

    logger.log(`✅ Answer generated in ${duration}ms\n`);

    res.json({
      answer,
      meta: {
        durationMs: duration,
        documentsSearched: relevantDocs.length,
      },
    });
  } catch (error) {
    logger.logError(error, { question });

    // Forward rate-limit (429) from AI provider so the client can show a notification
    if (error.statusCode === 429) {
      if (error.retryAfter) {
        res.set('Retry-After', error.retryAfter);
      }
      return res.status(429).json({
        error: error.message || "AI provider rate limit reached. Please wait and try again.",
        retryAfter: error.retryAfter || 15,
      });
    }

    res.status(500).json({
      error: error.message || "Failed to process question",
    });
  }
}

module.exports = {
  handleAsk,
};