/* Calc Square — scripts/test-areas.js
   Регрессионный тест площадей: сверяет площадь каждого изделия
   (при значениях по умолчанию, role=admin) с эталоном scripts/areas-baseline.json.
   Запуск:  node scripts/test-areas.js            — проверка (exit 0/1)
            node scripts/test-areas.js --update    — перезаписать эталон текущими значениями */
"use strict";
const path=require("path");
const fs=require("fs");
const {pathToFileURL}=require("url");
const {chromium}=require("playwright");
const out=(...a)=>process.stdout.write(a.join(" ")+"\n");
const TOL=0.0006;

const ROOT=path.resolve(__dirname,"..");
const BASELINE=path.join(__dirname,"areas-baseline.json");
const UPDATE=process.argv.includes("--update");
const calcBase=pathToFileURL(path.join(ROOT,"modules","common","calculator.html")).href;
const calcUrl=(k)=>`${calcBase}?module=${k}&role=admin&lang=ru`;

async function launchBrowser(){
  const tries=[{channel:"chrome"},{channel:"msedge"},{}];
  let last;
  for(const o of tries){try{return await chromium.launch({headless:true,...o});}catch(e){last=e;}}
  throw new Error("Не удалось запустить браузер (Chrome/Edge/Playwright). "+(last&&last.message));
}
async function areaOf(page,key){
  await page.goto(calcUrl(key),{waitUntil:"domcontentloaded"});
  await page.waitForSelector("#area",{state:"attached",timeout:10000});
  const txt=((await page.locator("#area").first().textContent())||"").replace(",",".");
  const n=parseFloat(txt.replace(/[^0-9.\-]/g,""));
  return isNaN(n)?null:n;
}

(async()=>{
  const baseline=JSON.parse(fs.readFileSync(BASELINE,"utf8"));
  const keys=Object.keys(baseline);
  const browser=await launchBrowser();
  const page=await(await browser.newContext()).newPage();
  let ok=true;const current={};
  try{
    for(const k of keys){
      const a=await areaOf(page,k);
      current[k]=a;
      if(UPDATE)continue;
      const exp=baseline[k];
      const pass=(a!==null)&&Math.abs(a-exp)<=TOL;
      if(!pass){ok=false;out(`FAIL ${k}: эталон ${exp} → получено ${a}`);}
    }
  }catch(e){out("Ошибка теста:",e&&e.message);ok=false;}
  finally{await browser.close();}
  if(UPDATE){fs.writeFileSync(BASELINE,JSON.stringify(current,null,2));out("Эталон обновлён:",keys.length,"изделий");process.exit(0);}
  if(ok)out("Area tests OK:",keys.length,"изделий совпали с эталоном");
  else out("Area tests FAILED. Если формула менялась намеренно — обновите эталон: node scripts/test-areas.js --update");
  process.exit(ok?0:1);
})();
