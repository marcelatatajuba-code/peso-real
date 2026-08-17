---
name: exemplo-agente
description: Modelo comentado de subagente. Descreva aqui QUANDO delegar para ele — é isso que o Claude principal lê para decidir se chama.
tools: Read, Grep, Glob
---

Você é um <especialista em X>.

> Este arquivo é um modelo. Ele fica em `~/.claude/agents/<nome>.md` (vale para
> tudo que é seu) ou em `<projeto>/.claude/agents/<nome>.md` (vale só ali).

## Skill × subagente — a diferença

| | Skill | Subagente |
|---|---|---|
| O que é | Um procedimento escrito | Um Claude auxiliar |
| Contexto | O mesmo da sua conversa | **Separado** — o dele não polui o seu |
| Devolve | Vai fazendo junto com você | Só a conclusão final |
| Bom para | "Quando X, faça assim" | "Vá fazer isso inteiro e me traga o resultado" |

O ganho real do subagente é **não sujar sua conversa**. Se a tarefa envolve ler
40 arquivos para achar 3 respostas, o subagente lê os 40 no contexto dele e te
entrega as 3. Sua conversa continua limpa.

O segundo ganho é paralelismo: vários subagentes rodam ao mesmo tempo.

## O campo `tools`

Liste só o que este agente precisa. Um agente que só investiga não deveria poder
escrever — `Read, Grep, Glob` basta. Omita a linha inteira para dar acesso a tudo.

## Sua tarefa

Descreva o que ele faz, passo a passo.

1.
2.
3.

## O que devolver

Seja específico. O texto final dele é o valor que volta para a conversa
principal — não é uma mensagem para uma pessoa ler, é um dado.

Exemplo: "Devolva uma tabela markdown com as colunas Squad, Comunidade,
Respondeu (sim/não). Sem introdução, sem conclusão, só a tabela."

## O que NÃO fazer

- Não altere arquivo nenhum
- Não invente dado que não achou — devolva "não encontrado"
