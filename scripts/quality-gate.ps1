param(
    [switch]$SkipRepositoryCheck
)

$ErrorActionPreference = "Stop"

if (-not $SkipRepositoryCheck) {
    & "$PSScriptRoot/check-repository.ps1"
}

npm run quality
if ($LASTEXITCODE -ne 0) {
    throw "Public frontend production quality gate failed."
}

Write-Host "Public frontend production quality gate passed."
