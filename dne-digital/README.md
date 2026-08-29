# DNE Digital — réplica acadêmica

Réplica do aplicativo **DNE Digital** (Documento Nacional do Estudante), desenvolvida
como trabalho de curso. É um **PWA** — um aplicativo web que se instala no celular,
funciona sem internet e não precisa de loja de aplicativos.

> **Aviso.** Este projeto não tem qualquer vínculo com a UNE, a UBES, a ANPG ou com o
> aplicativo oficial. Todos os dados são fictícios, a carteirinha exibida é marcada como
> réplica em todas as telas e **não possui validade legal** — não serve como comprovante
> de matrícula nem dá direito a meia-entrada.

---

## Como enviar para alguém

Há dois caminhos, e o melhor depende de quem vai receber.

### Caminho 1 — mandar o link (recomendado para iPhone)

Publique a pasta no **GitHub Pages** (**Settings → Pages**, escolha a branch e a pasta raiz)
e mande o endereço:

```
https://<seu-usuario>.github.io/<repositorio>/dne-digital/
```

Quem recebe abre no navegador e já pode montar o próprio documento. No iPhone, abrindo pelo
**Safari**, ainda dá para tocar em compartilhar → **Adicionar à Tela de Início** e o app fica
com ícone próprio, em tela cheia e funcionando offline.

### Caminho 2 — mandar o arquivo

O arquivo **`dne-digital-replica.html`** tem o app inteiro dentro dele: HTML, CSS,
JavaScript, ícones e imagens, sem nenhuma referência externa. Dá para mandar por WhatsApp,
e-mail ou pendrive; quem recebe abre com dois cliques, sem instalar nada e sem internet.

Funciona bem em computador e em Android. No iPhone, abrir um `.html` recebido depende do
app usado para abrir, então para iPhone prefira o link do caminho 1.

Para gerar o arquivo de novo depois de mexer no código:

```bash
cd dne-digital
node construir-arquivo-unico.js
```

## O que a pessoa que recebe consegue fazer

Ao abrir pela primeira vez, ela escolhe entre:

- **Criar o meu documento** — preenche nome, CPF, nascimento, e-mail, instituição, curso e
  matrícula, envia uma foto (da galeria ou tirada na hora) e o documento é emitido com os
  dados dela;
- **Ver um exemplo pronto** — carrega a estudante fictícia de demonstração, útil para
  apresentar o trabalho sem preencher nada;
- **Entrar com CPF e senha** — a tela de login, mantida para demonstrar o fluxo do app oficial.

Depois de criado, ela pode trocar a foto e editar os dados pelo Perfil. Tudo fica no
`localStorage` do aparelho dela: cada pessoa que abrir tem o seu próprio documento, e nada
é enviado para servidor nenhum.

## Como abrir

### No computador (para desenvolver e apresentar)

O app precisa ser servido por um servidor HTTP — abrir o `index.html` direto do disco
faz o service worker não registrar.

```bash
cd dne-digital
python3 -m http.server 8000
```

Depois abra <http://localhost:8000> no navegador. Para ver como fica no celular, use as
ferramentas de desenvolvedor (F12) e ative o modo dispositivo (iPhone 14, por exemplo).

### No iPhone (instalar como aplicativo, de graça)

1. Publique a pasta em qualquer endereço `https` — o mais simples é o **GitHub Pages**:
   no repositório, vá em **Settings → Pages**, escolha a branch e a pasta raiz, salve.
   O app fica em `https://<seu-usuario>.github.io/<repositorio>/dne-digital/`.
2. Abra esse endereço no **Safari** do iPhone (precisa ser o Safari).
3. Toque no botão de compartilhar e escolha **Adicionar à Tela de Início**.
4. O ícone aparece junto com os outros apps. Ao abrir, roda em tela cheia, sem barra de
   navegador — e continua funcionando no modo avião.

Não é preciso conta de desenvolvedor da Apple, nem Mac, nem pagar nada.

---

## O que o app faz

| Tela | O que tem |
|---|---|
| **Login** | CPF com máscara e validação real dos dígitos verificadores, senha, entrada em modo demonstração |
| **Início** | Saudação, resumo do documento, atalhos, benefícios em destaque |
| **Carteirinha** | Documento no padrão do aplicativo original: faixa de aviso, foto e QR Code lado a lado sobre a faixa colorida, dados em lista e botão da Carteira da Apple |
| **Certificado** | Tela "Validado no portal da meia-entrada", com a atestação da entidade e o bloco do certificado de atributo em PEM |
| **Adicionar à Carteira** | Folha inferior que monta o passe no estilo da Carteira (Wallet) do iPhone, como o app oficial passou a permitir |
| **Apresentar** | QR Code em tela cheia com token que se renova a cada 60 segundos e contador regressivo |
| **Benefícios** | 12 parceiros fictícios, busca por texto, filtro por categoria e tela de detalhe com regras |
| **Solicitar/Renovar** | Formulário em 5 passos: dados pessoais, instituição e curso, foto e comprovante, pagamento por Pix simulado (taxa de R$ 45, a mesma do documento oficial), emissão |
| **Transporte** | Saldo do bilhete estudante, recarga simulada e extrato |
| **ISIC** | Versão internacional do cartão, no formato paisagem |
| **Perfil** | Dados, troca de foto, tema claro/escuro, sair e apagar dados |

---

## Padrão visual

O layout segue o aplicativo original: tema claro sobre fundo off-white, cartões brancos
arredondados, azul na marca e na tipografia, laranja nas ações, faixa roxa/magenta ao fundo
do documento e tipografia arredondada (`ui-rounded` / `SF Pro Rounded`, sem fonte externa,
para o app continuar funcionando offline).

O logotipo `dne` e os selos das entidades são **desenhos tipográficos próprios**, feitos no
mesmo estilo do original — não são os arquivos de marca da UNE, da UBES ou da ANPG.

## Estrutura dos arquivos

```
dne-digital/
├── index.html              estrutura de todas as telas + ícones SVG
├── css/app.css             design system completo (variáveis, temas, componentes)
├── js/
│   ├── qr.js               gerador de QR Code escrito do zero (ISO/IEC 18004)
│   ├── dados.js            dados fictícios: estudante, instituições, parceiros
│   └── app.js              estado, roteador, telas, validações e fluxos
├── assets/                 ícones do app e foto de exemplo
├── testes/verificar-qr.js  prova que o gerador de QR Code está correto
├── construir-arquivo-unico.js   junta tudo em um .html só, para enviar
├── NAO-PUBLICAR.md         por que este projeto não vai para endereço público
├── robots.txt              Disallow para todos os robôs
└── dne-digital-replica.html     o app inteiro em um arquivo (gerado)
├── manifest.webmanifest    metadados da instalação (nome, ícones, cores)
├── sw.js                   service worker: guarda o app em cache para uso offline
```

Sem framework, sem `npm install`, sem build. Três arquivos JavaScript e uma folha de
estilo — o que facilita ler, explicar e apresentar o código.

---

## Pontos técnicos que valem ser explicados na apresentação

### 1. Gerador de QR Code próprio (`js/qr.js`)

O QR Code não vem de biblioteca externa nem de API na internet: é gerado no próprio
aparelho. O arquivo implementa a norma ISO/IEC 18004 completa:

- codificação em **modo byte** com UTF-8 e escolha automática da versão (1 a 40);
- **correção de erros Reed-Solomon** sobre o corpo finito GF(256), nos quatro níveis (L, M, Q, H);
- divisão em blocos, cálculo da redundância e **intercalação** dos códigos;
- desenho dos padrões funcionais (localizadores, alinhamento, temporizadores);
- teste das **8 máscaras** com cálculo de penalidade, escolhendo a de menor pontuação;
- informação de formato e de versão com códigos BCH.

Isso é o que permite o app funcionar offline — que é justamente o cenário de uso real
(bilheteria, catraca, lugar sem sinal).

**Como foi verificado.** Rode `dne-digital/testes/verificar-qr.js` (instruções no
topo do arquivo). As matrizes geradas foram comparadas módulo a módulo com a
biblioteca de referência `qrcode` (npm): **295 matrizes idênticas**, cobrindo as versões
1 a 40 e os quatro níveis de correção. Depois, os códigos foram lidos por um decodificador
independente (`jsQR`), que devolveu exatamente o texto de origem em todos os casos.

### 2. Validação de CPF (`js/app.js`)

O CPF não é conferido só pelo formato: a função `cpfValido()` calcula os dois dígitos
verificadores pelo módulo 11 e rejeita sequências repetidas, como o algoritmo oficial.

### 3. Regras do documento real reproduzidas

- **Validade até 31 de março do ano seguinte ao da emissão**, como determina o art. 1º,
  § 6º da Lei nº 12.933/2013 — é o que a função `novaValidade()` calcula, em vez de somar
  365 dias. Um documento criado hoje vale até **31/03/2027**.

  A data é montada pela função `dataIso()`, a partir do relógio local. O caminho óbvio,
  `toISOString()`, converte para UTC e devolve o dia seguinte quando o aparelho está num
  fuso negativo depois das 21h: no horário de Brasília, um documento criado à noite saía
  com validade 01/04 em vez de 31/03.
- **Entidade emissora definida pelo nível de ensino**: UBES para ensino médio e técnico,
  UNE para o superior, ANPG para a pós-graduação.
- **Código de uso** curto no cartão, além do número longo do documento: no fluxo real, a
  bilheteria confere o QR Code *ou* esse código no validador oficial da meia-entrada.
- **Taxa de R$ 45** na emissão e na renovação.
- Menção à **certificação digital do ITI**, que é o que dá fé pública ao documento oficial.

### 4. Token rotativo

O conteúdo do QR Code carrega um código de verificação que é sorteado a cada 60 segundos
(`crypto.getRandomValues`). É o mesmo princípio usado por documentos digitais para que uma
captura de tela perca a validade rapidamente. O contador na tela mostra o tempo restante.

### 5. PWA e funcionamento offline

`manifest.webmanifest` descreve o app para o sistema (nome, ícones, cor, modo tela cheia)
e `sw.js` guarda todos os arquivos em cache na instalação, usando a estratégia
*cache-first*: o app responde do cache e só busca na rede o que não tiver.

### 6. Persistência local

Todo o estado — documento, foto, saldo, tema — fica no `localStorage` do próprio aparelho,
em JSON. Nada é enviado para servidor nenhum; não existe back-end neste projeto.

### 7. Cuidados de interface para iOS

- `viewport-fit=cover` mais `env(safe-area-inset-*)` para respeitar o entalhe e a barra inferior;
- campos de formulário com `font-size: 16px`, que impede o Safari de dar zoom ao focar;
- `-webkit-backdrop-filter` nas barras translúcidas;
- `apple-mobile-web-app-capable` e `apple-touch-icon` para a instalação na tela de início;
- `prefers-reduced-motion` respeitado em todas as animações.

---

## Limitações conhecidas (assumidas de propósito)

- **Não há back-end.** Login, pagamento e emissão são simulados no próprio aparelho.
- **Nenhuma validação real de matrícula** — o comprovante enviado não é verificado.
- **A identidade visual é uma aproximação.** As cores e o arranjo das telas foram
  reconstruídos a partir da descrição pública do aplicativo e das suas funcionalidades
  documentadas, não copiados dele.
- **A adição à Carteira do iPhone é simulada.** Um passe de verdade (`.pkpass`) precisa
  ser assinado com um certificado Apple emitido para uma organização, o que não se aplica
  a um trabalho de curso. A folha reproduz a interface e o formato do passe.
- **A identificação de réplica está apenas no código, em nenhum ponto da interface.**
  Por decisão de projeto do trabalho, nada na tela diz que a peça é uma reprodução: o
  aplicativo se apresenta como o app que ele imita. A identificação vive em cinco lugares,
  todos fora da vista de quem usa:

  | Onde | O quê |
  |---|---|
  | `index.html`, topo | bloco de comentário explicando o que a peça é e o que ela não é |
  | `index.html`, `<head>` | `<meta name="replica">`, `<meta name="validade-legal">` e `noindex` |
  | elementos das carteirinhas | `data-replica="academica"` e `data-validade-legal="nenhuma"` |
  | conteúdo dos QR Codes | prefixo `REPLICA-ACADEMICA-SEM-VALIDADE` antes de qualquer dado |
  | `js/app.js` | constante `AVISO_REPLICA`, registrada no console ao abrir o app |

  Quem inspecionar o código, ler o QR Code ou abrir o console encontra a identificação;
  quem apenas olhar a tela, não. Vale ter isso claro ao apresentar e ao encaminhar o app.

---

## Créditos e referências

- Funcionalidades do aplicativo oficial (carteirinha com foto, dados da instituição e QR
  Code; solicitação, renovação e recarga; carteira internacional ISIC; crédito de
  transporte do Bilhete Único; adição à Carteira do iPhone) levantadas nas páginas
  públicas da UNE, da UBES e das lojas de aplicativos.
- Meia-entrada estudantil: Lei nº 12.933/2013 (validade até 31 de março do ano seguinte,
  art. 1º § 6º; cota de 40% dos ingressos) e Decreto nº 8.537/2015.
- Documento emitido por UNE, UBES e ANPG, com certificação digital do ITI.
- Algoritmo do QR Code: ISO/IEC 18004.
- Verificação do gerador: biblioteca `qrcode` e decodificador `jsQR` (usados apenas em
  teste, fora do app publicado).
