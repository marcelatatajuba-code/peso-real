/* ============================================================================
   app.js — Réplica acadêmica do Barilife
   Store · Utilitários · Navegação · Telas · Boot
   ========================================================================== */
(function () {
  'use strict';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || document).querySelectorAll(s)); };

  /* ==========================================================================
     Store — tudo em localStorage, nada sai do aparelho
     ========================================================================== */
  var CHAVE = 'barilife.v2';

  var Store = {
    e: null,
    padrao: function () {
      return {
        perfil: null,
        favoritos: [],
        lembretes: JSON.parse(JSON.stringify(DB.lembretesPadrao)),
        agenda: JSON.parse(JSON.stringify(DB.agendaPadrao)),
        agua: { data: hoje(), ml: 0, meta: 1800, copo: 200 },
        pesos: [],
        votos: {},
        chat: JSON.parse(JSON.stringify(DB.chat)),
        notif: { agenda: true, dieta: true, novidades: true, rede: false },
        bannerInstalar: true
      };
    },
    carregar: function () {
      try {
        var b = localStorage.getItem(CHAVE);
        this.e = b ? JSON.parse(b) : this.padrao();
      } catch (x) { this.e = this.padrao(); }
      var p = this.padrao();
      for (var k in p) if (this.e[k] === undefined) this.e[k] = p[k];
      if (!this.e.agua || this.e.agua.data !== hoje()) {
        this.e.agua = Object.assign({ meta: 1800, copo: 200 }, this.e.agua, { data: hoje(), ml: 0 });
      }
      return this.e;
    },
    salvar: function () {
      try { localStorage.setItem(CHAVE, JSON.stringify(this.e)); }
      catch (x) { toast('Não foi possível salvar neste navegador.'); }
    },
    limpar: function () {
      try { localStorage.removeItem(CHAVE); } catch (x) {}
      this.e = this.padrao();
    }
  };

  /* ==========================================================================
     Utilitários
     ========================================================================== */
  var MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  var MESES_L = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
                 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

  function hoje() { return new Date().toISOString().slice(0, 10); }

  function dataBR(iso) {
    if (!iso) return '—';
    var p = String(iso).slice(0, 10).split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso;
  }

  function dataExtenso(iso) {
    var p = String(iso || '').slice(0, 10).split('-');
    if (p.length !== 3) return iso || '—';
    return parseInt(p[2], 10) + ' de ' + MESES_L[parseInt(p[1], 10) - 1] + ' de ' + p[0];
  }

  /* "11/2019" -> quanto tempo faz */
  function tempoDesdeMes(mesAno) {
    var p = String(mesAno || '').split('/');
    if (p.length !== 2) return '—';
    var d = new Date(parseInt(p[1], 10), parseInt(p[0], 10) - 1, 1);
    var meses = (new Date().getFullYear() - d.getFullYear()) * 12 + (new Date().getMonth() - d.getMonth());
    if (meses < 1) return 'menos de 1 mês';
    if (meses < 12) return meses + (meses === 1 ? ' mês' : ' meses');
    var a = Math.floor(meses / 12), m = meses % 12;
    var t = a + (a === 1 ? ' ano' : ' anos');
    return m ? t + ' e ' + m + (m === 1 ? ' mês' : ' meses') : t;
  }

  function iniciais(nome) {
    var p = String(nome || '?').trim().split(/\s+/);
    return ((p[0] || '')[0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
  }

  function primeiroNome(nome) { return String(nome || '').trim().split(/\s+/)[0] || ''; }

  function esc(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function semAcento(s) {
    return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function ehIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function instalado() {
    return window.navigator.standalone === true ||
           (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  }

  /* ---- máscaras e validações ---- */
  function soDigitos(v) { return String(v || '').replace(/\D/g, ''); }

  function mascaraCPF(v) {
    return soDigitos(v).slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  function mascaraTelefone(v) {
    var d = soDigitos(v).slice(0, 11);
    if (d.length <= 10) return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
    return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
  }

  /* CPF conferido pelos dois dígitos verificadores */
  function cpfValido(v) {
    var d = soDigitos(v);
    if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
    for (var t = 9; t < 11; t++) {
      var soma = 0;
      for (var i = 0; i < t; i++) soma += parseInt(d[i], 10) * (t + 1 - i);
      if ((soma * 10) % 11 % 10 !== parseInt(d[t], 10)) return false;
    }
    return true;
  }

  function idade(iso) {
    if (!iso) return null;
    var n = new Date(iso + 'T00:00:00');
    if (isNaN(n)) return null;
    var h = new Date(), a = h.getFullYear() - n.getFullYear(), m = h.getMonth() - n.getMonth();
    if (m < 0 || (m === 0 && h.getDate() < n.getDate())) a--;
    return a;
  }

  function ligarMascara(sel, fn) {
    var el = $(sel);
    if (!el) return;
    el.addEventListener('input', function () {
      var fim = el.value.length - el.selectionStart;
      el.value = fn(el.value);
      var pos = Math.max(0, el.value.length - fim);
      try { el.setSelectionRange(pos, pos); } catch (x) {}
    });
  }

  /* ==========================================================================
     UI base
     ========================================================================== */
  var tToast;
  function toast(msg) {
    var el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('on');
    clearTimeout(tToast);
    tToast = setTimeout(function () { el.classList.remove('on'); }, 2400);
  }

  /* marca o campo problemático, além de mostrar a mensagem */
  function limparErros() {
    $$('.campo.erro').forEach(function (c) { c.classList.remove('erro'); });
  }

  function erro(seletor, msg) {
    toast(msg);
    var el = $(seletor);
    if (!el) return;
    var campo = el.closest('.campo');
    if (campo) {
      campo.classList.add('erro');
      var m = campo.querySelector('.erro-msg');
      if (!m) { m = document.createElement('div'); m.className = 'erro-msg'; campo.appendChild(m); }
      m.textContent = msg;
    }
    try { el.focus({ preventScroll: true }); } catch (x) { try { el.focus(); } catch (y) {} }
    if (el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  var Folha = {
    abrir: function (html) {
      $('#folha-conteudo').innerHTML = html;
      $('#folha').classList.add('on');
      $('#folha-fundo').classList.add('on');
    },
    fechar: function () {
      $('#folha').classList.remove('on');
      $('#folha-fundo').classList.remove('on');
    }
  };

  function pilula(icone, txt) {
    return '<span class="pilula"><svg class="pic" viewBox="0 0 24 24"><use href="#' + icone + '"/></svg>' + esc(txt) + '</span>';
  }

  function avatarHTML(p, classe, estilo) {
    var cls = 'avatar' + (classe ? ' ' + classe : '');
    if (p && p.foto) return '<img class="' + cls + '" src="' + esc(p.foto) + '" alt=""' + (estilo ? ' style="' + estilo + '"' : '') + '>';
    return '<div class="' + cls + '"' + (estilo ? ' style="' + estilo + '"' : '') + '>' + esc(iniciais(p && p.nome)) + '</div>';
  }

  /* ==========================================================================
     Navegação — 5 abas e uma pilha para as telas internas
     ========================================================================== */
  var TELAS = {
    inicio:       { aba: true,  semTopo: true },
    midias:       { aba: true,  titulo: 'Mídias', acaoIcone: 'i-filtro', acaoFn: function () { alternarAbasMidia(); } },
    locais:       { aba: true,  titulo: 'Locais', acaoIcone: 'i-ajustes', acaoFn: function () { abrirFiltroLocais(); } },
    agenda:       { aba: true,  titulo: 'Agenda', acao: '+', acaoFn: function () { formAgenda(); } },
    menu:         { aba: true,  titulo: 'Menu' },
    carteirinha:  { titulo: 'Carteirinha digital' },
    dados:        { titulo: 'Meus dados' },
    documentos:   { titulo: 'Documentos enviados' },
    rede:         { titulo: 'Rede Amiga' },
    peso:         { titulo: 'Meu peso', acao: '+', acaoFn: function () { formPeso(); } },
    chat:         { titulo: 'Chat' },
    novidades:    { titulo: 'Novidades' },
    enquetes:     { titulo: 'Enquetes' },
    coesas:       { titulo: 'COESAS' },
    dieta:        { titulo: 'Alerta de dieta' },
    notificacoes: { titulo: 'Notificações e Permissões' },
    senha:        { titulo: 'Trocar senha' },
    faq:          { titulo: 'FAQ (Perguntas Frequentes)' },
    sobre:        { titulo: 'Sobre este aplicativo' }
  };

  /* renderizadores chamados ao entrar em cada tela */
  var RENDER = {};

  var Nav = {
    aba: 'inicio',
    pilha: [],

    atual: function () { return this.pilha.length ? this.pilha[this.pilha.length - 1] : this.aba; },

    ir: function (aba) { this.pilha = []; this.aba = aba; this.pintar(); },

    abrir: function (tela) { this.pilha.push(tela); this.pintar(); },

    voltar: function () { if (this.pilha.length) { this.pilha.pop(); this.pintar(); } },

    pintar: function () {
      var tela = this.atual(), cfg = TELAS[tela] || {};

      $$('.tela').forEach(function (s) { s.classList.remove('on'); });
      var alvo = $('#t-' + tela);
      if (alvo) alvo.classList.add('on');

      var topo = $('#topbar');
      topo.hidden = !!cfg.semTopo;
      topo.classList.toggle('limpa', !!cfg.limpa);
      $('#titulo').textContent = cfg.titulo || '';
      $('#btn-voltar').hidden = this.pilha.length === 0;

      var acao = $('#btn-acao');
      acao.hidden = !cfg.acao && !cfg.acaoIcone;
      acao.innerHTML = cfg.acaoIcone
        ? '<svg viewBox="0 0 24 24" style="width:26px;height:26px;fill:currentColor"><use href="#' + cfg.acaoIcone + '"/></svg>'
        : (cfg.acao || '');
      acao.onclick = cfg.acaoFn || null;

      $$('#tabbar [data-aba]').forEach(function (b) {
        b.classList.toggle('on', b.dataset.aba === Nav.aba && Nav.pilha.length === 0);
      });

      $('#btn-baricast').hidden = tela !== 'midias';

      if (RENDER[tela]) RENDER[tela]();
      pararContagem();
      if (tela === 'carteirinha') iniciarContagem();

      $('#main').scrollTop = 0;
      Folha.fechar();
    }
  };

  /* ==========================================================================
     Carteirinha digital — QR com validade de 10 minutos
     ========================================================================== */
  var VALIDADE_MS = 10 * 60 * 1000;
  var qrEmitidoEm = 0, qrToken = '', tContagem = null;

  function validada(p) { return (p.status || 'validada') === 'validada'; }

  function novoToken() {
    qrEmitidoEm = Date.now();
    var r = Math.random().toString(36).slice(2, 10).toUpperCase();
    qrToken = r + '-' + qrEmitidoEm.toString(36).toUpperCase();
  }

  function conteudoQR(p) {
    if (!qrToken) novoToken();
    return 'https://barilife.org.br/validar?cpf=' + soDigitos(p.cpf) + '&t=' + qrToken;
  }

  function restanteMs() { return Math.max(0, VALIDADE_MS - (Date.now() - qrEmitidoEm)); }

  function svgQR(p, tam) {
    try { return QR.toSVG(conteudoQR(p), { size: tam, quiet: 2, dark: '#0F2A44' }); }
    catch (x) { return '<div style="font-size:11px;color:#888;padding:8px">QR indisponível</div>'; }
  }

  function renderCarteirinha() {
    var p = Store.e.perfil, ok = validada(p);
    if (ok && restanteMs() === 0) novoToken();

    $('#cracha').innerHTML =
      '<div class="cracha"><div class="miolo">' +
        '<div class="furo"></div>' +
        '<div class="sbcbm"><img src="assets/img/sbcbm.png" alt="SBCBM — Sociedade Brasileira de Cirurgia Bariátrica e Metabólica"></div>' +
        avatarHTML(p) +
        '<div class="nome">' + esc(p.nome) + '</div>' +
        '<div class="cpf">' + esc(p.cpf || '—') + '</div>' +
        (ok ? '<div class="qr">' + svgQR(p, 186) + '</div>'
            : '<div class="qr bloq">🔒</div>') +
        (ok ? '<button class="compartilhar" id="qr-share" aria-label="Compartilhar">↗</button>' : '') +
      '</div></div>';

    if (ok) $('#qr-share').addEventListener('click', compartilhar);

    $('#pendencia').innerHTML = ok ? '' :
      '<div class="aviso-info" style="margin-top:16px"><span class="bola">i</span>' +
      '<span>Seu cadastro foi enviado para <b>' + esc(p.cirurgiao) + '</b>. No Barilife, o cirurgião confere os dados e libera a carteirinha — até lá o QR Code fica bloqueado.</span></div>' +
      '<button class="btn cheio" id="btn-liberar" style="margin-top:12px">Simular liberação pelo cirurgião</button>';

    if (!ok) {
      $('#btn-liberar').addEventListener('click', function () {
        p.status = 'validada'; p.validadaEm = hoje();
        Store.salvar(); novoToken(); Nav.pintar();
        toast('Carteirinha liberada pelo cirurgião.');
      });
    }
    pintarContagem();
  }
  RENDER.carteirinha = renderCarteirinha;

  function pintarContagem() {
    var alvo = $('#contagem');
    if (!alvo) return;
    if (!validada(Store.e.perfil)) { alvo.innerHTML = ''; return; }

    var ms = restanteMs();
    if (ms === 0) {
      alvo.className = 'contagem expirou';
      alvo.innerHTML = '<b>QR Code expirado</b><br>' +
        '<button class="btn pequeno" id="btn-renovar" style="margin-top:10px">Gerar novo código</button>';
      $('#btn-renovar').addEventListener('click', function () {
        novoToken(); renderCarteirinha(); toast('Novo código gerado.');
      });
      return;
    }
    var s = Math.ceil(ms / 1000);
    alvo.className = 'contagem';
    alvo.innerHTML = 'Este código expira em <b>' +
      String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0') + '</b>';
  }

  function iniciarContagem() {
    pararContagem();
    tContagem = setInterval(function () {
      var antes = restanteMs();
      pintarContagem();
      if (antes > 0 && restanteMs() === 0) renderCarteirinha();
    }, 1000);
  }
  function pararContagem() { if (tContagem) { clearInterval(tContagem); tContagem = null; } }

  function compartilhar() {
    var p = Store.e.perfil;
    var txt = 'Carteirinha Barilife\n' + p.nome + '\nCPF ' + p.cpf + '\n' + p.cirurgia + ' · ' + p.mesCirurgia;
    if (navigator.share) navigator.share({ title: 'Carteirinha Barilife', text: txt }).catch(function () {});
    else if (navigator.clipboard) navigator.clipboard.writeText(txt)
      .then(function () { toast('Dados copiados.'); }).catch(function () { toast('Não foi possível copiar.'); });
    else toast('Compartilhamento indisponível.');
  }

  /* ==========================================================================
     Início
     ========================================================================== */
  var ATALHOS = [
    { id: 'peso',      rot: 'Meu peso',  icone: 'i-balanca', claro: true },
    { id: 'chat',      rot: 'Chat',      icone: 'i-balao',   claro: true },
    { id: 'novidades', rot: 'Novidades', icone: 'i-jornal' },
    { id: 'rede',      rot: 'Rede Amiga', icone: 'i-estrela', pino: true },
    { id: 'locais',    rot: 'Perto de você', icone: 'i-locais', tab: true },
    { id: 'enquetes',  rot: 'Enquetes',  icone: 'i-prancheta', pino: true },
    { id: 'coesas',    rot: 'COESAS (Minha Equipe Multidisciplinar)', icone: 'i-equipe', largo: true }
  ];

  function renderInicio() {
    var p = Store.e.perfil;

    $('#resumo').innerHTML =
      '<div class="cima"><span class="rot">Carteirinha do paciente</span><span class="risco"></span></div>' +
      '<div class="meio">' + avatarHTML(p) +
        '<div class="dados">' +
          '<div class="k">Paciente</div><div class="v">' + esc(p.nome) + '</div>' +
          '<div class="k">CPF</div><div class="v" style="margin-bottom:0">' + esc(p.cpf || '—') + '</div>' +
        '</div>' +
        '<button class="lapis" id="res-editar" aria-label="Editar dados">✎</button>' +
      '</div>' +
      '<button class="verlink" id="res-ver">ver carteirinha completa ›</button>' +
      '<div class="faixa"><span class="sig">SBCBM</span><span class="estrela">★</span>' +
      '<span class="marca-dagua">SBCBM</span></div>';

    $('#res-ver').addEventListener('click', function () { Nav.abrir('carteirinha'); });
    $('#res-editar').addEventListener('click', function () { Nav.abrir('dados'); });

    $('#grade').innerHTML = ATALHOS.map(function (a) {
      var cls = 'bloco ' + (a.claro ? 'claro' : 'azul') + (a.largo ? ' largo' : '');
      return '<button class="' + cls + '" data-atalho="' + a.id + '"' + (a.tab ? ' data-tab="1"' : '') + '>' +
        (a.pino ? '<span class="pino"></span>' : '') +
        '<span class="cx"><svg viewBox="0 0 24 24"><use href="#' + a.icone + '"/></svg></span>' +
        '<span class="rot">' + esc(a.rot) + '</span></button>';
    }).join('');

    $$('[data-atalho]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.dataset.tab) Nav.ir(b.dataset.atalho);
        else Nav.abrir(b.dataset.atalho);
      });
    });

    var pend = Store.e.agenda.length + (Store.e.notif.novidades ? DB.novidades.length : 0);
    $('#sino-n').textContent = Math.min(9, pend);
    $('#sino-n').hidden = pend === 0;

    renderBannerInstalar();
  }
  RENDER.inicio = renderInicio;

  function renderBannerInstalar() {
    var alvo = $('#banner-instalar');
    if (!Store.e.bannerInstalar || instalado()) { alvo.innerHTML = ''; return; }
    var txt = ehIOS()
      ? 'Toque em <b>Compartilhar</b> e depois em <b>Adicionar à Tela de Início</b> para instalar o Barilife no seu iPhone.'
      : 'Use o menu do navegador e escolha <b>Instalar aplicativo</b> para deixar o Barilife na tela inicial.';
    alvo.innerHTML = '<div class="instalar"><span class="ic">📲</span><span class="tx">' + txt + '</span>' +
      '<button class="fechar" id="fechar-banner" aria-label="Dispensar">×</button></div>';
    $('#fechar-banner').addEventListener('click', function () {
      Store.e.bannerInstalar = false; Store.salvar(); alvo.innerHTML = '';
    });
  }

  /* ==========================================================================
     Mídias
     ========================================================================== */
  var filtroMidia = 'todos';
  var ROTULO_MIDIA = { dica: 'Dica', receita: 'Receita', artigo: 'Artigo', video: 'Vídeo' };

  /* quebra um título em linhas com um orçamento de caracteres */
  function quebrar(txt, max, maxLinhas) {
    var palavras = String(txt).split(/\s+/), linhas = [], atual = '';
    palavras.forEach(function (p) {
      if ((atual + ' ' + p).trim().length <= max) atual = (atual + ' ' + p).trim();
      else { if (atual) linhas.push(atual); atual = p; }
    });
    if (atual) linhas.push(atual);
    if (linhas.length > maxLinhas) {
      linhas = linhas.slice(0, maxLinhas);
      linhas[maxLinhas - 1] = linhas[maxLinhas - 1].replace(/.{2}$/, '…');
    }
    return linhas;
  }

  /* arte do banner gerada em SVG — a réplica não pode usar imagens externas */
  function bannerSVG(c) {
    var linhas = quebrar(c.titulo, 20, 3);
    var alturaTexto = linhas.length * 26;
    var y0 = 100 - alturaTexto / 2 + 20;
    return '<svg viewBox="0 0 360 190" role="img" aria-label="' + esc(c.titulo) + '">' +
      '<defs>' +
        '<linearGradient id="bg' + c.id + '" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0" stop-color="' + c.cor + '" stop-opacity=".16"/>' +
          '<stop offset="1" stop-color="' + c.cor + '" stop-opacity=".05"/>' +
        '</linearGradient>' +
      '</defs>' +
      '<rect width="360" height="190" fill="#FBFCFE"/>' +
      '<rect width="360" height="190" fill="url(#bg' + c.id + ')"/>' +
      '<circle cx="330" cy="18" r="62" fill="' + c.cor + '" opacity=".09"/>' +
      '<circle cx="24" cy="176" r="46" fill="' + c.cor + '" opacity=".07"/>' +
      '<g stroke="' + c.cor + '" stroke-opacity=".12" stroke-width="2">' +
        '<path d="M-10 40 L60 -20"/><path d="M10 60 L80 0"/><path d="M30 80 L100 20"/>' +
      '</g>' +
      '<text x="104" y="46" font-size="12" font-weight="700" letter-spacing="1.6" ' +
        'fill="' + c.cor + '" opacity=".8">' + ROTULO_MIDIA[c.tipo].toUpperCase() + '</text>' +
      '<text x="18" y="112" font-size="52">' + c.emoji + '</text>' +
      linhas.map(function (l, i) {
        return '<text x="104" y="' + (y0 + i * 26) + '" font-size="21" font-weight="800" ' +
               'fill="#12314F" letter-spacing="-.4">' + esc(l) + '</text>';
      }).join('') +
      '<text x="104" y="' + (y0 + linhas.length * 26 + 6) + '" font-size="13" fill="#5E7590">' +
        esc(c.tempo) + ' de leitura</text>' +
      '</svg>';
  }

  function renderMidias() {
    var termo = semAcento($('#busca-midia') ? $('#busca-midia').value : '');
    var itens = DB.midias.filter(function (c) {
      if (filtroMidia !== 'todos' && c.tipo !== filtroMidia) return false;
      if (!termo) return true;
      return semAcento(c.titulo + ' ' + c.resumo + ' ' + ROTULO_MIDIA[c.tipo]).indexOf(termo) >= 0;
    });

    $('#lista-midias').innerHTML = itens.length ? itens.map(function (c) {
      return '<button class="card-midia" data-post="' + c.id + '">' +
        '<span class="banner">' + bannerSVG(c) +
          '<span class="selo"><svg viewBox="0 0 24 24"><use href="#i-jornal"/></svg>' + ROTULO_MIDIA[c.tipo] + '</span>' +
          (c.patrocinado ? '<span class="patrocinado">CONTEÚDO PATROCINADO</span>' : '') +
        '</span>' +
        '<span class="tit"><i>' + esc(c.resumo) + '</i></span></button>';
    }).join('') : '<div class="vazio"><div class="ico">🔍</div><p>Nada encontrado para essa busca.</p></div>';

    $$('[data-post]').forEach(function (b) {
      b.addEventListener('click', function () { abrirPost(b.dataset.post); });
    });
  }
  RENDER.midias = renderMidias;

  function abrirPost(id) {
    var c = DB.midias.filter(function (x) { return x.id === id; })[0];
    if (!c) return;
    Folha.abrir(
      '<div class="leitura-capa" style="background:' + c.cor + '1F;color:' + c.cor + '">' + c.emoji + '</div>' +
      '<h2 style="font-size:21px;font-weight:780;letter-spacing:-.6px;line-height:1.25;margin-bottom:6px">' + esc(c.titulo) + '</h2>' +
      '<p style="color:var(--texto-3);font-size:12.5px;margin-bottom:16px">' + esc(c.tempo) + ' de leitura</p>' +
      '<div class="leitura">' + esc(c.texto) + '</div>' +
      '<button class="btn cheio neutro" style="margin-top:22px" data-fechar>Fechar</button>'
    );
  }

  function alternarAbasMidia() {
    var abas = $('#abas-midias');
    abas.hidden = !abas.hidden;
    if (abas.hidden) { filtroMidia = 'todos'; renderMidias(); }
  }

  /* ==========================================================================
     Locais
     ========================================================================== */
  var filtroLocal = 'todos';
  var FILTROS_LOCAL = [
    { id: 'todos',   rot: 'Todos' },
    { id: 'medico',  rot: 'Cirurgiões' },
    { id: 'equipe',  rot: 'Equipe multi' },
    { id: 'hospital',rot: 'Hospitais e labs' }
  ];

  function cardLocal(m) {
    var ic = m.tipo === 'hospital' ? '🏥' : (m.tipo === 'equipe' ? '🩺' : '👩‍⚕️');
    return '<button class="item" data-local="' + m.id + '">' +
      '<span class="cx">' + ic + '</span>' +
      '<span class="corpo"><span class="t">' + esc(m.nome) + (m.meu ? ' <span class="etiqueta">Meu cirurgião</span>' : '') + '</span>' +
      '<span class="s">' + esc(m.esp) + '</span>' +
      '<span class="meta">📍 ' + esc(m.cidade) + '/' + esc(m.uf) +
      (m.km ? ' · ' + m.km.toFixed(1) + ' km' : '') +
      ' <span class="estrela">★ ' + m.nota.toFixed(1) + '</span></span></span>' +
      '<span class="dir"><span style="font-size:19px;color:var(--texto-3)">›</span></span></button>';
  }

  var vistaLocal = 'mapa', mapaAtivo = null;

  function renderLocais() {
    var ehMapa = vistaLocal === 'mapa';
    $('#mapa-caixa').hidden = !ehMapa;
    $('#vista-lista').hidden = ehMapa;
    $$('.segmentado [data-vista]').forEach(function (b) {
      b.classList.toggle('on', b.dataset.vista === vistaLocal);
    });
    if (ehMapa) { montarMapa(); return; }
    renderListaLocais();
  }
  RENDER.locais = renderLocais;

  function montarMapa() {
    if (mapaAtivo) mapaAtivo.soltar();
    mapaAtivo = Mapa.montar($('#mapa-caixa'), DB.locais, abrirLocal);
    $('#mapa-mais').onclick  = function () { mapaAtivo.mais(); };
    $('#mapa-menos').onclick = function () { mapaAtivo.menos(); };
    $('#mapa-eu').onclick    = function () { mapaAtivo.centrar(); };
  }

  function renderListaLocais() {
    var termo = semAcento($('#busca-local').value);
    var itens = DB.locais.filter(function (m) {
      if (filtroLocal !== 'todos' && m.tipo !== filtroLocal) return false;
      if (!termo) return true;
      return semAcento(m.nome + ' ' + m.esp + ' ' + m.cidade + ' ' + m.local).indexOf(termo) >= 0;
    }).sort(function (a, b) { return (b.meu ? 1 : 0) - (a.meu ? 1 : 0) || (a.km || 999) - (b.km || 999); });

    $('#lista-locais').innerHTML = itens.length ? itens.map(cardLocal).join('')
      : '<div class="vazio"><div class="ico">📍</div><p>Nenhum local encontrado<br>com esses filtros.</p></div>';
    ligarLocais();
  }

  function abrirFiltroLocais() {
    Folha.abrir('<h2 style="font-size:19px;font-weight:750;margin-bottom:14px">Filtrar locais</h2>' +
      FILTROS_LOCAL.map(function (f) {
        return '<button class="linha" data-fl2="' + f.id + '" style="border-radius:12px;margin-bottom:6px">' +
          '<span class="ic"><svg><use href="#i-locais"/></svg></span>' +
          '<span class="tx">' + esc(f.rot) + '</span>' +
          '<span class="seta">' + (filtroLocal === f.id ? '✓' : '') + '</span></button>';
      }).join('') +
      '<button class="btn cheio neutro" style="margin-top:14px" data-fechar>Fechar</button>');

    $$('[data-fl2]').forEach(function (b) {
      b.addEventListener('click', function () {
        filtroLocal = b.dataset.fl2;
        $$('[data-fl]').forEach(function (x) { x.classList.toggle('on', x.dataset.fl === filtroLocal); });
        vistaLocal = 'lista';
        Folha.fechar(); renderLocais();
      });
    });
  }

  function ligarLocais(escopo) {
    $$('[data-local]', escopo).forEach(function (b) {
      b.addEventListener('click', function () { abrirLocal(b.dataset.local); });
    });
  }

  function abrirLocal(id) {
    var m = DB.locais.filter(function (x) { return x.id === id; })[0];
    if (!m) return;
    Folha.abrir(
      '<div style="text-align:center;margin-bottom:18px">' +
        '<div class="avatar" style="width:66px;height:66px;font-size:21px;margin:0 auto 10px">' + esc(iniciais(m.nome)) + '</div>' +
        '<h2 style="font-size:20px;font-weight:750;letter-spacing:-.4px">' + esc(m.nome) + '</h2>' +
        '<p style="color:var(--texto-2);font-size:13.5px;margin-top:3px">' + esc(m.esp) + '</p>' +
        (m.crm ? '<p style="color:var(--texto-3);font-size:12.5px;margin-top:2px">' + esc(m.crm) + '</p>' : '') +
        '<div style="margin-top:9px"><span class="etiqueta">' + esc(m.titulo) + '</span></div>' +
      '</div>' +
      '<h3 class="sec" style="margin-top:0">Onde atende</h3>' +
      '<div class="cartao"><div style="font-size:15px;font-weight:650">' + esc(m.local) + '</div>' +
      '<div style="font-size:13px;color:var(--texto-2);margin-top:3px">' + esc(m.cidade) + ' · ' + esc(m.uf) +
      (m.km ? ' · ' + m.km.toFixed(1) + ' km de você' : '') + '</div></div>' +
      '<h3 class="sec">Atendimento</h3>' +
      '<div class="pilulas">' + m.atende.map(function (a) { return '<span class="pilula">' + esc(a) + '</span>'; }).join('') + '</div>' +
      '<h3 class="sec">Avaliação</h3>' +
      '<div class="cartao" style="display:flex;align-items:center;gap:14px">' +
        '<span style="font-size:30px;font-weight:800;color:var(--azul-vivo);letter-spacing:-1px">' + m.nota.toFixed(1) + '</span>' +
        '<span style="font-size:13.5px;color:var(--texto-2)">' + m.avaliacoes + ' avaliações de pacientes</span></div>' +
      '<button class="btn cheio" id="agendar" style="margin-top:20px">Agendar consulta</button>' +
      '<button class="btn cheio neutro" style="margin-top:9px" data-fechar>Fechar</button>'
    );
    $('#agendar').addEventListener('click', function () { formAgenda({ titulo: 'Consulta com ' + m.nome, tipo: 'consulta' }); });
  }

  /* ==========================================================================
     Agenda
     ========================================================================== */
  function renderAgenda() {
    var lista = Store.e.agenda.slice().sort(function (a, b) { return a.data.localeCompare(b.data); });

    if (!lista.length) {
      $('#corpo-agenda').innerHTML =
        '<div class="vazio"><div class="ico">📅</div>' +
        '<p>Aqui, você pode programar alertas para a sua agenda de consultas, retornos e exames.</p></div>' +
        '<div style="border-top:1px solid var(--linha);margin:0 20px 26px"></div>' +
        '<div style="text-align:center">' +
          '<h3 style="font-size:18px;font-weight:750;margin-bottom:16px">Dúvidas sobre como usar?</h3>' +
          '<button class="btn" id="ag-video" style="background:#E60000">Veja o vídeo ▶</button>' +
        '</div>' +
        '<div class="aviso-info" style="margin-top:40px"><span class="bola">i</span>' +
        '<span>O sistema de alertas de dieta é outro e está disponível no menu.</span></div>';
      $('#ag-video').addEventListener('click', function () { toast('Vídeo ilustrativo nesta réplica.'); });
      return;
    }

    $('#corpo-agenda').innerHTML =
      '<div class="itens">' + lista.map(function (a) {
        var t = DB.tiposAgenda[a.tipo] || DB.tiposAgenda.consulta;
        var d = a.data.split('-');
        return '<div class="item">' +
          '<span class="cx" style="background:' + t.cor + '1F;flex-direction:column;font-size:16px;font-weight:800;color:' + t.cor + '">' +
          d[2] + '<small style="font-size:9px;text-transform:uppercase">' + MESES[parseInt(d[1], 10) - 1] + '</small></span>' +
          '<span class="corpo"><span class="t">' + esc(a.titulo) + '</span>' +
          '<span class="meta">' + t.emoji + ' ' + t.rotulo + ' · ' + esc(a.hora) + ' · ' + dataExtenso(a.data) + '</span></span>' +
          '<span class="dir"><button data-del-ag="' + a.id + '" aria-label="Remover" style="color:var(--texto-3);font-size:19px">×</button></span></div>';
      }).join('') + '</div>' +
      '<div class="aviso-info" style="margin-top:18px"><span class="bola">i</span>' +
      '<span>O sistema de alertas de dieta é outro e está disponível no menu.</span></div>';

    $$('[data-del-ag]').forEach(function (b) {
      b.addEventListener('click', function () {
        Store.e.agenda = Store.e.agenda.filter(function (x) { return x.id !== b.dataset.delAg; });
        Store.salvar(); renderAgenda(); toast('Compromisso removido.');
      });
    });
  }
  RENDER.agenda = renderAgenda;

  function formAgenda(pre) {
    pre = pre || {};
    var min = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    Folha.abrir(
      '<h2 style="font-size:19px;font-weight:750;margin-bottom:16px">Novo alerta</h2>' +
      '<div class="campo"><label for="ag-titulo">Título</label><input id="ag-titulo" value="' + esc(pre.titulo || '') + '" placeholder="Ex.: Retorno com a nutricionista"></div>' +
      '<div class="campo"><label for="ag-tipo">Tipo</label><select id="ag-tipo">' +
        Object.keys(DB.tiposAgenda).map(function (k) {
          return '<option value="' + k + '"' + (pre.tipo === k ? ' selected' : '') + '>' +
                 DB.tiposAgenda[k].emoji + ' ' + DB.tiposAgenda[k].rotulo + '</option>';
        }).join('') + '</select></div>' +
      '<div class="dupla">' +
        '<div class="campo"><label for="ag-data">Data</label><input id="ag-data" type="date" min="' + min + '" value="' + min + '"></div>' +
        '<div class="campo"><label for="ag-hora">Horário</label><input id="ag-hora" type="time" value="14:30"></div>' +
      '</div>' +
      '<button class="btn cheio" id="ag-salvar">Salvar na agenda</button>' +
      '<button class="btn cheio neutro" style="margin-top:9px" data-fechar>Cancelar</button>'
    );
    $('#ag-salvar').addEventListener('click', function () {
      var t = $('#ag-titulo').value.trim(), d = $('#ag-data').value;
      if (!t) return toast('Dê um título ao compromisso.');
      if (!d) return toast('Escolha uma data.');
      Store.e.agenda.push({ id: 'a' + Date.now(), titulo: t, tipo: $('#ag-tipo').value, data: d, hora: $('#ag-hora').value || '09:00' });
      Store.salvar(); Folha.fechar();
      Nav.ir('agenda');
      toast('Alerta criado na agenda.');
    });
  }

  /* ==========================================================================
     Menu
     ========================================================================== */
  function renderMenu() {
    var p = Store.e.perfil;
    $('#card-perfil').innerHTML = avatarHTML(p) +
      '<span class="tx"><span class="n">' + esc(p.nome) + '</span><span class="s">Ver meus dados ›</span></span>';
  }
  RENDER.menu = renderMenu;

  /* ==========================================================================
     Meus dados
     ========================================================================== */
  function renderDados() {
    var p = Store.e.perfil;
    function grupo(icone, titulo, corpo) {
      return '<div class="grupo"><div class="cab"><span class="ic"><svg viewBox="0 0 24 24"><use href="#' + icone + '"/></svg></span>' +
             '<h3>' + esc(titulo) + '</h3></div>' + corpo + '</div>';
    }
    function pil(icone, txt) {
      return '<span class="pilula"><svg class="pic" viewBox="0 0 24 24"><use href="#' + icone + '"/></svg>' + esc(txt) + '</span>';
    }

    $('#corpo-dados').innerHTML =
      '<div class="dono">' + avatarHTML(p) +
        '<span class="nm">' + esc(p.nome) + '</span>' +
        '<button class="lapis" id="dd-editar" aria-label="Editar">✎</button></div>' +

      '<button class="faixa-doc" id="dd-docs"><span class="ic">📄</span>' +
      '<span class="tx">Visualizar documentos enviados</span><span class="seta">›</span></button>' +

      '<div class="bloco-dados">' +
        grupo('i-interrog', 'Já fez a cirurgia bariátrica?',
          '<div class="pilulas">' +
            '<span class="pilula sim-nao' + (p.jaFezCirurgia ? ' sim' : '') + '">' +
              '<span class="cx-mini' + (p.jaFezCirurgia ? ' verde' : '') + '">' + (p.jaFezCirurgia ? '✓' : '') + '</span>Sim</span>' +
            '<span class="pilula sim-nao' + (p.jaFezCirurgia ? '' : ' nao') + '">' +
              '<span class="cx-mini' + (p.jaFezCirurgia ? '' : ' cinza') + '">' + (p.jaFezCirurgia ? '' : '✕') + '</span>Não</span>' +
          '</div>') +
        grupo('i-corpo', 'Medidas',
          '<div class="pilulas">' + pil('i-balanca', (p.peso || '—') + ' kg') + pil('i-altura', (p.altura || '—') + ' cm') +
          (p.peso && p.altura ? pil('i-grafico', 'IMC ' + (p.peso / Math.pow(p.altura / 100, 2)).toFixed(1)) : '') + '</div>') +
        grupo('i-estomago', 'Cirurgia',
          '<div class="pilulas">' + pil('i-estomago', p.cirurgia) + pil('i-agenda', p.mesCirurgia || '—') + '</div>') +
        grupo('i-hospital', 'Hospital',
          '<div class="pilulas">' + pil('i-hospital', p.hospital || '—') + pil('i-locais', p.hospitalCidade || (p.cidade + ' – ' + p.uf)) + '</div>') +
        grupo('i-equipe', 'Cirurgião responsável',
          '<div class="pilulas">' + pil('i-equipe', p.cirurgiao || '—') + pil('i-cracha', p.crm || '—') + '</div>') +
        grupo('i-envelope', 'Contato',
          '<div class="pilulas">' + pil('i-envelope', p.email || '—') + pil('i-fone', p.telefone || '—') +
          pil('i-bolo', dataBR(p.nascimento)) + '</div>') +
      '</div>';

    $('#dd-editar').addEventListener('click', formDados);
    $('#dd-docs').addEventListener('click', function () { Nav.abrir('documentos'); });
  }
  RENDER.dados = renderDados;

  function formDados() {
    var p = Store.e.perfil;
    Folha.abrir(
      '<h2 style="font-size:19px;font-weight:750;margin-bottom:16px">Editar meus dados</h2>' +
      '<div class="campo"><label for="d-nome">Nome completo</label><input id="d-nome" value="' + esc(p.nome) + '"></div>' +
      '<div class="campo"><label for="d-cpf">CPF</label><input id="d-cpf" inputmode="numeric" maxlength="14" value="' + esc(p.cpf || '') + '"></div>' +
      '<div class="dupla">' +
        '<div class="campo"><label for="d-nasc">Nascimento</label><input id="d-nasc" type="date" value="' + esc(p.nascimento || '') + '"></div>' +
        '<div class="campo"><label for="d-tel">Telefone</label><input id="d-tel" inputmode="numeric" maxlength="15" value="' + esc(p.telefone || '') + '"></div>' +
      '</div>' +
      '<div class="campo"><label for="d-email">E-mail</label><input id="d-email" type="email" value="' + esc(p.email || '') + '"></div>' +
      '<div class="dupla">' +
        '<div class="campo"><label for="d-peso">Peso (kg)</label><input id="d-peso" type="number" step="0.1" value="' + (p.peso || '') + '"></div>' +
        '<div class="campo"><label for="d-alt">Altura (cm)</label><input id="d-alt" type="number" value="' + (p.altura || '') + '"></div>' +
      '</div>' +
      '<div class="campo"><label for="d-cirurgia">Cirurgia</label><select id="d-cirurgia">' +
        DB.tiposCirurgia.map(function (c) { return '<option' + (c === p.cirurgia ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') +
      '</select></div>' +
      '<div class="dupla">' +
        '<div class="campo"><label for="d-mes">Mês da cirurgia</label><input id="d-mes" type="month" value="' + mesISO(p.mesCirurgia) + '"></div>' +
        '<div class="campo"><label for="d-crm">CRM</label><input id="d-crm" value="' + esc(p.crm || '') + '"></div>' +
      '</div>' +
      '<div class="campo"><label for="d-cirurgiao">Cirurgião(ã)</label><input id="d-cirurgiao" value="' + esc(p.cirurgiao || '') + '"></div>' +
      '<div class="campo"><label for="d-hosp">Hospital</label><input id="d-hosp" value="' + esc(p.hospital || '') + '"></div>' +
      '<div class="campo"><label for="d-foto">Foto do perfil</label><input id="d-foto" type="file" accept="image/*"></div>' +
      '<button class="btn cheio" id="d-salvar">Salvar</button>' +
      '<button class="btn cheio neutro" style="margin-top:9px" data-fechar>Cancelar</button>'
    );

    ligarMascara('#d-cpf', mascaraCPF);
    ligarMascara('#d-tel', mascaraTelefone);

    $('#d-foto').addEventListener('change', function (ev) {
      var arq = ev.target.files && ev.target.files[0];
      if (!arq) return;
      if (arq.size > 5 * 1024 * 1024) return toast('Escolha uma imagem de até 5 MB.');
      var l = new FileReader();
      l.onload = function () {
        redimensionar(l.result, 384, function (uri) {
          p.foto = uri; Store.salvar(); toast('Foto atualizada.');
        });
      };
      l.readAsDataURL(arq);
    });

    $('#d-salvar').addEventListener('click', function () {
      var nome = $('#d-nome').value.trim();
      if (!nome) return toast('O nome não pode ficar vazio.');
      var cpf = $('#d-cpf').value.trim();
      if (cpf && !cpfValido(cpf)) return toast('CPF inválido — confira os números.');
      var nasc = $('#d-nasc').value;
      if (nasc && idade(nasc) < 16) return toast('É preciso ter ao menos 16 anos.');

      p.nome = nome;
      p.cpf = cpf || p.cpf;
      p.nascimento = nasc || p.nascimento;
      p.telefone = $('#d-tel').value.trim();
      p.email = $('#d-email').value.trim();
      p.peso = parseFloat($('#d-peso').value) || null;
      p.altura = parseInt($('#d-alt').value, 10) || null;
      p.cirurgia = $('#d-cirurgia').value;
      p.mesCirurgia = mesBR($('#d-mes').value) || p.mesCirurgia;
      p.crm = $('#d-crm').value.trim();
      p.cirurgiao = $('#d-cirurgiao').value.trim() || p.cirurgiao;
      p.hospital = $('#d-hosp').value.trim();

      Store.salvar(); novoToken(); Folha.fechar(); Nav.pintar();
      toast('Dados atualizados.');
    });
  }

  function mesISO(br) {
    var p = String(br || '').split('/');
    return p.length === 2 ? p[1] + '-' + p[0] : '';
  }
  function mesBR(iso) {
    var p = String(iso || '').split('-');
    return p.length === 2 ? p[1] + '/' + p[0] : '';
  }

  function redimensionar(uri, lado, cb) {
    var img = new Image();
    img.onload = function () {
      var c = document.createElement('canvas'), min = Math.min(img.width, img.height);
      c.width = c.height = lado;
      c.getContext('2d').drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, lado, lado);
      try { cb(c.toDataURL('image/jpeg', 0.85)); } catch (x) { cb(uri); }
    };
    img.onerror = function () { cb(uri); };
    img.src = uri;
  }

  /* ==========================================================================
     Documentos enviados
     ========================================================================== */
  function renderDocumentos() {
    $('#corpo-documentos').innerHTML =
      '<div class="aviso-info" style="margin-bottom:14px"><span class="bola">i</span>' +
      '<span>Documentos analisados pelo seu cirurgião no momento da validação da carteirinha.</span></div>' +
      '<div class="itens">' + DB.documentos.map(function (d) {
        return '<div class="item"><span class="cx">📄</span>' +
          '<span class="corpo"><span class="t">' + esc(d.nome) + '</span>' +
          '<span class="s">' + esc(d.arquivo) + '</span>' +
          '<span class="meta">Enviado em ' + dataBR(d.data) + '</span></span>' +
          '<span class="dir"><span class="etiqueta" style="background:var(--verde-bg);color:var(--verde)">✓ Aprovado</span></span></div>';
      }).join('') + '</div>';
  }
  RENDER.documentos = renderDocumentos;

  /* ==========================================================================
     Rede Amiga
     ========================================================================== */
  var filtroCategoria = 'todos';

  function cardParceiro(p) {
    var cat = DB.categorias.filter(function (c) { return c.id === p.categoria; })[0] || { icone: '🏷️' };
    var fav = Store.e.favoritos.indexOf(p.id) >= 0;
    return '<button class="item" data-parceiro="' + p.id + '">' +
      '<span class="cx">' + cat.icone + '</span>' +
      '<span class="corpo"><span class="t">' + esc(p.nome) + '</span>' +
      '<span class="s">' + esc(p.regra) + '</span>' +
      '<span class="meta">📍 ' + esc(p.bairro) + (p.km ? ' · ' + p.km.toFixed(1) + ' km' : '') +
      ' <span class="estrela">★ ' + p.nota.toFixed(1) + '</span>' +
      (fav ? ' <span class="coracao on">♥</span>' : '') + '</span></span>' +
      '<span class="dir"><span class="desconto">' + p.desconto + '<small>%</small></span>' +
      '<span style="font-size:10px;color:var(--texto-3);font-weight:700">OFF</span></span></button>';
  }

  function renderRede() {
    var termo = semAcento($('#busca-parceiro').value);
    var itens = DB.parceiros.filter(function (p) {
      if (filtroCategoria !== 'todos' && p.categoria !== filtroCategoria) return false;
      if (!termo) return true;
      return semAcento(p.nome + ' ' + p.bairro + ' ' + p.cidade + ' ' + p.regra).indexOf(termo) >= 0;
    }).sort(function (a, b) { return b.desconto - a.desconto; });

    $('#lista-parceiros').innerHTML = itens.length ? itens.map(cardParceiro).join('')
      : '<div class="vazio"><div class="ico">🔍</div><p>Nenhum parceiro encontrado.<br>Tente outra busca ou categoria.</p></div>';
    ligarParceiros();
  }
  RENDER.rede = renderRede;

  function ligarParceiros(escopo) {
    $$('[data-parceiro]', escopo).forEach(function (b) {
      b.addEventListener('click', function () { abrirParceiro(b.dataset.parceiro); });
    });
  }

  function abrirParceiro(id) {
    var p = DB.parceiros.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    var cat = DB.categorias.filter(function (c) { return c.id === p.categoria; })[0] || { icone: '🏷️', rotulo: '' };
    var fav = Store.e.favoritos.indexOf(id) >= 0;

    Folha.abrir(
      '<div style="display:flex;align-items:flex-start;gap:13px;margin-bottom:16px">' +
        '<div class="cx" style="width:54px;height:54px;border-radius:15px;background:var(--pilula);display:grid;place-items:center;font-size:25px">' + cat.icone + '</div>' +
        '<div style="flex:1;min-width:0"><h2 style="font-size:19px;font-weight:750;line-height:1.25">' + esc(p.nome) + '</h2>' +
        '<p style="color:var(--texto-2);font-size:13px;margin-top:3px">' + esc(cat.rotulo) + ' · ' + esc(p.bairro) + ', ' + esc(p.cidade) + '</p></div>' +
        '<button class="coracao ' + (fav ? 'on' : '') + '" id="fav-btn" style="font-size:24px" aria-label="Favoritar">' + (fav ? '♥' : '♡') + '</button>' +
      '</div>' +
      '<div class="cartao" style="background:var(--azul-claro);text-align:center;margin-bottom:16px">' +
        '<div style="font-size:36px;font-weight:850;color:var(--azul-vivo);letter-spacing:-1.6px">' + p.desconto + '% OFF</div>' +
        '<div style="font-size:13.5px;color:var(--texto-2);margin-top:4px">' + esc(p.regra) + '</div></div>' +
      '<h3 class="sec" style="margin-top:0">Como usar</h3>' +
      '<p style="font-size:14.5px;line-height:1.6;color:var(--texto-2)">' + esc(p.detalhe) + '</p>' +
      '<h3 class="sec">Cupom</h3>' +
      '<button class="cartao" id="copiar-cupom" style="width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px">' +
        '<span style="font-size:19px;font-weight:800;letter-spacing:2px;color:var(--azul-vivo)">' + esc(p.cupom) + '</span>' +
        '<span style="font-size:12.5px;font-weight:650;color:var(--texto-2)">Copiar ⧉</span></button>' +
      '<button class="btn cheio" id="usar-cupom" style="margin-top:18px">Apresentar carteirinha</button>' +
      '<button class="btn cheio neutro" style="margin-top:9px" data-fechar>Fechar</button>'
    );

    $('#fav-btn').addEventListener('click', function () {
      var i = Store.e.favoritos.indexOf(id);
      if (i >= 0) { Store.e.favoritos.splice(i, 1); toast('Removido dos favoritos.'); }
      else { Store.e.favoritos.push(id); toast('Salvo nos favoritos.'); }
      Store.salvar();
      this.classList.toggle('on');
      this.textContent = Store.e.favoritos.indexOf(id) >= 0 ? '♥' : '♡';
      renderRede();
    });

    $('#copiar-cupom').addEventListener('click', function () {
      if (navigator.clipboard) navigator.clipboard.writeText(p.cupom)
        .then(function () { toast('Cupom ' + p.cupom + ' copiado.'); })
        .catch(function () { toast('Cupom: ' + p.cupom); });
      else toast('Cupom: ' + p.cupom);
    });

    $('#usar-cupom').addEventListener('click', function () { Folha.fechar(); Nav.abrir('carteirinha'); });
  }

  /* ==========================================================================
     Meu peso
     ========================================================================== */
  function historico() {
    var p = Store.e.perfil, h = Store.e.pesos.slice();
    if (!h.length && p.pesoInicial && p.peso) {
      // série ilustrativa entre o peso antes da cirurgia e o atual
      var mes = mesISO(p.mesCirurgia) || hoje().slice(0, 7);
      var ini = new Date(mes + '-01T00:00:00');
      var passos = 7, dif = p.pesoInicial - p.peso;
      for (var i = 0; i <= passos; i++) {
        var d = new Date(ini.getFullYear(), ini.getMonth() + i * 4, 1);
        if (d > new Date()) break;
        var f = 1 - Math.pow(1 - i / passos, 2);   // perda rápida no início
        h.push({ data: d.toISOString().slice(0, 10), kg: Math.round((p.pesoInicial - dif * f) * 10) / 10 });
      }
    }
    return h.sort(function (a, b) { return a.data.localeCompare(b.data); });
  }

  function renderPeso() {
    var p = Store.e.perfil, h = historico();
    var atual = h.length ? h[h.length - 1].kg : (p.peso || 0);
    var inicial = h.length ? h[0].kg : (p.pesoInicial || atual);
    var dif = inicial - atual;
    var imc = (p.altura && atual) ? (atual / Math.pow(p.altura / 100, 2)) : null;

    var grafico = '';
    if (h.length > 1) {
      var W = 320, H = 118, pad = 6;
      var min = Math.min.apply(null, h.map(function (x) { return x.kg; })) - 2;
      var max = Math.max.apply(null, h.map(function (x) { return x.kg; })) + 2;
      var px = h.map(function (x, i) {
        return [pad + (W - pad * 2) * (i / (h.length - 1)),
                pad + (H - pad * 2) * (1 - (x.kg - min) / (max - min))];
      });
      var d = px.map(function (q, i) { return (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join(' ');
      grafico =
        '<svg class="grafico" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none">' +
          '<path class="area" d="' + d + ' L' + px[px.length - 1][0].toFixed(1) + ' ' + H + ' L' + px[0][0].toFixed(1) + ' ' + H + ' Z"/>' +
          '<path class="linha-g" d="' + d + '"/>' +
          px.map(function (q) { return '<circle class="ponto" cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="3"/>'; }).join('') +
        '</svg>' +
        '<div class="eixo"><span>' + dataBR(h[0].data).slice(3) + '</span><span>' + dataBR(h[h.length - 1].data).slice(3) + '</span></div>';
    }

    $('#corpo-peso').innerHTML =
      '<div class="cartao">' +
        '<div class="peso-topo"><span class="n">' + atual + '</span><span class="u">kg</span>' +
        (dif > 0 ? '<span class="delta">▼ ' + dif.toFixed(1) + ' kg desde o início</span>' : '') + '</div>' +
        grafico +
      '</div>' +

      '<h2 class="sec">Resumo</h2>' +
      '<div class="cartao"><div class="pilulas">' +
        pilula('i-balanca', 'Antes: ' + inicial + ' kg') +
        pilula('i-balanca', 'Atual: ' + atual + ' kg') +
        (imc ? pilula('i-grafico', 'IMC ' + imc.toFixed(1)) : '') +
        (p.altura ? pilula('i-altura', p.altura + ' cm') : '') +
      '</div></div>' +

      '<h2 class="sec">Registros</h2>' +
      '<div class="itens">' + h.slice().reverse().map(function (x, i, arr) {
        var ante = arr[i + 1];
        var v = ante ? (x.kg - ante.kg) : 0;
        return '<div class="item"><span class="cx">⚖️</span>' +
          '<span class="corpo"><span class="t">' + x.kg + ' kg</span>' +
          '<span class="meta">' + dataExtenso(x.data) + '</span></span>' +
          '<span class="dir"><span style="font-size:13px;font-weight:700;color:' +
          (v < 0 ? 'var(--verde)' : v > 0 ? 'var(--vermelho)' : 'var(--texto-3)') + '">' +
          (v === 0 ? '—' : (v < 0 ? '▼ ' : '▲ ') + Math.abs(v).toFixed(1) + ' kg') + '</span></span></div>';
      }).join('') + '</div>' +
      '<button class="btn cheio vazio" id="pe-novo" style="margin-top:14px">+ Registrar peso de hoje</button>';

    $('#pe-novo').addEventListener('click', formPeso);
  }
  RENDER.peso = renderPeso;

  function formPeso() {
    Folha.abrir(
      '<h2 style="font-size:19px;font-weight:750;margin-bottom:16px">Registrar peso</h2>' +
      '<div class="campo"><label for="pe-kg">Peso (kg)</label><input id="pe-kg" type="number" step="0.1" inputmode="decimal" value="' + (Store.e.perfil.peso || '') + '"></div>' +
      '<div class="campo"><label for="pe-data">Data</label><input id="pe-data" type="date" max="' + hoje() + '" value="' + hoje() + '"></div>' +
      '<button class="btn cheio" id="pe-salvar">Salvar</button>' +
      '<button class="btn cheio neutro" style="margin-top:9px" data-fechar>Cancelar</button>'
    );
    $('#pe-salvar').addEventListener('click', function () {
      var kg = parseFloat($('#pe-kg').value), d = $('#pe-data').value;
      if (!kg || kg < 25 || kg > 400) return toast('Informe um peso entre 25 e 400 kg.');
      if (!d) return toast('Escolha a data.');
      if (!Store.e.pesos.length) Store.e.pesos = historico();
      Store.e.pesos = Store.e.pesos.filter(function (x) { return x.data !== d; });
      Store.e.pesos.push({ data: d, kg: kg });
      Store.e.perfil.peso = kg;
      Store.salvar(); Folha.fechar(); renderPeso();
      toast('Peso registrado.');
    });
  }

  /* ==========================================================================
     Chat
     ========================================================================== */
  function renderChat() {
    $('#corpo-chat').innerHTML =
      '<div class="aviso-info" style="margin-bottom:16px"><span class="bola">i</span>' +
      '<span>Conversa com a sua equipe multidisciplinar. Nesta réplica as respostas são simuladas.</span></div>' +
      '<div id="baloes">' + Store.e.chat.map(function (m) {
        return '<div class="balao ' + (m.de === 'eu' ? 'meu' : 'deles') + '">' +
          (m.de === 'eu' ? '' : '<div class="quem">' + esc(m.autor) + '</div>') +
          esc(m.texto) + '<div class="hr">' + esc(m.hora) + '</div></div>';
      }).join('') + '</div>' +
      '<div style="display:flex;gap:9px;margin-top:16px">' +
        '<input id="chat-txt" placeholder="Escreva uma mensagem" style="flex:1;background:var(--card);border:1.5px solid var(--linha);border-radius:var(--r-m);padding:13px">' +
        '<button class="btn" id="chat-env" style="padding:13px 18px">↑</button>' +
      '</div>';

    function enviar() {
      var t = $('#chat-txt').value.trim();
      if (!t) return;
      var agora = new Date();
      var hr = String(agora.getHours()).padStart(2, '0') + ':' + String(agora.getMinutes()).padStart(2, '0');
      Store.e.chat.push({ de: 'eu', autor: 'Você', hora: hr, texto: t });
      Store.salvar(); renderChat();
      setTimeout(function () {
        Store.e.chat.push({ de: 'equipe', autor: 'Dra. Ana Beatriz · Nutrição', hora: hr,
          texto: 'Recebi sua mensagem, ' + primeiroNome(Store.e.perfil.nome) + '. Vou revisar e te respondo até o fim do dia.' });
        Store.salvar(); renderChat();
      }, 1200);
    }
    $('#chat-env').addEventListener('click', enviar);
    $('#chat-txt').addEventListener('keydown', function (e) { if (e.key === 'Enter') enviar(); });
    var b = $('#baloes'); if (b) $('#main').scrollTop = $('#main').scrollHeight;
  }
  RENDER.chat = renderChat;

  /* ==========================================================================
     Novidades
     ========================================================================== */
  function renderNovidades() {
    $('#corpo-novidades').innerHTML = '<div class="itens">' + DB.novidades.map(function (n) {
      return '<button class="item" data-nov="' + n.id + '"><span class="cx">📰</span>' +
        '<span class="corpo"><span class="t">' + esc(n.titulo) + '</span>' +
        '<span class="s">' + esc(n.resumo) + '</span>' +
        '<span class="meta">' + dataExtenso(n.data) + '</span></span>' +
        '<span class="dir"><span style="font-size:19px;color:var(--texto-3)">›</span></span></button>';
    }).join('') + '</div>';

    $$('[data-nov]').forEach(function (b) {
      b.addEventListener('click', function () {
        var n = DB.novidades.filter(function (x) { return x.id === b.dataset.nov; })[0];
        Folha.abrir('<p style="color:var(--texto-3);font-size:12.5px;margin-bottom:8px">' + dataExtenso(n.data) + '</p>' +
          '<h2 style="font-size:21px;font-weight:780;line-height:1.25;margin-bottom:14px">' + esc(n.titulo) + '</h2>' +
          '<div class="leitura">' + esc(n.texto) + '</div>' +
          '<button class="btn cheio neutro" style="margin-top:22px" data-fechar>Fechar</button>');
      });
    });
  }
  RENDER.novidades = renderNovidades;

  /* ==========================================================================
     Enquetes
     ========================================================================== */
  function renderEnquetes() {
    $('#corpo-enquetes').innerHTML = DB.enquetes.map(function (q) {
      var meu = Store.e.votos[q.id];
      var total = q.opcoes.reduce(function (s, o) { return s + o.votos; }, 0) + (meu ? 1 : 0);
      return '<div class="cartao" style="margin-bottom:14px">' +
        '<h3 style="font-size:16px;font-weight:700;line-height:1.35;margin-bottom:14px">' + esc(q.pergunta) + '</h3>' +
        q.opcoes.map(function (o) {
          var v = o.votos + (meu === o.id ? 1 : 0);
          var pct = total ? Math.round(v * 100 / total) : 0;
          return '<button class="opcao' + (meu === o.id ? ' marcada' : '') + '" data-voto="' + q.id + ':' + o.id + '">' +
            (meu ? '<span class="barra" style="transform:scaleX(' + (pct / 100) + ')"></span>' : '') +
            '<span class="rot">' + esc(o.texto) + '</span>' +
            (meu ? '<span class="pct">' + pct + '%</span>' : '') + '</button>';
        }).join('') +
        '<p style="font-size:12px;color:var(--texto-3);margin-top:8px">' +
        (meu ? total.toLocaleString('pt-BR') + ' respostas' : 'Toque para responder') + '</p></div>';
    }).join('');

    $$('[data-voto]').forEach(function (b) {
      b.addEventListener('click', function () {
        var p = b.dataset.voto.split(':');
        if (Store.e.votos[p[0]]) return toast('Você já respondeu esta enquete.');
        Store.e.votos[p[0]] = p[1];
        Store.salvar(); renderEnquetes(); toast('Resposta registrada.');
      });
    });
  }
  RENDER.enquetes = renderEnquetes;

  /* ==========================================================================
     COESAS — equipe multidisciplinar
     ========================================================================== */
  function renderCoesas() {
    var eq = DB.coesas.map(function (id) {
      return DB.locais.filter(function (m) { return m.id === id; })[0];
    }).filter(Boolean);

    $('#corpo-coesas').innerHTML =
      '<div class="aviso-info" style="margin-bottom:14px"><span class="bola">i</span>' +
      '<span>COESAS é a comissão de especialidades associadas da SBCBM: nutrição, psicologia, endocrinologia, educação física e enfermagem.</span></div>' +
      '<div class="itens">' + eq.map(cardLocal).join('') + '</div>' +
      '<button class="btn cheio vazio" id="co-buscar" style="margin-top:14px">Buscar outros profissionais</button>';

    ligarLocais();
    $('#co-buscar').addEventListener('click', function () { Nav.ir('locais'); });
  }
  RENDER.coesas = renderCoesas;

  /* ==========================================================================
     Alerta de dieta — hidratação e lembretes
     ========================================================================== */
  function renderDieta() {
    var a = Store.e.agua;
    var pct = Math.min(100, Math.round((a.ml / a.meta) * 100));
    var raio = 40, circ = 2 * Math.PI * raio;

    $('#corpo-dieta').innerHTML =
      '<h2 class="sec">Hidratação de hoje</h2>' +
      '<div class="cartao"><div class="medidor">' +
        '<div class="anel"><svg viewBox="0 0 96 96">' +
          '<circle class="trilho" cx="48" cy="48" r="' + raio + '"/>' +
          '<circle class="barra" cx="48" cy="48" r="' + raio + '" stroke-dasharray="' + circ + '" stroke-dashoffset="' + (circ * (1 - pct / 100)) + '"/>' +
        '</svg><div class="centro"><div><div class="n">' + pct + '%</div><div class="u">da meta</div></div></div></div>' +
        '<div class="lado"><div class="t">' + a.ml + ' ml de ' + a.meta + ' ml</div>' +
        '<div class="s">Beba em pequenos goles e evite líquidos 30 min antes e depois das refeições.</div>' +
        '<div class="bts"><button class="menos" id="ag-menos">− ' + a.copo + ' ml</button>' +
        '<button id="ag-mais">+ ' + a.copo + ' ml</button></div></div>' +
      '</div></div>' +
      '<button class="btn cheio vazio" id="ag-meta" style="margin-top:12px">Ajustar meta diária</button>' +

      '<h2 class="sec">Meus alertas</h2>' +
      '<div class="itens">' + (Store.e.lembretes.length ? Store.e.lembretes.map(function (l) {
        var t = DB.tiposLembrete[l.tipo] || DB.tiposLembrete.outro;
        return '<div class="item"><span class="cx" style="background:' + t.cor + '1F">' + t.emoji + '</span>' +
          '<span class="corpo"><span class="t"' + (l.ativo ? '' : ' style="opacity:.5"') + '>' + esc(l.titulo) + '</span>' +
          '<span class="meta">🕘 ' + esc(l.hora) + ' · ' + esc(l.repete) + '</span></span>' +
          '<span class="dir" style="flex-direction:row;align-items:center;gap:9px">' +
          '<button class="chave ' + (l.ativo ? 'on' : '') + '" data-tg="' + l.id + '" aria-label="Ativar"></button>' +
          '<button data-rm="' + l.id + '" aria-label="Remover" style="color:var(--texto-3);font-size:18px">×</button></span></div>';
      }).join('') : '<div class="vazio"><div class="ico">🔔</div><p>Nenhum alerta cadastrado.</p></div>') + '</div>' +
      '<button class="btn cheio vazio" id="ag-novo" style="margin-top:14px">+ Novo alerta de dieta</button>';

    $('#ag-mais').addEventListener('click', function () {
      a.ml += a.copo; Store.salvar(); renderDieta();
      if (a.ml >= a.meta) toast('Meta de hidratação atingida! 💧');
    });
    $('#ag-menos').addEventListener('click', function () {
      a.ml = Math.max(0, a.ml - a.copo); Store.salvar(); renderDieta();
    });
    $('#ag-meta').addEventListener('click', formMeta);
    $('#ag-novo').addEventListener('click', formLembrete);

    $$('[data-tg]').forEach(function (b) {
      b.addEventListener('click', function () {
        var l = Store.e.lembretes.filter(function (x) { return x.id === b.dataset.tg; })[0];
        if (l) { l.ativo = !l.ativo; Store.salvar(); renderDieta(); }
      });
    });
    $$('[data-rm]').forEach(function (b) {
      b.addEventListener('click', function () {
        Store.e.lembretes = Store.e.lembretes.filter(function (x) { return x.id !== b.dataset.rm; });
        Store.salvar(); renderDieta(); toast('Alerta removido.');
      });
    });
  }
  RENDER.dieta = renderDieta;

  function formMeta() {
    var a = Store.e.agua;
    Folha.abrir(
      '<h2 style="font-size:19px;font-weight:750;margin-bottom:4px">Meta diária de água</h2>' +
      '<p style="color:var(--texto-2);font-size:13.5px;margin-bottom:18px">Confirme com sua equipe. No pós-bariátrico costuma ficar entre 1.500 ml e 2.000 ml.</p>' +
      '<div class="campo"><label for="mt-meta">Meta (ml)</label><input id="mt-meta" type="number" min="500" max="5000" step="100" value="' + a.meta + '"></div>' +
      '<div class="campo"><label for="mt-copo">Tamanho do gole (ml)</label><input id="mt-copo" type="number" min="20" max="500" step="10" value="' + a.copo + '"></div>' +
      '<button class="btn cheio" id="mt-salvar">Salvar</button>' +
      '<button class="btn cheio neutro" style="margin-top:9px" data-fechar>Cancelar</button>'
    );
    $('#mt-salvar').addEventListener('click', function () {
      var m = parseInt($('#mt-meta').value, 10), c = parseInt($('#mt-copo').value, 10);
      if (!m || m < 500) return toast('Meta mínima de 500 ml.');
      if (!c || c < 20) return toast('Gole mínimo de 20 ml.');
      a.meta = m; a.copo = c; Store.salvar(); Folha.fechar(); renderDieta(); toast('Meta atualizada.');
    });
  }

  function formLembrete() {
    Folha.abrir(
      '<h2 style="font-size:19px;font-weight:750;margin-bottom:16px">Novo alerta de dieta</h2>' +
      '<div class="campo"><label for="nl-titulo">Título</label><input id="nl-titulo" placeholder="Ex.: Vitamina D"></div>' +
      '<div class="campo"><label for="nl-tipo">Tipo</label><select id="nl-tipo">' +
        Object.keys(DB.tiposLembrete).map(function (k) {
          return '<option value="' + k + '">' + DB.tiposLembrete[k].emoji + ' ' + DB.tiposLembrete[k].rotulo + '</option>';
        }).join('') + '</select></div>' +
      '<div class="dupla">' +
        '<div class="campo"><label for="nl-hora">Horário</label><input id="nl-hora" type="time" value="08:00"></div>' +
        '<div class="campo"><label for="nl-rep">Repetição</label><select id="nl-rep">' +
        '<option>Todos os dias</option><option>Dias úteis</option><option>Uma vez por semana</option></select></div>' +
      '</div>' +
      '<button class="btn cheio" id="nl-salvar">Salvar alerta</button>' +
      '<button class="btn cheio neutro" style="margin-top:9px" data-fechar>Cancelar</button>'
    );
    $('#nl-salvar').addEventListener('click', function () {
      var t = $('#nl-titulo').value.trim();
      if (!t) return toast('Dê um título ao alerta.');
      Store.e.lembretes.push({ id: 'l' + Date.now(), titulo: t, tipo: $('#nl-tipo').value,
        hora: $('#nl-hora').value || '08:00', ativo: true, repete: $('#nl-rep').value });
      Store.salvar(); Folha.fechar(); renderDieta(); toast('Alerta criado.');
    });
  }

  /* ==========================================================================
     Notificações, senha, FAQ e sobre
     ========================================================================== */
  var CHAVES_NOTIF = [
    ['agenda',    'Agenda',            'Consultas, retornos e exames marcados.'],
    ['dieta',     'Alerta de dieta',   'Água, vitaminas e refeições ao longo do dia.'],
    ['novidades', 'Novidades',         'Avisos da SBCBM e da Rede Amiga.'],
    ['rede',      'Ofertas por perto', 'Parceiros próximos da sua localização.']
  ];

  function renderNotificacoes() {
    $('#corpo-notificacoes').innerHTML =
      '<div class="linhas">' + CHAVES_NOTIF.map(function (k) {
        return '<div class="linha"><span class="ic"><svg><use href="#i-sino2"/></svg></span>' +
          '<span class="tx">' + esc(k[1]) + '<small>' + esc(k[2]) + '</small></span>' +
          '<button class="chave ' + (Store.e.notif[k[0]] ? 'on' : '') + '" data-nt="' + k[0] + '" aria-label="Alternar"></button></div>';
      }).join('') + '</div>' +
      '<div class="aviso-info" style="margin-top:16px"><span class="bola">i</span>' +
      '<span>Nesta réplica as preferências ficam salvas no aparelho, mas nenhuma notificação é realmente enviada.</span></div>';

    $$('[data-nt]').forEach(function (b) {
      b.addEventListener('click', function () {
        Store.e.notif[b.dataset.nt] = !Store.e.notif[b.dataset.nt];
        Store.salvar(); renderNotificacoes();
      });
    });
  }
  RENDER.notificacoes = renderNotificacoes;

  function renderSenha() {
    $('#corpo-senha').innerHTML =
      '<div class="campo"><label for="s-atual">Senha atual</label><input id="s-atual" type="password" autocomplete="current-password"></div>' +
      '<div class="campo"><label for="s-nova">Nova senha</label><input id="s-nova" type="password" autocomplete="new-password"><div class="ajuda">Ao menos 8 caracteres, com letras e números.</div></div>' +
      '<div class="campo"><label for="s-conf">Confirmar nova senha</label><input id="s-conf" type="password" autocomplete="new-password"></div>' +
      '<button class="btn cheio" id="s-salvar">Trocar senha</button>' +
      '<div class="aviso-info" style="margin-top:16px"><span class="bola">i</span>' +
      '<span>Réplica acadêmica: não há servidor nem conta real. A validação de força da senha é feita localmente para demonstrar a tela.</span></div>';

    $('#s-salvar').addEventListener('click', function () {
      var n = $('#s-nova').value, c = $('#s-conf').value;
      if (!$('#s-atual').value) return toast('Informe a senha atual.');
      if (n.length < 8) return toast('A nova senha precisa de ao menos 8 caracteres.');
      if (!/[a-zA-Z]/.test(n) || !/\d/.test(n)) return toast('Use letras e números na nova senha.');
      if (n !== c) return toast('A confirmação não confere.');
      $('#s-atual').value = $('#s-nova').value = $('#s-conf').value = '';
      toast('Senha alterada (simulação).');
    });
  }
  RENDER.senha = renderSenha;

  function renderFaq() {
    $('#corpo-faq').innerHTML = DB.faq.map(function (f) {
      return '<details class="faq-item"><summary>' + esc(f.p) + '</summary>' +
        '<div class="resp">' + esc(f.r) + '</div></details>';
    }).join('');
  }
  RENDER.faq = renderFaq;

  function renderSobre() {
    $('#corpo-sobre').innerHTML =
      '<div class="cartao"><div class="leitura" style="font-size:14.5px">' +
        'Esta é uma <b>réplica acadêmica</b> do aplicativo Barilife, feita como trabalho de curso para estudar interface e desenvolvimento de aplicações web instaláveis (PWA).\n\n' +
        'Não tem vínculo com a Sociedade Brasileira de Cirurgia Bariátrica e Metabólica (SBCBM), responsável pelo aplicativo original, e não deve ser usada como carteirinha real.\n\n' +
        'Profissionais, hospitais e estabelecimentos são fictícios. Os textos de conteúdo são ilustrativos e não substituem a orientação da sua equipe de saúde.\n\n' +
        'Nenhuma informação é enviada para servidores: tudo fica no armazenamento local deste navegador.' +
      '</div></div>' +
      '<h2 class="sec">Tecnologia</h2>' +
      '<div class="cartao" style="font-size:13.5px;color:var(--texto-2);line-height:1.65">' +
        'HTML, CSS e JavaScript puros, sem framework nem CDN.<br>' +
        'Service Worker para uso offline.<br>' +
        'Gerador de QR Code próprio, seguindo a ISO/IEC 18004.<br>' +
        'Validação de CPF pelos dígitos verificadores.' +
      '</div>' +
      '<h2 class="sec">Favoritos da Rede Amiga</h2>' +
      '<button class="btn cheio vazio" id="sb-fav">Ver parceiros favoritos (' + Store.e.favoritos.length + ')</button>';
    $('#sb-fav').addEventListener('click', verFavoritos);
  }
  RENDER.sobre = renderSobre;

  function verFavoritos() {
    var favs = DB.parceiros.filter(function (p) { return Store.e.favoritos.indexOf(p.id) >= 0; });
    Folha.abrir('<h2 style="font-size:19px;font-weight:750;margin-bottom:14px">Parceiros favoritos</h2>' +
      (favs.length ? '<div class="itens">' + favs.map(cardParceiro).join('') + '</div>'
        : '<div class="vazio"><div class="ico">♡</div><p>Você ainda não salvou nenhum parceiro.<br>Toque no coração dentro de um parceiro da Rede Amiga.</p></div>') +
      '<button class="btn cheio neutro" style="margin-top:18px" data-fechar>Fechar</button>');
    ligarParceiros($('#folha-conteudo'));
  }

  function confirmarSaida() {
    Folha.abrir(
      '<h2 style="font-size:19px;font-weight:750;margin-bottom:6px">Apagar dados e sair</h2>' +
      '<p style="color:var(--texto-2);font-size:14.5px;line-height:1.6;margin-bottom:20px">' +
      'Isso remove sua carteirinha, favoritos, agenda, registros de peso e alertas deste aparelho. Não dá para desfazer.</p>' +
      '<button class="btn cheio" id="sair-sim" style="background:var(--vermelho)">Apagar tudo</button>' +
      '<button class="btn cheio neutro" style="margin-top:9px" data-fechar>Cancelar</button>'
    );
    $('#sair-sim').addEventListener('click', function () {
      Store.limpar(); Folha.fechar(); pararContagem();
      $('#app').hidden = true;
      $('#entrada').classList.add('on');
      irPasso(1);
      toast('Dados apagados.');
    });
  }

  /* ==========================================================================
     Onboarding
     ========================================================================== */
  var rascunho = {};

  function irPasso(n) {
    $$('.passo').forEach(function (p) { p.classList.remove('on'); });
    var el = $('#passo-' + n);
    if (el) el.classList.add('on');
    $('#entrada').scrollTop = 0;
  }

  function montarEntrada() {
    $('#f-uf').innerHTML = DB.ufs.map(function (u) { return '<option' + (u === 'SP' ? ' selected' : '') + '>' + u + '</option>'; }).join('');
    $('#f-sexo').innerHTML = DB.sexos.map(function (s) { return '<option>' + esc(s) + '</option>'; }).join('');
    $('#f-cirurgia').innerHTML = DB.tiposCirurgia.map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('');

    ligarMascara('#f-cpf', mascaraCPF);
    ligarMascara('#f-tel', mascaraTelefone);

    $$('[data-ir]').forEach(function (b) {
      b.addEventListener('click', function () { limparErros(); irPasso(b.dataset.ir); });
    });

    $('#entrada').addEventListener('input', function (ev) {
      var campo = ev.target.closest && ev.target.closest('.campo.erro');
      if (campo) campo.classList.remove('erro');
    });

    $('#btn-demo').addEventListener('click', function () {
      Store.e.perfil = JSON.parse(JSON.stringify(DB.perfilDemo));
      Store.salvar(); abrirApp();
      toast('Perfil de demonstração carregado.');
    });

    $('#form-1').addEventListener('submit', function (ev) {
      ev.preventDefault();
      limparErros();
      var nome = $('#f-nome').value.trim(), email = $('#f-email').value.trim();
      var nasc = $('#f-nasc').value, cpf = $('#f-cpf').value.trim();
      var tel = $('#f-tel').value.trim(), cidade = $('#f-cidade').value.trim();

      if (nome.split(/\s+/).length < 2) return erro('#f-nome', 'Informe nome e sobrenome.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return erro('#f-email', 'E-mail inválido.');
      if (!nasc) return erro('#f-nasc', 'Informe a data de nascimento.');
      var a = idade(nasc);
      if (a === null || a < 0) return erro('#f-nasc', 'Data de nascimento inválida.');
      if (a < 16) return erro('#f-nasc', 'É preciso ter ao menos 16 anos.');
      if (a > 110) return erro('#f-nasc', 'Confira a data de nascimento.');
      if (!cpfValido(cpf)) return erro('#f-cpf', 'CPF inválido — confira os números.');
      if (soDigitos(tel).length < 10) return erro('#f-tel', 'Telefone incompleto.');
      if (!cidade) return erro('#f-cidade', 'Informe a cidade.');

      rascunho = { nome: nome, email: email, nascimento: nasc, sexo: $('#f-sexo').value,
        cpf: mascaraCPF(cpf), telefone: mascaraTelefone(tel), cidade: cidade, uf: $('#f-uf').value };
      irPasso(3);
    });

    $('#form-2').addEventListener('submit', function (ev) {
      ev.preventDefault();
      limparErros();
      var mes = $('#f-mes').value, cirurgiao = $('#f-cirurgiao').value.trim();
      var alt = parseInt($('#f-alt').value, 10) || null;
      var pi = parseFloat($('#f-pi').value) || null;
      var pa = parseFloat($('#f-pa').value) || null;

      if (!mes) return erro('#f-mes', 'Informe o mês da cirurgia.');
      if (mes > hoje().slice(0, 7)) return erro('#f-mes', 'A cirurgia não pode ser futura.');
      if (rascunho.nascimento && mes < rascunho.nascimento.slice(0, 7)) return erro('#f-mes', 'A cirurgia não pode ser anterior ao nascimento.');
      if (!cirurgiao) return erro('#f-cirurgiao', 'Informe o cirurgião responsável.');
      if (alt && (alt < 100 || alt > 250)) return erro('#f-alt', 'Altura fora do intervalo esperado.');

      rascunho.cirurgia = $('#f-cirurgia').value;
      rascunho.mesCirurgia = mesBR(mes);
      rascunho.altura = alt; rascunho.pesoInicial = pi; rascunho.peso = pa;
      rascunho.cirurgiao = cirurgiao;
      rascunho.crm = $('#f-crm').value.trim() || '—';
      rascunho.hospital = $('#f-hosp').value.trim();
      irPasso(4);
    });

    /* ---- passo da foto ---- */
    $('#f-foto').addEventListener('change', function (ev) {
      var arq = ev.target.files && ev.target.files[0];
      if (!arq) return;
      if (!/^image\//.test(arq.type)) return toast('Escolha um arquivo de imagem.');
      if (arq.size > 8 * 1024 * 1024) return toast('Escolha uma imagem de até 8 MB.');
      var l = new FileReader();
      l.onload = function () {
        redimensionar(l.result, 420, function (uri) {
          rascunho.foto = uri;
          $('#previa-foto').innerHTML = '<img src="' + uri + '" alt="Prévia da sua foto">';
          $('#f-foto-limpar').hidden = false;
          toast('Foto escolhida.');
        });
      };
      l.onerror = function () { toast('Não foi possível ler a imagem.'); };
      l.readAsDataURL(arq);
    });

    $('#f-foto-limpar').addEventListener('click', function () {
      rascunho.foto = null;
      $('#previa-foto').innerHTML = '<span>Sem foto</span>';
      $('#f-foto').value = '';
      this.hidden = true;
    });

    $('#f-concluir').addEventListener('click', function () {
      Store.e.perfil = {
        nome: rascunho.nome, email: rascunho.email, cpf: rascunho.cpf,
        nascimento: rascunho.nascimento, sexo: rascunho.sexo, telefone: rascunho.telefone,
        cidade: rascunho.cidade, uf: rascunho.uf, foto: rascunho.foto || null,
        jaFezCirurgia: true,
        peso: rascunho.peso, altura: rascunho.altura, pesoInicial: rascunho.pesoInicial,
        cirurgia: rascunho.cirurgia, mesCirurgia: rascunho.mesCirurgia,
        hospital: rascunho.hospital,
        hospitalCidade: rascunho.cidade + ' – ' + rascunho.uf,
        cirurgiao: rascunho.cirurgiao, crm: rascunho.crm,
        status: 'pendente', validadaEm: null
      };
      Store.salvar(); abrirApp(); Nav.abrir('carteirinha');
      toast('Cadastro enviado para o seu cirurgião.');
    });
  }

  /* ==========================================================================
     Boot
     ========================================================================== */
  function montarFiltros() {
    $('#chips-categoria').innerHTML = DB.categorias.map(function (c) {
      return '<button class="chip' + (c.id === 'todos' ? ' on' : '') + '" data-cat="' + c.id + '">' + c.icone + ' ' + esc(c.rotulo) + '</button>';
    }).join('');
    $$('[data-cat]').forEach(function (b) {
      b.addEventListener('click', function () {
        filtroCategoria = b.dataset.cat;
        $$('[data-cat]').forEach(function (x) { x.classList.toggle('on', x === b); });
        renderRede();
      });
    });

    $('#chips-local').innerHTML = FILTROS_LOCAL.map(function (f) {
      return '<button class="chip' + (f.id === 'todos' ? ' on' : '') + '" data-fl="' + f.id + '">' + esc(f.rot) + '</button>';
    }).join('');
    $$('[data-fl]').forEach(function (b) {
      b.addEventListener('click', function () {
        filtroLocal = b.dataset.fl;
        $$('[data-fl]').forEach(function (x) { x.classList.toggle('on', x === b); });
        renderLocais();
      });
    });
  }

  function ligarEventos() {
    $$('#tabbar [data-aba]').forEach(function (b) {
      b.addEventListener('click', function () { Nav.ir(b.dataset.aba); });
    });
    $('#btn-voltar').addEventListener('click', function () { Nav.voltar(); });
    $('#btn-sino').addEventListener('click', function () { Nav.abrir('novidades'); });
    $('#card-perfil').addEventListener('click', function () { Nav.abrir('dados'); });

    $$('[data-abrir]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.dataset.abrir === 'sair') confirmarSaida();
        else Nav.abrir(b.dataset.abrir);
      });
    });

    $('#busca-parceiro').addEventListener('input', renderRede);
    $('#busca-local').addEventListener('input', renderListaLocais);
    $('#busca-midia').addEventListener('input', renderMidias);
    $$('.segmentado [data-vista]').forEach(function (b) {
      b.addEventListener('click', function () { vistaLocal = b.dataset.vista; renderLocais(); });
    });
    $('#btn-baricast').addEventListener('click', function () {
      Folha.abrir('<div style="text-align:center;padding:6px 0 4px">' +
        '<div style="width:64px;height:64px;border-radius:50%;background:var(--azul-vivo);margin:0 auto 14px;' +
        'display:grid;place-items:center"><svg viewBox="0 0 24 24" style="width:32px;height:32px;fill:#fff">' +
        '<use href="#i-mic"/></svg></div>' +
        '<h2 style="font-size:21px;font-weight:780">BariCast</h2>' +
        '<p style="color:var(--texto-2);font-size:14.5px;line-height:1.6;margin-top:8px">' +
        'O podcast do paciente bariátrico, com episódios sobre alimentação, atividade física, ' +
        'saúde mental e histórias de quem já passou pela cirurgia.</p>' +
        '<p style="color:var(--texto-3);font-size:12.5px;margin-top:14px">' +
        'Nesta réplica acadêmica o player é apenas ilustrativo.</p></div>' +
        '<button class="btn cheio neutro" style="margin-top:18px" data-fechar>Fechar</button>');
    });

    $$('#abas-midias button').forEach(function (b) {
      b.addEventListener('click', function () {
        filtroMidia = b.dataset.tipo;
        $$('#abas-midias button').forEach(function (x) { x.classList.toggle('on', x === b); });
        renderMidias();
      });
    });

    $('#folha-fundo').addEventListener('click', Folha.fechar);
    $('#folha-conteudo').addEventListener('click', function (ev) {
      if (ev.target.closest('[data-fechar]')) Folha.fechar();
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') { if ($('#folha').classList.contains('on')) Folha.fechar(); else Nav.voltar(); }
    });
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && Nav.atual() === 'carteirinha') { pintarContagem(); iniciarContagem(); }
      else pararContagem();
    });
  }

  function abrirApp() {
    $('#entrada').classList.remove('on');
    $('#app').hidden = false;
    novoToken();
    Nav.ir('inicio');
  }

  function iniciar() {
    Store.carregar();
    montarEntrada();
    montarFiltros();
    ligarEventos();

    if (Store.e.perfil) abrirApp();
    else { $('#app').hidden = true; $('#entrada').classList.add('on'); irPasso(1); }

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('sw.js').catch(function () {});
      });
    }
  }

  document.addEventListener('DOMContentLoaded', iniciar);
})();
