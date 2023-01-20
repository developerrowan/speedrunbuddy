FROM node:18.12.1-alpine AS base

RUN npm i -g pnpm

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml ./
COPY . .
RUN pnpm install --frozen-lockfile && pnpm run build

FROM base AS deploy

WORKDIR /app
ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY --from=base /usr/src/app/build ./build

CMD ["node", "build/index.js"]