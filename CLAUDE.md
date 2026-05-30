<!-- GENERATED:BEGIN -->
# Claude-Konfiguration

Dieses Repository nutzt eine reproduzierbare forgecrate-Konfiguration. Die hier
beschriebenen Regeln gelten für alle Agenten (Claude Code, Codex, …) die im Repo
arbeiten. Die generierten Abschnitte werden bei `forgecrate update` überschrieben —
eigene Anpassungen gehören in den CUSTOM-Abschnitt der Root-`CLAUDE.md`.

## Pflicht-Skills

| Situation | Skill | Verhalten |
|---|---|---|
| Neues Feature / Bug-Fix | `superpowers:brainstorming` | MUSS vor Code aufgerufen werden |
| Implementierung | `superpowers:test-driven-development` | MUSS vor Code aufgerufen werden |
| Vor Commit/PR | `superpowers:verification-before-completion` | MUSS ausgeführt werden |
| Debug | `superpowers:systematic-debugging` | MUSS vor Fix aufgerufen werden |
| Bug gefunden (nach Debug) | `superpowers:test-driven-development` | Regressionstest schreiben, BEVOR der Fix committed wird |

## Recherche-Pflicht (erzwungen)

**Alle** Rollen MÜSSEN vor jeder nicht-trivialen Code-Änderung (Edit/Write/MultiEdit)
mindestens ein Recherche-Tool nutzen — statt aus gelerntem Wissen zu arbeiten. Raten
ist verboten; Quellen werden referenziert. Dies wird durch den `pre-tool.sh`-Hook
(`forgecrate hook require-research`) **hart erzwungen**: Edit/Write/MultiEdit werden
**blockiert**, bis im aktuellen Turn eine Recherche (WebSearch/WebFetch/context7/fetch)
im Transcript nachweisbar ist.

| Frage-Typ | Tool | Beispiele |
|---|---|---|
| Library-/Framework-Doku | `context7` | API-Syntax, Migrationen, Versions-Updates |
| Spezifische URL aus Issue/Ticket | `fetch` MCP | RFCs, MDN, Changelogs |
| Allgemeine Web-Recherche | `WebSearch` | Best Practices, Vergleiche, aktuelle Probleme |

**Regeln:**

- Mindestens eine Quelle pro nicht-trivialer Entscheidung; eine Recherche pro Turn
  schaltet Folge-Edits desselben Turns frei
- Quellen im Plan-Dokument (`docs/superpowers/plans/*.md`) referenzieren
- Deaktivierbar via Flavor `no-research` — deaktiviert auch den harten Block
- Verschärfbar via Flavor `force-research` — blockt zusätzlich schreibende
  Bash-Befehle (siehe Abschnitt „## Hook-Schutz")

## Entwicklungs-Workflow

Für alle Features, Bugfixes und Änderungen:

1. **Brainstorming** — `superpowers:brainstorming` aufrufen, Design abstimmen
2. **Spec** — Branch anlegen (`git checkout -b feat/<thema>`); Spec in
   `docs/superpowers/specs/YYYY-MM-DD-<thema>-design.md` schreiben und committen;
   GitHub-Issue anlegen oder verlinken; Branch-Name im Issue vermerken; Kommentar
   im Issue: "Spec fertig"
3. **Plan** — in `docs/superpowers/plans/YYYY-MM-DD-<thema>.md` schreiben und
   committen; Plan-Pfad im Issue ergänzen; Kommentar: "Plan fertig"
4. **Implementierung** — nach jedem Task kurzer Kommentar im Issue
5. **PR & Abschluss** — Vor dem PR: memory-bank aktualisieren
   (`activeContext.md`, `progress.md`) und Inhalt in die PR-Beschreibung
   einbeziehen. Existiert noch kein memory-bank-Inhalt, zuerst
   `/forgecrate-repo-onboarding` ausführen. Dann PR erstellen, Issue im
   PR-Body verlinken ("Closes #N"); Issue wird erst nach Merge des PR
   geschlossen (GitHub macht das automatisch)

Ticket-Kommentare immer kurz (ein Satz): Fortschritt, Pfad oder Ergebnis.

## Session-Start

Beim Session-Start: aktuellen Projektkontext aus der memory-bank lesen.
**Pflicht:** `mcp__memory-bank__memory_bank_read` verwenden — direktes Lesen via
Read-Tool auf `memory-bank/`-Dateien ist verboten.

## Verhalten

- Antworte auf Deutsch
- Keine unnötigen Kommentare im Code
- YAGNI: keine ungefragten Features
- Änderungen immer über Branch + PR, nie direkt auf `main`

## Hook-Schutz: Hinweis

Der `pre-tool.sh`-Hook blockt destruktive Bash-Befehle auf `main` (z. B.
`git commit`, `git push`, `git reset --hard`, Schreib-Redirectionen). Er ist
jedoch **keine alleinige Schutzschicht** — GitHub Branch Protection Rules müssen
zusätzlich konfiguriert werden, damit direkte Pushes auch serverseitig verhindert
werden.

Derselbe Hook erzwingt die **Recherche-Pflicht** (`forgecrate hook
require-research`): Edit/Write/MultiEdit werden blockiert, bis im aktuellen Turn ein
Recherche-Tool (WebSearch/WebFetch/`mcp__fetch__*`/`mcp__context7__*`) genutzt wurde.
Mit Flavor `force-research` gilt der Block zusätzlich für schreibende Bash-Befehle
(`sed -i`, `tee`, `dd of=`, Redirects außerhalb `/tmp`). Flavor `no-research`
deaktiviert den Block vollständig. Bei fehlender Binary, fehlendem oder kaputtem
Transcript verhält sich der Hook **fail-open** (kein Block).

## Team-Rollen & Subagent-Konfiguration

Der Hauptagent koordiniert als Team-Lead. Subagenten übernehmen Rollen
entsprechend ihrer Aufgabe. Der Hauptagent kann bei Bedarf eigenständig von
diesen Empfehlungen abweichen.

Das Hauptmodell der Session ist global (in `.claude/settings.json`). Die
`Modell`-Spalte nennt den empfohlenen Wert für den `model`-Parameter beim
Dispatch eines Subagenten über das Agent-Tool — gültig sind nur die Family-Aliase
`opus`/`sonnet`/`haiku`.

| Rolle | Superpowers-Skill | Modell | Recherche |
|---|---|---|---|
| Analyst / Product Owner | `superpowers:brainstorming` | `opus` | Pflicht |
| Tech Lead / Architekt | `superpowers:writing-plans` | `opus` | Pflicht |
| Entwickler | `superpowers:test-driven-development` | `sonnet` | Pflicht |
| Implementierer (mechanisch) | `superpowers:subagent-driven-development` | `haiku` | Pflicht |
| Reviewer | `superpowers:requesting-code-review` | `sonnet` | Pflicht |
| QA / Abschluss | `superpowers:verification-before-completion` | `sonnet` | Pflicht |
| Debugger | `superpowers:systematic-debugging` | `sonnet` | Pflicht |

## Parallelisierung & Isolation

Subagenten werden proaktiv parallelisiert und isoliert — ohne explizite
Aufforderung.

| Situation | Mechanismus | Anleitung |
|---|---|---|
| Task dauert >1 min oder Ergebnis nicht sofort nötig | `run_in_background: true` | `superpowers:dispatching-parallel-agents` |
| Feature-Branch, Multi-File-Änderung, langer Plan | `isolation: "worktree"` | `superpowers:using-git-worktrees` |
| Mehrere unabhängige Tasks gleichzeitig | beide kombinieren | beide Skills |

Im Zweifelsfall Background nutzen — warten ist kein Default.

### Agenten-Identität

Jeder Subagent bekommt eindeutige Identifikation:

- **Eindeutigen Namen** — via `description`-Parameter im Agent-Tool-Aufruf
  (3–5 Wörter, Rolle + Aufgabe)
- **Eindeutige Farbe** — dynamisch durch FleetView-Dashboard zugewiesen; keine
  zwei gleichzeitig laufenden Agenten teilen eine Farbe

Dies ermöglicht einfaches Tracking und verhindert Verwechslungen bei parallelen
Läufen.

## MCP-Server

Sechs MCP-Server stehen automatisch zur Verfügung. `.mcp.json` wird von forgecrate
generiert — nicht von Hand editieren; MCP-Server-Änderungen über einen erneuten
forgecrate-Lauf.

| Server | Transport | Zweck |
|---|---|---|
| `github` | HTTP (GitHub Copilot) | Issues, PRs, Code-Suche, Branches, Labels |
| `fetch` | stdio (`npx`) | Externe Webinhalte: Docs, RFCs, Changelogs |
| `memory` | stdio (`npx`) | Projektübergreifende Architektur-Entscheidungen |
| `memory-bank` | stdio (`npx`) | Repo-spezifischer Projektkontext (laufender Stand) |
| `context-mode` | stdio (`npx`) | Automatisches Context-Budget und Session-History-Suche |
| `context7` | stdio (`npx`) | Aktuelle Bibliotheks-Dokumentation aus Source-Repos |

Routing-Grenzen (verhindern Falsch-Aufrufe):

- **`github`** — alle GitHub-Operationen (Issues, PRs, Code-Suche, Labels). NICHT für
  lokale Datei-/Git-Kommandos (→ Read/Edit/Bash). Voraussetzung:
  `GITHUB_PERSONAL_ACCESS_TOKEN`.
- **`fetch`** — externe Webinhalte (Docs, MDN, RFCs, Changelogs). NICHT für
  GitHub-Inhalte (→ `github`) oder lokale Dateien (→ Read).
- **`context-mode`** — sandboxt Tool-Output automatisch (kein Aufruf nötig). Explizit:
  `ctx_search` (History-Suche nach Kompaktierung), `ctx_stats`, `ctx_doctor`.
- **`context7`** — aktuelle Bibliotheks-Doku aus Source-Repos. NICHT für GitHub-Inhalte
  (→ `github`), lokale Dateien (→ Read) oder allgemeine Programmierkonzepte.

`memory` und `memory-bank` haben eigene Pflicht-Regeln — siehe unten.

### Memory (`memory`)

Projektübergreifendes Wissen persistent speichern. Datei: `.claude/memory.json`
(versioniert).

**Schreiben nach:** Architekturentscheidungen, Begründungen für nicht-
offensichtliche Lösungen, Debugging-Ergebnisse, Brainstorming-Ergebnisse.

**Lesen am:** Sessionbeginn, nach Context-Kompaktierung, wenn unklar warum etwas
so gebaut wurde.

**Niemals speichern:** API-Keys, Tokens, Passwörter, temporären Zwischenstand,
Code-Details die direkt aus dem Code lesbar sind.

### Memory-Bank (`memory-bank`)

Repo-spezifischer, strukturierter Projektkontext im Verzeichnis `memory-bank/`
(versioniert, committed). Persistiert kontextuelles Wissen über Sessions hinweg.

**Dateien:**

- `projectbrief.md` — Projektziel und Scope
- `techContext.md` — Stack, Tools, technische Constraints
- `systemPatterns.md` — Architektur-Entscheidungen, ADRs, Anti-Patterns
- `activeContext.md` — Aktueller Fokus, offene Fragen, Blocker
- `progress.md` — Was fertig ist, was läuft, was als nächstes kommt

**Lesen** am Session-Start und bei Bedarf — **ausschließlich** via
`mcp__memory-bank__memory_bank_read`.

**Schreiben** wenn sich Fokus, Fortschritt oder Architektur-Kontext ändert —
**ausschließlich** via `mcp__memory-bank__memory_bank_write` oder
`mcp__memory-bank__memory_bank_update`.

> **Direkte Datei-Tools (Read/Write/Edit) auf `memory-bank/`-Dateien sind
> verboten.**

**Abgrenzung zu `memory`:** `memory-bank` ist repo-spezifisch und dateibasiert —
ideal für laufenden Projekt-Kontext. `memory` (`.claude/memory.json`) ist
graph-basiert und projektübergreifend — ideal für zeitlose
Architektur-Entscheidungen mit Begründung.

## Backend-Profil

- API-Design: REST-First, klare Fehlercodes, keine unnötige Abstraktion
- Datenbankzugriffe: typsicher, keine Raw-Queries ohne Parametrisierung
- Tests: Integrationstests bevorzugt gegenüber reinen Unit-Tests mit Mocks
- Kein ORM-Magic: explizite Queries sind verständlicher

## Frontend-Profil

- Komponenten: klein, fokussiert, eine Verantwortlichkeit
- State: lokal wenn möglich, global nur wenn nötig
- Kein CSS-in-JS ohne explizite Anforderung
- Barrierefreiheit: semantisches HTML, ARIA-Attribute wo nötig
- Tests: Behavior-Tests (was der Nutzer sieht), keine Implementierungsdetails

## UI-Reviews

- **`accessibility-audit`** — schnelle statische A11y-Checks pro geänderter Datei (alt, label, aria-*). Eignet sich für Pre-Commit / PR-Reviews.
- **`ui-ux-audit`** — tiefgehender Audit der gesamten UI, gruppiert nach Bereichen, mit Severity-Bewertung und automatischer Erstellung kleinteiliger GitHub-Issues. Für Major-Releases oder größere UI-Refactorings.

## Playwright MCP

Browser-Automatisierung direkt aus Claude heraus. Automatisch konfiguriert via `profiles/frontend/extensions.yaml`.

**Verwende es für:** UI-Tests, Screenshots, Formular-Interaktionen, visuelle Regressionstests, Debugging von Rendering-Problemen.

**Verwende es NICHT für:** API-Tests ohne UI-Beteiligung (→ direkte HTTP-Calls), GitHub-Operationen (→ github MCP).

## Design-Plugins

Fünf spezialisierte Plugins für UI/UX-Arbeit — optimal in diesen Situationen:

| Plugin | Optimal wenn… |
|---|---|
| `ui-ux-pro-max-skill` | Neue Komponente/Seite designen — generiert automatisch Design-System (Farben, Typografie, Spacing) passend zum Produkt; unterstützt React, Next.js, Vue, Tailwind, Flutter u.v.m. |
| `interface-design` | UI über mehrere Sessions konsistent halten — speichert Design-Entscheidungen (Spacing, Elevation, Farben) in `.interface-design/system.md` und wendet sie session-übergreifend an |
| `refactoring-ui-skill` | Bestehende UI überarbeiten — `/ui-refactor` verbessert Hierarchie, Spacing (8px-Raster), HSL-Farben und Schatten nach Refactoring-UI-Prinzipien |
| `agent-skills` | Vercel-Deployments oder React Composition Patterns — auto-detects 40+ Frameworks, hilft bei Compound Components, State-Lifting und Edge-Funktionen |
| `wondelai-skills` | UX-Strategie und Produktentscheidungen — 25 Skills nach Norman, Cialdini, Ries; deckt UX Design, Conversion-Optimierung und Produktstrategie ab |

## Fullstack-Profil

Kombiniert Backend- und Frontend-Anforderungen.

- API-Kontrakte explizit definieren bevor Implementierung auf beiden Seiten
- Shared Types: einmal definieren, in beiden Schichten nutzen
- End-to-End-Tests für kritische User-Flows (Playwright MCP siehe Frontend-Profil)

## Codegraph-Flavor

Dieses Repo nutzt **codegraph** — einen semantischen Code-Wissensgraphen als MCP-Server.

### Was codegraph bietet

Der MCP-Server läuft lokal (`codegraph serve --mcp`) und stellt folgende Tools bereit:

| Tool | Zweck |
|---|---|
| `codegraph_search` | Semantische Code-Suche ohne exakte Schlüsselwörter |
| `codegraph_node` | Definition eines Symbols (Funktion, Typ, Variable) abrufen |
| `codegraph_callers` / `codegraph_callees` | Alle Aufrufer / Aufgerufenen eines Symbols |
| `codegraph_trace` | Aufrufpfad zwischen zwei Symbolen nachverfolgen |
| `codegraph_explore` | Abhängigkeiten und Nachbarn eines Symbols erkunden |
| `codegraph_context` | Code-Abschnitt mit Graph-Kontext erklären |
| `codegraph_impact` | Blast-Radius einer Änderung ermitteln |
| `codegraph_files` | Dateien im Index auflisten |
| `codegraph_status` | Index-Status prüfen |

### Pflicht-Regeln

- **Vor jeder nicht-trivialen Änderung MUSS** `codegraph_node` + `codegraph_callers` für betroffene Symbole aufgerufen werden — kein Edit/Write ohne vorherige Codegraph-Abfrage
- **Beim Debuggen MUSS** `codegraph_trace` die Aufrufkette aufzeigen, bevor ein Fix versucht wird
- **Bei Refactoring MUSS** `codegraph_callers` für Call-Sites + `codegraph_search` für Type-/Import-Referenzen geprüft werden
- **Code-Suche**: `codegraph_search` statt grep — grep ist nur erlaubt, wenn codegraph das Ergebnis nicht liefert
- **Impact-Analyse MUSS** `codegraph_impact` vor größeren Umbauten ausgeführt werden

### Index-Aktualisierung

Der Index wird automatisch bei Session-Start im Hintergrund aktualisiert (einmal pro Commit-Stand).
Manuell: `codegraph index` im Repo-Root. Erstmalige Initialisierung: `codegraph init -i`.

### Voraussetzung

Installation (einmalig, kein Node.js erforderlich):

```bash
# macOS / Linux
curl -fsSL https://raw.githubusercontent.com/colbymchenry/codegraph/main/install.sh | sh

# Windows (PowerShell)
irm https://raw.githubusercontent.com/colbymchenry/codegraph/main/install.ps1 | iex

# Alternativ via npm
npm i -g @colbymchenry/codegraph
```

Danach im Repo initialisieren:

```bash
codegraph init -i
```

Der MCP-Server wird über `.mcp.json` automatisch konfiguriert.

## Force-Research-Flavor (verschärfte Recherche-Pflicht)

Dieser Flavor verschärft die ohnehin erzwungene Recherche-Pflicht des base layer:

- Der harte PreToolUse-Block (kein Edit/Write/MultiEdit ohne vorherige Recherche im
  aktuellen Turn) gilt **zusätzlich für schreibende Bash-Befehle** — auch
  Datei-Schreibzugriffe via Shell (`sed -i`, `tee`, `dd of=`, Redirects außerhalb
  `/tmp`) werden ohne vorherige Recherche blockiert. Damit ist die Umgehung „Datei per
  Shell schreiben statt Edit/Write" geschlossen.
- Kein impliziter Ausnahmefall. Bewusster Verzicht ausschließlich über den Flavor
  `no-research`.

Die Durchsetzung liegt vollständig im base-Hook (`pre-tool.sh` →
`forgecrate hook require-research`); dieser Flavor aktiviert lediglich die
zusätzliche Bash-Prüfung über die aktive Konfiguration.

## GETBETTER-Flavor

Kontinuierliche Verbesserung durch Festhalten von Erkenntnissen aus jeder Session.

- Falls `.claude/GETBETTER.md` existiert, MUSS sie vor allem anderen gelesen werden.
- Am Sessionende: `/forgecrate-getbetter` aufrufen um Erkenntnisse zu speichern.

**Was in `.claude/GETBETTER.md` gehört:**
- Wiederkehrende Fehler und deren Ursachen
- Patterns die gut funktioniert haben
- Entscheidungen die sich im Nachhinein als falsch erwiesen haben
- Projektspezifische Gotchas die nicht aus dem Code ersichtlich sind

**Format:** Freier Text oder Bullet-Liste — kein festes Schema. Die Datei wächst über Zeit.

## GitHub-Flavor

- Releases über `gh release create` veröffentlichen (nach `release`-Skill)
- PR-Templates in `.github/pull_request_template.md` pflegen
- CI-Status mit `gh run list` prüfen bevor ein Release getaggt wird

## Multiagent & Subagenten

Parallelisierung/Isolation gemäß Base-Layer-Tabelle gelten auch hier — gerade bei
Issue-Batches proaktiv Background-Mode und Worktrees nutzen.

## GitOps-Flavor

### Repo-Kontext beim Start laden

Beim Start in einem GitOps-Repo MUSS Claude zuerst den Kontext laden:

1. **ArgoCD Applications lesen** — suche nach `kind: Application` und `kind: AppProject` in allen YAML-Dateien:
   ```bash
   grep -rl "kind: Application\|kind: AppProject" . --include="*.yaml" --include="*.yml"
   ```
   Daraus ableiten: welche Apps existieren, welche Cluster/Namespaces sie targeten, welche Repos sie referenzieren.

2. **Clusterweite Regeln lesen** — zwei Quellen prüfen, beide gelten gleichwertig als harte Constraints:

   *Maschinenlesbar (YAML):*
   ```bash
   grep -rl "kind: ClusterPolicy\|kind: Policy\|kind: ConstraintTemplate\|kind: Constraint" . --include="*.yaml" --include="*.yml"
   ```

   *Menschenlesbar (Markdown):*
   ```bash
   find . -name "RULES.md" 2>/dev/null
   ```
   Falls `RULES.md` gefunden: vollständig lesen. Die dort dokumentierten Regeln gelten genauso wie YAML-Policies — kein Manifest darf gegen sie verstoßen. Claude hält beide Quellen im Kontext.

3. **Separates GitOps-Repo** — wenn das aktuelle Repo kein GitOps-Repo ist (keine `Application`-Manifeste gefunden):

   Zuerst prüfen ob bereits konfiguriert:
   ```bash
   grep "GITOPS_REPO" .env 2>/dev/null
   ```

   Falls `GITOPS_REPO` in `.env` gesetzt: diesen Wert verwenden, nicht erneut fragen.

   Falls nicht gesetzt: einmalig fragen "Gibt es ein separates GitOps-Repo? Bitte Pfad oder URL angeben." — dann den Wert in `.env` schreiben:
   ```
   GITOPS_REPO=<antwort>
   ```
   `.env` in `.gitignore` prüfen — falls nicht eingetragen, Hinweis ausgeben dass lokale Pfade nicht committed werden sollten.

   Bearbeite keine Deployment-Manifeste ohne diesen Kontext.

### Verhaltensregeln

- **Jedes Deployment läuft über ArgoCD.** Direkte schreibende Cluster-Kommandos (`kubectl apply`, `kubectl delete`, `kubectl patch`, `helm upgrade`, `helm install`, `helm uninstall`) sind grundsätzlich verboten — auch wenn sie technisch funktionieren würden. Der einzige valide Deployment-Weg ist ein Commit + Merge in das GitOps-Repo, ArgoCD synchronisiert danach automatisch.

- **Ausnahmen nur mit expliziter Bestätigung.** Falls ein schreibendes Kommando ausnahmsweise notwendig ist (z.B. Notfall-Rollback, Bootstrap-Situation), MUSS Claude vor der Ausführung stoppen und fragen:
  > "Das ist ein direktes Cluster-Kommando außerhalb von ArgoCD: `<kommando>`. Soll ich es ausführen?"
  Ohne explizites Okay des Nutzers wird das Kommando nicht ausgeführt. Lesende Kommandos (`kubectl get`, `kubectl describe`, `kubectl logs`, `helm list`, `argocd app get`) sind ohne Bestätigung erlaubt.

- Secrets niemals im Repository speichern (SOPS, External Secrets Operator, Vault)
- Vor jedem Dry-Run oder Plan: `kubectl diff`, `helm diff upgrade` — niemals direkt apply ohne vorherige Prüfung
- Keine `latest`-Image-Tags — immer versionierte Tags oder Digests
- Manifeste die gegen clusterweite Regeln (Kyverno ClusterPolicy, OPA Gatekeeper) oder `RULES.md` verstoßen werden nicht vorgeschlagen — auch nicht mit dem Hinweis "das Policy-Check ignorieren"
- Drift zwischen Git-Zustand und laufendem Cluster regelmäßig prüfen: `/forgecrate-gitops-status`

## Strict-Review-Flavor

- Vor jedem Commit: `superpowers:requesting-code-review` aufrufen
- Keine direkten Commits auf main/master
- PR-Beschreibung enthält: Was, Warum, Wie getestet
- Breaking Changes werden explizit kommuniziert

## TDD-Flavor

- Test schreiben → ausführen (muss fehlschlagen) → implementieren → ausführen (muss bestehen) → committen
- Kein Produktionscode ohne vorherigen Test
- Test-Namen beschreiben Verhalten, nicht Implementierung
- Mocks nur an Systemgrenzen (externe APIs, Datenbanken)
- Für jeden gefundenen Bug: Regressionstest vor dem Fix
<!-- GENERATED:END -->

<!-- CUSTOM:BEGIN -->
<!-- CUSTOM:END -->
