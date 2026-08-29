/* ============================================================================
   qr.js — Gerador de QR Code em JavaScript puro (sem bibliotecas externas).
   Implementa o padrao ISO/IEC 18004 no modo "byte", nivel de correcao de
   erro M, versoes 1 a 10. Usado na carteirinha digital do Barilife.

   Uso:  const m = QR.encode("texto");   // matriz booleana [linha][coluna]
         QR.toSVG("texto", { size: 240 });
   ========================================================================== */
(function (global) {
  'use strict';

  /* ---- Tabelas do padrao (nivel de correcao M, versoes 1..10) -------------
     Para cada versao: [codewords de EC por bloco, [ [qtd blocos, codewords de
     dados por bloco], ... ] ]                                              */
  var EC_M = {
    1:  [10, [[1, 16]]],
    2:  [16, [[1, 28]]],
    3:  [26, [[1, 44]]],
    4:  [18, [[2, 32]]],
    5:  [24, [[2, 43]]],
    6:  [16, [[4, 27]]],
    7:  [18, [[4, 31]]],
    8:  [22, [[2, 38], [2, 39]]],
    9:  [22, [[3, 36], [2, 37]]],
    10: [26, [[4, 43], [1, 44]]]
  };

  /* Centros dos padroes de alinhamento por versao */
  var ALIGN = {
    1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30],
    6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50]
  };

  /* Bits restantes (remainder bits) por versao */
  var REMAINDER = { 1: 0, 2: 7, 3: 7, 4: 7, 5: 7, 6: 7, 7: 0, 8: 0, 9: 0, 10: 0 };

  /* ---- Aritmetica em GF(256), polinomio primitivo 0x11D ------------------ */
  var EXP = new Uint8Array(512), LOG = new Uint8Array(256);
  (function initGF() {
    var x = 1;
    for (var i = 0; i < 255; i++) {
      EXP[i] = x;
      LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11D;
    }
    for (var j = 255; j < 512; j++) EXP[j] = EXP[j - 255];
  })();

  function gfMul(a, b) {
    if (a === 0 || b === 0) return 0;
    return EXP[LOG[a] + LOG[b]];
  }

  /* Polinomio gerador de Reed-Solomon com `deg` termos */
  function rsGenerator(deg) {
    var poly = [1];
    for (var i = 0; i < deg; i++) {
      var next = new Array(poly.length + 1).fill(0);
      for (var j = 0; j < poly.length; j++) {
        next[j] ^= poly[j];
        next[j + 1] ^= gfMul(poly[j], EXP[i]);
      }
      poly = next;
    }
    return poly;
  }

  /* Codewords de correcao de erro para um bloco de dados */
  function rsEncode(data, ecLen) {
    var gen = rsGenerator(ecLen);
    var res = new Array(ecLen).fill(0);
    for (var i = 0; i < data.length; i++) {
      var factor = data[i] ^ res[0];
      res.shift();
      res.push(0);
      for (var j = 0; j < ecLen; j++) res[j] ^= gfMul(gen[j + 1], factor);
    }
    return res;
  }

  /* ---- Codificacao dos dados -------------------------------------------- */
  function utf8Bytes(str) {
    var out = [], i, c;
    for (i = 0; i < str.length; i++) {
      c = str.charCodeAt(i);
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xC0 | (c >> 6), 0x80 | (c & 0x3F));
      else if (c < 0xD800 || c >= 0xE000) out.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F));
      else {
        c = 0x10000 + (((c & 0x3FF) << 10) | (str.charCodeAt(++i) & 0x3FF));
        out.push(0xF0 | (c >> 18), 0x80 | ((c >> 12) & 0x3F), 0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F));
      }
    }
    return out;
  }

  function dataCapacity(version) {
    var spec = EC_M[version], total = 0;
    spec[1].forEach(function (g) { total += g[0] * g[1]; });
    return total;
  }

  function pickVersion(byteLen) {
    for (var v = 1; v <= 10; v++) {
      var countBits = v < 10 ? 8 : 16;
      var needed = Math.ceil((4 + countBits + byteLen * 8) / 8);
      if (needed <= dataCapacity(v)) return v;
    }
    throw new Error('QR: conteudo longo demais (max. versao 10).');
  }

  function buildCodewords(bytes, version) {
    var bits = [];
    function push(value, len) {
      for (var i = len - 1; i >= 0; i--) bits.push((value >> i) & 1);
    }
    push(0b0100, 4);                                  // modo byte
    push(bytes.length, version < 10 ? 8 : 16);        // contador de caracteres
    bytes.forEach(function (b) { push(b, 8); });

    var capacityBits = dataCapacity(version) * 8;
    for (var t = 0; t < 4 && bits.length < capacityBits; t++) bits.push(0);   // terminador
    while (bits.length % 8 !== 0) bits.push(0);                               // alinha em byte

    var cw = [];
    for (var i = 0; i < bits.length; i += 8) {
      var b = 0;
      for (var j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
      cw.push(b);
    }
    var pads = [0xEC, 0x11], p = 0;
    while (cw.length < dataCapacity(version)) cw.push(pads[p++ % 2]);         // preenchimento
    return cw;
  }

  /* Divide em blocos, calcula EC e intercala na ordem final */
  function interleave(codewords, version) {
    var spec = EC_M[version], ecLen = spec[0];
    var dataBlocks = [], ecBlocks = [], offset = 0;

    spec[1].forEach(function (group) {
      for (var b = 0; b < group[0]; b++) {
        var block = codewords.slice(offset, offset + group[1]);
        offset += group[1];
        dataBlocks.push(block);
        ecBlocks.push(rsEncode(block, ecLen));
      }
    });

    var out = [], i, k;
    var maxData = Math.max.apply(null, dataBlocks.map(function (b) { return b.length; }));
    for (i = 0; i < maxData; i++) {
      for (k = 0; k < dataBlocks.length; k++) {
        if (i < dataBlocks[k].length) out.push(dataBlocks[k][i]);
      }
    }
    for (i = 0; i < ecLen; i++) {
      for (k = 0; k < ecBlocks.length; k++) out.push(ecBlocks[k][i]);
    }
    return out;
  }

  /* ---- Montagem da matriz ------------------------------------------------ */
  function newMatrix(size) {
    var m = [];
    for (var i = 0; i < size; i++) m.push(new Array(size).fill(null));
    return m;
  }

  function placeFinder(m, row, col) {
    for (var r = -1; r <= 7; r++) {
      for (var c = -1; c <= 7; c++) {
        var rr = row + r, cc = col + c;
        if (rr < 0 || cc < 0 || rr >= m.length || cc >= m.length) continue;
        var on = (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
                 (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
                 (r >= 2 && r <= 4 && c >= 2 && c <= 4);
        m[rr][cc] = on;
      }
    }
  }

  function placeAlignment(m, version) {
    var centers = ALIGN[version], size = m.length;
    for (var a = 0; a < centers.length; a++) {
      for (var b = 0; b < centers.length; b++) {
        var row = centers[a], col = centers[b];
        // pula os cantos ocupados pelos localizadores
        if ((row <= 8 && col <= 8) ||
            (row <= 8 && col >= size - 9) ||
            (row >= size - 9 && col <= 8)) continue;
        for (var r = -2; r <= 2; r++) {
          for (var c = -2; c <= 2; c++) {
            m[row + r][col + c] = Math.max(Math.abs(r), Math.abs(c)) !== 1;
          }
        }
      }
    }
  }

  function placeTiming(m) {
    for (var i = 8; i < m.length - 8; i++) {
      var on = i % 2 === 0;
      if (m[6][i] === null) m[6][i] = on;
      if (m[i][6] === null) m[i][6] = on;
    }
  }

  function reserveFormat(m) {
    var size = m.length, i;
    for (i = 0; i <= 8; i++) {
      if (m[8][i] === null) m[8][i] = false;
      if (m[i][8] === null) m[i][8] = false;
    }
    for (i = 0; i < 8; i++) {
      if (m[8][size - 1 - i] === null) m[8][size - 1 - i] = false;
      if (m[size - 1 - i][8] === null) m[size - 1 - i][8] = false;
    }
    m[size - 8][8] = true;   // modulo escuro fixo
  }

  function reserveVersion(m, version) {
    if (version < 7) return;
    var size = m.length;
    for (var i = 0; i < 18; i++) {
      var r = Math.floor(i / 3), c = i % 3;
      m[size - 11 + c][r] = false;
      m[r][size - 11 + c] = false;
    }
  }

  function placeData(m, codewords, version) {
    var size = m.length, bitIndex = 0;
    var totalBits = codewords.length * 8 + REMAINDER[version];

    function nextBit() {
      if (bitIndex >= codewords.length * 8) { bitIndex++; return false; }
      var bit = (codewords[bitIndex >> 3] >> (7 - (bitIndex & 7))) & 1;
      bitIndex++;
      return bit === 1;
    }

    var upward = true;
    for (var col = size - 1; col > 0; col -= 2) {
      if (col === 6) col--;                                  // coluna do timing
      for (var i = 0; i < size; i++) {
        var row = upward ? size - 1 - i : i;
        for (var k = 0; k < 2; k++) {
          var c = col - k;
          if (m[row][c] === null && bitIndex < totalBits) m[row][c] = nextBit();
        }
      }
      upward = !upward;
    }
  }

  var MASKS = [
    function (i, j) { return (i + j) % 2 === 0; },
    function (i) { return i % 2 === 0; },
    function (i, j) { return j % 3 === 0; },
    function (i, j) { return (i + j) % 3 === 0; },
    function (i, j) { return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0; },
    function (i, j) { return ((i * j) % 2) + ((i * j) % 3) === 0; },
    function (i, j) { return (((i * j) % 2) + ((i * j) % 3)) % 2 === 0; },
    function (i, j) { return (((i + j) % 2) + ((i * j) % 3)) % 2 === 0; }
  ];

  /* Modulos de funcao (localizadores, timing, formato...) nao recebem mascara */
  function functionMap(version, size) {
    var f = newMatrix(size);
    for (var i = 0; i < size; i++) for (var j = 0; j < size; j++) f[i][j] = false;
    var mark = function (r, c) { if (r >= 0 && c >= 0 && r < size && c < size) f[r][c] = true; };
    var r, c;
    [[0, 0], [0, size - 7], [size - 7, 0]].forEach(function (p) {
      for (r = -1; r <= 7; r++) for (c = -1; c <= 7; c++) mark(p[0] + r, p[1] + c);
    });
    for (var i2 = 0; i2 < size; i2++) { mark(6, i2); mark(i2, 6); }
    for (var a = 0; a < ALIGN[version].length; a++) {
      for (var b = 0; b < ALIGN[version].length; b++) {
        var row = ALIGN[version][a], col = ALIGN[version][b];
        if ((row <= 8 && col <= 8) || (row <= 8 && col >= size - 9) || (row >= size - 9 && col <= 8)) continue;
        for (r = -2; r <= 2; r++) for (c = -2; c <= 2; c++) mark(row + r, col + c);
      }
    }
    for (var k = 0; k <= 8; k++) { mark(8, k); mark(k, 8); }
    for (var k2 = 0; k2 < 8; k2++) { mark(8, size - 1 - k2); mark(size - 1 - k2, 8); }
    if (version >= 7) {
      for (var v = 0; v < 18; v++) {
        var rr = Math.floor(v / 3), cc = v % 3;
        mark(size - 11 + cc, rr);
        mark(rr, size - 11 + cc);
      }
    }
    return f;
  }

  function applyMask(matrix, fnMap, maskId) {
    var size = matrix.length, out = [];
    for (var i = 0; i < size; i++) {
      out.push([]);
      for (var j = 0; j < size; j++) {
        out[i][j] = fnMap[i][j] ? matrix[i][j] : (matrix[i][j] !== MASKS[maskId](i, j));
      }
    }
    return out;
  }

  /* Regras de penalidade (secao 8.8.2 do padrao) para escolher a mascara */
  function penalty(m) {
    var size = m.length, score = 0, i, j, run, last, dark = 0;

    for (i = 0; i < size; i++) {                       // regra 1: sequencias
      for (var dir = 0; dir < 2; dir++) {
        run = 1; last = dir === 0 ? m[i][0] : m[0][i];
        for (j = 1; j < size; j++) {
          var cur = dir === 0 ? m[i][j] : m[j][i];
          if (cur === last) { run++; }
          else { if (run >= 5) score += 3 + (run - 5); run = 1; last = cur; }
        }
        if (run >= 5) score += 3 + (run - 5);
      }
    }

    for (i = 0; i < size - 1; i++) {                   // regra 2: blocos 2x2
      for (j = 0; j < size - 1; j++) {
        var v = m[i][j];
        if (v === m[i][j + 1] && v === m[i + 1][j] && v === m[i + 1][j + 1]) score += 3;
      }
    }

    var p1 = [true, false, true, true, true, false, true, false, false, false, false];
    var p2 = [false, false, false, false, true, false, true, true, true, false, true];
    function matches(get, start, pat) {
      for (var k = 0; k < 11; k++) if (get(start + k) !== pat[k]) return false;
      return true;
    }
    for (i = 0; i < size; i++) {                       // regra 3: padrao 1:1:3:1:1
      for (j = 0; j <= size - 11; j++) {
        var rowGet = (function (r) { return function (x) { return m[r][x]; }; })(i);
        var colGet = (function (c) { return function (x) { return m[x][c]; }; })(i);
        if (matches(rowGet, j, p1) || matches(rowGet, j, p2)) score += 40;
        if (matches(colGet, j, p1) || matches(colGet, j, p2)) score += 40;
      }
    }

    for (i = 0; i < size; i++) for (j = 0; j < size; j++) if (m[i][j]) dark++;   // regra 4
    var pct = (dark * 100) / (size * size);
    score += Math.floor(Math.abs(pct - 50) / 5) * 10;
    return score;
  }

  function placeFormatInfo(m, maskId) {
    var size = m.length;
    var data = (0b00 << 3) | maskId;                   // 00 = nivel M
    var rem = data;
    for (var i = 0; i < 10; i++) rem = (rem << 1) ^ (((rem >> 9) & 1) * 0x537);
    var bits = ((data << 10) | rem) ^ 0x5412;

    function bitAt(k) { return ((bits >> k) & 1) === 1; }

    // Copia 1: em volta do localizador superior esquerdo
    for (var k = 0; k <= 5; k++) m[8][k] = bitAt(14 - k);
    m[8][7] = bitAt(8);
    m[8][8] = bitAt(7);
    m[7][8] = bitAt(6);
    for (var r = 0; r <= 5; r++) m[r][8] = bitAt(r);

    // Copia 2: abaixo do localizador inferior esquerdo e a direita do superior direito
    for (var k2 = 0; k2 <= 6; k2++) m[size - 1 - k2][8] = bitAt(14 - k2);
    for (var k3 = 0; k3 <= 7; k3++) m[8][size - 1 - k3] = bitAt(k3);
    m[size - 8][8] = true;
  }

  function placeVersionInfo(m, version) {
    if (version < 7) return;
    var size = m.length, rem = version;
    for (var i = 0; i < 12; i++) rem = (rem << 1) ^ (((rem >> 11) & 1) * 0x1F25);
    var bits = (version << 12) | rem;
    for (var k = 0; k < 18; k++) {
      var on = ((bits >> k) & 1) === 1;
      var r = Math.floor(k / 3), c = k % 3;
      m[size - 11 + c][r] = on;
      m[r][size - 11 + c] = on;
    }
  }

  /* ---- API publica ------------------------------------------------------- */
  function encode(text, opts) {
    opts = opts || {};
    var bytes = utf8Bytes(String(text));
    var version = opts.version || pickVersion(bytes.length);
    var size = version * 4 + 17;

    var m = newMatrix(size);
    placeFinder(m, 0, 0);
    placeFinder(m, 0, size - 7);
    placeFinder(m, size - 7, 0);
    placeAlignment(m, version);
    placeTiming(m);
    reserveFormat(m);
    reserveVersion(m, version);

    var codewords = interleave(buildCodewords(bytes, version), version);
    placeData(m, codewords, version);
    for (var i = 0; i < size; i++) for (var j = 0; j < size; j++) if (m[i][j] === null) m[i][j] = false;

    var fnMap = functionMap(version, size);
    var best = null, bestScore = Infinity, bestMask = 0;
    var candidates = (opts.mask === undefined || opts.mask === null) ? [0, 1, 2, 3, 4, 5, 6, 7] : [opts.mask];

    candidates.forEach(function (mask) {
      var cand = applyMask(m, fnMap, mask);
      placeFormatInfo(cand, mask);
      placeVersionInfo(cand, version);
      var s = penalty(cand);
      if (s < bestScore) { bestScore = s; best = cand; bestMask = mask; }
    });

    best.version = version;
    best.mask = bestMask;
    return best;
  }

  /* Gera o QR como SVG pronto para injetar no HTML */
  function toSVG(text, opts) {
    opts = opts || {};
    var m = encode(text, opts);
    var quiet = opts.quiet === undefined ? 2 : opts.quiet;
    var n = m.length + quiet * 2;
    var dark = opts.dark || '#0B1F17';
    var light = opts.light || '#FFFFFF';
    var path = '';

    for (var i = 0; i < m.length; i++) {
      for (var j = 0; j < m.length; j++) {
        if (m[i][j]) path += 'M' + (j + quiet) + ' ' + (i + quiet) + 'h1v1h-1z';
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + n + ' ' + n + '" ' +
      'width="' + (opts.size || 200) + '" height="' + (opts.size || 200) + '" ' +
      'shape-rendering="crispEdges" role="img" aria-label="QR Code da carteirinha">' +
      '<rect width="' + n + '" height="' + n + '" fill="' + light + '"/>' +
      '<path d="' + path + '" fill="' + dark + '"/></svg>';
  }

  global.QR = { encode: encode, toSVG: toSVG };
})(typeof window !== 'undefined' ? window : globalThis);

if (typeof module !== 'undefined' && module.exports) module.exports = (typeof window !== 'undefined' ? window : globalThis).QR;
