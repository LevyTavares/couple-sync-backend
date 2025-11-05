// api/cloudinaryConfig.js
/**
 * Configuração do Cloudinary e Multer (memoryStorage).
 * - Evita escrita em disco (compatível com plataformas serverless).
 * - Exporta `cloudinary` e `uploadMiddleware` para uso nas rotas.
 */
const cloudinary = require("cloudinary").v2;
const multer = require("multer");

// 1. Configura o SDK do Cloudinary com as chaves do .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Garante que as URLs sejam https
});

// 2. Configura o Multer para "Memory Storage"
// Em vez de salvar o arquivo no disco do servidor (o que não funciona no Vercel),
// o multer vai guardar o arquivo na memória RAM temporariamente.
const storage = multer.memoryStorage();
const uploadMiddleware = multer({ storage: storage });

// 3. Exporta o cloudinary e o middleware de upload
module.exports = { cloudinary, uploadMiddleware };
