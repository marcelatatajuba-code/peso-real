/*
 * construir-arquivo-unico.js
 *
 * Junta o app inteiro — HTML, CSS, JavaScript, ícones e imagens — em um único
 * arquivo .html, para que ele possa ser enviado por WhatsApp, e-mail ou pendrive
 * e aberto direto, sem servidor e sem internet.
 *
 * Como rodar:
 *   cd dne-digital
 *   node construir-arquivo-unico.js
 *
 * Gera: dne-digital-replica.html
 */
const fs = require('fs');
const path = require('path');

const raiz = __dirname;
const ler = (p) => fs.readFileSync(path.join(raiz, p), 'utf8');
const lerBin = (p) => fs.readFileSync(path.join(raiz, p));

const TIPOS = { '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg' };
const dataUri = (p) => `data:${TIPOS[path.extname(p)]};base64,${lerBin(p).toString('base64')}`;

// troca literal, sem regex, para não interpretar `$&` e afins no conteúdo inserido
function trocar(texto, alvo, valor) {
  const i = texto.indexOf(alvo);
  if (i < 0) throw new Error('trecho não encontrado no index.html: ' + alvo);
  return texto.slice(0, i) + valor + texto.slice(i + alvo.length);
}

let html = ler('index.html');

// 1. folha de estilo
html = trocar(html, '<link rel="stylesheet" href="css/app.css">',
  '<style>\n' + ler('css/app.css') + '\n</style>');

// 2. scripts, na mesma ordem em que aparecem
for (const arquivo of ['js/qr.js', 'js/dados.js', 'js/app.js']) {
  let codigo = ler(arquivo);
  if (arquivo === 'js/app.js') {
    codigo = codigo.replace('var ARQUIVO_UNICO = false;', 'var ARQUIVO_UNICO = true; ');
  }
  html = trocar(html, `<script src="${arquivo}"></script>`, '<script>\n' + codigo + '\n</script>');
}

// 3. imagens viram data: URI
const icone = dataUri('assets/icone-180.png');
const foto = dataUri('assets/foto-exemplo.svg');
html = html.split('href="assets/icone-180.png"').join(`href="${icone}"`);
while (html.includes('src="assets/foto-exemplo.svg"')) {
  html = trocar(html, 'src="assets/foto-exemplo.svg"', `src="${foto}"`);
}
html = trocar(html, '<link rel="manifest" href="manifest.webmanifest">',
  '<!-- sem manifest: neste formato o app é um arquivo só -->');

// 4. aviso no topo do arquivo gerado
html = trocar(html, '<!DOCTYPE html>',
  `<!DOCTYPE html>
<!--
  DNE Digital — réplica acadêmica (trabalho de curso).
  Arquivo único, gerado por construir-arquivo-unico.js. Não edite este arquivo:
  altere os originais em dne-digital/ e gere de novo.
  Sem validade legal. Dados fictícios, guardados apenas no aparelho de quem abre.
-->`);

const saida = path.join(raiz, 'dne-digital-replica.html');
fs.writeFileSync(saida, html);

const kb = (fs.statSync(saida).size / 1024).toFixed(0);
console.log(`gerado: ${path.relative(process.cwd(), saida)} (${kb} KB)`);
if (html.includes('href="css/') || html.includes('src="js/') || html.includes('"assets/')) {
  console.error('ATENÇÃO: sobrou referência a arquivo externo.');
  process.exit(1);
}
console.log('nenhuma referência externa: o arquivo abre sozinho.');
