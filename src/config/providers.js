"use strict";

const PROVIDERS = {
    anthropic: {
        id: "anthropic",
        name: "Anthropic (Claude)",
        models: [
            { id: "claude-sonnet-5", name: "Claude 5 Sonnet" },
            { id: "claude-opus-4-8", name: "Claude 4.8 Opus" },
            { id: "claude-opus-4-7", name: "Claude 4.7 Opus" },
            { id: "claude-sonnet-4-6", name: "Claude 4.6 Sonnet" },
            { id: "claude-haiku-4-5-20251001", name: "Claude 4.5 Haiku" },
            { id: "claude-fable-5", name: "Claude 5 Fable" },
        ],
        defaultModel: "claude-sonnet-5",
        envVar: "ANTHROPIC_API_KEY",
    },
    openai: {
        id: "openai",
        name: "OpenAI",
        models: [
            { id: "gpt-5.6-terra", name: "GPT-5.6 Terra" },
            { id: "gpt-5.6-sol", name: "GPT-5.6 Sol" },
            { id: "gpt-5.6-luna", name: "GPT-5.6 Luna" },
            { id: "gpt-5.5-pro", name: "GPT-5.5 Pro" },
            { id: "gpt-5.5", name: "GPT-5.5" },
            { id: "gpt-5.4", name: "GPT-5.4" },
            { id: "gpt-5.4-mini", name: "GPT-5.4 Mini" },
            { id: "gpt-5.2", name: "GPT-5.2" },
            { id: "gpt-5", name: "GPT-5" },
            { id: "gpt-5-mini", name: "GPT-5 Mini" },
            { id: "gpt-5-nano", name: "GPT-5 Nano" },
            { id: "gpt-4.1", name: "GPT-4.1" },
            { id: "gpt-4.1-mini", name: "GPT-4.1 Mini" },
            { id: "gpt-4.1-nano", name: "GPT-4.1 Nano" },
            { id: "gpt-4o", name: "GPT-4o" },
            { id: "gpt-4o-mini", name: "GPT-4o Mini" },
            { id: "o4-mini", name: "o4-mini" },
            { id: "o3", name: "o3" },
            { id: "o3-mini", name: "o3-mini" },
            { id: "o1", name: "o1" },
        ],
        defaultModel: "gpt-5.6-terra",
        envVar: "OPENAI_API_KEY",
    },
    google: {
        id: "google",
        name: "Google (Gemini)",
        models: [
            { id: "gemini-3.7-flash", name: "Gemini 3.7 Flash" },
            { id: "gemini-3.6-flash", name: "Gemini 3.6 Flash" },
            { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash" },
            { id: "gemini-3.5-flash-lite", name: "Gemini 3.5 Flash-Lite" },
            { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro" },
            { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro" },
            { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
            { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash-Lite" },
        ],
        defaultModel: "gemini-3.5-flash",
        envVar: "GOOGLE_API_KEY",
    },
    custom: {
        id: "custom",
        name: "Custom / Self-hosted",
        // Sem lista fixa de modelos: o usuário digita o nome do modelo (ex.: "llama3.1")
        // e a URL do servidor (ex.: "http://localhost:11434/v1" pro Ollama).
        // Qualquer servidor compatível com a API de chat completions da OpenAI funciona:
        // Ollama, LM Studio, vLLM, LocalAI, text-generation-webui, etc.
        models: [],
        defaultModel: "",
        envVar: "CUSTOM_API_KEY",
        requiresBaseUrl: true,
        apiKeyOptional: true,
    },
};

module.exports = { PROVIDERS };
