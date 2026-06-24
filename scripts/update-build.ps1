$ErrorActionPreference = 'Stop'

$Now = Get-Date
$Build = 'build ' + $Now.ToString('yyyy-MM-dd-HHmm')
$CacheBuild = 'build-' + $Now.ToString('yyyy-MM-dd-HHmmss')
$Root = Resolve-Path (Join-Path $PSScriptRoot '..')
$HomePath = Join-Path $Root 'home.html'
$CalculatorPath = Join-Path $Root 'modules\common\calculator.html'
$VersionPath = Join-Path $Root 'VERSION.txt'
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

if (-not (Test-Path $HomePath)) {
    throw 'home.html was not found'
}
if (-not (Test-Path $CalculatorPath)) {
    throw 'modules/common/calculator.html was not found'
}

$HomeText = [System.IO.File]::ReadAllText($HomePath, [System.Text.Encoding]::UTF8)
$CalculatorText = [System.IO.File]::ReadAllText($CalculatorPath, [System.Text.Encoding]::UTF8)
$MarkerPattern = '<div class="build-marker"[^>]*>build\s+\d{4}-\d{2}-\d{2}-\d{4,6}</div>'
$Marker = '<div class="build-marker" hidden data-cache="' + $CacheBuild + '">' + $Build + '</div>'

if ([regex]::IsMatch($HomeText, $MarkerPattern)) {
    $HomeText = [regex]::Replace($HomeText, $MarkerPattern, $Marker, 1)
} elseif ($HomeText -match '<body[^>]*>') {
    $HomeText = [regex]::Replace($HomeText, '(<body[^>]*>)', ('$1' + "`r`n" + $Marker), 1)
} else {
    throw 'Body tag was not found in home.html'
}

$CalculatorText = [regex]::Replace($CalculatorText, '(\?v=)build-\d{4}-\d{2}-\d{2}-\d{6}', ('$1' + $CacheBuild))

[System.IO.File]::WriteAllText($HomePath, $HomeText, $Utf8NoBom)
[System.IO.File]::WriteAllText($CalculatorPath, $CalculatorText, $Utf8NoBom)
[System.IO.File]::WriteAllText($VersionPath, $Build, $Utf8NoBom)

Write-Output $Build
