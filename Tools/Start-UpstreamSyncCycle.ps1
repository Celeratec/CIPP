<#
.SYNOPSIS
    Start a Manage365 upstream sync cycle — fetch, tag backup, create sync branch, print delta stats.

.PARAMETER Repo
    CIPP or CIPP-API

.PARAMETER SyncBase
    Optional commit SHA to measure delta from (default: current branch tip before branch switch)

.PARAMETER DateStamp
    Optional YYYYMMDD (default: today)

.EXAMPLE
    ./Tools/Start-UpstreamSyncCycle.ps1 -Repo CIPP
    cd ../CIPP-API; ./../CIPP/Tools/Start-UpstreamSyncCycle.ps1 -Repo CIPP-API
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('CIPP', 'CIPP-API')]
    [string]$Repo,

    [string]$SyncBase,

    [string]$DateStamp = (Get-Date -Format 'yyyyMMdd')
)

$ErrorActionPreference = 'Stop'

$config = @{
    CIPP     = @{
        ProductionBranch = 'main'
        UpstreamBranch   = 'upstream/main'
        Remote           = 'upstream'
        Slug             = 'cipp'
    }
    'CIPP-API' = @{
        ProductionBranch = 'master'
        UpstreamBranch   = 'upstream/master'
        Remote           = 'upstream'
        Slug             = 'cipp-api'
    }
}

$cfg = $config[$Repo]
$prod = $cfg.ProductionBranch
$upstreamRef = $cfg.UpstreamBranch
$slug = $cfg.Slug

Write-Host "=== Manage365 upstream sync: $Repo ===" -ForegroundColor Cyan
Write-Host "Date stamp: $DateStamp"

if (-not (git rev-parse --git-dir 2>$null)) {
    throw "Not a git repository. Run from CIPP or CIPP-API root."
}

$status = git status --porcelain
if ($status) {
    Write-Warning "Working tree is not clean:"
    Write-Host $status
    throw "Commit or stash changes before starting a sync cycle."
}

Write-Host "Fetching upstream..."
git fetch upstream 2>&1 | Out-Host

$tip = (git rev-parse $prod).Trim()
if (-not $SyncBase) { $SyncBase = $tip }

$backupTag = "backup/pre-upstream-sync-$slug-$DateStamp"
$syncBranch = "manage365/upstream-sync-$slug-$DateStamp"

Write-Host ""
Write-Host "Production branch: $prod @ $tip"
Write-Host "Sync base:         $SyncBase"
Write-Host "Upstream:          $upstreamRef @ $(git rev-parse $upstreamRef)"

$counts = (git rev-list --left-right --count "$prod...$upstreamRef").Trim() -split '\s+'
Write-Host "Ahead of upstream:  $($counts[0])"
Write-Host "Behind upstream:    $($counts[1])"

$deltaCount = (git rev-list --count "$SyncBase..$upstreamRef").Trim()
Write-Host "Commits to review (since sync base): $deltaCount"

Write-Host ""
Write-Host "Creating backup tag: $backupTag"
git tag $backupTag $tip 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Tag may already exist: $backupTag"
}

$existing = git branch --list $syncBranch
if ($existing) {
    Write-Warning "Branch already exists: $syncBranch — checking out"
    git checkout $syncBranch
} else {
    Write-Host "Creating sync branch: $syncBranch from $prod"
    git checkout -b $syncBranch $prod
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Green
Write-Host "  1. Read docs/upstream-sync/PROCESS.md"
Write-Host "  2. Generate UPSTREAM_DELTA_${Repo}_$DateStamp.md (git log $SyncBase..$upstreamRef)"
Write-Host "  3. Triage commits — Apply / Adapt / Defer / Skip"
Write-Host "  4. Cherry-pick mini-batches on this branch"
Write-Host "  5. Write CIPP_SYNC_CHECKPOINT_$DateStamp.md when done"
Write-Host ""
Write-Host "Sample inventory command:"
Write-Host "  git log --oneline $SyncBase..$upstreamRef" -ForegroundColor DarkGray
