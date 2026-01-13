import os
import re
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
        # Fallback: subir 5 níveis (.cursor/rules/docs-workflow/scripts -> repo root)
        return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", ".."))


ROOT = git_repo_root()
STEERING_DIR = os.path.join(ROOT, "steering")

LINK_RE = re.compile(r"\[[^\]]*\]\(([^)]+)\)")


def iter_md_files(base_dir: str) -> list[str]:
    out: list[str] = []
    for dirpath, _dirnames, filenames in os.walk(base_dir):
        for fn in filenames:
            if fn.lower().endswith(".md"):
                out.append(os.path.join(dirpath, fn))
    return out


def is_external_link(target: str) -> bool:
    t = target.strip()
    return t.startswith("http://") or t.startswith("https://") or t.startswith("mailto:")


def normalize_target(raw: str) -> str:
    t = raw.strip()
    # Remove optional title after whitespace: (path "title")
    if " " in t:
        t = t.split(" ", 1)[0].strip()
    # Drop hash fragment
    if "#" in t:
        t = t.split("#", 1)[0]
    return t


def resolve_to_repo_root(path_like: str) -> str:
    t = path_like.replace("\\", "/")

    # Treat absolute-from-repo references as rooted in repo
    if t.startswith("/"):
        t = t.lstrip("/")

    return os.path.abspath(os.path.join(ROOT, t))


def main() -> int:
    if not os.path.isdir(STEERING_DIR):
        print(f"ERRO: diretório steering não encontrado: {STEERING_DIR}")
        return 2

    md_files = iter_md_files(STEERING_DIR)
    broken: list[tuple[str, str]] = []
    legacy_refs: list[tuple[str, str]] = []

    for abs_path in md_files:
        rel = os.path.relpath(abs_path, ROOT).replace("\\", "/")
        with open(abs_path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()

        for raw in LINK_RE.findall(content):
            if is_external_link(raw):
                continue

            target = normalize_target(raw)
            if not target:
                continue

            # We only enforce local doc references for now.
            target_norm = target.replace("\\", "/")
            if target_norm.startswith("docs/") or target_norm.startswith("./docs/") or target_norm.startswith("../docs/"):
                resolved = resolve_to_repo_root(target_norm)
                if target_norm.startswith("docs/legacy/"):
                    legacy_refs.append((rel, target_norm))
                if not os.path.exists(resolved):
                    broken.append((rel, target_norm))

    if legacy_refs:
        print("AVISO: steering referencia docs/legacy (permitido, mas evite em conteúdo normativo):")
        for rel, target in legacy_refs:
            print(f"- {rel} -> {target}")

    if broken:
        print("ERRO: links quebrados no steering:")
        for rel, target in broken:
            print(f"- {rel} -> {target}")
        return 1

    print(f"OK: steering validado ({len(md_files)} arquivos).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
