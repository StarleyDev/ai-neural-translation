"use strict";

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { buildPrompt, extractJsonArray, mapResults } = require("./base");

class GoogleProvider
{
    constructor({ apiKey, model })
    {
        this.client = new GoogleGenerativeAI(apiKey);
        this.model = model;
    }

    async translateBatch(batch, targetLanguage, { signal } = {})
    {
        const payload = batch.map((b, idx) => ({ id: idx, text: b.text }));
        const prompt = buildPrompt(payload, targetLanguage);

        const model = this.client.getGenerativeModel({ model: this.model });
        const result = await model.generateContent(prompt, { signal });
        const raw = result.response.text();

        return mapResults(batch, extractJsonArray(raw));
    }
}

module.exports = GoogleProvider;
