"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const sharp_1 = __importDefault(require("sharp"));
const crypto_1 = __importDefault(require("crypto"));
const multer_1 = __importDefault(require("multer"));
const pg_1 = require("pg");
const uploadPath = path_1.default.join(process.cwd(), 'uploads');
const upload = (0, multer_1.default)({
    dest: uploadPath,
    limits: { fileSize: 5 * 1024 * 1024 },
});
const sha256 = (buf) => crypto_1.default.createHash('sha256').update(buf).digest('hex');
require('dotenv').config();
const app = (0, express_1.default)();
app.use(body_parser_1.default.json());
const PORT = process.env.PORT;
const pool = new pg_1.Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || ''),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});
const init = () => {
    return new Promise((resolve, reject) => {
        pool
            .connect()
            .then(() => __awaiter(void 0, void 0, void 0, function* () {
            function initDB() {
                return __awaiter(this, void 0, void 0, function* () {
                    // 1) расширения
                    yield pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
                    yield pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
                    // 2) если uuid_generate_v4() нет — создаём совместимую обёртку на gen_random_uuid()
                    yield pool.query(`
				  DO $DO$
				  BEGIN
				    IF NOT EXISTS (
				      SELECT 1
				      FROM pg_proc p
				      JOIN pg_namespace n ON n.oid = p.pronamespace
				      WHERE p.proname = 'uuid_generate_v4'
				        AND n.nspname = 'public'
				        AND pg_get_function_identity_arguments(p.oid) = ''
				    ) THEN
				      CREATE OR REPLACE FUNCTION public.uuid_generate_v4()
				      RETURNS uuid
				      LANGUAGE sql
				      IMMUTABLE
				      AS $f$ SELECT gen_random_uuid(); $f$;
				    END IF;
				  END
				  $DO$;
				`);
                    // 3) таблицы
                    yield pool.query(`
				  CREATE TABLE IF NOT EXISTS public.users (
				    uuid        uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
				    username    varchar(15) NOT NULL UNIQUE,
				    created_at  timestamptz  NOT NULL DEFAULT now(),
				    updated_at  timestamptz  NOT NULL DEFAULT now(),
				    avatar      varchar(255)
				  );
				`);
                    yield pool.query(`
				  CREATE TABLE IF NOT EXISTS public.messages (
				    uuid         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
				    content      text        NOT NULL,
				    author_uuid  uuid        NULL,
				    created_at   timestamptz NOT NULL DEFAULT now(),
				    updated_at   timestamptz NOT NULL DEFAULT now()
				  );
				`);
                    // 4) FK если ещё нет
                    yield pool.query(`
				  DO $DO$
				  BEGIN
				    IF NOT EXISTS (
				      SELECT 1
				      FROM pg_constraint
				      WHERE conname = 'messages_author_uuid_fkey'
				    ) THEN
				      ALTER TABLE public.messages
				        ADD CONSTRAINT messages_author_uuid_fkey
				        FOREIGN KEY (author_uuid) REFERENCES public.users (uuid);
				    END IF;
				  END
				  $DO$;
				`);
                    // 5) функция + триггеры updated_at
                    yield pool.query(`
				  CREATE OR REPLACE FUNCTION public.set_updated_at()
				  RETURNS trigger
				  LANGUAGE plpgsql
				  AS $fn$
				  BEGIN
				    NEW.updated_at := now();
				    RETURN NEW;
				  END
				  $fn$;
				`);
                    yield pool.query(`DROP TRIGGER IF EXISTS set_users_updated_at    ON public.users;`);
                    yield pool.query(`DROP TRIGGER IF EXISTS set_messages_updated_at ON public.messages;`);
                    yield pool.query(`
				  CREATE TRIGGER set_users_updated_at
				  BEFORE UPDATE ON public.users
				  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
				`);
                    yield pool.query(`
				  CREATE TRIGGER set_messages_updated_at
				  BEFORE UPDATE ON public.messages
				  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
				`);
                });
            }
            yield initDB();
            return resolve(true);
        }))
            .catch(() => reject());
    });
};
app.get('/users', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { rows: users } = yield pool.query(`SELECT * FROM users`);
        res.status(200).json({ users });
    }
    catch (error) {
        res.status(400).send(error.message);
    }
}));
app.get('/user', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username } = req.query;
        const { rows: users } = yield pool.query(`SELECT * FROM users WHERE username = $1`, [username]);
        if (users.length === 0)
            throw new Error('SUCH USER DOES NOT EXISTS');
        res.status(200).json({ user: users[0] });
    }
    catch (error) {
        res.status(400).send(error.message);
    }
}));
app.post('/user', upload.single('avatar'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username } = req.body;
        // console.log('FILE: ', req.file);
        // res.status(200).send(true);
        const { rows: users } = yield pool.query(`SELECT * FROM users WHERE username = $1`, [username]);
        if (users.length > 0)
            throw new Error('SUCH USER ALREADY EXISTS');
        let pathForDB = null;
        if (req.file) {
            const { path: tmpPath } = req.file;
            const buf = yield promises_1.default.readFile(tmpPath);
            const hash = sha256(buf);
            const fileName = `user_${username}_${hash}.webp`;
            const finalPath = path_1.default.join(uploadPath, fileName);
            yield (0, sharp_1.default)(buf).resize(512).webp({ quality: 95 }).toFile(finalPath);
            yield promises_1.default.rm(tmpPath, { force: true });
            pathForDB = `/uploads/${fileName}`;
        }
        yield pool.query(`INSERT INTO users (username, avatar) VALUES($1, $2)`, [
            username,
            pathForDB,
        ]);
        const { rows: createdUser } = yield pool.query(`SELECT * FROM users WHERE username = $1`, [username]);
        res.status(200).json({ user: createdUser[0] });
    }
    catch (error) {
        res.status(400).send(error.message);
    }
}));
app.patch('/user', upload.single('avatar'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username } = req.body;
        const { rows: users } = yield pool.query(`
    SELECT * FROM users WHERE username = $1`, [username]);
        if (!users[0])
            throw new Error(`User not found`);
        let pathForDB = null;
        if (req.file) {
            const { path: tmpPath } = req.file;
            const buf = yield promises_1.default.readFile(tmpPath);
            const hash = sha256(buf);
            const fileName = `user_${username}_${hash}.webp`;
            const finalPath = path_1.default.join(uploadPath, fileName);
            yield (0, sharp_1.default)(buf).resize(512).webp({ quality: 95 }).toFile(finalPath);
            yield promises_1.default.rm(tmpPath, { force: true });
            pathForDB = `/uploads/${fileName}`;
        }
        yield pool.query(`UPDATE users SET avatar = $1 WHERE username = $2`, [
            pathForDB,
            username,
        ]);
        const { rows: updatedUsers } = yield pool.query(`SELECT * FROM users WHERE username = $1`, [username]);
        console.log('UPDATED USER: ', updatedUsers);
        res.status(200).json({ user: updatedUsers[0] });
    }
    catch (error) {
        res.status(400).send(error.message);
    }
}));
app.delete('/user/avatar', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username } = req.body;
        if (!username || typeof username !== 'string') {
            return res.status(400).send(' USERNAME IS REQUIRED');
        }
        const { rows: users } = yield pool.query(`SELECT * FROM users WHERE username =$1`, [username]);
        if (!users[0]) {
            return res.status(404).send('USER NOT FOUND');
        }
        yield pool.query(`UPDATE users SET avatar = $1 WHERE username = $2`, [
            null,
            username,
        ]);
        const { rows: updatedUsers } = yield pool.query(`SELECT * FROM users WHERE username = $1`, [username]);
        res.status(200).json({ user: updatedUsers[0] });
    }
    catch (error) {
        res.status(400).send(error.message);
    }
}));
app.get('/messages', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { rows: messages } = yield pool.query(`
      SELECT
        messages.uuid AS uuid,
        messages.content AS content,
        messages.created_at AS created_at,
        messages.updated_at AS updated_at,
        users.username AS username,
        users.avatar AS avatar,
        CASE
          WHEN messages.created_at = messages.updated_at THEN 'false'
          ELSE 'true'
        END AS was_edited
      FROM messages
      LEFT JOIN users ON users.uuid = messages.author_uuid
      ORDER BY messages.created_at ASC
    `);
        res.status(200).json({ messages });
    }
    catch (error) {
        res.status(400).send(error.message);
    }
}));
app.post('/message', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        let { username, content } = (_a = req.body) !== null && _a !== void 0 ? _a : {};
        if (typeof username !== 'string' || typeof content !== 'string') {
            return res
                .status(400)
                .json({ error: 'username and content must be strings' });
        }
        username = username.trim();
        content = content.trim();
        if (!username || !content) {
            return res
                .status(400)
                .json({ error: 'USERNAME AND CONTENT ARE REQUIRED' });
        }
        if (username.length > 32 || content.length > 2000) {
            return res.status(400).json({ error: 'Payload too long' });
        }
        const { rows: users } = yield pool.query(`SELECT uuid, username FROM users WHERE lower(username) = lower($1) LIMIT 1`, [username]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'SUCH USER DOES NOT EXIST' });
        }
        const user = users[0];
        const { rows: inserted } = yield pool.query(`INSERT INTO messages (content, author_uuid)
       VALUES ($1, $2)
       RETURNING uuid, content, author_uuid, created_at`, [content, user.uuid]);
        const message = inserted[0];
        return res.status(201).json({ message });
    }
    catch (err) {
        return res
            .status(500)
            .json({ error: 'Internal server error', detail: err === null || err === void 0 ? void 0 : err.message });
    }
}));
app.patch('/message/:uuid', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const uuid = String((_a = req.params.uuid) !== null && _a !== void 0 ? _a : '').trim();
        let { username, content } = (_b = req.body) !== null && _b !== void 0 ? _b : {};
        if (!uuid)
            return res.status(400).json({ error: 'uuid is required' });
        if (typeof username !== 'string' || typeof content !== 'string') {
            return res
                .status(400)
                .json({ error: 'username and content must be strings' });
        }
        username = username.trim();
        content = content.trim();
        if (!username || !content) {
            return res
                .status(400)
                .json({ error: 'USERNAME AND CONTENT ARE REQUIRED' });
        }
        if (username.length > 32 || content.length > 2000) {
            return res.status(400).json({ error: 'Payload too long' });
        }
        // search message + author
        const { rows: found } = yield pool.query(`
      SELECT m.uuid, u.username 
      FROM messages m 
      LEFT JOIN users u ON u.uuid = m.author_uuid 
      WHERE m.uuid = $1
      `, [uuid]);
        if (found.length === 0) {
            return res.status(404).json({ error: 'MESSAGE NOT FOUND' });
        }
        const authorUsername = found[0].username;
        if (!authorUsername ||
            authorUsername.toLowerCase() !== username.toLowerCase()) {
            return res.status(403).json({ error: 'YOU ARE NOT THE AUTHOR' });
        }
        // updated contents
        const { rows: updated } = yield pool.query(`
      UPDATE messages
      set content = $1
      WHERE uuid = $2
      RETURNING uuid, content, updated_at`, [content, uuid]);
        return res.status(200).json({ message: updated[0] });
    }
    catch (err) {
        return res
            .status(500)
            .json({ error: 'Iternal server error', detail: err === null || err === void 0 ? void 0 : err.message });
    }
}));
app.delete('/message/:uuid', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const uuid = String((_a = req.params.uuid) !== null && _a !== void 0 ? _a : '').trim();
        let { username } = (_b = req.body) !== null && _b !== void 0 ? _b : {};
        if (!uuid)
            return res.status(400).json({ error: 'uuid is required' });
        if (typeof username !== 'string') {
            return res.status(400).json({ error: 'username must be a string' });
        }
        username = username.trim();
        if (!username) {
            return res.status(400).json({ error: 'USERNAME IS REQUIRED' });
        }
        if (username.length > 32) {
            return res.status(400).json({ error: 'Payload too long' });
        }
        // search message + author
        const { rows: found } = yield pool.query(`
      SELECT m.uuid, u.username
      FROM messages m 
      LEFT JOIN users u ON u.uuid = m.author_uuid
      WHERE m.uuid = $1
      `, [uuid]);
        if (found.length === 0) {
            return res.status(404).json({ error: 'MESSAGE NOT FOUND' });
        }
        const authorUsername = found[0].username;
        if (!authorUsername ||
            authorUsername.toLowerCase() !== username.toLowerCase()) {
            return res.status(403).json({ error: 'YOU ARE NOT THE AUTHOR' });
        }
        yield pool.query(`DELETE FROM messages WHERE uuid = $1`, [uuid]);
        return res.status(200).json({ ok: true });
    }
    catch (err) {
        return res
            .status(500)
            .json({ error: 'Internal server error', detail: err === null || err === void 0 ? void 0 : err.message });
    }
}));
app.post('/auth', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, accessCode } = req.body;
        const usernameTrimmed = String(username || '').trim();
        const accessCodeTrimmed = String(accessCode || '').trim();
        if (!usernameTrimmed || !accessCodeTrimmed) {
            throw new Error('Username and code required');
        }
        if (!/^\d{6}$/.test(accessCodeTrimmed)) {
            throw new Error('Code must be 6 digits');
        }
        const { rows: users } = yield pool.query(`SELECT * FROM users WHERE username = $1`, [usernameTrimmed]);
        if (users.length === 0) {
            const { rows: newUsers } = yield pool.query(`INSERT INTO users (username, access_code)
         VALUES ($1, $2)
         RETURNING *`, [usernameTrimmed, accessCodeTrimmed]);
            return res.json({ user: newUsers[0] });
        }
        const user = users[0];
        if (!user.access_code) {
            throw new Error('User has no code. Please re-register');
        }
        if (String(user.access_code) !== String(accessCodeTrimmed)) {
            throw new Error('Wrong code');
        }
        res.json({ user });
    }
    catch (error) {
        res.status(400).json({ error: { message: error.message } });
    }
}));
init().then(() => {
    app.listen(PORT, () => {
        // test();
        console.log('APP IS RUNNING ON PORT: ' + PORT);
    });
});
