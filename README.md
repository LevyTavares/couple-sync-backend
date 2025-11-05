# Couple Sync — Backend (Node.js/Express)

API para autenticação e gestão de fotos com armazenamento de imagens no Cloudinary e PostgreSQL.

## Requisitos

- Node.js 18+
- Banco PostgreSQL (DATABASE_URL)
- Conta no Cloudinary

## Variáveis de ambiente

Crie um `.env` a partir do exemplo:

```bash
cp .env.example .env
```

Exemplo de conteúdo:

```
PORT=4000
DATABASE_URL=postgres://user:password@host:port/dbname
JWT_SECRET=defina-uma-chave-segura
CLOUDINARY_CLOUD_NAME=xxxxxxxx
CLOUDINARY_API_KEY=xxxxxxxx
CLOUDINARY_API_SECRET=xxxxxxxx
```

## Scripts

```bash
npm install  # instala dependências
npm run dev  # inicia em modo desenvolvimento (nodemon)
npm start    # inicia em produção
```

## Inicialização do banco

O script `initDb.js` cria/garante as tabelas necessárias.
Ele é importado na primeira execução do projeto (ou execute manualmente):

```bash
node initDb.js
```

Tabelas criadas:

- `usuarios (id, created_at, email, password_hash)`
- `fotos (id, created_at, image_url, description, photo_date)`

## Endpoints (prefixo /api)

- POST `/register` → { email, password } → cria usuário
- POST `/login` → { email, password } → retorna { token, user }
- GET `/fotos` (auth) → lista fotos
- POST `/upload` (auth, multipart: imageFile, description, photoDate) → cria foto e envia ao Cloudinary
- PUT `/fotos/:id` (auth) → { description, photoDate }
- DELETE `/fotos/:id` (auth) → remove do banco e da Cloudinary

Use o header: `Authorization: Bearer <token>`.

## Stack

- Express, CORS, dotenv
- Multer (memoryStorage) + Cloudinary
- BCrypt + JWT para autenticação
- pg (Pool) com `DATABASE_URL`

## Notas

- `ssl.rejectUnauthorized=false` no `db.js` facilita conexões com provedores como o Neon.
- Ao deletar fotos, a API tenta remover a imagem correspondente no Cloudinary.
