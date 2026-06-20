$ErrorActionPreference = 'Stop'

$Build = 'build ' + (Get-Date).ToString('yyyy-MM-dd-HHmm')
$Root = Resolve-Path (Join-Path $PSScriptRoot '..')
$HomePath = Join-Path $Root 'home.html'
$VersionPath = Join-Path $Root 'VERSION.txt'
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

if (-not (Test-Path $HomePath)) {
    throw 'home.html was not found'
}

$HomeText = [System.IO.File]::ReadAllText($HomePath, [System.Text.Encoding]::UTF8)
$MarkerPattern = '<div class="build-marker" hidden>build\s+\d{4}-\d{2}-\d{2}-\d{4,6}</div>'
$Marker = '<div class="build-marker" hidden>' + $Build + '</div>'

if ([regex]::IsMatch($HomeText, $MarkerPattern)) {
    $HomeText = [regex]::Replace($HomeText, $MarkerPattern, $Marker, 1)
} elseif ($HomeText -match '<body[^>]*>') {
    $HomeText = [regex]::Replace($HomeText, '(<body[^>]*>)', ('$1' + "`r`n" + $Marker), 1)
} else {
    throw 'Body tag was not found in home.html'
}

[System.IO.File]::WriteAllText($HomePath, $HomeText, $Utf8NoBom)
[System.IO.File]::WriteAllText($VersionPath, $Build, $Utf8NoBom)

Write-Output $Build
