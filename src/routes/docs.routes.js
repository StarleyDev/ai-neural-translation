"use strict";

const fs = require("fs");
const path = require("path");
const express = require("express");
const { marked } = require("marked");

const README_PATH = path.join(__dirname, "..", "..", "README.md");

const router = express.Router();

router.get("/", (req, res) =>
{
    if (!fs.existsSync(README_PATH))
    {
        return res.status(404).json({ error: "README.md não encontrado." });
    }

    const markdown = fs.readFileSync(README_PATH, "utf-8");
    const html = marked.parse(markdown);

    return res.json({ html });
});

module.exports = router;
