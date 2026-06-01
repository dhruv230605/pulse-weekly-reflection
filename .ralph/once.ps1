$repoRoot = Split-Path $PSScriptRoot -Parent

$issuesPath = Join-Path $repoRoot "issues" "*.md"
if (Test-Path $issuesPath) {
    $issues = Get-Content $issuesPath -Raw
} else {
    $issues = "No issues found"
}

$commits = git -C $repoRoot log -n 5 --format="%H%n%ad%n%B---" --date=short 2>$null
if (-not $commits) { $commits = "No commits found" }

$prompt = Get-Content "$PSScriptRoot\prompt.md" -Raw

Set-Location $repoRoot
copilot --prompt "Previous commits: $commits Issues: $issues $prompt" --allow-all-tools
