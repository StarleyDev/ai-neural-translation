"use strict";

const path = require("path");

// Diretório onde ficam auth.json e settings.json. Em produção (Docker) aponta
// para /config (montado como volume — veja docker-compose.yml); localmente,
// cai em ./data na raiz do projeto.
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "..", "..", "data");

module.exports = { DATA_DIR };
