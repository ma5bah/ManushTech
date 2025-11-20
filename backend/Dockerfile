FROM node:20-alpine AS base
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN npx prisma generate
RUN pnpm build
RUN npx tsc prisma/seed.ts --outDir dist/prisma --target es2017 --module commonjs --esModuleInterop --skipLibCheck

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=base /app/dist ./dist
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/src ./src
EXPOSE 3000
CMD [ "node", "dist/main.js" ]
