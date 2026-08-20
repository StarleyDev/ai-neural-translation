"use strict";

const OpenAI = require("openai");
const { buildPrompt, extractJsonArray, mapResults } = require("./base");

// Qualquer servidor compatível com a API de chat completions da OpenAI (Ollama, LM
// Studio, vLLM, LocalAI, text-generation-webui, etc.) — usuário informa a URL base e o
// nome do modelo instalado no próprio servidor. A chave de API costuma ser dispensável
// nesses servidores locais, então usamos um placeholder quando não for informada (o SDK
// da OpenAI exige alguma string não vazia pra ser inicializado).
class CustomProvider
{
    constructor({ apiKey, model, promptTemplate, baseUrl })
    {
        if (!baseUrl)
        {
            throw new Error("Configure a URL do servidor customizado em Configurações.");
        }

        this.client = new OpenAI({ apiKey: apiKey || "not-needed", baseURL: baseUrl });
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
                // Suportado por alguns servidores (ex.: Ollama com modelos Qwen3) para
                // desligar o modo de raciocínio; ignorado sem erro pelos que não suportam.
                think: false,
            },
            { signal }
        );

        const raw = response.choices[0]?.message?.content || "";

        try
        {
            return mapResults(batch, extractJsonArray(raw));
        }
        catch (error)
        {
            console.error(`[custom] falha ao interpretar resposta do modelo "${this.model}": ${error.message}`);
            console.error(`[custom] resposta bruta (${raw.length} caracteres):\n${raw}`);
            throw error;
        }
    }
}

module.exports = CustomProvider;
