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

// Schema da resposta esperada. Servidores compatíveis com a API da OpenAI que suportam
// "structured outputs" usam isso para restringir a geração (grammar-constrained
// decoding): o modelo fica impedido de emitir qualquer token que quebre o JSON, o que
// elimina na origem os erros de sintaxe que modelos locais menores costumam cometer.
// Envolvido num objeto porque o modo JSON de vários servidores exige objeto na raiz.
const TRANSLATION_JSON_SCHEMA = {
    type: "object",
    properties: {
        translations: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    id: { type: "integer" },
                    text: { type: "string" },
                },
                required: ["id", "text"],
                additionalProperties: false,
            },
        },
    },
    required: ["translations"],
    additionalProperties: false,
};

function buildPrompt(payload, targetLanguage, template) {
    const promptTemplate = template || DEFAULT_PROMPT_TEMPLATE;

    return promptTemplate
        .replaceAll("{{targetLanguage}}", targetLanguage)
        .replaceAll("{{items}}", JSON.stringify(payload));
}

// Modelos às vezes respondem com JSON quase válido: caracteres de controle "crus" dentro
// de strings (quebra de linha, tab, ou qualquer outro caractere < 0x20, em vez de
// escapado), ou aspas internas (ex.: uma fala citando alguém) sem escapar. Essa função
// corrige os dois casos sem mexer no resto da estrutura:
// - qualquer caractere de controle solto dentro de uma string vira \n/\r/\t/\b/\f ou
//   \uXXXX genérico, conforme o JSON exige;
// - uma '"' encontrada dentro de uma string só é tratada como o fechamento real da
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

            const code = char.charCodeAt(0);
            if (code < 0x20) {
                const escapes = { "\n": "\\n", "\r": "\\r", "\t": "\\t", "\b": "\\b", "\f": "\\f" };
                result += escapes[char] || `\\u${code.toString(16).padStart(4, "0")}`;
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

const VALID_JSON_ESCAPES = new Set(['"', "\\", "/", "b", "f", "n", "r", "t", "u"]);

// O modelo às vezes solta uma barra invertida sem querer no meio de uma palavra
// (ex.: 'chamou\para relatar'). JSON só aceita um conjunto fixo de escapes; qualquer
// outro caractere depois de "\" quebra o parser. Descarta a barra inválida e mantém o
// caractere seguinte — escapes válidos passam intactos.
function fixInvalidEscapes(text) {
    let result = "";
    let insideString = false;
    let i = 0;

    while (i < text.length) {
        const char = text[i];

        if (!insideString) {
            if (char === '"') insideString = true;
            result += char;
            i++;
            continue;
        }

        if (char === "\\") {
            const next = text[i + 1];
            if (VALID_JSON_ESCAPES.has(next)) {
                result += char + (next ?? "");
                i += 2;
                continue;
            }
            i += 1;
            continue;
        }

        if (char === '"') insideString = false;
        result += char;
        i++;
    }

    return result;
}

// JSON não tem parênteses na sua gramática — um "(" ou ")" fora de string é sempre
// inválido. Na prática aparece quando o modelo confunde o caractere de fechamento e
// escreve ")" no lugar de "}".
function replaceStrayParens(text) {
    let result = "";
    let insideString = false;
    let escaped = false;

    for (const char of text) {
        if (insideString) {
            if (escaped) escaped = false;
            else if (char === "\\") escaped = true;
            else if (char === '"') insideString = false;
            result += char;
            continue;
        }

        if (char === '"') { insideString = true; result += char; continue; }
        if (char === ")") { result += "}"; continue; }
        if (char === "(") continue;

        result += char;
    }

    return result;
}

// Vírgula sobrando logo antes de fechar (ex.: '..."luz",}') — JSON não permite.
function removeTrailingCommas(text) {
    let result = "";
    let insideString = false;
    let escaped = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (insideString) {
            result += char;
            if (escaped) escaped = false;
            else if (char === "\\") escaped = true;
            else if (char === '"') insideString = false;
            continue;
        }

        if (char === '"') { insideString = true; result += char; continue; }

        if (char === ",") {
            let j = i + 1;
            while (j < text.length && /\s/.test(text[j])) j++;
            if (text[j] === "}" || text[j] === "]") continue;
        }

        result += char;
    }

    return result;
}

// Dois elementos emendados sem vírgula (ex.: '..."importa"}{"id":33...').
function insertMissingCommas(text) {
    let result = "";
    let insideString = false;
    let escaped = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        result += char;

        if (insideString) {
            if (escaped) escaped = false;
            else if (char === "\\") escaped = true;
            else if (char === '"') insideString = false;
            continue;
        }

        if (char === '"') { insideString = true; continue; }

        if (char === "}" || char === "]") {
            let j = i + 1;
            while (j < text.length && /\s/.test(text[j])) j++;
            if (text[j] === "{" || text[j] === "[") result += ",";
        }
    }

    return result;
}

// Acha onde o array de verdade começa. Não basta procurar o último "[": as próprias
// legendas podem conter colchetes de propósito (mantemos tags como "[Cole]" no texto —
// ver srt-parser.js). Procura pelo padrão específico '[{"id":', improvável de aparecer
// por acaso dentro de uma legenda. Pega a última ocorrência porque modelos
// "raciocinadores" às vezes rascunham um JSON no meio do raciocínio antes da resposta.
function findArrayStart(raw) {
    const pattern = /\[\s*\{\s*"id"\s*:/g;
    let match;
    let lastIndex = -1;
    while ((match = pattern.exec(raw)) !== null) {
        lastIndex = match.index;
    }
    if (lastIndex !== -1) return lastIndex;

    const searchStart = raw.lastIndexOf("[{");
    return searchStart !== -1 ? searchStart : raw.lastIndexOf("[");
}

function findLastJsonArray(raw) {
    const start = findArrayStart(raw);
    if (start === -1) return null;

    let depth = 0;
    let insideString = false;
    let escaped = false;

    for (let i = start; i < raw.length; i++) {
        const char = raw[i];

        if (insideString) {
            if (escaped) escaped = false;
            else if (char === "\\") escaped = true;
            else if (char === '"') insideString = false;
            continue;
        }

        if (char === '"') { insideString = true; continue; }
        if (char === "[") depth++;
        if (char === "]") {
            depth--;
            if (depth === 0) return raw.slice(start, i + 1);
        }
    }

    return null;
}

// Objeto do array sem "}" de fechamento antes do "]" final.
function repairMissingBraces(jsonText) {
    if (!jsonText.startsWith("[") || !jsonText.endsWith("]")) return jsonText;

    const inner = jsonText.slice(1, -1);
    let depth = 0;
    let insideString = false;
    let escaped = false;

    for (const char of inner) {
        if (insideString) {
            if (escaped) escaped = false;
            else if (char === "\\") escaped = true;
            else if (char === '"') insideString = false;
            continue;
        }
        if (char === '"') { insideString = true; continue; }
        if (char === "{") depth++;
        if (char === "}") depth--;
    }

    if (depth <= 0) return jsonText;
    return "[" + inner + "}".repeat(depth) + "]";
}

// Último recurso: o modelo nem chega a escrever o "]" final. Acha o último objeto
// "{...}" que fechou corretamente e descarta o resto — os itens perdidos caem no
// fallback de mapResults (mantêm o texto original).
function closeUnterminatedArray(raw) {
    const start = findArrayStart(raw);
    if (start === -1) return null;

    let depth = 0;
    let insideString = false;
    let escaped = false;
    let lastCompleteEnd = -1;

    for (let i = start + 1; i < raw.length; i++) {
        const char = raw[i];

        if (insideString) {
            if (escaped) escaped = false;
            else if (char === "\\") escaped = true;
            else if (char === '"') insideString = false;
            continue;
        }

        if (char === '"') { insideString = true; continue; }
        if (char === "{") depth++;
        if (char === "}") {
            depth--;
            if (depth === 0) lastCompleteEnd = i;
        }
        if (char === "]" && depth === 0) return null;
    }

    if (lastCompleteEnd === -1) return null;
    return raw.slice(start, lastCompleteEnd + 1) + "]";
}

// Quando a resposta vem como objeto (o modo JSON de vários servidores exige objeto na
// raiz — ver TRANSLATION_JSON_SCHEMA), extrai o array de dentro dele.
function unwrapArray(parsed) {
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object") {
        const arrayValue = Object.values(parsed).find(Array.isArray);
        if (arrayValue) return arrayValue;
    }
    return null;
}

// Extrai objetos "{...}" individuais e bem formados, ignorando o que houver entre eles.
// Usado quando o array como um todo é irrecuperável (o modelo intercalou comentários,
// trocou ":" por "," num item, etc.): aproveita os itens íntegros em vez de perder o
// lote inteiro. Cada objeto é validado isoladamente, então um item corrompido descarta
// só a si mesmo — quem cair fora mantém o texto original via mapResults.
function salvageObjects(raw) {
    const results = [];
    let depth = 0;
    let objectStart = -1;
    let insideString = false;
    let escaped = false;

    for (let i = 0; i < raw.length; i++) {
        const char = raw[i];

        if (insideString) {
            if (escaped) escaped = false;
            else if (char === "\\") escaped = true;
            else if (char === '"') insideString = false;
            continue;
        }

        if (char === '"') { insideString = true; continue; }

        if (char === "{") {
            if (depth === 0) objectStart = i;
            depth++;
            continue;
        }

        if (char === "}" && depth > 0) {
            depth--;
            if (depth === 0 && objectStart !== -1) {
                const candidate = raw.slice(objectStart, i + 1);
                for (const attempt of [candidate, sanitizeJsonString(fixInvalidEscapes(candidate))]) {
                    try {
                        const parsed = JSON.parse(attempt);
                        if (typeof parsed?.id === "number" && typeof parsed?.text === "string") {
                            results.push(parsed);
                        }
                        break;
                    } catch {
                        // objeto corrompido: ignora e segue para o próximo
                    }
                }
                objectStart = -1;
            }
        }
    }

    return results.length > 0 ? results : null;
}

function extractJsonArray(raw) {
    // Caminho feliz: com structured output ativo (ver custom.provider.js) a resposta já
    // vem sintaticamente válida, então o parse direto resolve sem nenhum reparo. Vale
    // tanto para o array puro quanto para o objeto {"translations": [...]} do schema.
    try {
        const direct = unwrapArray(JSON.parse(raw.trim()));
        if (direct) return direct;
    } catch {
        // segue para as estratégias de recuperação
    }

    // replaceStrayParens roda no texto bruto: corrigir ")" -> "}" pode revelar um "]"
    // que antes só existia como ")", mudando qual estratégia de localização se aplica.
    const candidates = [raw, replaceStrayParens(raw)]
        .flatMap((text) => [findLastJsonArray(text), closeUnterminatedArray(text)])
        .filter(Boolean);

    let firstError;
    for (const jsonText of candidates) {
        const withValidEscapes = fixInvalidEscapes(jsonText);
        const sanitized = sanitizeJsonString(withValidEscapes);
        const noTrailingCommas = removeTrailingCommas(sanitized);
        const withCommas = insertMissingCommas(noTrailingCommas);

        for (const candidate of [jsonText, withValidEscapes, sanitized, noTrailingCommas, withCommas, repairMissingBraces(withCommas)]) {
            try {
                const parsed = unwrapArray(JSON.parse(candidate));
                if (parsed) return parsed;
            } catch (error) {
                if (!firstError) firstError = error;
            }
        }
    }

    // Nada foi recuperável como array inteiro: salva os objetos individuais íntegros.
    const salvaged = salvageObjects(raw);
    if (salvaged) return salvaged;

    throw firstError || new Error("Resposta do modelo não contém um JSON array válido.");
}

function mapResults(batch, parsed) {
    return batch.map((_, idx) => {
        const item = parsed.find((p) => p.id === idx);
        return item ? item.text : batch[idx].text;
    });
}

module.exports = {
    buildPrompt,
    extractJsonArray,
    mapResults,
    DEFAULT_PROMPT_TEMPLATE,
    TRANSLATION_JSON_SCHEMA,
};
