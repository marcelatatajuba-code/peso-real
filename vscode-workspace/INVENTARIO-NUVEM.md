# Inventário — o que existe hoje na sua conta Claude

Varredura feita em 17/08/2026 a partir da sessão remota do Claude Code.
Este arquivo é o retrato do que está **na sua conta claude.ai** (nuvem).
O que está **na sua máquina** sai no `INVENTARIO-LOCAL.md`, gerado pelo `varredura.py`.

## Resumo

| Componente | Quantidade | Onde vive hoje |
|---|:-:|---|
| Skills | **21** | conta claude.ai (sincronizadas em `~/.claude/skills/synced/`) |
| Plugins | **4** | conta claude.ai |
| Conectores MCP instalados | **23** | conta claude.ai |
| └ ativos nesta sessão | 11 | — |
| Repositórios GitHub | **1** | github.com/marcelatatajuba-code |
| Subagentes próprios | **0** | — (só os que já vêm prontos) |

> **Sobre os "34 projetos":** os projetos do Cowork/Claude Desktop são pastas na
> **sua máquina** e não aparecem nesta varredura remota — este container só
> enxerga o repositório `peso-real` e as skills sincronizadas. O `varredura.py`
> resolve isso: rodando na sua máquina, ele acha as 34 pastas e monta o
> workspace com elas.

---

## 1. Skills (21)

### Suas, feitas sob medida (14)

| Skill | Para que serve | Peso |
|---|---|:-:|
| `/contexto-zup` | Memória permanente: quem você é, seu time, suas entregas | 16K |
| `/arquiteta-ai` | Te orienta em decisão de arquitetura de AI (skill? agente? MCP?) | 40K |
| `/mapear-projeto` | Diagnostica UM projeto por dentro — retrato em 10 blocos | 28K |
| `/bases-npj` | Bases B1 × B2 do NPJ, mapeamento de AI, projetos por comunidade | 16K |
| `/painel-npj` | Painel Único NPJ — abas, lentes, ciclo mensal, Lambda | 12K |
| `/wgo-npj` | Cerimônia WGO: preparar deck, pauta, ingestão de material | 16K |
| `/material-parceiro-itau` | Decks executivos Itaú no layout do kickoff (HTML→PDF+PPTX) | 156K |
| `/powerbi-zup` | Extrai dados dos painéis Power BI da Zup e replica em HTML | 100K |
| `/bia-coordenadora` | Coordenadora do contencioso RC Ônibus (Rueda × Kovr) | 36K |
| `/analista-dados-juridicos` | Triagem de publicações, régua de risco, fila do dia | 12K |
| `/assistente-viagem-chile` | Protocolo da viagem Santiago 13–20/jul/2026 | 8K |
| `/roteiro-viagem` | Roteiro dia-a-dia com custo, deslocamento e plano B | 8K |
| `/orcamento-viagem` | Orçamento por categoria, por pessoa, com câmbio datado | 8K |
| `/comparar-destinos` | Matriz de decisão ponderada entre destinos | 8K |

### Da Anthropic, de manipulação de arquivo (4)

`/xlsx` (planilhas) · `/docx` (Word) · `/pptx` (slides) · `/pdf` (PDF)

Essas quatro são as que fazem o Claude **produzir e ler arquivo de verdade**.
São as mais pesadas (1.3M cada) porque trazem scripts Python junto.

### Exemplos da Anthropic (3)

`/skill-creator` (criar e testar skills) · `/doc-coauthoring` (escrever docs a quatro mãos) · `/morning` (brief matinal)

---

## 2. Plugins (4)

Plugin = um pacote que junta várias skills + agentes + MCP sob um nome só.

| Plugin | O que traz |
|---|---|
| `contexto-zup-completo` | Kit Zup/Itaú IBBA: SRE Cross Crédito Atacado, FinOps, material executivo IBBA, portal SharePoint NPJ, design e produção Zup |
| `video-marcela` | Edição de vídeo em 3 eixos (Pra Nós, AI, Corrida). Pipeline local: ffmpeg, auto-editor, PySceneDetect, Whisper |
| `conteudo-social` | Conteúdo pessoal: TikTok, LinkedIn, Instagram — roteiros, posts, carrosséis, calendário editorial |
| `cowork-plugin-management` | Ferramenta para criar e gerenciar seus próprios plugins |

---

## 3. Conectores MCP (23 instalados)

### Ativos e conectados (11)

| Conector | Serve para |
|---|---|
| **Google Drive** | Buscar, ler e subir arquivos — a sua ponte com as planilhas |
| **Notion** | Ler e escrever páginas e bases do Notion |
| **Figma** | Contexto de design → código, diagramas, FigJam |
| **Canva** | Criar, autofill e exportar designs |
| **Adobe for creativity** | Express, imagem, vídeo, InDesign, fontes |
| **Make** | Rodar cenários de automação |
| **Descript** | Editar vídeo/áudio editando texto |
| **Hugging Face** | Modelos, datasets e Spaces |
| **Booking.com** | Hotéis (viagem) |
| **LunarCrush** | Dados sociais em tempo real |
| **Spotify** | Música |

### Instalados mas desligados nesta sessão (12)

Microsoft 365 (SharePoint/OneDrive/Outlook/Teams) · Gmail · GitHub · Cloudinary ·
Expedia · Kiwi.com · Tripadvisor · Viator · TomTom Maps · Felt Maps · Windsor.ai

> **Microsoft 365 e Gmail estão desligados.** Para o ambiente Itaú/Zup esses dois
> são provavelmente os mais importantes da lista — vale ligar.

---

## 4. Repositórios GitHub (1)

| Repo | O que é |
|---|---|
| `marcelatatajuba-code/peso-real` | App web de conversão peso chileno → real. Um `index.html` de 34KB, PWA, tema escuro, integração com modelo de visão para ler etiqueta de preço pela câmera. Feito para a viagem ao Chile. |

---

## 5. Subagentes próprios: nenhum

Você ainda não criou subagente nenhum. Hoje você usa os que já vêm prontos
(`Explore` para buscar, `Plan` para planejar, `general-purpose` para o resto).

**Isso é uma oportunidade, não um problema.** Ver a seção "Onde você tem folga"
do guia.
