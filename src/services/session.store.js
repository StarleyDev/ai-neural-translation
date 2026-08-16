"use strict";

const crypto = require("crypto");

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 dias
const sessions = new Map(); // token -> { username, expiresAt }

function create(username)
{
    const token = crypto.randomBytes(32).toString("hex");
    sessions.set(token, { username, expiresAt: Date.now() + SESSION_TTL_MS });
    return token;
}

function validate(token)
{
    if (!token) return null;
    const session = sessions.get(token);
    if (!session) return null;
    if (session.expiresAt < Date.now())
    {
        sessions.delete(token);
        return null;
    }
    return session;
}

function destroy(token)
{
    sessions.delete(token);
}

function updateUsername(token, username)
{
    const session = sessions.get(token);
    if (session) session.username = username;
}

module.exports = { create, validate, destroy, updateUsername };
