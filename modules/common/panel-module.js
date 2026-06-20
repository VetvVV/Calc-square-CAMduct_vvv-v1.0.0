(function(){
  const params=new URLSearchParams(location.search);
  const lang=params.get("lang")||"ru";
  const roles=["guest","user","client","admin"];
  const role=roles.includes(params.get("role"))?params.get("role"):"guest";
  const moduleKey=params.get("module")||"rectangular-transition";
  const editIndex=params.has("edit")?Number(params.get("edit")):null;
  const guestUsageKey="calcSquareGuestUsageCleanV1";
  const guestDailyLimit=5;
  const guestLimitText={ru:"Гостевой лимит: 5 расчётов в сутки.",uk:"Гостьовий ліміт: 5 розрахунків на добу.",en:"Guest limit: 5 calculations per day."};
  const root=document.getElementById("app");
  const standardSizes=[80,100,125,150,160,180,200,225,250,280,300,315,350,355,400,450,500,560,600,630,700,710,800,900,1000,1120,1200,1250,1400,1500,1600,1800,2000,2500,3000];
  const i18n={
    ru:{atlas:"← Атлас",category:"Категория →",sizes:"Размеры",options:"Опции",detail:"Деталь",connectors:"Соединители",help:"Помощь",expand:"Развернуть всё",collapse:"Свернуть всё",simple:"Простой",full:"Полный",reset:"Сброс",hidden:"Скрыто",area:"Площадь",mass:"Масса изделия",desc:"Описание (спецификация)",calc:"Расчёт",comment:"Комментарий",commentPh:"Примечание для спецификации",add:"Добавить в проект",update:"Сохранить",guest:"Для гостя добавление в проект отключено.",material:"Материал",thickness:"Толщина",qty:"Количество",galv:"Оцинкованная сталь",ss430:"Нержавеющая 430 техническая",ss304:"Нержавеющая 304 пищевая",mm:"мм",kg:"кг",standard:"Стандарт ✓",custom:"Нестандарт ✎",formula:"По формуле",calcHidden:"Формульная часть скрыта в клиентском режиме. Инженерный доступ можно запросить у менеджера.",notReady:"Расчёт будет уточнён по CAMduct-таблице.",minus:"−",nom:"ном",plus:"+",connectionHelp:"− ниппельное, ном - номинальное, + муфтовое. У переходов соединение задаётся по торцам.",saved:"Добавлено.",top:"верх",bottom:"низ",left:"лево",right:"право",angle:"Угол",main:"магистраль",branch:"патрубок",avgDiameter:"Dср",inclinedLength:"Lнакл",avgPerimeter:"средний периметр"},
    uk:{atlas:"← Атлас",category:"Категорія →",sizes:"Розміри",options:"Опції",detail:"Деталь",connectors:"З'єднувачі",help:"Допомога",expand:"Розгорнути все",collapse:"Згорнути все",simple:"Простий",full:"Повний",reset:"Скидання",hidden:"Приховано",area:"Площа",mass:"Маса виробу",desc:"Опис (специфікація)",calc:"Розрахунок",comment:"Коментар",commentPh:"Примітка для специфікації",add:"Додати в проєкт",update:"Зберегти",guest:"Для гостя додавання в проєкт вимкнено.",material:"Матеріал",thickness:"Товщина",qty:"Кількість",galv:"Оцинкована сталь",ss430:"Нержавіюча 430 технічна",ss304:"Нержавіюча 304 харчова",mm:"мм",kg:"кг",standard:"Стандарт ✓",custom:"Нестандарт ✎",formula:"За формулою",calcHidden:"Формульну частину приховано в клієнтському режимі. Інженерний доступ можна запросити в менеджера.",notReady:"Розрахунок буде уточнено за CAMduct-таблицею.",minus:"−",nom:"ном",plus:"+",connectionHelp:"− ніпельне, ном - номінальне, + муфтове. У переходів з'єднання задається по торцях.",saved:"Додано.",top:"верх",bottom:"низ",left:"ліво",right:"право",angle:"Кут",main:"магістраль",branch:"патрубок",avgDiameter:"Dсер",inclinedLength:"Lпох",avgPerimeter:"середній периметр"},
    en:{atlas:"← Atlas",category:"Category →",sizes:"Dimensions",options:"Options",detail:"Detail",connectors:"Connectors",help:"Help",expand:"Expand all",collapse:"Collapse all",simple:"Simple",full:"Full",reset:"Reset",hidden:"Hidden",area:"Area",mass:"Product mass",desc:"Specification description",calc:"Calculation",comment:"Comment",commentPh:"Specification note",add:"Add to project",update:"Save",guest:"Project adding is disabled for guests.",material:"Material",thickness:"Thickness",qty:"Quantity",galv:"Galvanized steel",ss430:"Stainless 430 technical",ss304:"Stainless 304 food",mm:"mm",kg:"kg",standard:"Standard ✓",custom:"Custom ✎",formula:"Formula",calcHidden:"Formula details are hidden in client mode. Engineering access can be requested from a manager.",notReady:"Calculation will be refined from CAMduct table.",minus:"−",nom:"nom",plus:"+",connectionHelp:"− nipple, nom - nominal, + coupling. Transitions have connection settings per end.",saved:"Added.",top:"top",bottom:"bottom",left:"left","right":"right",angle:"Angle",main:"main",branch:"branch",avgDiameter:"average D",inclinedLength:"sloped L",avgPerimeter:"average perimeter"}
  };
  const t=i18n[lang]||i18n.ru;
  Object.assign(i18n.ru,{units:"Ед. измерения",unitMM:"мм",unitIN:"дюймы",ft2:"ft²",lb:"lb",conn1:"Соединение 1",conn2:"Соединение 2",lock:"Продольный замок (S1)",lockAm:"Американский",lockSize:"Размер замка",sheetSplit:"Панель не влезает на лист — разделить, русский замок",pdf:"Сохранить PDF"});
  Object.assign(i18n.uk,{units:"Од. виміру",unitMM:"мм",unitIN:"дюйми",ft2:"ft²",lb:"lb",conn1:"З'єднання 1",conn2:"З'єднання 2",lock:"Поздовжній замок (S1)",lockAm:"Американський",lockSize:"Розмір замка",sheetSplit:"Панель не влазить на лист — розділити, російський замок",pdf:"Зберегти PDF"});
  Object.assign(i18n.en,{units:"Units",unitMM:"mm",unitIN:"inch",ft2:"ft²",lb:"lb",conn1:"Connection 1",conn2:"Connection 2",lock:"Longitudinal lock (S1)",lockAm:"American",lockSize:"Lock size",sheetSplit:"Panel exceeds sheet — split, Russian lock",pdf:"Save PDF"});
  let UNIT="mm";const UF=()=>UNIT==="in"?25.4:1;
  const RAILMM=10;const RECT_CONN=["Ш20","Ш30","Ш20 Сам","Ш30 Сам","Рейка","ГК"];
  const canExportPdf=["client","admin"].includes(role);
  const materials=[
    {key:"galv",label:t.galv,density:7850,thickness:[0.5,0.7,0.9,1.0]},
    {key:"ss430",label:t.ss430,density:7850,thickness:[0.55,0.7,0.8,1.0]},
    {key:"ss304",label:t.ss304,density:8000,thickness:[0.55,0.7,0.8,1.0]}
  ];
  const modules={
    "round-duct":{category:"round",title:{ru:"Воздуховод круглый",uk:"Повітропровід круглий",en:"Round duct"},type:"formula",image:"../../assets/products/round_duct.svg",fields:[num("D","D",250),num("L","L",1000)],connections:["D"],formula:"roundDuct"},
    "round-elbow":{category:"round",title:{ru:"Отвод круглый",uk:"Відвід круглий",en:"Round elbow"},type:"formula",image:"../../assets/products/round_elbow.svg",fields:[num("D","D",250),select("Angle",{ru:"Угол",uk:"Кут",en:"Angle"},[15,30,45,60,90],90),num("R","R",250)],connections:["D"],formula:"roundElbow"},
    "round-transition":{category:"round",title:{ru:"Переход круглый",uk:"Перехід круглий",en:"Round transition"},type:"formula",image:"../../assets/products/round_transition.svg",fields:[num("D1","D1",315),num("D2","D2",250),num("L","L",300)],connections:["D1","D2"],formula:"roundTransition"},
    "round-offset-transition":{category:"round",title:{ru:"Переход круглый со смещением",uk:"Перехід круглий зі зміщенням",en:"Offset round transition"},type:"formula",image:"../../assets/products/round_offset.svg",fields:[num("D1","D1",315),num("D2","D2",250),num("L","L",300),num("Offset","Offset",100)],connections:["D1","D2"],formula:"roundTransition"},
    "round-tee":{category:"round",title:{ru:"Тройник круглый",uk:"Трійник круглий",en:"Round tee"},type:"formula",image:"../../assets/products/round_tee.svg",fields:[num("D","D",315),num("D1","D1",250),num("L","L",600),num("H","H",300)],connections:["D","D1"],formula:"roundTee"},
    "round-tee-custom":{category:"round",title:{ru:"Тройник нестандартный круглый",uk:"Трійник нестандартний круглий",en:"Custom round tee"},type:"formula",image:"../../modules/common/stub-preview.svg",fields:[num("D","D",315),num("D1","D1",250),num("D2","D2",200),num("L","L",600),num("Angle","Angle",90)],connections:["D","D1","D2"],formula:"stub"},
    "round-cap":{category:"round",title:{ru:"Заглушка круглая",uk:"Заглушка кругла",en:"Round cap"},type:"formula",image:"../../modules/round/cap/preview.svg",fields:[num("D","D",250)],connections:["D"],formula:"roundCap"},
    "round-inset":{category:"round",title:{ru:"Врезка круглая",uk:"Врізка кругла",en:"Round inset"},type:"formula",image:"../../modules/common/stub-preview.svg",fields:[num("D","D",250),num("H","H",120)],connections:["D"],formula:"roundInset"},
    "round-saddle":{category:"round",title:{ru:"Седло",uk:"Сідло",en:"Saddle"},type:"formula",image:"../../modules/round/saddle/preview.svg",fields:[num("D","D",315),num("D1","D1",200)],connections:["D1"],formula:"stub"},
    "round-nipple":{category:"round",title:{ru:"Ниппель круглый",uk:"Ніпель круглий",en:"Round nipple"},type:"formula",image:"../../modules/round/nipple/preview.svg",fields:[num("D","D",250),num("L","L",120)],connections:["D"],formula:"stub"},
    "round-silencer":{category:"round",title:{ru:"Шумоглушитель круглый",uk:"Шумоглушник круглий",en:"Round silencer"},type:"formula",image:"../../modules/round/silencer/preview.svg",fields:[num("D","D",250),num("L","L",900)],connections:["D"],formula:"stub"},
    "round-umbrella":{category:"round",title:{ru:"Зонт круглый",uk:"Зонт круглий",en:"Round umbrella"},type:"formula",image:"../../modules/round/umbrella/preview.svg",fields:[num("D","D",250),num("H","H",300)],connections:["D"],formula:"stub"},
    "round-damper":{category:"round",title:{ru:"Дроссель круглый",uk:"Дросель круглий",en:"Round damper"},type:"formula",image:"../../modules/round/damper/preview.svg",fields:[num("D","D",250),num("L","L",120)],connections:["D"],formula:"stub"},
    "round-flange":{category:"round",title:{ru:"Фланец круглый",uk:"Фланець круглий",en:"Round flange"},type:"formula",image:"../../modules/round/flange/preview.svg",fields:[num("D","D",250),num("B","B",30)],connections:["D"],formula:"stub"},
    "round-cross":{category:"round",title:{ru:"Крестовина круглая",uk:"Хрестовина кругла",en:"Round cross"},type:"formula",image:"../../modules/round/cross/preview.svg",fields:[num("D","D",315),num("D1","D1",250),num("D2","D2",250),num("L","L",600)],connections:["D","D1","D2"],formula:"stub"},
    "round-duck":{category:"round",title:{ru:"Утка круглая",uk:"Качка кругла",en:"Round offset duct"},type:"formula",image:"../../modules/round/duck/preview.svg",fields:[num("D","D",250),num("L","L",600),num("Offset","Offset",150)],connections:["D"],formula:"stub"},
    "round-check-valve":{category:"round",title:{ru:"Обратный клапан круглый",uk:"Зворотний клапан круглий",en:"Round check valve"},type:"formula",image:"../../modules/round/check-valve/preview.svg",fields:[num("D","D",250),num("L","L",180)],connections:["D"],formula:"stub"},
    "round-deflector":{category:"round",title:{ru:"Дефлектор",uk:"Дефлектор",en:"Deflector"},type:"formula",image:"../../modules/round/deflector/preview.svg",fields:[num("D","D",250),num("H","H",300)],connections:["D"],formula:"stub"},
    "round-coupling":{category:"round",title:{ru:"Муфта",uk:"Муфта",en:"Coupling"},type:"formula",image:"../../modules/round/coupling/preview.svg",fields:[num("D","D",250),num("L","L",120)],connections:["D"],formula:"stub"},
    "rectangular-duct":{category:"rectangular",title:{ru:"Воздуховод прямоугольный",uk:"Повітропровід прямокутний",en:"Rectangular duct"},type:"formula",image:"../../assets/products/rectangular_duct.svg",fields:[num("A","A",400),num("B","B",300),num("L","L",1000)],formula:"rectDuct"},
    "rectangular-elbow":{category:"rectangular",title:{ru:"Отвод прямоугольный",uk:"Відвід прямокутний",en:"Rectangular elbow"},type:"formula",image:"../../assets/products/rectangular_elbow.svg",fields:[num("A","A",400),num("B","B",300),select("Angle",{ru:"Угол",uk:"Кут",en:"Angle"},[15,30,45,60,90],90),num("R","R",300)],formula:"rectElbow"},
    "rectangular-elbow-transition":{category:"rectangular",title:{ru:"Колено прямоугольное переходное",uk:"Коліно прямокутне перехідне",en:"Rectangular transition elbow"},type:"formula",image:"../../modules/common/stub-preview.svg",fields:[num("A","A",400),num("B","B",300),num("C","C",300),num("D","D",200),select("Angle",{ru:"Угол",uk:"Кут",en:"Angle"},[15,30,45,60,90],90)],formula:"stub"},
    "rectangular-transition":{category:"rectangular",title:{ru:"Переход прямоугольный",uk:"Перехід прямокутний",en:"Rectangular transition"},type:"formula",image:"../../assets/products/rectangular_transition.svg",fields:[num("A","A",300),num("B","B",300),num("C","C",200),num("D","D",200),num("E","E",300),num("F","F",25),num("G","G",25),offset("H","H",["center","left","right"],"center"),offset("I","I",["center","top","bottom"],"center")],formula:"rectTransition"},
    "rectangular-tee":{category:"rectangular",title:{ru:"Тройник прямоугольный",uk:"Трійник прямокутний",en:"Rectangular tee"},type:"formula",image:"../../modules/common/stub-preview.svg",fields:[num("A","A",400),num("B","B",300),num("A1","A1",250),num("B1","B1",200),num("L","L",600),num("H","H",300)],formula:"rectTee"},
    "rectangular-cross":{category:"rectangular",title:{ru:"Крестовина прямоугольная",uk:"Хрестовина прямокутна",en:"Rectangular cross"},type:"formula",image:"../../modules/common/stub-preview.svg",fields:[num("A","A",400),num("B","B",300),num("A1","A1",250),num("B1","B1",200),num("A2","A2",250),num("B2","B2",200),num("L","L",600)],formula:"stub"},
    "rectangular-duck":{category:"rectangular",title:{ru:"Утка прямоугольная",uk:"Качка прямокутна",en:"Rectangular offset duct"},type:"formula",image:"../../modules/common/stub-preview.svg",fields:[num("A","A",400),num("B","B",300),num("L","L",600),num("Offset","Offset",150)],formula:"stub"},
    "rectangular-cap":{category:"rectangular",title:{ru:"Заглушка прямоугольная",uk:"Заглушка прямокутна",en:"Rectangular cap"},type:"formula",image:"../../assets/products/rectangular_cap.svg",fields:[num("A","A",400),num("B","B",300),num("F","F",30)],formula:"rectCap"},
    "rectangular-inset":{category:"rectangular",title:{ru:"Врезка прямоугольная",uk:"Врізка прямокутна",en:"Rectangular inset"},type:"formula",image:"../../modules/common/stub-preview.svg",fields:[num("A","A",250),num("B","B",200),num("H","H",120)],formula:"rectInset"},
    "rectangular-saddle":{category:"rectangular",title:{ru:"Врезка прямоугольная в плоскость",uk:"Врізка прямокутна в площину",en:"Rectangular saddle"},type:"formula",image:"../../modules/common/stub-preview.svg",fields:[num("A","A",250),num("B","B",200),num("H","H",120)],formula:"rectInset"},
    "rectangular-silencer":{category:"rectangular",title:{ru:"Шумоглушитель прямоугольный",uk:"Шумоглушник прямокутний",en:"Rectangular silencer"},type:"formula",image:"../../modules/common/stub-preview.svg",fields:[num("A","A",400),num("B","B",300),num("L","L",900)],formula:"stub"},
    "rectangular-umbrella":{category:"rectangular",title:{ru:"Зонт прямоугольный",uk:"Зонт прямокутний",en:"Rectangular umbrella"},type:"formula",image:"../../modules/common/stub-preview.svg",fields:[num("A","A",400),num("B","B",300),num("H","H",350)],formula:"stub"},
    "rectangular-damper":{category:"rectangular",title:{ru:"Дроссель прямой",uk:"Дросель прямий",en:"Rectangular damper"},type:"formula",image:"../../modules/common/stub-preview.svg",fields:[num("A","A",400),num("B","B",300),num("L","L",120)],formula:"stub"},
    "round-to-rectangular":{category:"combined",title:{ru:"Переход круг-прямоугольник",uk:"Перехід круг-прямокутник",en:"Round to rectangular"},type:"formula",image:"../../assets/products/round_to_rectangular.svg",fields:[num("D","D",250),num("A","A",400),num("B","B",300),num("L","L",400)],connections:["D"],formula:"roundRect"},
    "combined-seat-rect":{category:"combined",title:{ru:"Седло с прямоугольной врезкой",uk:"Сідло з прямокутною врізкою",en:"Saddle with rectangular inset"},type:"formula",image:"../../modules/common/stub-preview.svg",fields:[num("D","D",315),num("A","A",250),num("B","B",200),num("H","H",120)],connections:["D"],formula:"stub"},
    "tee-round-rect":{category:"combined",title:{ru:"Тройник круг-прямоугольник",uk:"Трійник круг-прямокутник",en:"Round-rect tee"},type:"formula",image:"../../modules/common/stub-preview.svg",fields:[num("D","D",315),num("A","A",300),num("B","B",250),num("L","L",600)],connections:["D"],formula:"stub"},
    "rect-tee-round":{category:"combined",title:{ru:"Тройник прямоугольник-круг",uk:"Трійник прямокутник-круг",en:"Rect-round tee"},type:"formula",image:"../../modules/common/stub-preview.svg",fields:[num("A","A",400),num("B","B",300),num("D","D",250),num("L","L",600)],connections:["D"],formula:"stub"},
    "round-adapter":{category:"combined",title:{ru:"Адаптер круглый",uk:"Адаптер круглий",en:"Round adapter"},type:"formula",image:"../../modules/common/stub-preview.svg",fields:[num("D","D",250),num("L","L",300)],connections:["D"],formula:"stub"},
    "rectangular-adapter":{category:"combined",title:{ru:"Адаптер прямоугольный",uk:"Адаптер прямокутний",en:"Rectangular adapter"},type:"formula",image:"../../modules/common/stub-preview.svg",fields:[num("A","A",400),num("B","B",300),num("L","L",300)],formula:"stub"},
    "grease-trap":{category:"combined",title:{ru:"Жироуловитель",uk:"Жировловлювач",en:"Grease trap"},type:"formula",image:"../../modules/common/stub-preview.svg",fields:[num("A","A",400),num("B","B",300),num("L","L",500)],formula:"stub"}
  };
  function num(key,label,def){return{key,label,type:"number",default:def}}
  function select(key,label,options,def){return{key,label,type:"select",options,default:def}}
  function offset(key,label,options,def){return{key,label,type:"offset",options,default:def}}
  const cfg=modules[moduleKey]||modules["rectangular-transition"];
  let state={};
  let result={area:0,mass:0,description:""};
  const canAddProject=["user","client","admin"].includes(role);
  const canUpdateProject=["client","admin"].includes(role);
  const canViewFormulas=role!=="client";
  function localDateKey(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
  function readGuestUsage(){try{const data=JSON.parse(localStorage.getItem(guestUsageKey)||"{}");return data.date===localDateKey()?data:{date:localDateKey(),count:0}}catch(e){return{date:localDateKey(),count:0}}}
  function moduleAllowed(){
    if(role!=="guest")return true;
    return readGuestUsage().count<=guestDailyLimit;
  }
  function pick(value){return value?.[lang]||value?.ru||value?.en||""}
  function nf(value,d=3){return Number(value||0).toFixed(d)}
  function value(key){return Number(state[key]||0)}
  function moduleUrl(category){return "../../assets/atlas/atlas.html"+(category?"?cat="+encodeURIComponent(category):"")}
  function render(){
    if(!moduleAllowed()){
      root.innerHTML=`<main class="module-card"><nav class="module-nav"><button type="button" id="toAtlas">${t.atlas}</button></nav><h1>${guestLimitText[lang]||guestLimitText.ru}</h1></main>`;
      document.getElementById("toAtlas").addEventListener("click",()=>sendOpen(moduleUrl("")));
      return;
    }
    document.documentElement.lang=lang;
    document.title=pick(cfg.title);
    root.innerHTML=`
      <main class="module-card">
        <nav class="module-nav"><button type="button" id="toAtlas">${t.atlas}</button><button type="button" id="toCategory">${categoryName(cfg.category)}</button></nav>
        <div class="title-row"><h1>${pick(cfg.title)}</h1><span class="badge" id="modeBadge">${cfg.type==="table"?t.standard:(canViewFormulas?t.formula:t.calc)}</span></div>
        <div class="layout">
          <div class="left-col">
            <section class="preview-panel" id="previewBox">${previewHtml()}<span class="live-label lbl-a" id="lblA"></span><span class="live-label lbl-b" id="lblB"></span><span class="live-label lbl-c" id="lblC"></span></section>
            <section class="result-panel">
              <div class="result-row">${t.area}<b id="area">0.000 м²</b></div>
              <div class="result-row">${t.mass}<b id="mass">0.00 ${t.kg}</b></div>
              <div class="result-row">${t.desc}<b id="descLine">-</b><small id="statusLine"></small></div>
              ${canViewFormulas?`<details class="calc-details" open><summary>${t.calc}</summary><p id="calcNote"></p></details>`:""}
              <div class="comment-label">${t.comment}</div><textarea id="comment" placeholder="${t.commentPh}"></textarea>
              ${(editIndex!==null?canUpdateProject:canAddProject)?`<button class="add-btn" type="button" id="addBtn">${editIndex!==null?t.update:t.add}</button>`:""}${canExportPdf?`<button class="add-btn" type="button" id="pdfBtn" style="background:#fff;color:#b86510;border:1px solid #c9743b">${t.pdf}</button>`:""}${!canAddProject&&role==="guest"&&editIndex===null?`<div class="guest-note">${t.guest}</div>`:""}
            </section>
          </div>
          <section class="form-panel">
            <div class="panel-controls"><button class="ico" data-act="expand" title="${t.expand}" type="button">⊞</button><button class="ico" data-act="collapse" title="${t.collapse}" type="button">⊟</button><span class="seg"><button type="button" data-preset="simple">${t.simple}</button><button type="button" data-preset="full">${t.full}</button></span><button class="ico reset" data-act="reset" title="${t.reset}" type="button">↺</button></div>
            <div class="panels" id="panels">${panel("sizes",t.sizes,unitRowHtml()+fieldsHtml(cfg.fields)+qtyHtml(),false)}${panel("options",t.options,optionsHtml(),true)}${panel("detail",t.detail,detailHtml(),false)}${panel("connectors",t.connectors,connectorsHtml(),true)}${panel("help",t.help,helpHtml(),true)}</div>
            <div class="hidden-bar" id="hiddenBar" hidden></div>
          </section>
        </div>
      </main>`;
    bind();
    initPanels();
    update();
  }
  function categoryName(key){const map={round:{ru:"Круглые →",uk:"Круглі →",en:"Round →"},rectangular:{ru:"Прямоугольные →",uk:"Прямокутні →",en:"Rectangular →"},combined:{ru:"Комбинированные →",uk:"Комбіновані →",en:"Combined →"}};return pick(map[key])}
  function previewHtml(){return cfg.image?`<img src="${cfg.image}" alt="">`:`<svg class="preview-svg" viewBox="0 0 400 250"><rect x="80" y="70" width="240" height="110" fill="#e5e7eb" stroke="#555" stroke-width="2"/></svg>`}
  function panel(id,title,body,collapsed){return`<div class="panel ${collapsed?"collapsed":""}" id="panel-${id}"><div class="panel-head" draggable="true"><span class="drag">⠿</span><span class="caret">▼</span><span class="title">${title}</span><button class="hide" type="button">✕</button></div><div class="panel-body">${body}</div></div>`}
  function fieldLabel(field){return typeof field.label==="object"?pick(field.label):field.label}
  function fieldsHtml(fields){return fields.map(field=>`<div class="field"><label for="f-${field.key}">${fieldLabel(field)}</label>${field.type==="select"?selectHtml(field):field.type==="offset"?offsetHtml(field):numberHtml(field)}</div>`).join("")}
  function numberHtml(field){return`<input id="f-${field.key}" data-key="${field.key}" type="number" inputmode="decimal" step="1" min="0" value="${field.default}" list="dl-${field.key}"><datalist id="dl-${field.key}">${standardSizes.map(v=>`<option value="${v}"></option>`).join("")}</datalist>`}
  function selectHtml(field){return`<select id="f-${field.key}" data-key="${field.key}">${field.options.map(v=>`<option value="${v}" ${v===field.default?"selected":""}>${optionText(v)}</option>`).join("")}</select>`}
  function offsetOptions(field){return ["value",...field.options].filter((value,index,array)=>array.indexOf(value)===index)}
  function offsetHtml(field){const options=offsetOptions(field);return`<div class="offset-combo" data-offset-combo="${field.key}"><input id="f-${field.key}" data-key="${field.key}" data-offset-options="${options.join(",")}" type="text" inputmode="decimal" value="${optionText(field.default)}" placeholder="${optionText("value")}"><button class="offset-toggle" type="button" aria-label="${optionText("value")}">▼</button><div class="offset-menu" hidden>${options.map(v=>`<button type="button" data-offset-value="${v}">${optionText(v)}</button>`).join("")}</div></div>`}
  function optionText(value){const map={center:{ru:"Центральный",uk:"Центральний",en:"Centered"},left:{ru:"Левая плоскость",uk:"Ліва площина",en:"Left plane"},right:{ru:"Правая плоскость",uk:"Права площина",en:"Right plane"},top:{ru:"Верхняя плоскость",uk:"Верхня площина",en:"Top plane"},bottom:{ru:"Нижняя плоскость",uk:"Нижня площина",en:"Bottom plane"},value:{ru:"Значение",uk:"Значення",en:"Value"}};return pick(map[value])||value}
  function offsetCode(value){
    const raw=String(value??"").trim();
    const normalized=raw.toLowerCase();
    const codes=["center","left","right","top","bottom"];
    const direct=codes.find(code=>normalized===code);
    if(direct)return direct;
    const localized=codes.find(code=>normalized===optionText(code).toLowerCase());
    if(localized)return localized;
    const numeric=Number(raw.replace(",","."));
    return Number.isFinite(numeric)?numeric:"center";
  }
  function offsetDisplay(value){
    const code=offsetCode(value);
    return typeof code==="number"?String(code):optionText(code);
  }
  function qtyHtml(){return`<div class="field"><label for="f-Q">${t.qty}</label><input id="f-Q" data-key="Q" type="number" min="1" step="1" value="1"></div>`}
  function optionsHtml(){return cfg.type==="table"?`<p class="tab-empty">${t.notReady}</p>`:(canViewFormulas?`<p class="tab-empty">${t.formula}</p>`:`<p class="tab-empty">${t.calcHidden}</p>`)}
  function detailHtml(){return`<div class="field"><label for="material">${t.material}</label><select id="material">${materials.map(m=>`<option value="${m.key}">${m.label}</option>`).join("")}</select></div><div class="field"><label for="thickness">${t.thickness}</label><select id="thickness"></select></div>`}
  function connectorsHtml(){
    if(cfg.category==="rectangular"){
      const opts=RECT_CONN.map((c,i)=>`<option${i===0?" selected":""}>${c}</option>`).join("");
      return`<div class="field"><label>${t.conn1}</label><select id="conn1">${opts}</select></div>`+
             `<div class="field"><label>${t.conn2}</label><select id="conn2">${opts}</select></div>`+
             `<div class="field"><label>${t.lock}</label><input id="lockVal" readonly value="${t.lockAm}" style="background:#ece4cf;color:#888;font-style:italic"></div>`+
             `<div class="field"><label>${t.lockSize}</label><input id="lockSizeVal" readonly style="background:#ece4cf;color:#888;font-style:italic"></div>`+
             `<p class="help-text" id="sheetWarn" style="color:#a85b08;font-weight:600;display:none"></p>`;
    }
    if(!cfg.connections?.length)return`<p class="tab-empty">${t.connectionHelp}</p>`;
    return`<div class="connection-grid">${cfg.connections.map(key=>`<div class="connection-row" data-conn="${key}"><span>${key}</span><label><input type="checkbox" data-conn-kind="minus" checked>${t.minus}</label><label><input type="checkbox" data-conn-kind="nom">${t.nom}</label><label><input type="checkbox" data-conn-kind="plus">${t.plus}</label></div>`).join("")}</div>`;
  }
  function unitRowHtml(){return`<div class="field"><label for="units">${t.units}</label><select id="units"><option value="mm">${t.unitMM}</option><option value="in">${t.unitIN}</option></select></div>`}
  function setUnit(u){const from=UF();UNIT=u;const to=UF();document.querySelectorAll("[data-key]").forEach(el=>{const k=el.dataset.key;if(k==="Q")return;if(el.type==="number"){const val=parseFloat(el.value);if(!isNaN(val)){el.value=(u==="in")?(+(val*from/to).toFixed(2)):Math.round(val*from/to);state[k]=el.value;}}else if(el.type==="text"){const c=offsetCode(el.value);if(typeof c==="number"){const nv=(u==="in")?(+(c*from/to).toFixed(2)):Math.round(c*from/to);el.value=offsetDisplay(nv);state[k]=el.value;}}});update();}
  function setRail(connId,fieldKey){const sl=document.getElementById(connId),f=document.getElementById("f-"+fieldKey);if(!sl||!f)return;if(sl.value==="Рейка"){if(!f.readOnly)f.dataset.prev=f.value;f.value=0;f.readOnly=true;f.style.opacity=.6;}else if(f.readOnly){f.value=f.dataset.prev||25;f.readOnly=false;f.style.opacity=1;}state[f.dataset.key]=f.value;}
  function toMM(values){const v={...values};cfg.fields.filter(f=>f.type==="number").forEach(f=>{if(typeof v[f.key]==="number")v[f.key]=v[f.key]*UF();});cfg.fields.filter(f=>f.type==="offset").forEach(f=>{if(typeof v[f.key]==="number")v[f.key]=v[f.key]*UF();});return v;}
  let robotoLoaded=false;
  function ensureFont(doc,cb){if(robotoLoaded){doc.setFont("Roboto","normal");cb();return;}fetch("https://cdn.jsdelivr.net/npm/@fontsource/roboto@5.0.8/files/roboto-cyrillic-400-normal.woff").then(r=>r.arrayBuffer()).then(buf=>{const b=new Uint8Array(buf);let bin="";for(let i=0;i<b.length;i++)bin+=String.fromCharCode(b[i]);doc.addFileToVFS("Roboto.ttf",btoa(bin));doc.addFont("Roboto.ttf","Roboto","normal");doc.setFont("Roboto","normal");robotoLoaded=true;cb();}).catch(()=>{doc.setFont("helvetica","normal");cb();});}
  function exportPdf(){const J=(window.jspdf&&window.jspdf.jsPDF)||window.jsPDF;if(!J){alert("PDF library not loaded");return;}const v=currentValues();const doc=new J({orientation:"portrait",unit:"mm",format:"a4"});ensureFont(doc,()=>{const now=new Date(),x=20;let y=24;doc.setFontSize(18);doc.text("Calc Square",x,y);doc.setFontSize(11);doc.text("ST Spetsmontazh",x,y+6);y+=20;doc.setFontSize(15);doc.text(pick(cfg.title),x,y);y+=4;doc.setDrawColor(200);doc.line(x,y,190,y);y+=12;doc.setFontSize(12);const mat=materials.find(m=>m.key===v.material)?.label||"";const rows=[[t.desc,result.description||""],[t.material,mat],[t.thickness,String(v.thickness)],[t.qty,String(v.quantity)],[t.area,nf(result.area)+" м²"],[t.mass,nf(result.mass,2)+" "+t.kg]];rows.forEach(r=>{doc.setTextColor(120);doc.text(r[0]+":",x,y);doc.setTextColor(20);doc.text(String(r[1]||"-"),x+55,y);y+=9;});doc.save("CalcSquare_"+moduleKey+"_"+now.getTime()+".pdf");});}
  function helpHtml(){return`<p class="help-text">${t.connectionHelp}</p>`}
  function bind(){
    document.getElementById("toAtlas").addEventListener("click",()=>sendOpen(moduleUrl("")));
    document.getElementById("toCategory").addEventListener("click",()=>sendOpen(moduleUrl(cfg.category)));
    document.querySelectorAll("[data-key]").forEach(el=>{
      if(params.has(el.dataset.key))el.value=params.get(el.dataset.key);
      if(el.dataset.key==="H"&&el.value==="value"&&params.has("Hv"))el.value=params.get("Hv");
      if(el.dataset.key==="I"&&el.value==="value"&&params.has("Iv"))el.value=params.get("Iv");
      if(el.type==="text")el.value=offsetDisplay(el.value);
      state[el.dataset.key]=el.value;
      if(el.tagName==="INPUT")el.addEventListener("focus",()=>setTimeout(()=>el.select(),0));
      if(el.dataset.offsetOptions){
        el.addEventListener("pointerdown",()=>{el.dataset.selectAllOnInput="1"});
        el.addEventListener("keydown",(event)=>{
          if(el.dataset.selectAllOnInput==="1"&&event.key.length===1&&!event.ctrlKey&&!event.metaKey&&!event.altKey){
            el.value="";
            delete el.dataset.selectAllOnInput;
          }
        });
        el.addEventListener("blur",()=>{delete el.dataset.selectAllOnInput;setTimeout(()=>{el.value=offsetDisplay(el.value);state[el.dataset.key]=el.value;update()},120)});
      }
      el.addEventListener("input",()=>{state[el.dataset.key]=el.value;update()});
      el.addEventListener("change",()=>{state[el.dataset.key]=el.value;update()});
    });
    document.querySelectorAll(".offset-combo").forEach(combo=>{
      const input=combo.querySelector("[data-key]");
      const menu=combo.querySelector(".offset-menu");
      combo.querySelector(".offset-toggle").addEventListener("click",(event)=>{
        event.preventDefault();
        document.querySelectorAll(".offset-menu").forEach(other=>{if(other!==menu)other.hidden=true});
        menu.hidden=!menu.hidden;
        input.focus();
        input.select();
      });
      menu.addEventListener("pointerdown",(event)=>event.preventDefault());
      menu.addEventListener("click",(event)=>{
        const button=event.target.closest("[data-offset-value]");
        if(!button)return;
        if(button.dataset.offsetValue==="value"){
          input.value="";
          input.focus();
        }else{
          input.value=optionText(button.dataset.offsetValue);
        }
        state[input.dataset.key]=input.value;
        menu.hidden=true;
        update();
        input.focus();
        input.select();
      });
    });
    document.addEventListener("pointerdown",(event)=>{
      if(!event.target.closest(".offset-combo"))document.querySelectorAll(".offset-menu").forEach(menu=>menu.hidden=true);
    });
    const material=document.getElementById("material");
    if(params.has("material")&&[...material.options].some(option=>option.value===params.get("material")))material.value=params.get("material");
    material.addEventListener("change",()=>{renderThicknessOptions();update()});
    renderThicknessOptions();
    const thickness=document.getElementById("thickness");
    if(params.has("thickness")&&[...thickness.options].some(option=>option.value===params.get("thickness")))thickness.value=params.get("thickness");
    document.getElementById("thickness").addEventListener("change",update);
    document.querySelectorAll("[data-conn-kind]").forEach(input=>input.addEventListener("change",event=>{
      const row=event.target.closest(".connection-row");
      if(event.target.dataset.connKind==="nom"&&event.target.checked){row.querySelectorAll("[data-conn-kind]").forEach(i=>{if(i!==event.target)i.checked=false})}
      if((event.target.dataset.connKind==="minus"||event.target.dataset.connKind==="plus")&&event.target.checked){row.querySelector('[data-conn-kind="nom"]').checked=false}
      if(!row.querySelector("[data-conn-kind]:checked"))row.querySelector('[data-conn-kind="minus"]').checked=true;
      update();
    }));
    const comment=document.getElementById("comment");
    if(params.has("comment"))comment.value=params.get("comment");
    comment.addEventListener("input",update);
    document.getElementById("addBtn")?.addEventListener("click",addToProject);
    document.getElementById("pdfBtn")?.addEventListener("click",exportPdf);
    const unitsSel=document.getElementById("units");if(unitsSel)unitsSel.addEventListener("change",()=>setUnit(unitsSel.value));
    const c1=document.getElementById("conn1"),c2=document.getElementById("conn2");
    if(c1)c1.addEventListener("change",()=>{setRail("conn1","F");update();});
    if(c2)c2.addEventListener("change",()=>{setRail("conn2","G");update();});
  }
  function renderThicknessOptions(){
    const material=materials.find(m=>m.key===document.getElementById("material").value)||materials[0];
    const tnode=document.getElementById("thickness");
    const prev=tnode.value;
    tnode.innerHTML=material.thickness.map(v=>`<option value="${v}">${v}</option>`).join("");
    if([...tnode.options].some(o=>o.value===prev))tnode.value=prev;
  }
  function currentValues(){
    const values={};
    document.querySelectorAll("[data-key]").forEach(el=>values[el.dataset.key]=el.type==="number"?Number(el.value||0):el.type==="text"?offsetCode(el.value):el.value);
    values.material=document.getElementById("material").value;
    values.thickness=Number(document.getElementById("thickness").value||0.5);
    values.quantity=Math.max(1,Math.round(Number(values.Q||1)));
    values.conn1=document.getElementById("conn1")?.value||"";
    values.conn2=document.getElementById("conn2")?.value||"";
    return values;
  }
  function update(){
    const values=currentValues();
    result=calculate(toMM(values));
    const material=materials.find(m=>m.key===values.material)||materials[0];
    result.mass=result.area*values.thickness*material.density/1000;
    result.description=description(values);
    const inch=UNIT==="in";
    const aDisp=inch?result.area*10.7639:result.area,aU=inch?(" "+t.ft2):" м²";
    const mDisp=inch?result.mass*2.20462:result.mass,mU=inch?(" "+t.lb):(" "+t.kg);
    document.getElementById("area").textContent=nf(aDisp)+aU;
    document.getElementById("mass").textContent=nf(mDisp,2)+mU;
    document.getElementById("descLine").textContent=result.description;
    document.getElementById("statusLine").textContent=result.status||"";
    const calcNote=document.getElementById("calcNote");
    if(calcNote)calcNote.textContent=result.note||"";
    document.getElementById("modeBadge").textContent=canViewFormulas?(result.badge||document.getElementById("modeBadge").textContent):(cfg.type==="table"?result.badge:t.calc);
    if(cfg.category==="rectangular"){const ls=document.getElementById("lockSizeVal");if(ls)ls.value=(values.thickness>=0.9?"5/28":"6/30");const sw=document.getElementById("sheetWarn");if(sw){if(result.sheetWarn){sw.style.display="block";sw.textContent="⚠ "+result.sheetWarn;}else sw.style.display="none";}}
    const box=document.getElementById("previewBox");
    const pv=window.CalcSquarePreview?window.CalcSquarePreview(moduleKey,values):null;
    if(pv&&box){box.innerHTML=pv;}else{updateLabels(values);}
  }
  function calculate(v){
    const q=v.quantity||1;
    let area=0,note="",sheetWarn="";
    switch(cfg.formula){
      case"roundDuct":area=Math.PI*v.D*v.L*q/1e6;note=`S = π × D × L × Q`;break;
      case"roundElbow":{const arc=Math.PI*v.R*v.Angle/180;area=Math.PI*v.D*arc*q/1e6;note=`S = π × D × arc × Q`;break}
      case"roundTransition":area=Math.PI*((v.D1+v.D2)/2)*Math.sqrt((v.L||0)**2+(v.Offset||0)**2)*q/1e6;note=`S = π × ${t.avgDiameter} × ${t.inclinedLength} × Q`;break;
      case"roundTee":area=(Math.PI*v.D*v.L+Math.PI*v.D1*v.H)*q/1e6;note=`S = ${t.main} + ${t.branch}`;break;
      case"roundCap":area=Math.PI*v.D*v.D/4*q/1e6;note=`S = π × D² / 4 × Q`;break;
      case"roundInset":area=(Math.PI*v.D+8)*v.H*q/1e6;note=`P = πD + 8`;break;
      case"rectDuct":area=2*(v.A+v.B)*v.L*q/1e6;note=`S = 2 × (A+B) × L × Q`;break;
      case"rectElbow":{const arc=Math.PI*v.R*v.Angle/180;area=2*(v.A+v.B)*arc*q/1e6;note=`S = 2 × (A+B) × arc × Q`;break}
      case"rectTransition":{const r=rectTransition(v);area=r.area*q;note=r.note;sheetWarn=r.sheetWarn;break}
      case"rectTee":area=(2*(v.A+v.B)*v.L+2*(v.A1+v.B1)*v.H)*q/1e6;note=`S = ${t.main} + ${t.branch}`;break;
      case"rectCap":area=(v.A*v.B+2*v.F*(v.A+v.B))*q/1e6;note=`S = A×B + 2F(A+B)`;break;
      case"rectInset":area=2*(v.A+v.B)*v.H*q/1e6;note=`S = 2 × (A+B) × H × Q`;break;
      case"roundRect":area=((Math.PI*v.D+2*(v.A+v.B))/2)*v.L*q/1e6;note=`S = ${t.avgPerimeter} × L`;break;
      default:area=0;note=t.notReady;
    }
    return{area,description:"",note,sheetWarn,badge:cfg.type==="table"?tableBadge(v):t.formula,status:cfg.type==="table"?tableStatus(v):""};
  }
  function rectTransition(v){
    const railF=v.conn1==="Рейка",railG=v.conn2==="Рейка";
    const F=railF?0:(v.F||0),G=railG?0:(v.G||0);
    const Fa=F+(railF?RAILMM:0),Ga=G+(railG?RAILMM:0);
    const L=Math.max(0,v.E-F-G);
    const dAh=(v.A-v.C)/2,dBh=(v.B-v.D)/2;
    const centerH=typeof v.H==="number"?v.H:v.H==="right"?-dAh:v.H==="left"?dAh:0;
    const centerI=typeof v.I==="number"?v.I:v.I==="top"?dBh:v.I==="bottom"?-dBh:0;
    const oT=centerI-dBh,oB=centerI+dBh,oL=centerH-dAh,oR=centerH+dAh;
    const Xt=Math.sqrt(L*L+oT*oT),Xb=Math.sqrt(L*L+oB*oB),Xl=Math.sqrt(L*L+oL*oL),Xr=Math.sqrt(L*L+oR*oR);
    const Aavg=(v.A+v.C)/2,Bavg=(v.B+v.D)/2;
    const St=Xt*Aavg+Fa*v.A+Ga*v.C,Sb=Xb*Aavg+Fa*v.A+Ga*v.C,Sl=Xl*Bavg+Fa*v.B+Ga*v.D,Sr=Xr*Bavg+Fa*v.B+Ga*v.D;
    const oversize=(Math.max(Xt,Xb)>1240)||(Math.max(Xl,Xr)>1240)||(Aavg>1240)||(Bavg>1240);
    const ruSize=(v.thickness>=0.9)?"14/14":"12/12";
    return{area:(St+Sb+Sl+Sr)/1e6,sheetWarn:oversize?`${t.sheetSplit} (${ruSize})`:"",note:`CAMduct: ${t.top} ${nf(St/1e6)}, ${t.bottom} ${nf(Sb/1e6)}, ${t.left} ${nf(Sl/1e6)}, ${t.right} ${nf(Sr/1e6)}; Lcalc=${nf(L,0)} ${t.mm}`};
  }
  function tableBadge(v){return isStandard(v)?t.standard:t.custom}
  function tableStatus(v){return isStandard(v)?"":t.notReady}
  function isStandard(v){return cfg.fields.filter(f=>f.type==="number").every(f=>standardSizes.includes(Number(v[f.key])))}
  function description(v,{includeComment=true}={}){
    const dims=specDimensionParts(v).join(" × ");
    const conn=connectionDescription();
    const comment=includeComment?document.getElementById("comment")?.value.trim():"";
    return [dims+" "+t.mm,conn,comment].filter(Boolean).join(" · ");
  }
  function specDimensionParts(v){
    if(moduleKey==="rectangular-transition"){
      const parts=["A","B","C","D","E","F","G"].map(key=>`${key} ${v[key]}`);
      parts.push(`H ${typeof v.H==="number"?v.H:optionText(v.H)}`);
      parts.push(`I ${typeof v.I==="number"?v.I:optionText(v.I)}`);
      return parts;
    }
    return cfg.fields.filter(f=>["number","select"].includes(f.type)).map(f=>`${f.key} ${v[f.key]}`);
  }
  function specDimensions(v){
    if(moduleKey!=="rectangular-transition"){
      const dimensions={};
      cfg.fields.forEach((field)=>{dimensions[field.key]=v[field.key]});
      return dimensions;
    }
    return {
      A:v.A,B:v.B,C:v.C,D:v.D,E:v.E,F:v.F,G:v.G,
      H:v.H,
      I:v.I
    };
  }
  function rawDimensions(v){
    const dimensions={};
    cfg.fields.forEach((field)=>{dimensions[field.key]=v[field.key]});
    return dimensions;
  }
  function connectionDescription(){
    const rows=[...document.querySelectorAll(".connection-row")];
    return rows.map(row=>{
      const name=row.dataset.conn;
      const kinds=[...row.querySelectorAll("[data-conn-kind]:checked")].map(i=>i.dataset.connKind);
      if(kinds.includes("nom"))return `${name} ном`;
      if(kinds.includes("minus")&&kinds.includes("plus"))return `${name} ${t.minus}/${t.plus}`;
      if(kinds.includes("plus"))return `${name} ${t.plus}`;
      return `${name} ${t.minus}`;
    }).join(", ");
  }
  function updateLabels(v){
    const keys=cfg.fields.slice(0,3).map(f=>f.key);
    document.getElementById("lblA").textContent=keys[0]?`${keys[0]} = ${v[keys[0]]}`:"";
    document.getElementById("lblB").textContent=keys[1]?`${keys[1]} = ${v[keys[1]]}`:"";
    document.getElementById("lblC").textContent=keys[2]?`${keys[2]} = ${v[keys[2]]}`:"";
  }
  function addToProject(){
    if(editIndex!==null&&!canUpdateProject)return;
    if(editIndex===null&&!canAddProject)return;
    const v=currentValues();
    const comment=document.getElementById("comment")?.value.trim()||"";
    const item={
      name:pick(cfg.title),
      productType:moduleKey,
      dimensions:specDimensions(v),
      rawDimensions:rawDimensions(v),
      description:description({...v,Q:undefined},{includeComment:false}),
      comment,
      quantity:v.quantity,
      material:materials.find(m=>m.key===v.material)?.label||"",
      materialKey:v.material,
      thickness:v.thickness,
      area:result.area,
      mass:result.mass,
      connectors:cfg.category==="rectangular"?{conn1:v.conn1,conn2:v.conn2,lock:(v.thickness>=0.9?"5/28":"6/30")}:undefined
    };
    const message=editIndex!==null?{type:"calcSquare:updateProjectItem",index:editIndex,item}:{type:"calcSquare:addProjectItem",item};
    window.parent?.postMessage(message,parentTargetOrigin());
  }
  function parentTargetOrigin(){return location.protocol==="file:"||location.origin==="null"?"*":location.origin}
  function sendOpen(url){
    const absolute=new URL(url,location.href).href;
    window.parent&&window.parent!==window?window.parent.postMessage({type:"calcSquare:open",url:absolute},parentTargetOrigin()):location.href=absolute;
  }
  function initPanels(){
    const panels=document.getElementById("panels"),hiddenBar=document.getElementById("hiddenBar"),controls=document.querySelector(".panel-controls");
    const key=`calcSquarePanels:${moduleKey}`;
    const defaults={order:["panel-sizes","panel-options","panel-detail","panel-connectors","panel-help"],collapsed:["panel-options","panel-connectors","panel-help"],hidden:[]};
    function read(){try{return JSON.parse(localStorage.getItem(key)||"null")||defaults}catch(e){return defaults}}
    function write(){localStorage.setItem(key,JSON.stringify({order:[...panels.children].map(p=>p.id),collapsed:[...panels.children].filter(p=>p.classList.contains("collapsed")).map(p=>p.id),hidden:[...panels.children].filter(p=>p.hidden).map(p=>p.id)}))}
    function apply(s){(s.order||defaults.order).forEach(id=>{const p=document.getElementById(id);if(p)panels.appendChild(p)});[...panels.children].forEach(p=>{p.classList.toggle("collapsed",(s.collapsed||[]).includes(p.id));p.hidden=(s.hidden||[]).includes(p.id)});hidden()}
    function hidden(){const items=[...panels.children].filter(p=>p.hidden);hiddenBar.innerHTML=`<span>${t.hidden}:</span>`;items.forEach(p=>{const b=document.createElement("button");b.type="button";b.className="chip";b.dataset.id=p.id;b.textContent=p.querySelector(".title").textContent;hiddenBar.appendChild(b)});hiddenBar.hidden=!items.length}
    panels.addEventListener("click",e=>{if(e.target.closest(".hide")||e.target.closest(".drag"))return;const h=e.target.closest(".panel-head");if(h){h.parentElement.classList.toggle("collapsed");write()}});
    panels.addEventListener("click",e=>{const b=e.target.closest(".hide");if(!b)return;e.stopPropagation();b.closest(".panel").hidden=true;hidden();write()});
    hiddenBar.addEventListener("click",e=>{const b=e.target.closest(".chip");if(!b)return;document.getElementById(b.dataset.id).hidden=false;hidden();write()});
    controls.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;const a=b.dataset.act,preset=b.dataset.preset;if(a==="expand")[...panels.children].forEach(p=>p.classList.remove("collapsed"));if(a==="collapse")[...panels.children].forEach(p=>p.classList.add("collapsed"));if(a==="reset"){localStorage.removeItem(key);apply(defaults);return}if(preset==="simple"){[...panels.children].forEach(p=>{p.hidden=["panel-options","panel-connectors","panel-help"].includes(p.id);p.classList.remove("collapsed")})}if(preset==="full"){[...panels.children].forEach(p=>{p.hidden=false;p.classList.remove("collapsed")})}controls.querySelectorAll("[data-preset]").forEach(x=>x.classList.toggle("active",x===b));hidden();write()});
    let dragged=null;function clear(){panels.querySelectorAll(".drag-over").forEach(p=>p.classList.remove("drag-over"))}
    panels.addEventListener("dragstart",e=>{const h=e.target.closest(".panel-head");if(!h)return;dragged=h.parentElement;dragged.classList.add("dragging");e.dataTransfer.effectAllowed="move"});
    panels.addEventListener("dragend",()=>{dragged?.classList.remove("dragging");dragged=null;clear();write()});
    panels.addEventListener("dragover",e=>{e.preventDefault();clear();const over=e.target.closest(".panel");if(over&&dragged&&over!==dragged&&!over.hidden)over.classList.add("drag-over")});
    panels.addEventListener("drop",e=>{e.preventDefault();const over=e.target.closest(".panel");if(over&&dragged&&over!==dragged){const after=e.clientY-over.getBoundingClientRect().top>over.offsetHeight/2;panels.insertBefore(dragged,after?over.nextSibling:over)}clear()});
    apply(read());
  }
  render();
})();
