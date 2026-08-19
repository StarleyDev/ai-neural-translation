"use strict";

const DEFAULT_PROMPT_TEMPLATE =
    `Traduza as legendas abaixo para {{targetLanguage}}. ` +
    `Mantenha o tom, quebras de linha e formatação (tags como <i>, <b>) de cada item. ` +
    `Decida pelo contexto da frase, não pela capitalização: palavras podem ser ambíguas entre nome próprio e substantivo comum ` +
    `(ex.: "Trader" pode ser um cargo -> "Comerciante"/"Operador", ou "Turkey" pode ser o animal -> "peru" ou o país -> "Turquia"). ` +
    `Traduza normalmente quando o contexto indicar um substantivo comum. ` +
    `Só preserve no idioma original nomes próprios de fato (nomes de pessoas específicas, marcas, títulos únicos). ` +
    `Preste atenção ao gênero gramatical do falante: use pronomes, nomes próprios e outras pistas do texto (inclusive de itens ` +
    `anteriores da mesma cena) para concordar corretamente adjetivos e particípios em português; nunca troque o gênero de um ` +
    `falante que já foi estabelecido anteriormente. ` +
    `Responda APENAS com um JSON array no formato [{"id": number, "text": string}, ...], ` +
    `na mesma ordem e quantidade dos itens recebidos, sem nenhum texto adicional.\n\n` +
    `Itens:\n{{items}}`;

function buildPrompt(payload, targetLanguage, template)
{
    const promptTemplate = template || DEFAULT_PROMPT_TEMPLATE;

    return promptTemplate
        .replaceAll("{{targetLanguage}}", targetLanguage)
        .replaceAll("{{items}}", JSON.stringify(payload));
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

module.exports = { buildPrompt, extractJsonArray, mapResults, DEFAULT_PROMPT_TEMPLATE };
