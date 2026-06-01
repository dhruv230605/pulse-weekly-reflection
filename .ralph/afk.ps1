param(
    [Parameter(Mandatory)][int]$Iterations
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$repoRoot = Split-Path $PSScriptRoot -Parent
Set-Location $repoRoot

for ($i = 1; $i -le $Iterations; $i++) {
    Write-Host "`n=== Iteration $i / $Iterations ===" -ForegroundColor Cyan

    $commits = git log -n 5 --format="%H%n%ad%n%B---" --date=short 2>$null
    if (-not $commits) { $commits = "No commits found" }

    $issuesPath = Join-Path $repoRoot "issues" "*.md"
    if (Test-Path $issuesPath) {
        $issues = Get-Content $issuesPath -Raw
    } else {
        $issues = "No issues found"
    }

    $prompt = Get-Content "$PSScriptRoot\prompt.md" -Raw

    $fullPrompt = "Previous commits: $commits Issues: $issues $prompt"

    $output = copilot --prompt $fullPrompt --allow-all-tools 2>&1 | ForEach-Object {
        Write-Host $_
        $_
    }

    $combined = $output -join "`n"

    if ($combined -match '<promise>NO MORE TASKS</promise>') {
        Write-Host "`nRalph complete after $i iteration(s)." -ForegroundColor Green
        exit 0
    }
}

Write-Host "`nReached iteration limit ($Iterations)." -ForegroundColor Yellow
