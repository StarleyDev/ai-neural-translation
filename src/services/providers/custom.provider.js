"use strict";

const OpenAI = require("openai");
const { buildPrompt, extractJsonArray, mapResults, TRANSLATION_JSON_SCHEMA } = require("./base");

// Modos de resposta, do mais restritivo para o menos. Servidores que suportam
// "structured outputs" (Ollama, LM Studio, vLLM, LocalAI recentes) restringem a geração
// à gramática do schema — o modelo fica impedido de emitir qualquer token que quebre o
// JSON. É o que resolve na raiz os erros de sintaxe de modelos locais menores, em vez de
// tentar remendar a resposta depois. Servidores mais antigos rejeitam esses parâmetros,
// então caímos progressivamente até "sem restrição" (comportamento antigo).
const RESPONSE_MODES = [
    {
        name: "json_schema",
        responseFormat: {
            type: "json_schema",
            json_schema: { name: "translations", strict: true, schema: TRANSLATION_JSON_SCHEMA },
        },
    },
    {
        name: "json_object",
        responseFormat: { type: "json_object" },
    },
    {
        name: "none",
        responseFormat: null,
    },
];

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
        // Descoberto na primeira requisição e reaproveitado nos lotes seguintes, para não
        // repetir requisições que já sabemos que o servidor rejeita.
        this.responseModeIndex = 0;
    }

    async createCompletion(prompt, signal)
    {
        let lastError;

        while (this.responseModeIndex < RESPONSE_MODES.length)
        {
            const mode = RESPONSE_MODES[this.responseModeIndex];
            const body = {
                model: this.model,
                messages: [{ role: "user", content: prompt }],
                // Suportado por alguns servidores (ex.: Ollama com modelos Qwen3) para
                // desligar o modo de raciocínio; ignorado sem erro pelos que não suportam.
                think: false,
            };
            if (mode.responseFormat) body.response_format = mode.responseFormat;

            try
            {
                return await this.client.chat.completions.create(body, { signal });
            }
            catch (error)
            {
                // 4xx aqui significa "servidor não entende esse parâmetro": tenta o modo
                // seguinte. Erros de rede/timeout/500 são problemas reais e sobem.
                const status = error?.status;
                const isUnsupportedParam = status >= 400 && status < 500;
                if (!isUnsupportedParam || mode.responseFormat === null) throw error;

                console.warn(`[custom] servidor não aceitou response_format "${mode.name}", tentando modo mais simples.`);
                lastError = error;
                this.responseModeIndex++;
            }
        }

        throw lastError;
    }

    async translateBatch(batch, targetLanguage, { signal } = {})
    {
        const payload = batch.map((b, idx) => ({ id: idx, text: b.text }));
        const prompt = buildPrompt(payload, targetLanguage, this.promptTemplate);

        const response = await this.createCompletion(prompt, signal);
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
