const express = require('express');
const helmet = require('helmet');

const router = express.Router();

if (!process.env.FIREBASE_WEB_API_KEY) {
    throw new Error('Faltando chave web do Firebase (FIREBASE_WEB_API_KEY)');
}

/**
 * Cores/tipografia copiadas de DFS-frontend/src/css/theme.js (tema claro) —
 * duplicado deliberado: esta página HTML roda fora do bundle React Native e
 * não deve importar código do frontend. Se a paleta do app mudar, atualizar
 * aqui também.
 */
const PAGINA_HTML = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Redefinir senha · Dynamic Flame Sensor</title>
<style>
  :root {
    --bg: #FAFAF8; --card: #FFFFFF; --border: #E8E6E1;
    --text-primary: #1A1917; --text-secondary: #6B6860; --text-muted: #A09E98;
    --flame: #E5421A; --gas: #2563EB;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: var(--bg); font-family: -apple-system, Roboto, Arial, sans-serif; padding: 24px;
  }
  .card { width: 100%; max-width: 380px; background: var(--card); border: 1px solid var(--border);
    border-radius: 16px; padding: 28px 24px; }
  h1 { font-family: Georgia, serif; font-size: 24px; color: var(--text-primary); margin: 0 0 6px; }
  p { font-size: 13px; line-height: 1.5; color: var(--text-secondary); margin: 0 0 20px; }
  label { font-size: 11px; letter-spacing: 1.6px; color: var(--text-muted); font-weight: 500;
    display: block; margin-bottom: 6px; }
  input { width: 100%; height: 46px; border-radius: 12px; border: 1px solid var(--border);
    padding: 0 14px; font-size: 15px; color: var(--text-primary); margin-bottom: 14px; }
  button { width: 100%; min-height: 52px; border-radius: 8px; border: none;
    background: var(--flame); color: #fff; font-size: 14.5px; font-weight: 600; cursor: pointer; }
  button:disabled { opacity: 0.6; cursor: default; }
  .msg { font-size: 13px; margin-top: 14px; min-height: 18px; }
  .msg.erro { color: var(--flame); }
  #form-ok, #form-erro { display: none; }
</style>
</head>
<body>
  <div class="card">
    <div id="form-senha">
      <h1>Redefinir senha</h1>
      <p>Escolha uma nova senha para sua conta Dynamic Flame Sensor.</p>
      <label for="senha">NOVA SENHA</label>
      <input id="senha" type="password" placeholder="Mínimo 6 caracteres" autocomplete="new-password" />
      <button id="btn-enviar" type="button">Redefinir senha</button>
      <div id="msg" class="msg"></div>
    </div>
    <div id="form-ok">
      <h1 style="color:var(--gas)">Senha atualizada</h1>
      <p>Sua senha foi redefinida. Você já pode entrar no app com a nova senha.</p>
    </div>
    <div id="form-erro">
      <h1>Link inválido</h1>
      <p id="erro-texto">Este link de redefinição não é válido ou já expirou. Solicite um novo link pelo app.</p>
    </div>
  </div>
  <script>
    (function () {
      var API_KEY = ${JSON.stringify(process.env.FIREBASE_WEB_API_KEY)};
      var params = new URLSearchParams(window.location.search);
      var oobCode = params.get('oobCode');
      var modo = params.get('mode');

      var elSenha = document.getElementById('form-senha');
      var elOk = document.getElementById('form-ok');
      var elErro = document.getElementById('form-erro');
      var elErroTexto = document.getElementById('erro-texto');
      var elMsg = document.getElementById('msg');
      var elBtn = document.getElementById('btn-enviar');
      var elInput = document.getElementById('senha');

      function mostrarErro(texto) {
        elSenha.style.display = 'none';
        elOk.style.display = 'none';
        elErro.style.display = 'block';
        if (texto) elErroTexto.textContent = texto;
      }

      if (!oobCode || (modo && modo !== 'resetPassword')) {
        mostrarErro('Nenhum código de redefinição foi informado. Abra o link enviado por e-mail.');
      } else {
        elSenha.style.display = 'block';
      }

      async function redefinir() {
        var novaSenha = elInput.value;
        if (!novaSenha || novaSenha.length < 6) {
          elMsg.textContent = 'A senha precisa ter pelo menos 6 caracteres.';
          elMsg.className = 'msg erro';
          return;
        }
        elBtn.disabled = true;
        elMsg.textContent = '';
        try {
          var resposta = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=' + API_KEY, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ oobCode: oobCode, newPassword: novaSenha }),
          });
          var dados = await resposta.json();
          if (!resposta.ok) {
            var codigo = (dados.error && dados.error.message) || '';
            if (codigo === 'EXPIRED_OOB_CODE' || codigo === 'INVALID_OOB_CODE') {
              mostrarErro('Este link de redefinição não é válido ou já expirou. Solicite um novo link pelo app.');
            } else if (codigo.indexOf('WEAK_PASSWORD') === 0) {
              elMsg.textContent = 'Senha muito fraca. Tente uma senha mais forte.';
              elMsg.className = 'msg erro';
              elBtn.disabled = false;
            } else {
              elMsg.textContent = 'Não foi possível redefinir a senha agora. Tente novamente.';
              elMsg.className = 'msg erro';
              elBtn.disabled = false;
            }
            return;
          }
          elSenha.style.display = 'none';
          elOk.style.display = 'block';
        } catch (erro) {
          elMsg.textContent = 'Erro de conexão. Verifique sua internet e tente novamente.';
          elMsg.className = 'msg erro';
          elBtn.disabled = false;
        }
      }

      elBtn.addEventListener('click', redefinir);
    })();
  </script>
</body>
</html>
`;

/**
 * CSP relaxado só pra esta rota: a página precisa de <script>/<style>
 * inline e de um fetch cross-origin pra identitytoolkit.googleapis.com, que
 * o CSP padrão do helmet() global (ver server.js) bloquearia. O helmet()
 * global já roda antes e seta o header estrito — por isso o removemos aqui
 * explicitamente em vez de confiar que `contentSecurityPolicy: false`
 * sozinho sobrescreveria um header que o middleware anterior já setou.
 */
router.use(
    helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }),
    (req, res, next) => {
        res.removeHeader('Content-Security-Policy');
        next();
    }
);

router.get('/', (req, res) => {
    res.type('html').send(PAGINA_HTML);
});

module.exports = router;
