"use strict";

const Anthropic = require("@anthropic-ai/sdk");
const { buildPrompt, extractJsonArray, mapResults } = require("./base");

class AnthropicProvider
{
    constructor({ apiKey, model })
    {
        this.client = new Anthropic({ apiKey });
        this.model = model;
    }

    async translateBatch(batch, targetLanguage, { signal } = {})
    {
        const payload = batch.map((b, idx) => ({ id: idx, text: b.text }));
        const prompt = buildPrompt(payload, targetLanguage);

        const response = await this.client.messages.create(
            {
                model: this.model,
                max_tokens: 4096,
                messages: [{ role: "user", content: prompt }],
            },
            { signal }
        );

        const raw = response.content
            .filter((block) => block.type === "text")
            .map((block) => block.text)
            .join("");

        return mapResults(batch, extractJsonArray(raw));
    }
}

module.exports = AnthropicProvider;
