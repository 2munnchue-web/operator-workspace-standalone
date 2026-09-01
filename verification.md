# Standalone verification findings

The first exposed render showed the standalone shell but an empty content region. The cause was a browser module loading mismatch: the app imported a localization module outside the static directory, and the server did not declare `.mjs` as JavaScript. The localization module was copied into `public/`, the import was corrected, and the server MIME map now includes `.mjs`.

After restarting one clean process on port 8787, the independent GUI rendered its command center, local JSON-backed workspace data, Red/Blue/White Cell event preview, tool deck, language selector, safe/advanced toggles, and local guide entry points. The health endpoint returned `{ ok: true, mode: "standalone", storage: "local-json" }`. The API smoke test succeeded for workspace loading, local guide responses, scenario creation, and learning progress.

The localized browser check succeeded: selecting Español translated navigation, safe-mode label, hero heading, and learning/creative section copy. The Learning view rendered four local modules with progress controls. The Creative Lab rendered the custom tool form with name, category, description, fields, and runbook inputs plus an empty-state panel for user-designed tools.

The Event Planner rendered the explicit White Cell readiness gate and blocked the Ready → Live control while approval was missing. It also exposed Red, Blue, and White Cell lanes and scenario details. The Guide view rendered as a local JSON API conversation surface with a persistent mode indicator and no external model dependency. One small interpolation defect in the event eyebrow was corrected before continuing.

The localized Guide view accepted a natural-language planning question and returned a useful local response describing the Red / Blue / White Cell model, authorization, safety calls, and scenario gating. The response displayed mode, safe-mode state, and no external model dependency.
