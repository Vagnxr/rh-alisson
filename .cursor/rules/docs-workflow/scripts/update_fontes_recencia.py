import datetime
import os
import subprocess

def git_repo_root() -> str:
    try:
        out = subprocess.check_output(
            ["git", "rev-parse", "--show-toplevel"],
            cwd=os.path.dirname(__file__),
            stderr=subprocess.DEVNULL,
        ).decode("utf-8", errors="replace").strip()
        return out
    except Exception:
        # Fallback: subir 4 níveis (docs/rules/docs-workflow/scripts -> repo root)
        return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))


ROOT = git_repo_root()
OUT_PATH = os.path.join(ROOT, "docs", "99-apendice", "fontes-e-recencia.md")

SKIP_PREFIXES = (
    "node_modules",
    "dist",
    # os.path.join("docs", "legacy"),
)


def authority(rel: str) -> tuple[str, str]:
    rel = rel.replace("\\", "/")
    legacy = None
    authority = (legacy or "Outro", "repo")

    if rel.startswith("docs/legacy/"):
        legacy = "Legado"
    if rel.startswith("steering/"):
        authority = (legacy or "Normativo", "steering")
    if rel.startswith("tasks/"):
        authority = (legacy or "Requisito", "tasks")
    if rel.startswith(".cursor/rules/"):
        authority = (legacy or "Normativo", ".cursor/rules")
    if rel.startswith("docs/"):
        authority = (legacy or "Docs", "docs")
    if rel.startswith("docs/screens/"):
        authority = (legacy or "Requisito_UX", "docs/screens")
    if rel.startswith("docs/generated_docs/"):
        authority = (legacy or "Derivado", "docs/generated_docs")
    if rel.startswith("docs/prompts/"):
        authority = (legacy or "Insumo", "docs/prompts/*")
    if rel.__contains__("PROMPT-"):
        authority = (legacy or "Insumo", "PROMPT-*")
    return authority


def git_last_commit_iso(rel_path: str) -> str:
    try:
        out = subprocess.check_output(
            ["git", "log", "-1", "--format=%cI", "--", rel_path],
            cwd=ROOT,
            stderr=subprocess.DEVNULL,
        ).decode("utf-8", errors="replace").strip()
        return out
    except Exception:
        return ""


def iter_md_files() -> list[str]:
    md_files: list[str] = []
    for dirpath, _dirnames, filenames in os.walk(ROOT):
        rel_dir = os.path.relpath(dirpath, ROOT).replace("\\", "/")
        if any(rel_dir.startswith(p.replace("\\", "/")) for p in SKIP_PREFIXES):
            continue

        for fn in filenames:
            if fn.lower().endswith(".md"):
                abs_path = os.path.join(dirpath, fn)
                # Evita auto-inclusão do arquivo gerado
                if os.path.abspath(abs_path) == os.path.abspath(OUT_PATH):
                    continue
                md_files.append(abs_path)

    return md_files


def main() -> None:
    rows: list[tuple[str, str, str, str, str]] = []

    for abs_path in iter_md_files():
        rel = os.path.relpath(abs_path, ROOT).replace("\\", "/")
        st = os.stat(abs_path)
        mtime = datetime.datetime.fromtimestamp(st.st_mtime).isoformat(timespec="seconds")
        git_date = git_last_commit_iso(rel)
        level, ctx = authority(rel)
        rows.append((git_date or "", mtime, level, ctx, rel))

    rows.sort(key=lambda r: (r[0], r[1]), reverse=True)

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)

    out: list[str] = []
    out.append("# Fontes e recencia (Git + mtime)\n")
    out.append(
        "Este arquivo registra as fontes .md usadas como insumo para a documentação oficial e como o critério de recência foi aplicado.\n"
    )
    out.append("## Regras de precedencia\n")
    out.append(
        "- Autoridade por contexto (primario): steering/* e .cursor/rules/* (normativo) > docs/* (documentação oficial). Conteúdo legado fica em docs/legacy/*.\n"
    )
    out.append(
        "- Recencia (secundario): usar data do ultimo commit (Git) como principal e mtime local como nota; dentro do mesmo nivel de autoridade, o mais recente tem preferencia.\n"
    )
    out.append("## Tabela (ordenada por Git desc, depois mtime)\n")
    out.append("| Ultimo_commit_git | mtime_local | Autoridade | Contexto | Arquivo |")
    out.append("|---|---|---|---|---|")

    for git_date, mtime, level, ctx, rel in rows:
        out.append(f"| {git_date or '-'} | {mtime} | {level} | {ctx} | {rel} |")

    with open(OUT_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(out) + "\n")

    print(f"WROTE {OUT_PATH} ROWS {len(rows)}")


if __name__ == "__main__":
    main()
