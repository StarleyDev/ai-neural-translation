"use strict";

const express = require("express");
const settingsStore = require("../config/settings.store");

const router = express.Router();

router.get("/", (req, res) =>
{
    res.json(settingsStore.getPublicSettings());
});

router.put("/", (req, res) =>
{
    try
    {
        const { provider, model, apiKey, promptTemplate, resetPromptTemplate } = req.body;
        const updated = settingsStore.update({ provider, model, apiKey, promptTemplate, resetPromptTemplate });
        return res.json(updated);
    }
    catch (error)
    {
        return res.status(400).json({ error: error.message });
    }
});

module.exports = router;
