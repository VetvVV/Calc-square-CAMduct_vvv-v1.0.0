(() => {
  const config = window.CALC_MODULE || {};
  const params = new URLSearchParams(window.location.search);
  const allowedRoles = new Set(["guest", "user", "client", "admin"]);
  const role = allowedRoles.has(params.get("role")) ? params.get("role") : "guest";
  const lang = params.get("lang") || "ru";
  const editIndexParam = params.get("editIndex");
  const isEdit = editIndexParam !== null && editIndexParam !== "";
  const isAdmin = role === "admin";
  const canAdd = role !== "guest";

  const materials = [
    { key: "galv", label: "Оцинкованная сталь", density: 7850, thickness: [0.5, 0.55, 0.7, 0.8, 0.9, 1.0] },
    { key: "ss430", label: "Нержавеющая сталь 430 техническая", density: 7850, thickness: [0.55, 0.7, 0.8, 1.0] },
    { key: "ss304", label: "Нержавеющая сталь 304 пищевая", density: 8000, thickness: [0.55, 0.7, 0.8, 1.0] },
    { key: "al", label: "Алюминий", density: 2700, thickness: [0.5, 0.7, 0.8, 1.0] }
  ];

  const labels = {
    ru: {
      material: "Материал",
      thickness: "Толщина",
      qty: "Количество",
      area: "Площадь",
      mass: "Масса изделия",
      add: "\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0432 \u043f\u0440\u043e\u0435\u043a\u0442",
      saveChanges: "\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c \u0438\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u044f",
      note: "Предварительный расчет",
      formula: "Формула",
      substitution: "Подстановка",
      units: "мм",
      kg: "кг",
      m2: "м²"
    },
    uk: {
      material: "Матеріал",
      thickness: "Товщина",
      qty: "Кількість",
      area: "Площа",
      mass: "Маса виробу",
      add: "\u0414\u043e\u0434\u0430\u0442\u0438 \u0432 \u043f\u0440\u043e\u0435\u043a\u0442",
      saveChanges: "\u0417\u0431\u0435\u0440\u0435\u0433\u0442\u0438 \u0437\u043c\u0456\u043d\u0438",
      note: "Попередній розрахунок",
      formula: "Формула",
      substitution: "Підстановка",
      units: "мм",
      kg: "кг",
      m2: "м²"
    },
    en: {
      material: "Material",
      thickness: "Thickness",
      qty: "Quantity",
      area: "Area",
      mass: "Product mass",
      add: "Add to project",
      saveChanges: "Save changes",
      note: "Preliminary calculation",
      formula: "Formula",
      substitution: "Substitution",
      units: "mm",
      kg: "kg",
      m2: "m²"
    }
  };

  const t = labels[lang] || labels.ru;
  const nf = (value, digits = 3) => Number(value || 0).toFixed(digits);
  const byId = (id) => document.getElementById(id);

  function range(from, to, step) {
    const values = [];
    for (let value = from; value <= to; value += step) {
      values.push(value);
    }
    return values;
  }

  const standardOptions = {
    D: [80, 100, 125, 150, 160, 180, 200, 225, 250, 280, 300, 315, 355, 400, 450, 500, 560, 630, 710, 800, 900, 1000, 1120, 1250],
    D1: [80, 100, 125, 150, 160, 180, 200, 225, 250, 280, 300, 315, 355, 400, 450, 500, 560, 630, 710, 800, 900, 1000, 1120, 1250],
    D2: [80, 100, 125, 150, 160, 180, 200, 225, 250, 280, 300, 315, 355, 400, 450, 500, 560, 630, 710, 800, 900, 1000, 1120, 1250],
    A: range(100, 2000, 50),
    A1: range(100, 2000, 50),
    B: range(100, 1600, 50),
    B1: range(100, 1600, 50),
    C: range(100, 3000, 50),
    H: range(100, 1600, 50),
    R: range(100, 1600, 50),
    Offset: range(50, 1200, 50),
    Angle: [15, 30, 45, 60, 90]
  };

  function fieldOptions(field) {
    if (Array.isArray(field.options) && field.options.length) {
      return field.options;
    }
    return standardOptions[field.key] || null;
  }

  function initialNumber(key, fallback) {
    const raw = params.get(key);
    const value = Number(String(raw || "").replace(",", "."));
    return Number.isFinite(value) && raw !== null && raw !== "" ? value : Number(fallback || 0);
  }

  function initialText(key, fallback) {
    const raw = params.get(key);
    return raw !== null && raw !== "" ? raw : fallback;
  }

  function renderField(field) {
    const options = fieldOptions(field);
    const selectedValue = initialNumber(field.key, field.default);
    if (options) {
      const hasDefault = options.includes(selectedValue);
      const values = hasDefault ? options : [selectedValue, ...options].filter((value, index, array) => array.indexOf(value) === index);
      return `
        <label>
          ${field.label}
          <select id="field-${field.key}">
            ${values.map((value) => `<option value="${value}" ${selectedValue === value ? "selected" : ""}>${value}</option>`).join("")}
          </select>
        </label>
      `;
    }
    return `
      <label>
        ${field.label}
        <input id="field-${field.key}" type="number" min="0" step="${field.step || 1}" value="${selectedValue || 0}">
      </label>
    `;
  }

  function fieldValue(key) {
    const node = byId(`field-${key}`);
    return Number(node?.value || 0);
  }

  function mm2ToM2(value) {
    return value / 1000000;
  }

  function arcLength(radius, angle) {
    return Math.PI * radius * angle / 180;
  }

  function calculate(values) {
    const q = Math.max(1, values.Q || 1);
    let mm2 = 0;
    let formula = "";
    let substitution = "";

    switch (config.formula) {
      case "round-duct":
        mm2 = Math.PI * values.D * values.C * q;
        formula = "S = π × D × C × Q";
        substitution = `π × ${values.D} × ${values.C} × ${q}`;
        break;
      case "round-elbow": {
        const arc = arcLength(values.R, values.Angle);
        mm2 = Math.PI * values.D * arc * q;
        formula = "S = π × D × (π × R × α / 180) × Q";
        substitution = `π × ${values.D} × (${nf(arc, 1)}) × ${q}`;
        break;
      }
      case "round-transition":
        mm2 = Math.PI * ((values.D1 + values.D2) / 2) * values.C * q;
        formula = "S = π × ((D1 + D2) / 2) × C × Q";
        substitution = `π × ((${values.D1} + ${values.D2}) / 2) × ${values.C} × ${q}`;
        break;
      case "round-tee":
        mm2 = (Math.PI * values.D * values.C + Math.PI * values.D1 * values.H) * q;
        formula = "S = (π × D × C + π × D1 × H) × Q";
        substitution = `(π × ${values.D} × ${values.C} + π × ${values.D1} × ${values.H}) × ${q}`;
        break;
      case "round-cap":
        mm2 = Math.PI * values.D * values.D / 4 * q;
        formula = "S = π × D² / 4 × Q";
        substitution = `π × ${values.D}² / 4 × ${q}`;
        break;
      case "round-offset":
        mm2 = Math.PI * values.D * values.C * 1.12 * q;
        formula = "S = π × D × C × 1.12 × Q";
        substitution = `π × ${values.D} × ${values.C} × 1.12 × ${q}`;
        break;
      case "rectangular-elbow": {
        const arc = arcLength(values.R, values.Angle);
        mm2 = 2 * (values.A + values.B) * arc * q;
        formula = "S = 2 × (A + B) × (π × R × α / 180) × Q";
        substitution = `2 × (${values.A} + ${values.B}) × ${nf(arc, 1)} × ${q}`;
        break;
      }
      case "rectangular-transition": {
        const p1 = 2 * (values.A + values.B);
        const p2 = 2 * (values.A1 + values.B1);
        mm2 = ((p1 + p2) / 2) * values.C * q;
        formula = "S = ((2(A+B) + 2(A1+B1)) / 2) × C × Q";
        substitution = `((${p1} + ${p2}) / 2) × ${values.C} × ${q}`;
        break;
      }
      case "rectangular-cap":
        mm2 = values.A * values.B * q;
        formula = "S = A × B × Q";
        substitution = `${values.A} × ${values.B} × ${q}`;
        break;
      default:
        mm2 = Math.PI * (values.D || 200) * (values.C || 500) * q;
        formula = "S = π × D × C × Q";
        substitution = `π × ${values.D || 200} × ${values.C || 500} × ${q}`;
    }

    return {
      area: mm2ToM2(mm2),
      formula,
      substitution
    };
  }

  function currentValues() {
    const values = {};
    (config.fields || []).forEach((field) => {
      values[field.key] = fieldValue(field.key);
    });
    values.Q = fieldValue("Q") || 1;
    return values;
  }

  function dimensionText(values) {
    return (config.dimensionKeys || config.fields || [])
      .filter((field) => field.key !== "Q" && values[field.key])
      .map((field) => `${field.key} ${values[field.key]}`)
      .join(" × ") + " мм";
  }

  function renderThicknessOptions() {
    const material = materials.find((item) => item.key === byId("material")?.value) || materials[0];
    const selected = initialNumber("thickness", byId("thickness")?.value || material.thickness[0]);
    byId("thickness").innerHTML = material.thickness
      .map((value) => `<option value="${value}" ${value === selected ? "selected" : ""}>${value}</option>`)
      .join("");
  }

  function updatePreview(values) {
    document.querySelectorAll("[data-dim-label]").forEach((node) => {
      const key = node.dataset.dimLabel;
      if (values[key]) {
        node.textContent = `${key} = ${values[key]}`;
      }
    });
  }

  function update() {
    const values = currentValues();
    const result = calculate(values);
    const material = materials.find((item) => item.key === byId("material").value) || materials[0];
    const thickness = Number(byId("thickness").value || 0.5);
    const mass = result.area * thickness * material.density / 1000;

    updatePreview(values);
    byId("area").textContent = `${nf(result.area)} ${t.m2}`;
    byId("mass").textContent = `${nf(mass, 2)} ${t.kg}`;
    byId("formula").textContent = result.formula;
    byId("substitution").textContent = `${result.substitution} ÷ 1 000 000 = ${nf(result.area)} ${t.m2}`;

    return { values, result, material, thickness, mass };
  }

  function render() {
    document.documentElement.lang = lang;
    document.title = config.title || "Calc Square";
    document.body.innerHTML = `
      <main class="module-card">
        <h1>${config.title || "Калькулятор"}</h1>
        <div class="module-layout">
          <section class="preview-panel">
            <object class="preview" type="image/svg+xml" data="preview.svg"></object>
            <div class="live-labels" aria-hidden="true">
              ${(config.dimensionKeys || []).map((field, index) => (
                `<span class="live-label live-label-${index + 1}" data-dim-label="${field.key}">${field.key} = ${field.default}</span>`
              )).join("")}
            </div>
          </section>
          <section class="form-panel">
            ${(config.fields || []).map(renderField).join("")}
            <label>
              ${t.qty}
              <select id="field-Q">
                ${Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
                  `<option value="${value}" ${value === initialNumber("Q", config.quantity || 1) ? "selected" : ""}>${value}</option>`
                )).join("")}
              </select>
            </label>
            <label>
              ${t.material}
              <select id="material">
                ${materials.map((item) => `<option value="${item.key}" ${item.key === initialText("materialCode", initialText("material", materials[0].key)) ? "selected" : ""}>${item.label}</option>`).join("")}
              </select>
            </label>
            <label>
              ${t.thickness}
              <select id="thickness"></select>
            </label>
          </section>
        </div>
        <section class="result-panel">
          <div>${t.area}<strong id="area">0.000 ${t.m2}</strong></div>
          <div>${t.mass}<strong id="mass">0.00 ${t.kg}</strong></div>
          ${isAdmin ? `
            <details open>
              <summary>${t.note}</summary>
              <p><b>${t.formula}:</b> <span id="formula"></span></p>
              <p><b>${t.substitution}:</b> <span id="substitution"></span></p>
            </details>
          ` : `
            <span id="formula" hidden></span>
            <span id="substitution" hidden></span>
          `}
          ${canAdd ? `<button id="add-to-project" type="button">${isEdit ? t.saveChanges : t.add}</button>` : ""}
        </section>
      </main>
    `;

    renderThicknessOptions();
    document.querySelectorAll("input, select").forEach((node) => {
      node.addEventListener("input", update);
      node.addEventListener("change", update);
    });
    byId("material").addEventListener("change", () => {
      renderThicknessOptions();
      update();
    });

    byId("add-to-project")?.addEventListener("click", () => {
      const state = update();
      const item = {
        name: config.itemName || config.title || "Изделие",
        productType: config.productType || "preliminary",
        dimensions: dimensionText(state.values),
        description: config.description || t.note,
        quantity: state.values.Q || 1,
        material: state.material.label,
        materialCode: state.material.key,
        thickness: state.thickness,
        area: state.result.area,
        mass: state.mass
      };
      if (isEdit) {
        item.editIndex = Number(editIndexParam);
      }
      window.parent?.postMessage({ type: "calcSquare:addProjectItem", item }, "*");
    });

    update();
  }

  render();
})();
