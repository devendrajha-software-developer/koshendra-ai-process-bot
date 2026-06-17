const axios = require("axios");
const config = require("../config");
const AI_PROVIDERS = require("../config/aiProviders");
const knowledgeService = require("./knowledgeService");
const logger = require("../utils/logger");

function getSystemPrompt(contextKnowledge) {
  if (!contextKnowledge || contextKnowledge.trim() === '') {
    return `You are an intelligent internal process assistant for a company.

The user asked a question but NO relevant documentation was found in the knowledge base.

Please respond EXACTLY like this:
"❌ **No Documentation Found**

I couldn't find specific information about this topic in my knowledge base.

**Available Topics:**
- Order Management (orders, creation, processing, status)
- Shipment Management (tracking, carrier, delivery)
- Billing & Payments (invoices, payment processing, refunds)

**What you can do:**
1. Try rephrasing your question
2. Ask about one of the available topics above
3. Contact your administrator to add documentation for this topic"

Do not make up information. Only respond with the above message.`;
  }

  return `You are an intelligent internal process assistant for a company. Your role is to help employees understand business processes, workflows, and procedures.

INSTRUCTIONS:
- Answer questions ONLY based on the provided knowledge base below
- If the answer is not found in the knowledge base, say "I don't have information about that in my knowledge base"
- Be concise, professional, and helpful
- Use bullet points or numbered steps when explaining processes
- If a question is unclear, ask for clarification
- Highlight important warnings or notes when relevant

At the END of your response, add a section like this:
---
**Related Questions:**
- [Suggest 2-3 related questions the user might want to ask next based on the context]

KNOWLEDGE BASE:
${contextKnowledge}`;
}

async function askGroq(question, contextKnowledge, apiKey, conversationHistory = []) {
  const provider = AI_PROVIDERS.groq;
  
  // Build messages array with history
  const messages = [
    { role: "system", content: getSystemPrompt(contextKnowledge) }
  ];
  
  // Add conversation history (last 10 messages for context)
  const recentHistory = conversationHistory.slice(-10);
  recentHistory.forEach(msg => {
    messages.push({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    });
  });
  
  // Add current question
  messages.push({ role: "user", content: question });
  
  try {
    const response = await axios.post(
      provider.baseUrl,
      {
        model: config.ai.model || provider.defaultModel,
        messages: messages,
        temperature: config.ai.temperature,
        max_tokens: config.ai.maxTokens,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: config.ai.timeout,
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    if (error.response) {
      logger.logError(error, { 
        context: "Groq API", 
        status: error.response.status,
        data: error.response.data 
      });
      const err = new Error(`Groq API Error: ${error.response.data?.error?.message || error.response.statusText}`);
      err.statusCode = error.response.status;
      err.retryAfter = error.response.headers?.['retry-after'] || null;
      throw err;
    }
    throw error;
  }
}

async function askOpenAI(question, contextKnowledge, apiKey) {
  const provider = AI_PROVIDERS.openai;
  
  try {
    const response = await axios.post(
      provider.baseUrl,
      {
        model: config.ai.model || provider.defaultModel,
        messages: [
          { role: "system", content: getSystemPrompt(contextKnowledge) },
          { role: "user", content: question },
        ],
        temperature: config.ai.temperature,
        max_tokens: config.ai.maxTokens,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: config.ai.timeout,
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    if (error.response) {
      logger.logError(error, { context: "OpenAI API", status: error.response.status, data: error.response.data });
      const err = new Error(`OpenAI API Error: ${error.response.data?.error?.message || error.response.statusText}`);
      err.statusCode = error.response.status;
      err.retryAfter = error.response.headers?.['retry-after'] || null;
      throw err;
    }
    throw error;
  }
}

async function askAnthropic(question, contextKnowledge, apiKey) {
  const provider = AI_PROVIDERS.anthropic;
  
  try {
    const response = await axios.post(
      provider.baseUrl,
      {
        model: config.ai.model || provider.defaultModel,
        max_tokens: config.ai.maxTokens,
        system: getSystemPrompt(contextKnowledge),
        messages: [{ role: "user", content: question }],
      },
      {
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
        },
        timeout: config.ai.timeout,
      }
    );

    return response.data.content[0].text;
  } catch (error) {
    if (error.response) {
      logger.logError(error, { context: "Anthropic API", status: error.response.status, data: error.response.data });
      const err = new Error(`Anthropic API Error: ${error.response.data?.error?.message || error.response.statusText}`);
      err.statusCode = error.response.status;
      err.retryAfter = error.response.headers?.['retry-after'] || null;
      throw err;
    }
    throw error;
  }
}

async function askAI(question, conversationHistory = []) {
  // Get relevant documents using searchKnowledge
  const relevantDocs = knowledgeService.searchKnowledge(question);
  
  // Build context from relevant docs
  const contextKnowledge = relevantDocs
    .map((doc) => {
      return `--- ${doc.name} (relevance: ${doc.score}) ---\n${doc.content}`;
    })
    .join("\n\n");

  const provider = config.ai.provider;
  const apiKey = config.apiKeys[provider];

  if (!apiKey) {
    throw new Error(`API key not configured for provider: ${provider}`);
  }

  logger.info(`Using AI provider: ${provider}`);

  switch (provider) {
    case "groq":
      return await askGroq(question, contextKnowledge, apiKey, conversationHistory);
    case "openai":
      return await askOpenAI(question, contextKnowledge, apiKey, conversationHistory);
    case "anthropic":
      return await askAnthropic(question, contextKnowledge, apiKey, conversationHistory);
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

function getCurrentProvider() {
  return {
    provider: config.ai.provider,
    model: config.ai.model,
    available: AI_PROVIDERS,
  };
}

module.exports = {
  askAI,
  getCurrentProvider,
};