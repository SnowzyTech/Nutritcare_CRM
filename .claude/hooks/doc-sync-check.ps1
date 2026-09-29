# doc-sync-check.ps1
# Stop-hook: soft, once-per-turn reminder to keep documentation in sync with code.
# If code files changed in the working tree but no .md files did, nudge Claude once
# to review/update CLAUDE.md + docs/*.md. Never blocks more than once per turn
# (guarded by stop_hook_active), and never nags on doc-only or no-code turns.

$ErrorActionPreference = 'SilentlyContinue'

# --- Read the Stop-hook JSON from stdin -------------------------------------
$raw = [Console]::In.ReadToEnd()
try { $data = $raw | ConvertFrom-Json } catch { exit 0 }

# Loop guard: we already nudged once this turn -> let Claude stop.
if ($data.stop_hook_active -eq $true) { exit 0 }

# --- Inspect the working tree ------------------------------------------------
$status = git status --porcelain 2>$null
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($status)) { exit 0 }

$codeChanged = $false
$docChanged  = $false

foreach ($line in ($status -split "`n")) {
    $line = $line.TrimEnd("`r")
    if ([string]::IsNullOrWhiteSpace($line)) { continue }

    # Porcelain format: 2 status chars + space + path. Handle rename "old -> new".
    $path = $line.Substring(3).Trim()
    if ($path -match ' -> ') { $path = ($path -split ' -> ')[-1].Trim() }
    $path = $path.Trim('"')

    if ($path -match '\.md$') { $docChanged = $true; continue }

    if ($path -match '^(app|modules|lib|prisma|components)/' -and
        $path -match '\.(ts|tsx|js|jsx|prisma|json)$') {
        $codeChanged = $true
    }
}

# --- Nudge once if code changed but docs did not -----------------------------
if ($codeChanged -and -not $docChanged) {
    $reason = 'Code changed this turn but no documentation (.md) was updated. ' +
              'Before finishing, run the sync-docs routine: review CLAUDE.md and docs/*.md ' +
              'for any claim the code change made outdated, apply the fixes, and give a short ' +
              'summary of what changed. If nothing needs updating, state briefly why.'
    $out = @{ decision = 'block'; reason = $reason } | ConvertTo-Json -Compress
    Write-Output $out
}

exit 0
