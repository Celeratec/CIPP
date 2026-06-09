<#
.SYNOPSIS
    Bump version tracking files after a Manage365 upstream intake.

.DESCRIPTION
    Updates the upstream baseline version used by GetVersion / GetCippAlerts out-of-date checks.
    Optionally bumps the Manage365 fork release version shown in Application Settings.

.PARAMETER UpstreamVersion
    CIPP upstream baseline absorbed (e.g. 10.5.1). Written to public/version.json and package.json.

.PARAMETER Manage365Version
    Optional Manage365 fork release (e.g. 5.12.15). Written to public/manage365-version.json.

.EXAMPLE
    ./Tools/Update-Version.ps1 -UpstreamVersion 10.5.1 -Manage365Version 5.12.15
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$UpstreamVersion,

    [string]$Manage365Version
)

Set-Location (Get-Item $PSScriptRoot).Parent.FullName

# Legacy CIPP paths (no-op if missing)
$LegacyFiles = @('version_latest.txt', 'public/version_latest.txt')
foreach ($File in $LegacyFiles) {
    if (Test-Path $File) {
        Set-Content $File -Value $UpstreamVersion -NoNewline
    }
}

# Upstream baseline — drives out-of-date alerts and X-CIPP-Version header
$VersionJson = @{ version = $UpstreamVersion } | ConvertTo-Json
Set-Content 'public/version.json' -Value $VersionJson

$Package = Get-Content package.json -Raw | ConvertFrom-Json
$Package.version = $UpstreamVersion
$Package | ConvertTo-Json -Depth 10 | Set-Content package.json

if ($Manage365Version) {
    $Manage365Json = @{
        version          = $Manage365Version
        upstreamBaseline = $UpstreamVersion
    } | ConvertTo-Json
    Set-Content 'public/manage365-version.json' -Value $Manage365Json
}

Write-Host "Upstream baseline set to $UpstreamVersion"
if ($Manage365Version) {
    Write-Host "Manage365 release set to $Manage365Version"
}
Write-Host "Remember to also update CIPP-API version_latest.txt and Config/version_latest.txt, then redeploy frontend and all Function App slots."
