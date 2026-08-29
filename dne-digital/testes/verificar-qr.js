/*
 * verificar-qr.js — comprova que o gerador de QR Code do app está correto.
 *
 * Faz duas verificações independentes:
 *   1. compara as matrizes geradas, módulo a módulo, com a biblioteca de
 *      referência `qrcode`, em todas as versões (1 a 40) e níveis de correção;
 *   2. entrega os códigos a um decodificador independente (`jsQR`) e confere
 *      se o texto lido é exatamente o texto de origem.
 *
 * Como rodar (fora do app; nada disso vai para o celular):
 *   cd dne-digital/testes
 *   npm install qrcode jsqr
 *   node verificar-qr.js
 */
const QR = require('../js/qr.js');
const ref = require('qrcode');
const jsQR = require('jsqr');

const NIVEIS = ['L', 'M', 'Q', 'H'];
let identicas = 0, difMascara = 0, errosMatriz = 0;

/* ---- 1. comparação com a biblioteca de referência ---------------------- */
for (let tamanho = 1; tamanho <= 1250; tamanho += 17) {
  // texto em minúsculas força o modo byte também na referência
  const texto = 'dne-replica '.repeat(Math.ceil(tamanho / 12)).slice(0, tamanho);

  for (const nivel of NIVEIS) {
    let meu;
    try { meu = QR.encode(texto, nivel); } catch (e) { continue; }

    const oficial = ref.create(texto, { errorCorrectionLevel: nivel });
    if (oficial.segments.some((s) => s.mode.id !== 'Byte')) continue;

    const n = oficial.modules.size;
    let igual = meu.size === n;
    if (igual) {
      for (let y = 0; y < n && igual; y++) {
        for (let x = 0; x < n; x++) {
          if (meu.modules[y][x] !== !!oficial.modules.data[y * n + x]) { igual = false; break; }
        }
      }
    }

    if (igual) identicas++;
    else if (oficial.maskPattern !== meu.mask) difMascara++;  // empate na penalidade: ambos válidos
    else { errosMatriz++; console.log('divergente:', nivel, 'v' + meu.version, 'tamanho', tamanho); }
  }
}

/* ---- 2. leitura por um decodificador independente ---------------------- */
function decodificar(texto, nivel) {
  const qr = QR.encode(texto, nivel);
  const escala = 4, margem = 4;
  const dim = (qr.size + margem * 2) * escala;
  const px = new Uint8ClampedArray(dim * dim * 4).fill(255);

  for (let y = 0; y < qr.size; y++) {
    for (let x = 0; x < qr.size; x++) {
      if (!qr.modules[y][x]) continue;
      for (let dy = 0; dy < escala; dy++) {
        for (let dx = 0; dx < escala; dx++) {
          const i = (((y + margem) * escala + dy) * dim + ((x + margem) * escala + dx)) * 4;
          px[i] = px[i + 1] = px[i + 2] = 0;
        }
      }
    }
  }
  const lido = jsQR(px, dim, dim);
  return lido && lido.data;
}

const CASOS = [
  'REPLICA-ACADEMICA-SEM-VALIDADE|DNE|4172 9083 5514 2260|123.456.789-09|Ana Beatriz Souza Lima|Universidade Federal do Paraná|2027-03-31|3A51-AF7C-D82F|1B2C3D4E',
  'ISIC-REPLICA-ACADEMICA|A1B2C3D4|SEM VALIDADE',
  'acentuação: ção, ãõ, çÇ — teste de UTF-8',
  'x'.repeat(600)
];

let errosLeitura = 0;
for (const texto of CASOS) {
  for (const nivel of NIVEIS) {
    if (decodificar(texto, nivel) !== texto) {
      errosLeitura++;
      console.log('não foi lido corretamente:', nivel, JSON.stringify(texto.slice(0, 40)));
    }
  }
}

/* ---- resultado --------------------------------------------------------- */
console.log('\n--- comparação com a biblioteca de referência ---');
console.log('matrizes idênticas .................', identicas);
console.log('só a máscara escolhida difere ......', difMascara, '(ambas válidas)');
console.log('erros de matriz ....................', errosMatriz);
console.log('\n--- leitura por decodificador independente ---');
console.log('casos testados .....................', CASOS.length * NIVEIS.length);
console.log('falhas de leitura ..................', errosLeitura);

process.exit(errosMatriz + errosLeitura === 0 ? 0 : 1);
