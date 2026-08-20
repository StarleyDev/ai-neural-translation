"use strict";

const express = require("express");
const settingsStore = require("../config/settings.store");

const router = express.Router();

router.get("/", (req, res) =>
{
    try
    {
        res.json(settingsStore.getPublicSettings());
    }
    catch (error)
    {
        res.status(500).json({ error: error.message });
    }
});

router.put("/", (req, res) =>
{
    try
    {
        const { provider, model, apiKey, promptTemplate, resetPromptTemplate, baseUrl, batchSize, resetBatchSize } = req.body;
        const updated = settingsStore.update({ provider, model, apiKey, promptTemplate, resetPromptTemplate, baseUrl, batchSize, resetBatchSize });
        return res.json(updated);
    }
    catch (error)
    {
        return res.status(400).json({ error: error.message });
    }
});

module.exports = router;
