"use strict";

const express = require("express");
const authStore = require("../config/auth.store");
const sessionStore = require("../services/session.store");
const { requireAuth, parseCookies } = require("../middleware/auth.middleware");

const router = express.Router();
const isProd = process.env.NODE_ENV === "production";
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function setSessionCookie(res, token)
{
    res.setHeader(
        "Set-Cookie",
        `session=${token}; HttpOnly; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}; SameSite=Lax${isProd ? "; Secure" : ""}`
    );
}

function clearSessionCookie(res)
{
    res.setHeader("Set-Cookie", "session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax");
}

router.post("/login", (req, res) =>
{
    const { username, password } = req.body || {};
    if (!username || !password)
    {
        return res.status(400).json({ error: "Usuário e senha são obrigatórios." });
    }
    if (!authStore.verify(username, password))
    {
        return res.status(401).json({ error: "Usuário ou senha inválidos." });
    }
    const token = sessionStore.create(username);
    setSessionCookie(res, token);
    res.json({ username });
});

router.post("/logout", (req, res) =>
{
    const cookies = parseCookies(req.headers.cookie);
    sessionStore.destroy(cookies["session"]);
    clearSessionCookie(res);
    res.json({ ok: true });
});

router.get("/me", requireAuth, (req, res) =>
{
    res.json({ username: req.user.username });
});

router.put("/password", requireAuth, (req, res) =>
{
    try
    {
        const { currentPassword, newPassword } = req.body || {};
        authStore.changePassword(currentPassword, newPassword);
        res.json({ ok: true });
    }
    catch (error)
    {
        res.status(400).json({ error: error.message });
    }
});

router.put("/username", requireAuth, (req, res) =>
{
    try
    {
        const { currentPassword, newUsername } = req.body || {};
        const username = authStore.changeUsername(currentPassword, newUsername);
        const cookies = parseCookies(req.headers.cookie);
        sessionStore.updateUsername(cookies["session"], username);
        res.json({ username });
    }
    catch (error)
    {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
