"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Guardado em /app/data, que é montado como volume persistente pelo Docker
// (veja docker-compose.yml) — sobrevive a rebuilds/atualizações do container.
const AUTH_PATH = path.join(__dirname, "..", "..", "data", "auth.json");

const DEFAULT_USERNAME = "admin";
const DEFAULT_PASSWORD = "admin";

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex"))
{
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    return { salt, hash };
}

function verifyPassword(password, salt, hash)
{
    const computed = crypto.scryptSync(password, salt, 64);
    const stored = Buffer.from(hash, "hex");
    if (computed.length !== stored.length) return false;
    return crypto.timingSafeEqual(computed, stored);
}

function writeRaw(data)
{
    fs.mkdirSync(path.dirname(AUTH_PATH), { recursive: true });
    fs.writeFileSync(AUTH_PATH, JSON.stringify(data, null, 2), "utf-8");
}

function readRaw()
{
    if (!fs.existsSync(AUTH_PATH))
    {
        const { salt, hash } = hashPassword(DEFAULT_PASSWORD);
        const initial = { username: DEFAULT_USERNAME, salt, hash };
        writeRaw(initial);
        return initial;
    }
    return JSON.parse(fs.readFileSync(AUTH_PATH, "utf-8"));
}

class AuthStore
{
    verify(username, password)
    {
        const raw = readRaw();
        if (username !== raw.username) return false;
        return verifyPassword(password, raw.salt, raw.hash);
    }

    changePassword(currentPassword, newPassword)
    {
        const raw = readRaw();
        if (!verifyPassword(currentPassword, raw.salt, raw.hash))
        {
            throw new Error("Senha atual incorreta.");
        }
        if (!newPassword || newPassword.length < 4)
        {
            throw new Error("A nova senha deve ter ao menos 4 caracteres.");
        }
        const { salt, hash } = hashPassword(newPassword);
        writeRaw({ username: raw.username, salt, hash });
    }

    changeUsername(currentPassword, newUsername)
    {
        const raw = readRaw();
        if (!verifyPassword(currentPassword, raw.salt, raw.hash))
        {
            throw new Error("Senha atual incorreta.");
        }
        const trimmed = (newUsername || "").trim();
        if (trimmed.length < 3)
        {
            throw new Error("O usuário deve ter ao menos 3 caracteres.");
        }
        writeRaw({ username: trimmed, salt: raw.salt, hash: raw.hash });
        return trimmed;
    }

    getUsername()
    {
        return readRaw().username;
    }
}

module.exports = new AuthStore();
