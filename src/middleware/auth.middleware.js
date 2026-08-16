"use strict";

const sessionStore = require("../services/session.store");

function parseCookies(header)
{
    const cookies = {};
    if (!header) return cookies;
    header.split(";").forEach((pair) =>
    {
        const idx = pair.indexOf("=");
        if (idx === -1) return;
        const key = pair.slice(0, idx).trim();
        const value = pair.slice(idx + 1).trim();
        cookies[key] = decodeURIComponent(value);
    });
    return cookies;
}

function requireAuth(req, res, next)
{
    const cookies = parseCookies(req.headers.cookie);
    const session = sessionStore.validate(cookies["session"]);
    if (!session)
    {
        return res.status(401).json({ error: "Não autenticado." });
    }
    req.user = { username: session.username };
    next();
}

module.exports = { requireAuth, parseCookies };
