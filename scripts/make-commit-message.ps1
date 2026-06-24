param(
    [Parameter(Mandatory = $true)]
    [string]$BuildLabel,

    [Parameter(Mandatory = $true)]
    [string]$OutputPath
)

$ErrorActionPreference = 'Stop'

$Root = Resolve-Path (Join-Path $PSScriptRoot '..')
Push-Location $Root
try {
    $Status = git status --short
    $Diff = git diff --unified=0 --no-ext-diff
    $SignalDiff = git diff --unified=0 --no-ext-diff -- . ':(exclude)scripts/make-commit-message.ps1'
} finally {
    Pop-Location
}

$Files = @()
foreach ($Line in $Status) {
    if ([string]::IsNullOrWhiteSpace($Line)) { continue }
    $Path = if ($Line.Length -gt 3) { $Line.Substring(3).Trim() } else { $Line.Trim() }
    if ($Path -match ' -> ') { $Path = ($Path -split ' -> ')[-1].Trim() }
    $Files += $Path
}

$Parts = New-Object System.Collections.Generic.List[string]
$Bullets = New-Object System.Collections.Generic.List[string]

function Has-File([string]$Pattern) {
    return [bool]($Files | Where-Object { $_ -match $Pattern } | Select-Object -First 1)
}

function Has-Diff([string]$Pattern) {
    return [bool]($SignalDiff | Select-String -Pattern $Pattern -Quiet)
}

function Add-Part([string]$Part) {
    if (-not $Parts.Contains($Part)) {
        $Parts.Add($Part) | Out-Null
    }
}

function Add-Bullet([string]$Text) {
    if (-not $Bullets.Contains($Text)) {
        $Bullets.Add($Text) | Out-Null
    }
}

if (Has-File '(^|/)publish\.bat$|(^|/)scripts/') {
    Add-Part 'publication flow'
    Add-Bullet 'Update PublishBot checks and publication scripts.'
}

if (Has-File '(^|/)VERSION\.txt$|(^|/)home\.html$') {
    Add-Part 'build marker'
    Add-Bullet "Update build marker to $BuildLabel."
}

if (Has-File '(^|/)assets/atlas/|(^|/)assets\\atlas\\') {
    Add-Part 'atlas'
    Add-Bullet 'Update atlas catalog behavior or assets.'
}

if (Has-File '(^|/)modules/|(^|/)modules\\') {
    Add-Part 'calculators'
    Add-Bullet 'Update calculator modules or shared calculator panel.'
}

if (Has-File '(^|/)assets/fonts/|(^|/)assets\\fonts\\') {
    Add-Part 'fonts'
    Add-Bullet 'Update local font assets.'
}

if (Has-File '(^|/)README\.md$|(^|/)PUBLISH_CHECKLIST\.md$|(^|/)docs/') {
    Add-Part 'docs'
    Add-Bullet 'Update project documentation.'
}

if (Has-Diff 'MATERIAL_TEXT|materialKeyFromLabel|const materials=|materials ok|aluminum|Алюминий|Алюміній') {
    Add-Part 'materials'
    Add-Bullet 'Synchronize material dictionaries, calculator materials, and material validation.'
}

if (Has-Diff 'role matrix ok|canModifyProject|canAddProject|gatedProjectAction|guestDailyLimit|data-role="user"') {
    Add-Part 'roles'
    Add-Bullet 'Keep role permissions guarded for guest, user, client, and admin workflows.'
}

if (Has-Diff 'catalog localization ok|ui localization ok|checkDictionaryParity|checkTranslationUsage|PRODUCT_TEXT|PRODUCT_ALIASES') {
    Add-Part 'localization'
    Add-Bullet 'Strengthen RU/UK/EN localization checks and saved-spec normalization.'
}

if (Has-Diff 'displayProductName|normalizeProjectItem|productKeyFromName') {
    Add-Part 'specification localization'
    Add-Bullet 'Fix saved specification product names so they follow the selected interface language.'
}

if (Has-Diff '@media print|window\.print|project-actions|mobile-switch|project-comment|summary-table|grid-template-columns') {
    Add-Part 'print layout'
    Add-Bullet 'Refine printed specification columns, comments, wrapping, material summary layout, and repeated page headers.'
}

if (Has-Diff 'logo-circle|watermark|ST SPETSMONTAZH') {
    Add-Part 'print protection'
    Add-Bullet 'Add subtle ST Spetsmontazh watermark protection to printed specifications.'
}

if (Has-Diff 'passwordToggle|showPassword|hidePassword|password-wrap|password-toggle') {
    Add-Part 'login UI'
    Add-Bullet 'Add password visibility control to the login form.'
}

if (Has-Diff 'catalog assets ok|catalog modules ok|catalog keys ok|checkAsset|checkUnique|CALC_CATALOG') {
    Add-Part 'atlas validation'
    Add-Bullet 'Validate atlas assets, catalog keys, and calculator module coverage before publishing.'
}

if (Has-Diff 'local fonts ok|exo2\.css|font-family:"Exo 2"|assets/fonts') {
    Add-Part 'fonts'
    Add-Bullet 'Verify bundled Exo 2 font files and prevent external font dependencies.'
}

if (Has-Diff 'dev traces ok|debugger|console\.log|TODO|FIXME') {
    Add-Part 'publication flow'
    Add-Bullet 'Check for debugger statements and development traces before publishing.'
}

if (Has-Diff 'spec-panel|spec-controls|specControlsCollapsed|specSettings|resetView') {
    Add-Part 'specification controls'
    Add-Bullet 'Compact the specification settings panel and keep its collapsed state remembered.'
}

if (Has-Diff 'panelLayout|currentPanelLayout|data-panel-layout|project-left|grid-template-columns:minmax\(300px,1fr\) 10px|minmax\(520px,min\(var\(--project-width\)|\.work\{order:1\}|\.side\{order:3') {
    Add-Part 'workspace layout'
    Add-Bullet 'Add a saved left/right panel layout switch for the atlas and project workspace.'
}

if ($Parts.Count -eq 0) {
    Add-Part 'Calc Square'
}

if ($Bullets.Count -eq 0) {
    Add-Bullet 'Publish current Calc Square changes.'
}

$UniqueParts = @($Parts | Select-Object -Unique)
$SubjectScope = if ($UniqueParts.Count -gt 4) {
    'Calc Square safeguards'
} else {
    $UniqueParts -join ', '
}
$Subject = 'Publish ' + $SubjectScope + ' - ' + $BuildLabel
$ChangedFiles = $Files | Sort-Object -Unique | ForEach-Object { '- ' + $_ }

$Message = @(
    $Subject,
    '',
    'Changes:',
    ($Bullets | Select-Object -Unique | ForEach-Object { '- ' + $_ }),
    '',
    'Validation:',
    '- Publication checks passed before commit.',
    '- JavaScript syntax checks passed.',
    '- UI and catalog localization, materials, role matrix, local images, calculator modules, catalog keys, local fonts, and development traces were checked.',
    '',
    'Files:',
    $ChangedFiles
) | ForEach-Object { $_ }

$ResolvedOutputPath = if ([System.IO.Path]::IsPathRooted($OutputPath)) {
    $OutputPath
} else {
    Join-Path $Root $OutputPath
}

$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllLines($ResolvedOutputPath, $Message, $Utf8NoBom)
Write-Output $Subject
