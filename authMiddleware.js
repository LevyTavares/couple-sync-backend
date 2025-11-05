// api/authMiddleware.js

const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // 1. Tenta pegar o token do cabeçalho 'Authorization'
  // O formato esperado é: "Bearer TOKEN_LONGO_AQUI"
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Se não houver token, ou se o formato estiver errado
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }

  // 2. Pega apenas a parte do token (depois do "Bearer ")
  const token = authHeader.split(' ')[1];

  try {
    // 3. Verifica se o token é válido (usando o nosso segredo)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 4. Se for válido, guarda os dados do usuário (ex: id)
    //    no objeto 'req' para que a próxima rota (ex: upload) possa usá-lo.
    req.user = decoded; // req.user agora tem { userId: ..., email: ... }
    
    // 5. Deixa o pedido passar para a rota principal
    next();
    
  } catch (err) {
    // Se o token for inválido ou expirado
    res.status(401).json({ error: 'Token inválido.' });
  }
};

module.exports = authMiddleware;