FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src

RUN npm run build

FROM node:24-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev \
  && apk add --no-cache curl \
  && chown -R node:node /app

COPY --from=build /app/dist ./dist

USER node

EXPOSE 4000

CMD ["node", "dist/main.js"]
