# Production image (Next.js standalone output).
#   docker build -t mess-app .
#   docker run -p 3000:3000 -e DATABASE_URL=... mess-app
# Run migrations separately before starting: docker build --target migrator -t mess-migrate . && docker run -e DATABASE_URL=... mess-migrate

FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci --ignore-scripts && npx prisma generate

FROM deps AS builder
COPY . .
RUN npx prisma generate && npm run build

# Applies prisma/migrations to DATABASE_URL and exits.
FROM deps AS migrator
CMD ["npx", "prisma", "migrate", "deploy"]

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 TZ=Asia/Kolkata
RUN addgroup -S app && adduser -S app -G app
COPY --from=builder --chown=app:app /app/public ./public
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
USER app
EXPOSE 3000
CMD ["node", "server.js"]
