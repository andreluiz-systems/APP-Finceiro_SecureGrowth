# Guia de Git Flow, proteção de branches e release

Repositório: **APP-Finceiro_SecureGrowth** (público).

## 1. Criar o repositório no GitHub

1. GitHub → **New repository**.
2. Nome: `APP-Finceiro_SecureGrowth`, visibilidade **Public**.
3. **Não** marque "Add README", ".gitignore" nem "license" (o projeto já tem os três).

## 2. Primeiro envio (branch `main`)

Na pasta do projeto (a que tem `package.json`):

```bash
git init -b main
git add .
git status                      # confira que .env e node_modules NÃO aparecem
git commit -m "chore: estrutura inicial do projeto Secure Growth"
git remote add origin https://github.com/andreluiz-systems/APP-Finceiro_SecureGrowth.git
git push -u origin main
```

> Faça o envio inicial **antes** de ativar a proteção da `main`, senão o próprio push será bloqueado.

## 3. Criar a `develop`

```bash
git checkout -b develop
git push -u origin develop
```

## 4. Branch de trabalho e Pull Request

```bash
git checkout develop
git checkout -b docs/readme-profissional
# ... alterações ...
git add .
git commit -m "docs: README profissional e guia de Git Flow"
git push -u origin docs/readme-profissional
```

No GitHub, abra um **Pull Request** de `docs/readme-profissional` para `develop`, preencha o template e faça o
**Merge**. Depois, um segundo PR de `develop` para `main`.

Nomes sugeridos: `feature/setup-arquitetura`, `docs/diagrama-classes`, `fix/...`.

## 5. Proteção das branches

**Settings → Branches → Add branch ruleset** (ou *Add classic branch protection rule*), uma vez para `main` e outra
para `develop`:

- ✅ **Require a pull request before merging**
- **Required approvals: `0`** (não há outro membro para aprovar)
- ✅ **Do not allow bypassing the above settings**
- (opcional) ✅ **Require status checks to pass** e escolher `verificar` (o CI do projeto)

## 6. Tag e Release

Depois que os PRs estiverem integrados na `main`:

```bash
git checkout main
git pull
git tag -a v0.1.0-alpha -m "Baseline inicial: estrutura e configuração"
git push origin v0.1.0-alpha
```

No GitHub: **Releases → Draft a new release**

- **Tag:** `v0.1.0-alpha`
- **Título:** `Baseline Inicial: Estrutura e Configuração`
- **Descrição (sugestão):**

```markdown
## Baseline inicial

- Estrutura de pastas padrão (`docs/`, `src/`, `assets/`, `tests/`, `.github/`)
- README com descrição, tecnologias e instruções de execução
- `.gitignore` para React Native / Expo (sem chaves versionadas)
- Fluxo de branches `main` / `develop` / `feature/*` com proteção e Pull Requests
- App funcional: login (e-mail e Google), transações, lembretes, metas, relatórios (PDF e Excel) e tema escuro
- CI com typecheck e testes
```

Marque **Set as a pre-release**, por ser uma versão alpha.
