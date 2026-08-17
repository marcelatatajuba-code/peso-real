# VS Code do zero — guia para montar seu ambiente

Escrito para quem nunca abriu o VS Code. Você não precisa saber programar
para usar nada do que está aqui.

---

## Parte 1 — Entendendo a ferramenta antes de instalar

### O que o VS Code é (e o que ele não é)

O VS Code é um **navegador de pastas do seu computador com um editor de texto
embutido**. Só isso. Ele não guarda nada na nuvem, não tem projeto próprio, não
tem banco de dados. Ele abre pastas que já existem no seu disco.

A comparação que funciona: o VS Code está para as suas pastas de projeto
como o Excel está para os seus `.xlsx`. O Excel não *tem* as planilhas — ele
abre as que estão no disco. O VS Code é igual.

**A consequência prática disso é a coisa mais importante deste guia:** para um
projeto seu aparecer no VS Code, ele precisa ser uma **pasta na sua máquina**.
Projeto que só existe como conversa no claude.ai não tem pasta, e portanto não
tem como aparecer. Você vai descobrir quais dos seus 34 têm pasta rodando o
`varredura.py` (Parte 3).

### A tela, em 5 regiões

```
┌──────┬────────────────┬─────────────────────────────┬──────────────┐
│      │                │                             │              │
│  1   │       2        │              3              │      5       │
│ Barra│   Explorador   │          Editor             │    Claude    │
│  de  │   (suas        │      (o arquivo aberto)     │    Code      │
│ ativ.│    pastas)     │                             │              │
│      │                ├─────────────────────────────┤              │
│      │                │        4  Terminal          │              │
└──────┴────────────────┴─────────────────────────────┴──────────────┘
```

| # | Região | Para que serve no seu dia |
|---|---|---|
| 1 | **Barra de atividades** (extrema esquerda) | Trocar de "modo": arquivos, busca, git, extensões, Claude |
| 2 | **Explorador** | A lista das suas pastas de projeto. É aqui que os 34 vão aparecer |
| 3 | **Editor** | Onde você lê e escreve. Markdown, planilha, HTML, o que for |
| 4 | **Terminal** | A linha de comando. Você vai usar em 3 momentos só (instalar, sincronizar skill, rodar script) |
| 5 | **Painel do Claude** | O Claude Code morando dentro do editor, vendo seus arquivos |

Quatro atalhos e você navega tudo:

| Atalho (Mac) | Atalho (Windows) | O que faz |
|---|---|---|
| `Cmd + P` | `Ctrl + P` | Abrir qualquer arquivo pelo nome — **o mais útil de todos** |
| `Cmd + Shift + P` | `Ctrl + Shift + P` | Paleta de comandos: digita o que quer fazer em português mesmo |
| `Cmd + Shift + F` | `Ctrl + Shift + F` | Buscar um texto em **todos** os projetos ao mesmo tempo |
| `` Ctrl + ` `` | `` Ctrl + ` `` | Abrir/fechar o terminal |

### O que é um *workspace*

Um projeto aberto sozinho = uma pasta.
Um **workspace** = várias pastas abertas juntas, na mesma janela.

O workspace é literalmente um arquivo de texto, o `.code-workspace`, com a
lista das pastas. É o "caderno com divisórias" que você quer montar: NPJ,
Itaú, jurídico, viagem, apps — todos abertos ao mesmo tempo, com busca única
atravessando tudo.

Você abre ele uma vez e o VS Code lembra. Dois cliques no arquivo e seus 34
projetos estão na tela.

---

## Parte 2 — Onde cada coisa vive

Esta é a tabela que responde "onde eu coloco cada coisa". Guarde ela.

| O que é | Onde fica | Vale para | Como você usa |
|---|---|---|---|
| **Um projeto** | uma pasta qualquer no disco | — | entra como uma linha do `.code-workspace` |
| **Memória do projeto** | `CLAUDE.md` na raiz do projeto | esse projeto | fatos fixos: quem é o cliente, onde estão os dados, o que não fazer |
| **Skill do projeto** | `<projeto>/.claude/skills/<nome>/SKILL.md` | esse projeto | procedimento que só faz sentido ali |
| **Skill pessoal** | `~/.claude/skills/<nome>/SKILL.md` | todos os projetos | as suas 14 skills sob medida |
| **Skill sincronizada do claude.ai** | `~/.claude/skills/synced/` | todos os projetos | baixada com o comando do passo 6 |
| **Subagente** | `~/.claude/agents/<nome>.md` ou `<projeto>/.claude/agents/` | conforme o nível | um "especialista" com contexto próprio |
| **MCP do projeto** | `<projeto>/.mcp.json` | esse projeto, e vai pro git | conector que o time inteiro precisa |
| **MCP pessoal** | `~/.claude.json` | conforme o escopo escolhido | seus conectores com login seu |
| **Permissões e hooks** | `<projeto>/.claude/settings.json` | esse projeto | o que o Claude pode fazer sem perguntar |
| **Configuração do editor** | `<projeto>/.vscode/settings.json` | esse projeto | fonte, formatação, o que esconder |

Repare no padrão: **`~/` = vale para tudo que é seu. `<projeto>/` = vale só
ali dentro.** Todo o resto é decoração.

### A diferença que vai te pegar

O Claude do claude.ai/Cowork e o Claude do VS Code **não são o mesmo ambiente**.
Isto não é bug, é como funciona:

| | claude.ai / Cowork | Claude Code no VS Code |
|---|---|---|
| Skills | as que você habilitou na conta | as que estão em `~/.claude/skills/` no disco |
| Conectores (Notion, Drive, Figma…) | já conectados, prontos | **não vêm junto** — reconectar como MCP |
| Arquivos | os que você anexa | **a pasta inteira**, sem anexar nada |
| Terminal, git, rodar script | não | sim |
| Editar 12 arquivos de uma vez | não | sim |

**As suas 21 skills não aparecem sozinhas no VS Code.** Elas moram na conta
claude.ai. Precisam ser baixadas uma vez (passo 6). Depois disso ficam no
disco e carregam em toda sessão local.

**Os seus 23 conectores também não atravessam.** No VS Code eles viram
servidores MCP, adicionados um a um com `claude mcp add` (passo 7). Você não
vai querer os 23 — vai querer uns 5.

### Quando usar cada um

| Situação | Use |
|---|---|
| Conversa solta, pergunta rápida, anexar um PDF | claude.ai |
| Uma planilha, um deck, um documento | Cowork / claude.ai |
| Mexer em muitos arquivos do mesmo projeto | **VS Code** |
| Comparar coisas entre projetos diferentes | **VS Code** (busca única) |
| Versionar, ter histórico, poder voltar atrás | **VS Code** (git) |
| Rodar um script Python de skill sua | **VS Code** (terminal) |
| Estar longe da máquina | claude.ai / celular |

Não é migração. É escolher a mesa certa para cada tarefa.

---

## Parte 3 — Passo a passo

Faça na ordem. Do passo 1 ao 5 são ~20 minutos.

### Passo 1 · Instalar o VS Code

Baixe em <https://code.visualstudio.com> e instale normalmente.

No Mac, arraste para a pasta Aplicativos. Abra uma vez para o Mac liberar.

### Passo 2 · Instalar a extensão do Claude Code

1. Abra o VS Code
2. `Cmd + Shift + X` (Mac) / `Ctrl + Shift + X` (Windows) — abre Extensões
3. Busque **"Claude Code"**
4. Clique em **Install** na da Anthropic
5. Se não aparecer nada depois, `Cmd + Shift + P` → "Developer: Reload Window"

Requisito: VS Code 1.94 ou mais novo, e sua assinatura Max (que você já tem).

### Passo 3 · Entrar na sua conta

1. Clique no ícone de faísca (✱) na barra da esquerda, ou no
   **✱ Claude Code** no canto inferior direito
2. Clique em **Sign in** e autorize no navegador
3. Escolha **Claude.ai Subscription** — não Console

> Escolher "Claude.ai Subscription" é o que libera duas coisas: usar sua Max
> sem gastar API, e retomar no VS Code as sessões que você começou no
> claude.ai (aba **Web** no histórico de sessões).

### Passo 4 · Instalar o CLI

A extensão traz uma cópia própria do Claude para o painel de chat, mas para
rodar `claude` no terminal — necessário nos passos 6 e 7 — você precisa do CLI.

Abra o terminal do VS Code com `` Ctrl + ` `` e cole:

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

No Windows, use PowerShell:

```powershell
irm https://claude.ai/install.ps1 | iex
```

No Mac, se você usa Homebrew, `brew install --cask claude-code` também serve.

Confira se funcionou:

```bash
claude --version
```

Deve imprimir algo como `2.1.211 (Claude Code)`. Se der `command not found`,
feche o terminal e abra outro — o instalador mexe no caminho e o terminal
antigo não enxerga.

> Se em algum momento você quiser diagnosticar a instalação inteira sem abrir
> sessão, `claude doctor` mostra tudo: versão, erros de configuração, avisos.

### Passo 5 · Rodar a varredura e gerar o workspace

Este é o passo que resolve os 34 projetos.

1. Baixe a pasta `vscode-workspace/` deste repositório para a sua máquina
2. No terminal do VS Code, vá até ela e rode:

```bash
python3 varredura.py
```

No Windows: `python varredura.py`

O script varre Documentos, Área de Trabalho, Downloads, OneDrive, iCloud e as
pastas de projeto mais comuns, procurando qualquer pasta que tenha `.git`,
`.claude/` ou `CLAUDE.md`. Ele **só lê** — não move, não apaga, não altera nada.

Saem dois arquivos:

- **`INVENTARIO-LOCAL.md`** — o retrato: quantos projetos, quais skills, quais
  agentes, quais MCPs, onde cada um está
- **`Marcela.code-workspace`** — o workspace pronto, com os projetos já
  agrupados por tema (01 ZUP·NPJ, 02 ITAU, 03 JURIDICO, 04 DADOS, 05 APPS,
  06 CONTEUDO, 07 PESSOAL, 08 OUTROS)

Se ele achar menos projetos do que você esperava, aponte a pasta certa:

```bash
python3 varredura.py ~/Documents/Zup ~/Documents/Pessoal
```

3. Abra o workspace: dois cliques no `Marcela.code-workspace`, ou no VS Code
   **File → Open Workspace from File…**

Seus projetos estão no Explorador, agrupados. O VS Code vai sugerir instalar
as 5 extensões recomendadas — aceite.

> **Os nomes começam com número de propósito.** O VS Code lista as pastas na
> ordem do arquivo, sem agrupamento nativo. O prefixo `01`, `02`, `03` é o que
> mantém os temas juntos e na ordem que você quer. Para reordenar, edite o
> `.code-workspace` e troque os números.

### Passo 6 · Trazer suas 21 skills para a máquina

No terminal, uma vez só:

```bash
CLAUDE_CODE_SYNC_SKILLS=1 claude -p "Liste as skills que você tem disponíveis"
```

No Windows PowerShell:

```powershell
$env:CLAUDE_CODE_SYNC_SKILLS=1; claude -p "Liste as skills que você tem disponíveis"
```

Ele baixa tudo para `~/.claude/skills/synced/`, responde e sai. As skills ficam
no disco. **A partir daí toda sessão local carrega elas** — não precisa repetir.

Para conferir: abra o painel do Claude e digite `/` — suas skills aparecem na
lista. Ou rode `/skills`, que mostra elas sob "claude.ai sync".

> Repita esse comando **sempre que criar ou editar uma skill no claude.ai**.
> A sincronização não é automática.

### Passo 7 · Reconectar os conectores que importam

Seus 23 conectores ficaram no claude.ai. No VS Code, adicione só os que você
usa de verdade — provavelmente uns 5, não 23.

O formato é sempre o mesmo:

```bash
claude mcp add --transport http --scope user <apelido> <url-do-servidor>
```

O `--scope user` faz valer em todos os projetos. Sem ele, vale só no projeto
onde você rodou o comando.

Exemplo com o Notion:

```bash
claude mcp add --transport http --scope user notion https://mcp.notion.com/mcp
```

**Para pegar a URL dos outros** (Figma, Canva, Make, Descript…), abra o
diretório de conectores em <https://claude.ai/directory>. Os conectores de lá
usam a mesma infraestrutura MCP do Claude Code, então qualquer um da lista pode
ser adicionado com esse comando — a página de cada um mostra a URL.

Depois de adicionar, faça login em cada servidor que pede autenticação:

```bash
claude mcp login notion
```

E confira o resultado:

```bash
claude mcp list
```

Cada servidor aparece com um status: `✔ Connected`, `! Needs authentication`
(falta o login acima) ou `✘ Failed to connect`.

> **Google Drive e Microsoft 365** merecem atenção separada: no ambiente Itaú
> a política de TI pode exigir aprovação. Vale confirmar com a segurança antes.
> Enquanto isso, o VS Code lê direto as pastas sincronizadas do OneDrive e do
> Drive no seu disco — para muita coisa, isso já basta e não depende de nada.

### Passo 8 · Dar memória aos projetos que importam

Escolha os 5 projetos que você mais toca. Em cada um, crie um `CLAUDE.md` na
raiz. Tem um modelo pronto em `modelo-projeto/CLAUDE.md`.

Você não precisa escrever à mão. Abra o projeto, chame o Claude no painel e
peça: *"lê essa pasta e escreve um CLAUDE.md com o que você entendeu"*. Depois
corrija o que ele errou. Leva 3 minutos por projeto.

Faça isso e o Claude para de perguntar o óbvio toda vez que você abre o projeto.

---

## Parte 4 — Onde você tem folga

A varredura mostrou uma coisa: **você tem 21 skills e 0 subagentes.**

Skill é procedimento — "quando acontecer X, faça assim". Subagente é
delegação — "vá fazer isso inteiro sozinho, num contexto separado, e me traga
só a conclusão".

Duas coisas do seu dia pedem subagente e hoje não têm:

| Situação de hoje | O que um subagente resolveria |
|---|---|
| Cruzar B1 × B2 e conferir cobertura do mapeamento NPJ | Um agente `auditor-npj` varre as duas bases, valida, e devolve só as divergências — sem encher a sua conversa com o caminho |
| Preparar a WGO lendo 6 decks | Um agente por deck, em paralelo, cada um devolvendo o resumo. O que hoje é sequencial vira simultâneo |

Um subagente é um arquivo `.md` em `~/.claude/agents/`. Tem exemplo comentado
em `modelo-projeto/dot-claude/agents/`.

Não faça isso na primeira semana. Faça quando a primeira semana já estiver
rodando — e quando fizer, chame a `/arquiteta-ai`, que é exatamente a skill
que você construiu para essa decisão.

---

## Parte 5 — Primeira semana

Um por dia. Nenhum leva mais de 15 minutos.

| Dia | Faça isto |
|---|---|
| 1 | Passos 1 a 5. Abra o workspace e só olhe. Clique nas pastas |
| 2 | `Cmd+Shift+F` e busque "NPJ" em tudo. Veja o que aparece de onde |
| 3 | Passo 6. Rode uma skill sua pelo painel: `/mapear-projeto` num projeto bagunçado |
| 4 | Passo 8 num projeto só. Peça o `CLAUDE.md` ao Claude e corrija |
| 5 | Passo 7. Conecte o Notion. Peça algo que cruze Notion + arquivo local |
| 6 | Abra o `peso-real`, instale o Live Server, clique em **Go Live** e veja seu app rodando |
| 7 | Releia o `INVENTARIO-LOCAL.md`. Decida o que arquivar |

---

## Se algo der errado

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| Extensão não aparece depois de instalar | Janela não recarregou | `Cmd+Shift+P` → "Developer: Reload Window" |
| "Not logged in · Please run /login" | Sessão caiu | Clique em Sign in de novo; se não abrir, recarregue a janela |
| Pede API key mesmo você tendo Max | VS Code não herdou o ambiente do shell | Feche e abra pelo terminal: `code .` |
| Suas skills não aparecem com `/` | Passo 6 não rodou, ou rodou antes de você habilitar a skill | Rode o comando do passo 6 de novo |
| `claude: command not found` | CLI não instalado ou terminal aberto antes da instalação | Passo 4, e abra um terminal novo |
| A varredura achou 3 projetos, não 34 | Suas pastas estão fora das raízes padrão | `python3 varredura.py ~/caminho/certo` |
| MCP com `! Needs authentication` | Falta fazer login no conector | Rode `claude` e siga o fluxo de login |
| Uma pasta some do Explorador | Foi movida ou renomeada no disco | Edite o caminho no `.code-workspace` |

---

## Glossário

| Termo | Em português claro |
|---|---|
| **Workspace** | Arquivo que lista quais pastas abrir juntas |
| **Extensão** | Plugin do VS Code (não confundir com plugin do Claude) |
| **CLI** | O Claude que roda digitando `claude` no terminal |
| **MCP** | O padrão que conecta o Claude a serviços externos (Notion, Drive…) |
| **Skill** | Procedimento escrito num `SKILL.md` que o Claude carrega quando é o caso |
| **Subagente** | Um Claude auxiliar, com contexto próprio, que faz uma tarefa e volta com a resposta |
| **Plugin (do Claude)** | Pacote que junta skills + agentes + MCP sob um nome |
| **Hook** | Regra automática: "antes/depois de X, execute Y" |
| **Repositório (repo)** | Pasta com histórico de versões (git) |
| **Escopo** | Até onde uma configuração vale: só esse projeto, ou tudo seu |
