$ErrorActionPreference = 'Stop'

$Now = Get-Date
$Build = 'Calc Square v1.0.0 · build ' + $Now.ToString('yyyy-MM-dd HH:mm')
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
$MarkerPattern = '<div class="build-marker"[^>]*>[^<]*</div>'
$Marker = '<div class="build-marker" data-cache="' + $CacheBuild + '" style="position:fixed;bottom:6px;right:10px;font-size:11px;line-height:1.4;color:#9aa0a6;background:rgba(255,255,255,.85);padding:1px 6px;border-radius:4px;box-shadow:0 1px 3px rgba(0,0,0,.12);z-index:2147483647;pointer-events:none;white-space:nowrap">' + $Build + '</div>'

if ([regex]::IsMatch($HomeText, $MarkerPattern)) {
    $HomeText = [regex]::Replace($HomeText, $MarkerPattern, $Marker, 1)
} elseif ($HomeText -match '<body[^>]*>') {
    $HomeText = [regex]::Replace($HomeText, '(<body[^>]*>)', ('$1' + "`r`n" + $Marker), 1)
} else {
    throw 'Body tag was not found in home.html'
}

$CalculatorText = [regex]::Replace($CalculatorText, '(\?v=)build-[\d-]+', ('$1' + $CacheBuild))

[System.IO.File]::WriteAllText($HomePath, $HomeText, $Utf8NoBom)
[System.IO.File]::WriteAllText($CalculatorPath, $CalculatorText, $Utf8NoBom)
[System.IO.File]::WriteAllText($VersionPath, $Build, $Utf8NoBom)

Write-Output $Build
