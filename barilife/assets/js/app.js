/* ============================================================================
   app.js — Replica academica do Barilife
   Organizacao: Store · Utilitarios · UI base · Onboarding · Telas · Boot
   ========================================================================== */
(function () {
  'use strict';

  var $  = function (s, ctx) { return (ctx || document).querySelector(s); };
  var $$ = function (s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); };

  /* ==========================================================================
     Store — tudo persiste em localStorage, nada sai do dispositivo
     ========================================================================== */
  var CHAVE = 'barilife.v1';
  var Store = {
    estado: null,

    padrao: function () {
      return {
        perfil: null,
        favoritos: [],
        lembretes: JSON.parse(JSON.stringify(DB.lembretesPadrao)),
        agua: { data: hoje(), ml: 0, meta: 1800, copo: 200 },
        bannerInstalar: true
      };
    },

    carregar: function () {
      try {
        var bruto = localStorage.getItem(CHAVE);
        this.estado = bruto ? JSON.parse(bruto) : this.padrao();
      } catch (e) {
        this.estado = this.padrao();
      }
      // zera o contador de agua quando vira o dia
      if (!this.estado.agua || this.estado.agua.data !== hoje()) {
        this.estado.agua = Object.assign({ meta: 1800, copo: 200 }, this.estado.agua, { data: hoje(), ml: 0 });
      }
      return this.estado;
    },

    salvar: function () {
      try { localStorage.setItem(CHAVE, JSON.stringify(this.estado)); }
      catch (e) { toast('Não foi possível salvar neste navegador.'); }
    },

    limpar: function () {
      try { localStorage.removeItem(CHAVE); } catch (e) {}
      this.estado = this.padrao();
    }
  };

  /* ==========================================================================
     Utilitarios
     ========================================================================== */
  var MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

  function hoje() { return new Date().toISOString().slice(0, 10); }

  function dataBR(iso) {
    if (!iso) return '—';
    var p = String(iso).slice(0, 10).split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso;
  }

  function diasDesde(iso) {
    if (!iso) return 0;
    var d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return 0;
    return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
  }

  /* "1 ano e 5 meses" a partir da data da cirurgia */
  function tempoPos(iso) {
    var dias = diasDesde(iso);
    var anos = Math.floor(dias / 365);
    var meses = Math.floor((dias % 365) / 30);
    if (anos === 0 && meses === 0) return dias + (dias === 1 ? ' dia' : ' dias');
    if (anos === 0) return meses + (meses === 1 ? ' mês' : ' meses');
    var txt = anos + (anos === 1 ? ' ano' : ' anos');
    return meses ? txt + ' e ' + meses + (meses === 1 ? ' mês' : ' meses') : txt;
  }

  /* "Sleeve (Gastrectomia Vertical)" -> "Sleeve", para caber na carteirinha */
  function cirurgiaCurta(nome) {
    return String(nome || '').split(' (')[0].replace(' Gástrico', '').trim() || '—';
  }

  function iniciais(nome) {
    var p = String(nome || '?').trim().split(/\s+/);
    return ((p[0] || '')[0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
  }

  /* Numero de carteirinha deterministico a partir do nome + data */
  function gerarMatricula(nome, data) {
    var base = String(nome || '') + '|' + String(data || '');
    var h = 0;
    for (var i = 0; i < base.length; i++) { h = ((h << 5) - h + base.charCodeAt(i)) | 0; }
    var num = String(Math.abs(h) % 1000000).padStart(6, '0');
    return 'BL-' + (String(data || hoje()).slice(0, 4)) + '-' + num;
  }

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

  /* ==========================================================================
     UI base — toast, folha deslizante, navegacao
     ========================================================================== */
  var tempoToast;
  function toast(msg) {
    var el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('on');
    clearTimeout(tempoToast);
    tempoToast = setTimeout(function () { el.classList.remove('on'); }, 2400);
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

  var TITULOS = {
    carteirinha: ['Carteirinha', 'Paciente bariátrico'],
    descontos:   ['Descontos', 'Rede de parceiros credenciados'],
    medicos:     ['Profissionais', 'Cirurgiões e equipe multidisciplinar'],
    conteudo:    ['Conteúdo', 'Dicas, receitas e artigos'],
    lembretes:   ['Lembretes', 'Vitaminas, água e consultas'],
    perfil:      ['Perfil', 'Seus dados e preferências']
  };

  function irPara(tela) {
    $$('.tela').forEach(function (s) { s.classList.remove('on'); });
    var alvo = $('#t-' + tela);
    if (alvo) alvo.classList.add('on');

    $$('#tabbar button').forEach(function (b) {
      b.classList.toggle('on', b.dataset.tela === tela);
    });

    var t = TITULOS[tela] || ['Barilife', ''];
    $('#tit').textContent = t[0];
    $('#sub').textContent = t[1];
    $('#btn-voltar').hidden = tela !== 'perfil';
    $('#btn-perfil').hidden = tela === 'perfil';
    $('main').scrollTop = 0;
    Folha.fechar();
  }

  /* ==========================================================================
     Onboarding
     ========================================================================== */
  var rascunho = {};

  function irPasso(n) {
    $$('.passo').forEach(function (p) { p.classList.remove('on'); });
    var el = $('#passo-' + n);
    if (el) el.classList.add('on');
    $('#tela-entrada').scrollTop = 0;
  }

  function montarOnboarding() {
    $('#f-uf').innerHTML = DB.ufs.map(function (u) {
      return '<option' + (u === 'SP' ? ' selected' : '') + '>' + u + '</option>';
    }).join('');
    $('#f-cirurgia').innerHTML = DB.tiposCirurgia.map(function (c) {
      return '<option>' + esc(c) + '</option>';
    }).join('');

    $$('[data-ir]').forEach(function (b) {
      b.addEventListener('click', function () { irPasso(b.dataset.ir); });
    });

    $('#btn-demo').addEventListener('click', function () {
      Store.estado.perfil = JSON.parse(JSON.stringify(DB.demoPerfil));
      Store.salvar();
      abrirApp();
      toast('Perfil de demonstração carregado.');
    });

    $('#form-1').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var nome = $('#f-nome').value.trim();
      var email = $('#f-email').value.trim();
      var cidade = $('#f-cidade').value.trim();
      if (nome.split(/\s+/).length < 2) return toast('Informe nome e sobrenome.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast('E-mail inválido.');
      if (!cidade) return toast('Informe a cidade.');
      rascunho.nome = nome; rascunho.email = email;
      rascunho.cidade = cidade; rascunho.uf = $('#f-uf').value;
      irPasso(3);
    });

    $('#form-2').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var data = $('#f-data').value;
      var cirurgiao = $('#f-cirurgiao').value.trim();
      if (!data) return toast('Informe a data da cirurgia.');
      if (data > hoje()) return toast('A data da cirurgia não pode ser futura.');
      if (!cirurgiao) return toast('Informe o cirurgião responsável.');

      var emissao = hoje();
      var val = new Date(); val.setFullYear(val.getFullYear() + 3);

      Store.estado.perfil = {
        nome: rascunho.nome, email: rascunho.email,
        cidade: rascunho.cidade, uf: rascunho.uf,
        cirurgia: $('#f-cirurgia').value,
        dataCirurgia: data,
        cirurgiao: cirurgiao,
        crm: $('#f-crm').value.trim() || '—',
        hospital: $('#f-hospital').value.trim() || '—',
        matricula: gerarMatricula(rascunho.nome, data),
        emissao: emissao,
        validade: val.toISOString().slice(0, 10),
        foto: null, pesoInicial: null, pesoAtual: null, altura: null
      };
      Store.salvar();
      abrirApp();
      toast('Carteirinha gerada com sucesso.');
    });
  }

  /* ==========================================================================
     Tela: Carteirinha
     ========================================================================== */
  function conteudoQR(p) {
    return 'https://barilife.org.br/validar?id=' + p.matricula +
           '&n=' + encodeURIComponent(p.nome) +
           '&c=' + encodeURIComponent(p.crm);
  }

  function svgQR(p, tamanho) {
    try {
      return QR.toSVG(conteudoQR(p), { size: tamanho, quiet: 2, dark: '#0B1F17' });
    } catch (e) {
      return '<div style="font-size:11px;color:#888;padding:8px">QR indisponível</div>';
    }
  }

  function avatarHTML(p, classe) {
    if (p.foto) return '<img class="avatar ' + (classe || '') + '" src="' + esc(p.foto) + '" alt="">';
    return '<div class="avatar ' + (classe || '') + '">' + esc(iniciais(p.nome)) + '</div>';
  }

  function renderCarteirinha() {
    var p = Store.estado.perfil;

    $('#carteira').innerHTML =
      '<div class="topo">' +
        '<div class="logo"><svg viewBox="0 0 24 24"><use href="#i-selo"/></svg>Barilife</div>' +
        '<span class="selo-val"><i></i>Validada</span>' +
      '</div>' +
      '<div class="id">' + avatarHTML(p) +
        '<div><div class="nome">' + esc(p.nome) + '</div>' +
        '<div class="sub">' + esc(p.cidade) + (p.uf && p.uf !== '—' ? ' · ' + esc(p.uf) : '') + '</div></div>' +
      '</div>' +
      '<div class="grade">' +
        campo('Cirurgia', cirurgiaCurta(p.cirurgia)) +
        campo('Data', dataBR(p.dataCirurgia)) +
        campo('Cirurgião(ã)', p.cirurgiao) +
        campo('CRM', p.crm) +
      '</div>' +
      '<div class="rodape">' +
        '<div><div class="mat">Nº da carteirinha</div><div class="num">' + esc(p.matricula) + '</div>' +
        '<div class="mat" style="margin-top:8px">Válida até ' + dataBR(p.validade) + '</div></div>' +
        '<div class="qr">' + svgQR(p, 64) + '</div>' +
      '</div>';

    function campo(rot, val) {
      return '<div><div class="rot">' + esc(rot) + '</div><div class="val">' + esc(val || '—') + '</div></div>';
    }

    // metricas
    var dias = diasDesde(p.dataCirurgia);
    var perdido = (p.pesoInicial && p.pesoAtual) ? (p.pesoInicial - p.pesoAtual) : null;
    var imc = (p.pesoAtual && p.altura) ? (p.pesoAtual / (p.altura * p.altura)) : null;
    $('#metricas').innerHTML =
      metrica(dias, 'dias de pós-operatório') +
      metrica(perdido !== null ? '-' + perdido + '<span style="font-size:12px">kg</span>' : '—', 'peso eliminado') +
      metrica(imc ? imc.toFixed(1) : '—', 'IMC atual');

    function metrica(n, r) {
      return '<div class="metrica"><div class="n">' + n + '</div><div class="r">' + r + '</div></div>';
    }

    // proximo compromisso
    var prox = Store.estado.lembretes.filter(function (l) {
      return l.ativo && (l.tipo === 'consulta' || l.tipo === 'exame') && /\d{2}\/\d{2}\/\d{4}/.test(l.repete);
    }).sort(function (a, b) { return ordenaData(a.repete) - ordenaData(b.repete); })[0];

    if (prox) {
      var pd = prox.repete.split('/');
      $('#proximo').innerHTML =
        '<div class="proxima"><div class="data"><div class="d">' + pd[0] + '</div>' +
        '<div class="m">' + MESES[parseInt(pd[1], 10) - 1] + '</div></div>' +
        '<div class="txt"><div class="t">' + esc(prox.titulo) + '</div>' +
        '<div class="s">' + esc(DB.tiposLembrete[prox.tipo].rotulo) + ' · ' + esc(prox.hora) + '</div></div>' +
        '<span class="etiqueta">' + esc(DB.tiposLembrete[prox.tipo].emoji) + '</span></div>';
    } else {
      $('#proximo').innerHTML = '<div class="cartao" style="color:var(--texto-2);font-size:13.5px">' +
        'Nenhuma consulta ou exame agendado. Adicione um lembrete na aba <b>Lembretes</b>.</div>';
    }

    // destaques de desconto
    var top = DB.parceiros.slice().sort(function (a, b) { return b.desconto - a.desconto; }).slice(0, 3);
    $('#destaques').innerHTML = top.map(cardParceiro).join('');
    ligarParceiros($('#destaques'));

    renderBannerInstalar();
  }

  function ordenaData(br) {
    var p = String(br).split('/');
    return p.length === 3 ? new Date(p[2], p[1] - 1, p[0]).getTime() : Infinity;
  }

  function renderBannerInstalar() {
    var alvo = $('#banner-instalar');
    if (!Store.estado.bannerInstalar || instalado()) { alvo.innerHTML = ''; return; }
    var texto = ehIOS()
      ? 'Toque em <b>Compartilhar</b> e depois em <b>Adicionar à Tela de Início</b> para instalar o Barilife no seu iPhone.'
      : 'Use o menu do navegador e escolha <b>Instalar aplicativo</b> para deixar o Barilife na sua tela inicial.';
    alvo.innerHTML = '<div class="instalar"><span class="ico">📲</span>' +
      '<span class="txt">' + texto + '</span>' +
      '<button class="fechar" id="fechar-banner" aria-label="Dispensar">×</button></div>';
    $('#fechar-banner').addEventListener('click', function () {
      Store.estado.bannerInstalar = false; Store.salvar(); alvo.innerHTML = '';
    });
  }

  function abrirQRGrande() {
    var p = Store.estado.perfil;
    Folha.abrir(
      '<h2 style="font-size:19px;font-weight:750;margin-bottom:4px">Carteirinha ' + esc(p.matricula) + '</h2>' +
      '<p style="color:var(--texto-2);font-size:13.5px;margin-bottom:16px">Apresente este código ao estabelecimento parceiro para validar seu benefício.</p>' +
      '<div class="qr-grande"><div class="moldura">' + svgQR(p, 210) + '</div>' +
      '<div class="cod">' + esc(conteudoQR(p)) + '</div></div>' +
      '<button class="btn cheio neutro" style="margin-top:18px" data-fechar>Fechar</button>'
    );
  }

  function compartilhar() {
    var p = Store.estado.perfil;
    var texto = 'Carteirinha Barilife\n' + p.nome + '\n' + p.cirurgia +
                '\nRealizada em ' + dataBR(p.dataCirurgia) + '\nNº ' + p.matricula;
    if (navigator.share) {
      navigator.share({ title: 'Carteirinha Barilife', text: texto }).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(texto).then(function () { toast('Dados copiados.'); })
        .catch(function () { toast('Não foi possível copiar.'); });
    } else {
      toast('Compartilhamento indisponível neste navegador.');
    }
  }

  /* ==========================================================================
     Tela: Descontos
     ========================================================================== */
  var filtroCategoria = 'todos';

  function cardParceiro(p) {
    var cat = DB.categorias.filter(function (c) { return c.id === p.categoria; })[0] || { icone: '🏷️' };
    var fav = Store.estado.favoritos.indexOf(p.id) >= 0;
    var local = p.km ? p.bairro + ' · ' + p.km.toFixed(1) + ' km' : p.bairro;
    return '<button class="item" data-parceiro="' + p.id + '">' +
      '<span class="ico-box">' + cat.icone + '</span>' +
      '<span class="corpo"><span class="t">' + esc(p.nome) + '</span>' +
      '<span class="s">' + esc(p.regra) + '</span>' +
      '<span class="meta">📍 ' + esc(local) + ' <span class="estrela">★ ' + p.nota.toFixed(1) + '</span>' +
      (fav ? ' <span class="favorito on">♥</span>' : '') + '</span></span>' +
      '<span class="direita"><span class="desconto">' + p.desconto + '<small>%</small></span>' +
      '<span style="font-size:10px;color:var(--texto-3);font-weight:600">OFF</span></span></button>';
  }

  function renderDescontos() {
    var termo = semAcento($('#busca-parceiro').value);
    var itens = DB.parceiros.filter(function (p) {
      if (filtroCategoria !== 'todos' && p.categoria !== filtroCategoria) return false;
      if (!termo) return true;
      return semAcento(p.nome + ' ' + p.bairro + ' ' + p.cidade + ' ' + p.regra).indexOf(termo) >= 0;
    }).sort(function (a, b) { return b.desconto - a.desconto; });

    $('#lista-parceiros').innerHTML = itens.length
      ? itens.map(cardParceiro).join('')
      : '<div class="vazio-msg"><span class="ico">🔍</span>Nenhum parceiro encontrado.<br>Tente outra busca ou categoria.</div>';
    ligarParceiros($('#lista-parceiros'));
  }

  function ligarParceiros(escopo) {
    $$('[data-parceiro]', escopo).forEach(function (b) {
      b.addEventListener('click', function () { abrirParceiro(b.dataset.parceiro); });
    });
  }

  function abrirParceiro(id) {
    var p = DB.parceiros.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    var cat = DB.categorias.filter(function (c) { return c.id === p.categoria; })[0] || { icone: '🏷️', rotulo: '' };
    var fav = Store.estado.favoritos.indexOf(id) >= 0;

    Folha.abrir(
      '<div style="display:flex;align-items:flex-start;gap:13px;margin-bottom:16px">' +
        '<div class="ico-box" style="width:52px;height:52px;font-size:24px">' + cat.icone + '</div>' +
        '<div style="flex:1;min-width:0"><h2 style="font-size:19px;font-weight:750;letter-spacing:-.4px;line-height:1.25">' + esc(p.nome) + '</h2>' +
        '<p style="color:var(--texto-2);font-size:13px;margin-top:3px">' + esc(cat.rotulo) + ' · ' + esc(p.bairro) + ', ' + esc(p.cidade) + '</p></div>' +
        '<button class="favorito ' + (fav ? 'on' : '') + '" id="fav-btn" style="font-size:23px" aria-label="Favoritar">' + (fav ? '♥' : '♡') + '</button>' +
      '</div>' +

      '<div class="cartao" style="background:var(--verde-cla);border-color:var(--verde);text-align:center;margin-bottom:16px">' +
        '<div style="font-size:34px;font-weight:850;color:var(--verde-esc);letter-spacing:-1.5px">' + p.desconto + '% OFF</div>' +
        '<div style="font-size:13px;color:var(--texto-2);margin-top:4px">' + esc(p.regra) + '</div>' +
      '</div>' +

      '<h3 class="secao-tit" style="margin-top:0">Como usar</h3>' +
      '<p style="font-size:14px;line-height:1.6;color:var(--texto-2)">' + esc(p.detalhe) + '</p>' +

      '<h3 class="secao-tit">Cupom</h3>' +
      '<button class="cartao" id="copiar-cupom" style="width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px">' +
        '<span style="font-size:19px;font-weight:800;letter-spacing:2px;color:var(--verde)">' + esc(p.cupom) + '</span>' +
        '<span style="font-size:12.5px;font-weight:650;color:var(--texto-2)">Copiar ⧉</span>' +
      '</button>' +

      '<div style="display:flex;gap:9px;margin-top:9px;font-size:12px;color:var(--texto-3)">' +
        '<span class="estrela">★ ' + p.nota.toFixed(1) + '</span>' +
        (p.km ? '<span>· ' + p.km.toFixed(1) + ' km de você</span>' : '') +
      '</div>' +

      '<button class="btn cheio" id="usar-cupom" style="margin-top:18px">Apresentar carteirinha</button>' +
      '<button class="btn cheio neutro" style="margin-top:9px" data-fechar>Fechar</button>'
    );

    $('#fav-btn').addEventListener('click', function () {
      var i = Store.estado.favoritos.indexOf(id);
      if (i >= 0) { Store.estado.favoritos.splice(i, 1); toast('Removido dos favoritos.'); }
      else { Store.estado.favoritos.push(id); toast('Salvo nos favoritos.'); }
      Store.salvar();
      this.classList.toggle('on');
      this.textContent = Store.estado.favoritos.indexOf(id) >= 0 ? '♥' : '♡';
      renderDescontos();
    });

    $('#copiar-cupom').addEventListener('click', function () {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(p.cupom)
          .then(function () { toast('Cupom ' + p.cupom + ' copiado.'); })
          .catch(function () { toast('Cupom: ' + p.cupom); });
      } else { toast('Cupom: ' + p.cupom); }
    });

    $('#usar-cupom').addEventListener('click', abrirQRGrande);
  }

  /* ==========================================================================
     Tela: Profissionais
     ========================================================================== */
  var filtroUF = 'todos';

  function renderMedicos() {
    var termo = semAcento($('#busca-medico').value);
    var itens = DB.profissionais.filter(function (m) {
      if (filtroUF !== 'todos' && m.uf !== filtroUF) return false;
      if (!termo) return true;
      return semAcento(m.nome + ' ' + m.esp + ' ' + m.cidade + ' ' + m.local).indexOf(termo) >= 0;
    }).sort(function (a, b) { return (b.meu ? 1 : 0) - (a.meu ? 1 : 0) || b.nota - a.nota; });

    $('#lista-medicos').innerHTML = itens.length
      ? itens.map(function (m) {
          return '<button class="item" data-medico="' + m.id + '">' +
            '<span class="ico-box" style="background:var(--verde);color:#fff;font-size:14px;font-weight:700">' + esc(iniciais(m.nome)) + '</span>' +
            '<span class="corpo"><span class="t">' + esc(m.nome) + (m.meu ? ' <span class="etiqueta">Meu cirurgião</span>' : '') + '</span>' +
            '<span class="s">' + esc(m.esp) + '</span>' +
            '<span class="meta">📍 ' + esc(m.cidade) + '/' + esc(m.uf) + ' <span class="estrela">★ ' + m.nota.toFixed(1) + '</span> <span>(' + m.avaliacoes + ')</span></span></span>' +
            '<span class="direita"><span style="font-size:18px">›</span></span></button>';
        }).join('')
      : '<div class="vazio-msg"><span class="ico">🩺</span>Nenhum profissional encontrado<br>com esses filtros.</div>';

    $$('[data-medico]').forEach(function (b) {
      b.addEventListener('click', function () { abrirMedico(b.dataset.medico); });
    });
  }

  function abrirMedico(id) {
    var m = DB.profissionais.filter(function (x) { return x.id === id; })[0];
    if (!m) return;
    Folha.abrir(
      '<div style="text-align:center;margin-bottom:18px">' +
        '<div class="avatar g" style="margin:0 auto 10px">' + esc(iniciais(m.nome)) + '</div>' +
        '<h2 style="font-size:20px;font-weight:750;letter-spacing:-.4px">' + esc(m.nome) + '</h2>' +
        '<p style="color:var(--texto-2);font-size:13.5px;margin-top:3px">' + esc(m.esp) + '</p>' +
        '<p style="color:var(--texto-3);font-size:12.5px;margin-top:2px">' + esc(m.crm) + '</p>' +
        '<div style="margin-top:9px"><span class="etiqueta">' + esc(m.titulo) + '</span></div>' +
      '</div>' +

      '<div class="metricas" style="margin-bottom:16px">' +
        '<div class="metrica"><div class="n">' + m.nota.toFixed(1) + '</div><div class="r">avaliação</div></div>' +
        '<div class="metrica"><div class="n">' + m.avaliacoes + '</div><div class="r">avaliações</div></div>' +
        '<div class="metrica"><div class="n">' + esc(m.uf) + '</div><div class="r">' + esc(m.cidade) + '</div></div>' +
      '</div>' +

      '<h3 class="secao-tit" style="margin-top:0">Local de atendimento</h3>' +
      '<div class="cartao"><div style="font-size:14.5px;font-weight:650">' + esc(m.local) + '</div>' +
      '<div style="font-size:13px;color:var(--texto-2);margin-top:3px">' + esc(m.cidade) + ' · ' + esc(m.uf) + '</div></div>' +

      '<h3 class="secao-tit">Formas de atendimento</h3>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        m.atende.map(function (a) { return '<span class="etiqueta">' + esc(a) + '</span>'; }).join('') +
      '</div>' +

      '<button class="btn cheio" id="agendar" style="margin-top:20px">Solicitar agendamento</button>' +
      '<button class="btn cheio neutro" style="margin-top:9px" data-fechar>Fechar</button>'
    );

    $('#agendar').addEventListener('click', function () { formAgendamento(m); });
  }

  function formAgendamento(m) {
    var min = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    Folha.abrir(
      '<h2 style="font-size:19px;font-weight:750;margin-bottom:4px">Solicitar agendamento</h2>' +
      '<p style="color:var(--texto-2);font-size:13.5px;margin-bottom:18px">Com ' + esc(m.nome) + ' · ' + esc(m.local) + '</p>' +
      '<div class="campo"><label for="ag-data">Data desejada</label><input id="ag-data" type="date" min="' + min + '" value="' + min + '"></div>' +
      '<div class="campo"><label for="ag-hora">Horário</label><input id="ag-hora" type="time" value="14:30"></div>' +
      '<button class="btn cheio" id="ag-confirmar">Confirmar solicitação</button>' +
      '<button class="btn cheio neutro" style="margin-top:9px" data-fechar>Cancelar</button>'
    );

    $('#ag-confirmar').addEventListener('click', function () {
      var d = $('#ag-data').value, h = $('#ag-hora').value;
      if (!d) return toast('Escolha uma data.');
      Store.estado.lembretes.push({
        id: 'l' + Date.now(),
        titulo: 'Consulta com ' + m.nome.split(' ').slice(0, 2).join(' '),
        tipo: 'consulta', hora: h || '09:00', ativo: true, repete: dataBR(d)
      });
      Store.salvar();
      Folha.fechar();
      renderLembretes();
      renderCarteirinha();
      toast('Agendamento solicitado e lembrete criado.');
    });
  }

  /* ==========================================================================
     Tela: Conteudo
     ========================================================================== */
  var filtroConteudo = 'todos';

  function renderConteudo() {
    var itens = DB.conteudos.filter(function (c) {
      return filtroConteudo === 'todos' || c.tipo === filtroConteudo;
    });
    var rotulos = { dica: 'Dica', receita: 'Receita', artigo: 'Artigo', video: 'Vídeo' };

    $('#lista-conteudo').innerHTML = itens.map(function (c) {
      return '<button class="post" data-post="' + c.id + '">' +
        '<span class="capa" style="background:' + c.cor + '22;color:' + c.cor + '">' + c.emoji + '</span>' +
        '<span class="txt"><span class="t">' + esc(c.titulo) + '</span>' +
        '<span class="s">' + esc(c.resumo) + '</span>' +
        '<span class="meta"><span class="etiqueta">' + rotulos[c.tipo] + '</span> ' + esc(c.tempo) + '</span></span></button>';
    }).join('');

    $$('[data-post]').forEach(function (b) {
      b.addEventListener('click', function () { abrirPost(b.dataset.post); });
    });
  }

  function abrirPost(id) {
    var c = DB.conteudos.filter(function (x) { return x.id === id; })[0];
    if (!c) return;
    Folha.abrir(
      '<div class="leitura-capa" style="background:' + c.cor + '22;color:' + c.cor + '">' + c.emoji + '</div>' +
      '<h2 style="font-size:21px;font-weight:780;letter-spacing:-.6px;line-height:1.25;margin-bottom:6px">' + esc(c.titulo) + '</h2>' +
      '<p style="color:var(--texto-3);font-size:12.5px;margin-bottom:16px">' + esc(c.tempo) + ' de leitura</p>' +
      '<div class="leitura">' + esc(c.texto) + '</div>' +
      '<button class="btn cheio neutro" style="margin-top:22px" data-fechar>Fechar</button>'
    );
  }

  /* ==========================================================================
     Tela: Lembretes e hidratacao
     ========================================================================== */
  function renderAgua() {
    var a = Store.estado.agua;
    var pct = Math.min(100, Math.round((a.ml / a.meta) * 100));
    var raio = 38, circ = 2 * Math.PI * raio;

    $('#agua').innerHTML =
      '<div class="anel"><svg viewBox="0 0 92 92">' +
        '<circle class="trilho" cx="46" cy="46" r="' + raio + '"/>' +
        '<circle class="barra" cx="46" cy="46" r="' + raio + '" stroke-dasharray="' + circ + '" ' +
          'stroke-dashoffset="' + (circ * (1 - pct / 100)) + '"/>' +
      '</svg><div class="centro"><div><div class="n">' + pct + '%</div><div class="u">da meta</div></div></div></div>' +
      '<div class="lado"><div class="t">' + a.ml + ' ml de ' + a.meta + ' ml</div>' +
      '<div class="s">Beba em pequenos goles ao longo do dia e evite líquidos 30 min antes e depois das refeições.</div>' +
      '<div class="botoes"><button class="menos" id="agua-menos">− ' + a.copo + ' ml</button>' +
      '<button id="agua-mais">+ ' + a.copo + ' ml</button></div></div>';

    $('#agua-mais').addEventListener('click', function () {
      a.ml += a.copo; Store.salvar(); renderAgua();
      if (a.ml >= a.meta) toast('Meta de hidratação atingida! 💧');
    });
    $('#agua-menos').addEventListener('click', function () {
      a.ml = Math.max(0, a.ml - a.copo); Store.salvar(); renderAgua();
    });
  }

  function renderLembretes() {
    renderAgua();
    var ls = Store.estado.lembretes;

    $('#lista-lembretes').innerHTML = ls.length ? ls.map(function (l) {
      var t = DB.tiposLembrete[l.tipo] || DB.tiposLembrete.outro;
      return '<div class="item">' +
        '<span class="ico-box" style="background:' + t.cor + '22">' + t.emoji + '</span>' +
        '<span class="corpo"><span class="t"' + (l.ativo ? '' : ' style="opacity:.5"') + '>' + esc(l.titulo) + '</span>' +
        '<span class="meta">🕘 ' + esc(l.hora) + ' · ' + esc(l.repete) + '</span></span>' +
        '<span class="direita" style="flex-direction:row;align-items:center;gap:8px">' +
        '<button class="chave ' + (l.ativo ? 'on' : '') + '" data-toggle="' + l.id + '" aria-label="Ativar lembrete"></button>' +
        '<button data-remove="' + l.id + '" aria-label="Remover" style="color:var(--texto-3);font-size:17px;padding:0 2px">×</button>' +
        '</span></div>';
    }).join('') : '<div class="vazio-msg"><span class="ico">🔔</span>Nenhum lembrete cadastrado.</div>';

    $$('[data-toggle]').forEach(function (b) {
      b.addEventListener('click', function () {
        var l = ls.filter(function (x) { return x.id === b.dataset.toggle; })[0];
        if (!l) return;
        l.ativo = !l.ativo; Store.salvar(); renderLembretes(); renderCarteirinha();
      });
    });
    $$('[data-remove]').forEach(function (b) {
      b.addEventListener('click', function () {
        Store.estado.lembretes = ls.filter(function (x) { return x.id !== b.dataset.remove; });
        Store.salvar(); renderLembretes(); renderCarteirinha();
        toast('Lembrete removido.');
      });
    });
  }

  function formLembrete() {
    Folha.abrir(
      '<h2 style="font-size:19px;font-weight:750;margin-bottom:16px">Novo lembrete</h2>' +
      '<div class="campo"><label for="nl-titulo">Título</label><input id="nl-titulo" placeholder="Ex.: Vitamina D"></div>' +
      '<div class="campo"><label for="nl-tipo">Tipo</label><select id="nl-tipo">' +
        Object.keys(DB.tiposLembrete).map(function (k) {
          return '<option value="' + k + '">' + DB.tiposLembrete[k].emoji + ' ' + DB.tiposLembrete[k].rotulo + '</option>';
        }).join('') + '</select></div>' +
      '<div class="dupla">' +
        '<div class="campo"><label for="nl-hora">Horário</label><input id="nl-hora" type="time" value="08:00"></div>' +
        '<div class="campo"><label for="nl-repete">Repetição</label><select id="nl-repete">' +
          '<option>Todos os dias</option><option>Dias úteis</option><option>Uma vez por semana</option>' +
        '</select></div>' +
      '</div>' +
      '<button class="btn cheio" id="nl-salvar">Salvar lembrete</button>' +
      '<button class="btn cheio neutro" style="margin-top:9px" data-fechar>Cancelar</button>'
    );

    $('#nl-salvar').addEventListener('click', function () {
      var titulo = $('#nl-titulo').value.trim();
      if (!titulo) return toast('Dê um título ao lembrete.');
      Store.estado.lembretes.push({
        id: 'l' + Date.now(), titulo: titulo, tipo: $('#nl-tipo').value,
        hora: $('#nl-hora').value || '08:00', ativo: true, repete: $('#nl-repete').value
      });
      Store.salvar(); Folha.fechar(); renderLembretes();
      toast('Lembrete criado.');
    });
  }

  /* ==========================================================================
     Tela: Perfil
     ========================================================================== */
  function renderPerfil() {
    var p = Store.estado.perfil;
    var foto = $('#perfil-foto');
    foto.innerHTML = p.foto ? '<img src="' + esc(p.foto) + '" alt="" style="width:100%;height:100%;object-fit:cover">' : esc(iniciais(p.nome));
    $('#perfil-nome').textContent = p.nome;
    $('#perfil-sub').textContent = p.cirurgia + ' · ' + tempoPos(p.dataCirurgia) + ' de pós-operatório';
    $('#btn-perfil').innerHTML = p.foto
      ? '<img src="' + esc(p.foto) + '" alt="" style="width:100%;height:100%;object-fit:cover">'
      : esc(iniciais(p.nome));
  }

  function formDados() {
    var p = Store.estado.perfil;
    Folha.abrir(
      '<h2 style="font-size:19px;font-weight:750;margin-bottom:16px">Meus dados</h2>' +
      '<div class="campo"><label for="d-nome">Nome completo</label><input id="d-nome" value="' + esc(p.nome) + '"></div>' +
      '<div class="dupla">' +
        '<div class="campo"><label for="d-cidade">Cidade</label><input id="d-cidade" value="' + esc(p.cidade) + '"></div>' +
        '<div class="campo"><label for="d-uf">UF</label><select id="d-uf">' +
          DB.ufs.map(function (u) { return '<option' + (u === p.uf ? ' selected' : '') + '>' + u + '</option>'; }).join('') +
        '</select></div>' +
      '</div>' +
      '<div class="campo"><label for="d-cirurgia">Cirurgia</label><select id="d-cirurgia">' +
        DB.tiposCirurgia.map(function (c) { return '<option' + (c === p.cirurgia ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') +
      '</select></div>' +
      '<div class="campo"><label for="d-data">Data da cirurgia</label><input id="d-data" type="date" value="' + esc(p.dataCirurgia) + '"></div>' +
      '<div class="campo"><label for="d-cirurgiao">Cirurgião(ã)</label><input id="d-cirurgiao" value="' + esc(p.cirurgiao) + '"></div>' +
      '<div class="dupla">' +
        '<div class="campo"><label for="d-crm">CRM</label><input id="d-crm" value="' + esc(p.crm) + '"></div>' +
        '<div class="campo"><label for="d-hospital">Hospital</label><input id="d-hospital" value="' + esc(p.hospital || '') + '"></div>' +
      '</div>' +
      '<h3 class="secao-tit" style="margin-top:4px">Acompanhamento (opcional)</h3>' +
      '<div class="dupla">' +
        '<div class="campo"><label for="d-pi">Peso inicial (kg)</label><input id="d-pi" type="number" step="0.1" value="' + (p.pesoInicial || '') + '"></div>' +
        '<div class="campo"><label for="d-pa">Peso atual (kg)</label><input id="d-pa" type="number" step="0.1" value="' + (p.pesoAtual || '') + '"></div>' +
      '</div>' +
      '<div class="campo"><label for="d-alt">Altura (m)</label><input id="d-alt" type="number" step="0.01" value="' + (p.altura || '') + '"><div class="ajuda">Usada só para calcular o IMC exibido na carteirinha.</div></div>' +
      '<button class="btn cheio" id="d-salvar">Salvar alterações</button>' +
      '<button class="btn cheio neutro" style="margin-top:9px" data-fechar>Cancelar</button>'
    );

    $('#d-salvar').addEventListener('click', function () {
      var nome = $('#d-nome').value.trim();
      if (!nome) return toast('O nome não pode ficar vazio.');
      var data = $('#d-data').value || p.dataCirurgia;
      if (data > hoje()) return toast('A data da cirurgia não pode ser futura.');

      p.nome = nome;
      p.cidade = $('#d-cidade').value.trim() || p.cidade;
      p.uf = $('#d-uf').value;
      p.cirurgia = $('#d-cirurgia').value;
      p.dataCirurgia = data;
      p.cirurgiao = $('#d-cirurgiao').value.trim() || p.cirurgiao;
      p.crm = $('#d-crm').value.trim() || p.crm;
      p.hospital = $('#d-hospital').value.trim();
      p.pesoInicial = parseFloat($('#d-pi').value) || null;
      p.pesoAtual = parseFloat($('#d-pa').value) || null;
      p.altura = parseFloat($('#d-alt').value) || null;
      p.matricula = gerarMatricula(p.nome, p.dataCirurgia);

      Store.salvar(); Folha.fechar();
      renderCarteirinha(); renderPerfil();
      toast('Dados atualizados.');
    });
  }

  function verFavoritos() {
    var favs = DB.parceiros.filter(function (p) { return Store.estado.favoritos.indexOf(p.id) >= 0; });
    Folha.abrir(
      '<h2 style="font-size:19px;font-weight:750;margin-bottom:14px">Parceiros favoritos</h2>' +
      (favs.length
        ? '<div class="lista">' + favs.map(cardParceiro).join('') + '</div>'
        : '<div class="vazio-msg"><span class="ico">♡</span>Você ainda não salvou nenhum parceiro.<br>Toque no coração dentro de um parceiro.</div>') +
      '<button class="btn cheio neutro" style="margin-top:18px" data-fechar>Fechar</button>'
    );
    ligarParceiros($('#folha-conteudo'));
  }

  function formMeta() {
    var a = Store.estado.agua;
    Folha.abrir(
      '<h2 style="font-size:19px;font-weight:750;margin-bottom:4px">Meta diária de água</h2>' +
      '<p style="color:var(--texto-2);font-size:13.5px;margin-bottom:18px">Confirme com sua equipe. No pós-bariátrico a meta costuma ficar entre 1.500 ml e 2.000 ml por dia.</p>' +
      '<div class="campo"><label for="mt-meta">Meta (ml)</label><input id="mt-meta" type="number" min="500" max="5000" step="100" value="' + a.meta + '"></div>' +
      '<div class="campo"><label for="mt-copo">Tamanho do gole/copo (ml)</label><input id="mt-copo" type="number" min="20" max="500" step="10" value="' + a.copo + '"></div>' +
      '<button class="btn cheio" id="mt-salvar">Salvar</button>' +
      '<button class="btn cheio neutro" style="margin-top:9px" data-fechar>Cancelar</button>'
    );
    $('#mt-salvar').addEventListener('click', function () {
      var meta = parseInt($('#mt-meta').value, 10), copo = parseInt($('#mt-copo').value, 10);
      if (!meta || meta < 500) return toast('Meta mínima de 500 ml.');
      if (!copo || copo < 20) return toast('Copo mínimo de 20 ml.');
      a.meta = meta; a.copo = copo;
      Store.salvar(); Folha.fechar(); renderAgua();
      toast('Meta atualizada.');
    });
  }

  function verSobre() {
    Folha.abrir(
      '<h2 style="font-size:19px;font-weight:750;margin-bottom:14px">Sobre este aplicativo</h2>' +
      '<div class="leitura" style="font-size:14px">' +
        'Esta é uma <b>réplica acadêmica</b> do aplicativo Barilife, desenvolvida como trabalho de curso para estudo de interface e de desenvolvimento de aplicações web instaláveis (PWA).\n\n' +
        'Não possui vínculo com a Sociedade Brasileira de Cirurgia Bariátrica e Metabólica (SBCBM), responsável pelo aplicativo original, e não deve ser usada como carteirinha real.\n\n' +
        'Todos os profissionais, clínicas e estabelecimentos listados são fictícios. Os textos de conteúdo têm caráter apenas ilustrativo e não substituem orientação da sua equipe de saúde.\n\n' +
        'Nenhuma informação é enviada para servidores: tudo que você preenche fica salvo somente no armazenamento local deste navegador.' +
      '</div>' +
      '<div class="cartao" style="margin-top:18px;font-size:12.5px;color:var(--texto-2);line-height:1.6">' +
        '<b style="color:var(--texto)">Tecnologia</b><br>HTML, CSS e JavaScript puro · Service Worker para uso offline · Gerador de QR Code próprio (ISO/IEC 18004), sem bibliotecas externas.' +
      '</div>' +
      '<button class="btn cheio neutro" style="margin-top:18px" data-fechar>Fechar</button>'
    );
  }

  function confirmarSaida() {
    Folha.abrir(
      '<h2 style="font-size:19px;font-weight:750;margin-bottom:6px">Apagar dados e sair</h2>' +
      '<p style="color:var(--texto-2);font-size:14px;line-height:1.6;margin-bottom:20px">' +
        'Isso remove sua carteirinha, favoritos e lembretes deste dispositivo. A ação não pode ser desfeita.</p>' +
      '<button class="btn cheio" id="sair-sim" style="background:var(--alerta)">Apagar tudo</button>' +
      '<button class="btn cheio neutro" style="margin-top:9px" data-fechar>Cancelar</button>'
    );
    $('#sair-sim').addEventListener('click', function () {
      Store.limpar();
      Folha.fechar();
      $('#app').hidden = true;
      $('#tela-entrada').classList.add('on');
      irPasso(1);
      toast('Dados apagados.');
    });
  }

  /* ==========================================================================
     Boot
     ========================================================================== */
  function montarFiltros() {
    $('#chips-categoria').innerHTML = DB.categorias.map(function (c) {
      return '<button class="chip' + (c.id === 'todos' ? ' on' : '') + '" data-cat="' + c.id + '">' +
             c.icone + ' ' + esc(c.rotulo) + '</button>';
    }).join('');
    $$('[data-cat]').forEach(function (b) {
      b.addEventListener('click', function () {
        filtroCategoria = b.dataset.cat;
        $$('[data-cat]').forEach(function (x) { x.classList.toggle('on', x === b); });
        renderDescontos();
      });
    });

    var ufsUsadas = ['todos'].concat(DB.profissionais.map(function (m) { return m.uf; })
      .filter(function (v, i, a) { return a.indexOf(v) === i; }));
    $('#chips-uf').innerHTML = ufsUsadas.map(function (u) {
      return '<button class="chip' + (u === 'todos' ? ' on' : '') + '" data-uf="' + u + '">' +
             (u === 'todos' ? 'Todos os estados' : u) + '</button>';
    }).join('');
    $$('[data-uf]').forEach(function (b) {
      b.addEventListener('click', function () {
        filtroUF = b.dataset.uf;
        $$('[data-uf]').forEach(function (x) { x.classList.toggle('on', x === b); });
        renderMedicos();
      });
    });
  }

  function ligarEventos() {
    $$('#tabbar button').forEach(function (b) {
      b.addEventListener('click', function () { irPara(b.dataset.tela); });
    });
    $('#btn-perfil').addEventListener('click', function () { irPara('perfil'); });
    $('#btn-voltar').addEventListener('click', function () { irPara('carteirinha'); });

    $('#a-qr').addEventListener('click', abrirQRGrande);
    $('#a-compartilhar').addEventListener('click', compartilhar);
    $('#a-editar').addEventListener('click', formDados);

    $('#busca-parceiro').addEventListener('input', renderDescontos);
    $('#busca-medico').addEventListener('input', renderMedicos);

    $$('#abas-conteudo button').forEach(function (b) {
      b.addEventListener('click', function () {
        filtroConteudo = b.dataset.tipo;
        $$('#abas-conteudo button').forEach(function (x) { x.classList.toggle('on', x === b); });
        renderConteudo();
      });
    });

    $('#btn-novo-lembrete').addEventListener('click', formLembrete);

    $('#m-dados').addEventListener('click', formDados);
    $('#m-favoritos').addEventListener('click', verFavoritos);
    $('#m-meta').addEventListener('click', formMeta);
    $('#m-sobre').addEventListener('click', verSobre);
    $('#m-sair').addEventListener('click', confirmarSaida);

    // troca de foto do perfil
    $('#perfil-foto').addEventListener('click', function () { $('#input-foto').click(); });
    $('#input-foto').addEventListener('change', function (ev) {
      var arq = ev.target.files && ev.target.files[0];
      if (!arq) return;
      if (arq.size > 3 * 1024 * 1024) return toast('Escolha uma imagem de até 3 MB.');
      var leitor = new FileReader();
      leitor.onload = function () {
        redimensionar(leitor.result, 256, function (dataURL) {
          Store.estado.perfil.foto = dataURL;
          Store.salvar(); renderPerfil(); renderCarteirinha();
          toast('Foto atualizada.');
        });
      };
      leitor.readAsDataURL(arq);
    });

    // fechar folha
    $('#folha-fundo').addEventListener('click', Folha.fechar);
    $('#folha-conteudo').addEventListener('click', function (ev) {
      if (ev.target.closest('[data-fechar]')) Folha.fechar();
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') Folha.fechar();
    });
  }

  /* Reduz a foto antes de guardar, para nao estourar o localStorage */
  function redimensionar(dataURL, lado, cb) {
    var img = new Image();
    img.onload = function () {
      var c = document.createElement('canvas');
      var min = Math.min(img.width, img.height);
      c.width = c.height = lado;
      var ctx = c.getContext('2d');
      ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, lado, lado);
      try { cb(c.toDataURL('image/jpeg', 0.82)); } catch (e) { cb(dataURL); }
    };
    img.onerror = function () { cb(dataURL); };
    img.src = dataURL;
  }

  function abrirApp() {
    $('#tela-entrada').classList.remove('on');
    $('#app').hidden = false;
    renderCarteirinha();
    renderDescontos();
    renderMedicos();
    renderConteudo();
    renderLembretes();
    renderPerfil();
    irPara('carteirinha');
  }

  function iniciar() {
    Store.carregar();
    montarOnboarding();
    montarFiltros();
    ligarEventos();

    if (Store.estado.perfil) abrirApp();
    else { $('#app').hidden = true; $('#tela-entrada').classList.add('on'); irPasso(1); }

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('sw.js').catch(function () { /* offline segue opcional */ });
      });
    }
  }

  document.addEventListener('DOMContentLoaded', iniciar);
})();
