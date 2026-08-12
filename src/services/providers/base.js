"use strict";

function buildPrompt(payload, targetLanguage)
{
    return (
        `Traduza as legendas abaixo para ${targetLanguage}. ` +
        `Mantenha o tom, quebras de linha e formatação (tags como <i>, <b>) de cada item. ` +
        `Não traduza nomes próprios óbvios quando não fizer sentido. ` +
        `Responda APENAS com um JSON array no formato [{"id": number, "text": string}, ...], ` +
        `na mesma ordem e quantidade dos itens recebidos, sem nenhum texto adicional.\n\n` +
        `Itens:\n${JSON.stringify(payload)}`
    );
}

function extractJsonArray(raw)
{
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch)
    {
        throw new Error("Resposta do modelo não contém um JSON array válido.");
    }
    return JSON.parse(jsonMatch[0]);
}

function mapResults(batch, parsed)
{
    return batch.map((_, idx) =>
    {
        const item = parsed.find((p) => p.id === idx);
        return item ? item.text : batch[idx].text;
    });
}

module.exports = { buildPrompt, extractJsonArray, mapResults };
