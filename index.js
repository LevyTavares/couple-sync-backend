// api/index.js

// 1. Importa os pacotes
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');
const { cloudinary, uploadMiddleware } = require('./cloudinaryConfig');

// 👇 2. NOVAS IMPORTAÇÕES DE SEGURANÇA 👇
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 3. Inicializa o App Express
const app = express();
const PORT = process.env.PORT || 4000;

// 4. Configura os Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- 🔒 ROTAS DE AUTENTICAÇÃO 🔒 ---

// 👇 5. NOVO: Rota de Registro (POST /api/register) 👇
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validação simples
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    // Verifica se o usuário já existe
    const { rows: userExists } = await db.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email]
    );
    if (userExists.length > 0) {
      return res.status(400).json({ error: 'Este email já está em uso.' });
    }

    // Criptografa a senha (Hashing)
    const salt = await bcrypt.genSalt(10); // Gera o "sal"
    const passwordHash = await bcrypt.hash(password, salt); // Cria o hash

    // Salva o novo usuário no banco de dados
    const { rows: newUser } = await db.query(
      'INSERT INTO usuarios (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [email, passwordHash]
    );

    res.status(201).json(newUser[0]);

  } catch (err) {
    console.error('Erro no registro:', err.stack);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});


// 👇 6. NOVO: Rota de Login (POST /api/login) 👇
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validação
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    // Procura o usuário pelo email
    const { rows: userRows } = await db.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email]
    );
    
    // Se o usuário não for encontrado
    if (userRows.length === 0) {
      return res.status(401).json({ error: 'Email ou senha inválidos.' }); // 401 = Não autorizado
    }
    
    const user = userRows[0];

    // Compara a senha enviada com o hash salvo no banco
    const isMatch = await bcrypt.compare(password, user.password_hash);

    // Se as senhas não baterem
    if (!isMatch) {
      return res.status(401).json({ error: 'Email ou senha inválidos.' });
    }

    // 7. SUCESSO! Cria o Token (JWT)
    // O "payload" é a informação que guardamos dentro do token
    const payload = {
      userId: user.id,
      email: user.email,
    };

    // Assina o token com nosso segredo do .env
    // Ele expira em 7 dias ("7d")
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    // Envia o token de volta para o frontend
    res.status(200).json({
      message: 'Login bem-sucedido!',
      token: token,
      user: {
        id: user.id,
        email: user.email
      }
    });

  } catch (err) {
    console.error('Erro no login:', err.stack);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});


// --- 📸 ROTAS DAS FOTOS (CRUD) 📸 ---
// (Estas rotas permanecem exatamente como estavam)

app.get('/api/fotos', async (req, res) => { /* ...código... */ });
app.post('/api/upload', uploadMiddleware.single('imageFile'), async (req, res) => { /* ...código... */ });
app.put('/api/fotos/:id', async (req, res) => { /* ...código... */ });
app.delete('/api/fotos/:id', async (req, res) => { /* ...código... */ });


// --- Inicia o Servidor ---
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend rodando na porta ${PORT}`);
});