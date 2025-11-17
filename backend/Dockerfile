# ---------- build stage ----------
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package*.json ./
RUN npm i -D typescript
RUN npm i
COPY tsconfig*.json ./
COPY src ./src
RUN npm run build  # должен собрать в dist/

# ---------- runtime stage ----------
FROM node:20-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV NODE_ENV=production
COPY package*.json ./
RUN npm i --omit=dev
COPY --from=builder /app/dist ./dist

RUN mkdir -p /app/uploads
VOLUME ["/app/uploads"]

EXPOSE 3001
CMD ["node", "dist/index.js"]