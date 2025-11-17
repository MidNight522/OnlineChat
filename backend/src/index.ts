import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import crypto from 'crypto';
import multer from 'multer';
import { Pool } from 'pg';

const uploadPath = path.join(process.cwd(), 'uploads');
const upload = multer({
  dest: uploadPath,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const sha256 = (buf: Buffer) =>
  crypto.createHash('sha256').update(buf).digest('hex');

require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT;

const pool = new Pool({
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
      .then(async () => {
        async function initDB() {
          // 1) расширения
          await pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
          await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

          // 2) если uuid_generate_v4() нет — создаём совместимую обёртку на gen_random_uuid()
          await pool.query(`
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
          await pool.query(`
				  CREATE TABLE IF NOT EXISTS public.users (
				    uuid        uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
				    username    varchar(15) NOT NULL UNIQUE,
				    created_at  timestamptz  NOT NULL DEFAULT now(),
				    updated_at  timestamptz  NOT NULL DEFAULT now(),
				    avatar      varchar(255)
				  );
				`);

          await pool.query(`
				  CREATE TABLE IF NOT EXISTS public.messages (
				    uuid         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
				    content      text        NOT NULL,
				    author_uuid  uuid        NULL,
				    created_at   timestamptz NOT NULL DEFAULT now(),
				    updated_at   timestamptz NOT NULL DEFAULT now()
				  );
				`);

          // 4) FK если ещё нет
          await pool.query(`
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
          await pool.query(`
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

          await pool.query(
            `DROP TRIGGER IF EXISTS set_users_updated_at    ON public.users;`
          );
          await pool.query(
            `DROP TRIGGER IF EXISTS set_messages_updated_at ON public.messages;`
          );

          await pool.query(`
				  CREATE TRIGGER set_users_updated_at
				  BEFORE UPDATE ON public.users
				  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
				`);

          await pool.query(`
				  CREATE TRIGGER set_messages_updated_at
				  BEFORE UPDATE ON public.messages
				  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
				`);
        }
        await initDB();
        return resolve(true);
      })

      .catch(() => reject());
  });
};
app.get('/users', async (req, res) => {
  try {
    const { rows: users } = await pool.query(`SELECT * FROM users`);
    res.status(200).json({ users });
  } catch (error: any) {
    res.status(400).send(error.message);
  }
});

app.get('/user', async (req, res) => {
  try {
    const { username } = req.query;

    const { rows: users } = await pool.query(
      `SELECT * FROM users WHERE username = $1`,
      [username]
    );
    if (users.length === 0) throw new Error('SUCH USER DOES NOT EXISTS');
    res.status(200).json({ user: users[0] });
  } catch (error: any) {
    res.status(400).send(error.message);
  }
});

app.post('/user', upload.single('avatar'), async (req, res) => {
  try {
    const { username } = req.body;
    // console.log('FILE: ', req.file);
    // res.status(200).send(true);

    const { rows: users } = await pool.query(
      `SELECT * FROM users WHERE username = $1`,
      [username]
    );

    if (users.length > 0) throw new Error('SUCH USER ALREADY EXISTS');

    let pathForDB = null;

    if (req.file) {
      const { path: tmpPath } = req.file;
      const buf = await fs.readFile(tmpPath);
      const hash = sha256(buf);
      const fileName = `user_${username}_${hash}.webp`;
      const finalPath = path.join(uploadPath, fileName);
      await sharp(buf).resize(512).webp({ quality: 95 }).toFile(finalPath);
      await fs.rm(tmpPath, { force: true });

      pathForDB = `/uploads/${fileName}`;
    }
    await pool.query(`INSERT INTO users (username, avatar) VALUES($1, $2)`, [
      username,
      pathForDB,
    ]);

    const { rows: createdUser } = await pool.query(
      `SELECT * FROM users WHERE username = $1`,
      [username]
    );

    res.status(200).json({ user: createdUser[0] });
  } catch (error: any) {
    res.status(400).send(error.message);
  }
});

app.patch('/user', upload.single('avatar'), async (req, res) => {
  try {
    const { username } = req.body;
    const { rows: users } = await pool.query(
      `
    SELECT * FROM users WHERE username = $1`,
      [username]
    );
    if (!users[0]) throw new Error(`User not found`);
    let pathForDB = null;

    if (req.file) {
      const { path: tmpPath } = req.file;
      const buf = await fs.readFile(tmpPath);
      const hash = sha256(buf);
      const fileName = `user_${username}_${hash}.webp`;
      const finalPath = path.join(uploadPath, fileName);
      await sharp(buf).resize(512).webp({ quality: 95 }).toFile(finalPath);
      await fs.rm(tmpPath, { force: true });

      pathForDB = `/uploads/${fileName}`;
    }

    await pool.query(`UPDATE users SET avatar = $1 WHERE username = $2`, [
      pathForDB,
      username,
    ]);
    const { rows: updatedUsers } = await pool.query(
      `SELECT * FROM users WHERE username = $1`,
      [username]
    );

    console.log('UPDATED USER: ', updatedUsers);
    res.status(200).json({ user: updatedUsers[0] });
  } catch (error: any) {
    res.status(400).send(error.message);
  }
});

app.get('/messages', async (req, res) => {
  try {
    const { rows: messages } = await pool.query(`
      SELECT messages.uuid as uuid,
        messages.content AS content,
        messages.updated_at AS updated_at,
        users.username AS username,
        users.avatar AS avatar,
        CASE WHEN messages.created_at = messages.updated_at THEN 'false' else 'true' END AS was_edited
      FROM messages LEFT JOIN users ON users.uuid = messages.author_uuid`);
    res.status(200).json({ messages });
  } catch (error: any) {
    res.status(400).send(error.message);
  }
});

app.post('/message', async (req, res) => {
  try {
    let { username, content } = req.body ?? {};
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

    const { rows: users } = await pool.query(
      `SELECT uuid, username FROM users WHERE lower(username) = lower($1) LIMIT 1`,
      [username]
    );
    if (users.length === 0) {
      return res.status(404).json({ error: 'SUCH USER DOES NOT EXIST' });
    }
    const user = users[0];

    const { rows: inserted } = await pool.query(
      `INSERT INTO messages (content, author_uuid)
       VALUES ($1, $2)
       RETURNING id, content, author_uuid, created_at`,
      [content, user.uuid]
    );
    const message = inserted[0];

    return res.status(201).json({ message });
  } catch (err: any) {
    return res
      .status(500)
      .json({ error: 'Internal server error', detail: err?.message });
  }
});

init().then(() => {
  app.listen(PORT, () => {
    // test();
    console.log('APP IS RUNNING ON PORT: ' + PORT);
  });
});
