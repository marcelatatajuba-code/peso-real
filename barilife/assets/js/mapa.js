/* ============================================================================
   mapa.js — Mapa vetorial desenhado em SVG, sem serviço de tiles.

   O aplicativo real usa um mapa nativo. Como esta réplica não pode depender de
   rede (precisa funcionar offline e sem CDN), a malha viária é gerada aqui de
   forma determinística — mesmo desenho a cada abertura — e renderizada em SVG,
   com deslocamento por arraste, zoom, marcadores e localização do usuário.
   ========================================================================== */
window.Mapa = (function () {
  'use strict';

  var UNI = 1600;                     /* lado do mapa em unidades internas */
  var CENTRO = { x: UNI / 2, y: UNI / 2 };

  var COR = {
    quadra:  '#F1EFEE',
    via:     '#FFFFFF',
    contorno:'#E2E0DE',
    arterial:'#FFFFFF',
    rodovia: '#FBEFC8',
    parque:  '#DCEBD4',
    agua:    '#CFE3EF',
    rotulo:  '#7A7F85',
    bairro:  '#6E747A'
  };

  /* gerador pseudoaleatório com semente fixa: o mapa nunca muda */
  function semente(s) {
    return function () { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  }

  var BAIRROS = [
    { nome: 'PINHEIROS',      x: 430,  y: 470 },
    { nome: 'VILA MADALENA',  x: 340,  y: 250 },
    { nome: 'JARDIM PAULISTA',x: 1010, y: 560 },
    { nome: 'PERDIZES',       x: 620,  y: 200 },
    { nome: 'CONSOLAÇÃO',     x: 980,  y: 330 },
    { nome: 'VILA MARIANA',   x: 900,  y: 1120 },
    { nome: 'ITAIM BIBI',     x: 1180, y: 900 },
    { nome: 'MOEMA',          x: 800,  y: 1330 },
    { nome: 'HIGIENÓPOLIS',   x: 1240, y: 260 }
  ];

  var ARTERIAIS = [
    { nome: 'Av. Brigadeiro Faria Lima', d: 'M120 1180 C 420 1000, 700 760, 1180 420' },
    { nome: 'Av. Rebouças',              d: 'M300 1440 C 560 1080, 820 700, 1080 260' },
    { nome: 'Av. Paulista',              d: 'M760 1500 C 900 1120, 1060 780, 1360 480' },
    { nome: 'Av. Sumaré',                d: 'M60 620 C 380 540, 760 500, 1540 460' },
    { nome: 'R. Teodoro Sampaio',        d: 'M80 300 C 420 360, 900 420, 1520 700' },
    { nome: 'Av. Dr. Arnaldo',           d: 'M180 60 C 460 300, 700 620, 900 1540' }
  ];

  var RODOVIA = { nome: 'SP-015', d: 'M0 980 C 300 940, 700 900, 1600 840' };

  var PARQUES = [
    { nome: 'Parque Villa-Lobos', d: 'M180 760 q 60 -80 170 -60 q 110 20 120 110 q 10 90 -90 120 q -110 30 -170 -30 q -60 -60 -30 -140 Z' },
    { nome: 'Praça Panamericana', d: 'M1140 1080 q 70 -50 140 0 q 60 50 20 120 q -50 70 -130 40 q -80 -30 -60 -110 Z' },
    { nome: 'Parque do Povo',     d: 'M620 1280 q 90 -60 180 -10 q 80 50 40 130 q -50 80 -150 60 q -100 -30 -90 -110 Z' }
  ];

  var RIO = 'M0 1320 C 320 1260, 520 1360, 820 1300 C 1120 1240, 1340 1330, 1600 1280';

  /* malha secundária: ruas curtas com leve irregularidade */
  var RUAS = (function () {
    var r = semente(20191128), lista = [], i, j;
    for (i = 60; i < UNI; i += 78) {
      var desl = (r() - 0.5) * 34;
      lista.push('M' + (i + desl).toFixed(0) + ' 0 L' + (i - desl).toFixed(0) + ' ' + UNI);
    }
    for (j = 60; j < UNI; j += 86) {
      var d2 = (r() - 0.5) * 40;
      lista.push('M0 ' + (j + d2).toFixed(0) + ' L' + UNI + ' ' + (j - d2).toFixed(0));
    }
    for (i = 0; i < 26; i++) {          /* diagonais curtas, para quebrar a grade */
      var x = r() * UNI, y = r() * UNI, L = 120 + r() * 220, a = r() * Math.PI;
      lista.push('M' + x.toFixed(0) + ' ' + y.toFixed(0) +
                 ' L' + (x + Math.cos(a) * L).toFixed(0) + ' ' + (y + Math.sin(a) * L).toFixed(0));
    }
    return lista;
  })();

  /* ---- instância do mapa ------------------------------------------------ */
  function montar(el, pontos, aoTocar) {
    var vista = { cx: CENTRO.x, cy: CENTRO.y, larg: 900 };   /* janela visível */
    var MIN = 320, MAX = 1560;

    /* posiciona cada ponto ao redor do usuário, conforme a distância */
    var marcas = pontos.map(function (p, i) {
      var ang = (i * 137.508) * Math.PI / 180;                /* ângulo áureo: espalha bem */
      var raio = Math.min(560, 60 + (p.km || 3) * 42);
      return {
        id: p.id, nome: p.nome, tipo: p.tipo,
        x: CENTRO.x + Math.cos(ang) * raio,
        y: CENTRO.y + Math.sin(ang) * raio * 0.86
      };
    });

    function limitar() {
      var m = vista.larg / 2;
      vista.larg = Math.max(MIN, Math.min(MAX, vista.larg));
      vista.cx = Math.max(m, Math.min(UNI - m, vista.cx));
      vista.cy = Math.max(m, Math.min(UNI - m, vista.cy));
    }

    function desenhar() {
      limitar();
      var w = vista.larg, x0 = vista.cx - w / 2, y0 = vista.cy - w / 2;
      var u = function (px) { return (px * w / 360).toFixed(2); };   /* px de tela → unidades */

      var svg =
        '<svg class="mapa-svg" viewBox="' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' ' + w.toFixed(1) + ' ' + w.toFixed(1) + '" ' +
        'preserveAspectRatio="xMidYMid slice" aria-label="Mapa de parceiros">' +
        '<rect x="' + x0 + '" y="' + y0 + '" width="' + w + '" height="' + w + '" fill="' + COR.quadra + '"/>' +

        /* água e parques */
        '<path d="' + RIO + '" fill="none" stroke="' + COR.agua + '" stroke-width="' + u(9) + '" stroke-linecap="round"/>' +
        PARQUES.map(function (p) { return '<path d="' + p.d + '" fill="' + COR.parque + '"/>'; }).join('') +

        /* ruas secundárias */
        '<g stroke="' + COR.contorno + '" stroke-width="' + u(3.4) + '" fill="none">' +
          RUAS.map(function (d) { return '<path d="' + d + '"/>'; }).join('') + '</g>' +
        '<g stroke="' + COR.via + '" stroke-width="' + u(2.4) + '" fill="none">' +
          RUAS.map(function (d) { return '<path d="' + d + '"/>'; }).join('') + '</g>' +

        /* rodovia */
        '<path d="' + RODOVIA.d + '" fill="none" stroke="' + COR.contorno + '" stroke-width="' + u(10) + '"/>' +
        '<path d="' + RODOVIA.d + '" fill="none" stroke="' + COR.rodovia + '" stroke-width="' + u(8) + '"/>' +

        /* arteriais */
        '<g fill="none" stroke="' + COR.contorno + '" stroke-width="' + u(8) + '" stroke-linecap="round">' +
          ARTERIAIS.map(function (a) { return '<path d="' + a.d + '"/>'; }).join('') + '</g>' +
        '<g fill="none" stroke="' + COR.arterial + '" stroke-width="' + u(6) + '" stroke-linecap="round">' +
          ARTERIAIS.map(function (a, i) { return '<path id="via' + i + '" d="' + a.d + '"/>'; }).join('') + '</g>' +

        /* nomes das vias, acompanhando a curva */
        '<g fill="' + COR.rotulo + '" font-size="' + u(7.4) + '" font-weight="600" letter-spacing="' + u(0.3) + '">' +
          ARTERIAIS.map(function (a, i) {
            return '<text dy="' + u(-2.2) + '"><textPath href="#via' + i + '" startOffset="42%">' + a.nome + '</textPath></text>';
          }).join('') + '</g>' +

        /* nomes de bairro */
        '<g fill="' + COR.bairro + '" font-size="' + u(8.6) + '" font-weight="700" text-anchor="middle" letter-spacing="' + u(0.6) + '">' +
          BAIRROS.map(function (b) { return '<text x="' + b.x + '" y="' + b.y + '">' + b.nome + '</text>'; }).join('') + '</g>' +

        /* marcadores dos parceiros */
        marcas.map(function (m) {
          var s = parseFloat(u(13));
          return '<g class="pin" data-pin="' + m.id + '" transform="translate(' + m.x.toFixed(1) + ',' + m.y.toFixed(1) + ')">' +
            '<path d="M0 0 l-' + s * 0.62 + ' -' + s * 0.95 + ' a' + s * 0.72 + ' ' + s * 0.72 + ' 0 1 1 ' + s * 1.24 + ' 0 Z" ' +
              'fill="#D9483F" stroke="#FFFFFF" stroke-width="' + u(1.4) + '"/>' +
            '<circle cx="0" cy="-' + s * 1.05 + '" r="' + s * 0.5 + '" fill="#FFFFFF"/>' +
            '<path d="M-' + s * 0.28 + ' -' + s * 1.05 + ' h' + s * 0.56 + ' M0 -' + s * 1.33 + ' v' + s * 0.56 + '" ' +
              'stroke="#D9483F" stroke-width="' + u(2.4) + '" stroke-linecap="round"/>' +
          '</g>';
        }).join('') +

        /* localização do usuário */
        '<circle cx="' + CENTRO.x + '" cy="' + CENTRO.y + '" r="' + u(17) + '" fill="#1A73E8" opacity=".14"/>' +
        '<circle cx="' + CENTRO.x + '" cy="' + CENTRO.y + '" r="' + u(7.5) + '" fill="#FFFFFF"/>' +
        '<circle cx="' + CENTRO.x + '" cy="' + CENTRO.y + '" r="' + u(5.6) + '" fill="#1A73E8"/>' +
        '</svg>';

      el.querySelector('.mapa-tela').innerHTML = svg;

      Array.prototype.forEach.call(el.querySelectorAll('[data-pin]'), function (g) {
        g.addEventListener('click', function (ev) {
          ev.stopPropagation();
          if (aoTocar) aoTocar(g.getAttribute('data-pin'));
        });
      });
    }

    /* arrastar para deslocar */
    var arrastando = false, ini = null;
    var tela = el.querySelector('.mapa-tela');

    function ponto(ev) {
      var t = ev.touches ? ev.touches[0] : ev;
      return { x: t.clientX, y: t.clientY };
    }
    function comecar(ev) {
      arrastando = true;
      ini = ponto(ev);
      ini.cx = vista.cx; ini.cy = vista.cy;
      ini.esc = vista.larg / tela.clientWidth;
    }
    function mover(ev) {
      if (!arrastando) return;
      var p = ponto(ev);
      vista.cx = ini.cx - (p.x - ini.x) * ini.esc;
      vista.cy = ini.cy - (p.y - ini.y) * ini.esc;
      desenhar();
      if (ev.cancelable) ev.preventDefault();
    }
    function parar() { arrastando = false; }

    tela.addEventListener('mousedown', comecar);
    window.addEventListener('mousemove', mover);
    window.addEventListener('mouseup', parar);
    tela.addEventListener('touchstart', comecar, { passive: true });
    tela.addEventListener('touchmove', mover, { passive: false });
    tela.addEventListener('touchend', parar);

    desenhar();

    return {
      mais:    function () { vista.larg /= 1.45; desenhar(); },
      menos:   function () { vista.larg *= 1.45; desenhar(); },
      centrar: function () { vista.cx = CENTRO.x; vista.cy = CENTRO.y; vista.larg = 900; desenhar(); },
      soltar:  function () {
        window.removeEventListener('mousemove', mover);
        window.removeEventListener('mouseup', parar);
      }
    };
  }

  return { montar: montar };
})();
