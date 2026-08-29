# Barilife — réplica acadêmica (PWA)

Réplica do aplicativo **Barilife**, a carteirinha digital do paciente bariátrico,
desenvolvida como **trabalho de curso**.

> **Aviso.** Este projeto é um exercício acadêmico de estudo de interface e de
> desenvolvimento web. Não tem vínculo com a Sociedade Brasileira de Cirurgia
> Bariátrica e Metabólica (SBCBM), responsável pelo aplicativo original, e não
> deve ser usado como carteirinha real. Todos os profissionais, clínicas e
> estabelecimentos listados são fictícios.

---

## O que foi replicado

| Tela | O que faz |
|---|---|
| **Carteirinha** | Cartão do paciente com nome, foto, tipo de cirurgia, data, cirurgião, CRM, número de matrícula, validade e **QR Code** de validação. Métricas de jornada (dias de pós-operatório, peso eliminado, IMC), próximo compromisso e descontos em destaque. |
| **Descontos** | Rede de parceiros com busca por nome/bairro/cidade e filtro por categoria (restaurantes, academias, farmácias, suplementos, roupas, clínicas). Cada parceiro abre uma ficha com regra do benefício, instruções de uso, cupom copiável e favoritar. |
| **Profissionais** | Cirurgiões, nutrição, endocrinologia e psicologia credenciados, com busca livre e filtro por estado. A ficha traz avaliação, local de atendimento, formas de atendimento e **solicitação de agendamento** (que gera um lembrete). |
| **Conteúdo** | Dicas, receitas, artigos e vídeos, separados por abas, com leitor de artigo completo. |
| **Lembretes** | Controle de hidratação do dia com anel de progresso e meta configurável, mais lembretes de vitaminas, consultas e exames (criar, ativar/desativar, remover). |
| **Perfil** | Edição de todos os dados da carteirinha, troca de foto, favoritos, meta de água, sobre e exclusão dos dados. |

Fluxo de entrada com **cadastro em duas etapas** (dados pessoais e dados da
cirurgia) ou **perfil de demonstração** para avaliação rápida.

---

## Como executar

O projeto é 100% estático — não precisa instalar nada, não tem dependências
pagas nem build.

**Opção 1 — servidor local** (recomendado: o Service Worker só funciona sob
`http://localhost` ou HTTPS):

```bash
cd barilife
python3 -m http.server 8000
```

Abra <http://localhost:8000> no navegador.

**Opção 2 — abrir o arquivo direto:** dê um duplo clique em `index.html`.
Tudo funciona, exceto o modo offline (o navegador bloqueia Service Worker em
`file://`).

---

## Como instalar no iPhone (iOS)

O app é uma **PWA**: instala pela tela de início, sem App Store e sem custo.

1. Publique a pasta em HTTPS (veja abaixo) — o iOS exige HTTPS para instalar.
2. Abra o endereço **no Safari** (não funciona pelo Chrome no iOS).
3. Toque no botão **Compartilhar** (o quadrado com a seta para cima).
4. Escolha **Adicionar à Tela de Início** e confirme.

O Barilife passa a abrir em tela cheia, com ícone próprio e sem a barra do
navegador. No Android, o próprio navegador oferece *Instalar aplicativo*.

### Publicando de graça com GitHub Pages

1. No repositório, vá em **Settings → Pages**.
2. Em *Source*, escolha **Deploy from a branch**.
3. Selecione a branch e a pasta **/ (root)** e salve.
4. Em alguns minutos o app fica em
   `https://<usuário>.github.io/peso-real/barilife/`.

---

## Estrutura dos arquivos

```
barilife/
├── index.html              estrutura das telas
├── manifest.webmanifest    metadados da PWA (nome, ícones, cores)
├── sw.js                   Service Worker — cache para uso offline
├── assets/
│   ├── css/app.css         tokens de design, componentes e telas
│   └── js/
│       ├── qr.js           gerador de QR Code próprio (ver abaixo)
│       ├── data.js         base de dados fictícia
│       └── app.js          estado, navegação e lógica de todas as telas
└── icons/                  ícones do app (192, 512, maskable, apple-touch)
```

## Decisões técnicas

**HTML, CSS e JavaScript puros.** Sem framework, sem CDN e sem dependência
externa — o app inteiro é baixado do próprio domínio, o que também é o que
permite o funcionamento offline.

**Gerador de QR Code próprio** (`assets/js/qr.js`). Em vez de carregar uma
biblioteca, o QR é implementado do zero seguindo a norma **ISO/IEC 18004**:
aritmética em GF(256), correção de erro Reed–Solomon (nível M, versões 1 a 10),
posicionamento em zigue-zague, informação de formato/versão com BCH e escolha
da máscara pelas quatro regras de penalidade do padrão.

A implementação foi validada de duas formas: comparação **módulo a módulo**
contra a biblioteca de referência `qrcode` do Python (86 de 86 casos idênticos
com máscara fixa) e **decodificação** dos QR gerados pelo app com o leitor do
OpenCV, incluindo conteúdo com acentuação em UTF-8.

**Armazenamento local.** Tudo que o usuário preenche fica em `localStorage`,
neste dispositivo. Nenhum dado é enviado para servidores. O contador de água
zera sozinho quando vira o dia, e a foto de perfil é redimensionada para
256 px antes de ser guardada, para não estourar a cota do navegador.

**Tema claro e escuro** automáticos, seguindo a preferência do sistema, e
respeito às áreas seguras do iPhone (notch e barra inferior).

---

Feito com HTML, CSS e JavaScript. Sem dependências.
