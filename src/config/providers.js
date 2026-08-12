"use strict";

const PROVIDERS = {
    anthropic: {
        id: "anthropic",
        name: "Anthropic (Claude)",
        models: [
            { id: "claude-sonnet-5", name: "Claude Sonnet 5" },
            { id: "claude-opus-5", name: "Claude Opus 5" },
            { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5" },
        ],
        defaultModel: "claude-sonnet-5",
        envVar: "ANTHROPIC_API_KEY",
    },
    openai: {
        id: "openai",
        name: "OpenAI",
        models: [
            { id: "gpt-4o", name: "GPT-4o" },
            { id: "gpt-4o-mini", name: "GPT-4o mini" },
            { id: "gpt-4.1", name: "GPT-4.1" },
        ],
        defaultModel: "gpt-4o-mini",
        envVar: "OPENAI_API_KEY",
    },
    google: {
        id: "google",
        name: "Google (Gemini)",
        models: [
            { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
            { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
        ],
        defaultModel: "gemini-2.0-flash",
        envVar: "GOOGLE_API_KEY",
    },
};

module.exports = { PROVIDERS };
