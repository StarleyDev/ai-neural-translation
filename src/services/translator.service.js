"use strict";

const settingsStore = require("../config/settings.store");
const AnthropicProvider = require("./providers/anthropic.provider");
const OpenAiProvider = require("./providers/openai.provider");
const GoogleProvider = require("./providers/google.provider");

const BATCH_SIZE = 40;

const PROVIDER_CLASSES = {
    anthropic: AnthropicProvider,
    openai: OpenAiProvider,
    google: GoogleProvider,
};

class CancelledError extends Error
{
    constructor()
    {
        super("Tradução cancelada.");
        this.name = "CancelledError";
    }
}

class TranslatorService
{
    constructor()
    {
        const { provider, model, apiKey } = settingsStore.getActiveConfig();

        const ProviderClass = PROVIDER_CLASSES[provider];
        if (!ProviderClass)
        {
            throw new Error(`Provedor não suportado: ${provider}`);
        }

        this.providerId = provider;
        this.provider = new ProviderClass({ apiKey, model });
    }

    async translateBlocks(blocks, targetLanguage = "pt-br", onProgress, signal)
    {
        const translated = [];
        const totalBatches = Math.ceil(blocks.length / BATCH_SIZE);

        for (let i = 0; i < blocks.length; i += BATCH_SIZE)
        {
            if (signal?.aborted) throw new CancelledError();

            const batchNumber = i / BATCH_SIZE + 1;
            console.log(`[translate:${this.providerId}] lote ${batchNumber}/${totalBatches}`);

            const batch = blocks.slice(i, i + BATCH_SIZE);
            const texts = await this.provider.translateBatch(batch, targetLanguage, { signal });

            if (signal?.aborted) throw new CancelledError();

            batch.forEach((block, idx) =>
            {
                translated.push({ ...block, text: texts[idx] ?? block.text });
            });

            if (onProgress) onProgress({ batch: batchNumber, totalBatches });
        }

        return translated;
    }
}

module.exports = TranslatorService;
module.exports.CancelledError = CancelledError;
