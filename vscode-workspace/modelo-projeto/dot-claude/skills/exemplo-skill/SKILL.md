---
name: exemplo-skill
description: Modelo comentado de skill de projeto. Substitua esta descrição pela sua — ela é o que faz o Claude decidir sozinho quando carregar a skill, então escreva os gatilhos de verdade ("use SEMPRE que...", "acione quando o usuário disser...").
---

# Exemplo de skill de projeto

> Este arquivo é um modelo. Ele fica em `<projeto>/.claude/skills/<nome>/SKILL.md`
> e vale **só dentro deste projeto**. Para valer em todos, o mesmo arquivo vai
> para `~/.claude/skills/<nome>/SKILL.md`.

## Anatomia de uma skill

Uma skill tem duas partes e só:

1. **O bloco entre `---`** (frontmatter) — `name` e `description`.
   A `description` é a parte que importa mais: é o único texto que o Claude lê
   antes de decidir se carrega a skill. Se ela for vaga, a skill nunca dispara.
   As suas skills boas (`/bases-npj`, `/painel-npj`) acertam nisso — listam os
   termos exatos que você fala.

2. **O corpo** — as instruções. Só carregam quando a skill dispara, então pode
   ser longo sem custar nada no dia a dia.

## Quando vale a pena criar uma

Crie quando você se pegar colando o mesmo texto pela terceira vez, ou quando
uma seção do `CLAUDE.md` deixou de ser um fato e virou um procedimento.

## Estrutura sugerida para o corpo

### Quando usar
Os casos concretos.

### Passo a passo
1.
2.
3.

### Regras que não se quebram
-

### Formato de saída
Como a resposta deve sair.

## Arquivos de apoio

A skill pode ser uma pasta, não só um arquivo. Coloque ao lado:

```
exemplo-skill/
  SKILL.md
  referencias/tabela-de-de-para.md
  scripts/processa.py
```

E cite no corpo: "use `scripts/processa.py` para o cruzamento". O Claude só lê
esses arquivos quando precisa — não pesam até serem usados.

## Como testar

No painel do Claude, digite `/exemplo-skill` para chamar na força. Para testar
se ela dispara **sozinha**, escreva uma frase natural que deveria acionar e veja
se ela entra. Se não entrar, o problema está na `description`.

Sua skill `/skill-creator` faz esse teste de forma estruturada, com eval.
