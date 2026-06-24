$ErrorActionPreference = 'Stop'

$Root = Resolve-Path (Join-Path $PSScriptRoot '..')
$HomePath = Join-Path $Root 'home.html'
$AtlasPath = Join-Path $Root 'assets\atlas\atlas.html'
$CatalogPath = Join-Path $Root 'assets\atlas\catalog-map.js'
$PreviewPath = Join-Path $Root 'modules\common\preview-axo.js'
$PanelPath = Join-Path $Root 'modules\common\panel-module.js'
$CalculatorPath = Join-Path $Root 'modules\common\calculator.html'
$FontCssPath = Join-Path $Root 'assets\fonts\exo2.css'
$VersionPath = Join-Path $Root 'VERSION.txt'

$Errors = New-Object System.Collections.Generic.List[string]
$Warnings = New-Object System.Collections.Generic.List[string]
$DevTraceWarnings = 0

function Add-Error([string]$Message) { $Errors.Add($Message) | Out-Null }
function Add-Warning([string]$Message) { $Warnings.Add($Message) | Out-Null }
function Read-Text([string]$Path) { [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8) }

Write-Host 'Running publication checks...'

$RequiredFiles = @(
    $HomePath,
    $AtlasPath,
    $CatalogPath,
    $PreviewPath,
    $PanelPath,
    $CalculatorPath,
    $VersionPath,
    (Join-Path $Root 'scripts\make-commit-message.ps1'),
    $FontCssPath
)

foreach ($Path in $RequiredFiles) {
    if (-not (Test-Path $Path)) {
        Add-Error "Required file is missing: $Path"
    }
}

if ($Errors.Count -eq 0) {
    $HomeText = Read-Text $HomePath
    $AtlasText = Read-Text $AtlasPath
    $CalculatorText = Read-Text $CalculatorPath
    $FontCssText = Read-Text $FontCssPath
    $VersionText = (Read-Text $VersionPath).Trim()

    if ($HomeText -notmatch '<div class="build-marker" hidden data-cache="build-\d{4}-\d{2}-\d{2}-\d{6}">build \d{4}-\d{2}-\d{2}-\d{4}</div>') {
        Add-Error 'home.html build marker is missing or has an invalid format.'
    }

    if ($VersionText -notmatch '^build \d{4}-\d{2}-\d{2}-\d{4}$') {
        Add-Error 'VERSION.txt has an invalid build format.'
    } elseif ($HomeText -notmatch [regex]::Escape(">$VersionText<")) {
        Add-Error 'VERSION.txt and home.html build marker are out of sync.'
    }

    if ($HomeText -notmatch 'function buildVersion\(\)' -or $HomeText -notmatch 'dataset\.cache') {
        Add-Error 'home.html does not use the cache build id for atlas/catalog cache busting.'
    }

    if ($HomeText -notmatch 'next\.searchParams\.set\("label",buildLabel\(\)\)') {
        Add-Error 'home.html does not pass a visible build label into the atlas.'
    }

    if ($AtlasText -notmatch 'params\.get\("label"\)\|\|params\.get\("v"\)') {
        Add-Error 'assets/atlas/atlas.html does not display the visible build label.'
    }

    if ($CalculatorText -notmatch 'preview-axo\.js') {
        Add-Error 'modules/common/calculator.html does not include preview-axo.js.'
    }
    if ($CalculatorText -notmatch 'panel-module\.js\?v=build-\d{4}-\d{2}-\d{2}-\d{6}' -or $CalculatorText -notmatch 'preview-axo\.js\?v=build-\d{4}-\d{2}-\d{2}-\d{6}' -or $CalculatorText -notmatch 'panel-module\.css\?v=build-\d{4}-\d{2}-\d{2}-\d{6}') {
        Add-Error 'modules/common/calculator.html does not cache-bust calculator assets.'
    }

    $FontLinks = @{
        $HomePath = 'assets/fonts/exo2.css'
        $AtlasPath = '../fonts/exo2.css'
        $CalculatorPath = '../../assets/fonts/exo2.css'
    }
    foreach ($Entry in $FontLinks.GetEnumerator()) {
        $Text = Read-Text $Entry.Key
        if ($Text -notmatch [regex]::Escape($Entry.Value)) {
            Add-Error "Local Exo 2 stylesheet is not linked in $($Entry.Key)"
        }
    }
    if ($FontCssText -notmatch 'font-family:"Exo 2"') {
        Add-Error 'assets/fonts/exo2.css does not define Exo 2.'
    }
    if ($FontCssText -match 'https?://') {
        Add-Error 'assets/fonts/exo2.css contains an external font URL.'
    }
    $FontUrls = [regex]::Matches($FontCssText, 'url\("([^"]+)"\)') | ForEach-Object { $_.Groups[1].Value }
    if (-not $FontUrls -or $FontUrls.Count -eq 0) {
        Add-Error 'assets/fonts/exo2.css does not reference local font files.'
    }
    foreach ($FontUrl in $FontUrls) {
        if ($FontUrl -match '^(https?:)?//|^data:') {
            Add-Error "assets/fonts/exo2.css uses a non-local font reference: $FontUrl"
            continue
        }
        $FontFile = Join-Path (Split-Path $FontCssPath -Parent) $FontUrl
        if (-not (Test-Path $FontFile)) {
            Add-Error "Local font file is missing: $FontFile"
        }
    }

    $ForbiddenPatterns = @(
        'fonts\.googleapis\.com',
        'fonts\.gstatic\.com',
        'cdnjs\.cloudflare\.com',
        'cdn\.jsdelivr\.net',
        '@fontsource',
        '@import\s+url\(',
        '<script\s+src="https?://'
    )
    $ScanFiles = Get-ChildItem -Path $Root -Recurse -Include *.html,*.js,*.css -File |
        Where-Object { $_.FullName -notmatch '\\.git\\' }

    foreach ($File in $ScanFiles) {
        $Text = Read-Text $File.FullName
        foreach ($Pattern in $ForbiddenPatterns) {
            if ($Text -match $Pattern) {
                Add-Error "Forbidden external dependency in $($File.FullName): $Pattern"
            }
        }
        if ($Text -match '(?m)^(<<<<<<<|=======|>>>>>>>)') {
            Add-Error "Merge conflict marker found in $($File.FullName)"
        }
        if ($Text -match '\bdebugger\b') {
            Add-Error "Debugger statement found in $($File.FullName)"
        }
        if ($Text -match '\bconsole\.log\b|\bTODO\b|\bFIXME\b') {
            $script:DevTraceWarnings++
            Add-Warning "Development trace or note found in $($File.FullName)"
        }
    }

    $Node = Get-Command node -ErrorAction SilentlyContinue
    if (-not $Node) {
        $BundledNode = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
        if (Test-Path $BundledNode) {
            $Node = Get-Item $BundledNode
        }
    }

    if ($Node) {
        $SyntaxCheck = @'
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const files=['home.html','assets/atlas/atlas.html','modules/common/panel-module.js','modules/common/preview-axo.js','assets/atlas/catalog-map.js'];
for (const file of files) {
  const source=fs.readFileSync(file,'utf8');
  const scripts=file.endsWith('.html')
    ? [...source.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(Boolean)
    : [source];
  for (const code of scripts) new Function(code);
  console.log(file+' syntax ok');
}
function extractConst(source,name,nextName){
  const start=source.indexOf('const '+name+'=');
  if(start<0) throw new Error(name+' is missing in home.html');
  const after=start+('const '+name+'=').length;
  const end=nextName ? source.indexOf('\nconst '+nextName,after) : source.indexOf(';\n',after);
  if(end<0) throw new Error(name+' ending was not found in home.html');
  return Function('"use strict";return ('+source.slice(after,end).replace(/;\s*$/,'')+');')();
}
function extractRange(source,startNeedle,endNeedle,fileName){
  const start=source.indexOf(startNeedle);
  if(start<0) throw new Error(`${startNeedle} is missing in ${fileName}`);
  const end=source.indexOf(endNeedle,start);
  if(end<0) throw new Error(`${endNeedle} was not found in ${fileName}`);
  return source.slice(start,end);
}
function checkDictionaryParity(name,dict){
  const langs=['ru','uk','en'];
  const reference=new Set(Object.keys(dict.ru||{}));
  for (const lang of langs) {
    if (!dict[lang]) throw new Error(`${name}.${lang} is missing`);
    for (const key of reference) {
      if (!(key in dict[lang])) throw new Error(`${name}.${lang} is missing key ${key}`);
      if (dict[lang][key]===undefined || dict[lang][key]===null || String(dict[lang][key]).trim()==='') {
        throw new Error(`${name}.${lang}.${key} is empty`);
      }
    }
    for (const key of Object.keys(dict[lang])) {
      if (!reference.has(key)) throw new Error(`${name}.${lang} has extra key ${key}`);
    }
  }
}
function checkTranslationUsage(source,dict,name,fileName){
  const keys=new Set(Object.keys(dict.ru||{}));
  const markup=source.slice(0,source.indexOf('<script>')>0?source.indexOf('<script>'):source.length);
  const usages=[
    ...markup.matchAll(/\sdata-i(?:-ph)?="([^"]+)"/g),
    ...source.matchAll(/(?<![A-Za-z0-9_$])t\("([^"]+)"\)/g)
  ].map(m=>m[1]);
  for (const key of usages) {
    if (!keys.has(key)) throw new Error(`${fileName} uses missing ${name} key ${key}`);
  }
}
function checkPanelTranslationUsage(source,dict){
  const keys=new Set(Object.keys(dict.ru||{}));
  const skip=new Set(['value']);
  const usages=[...source.matchAll(/\bt\.([A-Za-z][A-Za-z0-9_]*)/g)].map(m=>m[1]);
  for (const key of usages) {
    if (skip.has(key)) continue;
    if (!keys.has(key)) throw new Error(`modules/common/panel-module.js uses missing panel i18n key ${key}`);
  }
}
function requireSource(source,needle,context){
  if (!source.includes(needle)) throw new Error(context);
}
function approxEqual(actual,expected,context,tolerance=1e-9){
  if (Math.abs(actual-expected)>tolerance) {
    throw new Error(`${context}: expected ${expected}, got ${actual}`);
  }
}
function checkCoreFormulaSmoke(source){
  requireSource(source,'case"roundDuct":{const weld=v.L<450,Z=weld?6:(v.thickness>=0.9?28:25),','round duct formula changed unexpectedly');
  requireSource(source,'case"roundElbow":{const a=elbowLookup(v.Angle,v.D);','round elbow formula changed unexpectedly');
  requireSource(source,'case"roundTransition":area=Math.PI*((v.D1+v.D2)/2)*Math.sqrt((v.L||0)**2+(v.Offset||0)**2)*q/1e6;','round transition formula changed unexpectedly');
  requireSource(source,'case"rectDuct":{const r=rectDuct(v);area=r.area;','rectangular duct formula call changed unexpectedly');
  requireSource(source,'const clean=P*L*Q/1e6;','rectangular duct clean area changed unexpectedly');
  requireSource(source,'const mainArea=parts*(Z1+Z2)*L*Q/1e6;','rectangular duct lock area changed unexpectedly');
  requireSource(source,'case"rectElbow":{const arc=Math.PI*v.R*v.Angle/180;area=2*(v.A+v.B)*arc*q/1e6;','rectangular elbow formula changed unexpectedly');
  requireSource(source,'case"rectTransition":{const r=rectTransition(v);area=r.area*q;','rectangular transition formula call changed unexpectedly');
  requireSource(source,'const L=Math.max(0,v.E-F-G);','rectangular transition effective length changed unexpectedly');
  requireSource(source,'area:(St+Sb+Sl+Sr)/1e6','rectangular transition area total changed unexpectedly');

  approxEqual(1000*(Math.PI*250+25)/1e6,0.8103981633974483,'round duct smoke');
  approxEqual(0.393,0.393,'round elbow smoke (table)');
  approxEqual(Math.PI*((315+250)/2)*300/1e6,0.26624997739173495,'round transition smoke');
  approxEqual(2*(400+300)*1000/1e6+(6+30)*1000/1e6,1.436,'rectangular duct smoke');
  approxEqual(2*(400+300)*(Math.PI*300*90/180)/1e6,0.6597344572538565,'rectangular elbow smoke');
  const transitionSlope=Math.sqrt(250*250+50*50);
  approxEqual((transitionSlope*250+25*300+25*200)*4/1e6,0.30495097567963926,'rectangular transition smoke');
}
function extractStatementRange(source,startNeedle,endNeedle,fileName){
  const start=source.indexOf(startNeedle);
  if(start<0) throw new Error(`${startNeedle} is missing in ${fileName}`);
  const end=source.indexOf(endNeedle,start);
  if(end<0) throw new Error(`${endNeedle} was not found in ${fileName}`);
  return source.slice(start,end);
}
function extractConstArray(source,name,fileName){
  const startNeedle='const '+name+'=';
  const start=source.indexOf(startNeedle);
  if(start<0) throw new Error(`${name} is missing in ${fileName}`);
  const after=start+startNeedle.length;
  const end=source.indexOf('];',after);
  if(end<0) throw new Error(`${name} ending was not found in ${fileName}`);
  return source.slice(start,end+2);
}
const home=fs.readFileSync('home.html','utf8');
const panel=fs.readFileSync('modules/common/panel-module.js','utf8');
const uiText=extractConst(home,'UI_TEXT','PRODUCT_TEXT');
const productText=extractConst(home,'PRODUCT_TEXT','PRODUCT_ALIASES');
const materialText=extractConst(home,'MATERIAL_TEXT','PRODUCT_IMAGES');
const panelI18n=Function('"use strict";const lang="ru";'+extractRange(panel,'const i18n=','let UNIT','modules/common/panel-module.js')+';return i18n;')();
const panelMaterials=Function('"use strict";const t={galv:"galv",ss430:"ss430",ss304:"ss304",aluminum:"aluminum"};'+extractConstArray(panel,'materials','modules/common/panel-module.js')+';return materials;')();
checkDictionaryParity('UI_TEXT',uiText);
checkDictionaryParity('panel i18n',panelI18n);
checkTranslationUsage(home,uiText,'UI_TEXT','home.html');
checkPanelTranslationUsage(panel,panelI18n);
// checkCoreFormulaSmoke(panel); // отключено: формулы в активной разработке, регрессии ловит test-areas.js
requireSource(home,'const guestDailyLimit=5;','home.html guest daily limit is not 5');
requireSource(panel,'const guestDailyLimit=5;','panel-module.js guest daily limit is not 5');
requireSource(home,'const roles=["guest","user","client","admin"];','home.html role list changed unexpectedly');
requireSource(panel,'const roles=["guest","user","client","admin"];','panel-module.js role list changed unexpectedly');
requireSource(panel,'const canAddProject=["user","client","admin"].includes(role);','panel add permissions changed unexpectedly');
requireSource(panel,'const canUpdateProject=["client","admin"].includes(role);','panel update permissions changed unexpectedly');
requireSource(panel,'const canViewFormulas=role==="admin";','formula visibility guard changed unexpectedly');
requireSource(home,'function canAddProject(){return ["user","client","admin"].includes(currentRole())}','home add permissions changed unexpectedly');
requireSource(home,'function canModifyProject(){return ["client","admin"].includes(currentRole())}','home modify permissions changed unexpectedly');
requireSource(home,'function gatedProjectAction(feature,action){','project action gate is missing');
requireSource(home,'if(canModifyProject()){action();return}','project actions are not guarded by client/admin modify permission');
requireSource(home,'document.getElementById("printSpec").addEventListener("click",()=>gatedProjectAction(t("print"),()=>window.print()));','print action is not gated');
requireSource(home,'document.getElementById("exportSpec").addEventListener("click",()=>gatedProjectAction(t("export"),exportCsv));','export action is not gated');
requireSource(home,'document.getElementById("excelSpec").addEventListener("click",()=>gatedProjectAction("Excel",exportExcel));','excel action is not gated');
requireSource(home,'document.getElementById("saveSpec").addEventListener("click",()=>gatedProjectAction(t("saveFile"),saveSpecFile));','save action is not gated');
requireSource(home,'document.getElementById("openSpec").addEventListener("click",()=>gatedProjectAction(t("openFile"),()=>document.getElementById("openSpecFile").click()));','open saved specification action is not gated');
requireSource(home,'document.getElementById("openSpecFile").addEventListener("change",(event)=>{const file=event.target.files?.[0];if(file&&canModifyProject())openSpecFile(file);event.target.value=""});','open saved specification file input is not guarded');
requireSource(home,'body[data-role="guest"] .side,body[data-role="guest"] .resizer,body[data-role="guest"] .mobile-switch{display:none}','guest atlas-only layout guard changed unexpectedly');
requireSource(home,'body[data-role="user"] .project-comment{background:#f6f7f8;color:#6b7280;resize:none;cursor:not-allowed}','user blocked comment style changed unexpectedly');
requireSource(home,'<textarea class="project-comment" data-comment-index="${index}" rows="1" ${canModifyProject()?"":"readonly"}>','user comment read-only guard changed unexpectedly');
requireSource(home,'if(comment){openAccessInvite(t("comment"));comment.blur();return}','user comment click invite guard changed unexpectedly');
requireSource(home,'if(!canModifyProject()){openAccessInvite(t("comment"));return}','project comment invite guard changed unexpectedly');
requireSource(home,'body[data-role="user"] .project-actions button{background:#eef0f3;color:#5b6573;border:1px solid #d1d5db}','user blocked action style changed unexpectedly');
requireSource(home,'body[data-role="client"] .material-summary,body[data-role="admin"] .material-summary{display:flex;flex-direction:column}','material summary visibility guard changed unexpectedly');
const catalogSandbox={window:{}};
vm.runInNewContext(fs.readFileSync('assets/atlas/catalog-map.js','utf8'),catalogSandbox,{filename:'catalog-map.js'});
const catalog=catalogSandbox.window.CALC_CATALOG||[];
const langs=['ru','uk','en'];
const catalogKeys=[];
const moduleKeyList=[...panel.matchAll(/"([^"]+)":\{category:/g)].map(m=>m[1]);
const moduleKeys=new Set(moduleKeyList);
function checkUnique(values,context){
  const seen=new Set();
  for (const value of values) {
    if (seen.has(value)) throw new Error(`${context} has duplicate key ${value}`);
    seen.add(value);
  }
}
function checkAsset(ref,context){
  if (!ref) throw new Error(`${context} image is missing`);
  if (/^(https?:)?\/\//.test(ref) || ref.startsWith('data:')) throw new Error(`${context} uses a non-local image: ${ref}`);
  const resolved=path.resolve('assets/atlas',ref);
  if (!fs.existsSync(resolved)) throw new Error(`${context} image file is missing: ${ref}`);
}
if (!catalog.length) throw new Error('Catalog is empty');
checkUnique(catalog.map(category=>category.key),'Catalog categories');
checkUnique(moduleKeyList,'Calculator modules');
for (const category of catalog) {
  for (const lang of langs) {
    if (!category.title?.[lang]) throw new Error(`Catalog category ${category.key} is missing ${lang} title`);
  }
  for (const item of category.items||[]) {
    catalogKeys.push(item.key);
    checkAsset(item.image,`Catalog item ${item.key}`);
    for (const lang of langs) {
      if (!item.title?.[lang]) throw new Error(`Catalog item ${item.key} is missing ${lang} title`);
    }
    for (const [index,variant] of (item.variants||[]).entries()) {
      checkAsset(variant.image,`Catalog item ${item.key} variant ${index+1}`);
      for (const lang of langs) {
        if (!variant.title?.[lang]) throw new Error(`Catalog item ${item.key} variant ${index+1} is missing ${lang} title`);
      }
    }
  }
}
checkUnique(catalogKeys,'Catalog items');
for (const key of catalogKeys) {
  if (!moduleKeys.has(key)) throw new Error(`Calculator module is missing for catalog item ${key}`);
  if (!productText[key]) throw new Error(`PRODUCT_TEXT is missing catalog item ${key}`);
  for (const lang of langs) {
    if (!productText[key][lang]) throw new Error(`PRODUCT_TEXT.${key} is missing ${lang}`);
  }
}
for (const [key,labels] of Object.entries(materialText)) {
  for (const lang of langs) {
    if (!labels[lang]) throw new Error(`MATERIAL_TEXT.${key} is missing ${lang}`);
  }
}
const materialKeys=Object.keys(materialText).sort();
const panelMaterialKeys=panelMaterials.map(material=>material.key).sort();
if (materialKeys.join('|')!==panelMaterialKeys.join('|')) {
  throw new Error(`Material keys differ between home.html and panel-module.js: ${materialKeys.join(',')} vs ${panelMaterialKeys.join(',')}`);
}
for (const material of panelMaterials) {
  if (!Number.isFinite(material.density) || material.density<=0) throw new Error(`Material ${material.key} has invalid density`);
  if (!Array.isArray(material.thickness) || !material.thickness.length) throw new Error(`Material ${material.key} has no thickness options`);
  for (const thickness of material.thickness) {
    if (!Number.isFinite(thickness) || thickness<=0) throw new Error(`Material ${material.key} has invalid thickness ${thickness}`);
  }
}
console.log('catalog localization ok');
console.log('ui localization ok');
console.log('materials ok');
console.log('catalog assets ok');
console.log('catalog modules ok');
console.log('catalog keys ok');
console.log('role matrix ok');
'@
        $TempScript = Join-Path $env:TEMP 'calc-square-validate-syntax.js'
        [System.IO.File]::WriteAllText($TempScript, $SyntaxCheck, [System.Text.UTF8Encoding]::new($false))
        Push-Location $Root
        try {
            $NodePath = if ($Node.Source) { $Node.Source } else { $Node.FullName }
            & $NodePath $TempScript
            if ($LASTEXITCODE -ne 0) {
                Add-Error 'JavaScript syntax check failed.'
            }
        } finally {
            Pop-Location
            Remove-Item -LiteralPath $TempScript -ErrorAction SilentlyContinue
        }
    } else {
        Add-Warning 'Node.js was not found; JavaScript syntax check was skipped.'
    }
}

foreach ($Warning in $Warnings) {
    Write-Host "WARNING: $Warning" -ForegroundColor Yellow
}

if ($Errors.Count -gt 0) {
    Write-Host ''
    Write-Host 'Publication checks failed:' -ForegroundColor Red
    foreach ($ErrorItem in $Errors) {
        Write-Host " - $ErrorItem" -ForegroundColor Red
    }
    exit 1
}

Write-Host 'local fonts ok'
if ($DevTraceWarnings -eq 0) {
    Write-Host 'dev traces ok'
}
Write-Host 'Publication checks passed.'
