// api/index.js

// 1. Importa os pacotes
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');
const { cloudinary, uploadMiddleware } = require('./cloudinaryConfig');

// 2. IMPORTAÇÕES DE SEGURANÇA
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('./authMiddleware'); // O NOSSO "SEGURANÇA"

// 3. Inicializa o App Express
const app = express();
const PORT = process.env.PORT || 4000;

// 4. Configura os Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- 🔒 ROTAS DE AUTENTICAÇÃO 🔒 ---
// (Estas rotas NÃO SÃO protegidas, pois são para criar/obter o token)

// Rota de Registro (POST /api/register)
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    const { rows: userExists } = await db.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email]
    );
    if (userExists.length > 0) {
      return res.status(400).json({ error: 'Este email já está em uso.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

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


// Rota de Login (POST /api/login)
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    const { rows: userRows } = await db.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email]
    );
    
    if (userRows.length === 0) {
      return res.status(401).json({ error: 'Email ou senha inválidos.' });
    }
    
    const user = userRows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Email ou senha inválidos.' });
    }

    const payload = {
      userId: user.id,
      email: user.email,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

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
// (Estas rotas AGORA ESTÃO PROTEGIDAS pelo authMiddleware)

app.get('/api/fotos', authMiddleware, async (req, res) => {
  try {
    // O authMiddleware já verificou o usuário
    const { rows } = await db.query(
      'SELECT * FROM fotos ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar fotos:', err.stack);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/upload', authMiddleware, uploadMiddleware.single('imageFile'), async (req, res) => {
  try {
    const { description, photoDate } = req.body;
    const fileBuffer = req.file.buffer;

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "couple-sync-gallery" },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      stream.end(fileBuffer);
    });

    const imageUrl = uploadResult.secure_url;

    const { rows } = await db.query(
      `INSERT INTO fotos (image_url, description, photo_date) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [imageUrl, description, photoDate]
    );

    res.status(201).json(rows[0]);

  } catch (err) {
    console.error('Erro no upload:', err.stack);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.put('/api/fotos/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { description, photoDate } = req.body;

    if (!description || !photoDate) {
      return res.status(400).json({ error: 'Descrição e data são obrigatórias.' });
    }

    const { rows } = await db.query(
      `UPDATE fotos 
       SET description = $1, photo_date = $2 
       WHERE id = $3 
       RETURNING *`,
      [description, photoDate, id]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: 'Foto não encontrada.' });
    }

    res.status(200).json(rows[0]);

  } catch (err) {
    console.error('Erro ao atualizar foto:', err.stack);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.delete('/api/fotos/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const { rows: fotoRows } = await db.query(
      'SELECT image_url FROM fotos WHERE id = $1',
      [id]
    );

    if (fotoRows.length > 0) {
      const imageUrl = fotoRows[0].image_url;
      const urlSegments = imageUrl.split('/');
      const publicIdWithExtension = urlSegments.slice(-2).join('/');
      const publicId = publicIdWithExtension.substring(0, publicIdWithExtension.lastIndexOf('.'));
      
      await cloudinary.uploader.destroy(publicId);
    }

    await db.query('DELETE FROM fotos WHERE id = $1', [id]);
    res.status(200).json({ message: 'Foto apagada com sucesso' }); 

  } catch (err) {
    console.error('Erro ao apagar foto:', err.stack);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});


// --- Inicia o Servidor ---
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend rodando na porta ${PORT}`);
});