"use strict";

const fs = require("fs");
const path = require("path");
const { PROVIDERS } = require("./providers");

const SETTINGS_PATH = path.join(__dirname, "..", "..", "data", "settings.json");
const APP_VERSION = require("../../package.json").version;

function maskKey(key)
{
    if (!key) return null;
    if (key.length <= 8) return "••••" + key.slice(-2);
    return `${key.slice(0, 6)}••••${key.slice(-4)}`;
}

function readRaw()
{
    if (!fs.existsSync(SETTINGS_PATH))
    {
        return { provider: "anthropic", model: PROVIDERS.anthropic.defaultModel, apiKeys: {} };
    }
    const content = fs.readFileSync(SETTINGS_PATH, "utf-8");
    return JSON.parse(content);
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

        return { provider: raw.provider, model: raw.model, apiKey };
    }

    update({ provider, model, apiKey })
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

        writeRaw(raw);
        return this.getPublicSettings();
    }
}

module.exports = new SettingsStore();
