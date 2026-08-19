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

function buildPrompt(payload, targetLanguage, template) {
    const promptTemplate = template || DEFAULT_PROMPT_TEMPLATE;

    return promptTemplate
        .replaceAll("{{targetLanguage}}", targetLanguage)
        .replaceAll("{{items}}", JSON.stringify(payload));
}

// Modelos às vezes respondem com JSON quase válido: quebras de linha "cruas" dentro de
// strings (em vez de \n escapado), ou aspas internas (ex.: uma fala citando alguém)
// sem escapar. Essa função tenta corrigir os dois casos sem mexer no resto da estrutura:
// - caracteres de controle soltos dentro de uma string viram \n/\r/\t escapados;
// - uma "," encontrada dentro de uma string só é tratada como o fechamento real da
//   string se o próximo caractere significativo for algo que faz sentido depois de um
//   valor JSON (:, ,, }, ] ou fim do texto); caso contrário é uma aspa de conteúdo e
//   vira \" escapada.
function sanitizeJsonString(text) {
    let result = "";
    let insideString = false;
    let escaped = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (insideString) {
            if (escaped) {
                result += char;
                escaped = false;
                continue;
            }

            if (char === "\\") {
                result += char;
                escaped = true;
                continue;
            }

            if (char === "\n") {
                result += "\\n";
                continue;
            }
            if (char === "\r") {
                result += "\\r";
                continue;
            }
            if (char === "\t") {
                result += "\\t";
                continue;
            }

            if (char === '"') {
                let j = i + 1;
                while (j < text.length && /\s/.test(text[j])) j++;
                const next = text[j];
                const looksLikeRealClose = next === undefined || [":", ",", "}", "]"].includes(next);

                if (looksLikeRealClose) {
                    insideString = false;
                    result += char;
                } else {
                    result += '\\"';
                }
                continue;
            }

            result += char;
            continue;
        }

        if (char === '"') {
            insideString = true;
        }
        result += char;
    }

    return result;
}

function extractJsonArray(raw) {
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
        throw new Error("Resposta do modelo não contém um JSON array válido.");
    }

    try {
        return JSON.parse(jsonMatch[0]);
    }
    catch (error) {
        try {
            return JSON.parse(sanitizeJsonString(jsonMatch[0]));
        }
        catch {
            throw error;
        }
    }
}

function mapResults(batch, parsed) {
    return batch.map((_, idx) => {
        const item = parsed.find((p) => p.id === idx);
        return item ? item.text : batch[idx].text;
    });
}

module.exports = { buildPrompt, extractJsonArray, mapResults, DEFAULT_PROMPT_TEMPLATE };
