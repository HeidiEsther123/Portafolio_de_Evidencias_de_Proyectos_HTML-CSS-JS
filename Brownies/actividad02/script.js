// ========== VARIABLES GLOBALES ==========
let points = [];
let currentRange = 10;

// ========== CONSTANTES MATEMÁTICAS ==========
const CONSTANTS = {
    'π': Math.PI,
    'pi': Math.PI,
    'e': Math.E,
    'φ': (1 + Math.sqrt(5)) / 2,
    'phi': (1 + Math.sqrt(5)) / 2,
    'τ': 2 * Math.PI,
    'tau': 2 * Math.PI,
    'ln2': Math.LN2,
    'ln10': Math.LN10,
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
    '-√2': -Math.sqrt(2),
    '-√3': -Math.sqrt(3),
    '-√5': -Math.sqrt(5)
};

// ====== FUNCIÓN PRINCIPAL parseNumber ======
function parseNumber(input) {
    input = input.trim().replace(/\s+/g, '');

    if (CONSTANTS.hasOwnProperty(input)) return CONSTANTS[input];

    let processedInput = input;
    for (const [symbol, value] of Object.entries(CONSTANTS)) {
        const regex = new RegExp(symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        processedInput = processedInput.replace(regex, value.toString());
    }

    if (input.includes('/') && !input.includes('*') && !input.includes('+') && !input.includes('-', 1)) {
        const parts = input.split('/');
        if (parts.length === 2) {
            const numerator = parseFloat(parts[0]);
            const denominator = parseFloat(parts[1]);
            if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0)
                return numerator / denominator;
        }
    }

    if (input.startsWith('√')) {
        const radicand = parseFloat(input.slice(1));
        if (!isNaN(radicand) && radicand >= 0) return Math.sqrt(radicand);
    }

    if (input.startsWith('-√')) {
        const radicand = parseFloat(input.slice(2));
        if (!isNaN(radicand) && radicand >= 0) return -Math.sqrt(radicand);
    }

    if (input.includes('sqrt(')) {
        const sqrtPattern = /sqrt\(([^)]+)\)/g;
        let match;
        let newInput = input;

        while ((match = sqrtPattern.exec(input)) !== null) {
            const inner = match[1];
            let val;

            if (/^[0-9+\-*/.()]+$/.test(inner)) {
                try { val = Function('"use strict";return (' + inner + ')')(); }
                catch { val = NaN; }
            }

            if (!isNaN(val) && val >= 0) {
                newInput = newInput.replace(match[0], Math.sqrt(val));
            }
        }
        return parseFloat(newInput);
    }

    try {
        const safe = /^[0-9+\-*/.()]+$/;
        if (safe.test(processedInput))
            return Function('"use strict"; return (' + processedInput + ')')();
    } catch {}

    return null;
}
