"use strict";

require("dotenv").config();

const path = require("path");
const fs = require("fs");
const express = require("express");
const subtitleRoutes = require("./routes/subtitle.routes");
const settingsRoutes = require("./routes/settings.routes");
const docsRoutes = require("./routes/docs.routes");
const authRoutes = require("./routes/auth.routes");
const { requireAuth } = require("./middleware/auth.middleware");

const app = express();

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/subtitles", requireAuth, subtitleRoutes);
app.use("/api/settings", requireAuth, settingsRoutes);
app.use("/api/docs", requireAuth, docsRoutes);

app.get("/health", (req, res) => res.json({ status: "ok" }));

// Serve o build do Angular quando presente (uso em produção/Docker).
const FRONTEND_DIST = path.join(__dirname, "..", "public");
if (fs.existsSync(FRONTEND_DIST))
{
    app.use(express.static(FRONTEND_DIST));
    app.get(/^\/(?!api\/).*/, (req, res) =>
    {
        res.sendFile(path.join(FRONTEND_DIST, "index.html"));
    });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`ia-translate rodando na porta ${PORT}`));

module.exports = app;
