// api/initDb.js

const { query } = require('./db'); // Importa nosso módulo de BD

async function setupDatabase() {
  // Comando SQL para criar a tabela "fotos" (já tínhamos)
  const createFotosTableQuery = `
  CREATE TABLE IF NOT EXISTS fotos (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    image_url TEXT NOT NULL,
    description TEXT,
    photo_date DATE
  );
  `;

  // 👇 NOVO Comando SQL para criar a tabela "usuarios" 👇
  const createUsuariosTableQuery = `
  CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
  );
  `;

  try {
    // Executa o primeiro comando
    await query(createFotosTableQuery);
    console.log('✅ Tabela "fotos" verificada/criada com sucesso!');

    // Executa o segundo comando
    await query(createUsuariosTableQuery);
    console.log('✅ Tabela "usuarios" verificada/criada com sucesso!');

  } catch (err) {
    console.error('❌ Erro ao configurar o banco de dados:', err.stack);
  }
}

setupDatabase();