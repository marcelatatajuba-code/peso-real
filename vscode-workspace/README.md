# Workspace VS Code — Marcela

Material para montar o ambiente de trabalho no VS Code com todos os projetos,
skills, agentes e conectores.

## Comece por aqui

**[GUIA-PASSO-A-PASSO.md](GUIA-PASSO-A-PASSO.md)** — o guia. Do "o que é o VS Code"
até o ambiente rodando. 8 passos, ~20 minutos para os cinco primeiros.

## O que tem nesta pasta

| Arquivo | O que é |
|---|---|
| `GUIA-PASSO-A-PASSO.md` | O guia completo: conceito, mapa de onde cada coisa vive, instalação, primeira semana, solução de problemas |
| `INVENTARIO-NUVEM.md` | A varredura da sua conta Claude: 21 skills, 4 plugins, 23 conectores, 1 repo — com o que cada um faz |
| `varredura.py` | Script que roda **na sua máquina** e acha os projetos que a varredura remota não alcança |
| `EXEMPLO.code-workspace` | Um workspace comentado, para você ver como é por dentro |
| `modelo-projeto/` | Modelos prontos: `CLAUDE.md`, `settings.json`, uma skill e um subagente, todos comentados |

## O caminho curto

```bash
python3 varredura.py
```

Gera dois arquivos:

- `INVENTARIO-LOCAL.md` — o retrato do que existe na sua máquina
- `Marcela.code-workspace` — o workspace pronto, com os projetos agrupados por tema

Dois cliques no `.code-workspace` e está aberto.

## Por que a varredura tem duas partes

A varredura remota (`INVENTARIO-NUVEM.md`) enxerga a sua **conta**: skills,
plugins, conectores, repositórios. Ela não enxerga o seu **disco** — os projetos
do Cowork são pastas na sua máquina, e nenhuma sessão remota alcança elas.

O `varredura.py` cobre essa metade. Juntos, os dois dão o retrato inteiro.

## Sobre a pasta `modelo-projeto/dot-claude/`

Chama-se `dot-claude` e não `.claude` de propósito, para não ser carregada por
engano enquanto está aqui como modelo. Ao copiar para um projeto seu,
**renomeie para `.claude`** — o ponto na frente é o que faz o Claude Code
reconhecer a pasta.
