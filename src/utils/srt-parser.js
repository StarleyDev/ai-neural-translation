"use strict";

// Parseia um arquivo .srt em blocos { index, time, text }
function parseSrt(content)
{
    const normalized = content.replace(/\r\n/g, "\n").trim();
    const blocks = normalized.split(/\n\s*\n/);

    return blocks
        .map((block) =>
        {
            const lines = block.split("\n");
            if (lines.length < 2) return null;

            const index = lines[0].trim();
            const time = lines[1].trim();
            const text = lines.slice(2).join("\n");

            if (!time.includes("-->")) return null;

            return { index, time, text };
        })
        .filter(Boolean);
}

// Um "[Angie]" ou "[John Smith]" entre colchetes costuma ser o nome de quem fala, não
// uma anotação de som/idioma/tom — então deve ser preservado. Heurística: parece nome
// quando tem no máximo 3 palavras, todas capitalizadas (sem começar minúsculo como
// "em inglês" ou "com voz trêmula") e sem dígito (descarta rótulos tipo "Policial 2").
function looksLikeSpeakerName(content)
{
    const words = content.trim().split(/\s+/);
    if (words.length === 0 || words.length > 3) return false;
    if (/\d/.test(content)) return false;

    return words.every((word) => /^[A-ZÀ-Ý][a-zà-ÿ'-]*$/.test(word));
}

// Uma anotação pode ter sido quebrada no meio por uma quebra de linha, ex.:
// "[empresário\nfala indistintamente]" — o colchete abre numa linha e só fecha na
// seguinte. Junta (com espaço) qualquer quebra de linha que aconteça enquanto um
// colchete ainda está aberto, pra ela virar uma única linha processável; quebras de
// linha fora de colchetes (quebra de fala normal) não são tocadas.
function mergeLineBreaksInsideBrackets(text)
{
    let result = "";
    let depth = 0;

    for (const char of text)
    {
        if (char === "[") depth++;
        if (char === "]") depth = Math.max(0, depth - 1);

        result += (char === "\n" && depth > 0) ? " " : char;
    }

    return result;
}

// Remove anotações entre colchetes (ex.: "[música tensa]", "[em inglês]") do texto de
// cada legenda, preservando qualquer fala real que esteja junto — e preservando também
// colchetes que parecem nome de personagem (ver looksLikeSpeakerName). Trata tanto
// quebras de linha reais quanto "\N" literal (comum em legendas exportadas de .ass/.ssa)
// como separadores de linha — e remove marcador de traço de fala ("- ") de linhas que
// ficam vazias depois de tirar a anotação, já que ele deixa de fazer sentido sozinho.
function stripBracketAnnotations(block)
{
    const normalized = mergeLineBreaksInsideBrackets(block.text.replace(/\\N/g, "\n"));
    const rawLines = normalized.split("\n").map((line) => line.trim());

    const keptLines = rawLines
        .map((line) =>
        {
            const hadDash = /^-\s*/.test(line);
            const content = line
                .replace(/^-\s*/, "")
                .replace(/\[([^[\]]*)\]/g, (match, inner) => (looksLikeSpeakerName(inner) ? match : ""))
                .replace(/\s+/g, " ")
                .trim();

            if (content === "") return null;
            return hadDash ? `- ${content}` : content;
        })
        .filter(Boolean);

    if (keptLines.length === 0) return null;

    return { ...block, text: keptLines.join("\n") };
}

function removeBracketOnlyBlocks(blocks)
{
    return blocks
        .map(stripBracketAnnotations)
        .filter(Boolean)
        .map((block, i) => ({ ...block, index: String(i + 1) }));
}

function stringifySrt(blocks)
{
    return blocks
        .map((b) => `${b.index}\n${b.time}\n${b.text}`)
        .join("\n\n") + "\n";
}

module.exports = { parseSrt, stringifySrt, removeBracketOnlyBlocks };
