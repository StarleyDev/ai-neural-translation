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

function stringifySrt(blocks)
{
    return blocks
        .map((b) => `${b.index}\n${b.time}\n${b.text}`)
        .join("\n\n") + "\n";
}

module.exports = { parseSrt, stringifySrt };
