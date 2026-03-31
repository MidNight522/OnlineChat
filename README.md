# Chat Room
# Demo https://onlinechat-1-k78x.onrender.com

A full-stack real-time style chat application with user profiles, avatars, message editing, formatting toolbar, emoji picker, and PostgreSQL persistence.

## Features

- Username + 6-digit access code authentication
- Public chat interface
- Create, edit, and delete messages
- Edited message indicator
- Date separators for messages
- Auto-scroll with scroll-to-bottom button
- User avatar upload and delete
- Profile modal
- Emoji picker
- Rich text toolbar:
  - bold
  - italic
  - underline
  - strike
  - subscript
  - superscript
  - ordered list
  - unordered list
  - image
  - link
  - quote
  - code
  - clean formatting

## Tech Stack

### Frontend

- Vanilla JavaScript
- HTML
- CSS

### Backend

- Node.js
- Express
- TypeScript
- Multer
- Sharp
- PostgreSQL

### Infrastructure

- Docker
- Docker Compose
- Nginx

## Project Structure

```text
.
├── backend
│   ├── src / index.ts
│   ├── Dockerfile
│   └── .env
├── db
│   └── .env
├── nginx
│   └── default.conf
├── web
│   ├── index.html
│   └── assets
│       ├── index.js
│       ├── api
│       ├── ui
│       ├── utils
│       ├── styles
│       └── images
└── docker-compose.yml

Main Functionality
Authentication

Users enter:

username
6-digit access code

If the user does not exist, a new account is created.
If the user already exists, the access code must match.

Messages

Users can:

send messages
edit their own messages
delete their own messages
use formatting toolbar
insert emojis
Profile

Users can:

open profile modal
upload avatar
delete avatar
Database

Main tables:

users
uuid
username
avatar
access_code
created_at
updated_at
messages
uuid
content
author_uuid
created_at
updated_at
Running the Project Locally

1. Clone the repository
   git clone <your-repository-url>
   cd <your-project-folder>
2. Configure environment variables
3. Uncomment the line in the config.js file located at web/assets/api, and second comment
4. Comment window sccript in index.html

Create and fill .env files for:

db/.env
backend/.env

Example PostgreSQL values:

POSTGRES_DB=your_db_name
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password

Example backend values:

PORT=3001
DB_HOST=db
DB_PORT=5432
DB_NAME=your_db_name
DB_USER=your_user
DB_PASSWORD=your_password 3. Start the project
docker compose up --build 4. Open in browser
http://localhost
Development Notes

If backend changes do not apply immediately, rebuild the containers:

docker compose down
docker compose up --build
Future Improvements
WebSocket instead of polling
Better text formatting preview
Safer HTML sanitization
Message reactions
Typing indicator
Private chats
Mobile UX improvements
Author

Kirill Laine
```
