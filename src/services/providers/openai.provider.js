"use strict";

const OpenAI = require("openai");
const { buildPrompt, extractJsonArray, mapResults } = require("./base");

class OpenAiProvider
{
    constructor({ apiKey, model, promptTemplate })
    {
        this.client = new OpenAI({ apiKey });
        this.model = model;
        this.promptTemplate = promptTemplate;
    }

    async translateBatch(batch, targetLanguage, { signal } = {})
    {
        const payload = batch.map((b, idx) => ({ id: idx, text: b.text }));
        const prompt = buildPrompt(payload, targetLanguage, this.promptTemplate);

        const response = await this.client.chat.completions.create(
            {
                model: this.model,
                messages: [{ role: "user", content: prompt }],
            },
            { signal }
        );

        const raw = response.choices[0]?.message?.content || "";
        return mapResults(batch, extractJsonArray(raw));
    }
}

module.exports = OpenAiProvider;
