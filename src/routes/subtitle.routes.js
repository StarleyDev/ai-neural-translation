"use strict";

const express = require("express");
const multer = require("multer");
const { parseSrt, stringifySrt, removeBracketOnlyBlocks } = require("../utils/srt-parser");
const TranslatorService = require("../services/translator.service");
const { CancelledError } = require("../services/translator.service");
const jobStore = require("../services/job-store");

const ALLOWED_MIME_TYPES = new Set([
    "application/x-subrip",
    "text/srt",
    "text/plain",
    "application/octet-stream",
]);

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) =>
    {
        const hasSrtExtension = file.originalname.toLowerCase().endsWith(".srt");
        const hasAllowedMimeType = ALLOWED_MIME_TYPES.has(file.mimetype);

        if (!hasSrtExtension || !hasAllowedMimeType)
        {
            return cb(new Error("Apenas arquivos .srt são aceitos."));
        }
        cb(null, true);
    },
});

function handleUpload(req, res, next)
{
    upload.single("file")(req, res, (error) =>
    {
        if (error)
        {
            return res.status(400).json({ error: error.message || "Falha ao enviar o arquivo." });
        }
        next();
    });
}

router.post("/translate", handleUpload, (req, res) =>
{
    if (!req.file)
    {
        return res.status(400).json({ error: "Envie um arquivo .srt no campo 'file'." });
    }

    let blocks;
    try
    {
        const targetLanguage = req.body.target || "pt-br";
        const removeBrackets = req.body.removeBrackets !== "false";
        const content = req.file.buffer.toString("utf-8");
        blocks = parseSrt(content);
        if (removeBrackets) blocks = removeBracketOnlyBlocks(blocks);

        if (blocks.length === 0)
        {
            return res.status(400).json({ error: "Arquivo .srt inválido ou vazio." });
        }

        const translatorService = new TranslatorService();
        const job = jobStore.create();
        const outputName = req.file.originalname.replace(/\.srt$/i, `.${targetLanguage}.srt`);

        console.log(`[translate:${job.id}] recebido "${req.file.originalname}" (${blocks.length} blocos) -> ${targetLanguage}`);

        translatorService
            .translateBlocks(
                blocks,
                targetLanguage,
                ({ batch, totalBatches }) =>
                {
                    jobStore.setProgress(job.id, batch, totalBatches);
                },
                job.abortController.signal
            )
            .then((translatedBlocks) =>
            {
                const translatedSrt = stringifySrt(translatedBlocks);
                console.log(`[translate:${job.id}] concluído`);
                jobStore.setDone(job.id, { content: translatedSrt, downloadName: outputName });
            })
            .catch((error) =>
            {
                if (error instanceof CancelledError || jobStore.isCancelled(job.id))
                {
                    console.log(`[translate:${job.id}] cancelado`);
                    return;
                }
                console.error(`[translate:${job.id}] erro:`, error);
                jobStore.setError(job.id, error.message);
            });

        return res.json({ jobId: job.id });
    }
    catch (error)
    {
        console.error("Erro ao iniciar tradução:", error);
        return res.status(500).json({ error: error.message });
    }
});

router.get("/translate/:jobId/events", (req, res) =>
{
    const job = jobStore.get(req.params.jobId);
    if (!job)
    {
        return res.status(404).json({ error: "Job não encontrado." });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const send = (event) => res.write(`data: ${JSON.stringify(event)}\n\n`);

    send({ type: "progress", batch: job.batch, totalBatches: job.totalBatches });
    if (job.status === "done") send({ type: "done", downloadName: job.downloadName });
    if (job.status === "error") send({ type: "error", message: job.error });
    if (job.status === "cancelled") send({ type: "cancelled" });

    const unsubscribe = jobStore.subscribe(job.id, (event) =>
    {
        send(event);
        if (event.type === "done" || event.type === "error" || event.type === "cancelled") res.end();
    });

    req.on("close", unsubscribe);
});

router.post("/translate/:jobId/cancel", (req, res) =>
{
    const cancelled = jobStore.cancel(req.params.jobId);
    if (!cancelled)
    {
        return res.status(404).json({ error: "Job não encontrado ou já finalizado." });
    }
    console.log(`[translate:${req.params.jobId}] cancelamento solicitado`);
    return res.json({ ok: true });
});

router.get("/translate/:jobId/download", (req, res) =>
{
    const job = jobStore.get(req.params.jobId);
    if (!job || job.status !== "done")
    {
        return res.status(404).json({ error: "Arquivo não disponível." });
    }

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${job.downloadName}"`);
    return res.send(job.content);
});

module.exports = router;
