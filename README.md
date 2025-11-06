# Couple Sync — Backend (Node.js/Express)

API REST responsável por autenticação, upload e gestão de memórias. Usa PostgreSQL (Neon) para metadados e Cloudinary para armazenar imagens.

## Requisitos

- Node.js 18+
- PostgreSQL (Neon recomendado) — URL única com SSL
- Conta no Cloudinary para armazenar as imagens

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

O script `initDb.js` cria/garante as tabelas necessárias. Ele é importado na primeira execução (verificar em `index.js`) ou execute manualmente:

```bash
node initDb.js
```

Estrutura simplificada:

- `usuarios`: id, created_at, email (único), password_hash (bcrypt)
- `fotos`: id, created_at, image_url (CDN Cloudinary), description, photo_date

## Endpoints (prefixo /api)

| Método | Rota       | Auth | Descrição                                                         |
| ------ | ---------- | ---- | ----------------------------------------------------------------- |
| POST   | /register  | -    | Cria usuário (hash bcrypt)                                        |
| POST   | /login     | -    | Retorna JWT + dados do usuário                                    |
| GET    | /fotos     | ✔    | Lista fotos do usuário autenticado                                |
| POST   | /upload    | ✔    | Upload multipart (imageFile, description, photoDate) + Cloudinary |
| PUT    | /fotos/:id | ✔    | Atualiza descrição / data da foto                                 |
| DELETE | /fotos/:id | ✔    | Remove registro e a imagem no Cloudinary                          |

Use o header: `Authorization: Bearer <token>`.

## Stack

- Express, CORS, dotenv
- Multer (memoryStorage) + Cloudinary SDK
- Bcrypt + JWT (assinatura simples HS256)
- pg (Pool) usando `DATABASE_URL`

## Fluxo de Upload (detalhado)

1. Cliente envia multipart (imageFile, description, photoDate) com cabeçalho Authorization.
2. Middleware valida JWT e extrai user id.
3. Multer coloca o binário em memória → Cloudinary recebe stream/arquivo.
4. URL pública retornada pelo Cloudinary é gravada na tabela `fotos`.
5. Resposta JSON com metadados completos para render imediato no frontend.

## Segurança e considerações

- JWT simples (sem refresh) adequado para MVP acadêmico; em produção usar expiração curta + refresh tokens.
- Upload limitado ao formato suportado pelo Cloudinary (config padrão aceita JPEG/PNG).
- Remoção: tentativa de deletar a imagem no Cloudinary antes de remover do banco evita órfãos.
- `ssl: { rejectUnauthorized: false }` usado porque alguns provedores serverless (Neon) exigem ajustes para conexões locais.

## Documentação da API

OpenAPI parcial em `openapi.yml`; pode ser servido via Swagger UI em `/api/docs`.

## Erros comuns

- 401 ao acessar `/fotos` → token ausente ou inválido.
- 500 no upload → chaves do Cloudinary incorretas ou problema de rede.
- Erro de conexão Postgres → revisar `DATABASE_URL` e permissões.
