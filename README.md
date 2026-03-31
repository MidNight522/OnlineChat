# Real-Time Chat Application (Full-Stack)

Live Demo: https://onlinechat-1-k78x.onrender.com

A full-stack chat application with user authentication, avatar management, and PostgreSQL persistence.

Built as a real-world project focusing on clean architecture, user experience, and production-ready deployment.

---

## 🚀 Key Features

- Authentication with username + 6-digit access code
- Create, edit, and delete messages
- Message editing indicator
- Avatar upload and removal
- Profile management modal
- Emoji picker and rich text formatting
- Auto-scroll and smooth UI interactions
- Date grouping for messages

---

## 🛠 Tech Stack

**Frontend**
- Vanilla JavaScript
- HTML / CSS

**Backend**
- Node.js (Express)
- TypeScript
- Multer (file uploads)
- Sharp (image processing)

**Database**
- PostgreSQL

**Infrastructure**
- Docker
- Docker Compose
- Nginx
- Deployed on Render

---

## 🧠 What I Focused On

- Building a complete full-stack application from scratch  
- Designing a clean and maintainable backend structure  
- Handling real-world features like file uploads and user data  
- Deploying and debugging a production environment  

---

## 📦 Project Structure

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

## ⚙️ Running Locally

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
```
## 🔮 Future Improvements

- WebSocket instead of polling
- Message reactions
- Typing indicator
- Private chats
- Improved mobile UX

---

## 👤 Author

Kirill Laine
