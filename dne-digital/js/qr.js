/*!
 * qr.js — Gerador de QR Code em JavaScript puro, sem dependências.
 * Modo byte (UTF-8), versões 1-40, níveis de correção L/M/Q/H,
 * seleção automática de versão e da máscara de menor penalidade.
 * Implementa a norma ISO/IEC 18004.
 *
 * Uso:  const qr = QR.encode('texto', 'M');  // -> { size, modules }
 *       QR.toSvg(qr, { scale, margin, dark, light });
 *       QR.toCanvas(qr, canvasEl, { scale, margin, dark, light });
 */
(function (global) {
  'use strict';

  var ECC_LEVELS = { L: 0, M: 1, Q: 2, H: 3 };
  // Bits do nível de correção dentro da informação de formato (L=01, M=00, Q=11, H=10)
  var ECC_FORMAT_BITS = [1, 0, 3, 2];

  // Codewords de correção por bloco, indexado por [nível][versão]
  var ECC_CODEWORDS_PER_BLOCK = [
    [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
    [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]
  ];

  // Quantidade de blocos de correção, indexado por [nível][versão]
  var NUM_ECC_BLOCKS = [
    [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
    [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
    [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
    [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81]
  ];

  var PENALTY_N1 = 3, PENALTY_N2 = 3, PENALTY_N3 = 40, PENALTY_N4 = 10;

  // ---------------------------------------------------------------- utilidades

  function utf8Bytes(str) {
    if (typeof TextEncoder !== 'undefined') return Array.from(new TextEncoder().encode(str));
    var out = [], i, c;
    for (i = 0; i < str.length; i++) {
      c = str.charCodeAt(i);
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xC0 | (c >> 6), 0x80 | (c & 0x3F));
      else out.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F));
    }
    return out;
  }

  // Total de módulos de dados (em bits) disponíveis numa versão, já descontando
  // padrões funcionais (localizadores, alinhamento, temporizadores, formato/versão).
  function numRawDataModules(ver) {
    var result = (16 * ver + 128) * ver + 64;
    if (ver >= 2) {
      var numAlign = Math.floor(ver / 7) + 2;
      result -= (25 * numAlign - 10) * numAlign - 55;
      if (ver >= 7) result -= 36;
    }
    return result;
  }

  function numDataCodewords(ver, ecl) {
    return Math.floor(numRawDataModules(ver) / 8)
      - ECC_CODEWORDS_PER_BLOCK[ecl][ver] * NUM_ECC_BLOCKS[ecl][ver];
  }

  function charCountBits(ver) {
    return ver <= 9 ? 8 : 16; // modo byte
  }

  function alignmentPatternPositions(ver) {
    if (ver === 1) return [];
    var numAlign = Math.floor(ver / 7) + 2;
    var step = (ver === 32) ? 26
      : Math.ceil((ver * 4 + 4) / (numAlign * 2 - 2)) * 2;
    var result = [6];
    for (var pos = ver * 4 + 10; result.length < numAlign; pos -= step) result.splice(1, 0, pos);
    return result;
  }

  // ------------------------------------------------------ Reed-Solomon (GF 256)

  function gfMultiply(x, y) {
    var z = 0;
    for (var i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11D);
      z ^= ((y >>> i) & 1) * x;
    }
    return z & 0xFF;
  }

  function rsDivisor(degree) {
    var result = new Array(degree).fill(0);
    result[degree - 1] = 1;
    var root = 1;
    for (var i = 0; i < degree; i++) {
      for (var j = 0; j < degree; j++) {
        result[j] = gfMultiply(result[j], root);
        if (j + 1 < degree) result[j] ^= result[j + 1];
      }
      root = gfMultiply(root, 0x02);
    }
    return result;
  }

  function rsRemainder(data, divisor) {
    var result = new Array(divisor.length).fill(0);
    for (var i = 0; i < data.length; i++) {
      var factor = data[i] ^ result.shift();
      result.push(0);
      for (var j = 0; j < divisor.length; j++) result[j] ^= gfMultiply(divisor[j], factor);
    }
    return result;
  }

  // Divide os dados em blocos, calcula a correção de cada um e intercala tudo.
  function addEccAndInterleave(data, ver, ecl) {
    var numBlocks = NUM_ECC_BLOCKS[ecl][ver];
    var blockEccLen = ECC_CODEWORDS_PER_BLOCK[ecl][ver];
    var rawCodewords = Math.floor(numRawDataModules(ver) / 8);
    var numShortBlocks = numBlocks - rawCodewords % numBlocks;
    var shortBlockLen = Math.floor(rawCodewords / numBlocks);

    var blocks = [], divisor = rsDivisor(blockEccLen), k = 0, i, j;
    for (i = 0; i < numBlocks; i++) {
      var len = shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1);
      var dat = data.slice(k, k + len);
      k += len;
      var ecc = rsRemainder(dat, divisor);
      // blocos curtos recebem um byte fictício para que todos tenham o mesmo
      // comprimento; ele é descartado na intercalação abaixo
      if (i < numShortBlocks) dat.push(0);
      blocks.push(dat.concat(ecc));
    }

    var result = [];
    for (i = 0; i < blocks[0].length; i++) {
      for (j = 0; j < blocks.length; j++) {
        // pula o byte de dados inexistente dos blocos curtos
        if (i !== shortBlockLen - blockEccLen || j >= numShortBlocks) result.push(blocks[j][i]);
      }
    }
    return result;
  }

  // ------------------------------------------------------------------ desenho

  function QrCode(ver, ecl, dataCodewords, mask) {
    this.version = ver;
    this.ecc = ecl;
    this.size = ver * 4 + 17;
    this.modules = [];
    this.isFunction = [];
    for (var i = 0; i < this.size; i++) {
      this.modules.push(new Array(this.size).fill(false));
      this.isFunction.push(new Array(this.size).fill(false));
    }
    this.drawFunctionPatterns();
    this.drawCodewords(addEccAndInterleave(dataCodewords, ver, ecl));

    if (mask === -1) { // escolhe a máscara de menor penalidade
      var minPenalty = Infinity;
      for (var m = 0; m < 8; m++) {
        this.applyMask(m);
        this.drawFormatBits(m);
        var p = this.penaltyScore();
        if (p < minPenalty) { mask = m; minPenalty = p; }
        this.applyMask(m); // desfaz (XOR é involutivo)
      }
    }
    this.mask = mask;
    this.applyMask(mask);
    this.drawFormatBits(mask);
    this.isFunction = null;
  }

  QrCode.prototype.setFunctionModule = function (x, y, isDark) {
    this.modules[y][x] = isDark;
    this.isFunction[y][x] = true;
  };

  QrCode.prototype.drawFinderPattern = function (x, y) {
    for (var dy = -4; dy <= 4; dy++) {
      for (var dx = -4; dx <= 4; dx++) {
        var dist = Math.max(Math.abs(dx), Math.abs(dy));
        var xx = x + dx, yy = y + dy;
        if (xx >= 0 && xx < this.size && yy >= 0 && yy < this.size) {
          this.setFunctionModule(xx, yy, dist !== 2 && dist !== 4);
        }
      }
    }
  };

  QrCode.prototype.drawAlignmentPattern = function (x, y) {
    for (var dy = -2; dy <= 2; dy++) {
      for (var dx = -2; dx <= 2; dx++) {
        this.setFunctionModule(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }
  };

  QrCode.prototype.drawFunctionPatterns = function () {
    var i, j, size = this.size;
    // temporizadores
    for (i = 0; i < size; i++) {
      this.setFunctionModule(6, i, i % 2 === 0);
      this.setFunctionModule(i, 6, i % 2 === 0);
    }
    // localizadores + separadores
    this.drawFinderPattern(3, 3);
    this.drawFinderPattern(size - 4, 3);
    this.drawFinderPattern(3, size - 4);
    // padrões de alinhamento
    var pos = alignmentPatternPositions(this.version), n = pos.length;
    for (i = 0; i < n; i++) {
      for (j = 0; j < n; j++) {
        if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) continue;
        this.drawAlignmentPattern(pos[i], pos[j]);
      }
    }
    this.drawFormatBits(0);   // valores reais são gravados depois
    this.drawVersionBits();
  };

  QrCode.prototype.drawFormatBits = function (mask) {
    var data = (ECC_FORMAT_BITS[this.ecc] << 3) | mask;
    var rem = data;
    for (var i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    var bits = ((data << 10) | rem) ^ 0x5412;

    for (var k = 0; k <= 5; k++) this.setFunctionModule(8, k, ((bits >>> k) & 1) !== 0);
    this.setFunctionModule(8, 7, ((bits >>> 6) & 1) !== 0);
    this.setFunctionModule(8, 8, ((bits >>> 7) & 1) !== 0);
    this.setFunctionModule(7, 8, ((bits >>> 8) & 1) !== 0);
    for (k = 9; k < 15; k++) this.setFunctionModule(14 - k, 8, ((bits >>> k) & 1) !== 0);

    var size = this.size;
    for (k = 0; k < 8; k++) this.setFunctionModule(size - 1 - k, 8, ((bits >>> k) & 1) !== 0);
    for (k = 8; k < 15; k++) this.setFunctionModule(8, size - 15 + k, ((bits >>> k) & 1) !== 0);
    this.setFunctionModule(8, size - 8, true); // módulo escuro obrigatório
  };

  QrCode.prototype.drawVersionBits = function () {
    if (this.version < 7) return;
    var rem = this.version;
    for (var i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
    var bits = (this.version << 12) | rem;
    for (i = 0; i < 18; i++) {
      var bit = ((bits >>> i) & 1) !== 0;
      var a = this.size - 11 + i % 3, b = Math.floor(i / 3);
      this.setFunctionModule(a, b, bit);
      this.setFunctionModule(b, a, bit);
    }
  };

  QrCode.prototype.drawCodewords = function (data) {
    var i = 0, size = this.size;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5; // coluna 6 é temporizador
      for (var vert = 0; vert < size; vert++) {
        for (var k = 0; k < 2; k++) {
          var x = right - k;
          var upward = ((right + 1) & 2) === 0;
          var y = upward ? size - 1 - vert : vert;
          if (!this.isFunction[y][x] && i < data.length * 8) {
            this.modules[y][x] = ((data[i >>> 3] >>> (7 - (i & 7))) & 1) !== 0;
            i++;
          }
        }
      }
    }
  };

  QrCode.prototype.applyMask = function (mask) {
    for (var y = 0; y < this.size; y++) {
      for (var x = 0; x < this.size; x++) {
        if (this.isFunction[y][x]) continue;
        var invert;
        switch (mask) {
          case 0: invert = (x + y) % 2 === 0; break;
          case 1: invert = y % 2 === 0; break;
          case 2: invert = x % 3 === 0; break;
          case 3: invert = (x + y) % 3 === 0; break;
          case 4: invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
          case 5: invert = x * y % 2 + x * y % 3 === 0; break;
          case 6: invert = (x * y % 2 + x * y % 3) % 2 === 0; break;
          case 7: invert = ((x + y) % 2 + x * y % 3) % 2 === 0; break;
        }
        if (invert) this.modules[y][x] = !this.modules[y][x];
      }
    }
  };

  QrCode.prototype.penaltyScore = function () {
    var result = 0, size = this.size, x, y, dark = 0;
    var FINDER = [true, false, true, true, true, false, true, false, false, false, false];

    function runsIn(line) {
      var score = 0, runLen = 1, i;
      for (i = 1; i < line.length; i++) {
        if (line[i] === line[i - 1]) {
          runLen++;
          if (runLen === 5) score += PENALTY_N1;
          else if (runLen > 5) score++;
        } else runLen = 1;
      }
      // regra 3: sequência tipo localizador
      for (i = 0; i + 11 <= line.length; i++) {
        var fwd = true, bwd = true;
        for (var j = 0; j < 11; j++) {
          if (line[i + j] !== FINDER[j]) fwd = false;
          if (line[i + j] !== FINDER[10 - j]) bwd = false;
        }
        if (fwd || bwd) score += PENALTY_N3;
      }
      return score;
    }

    for (y = 0; y < size; y++) result += runsIn(this.modules[y]);
    for (x = 0; x < size; x++) {
      var col = [];
      for (y = 0; y < size; y++) col.push(this.modules[y][x]);
      result += runsIn(col);
    }
    // regra 2: blocos 2x2 de mesma cor
    for (y = 0; y < size - 1; y++) {
      for (x = 0; x < size - 1; x++) {
        var c = this.modules[y][x];
        if (c === this.modules[y][x + 1] && c === this.modules[y + 1][x] && c === this.modules[y + 1][x + 1]) {
          result += PENALTY_N2;
        }
      }
    }
    // regra 4: desequilíbrio entre claros e escuros
    for (y = 0; y < size; y++) for (x = 0; x < size; x++) if (this.modules[y][x]) dark++;
    var total = size * size;
    var k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
    return result + k * PENALTY_N4;
  };

  // ---------------------------------------------------------------- API pública

  function encode(text, eccName, minVersion) {
    var ecl = ECC_LEVELS[(eccName || 'M').toUpperCase()];
    if (ecl === undefined) throw new Error('Nível de correção inválido: ' + eccName);
    var bytes = utf8Bytes(String(text));
    var ver, dataCapacityBits, usedBits;

    for (ver = minVersion || 1; ver <= 40; ver++) {
      dataCapacityBits = numDataCodewords(ver, ecl) * 8;
      usedBits = 4 + charCountBits(ver) + bytes.length * 8;
      if (usedBits <= dataCapacityBits) break;
    }
    if (ver > 40) throw new Error('Conteúdo grande demais para um QR Code');

    // monta o fluxo de bits
    var bits = [];
    function append(value, len) {
      for (var i = len - 1; i >= 0; i--) bits.push((value >>> i) & 1);
    }
    append(0x4, 4);                       // indicador do modo byte
    append(bytes.length, charCountBits(ver));
    for (var i = 0; i < bytes.length; i++) append(bytes[i], 8);

    // terminador + preenchimento até fechar o último byte
    append(0, Math.min(4, dataCapacityBits - bits.length));
    append(0, (8 - bits.length % 8) % 8);

    // bytes de preenchimento alternados definidos pela norma
    for (var pad = 0xEC; bits.length < dataCapacityBits; pad ^= 0xEC ^ 0x11) append(pad, 8);

    var codewords = [];
    for (i = 0; i < bits.length; i += 8) {
      var b = 0;
      for (var j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
      codewords.push(b);
    }
    return new QrCode(ver, ecl, codewords, -1);
  }

  function toSvg(qr, opts) {
    opts = opts || {};
    var margin = opts.margin === undefined ? 2 : opts.margin;
    var dark = opts.dark || '#000000';
    var light = opts.light || '#ffffff';
    var dim = qr.size + margin * 2;
    var path = [];
    for (var y = 0; y < qr.size; y++) {
      for (var x = 0; x < qr.size; x++) {
        if (qr.modules[y][x]) path.push('M' + (x + margin) + ',' + (y + margin) + 'h1v1h-1z');
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + dim + ' ' + dim + '" shape-rendering="crispEdges">'
      + (light === 'transparent' ? '' : '<rect width="100%" height="100%" fill="' + light + '"/>')
      + '<path fill="' + dark + '" d="' + path.join('') + '"/></svg>';
  }

  function toCanvas(qr, canvas, opts) {
    opts = opts || {};
    var margin = opts.margin === undefined ? 2 : opts.margin;
    var scale = opts.scale || 6;
    var dim = (qr.size + margin * 2) * scale;
    canvas.width = dim;
    canvas.height = dim;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = opts.light || '#ffffff';
    ctx.fillRect(0, 0, dim, dim);
    ctx.fillStyle = opts.dark || '#000000';
    for (var y = 0; y < qr.size; y++) {
      for (var x = 0; x < qr.size; x++) {
        if (qr.modules[y][x]) ctx.fillRect((x + margin) * scale, (y + margin) * scale, scale, scale);
      }
    }
    return canvas;
  }

  var QR = { encode: encode, toSvg: toSvg, toCanvas: toCanvas };
  if (typeof module !== 'undefined' && module.exports) module.exports = QR;
  global.QR = QR;
})(typeof window !== 'undefined' ? window : globalThis);
