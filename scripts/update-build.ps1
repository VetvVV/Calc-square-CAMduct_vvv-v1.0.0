$ErrorActionPreference = 'Stop'

$Build = 'build ' + (Get-Date).ToString('yyyy-MM-dd-HHmm')
$Root = Resolve-Path (Join-Path $PSScriptRoot '..')
$HomePath = Join-Path $Root 'home.html'
$VersionPath = Join-Path $Root 'VERSION.txt'
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

$HomeText = [System.IO.File]::ReadAllText($HomePath, [System.Text.Encoding]::UTF8)
$Pattern = '(?<=<div class="build-marker">)build\s+\d{4}-\d{2}-\d{2}-\d{2,4}(?=</div>)'

if (-not [regex]::IsMatch($HomeText, $Pattern)) {
    throw 'Build marker was not found in home.html'
}

$UpdatedHome = [regex]::Replace($HomeText, $Pattern, $Build, 1)

[System.IO.File]::WriteAllText($HomePath, $UpdatedHome, $Utf8NoBom)
[System.IO.File]::WriteAllText($VersionPath, $Build, $Utf8NoBom)

Write-Output $Build
