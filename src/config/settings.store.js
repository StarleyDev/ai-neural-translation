"use strict";

const fs = require("fs");
const path = require("path");
const { PROVIDERS } = require("./providers");
const { DEFAULT_PROMPT_TEMPLATE } = require("../services/providers/base");
const { DATA_DIR } = require("./data-dir");

const SETTINGS_PATH = path.join(DATA_DIR, "settings.json");
const APP_VERSION = require("../../package.json").version;

function maskKey(key)
{
    if (!key) return null;
    if (key.length <= 8) return "••••" + key.slice(-2);
    return `${key.slice(0, 6)}••••${key.slice(-4)}`;
}

function defaultSettings()
{
    return { provider: "anthropic", model: PROVIDERS.anthropic.defaultModel, apiKeys: {}, promptTemplate: null };
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
        }));

        return {
            provider: raw.provider,
            model: raw.model,
            providers,
            appVersion: APP_VERSION,
            promptTemplate: resolvePromptTemplate(raw.promptTemplate),
            isDefaultPromptTemplate: !raw.promptTemplate,
            defaultPromptTemplate: process.env.TRANSLATION_PROMPT_TEMPLATE || DEFAULT_PROMPT_TEMPLATE,
        };
    }

    getActiveConfig()
    {
        const raw = readRaw();
        const apiKey = resolveApiKey(raw.provider, raw.apiKeys);

        if (!apiKey)
        {
            throw new Error(
                `Nenhuma chave de API configurada para ${PROVIDERS[raw.provider]?.name || raw.provider}. ` +
                `Configure em Configurações.`
            );
        }

        return {
            provider: raw.provider,
            model: raw.model,
            apiKey,
            promptTemplate: resolvePromptTemplate(raw.promptTemplate),
        };
    }

    update({ provider, model, apiKey, promptTemplate, resetPromptTemplate })
    {
        const raw = readRaw();

        if (provider && !PROVIDERS[provider])
        {
            throw new Error(`Provedor desconhecido: ${provider}`);
        }

        if (provider) raw.provider = provider;
        if (model) raw.model = model;

        if (apiKey)
        {
            raw.apiKeys = raw.apiKeys || {};
            raw.apiKeys[raw.provider] = apiKey;
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
