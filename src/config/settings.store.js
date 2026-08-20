"use strict";

const fs = require("fs");
const path = require("path");
const { PROVIDERS } = require("./providers");
const { DEFAULT_PROMPT_TEMPLATE } = require("../services/providers/base");
const { DATA_DIR } = require("./data-dir");

const SETTINGS_PATH = path.join(DATA_DIR, "settings.json");
const APP_VERSION = require("../../package.json").version;

const DEFAULT_BATCH_SIZE = 40;
const DEFAULT_CUSTOM_BATCH_SIZE = 5;
const MIN_BATCH_SIZE = 1;
const MAX_BATCH_SIZE = 100;

function maskKey(key)
{
    if (!key) return null;
    if (key.length <= 8) return "••••" + key.slice(-2);
    return `${key.slice(0, 6)}••••${key.slice(-4)}`;
}

function defaultSettings()
{
    return {
        provider: "anthropic",
        model: PROVIDERS.anthropic.defaultModel,
        apiKeys: {},
        promptTemplate: null,
        customBaseUrl: null,
        customModel: null,
        batchSize: null,
    };
}

// Padrão depende do provedor: modelos locais/custom costumam ser pequenos (às vezes
// "raciocinadores"), então um lote menor evita resposta cortada antes de fechar o JSON.
function defaultBatchSizeFor(providerId)
{
    return providerId === "custom" ? DEFAULT_CUSTOM_BATCH_SIZE : DEFAULT_BATCH_SIZE;
}

function resolveBatchSize(saved, providerId)
{
    return saved || defaultBatchSizeFor(providerId);
}

function readRaw()
{
    if (!fs.existsSync(SETTINGS_PATH))
    {
        return defaultSettings();
    }

    const content = fs.readFileSync(SETTINGS_PATH, "utf-8");
    let parsed;
    try
    {
        parsed = content.trim() ? JSON.parse(content) : {};
    }
    catch
    {
        parsed = {};
    }

    return { ...defaultSettings(), ...parsed, apiKeys: { ...parsed.apiKeys } };
}

function writeRaw(data)
{
    fs.mkdirSync(path.dirname(SETTINGS_PATH), { recursive: true });
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// Chave de ambiente (.env) é usada como fallback quando não há chave salva nas configurações.
function resolveApiKey(providerId, apiKeys)
{
    const saved = apiKeys[providerId];
    if (saved) return saved;

    const envVar = PROVIDERS[providerId]?.envVar;
    return envVar ? process.env[envVar] || null : null;
}

// Prioridade: ajuste salvo pela UI > padrão definido no .env > padrão embutido no código.
function resolvePromptTemplate(saved)
{
    if (saved) return saved;
    return process.env.TRANSLATION_PROMPT_TEMPLATE || DEFAULT_PROMPT_TEMPLATE;
}

function resolveBaseUrl(saved)
{
    return saved || process.env.CUSTOM_BASE_URL || null;
}

class SettingsStore
{
    getPublicSettings()
    {
        const raw = readRaw();

        const providers = Object.values(PROVIDERS).map((provider) => ({
            id: provider.id,
            name: provider.name,
            models: provider.models,
            hasApiKey: Boolean(resolveApiKey(provider.id, raw.apiKeys)),
            apiKeyMasked: maskKey(resolveApiKey(provider.id, raw.apiKeys)),
            apiKeyOptional: Boolean(provider.apiKeyOptional),
            requiresBaseUrl: Boolean(provider.requiresBaseUrl),
        }));

        return {
            provider: raw.provider,
            model: raw.provider === "custom" ? (raw.customModel || "") : raw.model,
            providers,
            appVersion: APP_VERSION,
            promptTemplate: resolvePromptTemplate(raw.promptTemplate),
            isDefaultPromptTemplate: !raw.promptTemplate,
            defaultPromptTemplate: process.env.TRANSLATION_PROMPT_TEMPLATE || DEFAULT_PROMPT_TEMPLATE,
            customBaseUrl: resolveBaseUrl(raw.customBaseUrl),
            batchSize: resolveBatchSize(raw.batchSize, raw.provider),
            isDefaultBatchSize: !raw.batchSize,
            defaultBatchSize: defaultBatchSizeFor(raw.provider),
            minBatchSize: MIN_BATCH_SIZE,
            maxBatchSize: MAX_BATCH_SIZE,
        };
    }

    getActiveConfig()
    {
        const raw = readRaw();
        const providerDef = PROVIDERS[raw.provider];
        const apiKey = resolveApiKey(raw.provider, raw.apiKeys);

        if (!apiKey && !providerDef?.apiKeyOptional)
        {
            throw new Error(
                `Nenhuma chave de API configurada para ${providerDef?.name || raw.provider}. ` +
                `Configure em Configurações.`
            );
        }

        const baseUrl = providerDef?.requiresBaseUrl ? resolveBaseUrl(raw.customBaseUrl) : undefined;
        if (providerDef?.requiresBaseUrl && !baseUrl)
        {
            throw new Error(`Configure a URL do servidor em Configurações para usar ${providerDef.name}.`);
        }

        const model = raw.provider === "custom" ? raw.customModel : raw.model;
        if (!model)
        {
            throw new Error(`Escolha um modelo em Configurações para usar ${providerDef?.name || raw.provider}.`);
        }

        return {
            provider: raw.provider,
            model,
            apiKey,
            promptTemplate: resolvePromptTemplate(raw.promptTemplate),
            baseUrl,
            batchSize: resolveBatchSize(raw.batchSize, raw.provider),
        };
    }

    update({ provider, model, apiKey, promptTemplate, resetPromptTemplate, baseUrl, batchSize, resetBatchSize })
    {
        const raw = readRaw();

        if (provider && !PROVIDERS[provider])
        {
            throw new Error(`Provedor desconhecido: ${provider}`);
        }

        if (provider) raw.provider = provider;

        if (model)
        {
            if (raw.provider === "custom") raw.customModel = model;
            else raw.model = model;
        }

        if (apiKey)
        {
            raw.apiKeys = raw.apiKeys || {};
            raw.apiKeys[raw.provider] = apiKey;
        }

        if (typeof baseUrl === "string")
        {
            raw.customBaseUrl = baseUrl.trim() || null;
        }

        if (resetBatchSize)
        {
            raw.batchSize = null;
        }
        else if (batchSize !== undefined && batchSize !== null && batchSize !== "")
        {
            const parsed = Number(batchSize);
            if (!Number.isInteger(parsed) || parsed < MIN_BATCH_SIZE || parsed > MAX_BATCH_SIZE)
            {
                throw new Error(`O tamanho do lote precisa ser um número inteiro entre ${MIN_BATCH_SIZE} e ${MAX_BATCH_SIZE}.`);
            }
            raw.batchSize = parsed;
        }

        if (resetPromptTemplate)
        {
            raw.promptTemplate = null;
        }
        else if (typeof promptTemplate === "string" && promptTemplate.trim())
        {
            if (!promptTemplate.includes("{{items}}"))
            {
                throw new Error('O prompt precisa conter o placeholder "{{items}}".');
            }
            raw.promptTemplate = promptTemplate;
        }

        writeRaw(raw);
        return this.getPublicSettings();
    }
}

module.exports = new SettingsStore();
