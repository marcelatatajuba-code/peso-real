/*
 * app.js — lógica da réplica acadêmica do DNE Digital.
 *
 * Organização:
 *   1. estado e armazenamento local
 *   2. utilidades (formatação, validação de CPF, datas)
 *   3. navegação entre telas (roteador por hash)
 *   4. renderização de cada tela
 *   5. QR Code e token rotativo
 *   6. fluxo de solicitação/renovação
 *   7. inicialização
 */
(function () {
  'use strict';

  var CHAVE = 'dne-replica-v1';
  var ARQUIVO_UNICO = false; // trocado para true pelo construir-arquivo-unico.js

  /*
   * Identificação de réplica, mantida só no código — nada disso aparece na
   * interface. Também está: no comentário do topo do index.html e nas meta
   * tags; nos atributos data-replica das carteirinhas; e no prefixo do
   * conteúdo dos QR Codes gerados.
   */
  var AVISO_REPLICA = 'RÉPLICA ACADÊMICA — SEM VALIDADE LEGAL. '
    + 'Reprodução do app DNE Digital feita como trabalho de curso, sem vínculo com '
    + 'UNE, UBES, ANPG ou com o aplicativo oficial. O documento montado aqui não '
    + 'comprova matrícula, não dá direito a meia-entrada e não tem validade legal.';
  var PREFIXO_QR = 'REPLICA-ACADEMICA-SEM-VALIDADE';
  var USO = 'interno-academico — nao publicar em endereco publico (ver NAO-PUBLICAR.md)';
  var DADOS = window.DADOS;

  /* ============================ 1. ESTADO ============================ */

  var estado = {
    logado: false,
    tema: 'claro',
    estudante: null,
    saldo: 0,
    extrato: [],
    naCarteira: false,
    filtroCategoria: 'Todos',
    busca: ''
  };

  function carregar() {
    try {
      var bruto = localStorage.getItem(CHAVE);
      if (bruto) Object.assign(estado, JSON.parse(bruto));
    } catch (e) {
      console.warn('Não foi possível ler o armazenamento local:', e);
    }
  }

  function salvar() {
    try {
      localStorage.setItem(CHAVE, JSON.stringify({
        logado: estado.logado, tema: estado.tema, estudante: estado.estudante,
        saldo: estado.saldo, extrato: estado.extrato, naCarteira: estado.naCarteira
      }));
    } catch (e) {
      aviso('Não foi possível salvar neste aparelho.');
    }
  }

  /* =========================== 2. UTILIDADES ========================= */

  var $ = function (sel, raiz) { return (raiz || document).querySelector(sel); };
  var $$ = function (sel, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(sel)); };

  function soDigitos(v) { return (v || '').replace(/\D+/g, ''); }

  function mascaraCpf(v) {
    var d = soDigitos(v).slice(0, 11);
    if (d.length > 9) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    if (d.length > 6) return d.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    if (d.length > 3) return d.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    return d;
  }

  // Validação real do CPF: confere os dois dígitos verificadores (módulo 11).
  function cpfValido(valor) {
    var cpf = soDigitos(valor);
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false; // sequências como 111.111.111-11
    for (var t = 9; t < 11; t++) {
      var soma = 0;
      for (var i = 0; i < t; i++) soma += parseInt(cpf[i], 10) * ((t + 1) - i);
      var dig = (soma * 10) % 11;
      if (dig === 10) dig = 0;
      if (dig !== parseInt(cpf[t], 10)) return false;
    }
    return true;
  }

  function emailValido(v) { return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test((v || '').trim()); }

  // Formata no formato ISO usando o relógio local. Não serve usar o método
  // toISOString aqui: ele converte para UTC e, à noite nos fusos negativos,
  // devolve o dia seguinte — a validade caía em 01/04 em vez de 31/03.
  function dataIso(d) {
    var mes = String(d.getMonth() + 1).padStart(2, '0');
    var dia = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + mes + '-' + dia;
  }

  function dataBr(iso) {
    if (!iso) return '—';
    var p = String(iso).split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso;
  }

  function moeda(v) {
    return 'R$ ' + Number(v).toFixed(2).replace('.', ',');
  }

  function primeiroNome(nome) { return (nome || '').trim().split(/\s+/)[0] || ''; }

  function vencido(estudante) {
    if (!estudante || !estudante.validade) return true;
    return new Date(estudante.validade + 'T23:59:59') < new Date();
  }

  function diasRestantes(estudante) {
    var ms = new Date(estudante.validade + 'T23:59:59') - new Date();
    return Math.ceil(ms / 86400000);
  }

  // Hash curto e determinístico (FNV-1a), usado só como código de conferência visual.
  function hashCurto(txt) {
    var h = 0x811c9dc5;
    for (var i = 0; i < txt.length; i++) {
      h ^= txt.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return h.toString(16).toUpperCase().padStart(8, '0');
  }

  // Validade abreviada, como aparece no cartão: Mar/2027.
  var MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  function mesAno(iso) {
    var p = String(iso || '').split('-');
    return p.length === 3 ? MESES[Number(p[1]) - 1] + '/' + p[0] : '—';
  }

  // Número de nove dígitos impresso abaixo do QR Code.
  function numeroCurto(e) {
    return String(parseInt(hashCurto(e.numero + e.cpf), 16) % 1000000000).padStart(9, '0');
  }

  // Código curto usado na conferência pelo validador da meia-entrada.
  function codigoDeUso(e) {
    var h = hashCurto(e.numero + e.cpf);
    return 'DNE ' + h.slice(0, 4) + ' ' + h.slice(4, 8);
  }

  var temporizadorToast;
  function aviso(msg) {
    var el = $('#toast');
    el.textContent = msg;
    el.classList.add('visivel');
    clearTimeout(temporizadorToast);
    temporizadorToast = setTimeout(function () { el.classList.remove('visivel'); }, 2600);
  }

  function lerArquivo(arquivo, aoTerminar) {
    var leitor = new FileReader();
    leitor.onload = function () { aoTerminar(leitor.result); };
    leitor.readAsDataURL(arquivo);
  }

  /* ========================== 3. NAVEGAÇÃO ========================== */

  var TELAS = {
    login: { id: 'tela-login', tabbar: false },
    inicio: { id: 'tela-inicio', tabbar: true, aba: 'inicio' },
    carteirinha: { id: 'tela-carteirinha', tabbar: true, aba: 'carteirinha' },
    certificado: { id: 'tela-certificado', tabbar: false },
    apresentar: { id: 'tela-apresentar', tabbar: false },
    beneficios: { id: 'tela-beneficios', tabbar: true, aba: 'beneficios' },
    beneficio: { id: 'tela-beneficio', tabbar: false },
    solicitar: { id: 'tela-solicitar', tabbar: false },
    transporte: { id: 'tela-transporte', tabbar: false },
    internacional: { id: 'tela-internacional', tabbar: false },
    perfil: { id: 'tela-perfil', tabbar: true, aba: 'perfil' }
  };

  var telaAtual = null;

  function ir(rota, param) {
    location.hash = '#/' + rota + (param ? '/' + param : '');
  }

  function aplicarRota() {
    var partes = (location.hash || '').replace(/^#\/?/, '').split('/');
    var rota = partes[0] || (estado.logado ? 'inicio' : 'login');
    var param = partes[1];

    if (!TELAS[rota]) rota = estado.logado ? 'inicio' : 'login';
    if (!estado.logado && rota !== 'login' && rota !== 'solicitar') rota = 'login';
    if (estado.logado && rota === 'login') rota = 'inicio';

    // documento ainda não emitido: telas que dependem dele voltam para o início
    if (estado.logado && !estado.estudante && ['carteirinha', 'apresentar', 'internacional', 'certificado'].indexOf(rota) >= 0) {
      rota = 'inicio';
    }

    if (telaAtual === 'apresentar' && rota !== 'apresentar') pararToken();

    $$('.tela').forEach(function (t) { t.classList.remove('ativa'); });
    var cfg = TELAS[rota];
    $('#' + cfg.id).classList.add('ativa');
    document.body.classList.toggle('sem-tabbar', !cfg.tabbar);
    $$('#tabbar button').forEach(function (b) {
      if (cfg.aba && b.dataset.ir === cfg.aba) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });

    telaAtual = rota;
    window.scrollTo(0, 0);
    renderizarTela(rota, param);
  }

  function renderizarTela(rota, param) {
    switch (rota) {
      case 'inicio': renderInicio(); break;
      case 'carteirinha': renderCarteirinha(); break;
      case 'apresentar': iniciarToken(); break;
      case 'certificado': renderCertificado(); break;
      case 'beneficios': renderBeneficios(); break;
      case 'beneficio': renderDetalheBeneficio(param); break;
      case 'solicitar': abrirSolicitacao(); break;
      case 'transporte': renderTransporte(); break;
      case 'internacional': renderInternacional(); break;
      case 'perfil': renderPerfil(); break;
    }
  }

  /* ========================= 4. RENDERIZAÇÃO ======================== */

  function linhasDados(pares) {
    return pares.map(function (p) {
      return '<div class="linha-dado"><span>' + p[0] + '</span><strong>' + p[1] + '</strong></div>';
    }).join('');
  }

  function fotoDe(estudante) {
    return (estudante && estudante.foto) || 'assets/foto-exemplo.svg';
  }

  function renderInicio() {
    var e = estado.estudante;
    $('#inicio-nome').textContent = e ? primeiroNome(e.nome) : 'estudante';
    $('#inicio-foto').src = fotoDe(e);

    if (!e) {
      $('#inicio-inst').textContent = 'Você ainda não tem documento';
      $('#inicio-status').textContent = 'Toque para solicitar o seu DNE';
      $('#inicio-dados').innerHTML = '<p class="vazio"><strong>Nenhum documento emitido</strong>Toque em “Criar o meu documento” para preencher seus dados.</p>';
    } else {
      var expirado = vencido(e);
      $('#inicio-inst').textContent = e.instituicao;
      $('#inicio-status').textContent = expirado
        ? 'Documento vencido em ' + dataBr(e.validade)
        : 'Válido até ' + dataBr(e.validade) + ' · ' + diasRestantes(e) + ' dias';
      $('#inicio-dados').innerHTML = linhasDados([
        ['Situação', expirado ? '<span style="color:var(--vermelho)">Vencido</span>' : '<span style="color:var(--verde)">Válido</span>'],
        ['Nível', e.nivel],
        ['Curso', e.curso],
        ['Entidade', e.entidade],
        ['Validade', dataBr(e.validade)]
      ]);
    }

    $('#inicio-beneficios').innerHTML = DADOS.beneficios.slice(0, 3).map(itemBeneficio).join('');
  }

  function itemBeneficio(b) {
    var iniciais = b.nome.split(/\s+/).slice(0, 2).map(function (p) { return p[0]; }).join('').toUpperCase();
    return '<button class="item" type="button" data-beneficio="' + b.id + '">'
      + '<span class="logo" style="background:' + b.cor + '">' + iniciais + '</span>'
      + '<span class="txt"><strong>' + b.nome + '</strong><span>' + b.resumo + '</span></span>'
      + '<span class="tag">' + b.desconto + '</span>'
      + '<svg class="seta" width="18" height="18"><use href="#i-seta-dir"/></svg>'
      + '</button>';
  }

  function renderCarteirinha() {
    var e = estado.estudante;
    if (!e) return;
    var expirado = vencido(e);

    $('#cart-foto').src = fotoDe(e);
    $('#cart-nome').textContent = e.nome;
    $('#cart-inst').textContent = e.instituicao;
    $('#cart-curso').textContent = e.curso;
    $('#cart-nivel').textContent = e.nivel;
    $('#cart-cpf').textContent = e.cpf;
    $('#cart-nasc').textContent = dataBr(e.nascimento);
    $('#cart-validade').textContent = mesAno(e.validade);
    $('#cart-codigo').textContent = numeroCurto(e);

    var selo = $('#selo-validade');
    selo.classList.toggle('vencido', expirado);
    selo.lastElementChild.textContent = expirado ? 'Vencido' : 'Válido';

    $('#banner-texto').textContent = expirado
      ? 'Seu documento venceu. Renove para continuar usando.'
      : 'Seu DNE está liberado, aproveite.';

    desenharQr($('#cart-qr'), cargaQrCurta(e, tokenAtual()), 0);
    atualizarBotaoWallet();

    $('#carteirinha-dados').innerHTML = linhasDados([
      ['Nome', e.nome], ['CPF', e.cpf], ['Nascimento', dataBr(e.nascimento)],
      ['Matrícula', e.matricula], ['Instituição', e.instituicao], ['Curso', e.curso],
      ['Nível', e.nivel], ['Entidade emissora', e.entidade],
      ['Emissão', dataBr(e.emissao)], ['Validade', dataBr(e.validade)],
      ['Nº do documento', e.numero], ['Código de uso', codigoDeUso(e)],
      ['Certificação', 'Assinatura digital ITI']
    ]);
  }

  /* ------------------------------ certificado ------------------------------ */

  /*
   * Bloco no formato PEM montado a partir dos dados do documento, apenas para
   * reproduzir a aparência da tela de certificado do aplicativo original.
   * Não é um certificado de verdade: não há par de chaves, nem assinatura,
   * nem autoridade certificadora envolvida — são caracteres derivados do
   * próprio conteúdo por uma congruência linear.
   */
  function blocoPem(e) {
    var alfabeto = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    var semente = parseInt(hashCurto(e.numero + e.cpf + e.validade), 16) || 1;
    var linhas = [], i, j, linha;
    for (i = 0; i < 18; i++) {
      linha = '';
      for (j = 0; j < 64; j++) {
        semente = (semente * 1103515245 + 12345) & 0x7fffffff;
        linha += alfabeto[(semente >>> 16) & 63];
      }
      linhas.push(linha);
    }
    return linhas;
  }

  function textoPem(e) {
    return '-----BEGIN CERTIFICATE-----\n' + blocoPem(e).join('\n') + '\n-----END CERTIFICATE-----';
  }

  function renderCertificado() {
    var e = estado.estudante;
    if (!e) { ir('inicio'); return; }

    $('#cert-texto').innerHTML = e.entidade + ' atesta que <b>' + e.nome
      + '</b> é estudante e está regularmente matriculado(a) em ' + e.curso
      + ' da instituição ' + e.instituicao;

    $('#pem-corpo').innerHTML =
      '<span class="cerca">-----BEGIN CERTIFICATE-----</span>'
      + blocoPem(e).join('<br>')
      + '<span class="cerca">-----END CERTIFICATE-----</span>';

    $('#cert-dados').innerHTML = linhasDados([
      ['Titular', e.nome],
      ['Emissor', e.entidade],
      ['Nº do documento', e.numero],
      ['Código de uso', codigoDeUso(e)],
      ['Válido até', dataBr(e.validade)]
    ]);
  }

  function renderBeneficios() {
    var chips = $('#chips-categorias');
    if (!chips.children.length) {
      chips.innerHTML = DADOS.categorias.map(function (c) {
        return '<button class="chip" type="button" data-categoria="' + c + '" aria-pressed="false">' + c + '</button>';
      }).join('');
    }
    $$('#chips-categorias .chip').forEach(function (c) {
      c.setAttribute('aria-pressed', String(c.dataset.categoria === estado.filtroCategoria));
    });

    var termo = estado.busca.trim().toLowerCase();
    var lista = DADOS.beneficios.filter(function (b) {
      var okCat = estado.filtroCategoria === 'Todos' || b.categoria === estado.filtroCategoria;
      var okBusca = !termo
        || b.nome.toLowerCase().indexOf(termo) >= 0
        || b.resumo.toLowerCase().indexOf(termo) >= 0
        || b.categoria.toLowerCase().indexOf(termo) >= 0;
      return okCat && okBusca;
    });

    $('#lista-beneficios').innerHTML = lista.length
      ? lista.map(itemBeneficio).join('')
      : '<p class="vazio"><strong>Nada encontrado</strong>Tente outro termo ou categoria.</p>';
  }

  function renderDetalheBeneficio(id) {
    var b = DADOS.beneficios.filter(function (x) { return x.id === id; })[0];
    if (!b) { ir('beneficios'); return; }
    var iniciais = b.nome.split(/\s+/).slice(0, 2).map(function (p) { return p[0]; }).join('').toUpperCase();

    $('#detalhe-beneficio').innerHTML =
      '<div class="centro">'
      + '<div class="logo" style="background:' + b.cor + ';width:70px;height:70px;border-radius:20px;display:grid;place-items:center;color:#fff;font-weight:800;font-size:24px;margin:6px auto 14px">' + iniciais + '</div>'
      + '<h2 style="font-size:22px">' + b.nome + '</h2>'
      + '<p class="texto-2" style="margin:6px 0 0">' + b.categoria + '</p>'
      + '<p style="font-size:34px;font-weight:800;color:var(--verde);margin:14px 0 0">' + b.desconto + '</p>'
      + '<p class="texto-2" style="margin:2px 0 0">de desconto</p>'
      + '</div>'
      + '<div class="card mt-24"><p style="margin:0;font-size:14.5px;line-height:1.55">' + b.detalhe + '</p></div>'
      + '<div class="secao-titulo"><h2>Regras</h2></div>'
      + '<div class="card"><ul>' + b.regras.map(function (r) {
          return '<li style="display:flex;gap:10px;padding:7px 0;font-size:14px"><svg width="17" height="17" style="color:var(--verde);flex:none;margin-top:2px"><use href="#i-check"/></svg><span>' + r + '</span></li>';
        }).join('') + '</ul></div>'
      + (estado.estudante
          ? '<button class="btn mt-24" type="button" data-ir="apresentar">Apresentar documento</button>'
          : '<button class="btn mt-24" type="button" data-ir="solicitar">Solicitar documento</button>')
      + '<div class="aviso mt-16"><svg><use href="#i-info"/></svg><span>Parceiro de demonstração.</span></div>';
  }

  function renderTransporte() {
    $('#saldo-transporte').textContent = moeda(estado.saldo);

    var chips = $('#chips-recarga');
    if (!chips.children.length) {
      chips.innerHTML = DADOS.valoresRecarga.map(function (v, i) {
        return '<button class="chip" type="button" data-recarga="' + v + '" aria-pressed="' + (i === 1) + '">' + moeda(v) + '</button>';
      }).join('');
    }

    $('#extrato-transporte').innerHTML = estado.extrato.length
      ? estado.extrato.slice(0, 8).map(function (m) {
          var cor = m.valor > 0 ? 'var(--verde)' : 'var(--texto)';
          var sinal = m.valor > 0 ? '+ ' : '− ';
          return '<div class="linha-dado"><span>' + dataBr(m.data) + ' · ' + m.desc + '</span>'
            + '<strong style="color:' + cor + '">' + sinal + moeda(Math.abs(m.valor)).replace('R$ ', '') + '</strong></div>';
        }).join('')
      : '<p class="vazio">Sem movimentações.</p>';
  }

  function renderInternacional() {
    var e = estado.estudante;
    if (!e) return;
    $('#isic-foto').src = fotoDe(e);
    $('#isic-nome').textContent = e.nome.toUpperCase();
    $('#isic-inst').textContent = e.instituicao;
    $('#isic-nasc').textContent = dataBr(e.nascimento);
    $('#isic-validade').textContent = '12/' + new Date(e.validade).getFullYear();
    desenharQr($('#isic-qr'), 'ISIC-REPLICA-ACADEMICA|' + hashCurto(e.cpf + 'isic') + '|SEM VALIDADE', 0);
  }

  function renderPerfil() {
    var e = estado.estudante;
    $('#perfil-foto').src = fotoDe(e);
    $('#perfil-nome').textContent = e ? e.nome : 'Visitante';
    $('#perfil-email').textContent = e ? e.email : '—';
    $('#toggle-tema').checked = estado.tema === 'escuro';
    $('#perfil-dados').innerHTML = e ? linhasDados([
      ['CPF', e.cpf], ['Nascimento', dataBr(e.nascimento)], ['Matrícula', e.matricula],
      ['Instituição', e.instituicao], ['Curso', e.curso], ['Nível', e.nivel],
      ['Validade', dataBr(e.validade)]
    ]) : '<p class="vazio">Nenhum documento emitido.</p>';
  }

  /* ------------------- documento na Carteira do iPhone ------------------ */

  function atualizarBotaoWallet() {
    $('#btn-wallet-txt').textContent = estado.naCarteira
      ? 'Já está na Carteira da Apple'
      : 'Adicionar à Carteira da Apple';
    $('#btn-wallet').disabled = !!estado.naCarteira;
  }

  function abrirFolhaWallet() {
    var e = estado.estudante;
    if (!e) return;
    $('#passe-foto').src = fotoDe(e);
    $('#passe-nome').textContent = e.nome;
    $('#passe-inst').textContent = e.instituicao;
    $('#passe-codigo').textContent = codigoDeUso(e);
    $('#passe-validade').textContent = dataBr(e.validade);
    desenharQr($('#passe-qr'), cargaQrCurta(e, tokenAtual()), 0);

    $('#folha-fundo').classList.add('aberta');
    $('#folha-wallet').classList.add('aberta');
    $('#folha-wallet').setAttribute('aria-hidden', 'false');
  }

  function fecharFolhaWallet() {
    $('#folha-fundo').classList.remove('aberta');
    $('#folha-wallet').classList.remove('aberta');
    $('#folha-wallet').setAttribute('aria-hidden', 'true');
  }

  /* ==================== 5. QR CODE E TOKEN ROTATIVO ================== */

  var DURACAO_TOKEN = 60;          // segundos
  var token = null, restam = 0, intervalo = null;

  function novoToken() {
    var bruto = new Uint8Array(6);
    (window.crypto || {}).getRandomValues
      ? window.crypto.getRandomValues(bruto)
      : bruto.forEach(function (_, i) { bruto[i] = Math.floor(Math.random() * 256); });
    var hex = Array.from(bruto).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('').toUpperCase();
    return hex.slice(0, 4) + '-' + hex.slice(4, 8) + '-' + hex.slice(8, 12);
  }

  function tokenAtual() {
    if (!token) token = novoToken();
    return token;
  }

  // Conteúdo do QR: propositalmente marcado como réplica sem validade.
  // versão reduzida, para o QR pequeno impresso no cartão
  function cargaQrCurta(e, tk) {
    return [PREFIXO_QR, numeroCurto(e), tk].join('|');
  }

  function cargaQr(e, tk) {
    return [
      PREFIXO_QR,
      'DNE', codigoDeUso(e), e.numero, e.cpf, e.nome, e.instituicao, e.validade,
      tk, hashCurto(e.numero + tk)
    ].join('|');
  }

  function desenharQr(caixa, texto, escala) {
    try {
      var qr = window.QR.encode(texto, 'M');
      caixa.innerHTML = window.QR.toSvg(qr, { margin: 1, dark: '#08101f', light: '#ffffff' });
    } catch (err) {
      caixa.textContent = 'QR indisponível';
    }
  }

  function atualizarApresentacao() {
    var e = estado.estudante;
    if (!e) return;
    desenharQr($('#qr-grande'), cargaQr(e, tokenAtual()), 0);
    $('#apres-nome').textContent = e.nome;
    $('#apres-sub').textContent = e.instituicao + ' · ' + e.curso;
    $('#apres-token').textContent = 'Código ' + token;
  }

  function iniciarToken() {
    if (!estado.estudante) { ir('inicio'); return; }
    token = novoToken();
    restam = DURACAO_TOKEN;
    atualizarApresentacao();
    tique();
    clearInterval(intervalo);
    intervalo = setInterval(function () {
      restam--;
      if (restam <= 0) {
        token = novoToken();
        restam = DURACAO_TOKEN;
        atualizarApresentacao();
      }
      tique();
    }, 1000);
  }

  function tique() {
    $('#contador-txt').textContent = restam + 's';
    $('#contador-barra').style.width = (restam / DURACAO_TOKEN * 100) + '%';
  }

  function pararToken() { clearInterval(intervalo); intervalo = null; }

  /* ================= 6. FLUXO DE SOLICITAÇÃO/RENOVAÇÃO ============== */

  var passo = 0;
  var rascunho = {};
  var TOTAL_PASSOS = 5;

  function abrirSolicitacao() {
    var e = estado.estudante;
    $('#titulo-solicitar').textContent = e ? 'Editar documento' : 'Criar meu documento';

    // pré-preenche selects na primeira abertura
    if (!$('#sol-nivel').children.length) {
      $('#sol-nivel').innerHTML = DADOS.niveis.map(function (n) { return '<option>' + n + '</option>'; }).join('');
      $('#sol-inst').innerHTML = '<option value="">Selecione…</option>'
        + DADOS.instituicoes.map(function (i) { return '<option>' + i + '</option>'; }).join('');
      $('#sol-curso').innerHTML = '<option value="">Selecione…</option>'
        + DADOS.cursos.map(function (c) { return '<option>' + c + '</option>'; }).join('');
    }

    if (e) { // renovação: reaproveita o que já existe
      $('#sol-nome').value = e.nome; $('#sol-cpf').value = e.cpf;
      $('#sol-nasc').value = e.nascimento; $('#sol-email').value = e.email;
      $('#sol-nivel').value = e.nivel; $('#sol-inst').value = e.instituicao;
      $('#sol-curso').value = e.curso; $('#sol-matricula').value = e.matricula;
      if (e.foto) { rascunho.foto = e.foto; mostrarPreviaFoto(e.foto); }
    }
    atualizarEntidade();
    passo = 0;
    mostrarPasso();
  }

  function mostrarPasso() {
    $$('#form-solicitar .passo').forEach(function (p) {
      p.hidden = Number(p.dataset.passo) !== passo;
    });
    $('#passos-barra').innerHTML = Array.from({ length: TOTAL_PASSOS }, function (_, i) {
      return '<i class="' + (i <= passo ? 'feito' : '') + '"></i>';
    }).join('');
    var ultimo = passo === TOTAL_PASSOS - 1;
    $('#btn-passo-proximo').textContent = ultimo ? 'Ir para a carteirinha'
      : passo === TOTAL_PASSOS - 2 ? 'Confirmar pagamento' : 'Continuar';
    $('#btn-cancelar-solicitacao').hidden = ultimo;
    $('#btn-passo-anterior').style.visibility = (passo === 0 || ultimo) ? 'hidden' : 'visible';
    window.scrollTo(0, 0);
    if (passo === 3) montarPagamento();
  }

  function marcarErro(idCampo, temErro) {
    $('#' + idCampo).classList.toggle('invalido', temErro);
    return !temErro;
  }

  function validarPasso() {
    var ok = true;
    if (passo === 0) {
      ok &= marcarErro('cf-nome', $('#sol-nome').value.trim().split(/\s+/).length < 2);
      ok &= marcarErro('cf-cpf', !cpfValido($('#sol-cpf').value));
      var nasc = $('#sol-nasc').value;
      var idadeOk = nasc && new Date(nasc) < new Date() && new Date(nasc).getFullYear() > 1920;
      ok &= marcarErro('cf-nasc', !idadeOk);
      ok &= marcarErro('cf-email', !emailValido($('#sol-email').value));
    } else if (passo === 1) {
      ok &= marcarErro('cf-inst', !$('#sol-inst').value);
      ok &= marcarErro('cf-curso', !$('#sol-curso').value);
      ok &= marcarErro('cf-matricula', soDigitos($('#sol-matricula').value).length < 4);
    } else if (passo === 2) {
      // só a foto é obrigatória: o comprovante é opcional nesta réplica
      var semFoto = !rascunho.foto;
      $('#erro-foto').style.display = semFoto ? 'block' : 'none';
      ok = !semFoto;
    }
    if (!ok) aviso('Confira os campos destacados.');
    return !!ok;
  }

  function montarPagamento() {
    var valor = 45.00; // taxa praticada pelo documento oficial
    rascunho.valor = valor;
    $('#resumo-pedido').innerHTML = linhasDados([
      [estado.estudante ? 'Renovação do DNE' : 'Emissão do DNE', moeda(valor)],
      ['Via digital', 'sem frete'],
      ['Estudante', $('#sol-nome').value || '—'],
      ['Instituição', $('#sol-inst').value || '—'],
      ['Validade prevista', dataBr(novaValidade())],
      ['<strong>Total</strong>', '<strong>' + moeda(valor) + '</strong>']
    ]);
    var pix = 'REPLICA-ACADEMICA-PIX|DNE|' + moeda(valor) + '|' + hashCurto($('#sol-cpf').value + valor);
    desenharQr($('#qr-pix'), pix, 0);
    $('#pix-copia').textContent = pix;
  }

  function novaValidade() {
    var d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    d.setMonth(2, 31); // 31 de março, como no calendário anual do documento
    return dataIso(d);
  }

  function emitirDocumento() {
    var nivel = $('#sol-nivel').value;
    var hoje = dataIso(new Date());
    var numero = String(Math.floor(Math.random() * 9e15)).padStart(16, '0').replace(/(\d{4})(?=\d)/g, '$1 ').trim();

    estado.estudante = {
      nome: $('#sol-nome').value.trim(),
      cpf: mascaraCpf($('#sol-cpf').value),
      nascimento: $('#sol-nasc').value,
      email: $('#sol-email').value.trim(),
      matricula: soDigitos($('#sol-matricula').value),
      instituicao: $('#sol-inst').value,
      curso: $('#sol-curso').value,
      nivel: nivel,
      entidade: DADOS.entidades[nivel] || 'UNE',
      emissao: hoje,
      validade: novaValidade(),
      numero: numero,
      foto: rascunho.foto || null,
      creditoTransporte: estado.saldo
    };
    estado.logado = true;
    estado.naCarteira = false; // documento novo precisa ser adicionado de novo
    salvar();

    $('#resumo-emitido').innerHTML = linhasDados([
      ['Nome', estado.estudante.nome],
      ['Instituição', estado.estudante.instituicao],
      ['Entidade emissora', estado.estudante.entidade],
      ['Nº do documento', estado.estudante.numero],
      ['Validade', dataBr(estado.estudante.validade)]
    ]);
  }

  function mostrarPreviaFoto(dataUrl) {
    $('#previa-foto').src = dataUrl;
    $('#previa-foto').hidden = false;
    $('#upload-foto-txt').innerHTML = '<strong>Foto enviada</strong><br>Toque para trocar';
  }

  function atualizarEntidade() {
    var nivel = $('#sol-nivel').value;
    $('#ajuda-entidade').textContent = 'Documento emitido pela ' + (DADOS.entidades[nivel] || 'UNE') + '.';
  }

  /* ======================= 7. EVENTOS E INÍCIO ====================== */

  function aplicarTema() {
    document.documentElement.dataset.tema = estado.tema;
    var cor = estado.tema === 'escuro' ? '#070c1c' : '#0d1e4d';
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = cor;
  }

  function entrarComoDemo() {
    estado.logado = true;
    estado.estudante = JSON.parse(JSON.stringify(DADOS.estudanteDemo));
    estado.saldo = DADOS.estudanteDemo.creditoTransporte;
    estado.extrato = DADOS.extratoTransporte.slice();
    salvar();
    ir('inicio');
    aviso('Bem-vinda ao modo demonstração.');
  }

  function ligarEventos() {
    // navegação declarativa: qualquer elemento com data-ir="rota"
    document.addEventListener('click', function (ev) {
      var alvoIr = ev.target.closest('[data-ir]');
      if (alvoIr) { ir(alvoIr.dataset.ir); return; }

      var voltar = ev.target.closest('[data-voltar]');
      if (voltar) { history.length > 1 ? history.back() : ir('inicio'); return; }

      var beneficio = ev.target.closest('[data-beneficio]');
      if (beneficio) { ir('beneficio', beneficio.dataset.beneficio); return; }

      var chipCat = ev.target.closest('[data-categoria]');
      if (chipCat) { estado.filtroCategoria = chipCat.dataset.categoria; renderBeneficios(); return; }

      var chipRec = ev.target.closest('[data-recarga]');
      if (chipRec) {
        $$('#chips-recarga .chip').forEach(function (c) { c.setAttribute('aria-pressed', String(c === chipRec)); });
        return;
      }
    });

    // sombra do cabeçalho ao rolar
    window.addEventListener('scroll', function () {
      $$('.topo').forEach(function (t) { t.classList.toggle('rolado', window.scrollY > 4); });
    }, { passive: true });

    window.addEventListener('hashchange', aplicarRota);

    /* --- login --- */
    $('#login-cpf').addEventListener('input', function () { this.value = mascaraCpf(this.value); });
    $('#form-login').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var okCpf = cpfValido($('#login-cpf').value);
      var okSenha = $('#login-senha').value.length >= 4;
      $('#cf-login-cpf').classList.toggle('invalido', !okCpf);
      $('#cf-login-senha').classList.toggle('invalido', !okSenha);
      if (!okCpf || !okSenha) return;
      if (!estado.estudante) {
        estado.estudante = JSON.parse(JSON.stringify(DADOS.estudanteDemo));
        estado.estudante.cpf = mascaraCpf($('#login-cpf').value);
        estado.saldo = DADOS.estudanteDemo.creditoTransporte;
        estado.extrato = DADOS.extratoTransporte.slice();
      }
      estado.logado = true;
      salvar();
      ir('inicio');
    });
    $('#btn-demo').addEventListener('click', entrarComoDemo);
    $('#btn-mostrar-login').addEventListener('click', function () {
      $('#bloco-boas-vindas').hidden = true;
      $('#form-login').hidden = false;
      $('#login-cpf').focus();
    });
    $('#btn-voltar-boas-vindas').addEventListener('click', function () {
      $('#form-login').hidden = true;
      $('#bloco-boas-vindas').hidden = false;
    });

    /* --- carteirinha --- */
    $('#btn-apresentar-topo').addEventListener('click', function () { ir('apresentar'); });
    $('#btn-copiar-pem').addEventListener('click', function () {
      var e = estado.estudante;
      if (!e) return;
      var texto = textoPem(e);
      if (navigator.clipboard) {
        navigator.clipboard.writeText(texto)
          .then(function () { aviso('Certificado copiado.'); })
          .catch(function () { aviso('Não foi possível copiar.'); });
      } else {
        aviso('Cópia não disponível neste navegador.');
      }
    });

    /* --- Carteira do iPhone --- */
    $('#btn-wallet').addEventListener('click', abrirFolhaWallet);
    $('#btn-wallet-fechar').addEventListener('click', fecharFolhaWallet);
    $('#folha-fundo').addEventListener('click', fecharFolhaWallet);
    $('#btn-wallet-confirmar').addEventListener('click', function () {
      estado.naCarteira = true;
      salvar();
      fecharFolhaWallet();
      atualizarBotaoWallet();
      aviso('Documento adicionado à Carteira (simulado).');
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') fecharFolhaWallet();
    });

    /* --- apresentação --- */
    $('#btn-fechar-apresentar').addEventListener('click', function () {
      history.length > 1 ? history.back() : ir('carteirinha');
    });

    /* --- benefícios --- */
    $('#busca-beneficios').addEventListener('input', function () {
      estado.busca = this.value;
      renderBeneficios();
    });

    /* --- solicitação --- */
    $('#sol-cpf').addEventListener('input', function () { this.value = mascaraCpf(this.value); });
    $('#sol-matricula').addEventListener('input', function () { this.value = soDigitos(this.value); });
    $('#sol-nivel').addEventListener('change', atualizarEntidade);

    $('#sol-foto').addEventListener('change', function () {
      if (!this.files[0]) return;
      lerArquivo(this.files[0], function (url) {
        rascunho.foto = url;
        mostrarPreviaFoto(url);
        $('#erro-foto').style.display = 'none';
      });
    });
    $('#sol-doc').addEventListener('change', function () {
      if (!this.files[0]) return;
      rascunho.doc = this.files[0].name;
      $('#upload-doc-txt').innerHTML = '<strong>Comprovante enviado</strong><br>' + rascunho.doc;
      $('#erro-doc').style.display = 'none';
    });

    $('#form-solicitar').addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (passo === TOTAL_PASSOS - 1) { ir('carteirinha'); return; }
      if (!validarPasso()) return;
      if (passo === TOTAL_PASSOS - 2) emitirDocumento();
      passo++;
      mostrarPasso();
    });
    $('#btn-passo-anterior').addEventListener('click', function () {
      if (passo === 0) { history.length > 1 ? history.back() : ir('inicio'); return; }
      passo--;
      mostrarPasso();
    });
    $('#btn-cancelar-solicitacao').addEventListener('click', function () {
      ir(estado.logado ? 'inicio' : 'login');
    });

    /* --- transporte --- */
    $('#btn-recarregar').addEventListener('click', function () {
      var sel = $('#chips-recarga [aria-pressed="true"]');
      if (!sel) { aviso('Escolha um valor.'); return; }
      var v = Number(sel.dataset.recarga);
      estado.saldo = Number((estado.saldo + v).toFixed(2));
      estado.extrato.unshift({ data: dataIso(new Date()), desc: 'Recarga pelo aplicativo', valor: v });
      salvar();
      renderTransporte();
      aviso('Recarga simulada de ' + moeda(v) + ' concluída.');
    });

    /* --- perfil --- */
    $('#toggle-tema').addEventListener('change', function () {
      estado.tema = this.checked ? 'escuro' : 'claro';
      aplicarTema();
      salvar();
    });
    $('#perfil-troca-foto').addEventListener('change', function () {
      if (!this.files[0] || !estado.estudante) return;
      lerArquivo(this.files[0], function (url) {
        estado.estudante.foto = url;
        salvar();
        renderPerfil();
        aviso('Foto atualizada.');
      });
    });
    $('#btn-compartilhar').addEventListener('click', function () {
      var endereco = location.href.split('#')[0];
      if (navigator.share) {
        navigator.share({ title: 'DNE Digital', url: endereco })
          .catch(function () { /* a pessoa cancelou */ });
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(endereco)
          .then(function () { aviso('Endereço copiado.'); })
          .catch(function () { aviso(endereco); });
      } else {
        aviso(endereco);
      }
    });

    $('#btn-sair').addEventListener('click', function () {
      estado.logado = false;
      salvar();
      $('#form-login').hidden = true;
      $('#bloco-boas-vindas').hidden = false;
      ir('login');
    });
    $('#btn-limpar').addEventListener('click', function () {
      if (!confirm('Apagar todos os dados salvos neste aparelho?')) return;
      localStorage.removeItem(CHAVE);
      location.hash = '#/login';
      location.reload();
    });
  }

  function registrarServiceWorker() {
    if (ARQUIVO_UNICO) return;                  // versão de arquivo único não tem sw.js
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol === 'file:') return; // não funciona aberto direto do disco
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function (e) {
        console.warn('Service worker não registrado:', e);
      });
    });
  }

  function iniciar() {
    if (window.console && console.info) console.info(AVISO_REPLICA + ' USO: ' + USO + '.');
    document.documentElement.setAttribute('data-replica', 'academica');
    carregar();
    aplicarTema();
    ligarEventos();
    if (!location.hash) location.hash = estado.logado ? '#/inicio' : '#/login';
    aplicarRota();
    registrarServiceWorker();

    var splash = document.getElementById('splash');
    if (splash) {
      setTimeout(function () { splash.classList.add('saindo'); }, 650);
      setTimeout(function () { splash.remove(); }, 1150);
    }
  }

  document.addEventListener('DOMContentLoaded', iniciar);
})();
