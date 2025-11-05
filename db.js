// api/db.js
/**
 * Pool de conexão PostgreSQL.
 * Usa DATABASE_URL do .env e SSL (compatível com Neon e provedores gerenciados).
 */
const { Pool } = require("pg"); // Importa o driver do PostgreSQL
require("dotenv").config();

// Cria um "pool" de conexões usando a URL do nosso .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Necessário para conexões com o Neon
  },
});

// Exporta uma função 'query' para usarmos em outros arquivos
module.exports = {
  query: (text, params) => pool.query(text, params),
};
