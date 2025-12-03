/* ==================== VARIABLES GLOBALES ==================== */
let points = [];
let currentRange = 10;

/* ==================== CONSTANTES MATEMÁTICAS ==================== */
const CONSTANTS = {
    // Constantes básicas
    'π': Math.PI,
    'pi': Math.PI,
    'e': Math.E,

    // Número áureo (phi)
    'φ': (1 + Math.sqrt(5)) / 2,
    'phi': (1 + Math.sqrt(5)) / 2,

    // Tau
    'τ': 2 * Math.PI,
    'tau': 2 * Math.PI,

    // Logaritmos
    'ln2': Math.LN2,
    'ln10': Math.LN10,

    // Raíces comunes
    '√2': Math.sqrt(2),
    '√3': Math.sqrt(3),
    '√5': Math.sqrt(5),
    '√7': Math.sqrt(7),
    '√8': Math.sqrt(8),
    '√10': Math.sqrt(10),
    '√11': Math.sqrt(11),
    '√12': Math.sqrt(12),
    '√13': Math.sqrt(13),
    '√15': Math.sqrt(15),
    '√17': Math.sqrt(17),
    '√19': Math.sqrt(19),
    '√20': Math.sqrt(20),

    // Negativas
    '-√2': -Math.sqrt(2),
    '-√3': -Math.sqrt(3),
    '-√5': -Math.sqrt(5)
};

console.log("Constantes cargadas correctamente");

/* =========== FUNCIÓN PARA CONVERTIR TEXTO EN NÚMERO =========== */
function parseNumber(input) {
    input = input.trim().replace(/\s+/g, '');

    if (CONSTANTS.hasOwnProperty(input)) return CONSTANTS[input];

    // Reemplazar constantes dentro de expresiones
    let processedInput = input;
    for (const [symbol, value] of Object.entries(CONSTANTS)) {
        const regex = new RegExp(symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        processedInput = processedInput.replace(regex, value.toString());
    }

    // Fracciones simples
    if (input.includes('/') && !input.includes('*') && !input.includes('+') && !input.includes('-', 1)) {
        const [num, den] = input.split('/');
        const n = parseFloat(num);
        const d = parseFloat(den);
        if (!isNaN(n) && !isNaN(d) && d !== 0) return n / d;
    }

    // √x
    if (input.startsWith('√')) {
        const rad = parseFloat(input.slice(1));
        if (!isNaN(rad) && rad >= 0) return Math.sqrt(rad);
    }

    // -√x
    if (input.startsWith('-√')) {
        const rad = parseFloat(input.slice(2));
        if (!isNaN(rad) && rad >= 0) return -Math.sqrt(rad);
    }

    // sqrt()
    if (input.includes('sqrt(')) {
        const match = input.match(/sqrt\(([^)]+)\)/);
        if (match) {
            const inner = match[1];
            let innerValue;

            try {
                if (inner.includes('/') && !inner.includes('*') && !inner.includes('+') && !inner.includes('-', 1)) {
                    const [num, den] = inner.split('/');
                    const n = parseFloat(num);
                    const d = parseFloat(den);
                    if (!isNaN(n) && !isNaN(d) && d !== 0) innerValue = n / d;
                } else {
                    innerValue = Function('"use strict"; return (' + inner + ')')();
                }

                if (!isNaN(innerValue) && innerValue >= 0) return Math.sqrt(innerValue);
            } catch {}
        }
    }

    // Evaluación matemática general
    try {
        processedInput = processedInput.replace(/\^/g, '**');
        const safe = /^[0-9+\-*/.() ]+$/;
        if (safe.test(processedInput)) {
            const result = Function('"use strict"; return (' + processedInput + ')')();
            if (typeof result === 'number' && isFinite(result)) return result;
        }
    } catch {}

    const num = parseFloat(processedInput);
    return isNaN(num) ? null : num;
}

/* ==================== CLASIFICACIÓN ==================== */
function classifyNumber(num, originalInput) {
    if (num > 0 && Number.isInteger(num)) return 'naturals';
    if (Number.isInteger(num)) return 'integers';

    const irrConstants = [
        'π', 'pi', 'e', 'φ', 'phi', 'τ', 'tau', 'ln2', 'ln10',
        '√2', '√3', '√5', '√7', '√8', '√10', '√11', '√12', '√13',
        '√15', '√17', '√19', '√20', '-√2', '-√3', '-√5'
    ];

    if (irrConstants.includes(originalInput)) return 'irrationals';
    if (originalInput.includes('sqrt(') || originalInput.includes('√')) return 'irrationals';
    if (originalInput.includes('/')) return 'rationals';

    return 'rationals';
}

function getClassificationName(type) {
    return {
        'naturals': 'ℕ (Naturales)',
        'integers': 'ℤ (Enteros)',
        'rationals': 'ℚ (Racionales)',
        'irrationals': 'ℝ-ℚ (Irracionales)'
    }[type] || 'Desconocido';
}

/* ==================== INTERFAZ ==================== */
function addNumber() {
    const input = document.getElementById("numberInput").value;

    if (!input) return alert("Ingresa un número");

    const value = parseNumber(input);
    if (value === null) return alert("Formato no válido");

    if (Math.abs(value) > currentRange)
        return alert(`Fuera del rango permitido (${currentRange})`);

    if (points.some(p => Math.abs(p.value - value) < 0.0001))
        return alert("Ese número ya existe");

    const classification = classifyNumber(value, input);

    points.push({ value, originalInput: input, classification });

    document.getElementById("numberInput").value = "";
    updateDisplay();
}

function addPresetNumber(input) {
    const value = parseNumber(input);
    if (value === null) return alert("Número inválido");

    if (points.some(p => Math.abs(p.value - value) < 0.0001))
        return alert("Ese número ya existe");

    const classification = classifyNumber(value, input);
    points.push({ value, originalInput: input, classification });

    updateDisplay();
}

function clearAll() {
    points = [];
    updateDisplay();
}

function updateDisplay() {
    drawNumberLine();
    updatePointsList();
    updateDistanceSelectors();
}

/* ==================== DIBUJAR RECTA ==================== */
function drawNumberLine() {
    const container = document.getElementById("numberLine");
    container.innerHTML = "";

    const line = document.createElement("div");
    line.className = "line";
    container.appendChild(line);

    for (let i = -currentRange; i <= currentRange; i++) {
        const pos = ((i + currentRange) / (2 * currentRange)) * 100;

        const tick = document.createElement("div");
        tick.className = "tick";
        tick.style.left = pos + "%";

        const label = document.createElement("div");
        label.className = "tick-label";
        label.textContent = i;
        label.style.left = pos + "%";

        container.appendChild(tick);
        container.appendChild(label);
    }

    points.forEach(p => {
        const point = document.createElement("div");
        point.className = `number-point ${p.classification}`;
        point.style.left = ((p.value + currentRange) / (2 * currentRange)) * 100 + "%";

        const label = document.createElement("div");
        label.className = "point-label";
        label.textContent = p.originalInput;

        point.appendChild(label);
        container.appendChild(point);
    });
}

/* ==================== LISTA DE PUNTOS ==================== */
function updatePointsList() {
    const list = document.getElementById("pointsList");
    list.innerHTML = "";

    points.forEach(p => {
        const div = document.createElement("div");
        div.className = "point-item";
        div.innerHTML = `<b>${p.originalInput}</b> = ${p.value.toFixed(3)}<br>${p.classification}`;
        list.appendChild(div);
    });
}

/* ==================== DISTANCIAS ==================== */
function updateDistanceSelectors() {
    const A = document.getElementById("pointA");
    const B = document.getElementById("pointB");

    A.innerHTML = "";
    B.innerHTML = "";

    points.forEach((p, i) => {
        const optA = document.createElement("option");
        const optB = document.createElement("option");

        optA.value = optB.value = i;
        optA.textContent = optB.textContent = `${p.originalInput} (${p.value.toFixed(3)})`;

        A.appendChild(optA);
        B.appendChild(optB);
    });
}

document.getElementById("calculateDistance").addEventListener("click", () => {
    const A = document.getElementById("pointA").value;
    const B = document.getElementById("pointB").value;

    const result = document.getElementById("distanceResult");

    if (A === "" || B === "") return (result.textContent = "Selecciona dos puntos.");

    const d = Math.abs(points[A].value - points[B].value);
    result.textContent = `Distancia = ${d.toFixed(3)}`;
});
