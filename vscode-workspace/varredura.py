#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
VARREDURA — mapeia tudo que você tem na SUA máquina e gera o workspace do VS Code.

O que ele faz (só leitura, não apaga e não move nada):
  1. Procura seus projetos (pastas com .git, com .claude/ ou com CLAUDE.md)
  2. Lista suas skills locais (~/.claude/skills e as de cada projeto)
  3. Lista seus subagentes (~/.claude/agents e os de cada projeto)
  4. Lista seus plugins (~/.claude/plugins)
  5. Lista seus servidores MCP (~/.claude.json e cada .mcp.json)
  6. Escreve dois arquivos:
       - INVENTARIO-LOCAL.md   -> o retrato do que existe hoje
       - Marcela.code-workspace -> o workspace pronto para abrir no VS Code

COMO RODAR (Mac):
    python3 varredura.py

COMO RODAR (Windows, no PowerShell):
    python varredura.py

Quer varrer uma pasta específica também? Passe o caminho:
    python3 varredura.py ~/Documents/Trabalho "/Users/marcela/Library/CloudStorage"
"""

import json
import os
import platform
import re
import sys
from datetime import datetime
from pathlib import Path

# ---------------------------------------------------------------- configuração

HOME = Path.home()

# Onde procurar projetos, se você não passar nada na linha de comando.
RAIZES_PADRAO = [
    HOME / "Documents",
    HOME / "Documentos",
    HOME / "Desktop",
    HOME / "Área de Trabalho",
    HOME / "Projetos",
    HOME / "projects",
    HOME / "dev",
    HOME / "Downloads",
    HOME / "Library" / "CloudStorage",          # OneDrive / Google Drive / iCloud no Mac
    HOME / "Library" / "Mobile Documents",      # iCloud Drive no Mac
    HOME / "OneDrive",
    HOME / "Zup",
    HOME / "claude",
    HOME / "Claude",
]

# Pastas que nunca valem a pena varrer.
IGNORAR = {
    "node_modules", ".git", ".venv", "venv", "__pycache__", ".next", ".cache",
    "dist", "build", ".Trash", "Library", "Applications", ".npm", ".nvm",
    "site-packages", ".terraform", "target", ".gradle", ".idea", "Pictures",
    "Music", "Movies", "Fotos", "Filmes", ".vscode-server", "Photos Library.photoslibrary",
}

PROFUNDIDADE_MAX = 4  # quantos níveis abaixo de cada raiz o script desce

# Como agrupar os projetos no workspace. Ordem = ordem que aparece no VS Code.
# Cada regra é (rótulo do grupo, lista de palavras-chave no nome da pasta).
GRUPOS = [
    ("01 ZUP·NPJ",    ["npj", "negocios-pj", "negócios", "painel", "wgo", "okr", "zup", "advocate", "assessment"]),
    ("02 ITAU",       ["itau", "itaú", "ibba", "sre", "credito", "crédito", "finops", "atacado", "kickoff"]),
    ("03 JURIDICO",   ["juridic", "jurídic", "rueda", "kovr", "bia", "contencioso", "elawio", "xjur", "sinistro"]),
    ("04 DADOS",      ["powerbi", "power-bi", "base", "planilha", "dados", "xlsx", "indicador", "relatorio", "relatório"]),
    ("05 APPS",       ["app", "peso", "real", "web", "site", "html", "prototipo", "protótipo", "front"]),
    ("06 CONTEUDO",   ["conteudo", "conteúdo", "video", "vídeo", "social", "linkedin", "tiktok", "instagram", "post"]),
    ("07 PESSOAL",    ["viagem", "chile", "santiago", "orcamento", "orçamento", "roteiro", "corrida", "casal", "pra-nos"]),
]
GRUPO_PADRAO = "08 OUTROS"

EXTENSOES_RECOMENDADAS = [
    "anthropic.claude-code",          # o Claude dentro do VS Code — a principal
    "yzhang.markdown-all-in-one",     # escrever e pré-visualizar Markdown
    "mechatroner.rainbow-csv",        # abrir CSV com colunas coloridas
    "ms-python.python",               # rodar os scripts .py das suas skills
    "ritwickdey.LiveServer",          # ver um HTML rodando no navegador com 1 clique
]

# ------------------------------------------------------------------ utilidades


def texto(valor):
    return str(valor).replace(str(HOME), "~")


def eh_ignoravel(nome):
    return nome in IGNORAR or nome.startswith(".") and nome not in {".claude"}


def grupo_de(nome_pasta):
    alvo = nome_pasta.lower()
    for rotulo, chaves in GRUPOS:
        if any(chave in alvo for chave in chaves):
            return rotulo
    return GRUPO_PADRAO


# ------------------------------------------------------------------- varredura


def achar_projetos(raizes):
    """Devolve lista de dicts descrevendo cada projeto encontrado."""
    achados = {}

    def desce(pasta, nivel):
        if nivel > PROFUNDIDADE_MAX:
            return
        try:
            filhos = list(pasta.iterdir())
        except (PermissionError, OSError):
            return

        nomes = {f.name for f in filhos if f.is_dir()}
        arquivos = {f.name for f in filhos if f.is_file()}

        eh_git = ".git" in nomes
        tem_claude = ".claude" in nomes
        tem_memoria = "CLAUDE.md" in arquivos

        # A pasta pessoal (~) tem .claude mas não é um projeto — ela entra no
        # workspace separada, como "sala de máquinas".
        if (eh_git or tem_claude or tem_memoria) and pasta != HOME:
            achados[str(pasta)] = {
                "caminho": pasta,
                "nome": pasta.name,
                "git": eh_git,
                "claude": tem_claude,
                "memoria": tem_memoria,
            }
            # Um repo git não precisa ser varrido por dentro.
            if eh_git:
                return

        for filho in filhos:
            if filho.is_dir() and not filho.is_symlink() and not eh_ignoravel(filho.name):
                desce(filho, nivel + 1)

    for raiz in raizes:
        if raiz.exists() and raiz.is_dir():
            desce(raiz, 0)

    return sorted(achados.values(), key=lambda p: (grupo_de(p["nome"]), p["nome"].lower()))


def ler_frontmatter(caminho_skill):
    """Extrai name/description do topo de um SKILL.md.

    Entende tanto `description: texto` quanto os blocos YAML `description: >`
    e `description: |` com o texto recuado nas linhas seguintes.
    """
    try:
        bruto = caminho_skill.read_text(encoding="utf-8", errors="replace")[:8000]
    except OSError:
        return {}
    if not bruto.startswith("---"):
        return {}
    fim = bruto.find("\n---", 3)
    if fim == -1:
        return {}

    linhas = bruto[3:fim].splitlines()
    campos = {}
    chave_aberta = None
    bloco = []

    def fecha():
        if chave_aberta and bloco:
            campos[chave_aberta] = " ".join(p.strip() for p in bloco if p.strip())

    for linha in linhas:
        m = re.match(r"^(name|description)\s*:\s*(.*)$", linha)
        if m:
            fecha()
            chave_aberta, bloco = None, []
            valor = m.group(2).strip()
            if valor in {">", ">-", "|", "|-", ">+", "|+", ""}:
                chave_aberta = m.group(1)          # o texto vem nas próximas linhas
            else:
                campos[m.group(1)] = valor.strip("'\"")
        elif chave_aberta and (linha.startswith((" ", "\t")) or not linha.strip()):
            bloco.append(linha)
        elif linha.strip() and not linha.startswith((" ", "\t")):
            fecha()
            chave_aberta, bloco = None, []
    fecha()
    return campos


def achar_skills(projetos):
    """Skills pessoais (~/.claude/skills) + skills de cada projeto."""
    skills = []
    vistos = set()

    def coletar(base, origem):
        if not base.exists():
            return
        for skill_md in sorted(base.glob("*/SKILL.md")) + sorted(base.glob("*/*/SKILL.md")):
            chave = str(skill_md.resolve())
            if chave in vistos:          # a mesma skill alcançável por dois caminhos
                continue
            vistos.add(chave)
            fm = ler_frontmatter(skill_md)
            skills.append({
                "nome": fm.get("name") or skill_md.parent.name,
                "descricao": fm.get("description", ""),
                "origem": origem,
                "caminho": skill_md,
                "arquivos_extras": sum(1 for _ in skill_md.parent.rglob("*") if _.is_file()) - 1,
            })

    coletar(HOME / ".claude" / "skills", "pessoal (~/.claude/skills)")
    for proj in projetos:
        coletar(proj["caminho"] / ".claude" / "skills", f"projeto · {proj['nome']}")
    return skills


def achar_agentes(projetos):
    agentes = []

    def coletar(base, origem):
        if not base.exists():
            return
        for md in sorted(base.glob("*.md")):
            fm = ler_frontmatter(md)
            agentes.append({
                "nome": fm.get("name") or md.stem,
                "descricao": fm.get("description", ""),
                "origem": origem,
                "caminho": md,
            })

    coletar(HOME / ".claude" / "agents", "pessoal (~/.claude/agents)")
    for proj in projetos:
        coletar(proj["caminho"] / ".claude" / "agents", f"projeto · {proj['nome']}")
    return agentes


def achar_plugins():
    base = HOME / ".claude" / "plugins"
    if not base.exists():
        return []
    plugins = []
    for manifesto in sorted(base.rglob(".claude-plugin/plugin.json")):
        try:
            dados = json.loads(manifesto.read_text(encoding="utf-8", errors="replace"))
        except (OSError, ValueError):
            dados = {}
        plugins.append({
            "nome": dados.get("name", manifesto.parent.parent.name),
            "descricao": dados.get("description", ""),
            "caminho": manifesto.parent.parent,
        })
    return plugins


def achar_mcp(projetos):
    servidores = []

    arquivo_global = HOME / ".claude.json"
    if arquivo_global.exists():
        try:
            dados = json.loads(arquivo_global.read_text(encoding="utf-8", errors="replace"))
        except (OSError, ValueError):
            dados = {}
        for nome, cfg in (dados.get("mcpServers") or {}).items():
            servidores.append({"nome": nome, "escopo": "user (todos os projetos)",
                               "tipo": cfg.get("type", "stdio"), "onde": "~/.claude.json"})
        for caminho_proj, cfg_proj in (dados.get("projects") or {}).items():
            for nome, cfg in ((cfg_proj or {}).get("mcpServers") or {}).items():
                servidores.append({"nome": nome, "escopo": f"local · {Path(caminho_proj).name}",
                                   "tipo": cfg.get("type", "stdio"), "onde": "~/.claude.json"})

    for proj in projetos:
        arq = proj["caminho"] / ".mcp.json"
        if arq.exists():
            try:
                dados = json.loads(arq.read_text(encoding="utf-8", errors="replace"))
            except (OSError, ValueError):
                dados = {}
            for nome, cfg in (dados.get("mcpServers") or {}).items():
                servidores.append({"nome": nome, "escopo": f"project · {proj['nome']}",
                                   "tipo": cfg.get("type", "stdio"), "onde": texto(arq)})
    return servidores


# ------------------------------------------------------------------- saída


def gerar_workspace(projetos, destino):
    pastas = []
    for proj in projetos:
        pastas.append({
            "name": f"{grupo_de(proj['nome'])} · {proj['nome']}",
            "path": str(proj["caminho"]),
        })
    # A pasta de configuração do Claude entra por último, como "sala de máquinas".
    if (HOME / ".claude").exists():
        pastas.append({"name": "09 CONFIG · claude (skills, agents, plugins)",
                       "path": str(HOME / ".claude")})

    conteudo = {
        "folders": pastas,
        "settings": {
            "workbench.editor.enablePreview": False,
            "explorer.sortOrder": "type",
            "explorer.compactFolders": False,
            "files.trimTrailingWhitespace": True,
            "editor.wordWrap": "on",
            "editor.minimap.enabled": False,
            "search.exclude": {
                "**/node_modules": True,
                "**/.venv": True,
                "**/dist": True,
            },
            "files.exclude": {
                "**/.DS_Store": True,
                "**/__pycache__": True,
            },
        },
        "extensions": {"recommendations": EXTENSOES_RECOMENDADAS},
    }
    destino.write_text(json.dumps(conteudo, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return len(pastas)


def gerar_inventario(projetos, skills, agentes, plugins, mcp, destino):
    agora = datetime.now().strftime("%d/%m/%Y %H:%M")
    L = []
    L.append("# Inventário local — o que existe na sua máquina\n")
    L.append(f"Gerado em {agora} · {platform.system()} · `{texto(HOME)}`\n")
    L.append("| O quê | Quantos |")
    L.append("|---|---|")
    L.append(f"| Projetos (pastas) | {len(projetos)} |")
    L.append(f"| Skills | {len(skills)} |")
    L.append(f"| Subagentes | {len(agentes)} |")
    L.append(f"| Plugins | {len(plugins)} |")
    L.append(f"| Servidores MCP | {len(mcp)} |")

    L.append("\n## Projetos\n")
    if projetos:
        L.append("| Grupo | Projeto | git | .claude | CLAUDE.md | Caminho |")
        L.append("|---|---|:-:|:-:|:-:|---|")
        for p in projetos:
            L.append("| {} | {} | {} | {} | {} | `{}` |".format(
                grupo_de(p["nome"]), p["nome"],
                "sim" if p["git"] else "—",
                "sim" if p["claude"] else "—",
                "sim" if p["memoria"] else "—",
                texto(p["caminho"])))
    else:
        L.append("_Nenhum projeto encontrado nas raízes varridas. "
                 "Rode de novo passando a pasta certa: `python3 varredura.py ~/caminho/da/pasta`._")

    L.append("\n## Skills\n")
    if skills:
        L.append("| Skill | Origem | Arquivos extras | Descrição |")
        L.append("|---|---|:-:|---|")
        for s in skills:
            desc = (s["descricao"][:120] + "…") if len(s["descricao"]) > 120 else s["descricao"]
            L.append(f"| `/{s['nome']}` | {s['origem']} | {max(s['arquivos_extras'], 0)} | {desc} |")
    else:
        L.append("_Nenhuma skill local. Se as suas skills estão no claude.ai, veja o passo 6 do guia "
                 "(`CLAUDE_CODE_SYNC_SKILLS=1`)._")

    L.append("\n## Subagentes\n")
    if agentes:
        L.append("| Agente | Origem | Descrição |")
        L.append("|---|---|---|")
        for a in agentes:
            L.append(f"| {a['nome']} | {a['origem']} | {a['descricao'][:120]} |")
    else:
        L.append("_Nenhum subagente próprio. Você usa os que já vêm prontos (Explore, Plan, general-purpose)._")

    L.append("\n## Plugins\n")
    if plugins:
        L.append("| Plugin | Caminho | Descrição |")
        L.append("|---|---|---|")
        for pl in plugins:
            L.append(f"| {pl['nome']} | `{texto(pl['caminho'])}` | {pl['descricao'][:120]} |")
    else:
        L.append("_Nenhum plugin instalado localmente._")

    L.append("\n## Servidores MCP\n")
    if mcp:
        L.append("| Servidor | Escopo | Tipo | Onde está configurado |")
        L.append("|---|---|---|---|")
        for m in mcp:
            L.append(f"| {m['nome']} | {m['escopo']} | {m['tipo']} | `{m['onde']}` |")
    else:
        L.append("_Nenhum MCP local. Os conectores do claude.ai NÃO vêm junto — "
                 "veja o passo 7 do guia para reconectar os que você usa._")

    destino.write_text("\n".join(L) + "\n", encoding="utf-8")


# ---------------------------------------------------------------------- main


def main():
    extras = [Path(os.path.expanduser(a)).resolve() for a in sys.argv[1:]]
    raizes = extras if extras else RAIZES_PADRAO
    aqui = Path(__file__).resolve().parent

    print("Varrendo… isso leva de alguns segundos a um minuto.\n")
    for r in raizes:
        print(f"  · {texto(r)}{'' if r.exists() else '   (não existe, pulando)'}")

    projetos = achar_projetos(raizes)
    skills = achar_skills(projetos)
    agentes = achar_agentes(projetos)
    plugins = achar_plugins()
    mcp = achar_mcp(projetos)

    inventario = aqui / "INVENTARIO-LOCAL.md"
    workspace = aqui / "Marcela.code-workspace"
    gerar_inventario(projetos, skills, agentes, plugins, mcp, inventario)
    n_pastas = gerar_workspace(projetos, workspace)

    print(f"\nEncontrei: {len(projetos)} projetos · {len(skills)} skills · "
          f"{len(agentes)} agentes · {len(plugins)} plugins · {len(mcp)} MCPs\n")
    print(f"  Retrato completo -> {inventario}")
    print(f"  Workspace ({n_pastas} pastas) -> {workspace}\n")
    print("Agora é só dar dois cliques no arquivo .code-workspace, ou no VS Code:")
    print("  File > Open Workspace from File… e escolher o Marcela.code-workspace")


if __name__ == "__main__":
    main()
