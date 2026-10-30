param(
    [ValidateSet('install', 'dev', 'build', 'preview', 'test:physics', 'test:smoke', 'install:browser')]
    [string]$Task = 'dev'
)

$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$taskCacheRoot = Join-Path $PSScriptRoot '.cache'
foreach ($taskFolder in @('tmp', 'npm', 'browsers')) {
    New-Item -ItemType Directory -Path (Join-Path $taskCacheRoot $taskFolder) -Force | Out-Null
}
$env:TEMP = Join-Path $taskCacheRoot 'tmp'
$env:TMP = $env:TEMP
$env:TMPDIR = $env:TEMP
$env:NPM_CONFIG_CACHE = Join-Path $taskCacheRoot 'npm'
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path $taskCacheRoot 'browsers'
if ($Task -eq 'install') {
    & npm.cmd ci
} elseif ($Task -eq 'install:browser') {
    & npx.cmd --no-install playwright install chromium
} else {
    & npm.cmd run $Task
}
exit $LASTEXITCODE
