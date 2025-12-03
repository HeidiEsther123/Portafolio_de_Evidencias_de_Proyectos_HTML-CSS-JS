// ========== VARIABLES GLOBALES ==========
let points = [];
let currentRange = 10;

// ========== CONSTANTES MATEMÁTICAS ==========
const CONSTANTS = {
    // Constantes básicas
    'π': Math.PI,
    'pi': Math.PI,
    'e': Math.E,

    // Número áureo (phi)
    'φ': (1 + Math.sqrt(5)) / 2,
    'phi': (1 + Math.sqrt(5)) / 2,

    // Tau (2π)
    'τ': 2 * Math.PI,
    'tau': 2 * Math.PI,

    // Logaritmos naturales
    'ln2': Math.LN2,
    'ln10': Math.LN10,

    // Raíces cuadradas comunes
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

    // Raíces cuadradas negativas
    '-√2': -Math.sqrt(2),
    '-√3': -Math.sqrt(3),
    '-√5': -Math.sqrt(5)
};

// ========== FUNCIONES DE PARSING DE NÚMEROS ==========
/**
 * Función principal para convertir texto en número
 * Maneja constantes, fracciones, raíces y expresiones básicas
 * @param {string} input - La expresión matemática ingresada
 * @returns {number|null} - El valor numérico o null si es inválida
 */
function parseNumber(input) {
    if (typeof input !== 'string') return null;
    // Limpiar el input de espacios en blanco
    input = input.trim().replace(/\s+/g, '');

    // Verificar si es una constante matemática directa
    if (CONSTANTS.hasOwnProperty(input)) {
        return CONSTANTS[input];
    }

    // Reemplazar constantes matemáticas en la expresión
    let processedInput = input;
    for (const [symbol, value] of Object.entries(CONSTANTS)) {
        // Crear expresión regular para reemplazar el símbolo (escapando caracteres especiales)
        const regex = new RegExp(symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        processedInput = processedInput.replace(regex, value.toString());
    }

    // Manejar fracciones simples (sin otros operadores)
    // Nota: la condición original intentaba evitar signos menos como operador. Aquí detectamos si solo contiene dígitos, signo - al inicio y /
    if (/^-?\d+\/-?\d+$/.test(input)) {
        const parts = input.split('/');
        if (parts.length === 2) {
            const numerator = parseFloat(parts[0]);
            const denominator = parseFloat(parts[1]);

            if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
                return numerator / denominator;
            }
        }
    }

    // Manejar raíces cuadradas básicas con símbolo √ (sin otros operadores)
    if (/^-?√\d+(\.\d+)?$/.test(input)) {
        if (input.startsWith('-√')) {
            const radicand = parseFloat(input.slice(2));
            if (!isNaN(radicand)) return -Math.sqrt(radicand);
        } else {
            const radicand = parseFloat(input.slice(1));
            if (!isNaN(radicand)) return Math.sqrt(radicand);
        }
    }

    // Manejar función sqrt() con cualquier expresión dentro
    if (input.includes('sqrt(')) {
        const sqrtPattern = /sqrt\(([^)]+)\)/g;
        let processedInputSqrt = input;
        let match;

        while ((match = sqrtPattern.exec(input)) !== null) {
            const innerExpression = match[1];
            let innerValue;

            try {
                // Para fracciones simples dentro de sqrt()
                if (/^-?\d+\/-?\d+$/.test(innerExpression)) {
                    const parts = innerExpression.split('/');
                    if (parts.length === 2) {
                        const num = parseFloat(parts[0]);
                        const den = parseFloat(parts[1]);
                        if (!isNaN(num) && !isNaN(den) && den !== 0) {
                            innerValue = num / den;
                        }
                    }
                } else {
                    // Para otras expresiones, evaluar directamente si son caracteres seguros
                    const safeChars = /^[0-9+\-*/.() ]+$/;
                    if (safeChars.test(innerExpression)) {
                        innerValue = Function('"use strict"; return (' + innerExpression + ')')();
                    } else {
                        innerValue = parseFloat(innerExpression);
                    }
                }

                // Si el valor interno es válido, calcular su raíz cuadrada
                if (!isNaN(innerValue)) {
                    if (innerValue < 0) {
                        // raíz de negativo -> NaN (no la manejamos)
                        processedInputSqrt = processedInputSqrt.replace(match[0], 'NaN');
                    } else {
                        const sqrtValue = Math.sqrt(innerValue);
                        processedInputSqrt = processedInputSqrt.replace(match[0], sqrtValue.toString());
                    }
                }
            } catch (e) {
                // Si falla la evaluación, continuar con el siguiente
                continue;
            }
        }

        // Si la entrada era solo una raíz simple, devolver el resultado directamente
        if (/^sqrt\([^)]+\)$/.test(input)) {
            const innerExpression = input.match(/sqrt\(([^)]+)\)/)[1];
            let innerValue;
            try {
                if (/^-?\d+\/-?\d+$/.test(innerExpression)) {
                    const parts = innerExpression.split('/');
                    if (parts.length === 2) {
                        const num = parseFloat(parts[0]);
                        const den = parseFloat(parts[1]);
                        if (!isNaN(num) && !isNaN(den) && den !== 0) {
                            innerValue = num / den;
                        }
                    }
                } else {
                    const safeChars = /^[0-9+\-*/.() ]+$/;
                    if (safeChars.test(innerExpression)) {
                        innerValue = Function('"use strict"; return (' + innerExpression + ')')();
                    } else {
                        innerValue = parseFloat(innerExpression);
                    }
                }

                if (!isNaN(innerValue) && innerValue >= 0) {
                    return Math.sqrt(innerValue);
                } else {
                    return null;
                }
            } catch (e) {
                // continuar
            }
        }

        // usar la versión procesada (en caso de múltiples sqrt)
        processedInput = processedInputSqrt;
    }

    // Evaluar expresiones matemáticas más complejas
    try {
        // Reemplazar ^ por ** para potencias si el usuario lo escribió así
        processedInput = processedInput.replace(/\^/g, '**');

        // Verificar que solo contiene caracteres seguros para evaluar
        const safeChars = /^[0-9+\-*/.() ]+$/;
        if (safeChars.test(processedInput)) {
            const result = Function('"use strict"; return (' + processedInput + ')')();
            if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
                return result;
            }
        }
    } catch (e) {
        // Si falla la evaluación, continuar con el parsing normal
    }

    // Intentar parsear como número decimal normal
    const num = parseFloat(processedInput);
    if (!isNaN(num)) {
        return num;
    }

    // Si nada funcionó, retornar null
    return null;
}

// ========== FUNCIONES DE NORMALIZACIÓN Y CLASIFICACIÓN ==========
/**
 * Normaliza una expresión matemática para facilitar el análisis
 * @param {string} expr
 * @returns {string}
 */
function normalizeExpression(expr) {
    return expr.replace(/\s/g, '')          // Remover espacios
               .replace(/\*\*/g, '^')        // Convertir ** a ^
               .toLowerCase();
}

/**
 * Clasifica expresiones matemáticas complejas
 * @param {string} expression
 * @param {number} result
 * @returns {string} - 'naturals'|'integers'|'rationals'|'irrationals'
 */
function classifyExpression(expression, result) {
    const normalizedExpr = normalizeExpression(expression);

    // Casos conocidos donde el resultado es racional
    const knownRationalResults = [
        { pattern: /^π\/π$/, result: 1 },
        { pattern: /^pi\/pi$/, result: 1 },
        { pattern: /^e\/e$/, result: 1 },
        { pattern: /^φ\/φ$/, result: 1 },
        { pattern: /^phi\/phi$/, result: 1 },
        { pattern: /^τ\/τ$/, result: 1 },
        { pattern: /^tau\/tau$/, result: 1 },
        { pattern: /^√2\/√2$/, result: 1 },
        { pattern: /^√3\/√3$/, result: 1 },
        { pattern: /^√5\/√5$/, result: 1 },

        { pattern: /^π-π$/, result: 0 },
        { pattern: /^pi-pi$/, result: 0 },
        { pattern: /^e-e$/, result: 0 },

        { pattern: /^2\*π\/τ$/, result: 1 },
        { pattern: /^τ\/2\*π$/, result: 1 }
    ];

    for (const knownCase of knownRationalResults) {
        if (knownCase.pattern.test(normalizedExpr)) {
            if (Math.abs(result - knownCase.result) < 0.0001) {
                if (knownCase.result > 0 && Number.isInteger(knownCase.result)) return 'naturals';
                if (Number.isInteger(knownCase.result)) return 'integers';
                return 'rationals';
            }
        }
    }

    const specialRationalCases = [
        /π\/π/, /pi\/pi/, /e\/e/, /φ\/φ/, /phi\/phi/, /τ\/τ/, /tau\/tau/,
        /√2\/√2/, /√3\/√3/, /√5\/√5/,
        /π\/-π/, /pi\/-pi/, /e\/-e/, /φ\/-φ/, /phi\/-phi/,
        /-π\/π/, /-pi\/pi/, /-e\/e/, /-φ\/φ/, /-phi\/phi/,
        /e\/2\*e/, /π\/2\*π/, /pi\/2\*pi/
    ];

    for (const pattern of specialRationalCases) {
        if (pattern.test(expression.replace(/\s/g, ''))) {
            if (result > 0 && Number.isInteger(result)) return 'naturals';
            if (Number.isInteger(result)) return 'integers';
            return 'rationals';
        }
    }

    const irrationalSymbols = ['π', 'pi', 'e', 'φ', 'phi', 'τ', 'tau', 'ln2', 'ln10', '√', 'sqrt'];
    const containsIrrationals = irrationalSymbols.some(symbol => expression.includes(symbol));

    if (containsIrrationals) {
        const rationalResultPatterns = [
            /π\+\(-π\)/, /pi\+\(-pi\)/, /e\+\(-e\)/, /φ\+\(-φ\)/, /phi\+\(-phi\)/,
            /π-π/, /pi-pi/, /e-e/, /φ-φ/, /phi-phi/, /τ-τ/, /tau-tau/,
            /√2-√2/, /√3-√3/, /√5-√5/,
            /2\*π\/τ/, /2\*pi\/tau/, /τ\/2\*π/, /tau\/2\*pi/
        ];

        const isSpecialRational = rationalResultPatterns.some(pattern =>
            pattern.test(expression.replace(/\s/g, ''))
        );

        if (isSpecialRational) {
            if (result > 0 && Number.isInteger(result)) return 'naturals';
            if (Number.isInteger(result)) return 'integers';
            return 'rationals';
        }

        return 'irrationals';
    }

    if (result > 0 && Number.isInteger(result)) return 'naturals';
    if (Number.isInteger(result)) return 'integers';
    return 'rationals';
}

/**
 * Clasifica un número según su tipo matemático
 * @param {number} num
 * @param {string} originalInput
 * @returns {string}
 */
function classifyNumber(num, originalInput) {
    if (num > 0 && Number.isInteger(num)) return 'naturals';
    if (Number.isInteger(num)) return 'integers';

    const irrationalConstants = [
        'π', 'pi', 'e', 'φ', 'phi', 'τ', 'tau', 'ln2', 'ln10',
        '√2', '√3', '√5', '√7', '√8', '√10', '√11', '√12', '√13', '√15', '√17', '√19', '√20',
        '-√2', '-√3', '-√5'
    ];

    if (irrationalConstants.includes(originalInput)) return 'irrationals';

    if (originalInput.includes('sqrt(')) {
        const sqrtMatch = originalInput.match(/sqrt\(([^)]+)\)/);
        if (sqrtMatch) {
            const innerExpression = sqrtMatch[1];
            let innerValue;
            try {
                if (/^-?\d+\/-?\d+$/.test(innerExpression)) {
                    const parts = innerExpression.split('/');
                    if (parts.length === 2) {
                        const n = parseFloat(parts[0]);
                        const d = parseFloat(parts[1]);
                        if (!isNaN(n) && !isNaN(d) && d !== 0) innerValue = n / d;
                    }
                } else {
                    const safeChars = /^[0-9+\-*/.() ]+$/;
                    if (safeChars.test(innerExpression)) {
                        innerValue = Function('"use strict"; return (' + innerExpression + ')')();
                    } else {
                        innerValue = parseFloat(innerExpression);
                    }
                }

                if (!isNaN(innerValue) && innerValue >= 0) {
                    const sqrtResult = Math.sqrt(innerValue);
                    if (Number.isInteger(sqrtResult)) {
                        if (sqrtResult > 0) return 'naturals';
                        if (sqrtResult === 0) return 'integers';
                    } else {
                        return 'irrationals';
                    }
                }
            } catch (e) {
                return 'irrationals';
            }
        }
    }

    if (originalInput.includes('*') || originalInput.includes('+') ||
        originalInput.includes('-') || originalInput.includes('/')) {
        return classifyExpression(originalInput, num);
    }

    if (originalInput.includes('/')) return 'rationals';

    return 'rationals';
}

/**
 * Obtiene el nombre completo de la clasificación
 */
function getClassificationName(classification) {
    const names = {
        'naturals': 'ℕ (Naturales)',
        'integers': 'ℤ (Enteros)',
        'rationals': 'ℚ (Racionales)',
        'irrationals': 'ℝ-ℚ (Irracionales)'
    };
    return names[classification] || 'No clasificado';
}

// ========== FUNCIONES DE INTERFAZ DE USUARIO ==========
/**
 * Agrega un número desde el input principal
 */
function addNumber() {
    const inputRaw = document.getElementById('numberInput').value;
    if (!inputRaw) {
        alert('Por favor ingresa un número');
        return;
    }

    const value = parseNumber(inputRaw);
    if (value === null) {
        alert('Formato de número no válido. Ejemplos válidos: sqrt(7), 2*π, 1/e, √2, -1/2');
        return;
    }

    if (Math.abs(value) > currentRange) {
        alert(`El número está fuera del rango actual (-${currentRange} a ${currentRange}). Cambia el rango de visualización.`);
        return;
    }

    // Verificar duplicado (tolerancia)
    const existingPoint = points.find(p => Math.abs(p.value - value) < 0.0001);
    if (existingPoint) {
        alert('Este número ya está en la recta numérica');
        return;
    }

    const classification = classifyNumber(value, inputRaw);

    points.push({
        value: value,
        originalInput: inputRaw,
        classification: classification
    });

    document.getElementById('numberInput').value = '';
    updateDisplay();
}

/**
 * Agrega un número predefinido desde los botones
 */
function addPresetNumber(input) {
    const value = parseNumber(input);

    if (value === null || Math.abs(value) > currentRange) {
        alert(`El número ${input} está fuera del rango actual`);
        return;
    }

    const existingPoint = points.find(p => Math.abs(p.value - value) < 0.0001);
    if (existingPoint) {
        alert('Este número ya está en la recta numérica');
        return;
    }

    const classification = classifyNumber(value, input);

    points.push({
        value: value,
        originalInput: input,
        classification: classification
    });

    updateDisplay();
}

/**
 * Elimina todos los puntos
 */
function clearAll() {
    points = [];
    updateDisplay();
}

/**
 * Actualiza vista completa
 */
function updateDisplay() {
    drawNumberLine();
    updatePointsList();
    updateDistanceSelectors();
}

// ========== FUNCIONES DE VISUALIZACIÓN ==========
/**
 * Dibuja la recta numérica con marcas y puntos
 */
function drawNumberLine() {
    const numberLine = document.getElementById('numberLine');
    if (!numberLine) return;
    numberLine.innerHTML = '';

    // Línea base
    const line = document.createElement('div');
    line.className = 'line';
    numberLine.appendChild(line);

    // Marcas de graduación
    const tickCount = currentRange * 2 + 1; // -range ... +range
    for (let i = 0; i < tickCount; i++) {
        const value = -currentRange + i;
        const percentage = (i / (tickCount - 1)) * 90 + 5; // margenes 5% a ambos lados

        const tick = document.createElement('div');
        tick.className = 'tick';
        tick.style.left = percentage + '%';
        numberLine.appendChild(tick);

        const label = document.createElement('div');
        label.className = 'tick-label';
        label.style.left = percentage + '%';
        label.textContent = value;
        numberLine.appendChild(label);
    }

    // Puntos añadidos
    points.forEach((point, index) => {
        const percentage = ((point.value + currentRange) / (2 * currentRange)) * 90 + 5;

        const pointElement = document.createElement('div');
        pointElement.className = `number-point ${point.classification}`;
        pointElement.style.left = percentage + '%';
        pointElement.draggable = false;

        const pointLabel = document.createElement('div');
        pointLabel.className = 'point-label';
        pointLabel.textContent = `${point.originalInput} ≈ ${point.value.toFixed(3)}`;
        pointElement.appendChild(pointLabel);

        pointElement.onclick = () => removePoint(index);
        pointElement.title = `${point.originalInput} (${getClassificationName(point.classification)})\nHaz clic para eliminar`;

        numberLine.appendChild(pointElement);
    });
}

/**
 * Elimina un punto
 */
function removePoint(index) {
    if (confirm('¿Deseas eliminar este punto?')) {
        points.splice(index, 1);
        updateDisplay();
    }
}

/**
 * Actualiza la lista de puntos ordenada
 */
function updatePointsList() {
    const pointsList = document.getElementById('pointsList');
    if (!pointsList) return;

    if (points.length === 0) {
        pointsList.innerHTML = '<p style="color: #6c757d; font-style: italic;">Agrega números para ver su clasificación aquí</p>';
        return;
    }

    const sortedPoints = [...points].sort((a, b) => a.value - b.value);

    pointsList.innerHTML = sortedPoints.map(point => `
        <div class="point-item" style="border-left-color: ${getClassificationColor(point.classification)}">
            <div>
                <strong>${point.originalInput}</strong> ≈ ${point.value.toFixed(6)}
                <br>
                <small>${getClassificationName(point.classification)}</small>
            </div>
            <div style="text-align: right;">
                <small>Posición: ${point.value.toFixed(3)}</small>
            </div>
        </div>
    `).join('');
}

/**
 * Color asociado a la clasificación
 */
function getClassificationColor(classification) {
    const colors = {
        'naturals': '#e74c3c',
        'integers': '#f39c12',
        'rationals': '#27ae60',
        'irrationals': '#8e44ad'
    };
    return colors[classification] || '#3498db';
}

// ========== CALCULADORA DE DISTANCIAS ==========
/**
 * Actualiza los selectores de la calculadora de distancias
 */
function updateDistanceSelectors() {
    const pointAItems = document.getElementById('pointA-items');
    const pointBItems = document.getElementById('pointB-items');
    const pointASelected = document.getElementById('pointA-selected');
    const pointBSelected = document.getElementById('pointB-selected');

    if (!pointAItems || !pointBItems || !pointASelected || !pointBSelected) return;

    // Limpiar
    pointAItems.innerHTML = '<div data-value="">Selecciona un punto</div>';
    pointBItems.innerHTML = '<div data-value="">Selecciona un punto</div>';

    if (points.length === 0) {
        pointASelected.textContent = 'Selecciona un punto';
        pointBSelected.textContent = 'Selecciona un punto';
        document.getElementById('pointA-container').setAttribute('data-value', '');
        document.getElementById('pointB-container').setAttribute('data-value', '');
        return;
    }

    points.forEach((point, index) => {
        const optionText = `${point.originalInput} (${point.value.toFixed(3)})`;

        const optionA = document.createElement('div');
        optionA.setAttribute('data-value', index);
        optionA.textContent = optionText;
        pointAItems.appendChild(optionA);

        const optionB = document.createElement('div');
        optionB.setAttribute('data-value', index);
        optionB.textContent = optionText;
        pointBItems.appendChild(optionB);
    });
}

/**
 * Calcula la distancia entre dos puntos seleccionados
 */
function calculateDistance() {
    const pointAValue = document.getElementById('pointA-container').getAttribute('data-value');
    const pointBValue = document.getElementById('pointB-container').getAttribute('data-value');
    const resultDiv = document.getElementById('distanceResult');

    if (!resultDiv) return;

    if (!pointAValue || !pointBValue) {
        resultDiv.innerHTML = '<div style="color: #dc3545;">Selecciona ambos puntos para calcular la distancia</div>';
        return;
    }

    if (pointAValue === pointBValue) {
        resultDiv.innerHTML = '<div style="color: #dc3545;">Selecciona dos puntos diferentes</div>';
        return;
    }

    const pointA = points[parseInt(pointAValue, 10)];
    const pointB = points[parseInt(pointBValue, 10)];

    if (!pointA || !pointB) {
        resultDiv.innerHTML = '<div style="color: #dc3545;">Selecciona puntos válidos</div>';
        return;
    }

    const distance = Math.abs(pointA.value - pointB.value);

    resultDiv.innerHTML = `
        <div class="distance-result">
            <strong>Distancia entre ${pointA.originalInput} y ${pointB.originalInput}:</strong><br>
            |${pointA.value.toFixed(3)} - ${pointB.value.toFixed(3)}| = ${distance.toFixed(6)} unidades
        </div>
    `;
}

// ========== SELECTORES PERSONALIZADOS ==========
/**
 * Inicializa los selectores personalizados para la calculadora de distancias
 */
function initCustomSelects() {
    ['pointA', 'pointB'].forEach(selectId => {
        const container = document.getElementById(selectId + '-container');
        const selected = document.getElementById(selectId + '-selected');
        const items = document.getElementById(selectId + '-items');

        if (!container || !selected || !items) return;

        // Manejar clic en el selector principal
        selected.addEventListener('click', function(e) {
            e.stopPropagation();

            // Cerrar otros dropdowns primero
            document.querySelectorAll('.select-items').forEach(otherItems => {
                if (otherItems !== items) otherItems.classList.remove('show');
            });
            document.querySelectorAll('.select-selected').forEach(otherSelected => {
                if (otherSelected !== selected) otherSelected.classList.remove('select-arrow-active');
            });

            const isCurrentlyOpen = items.classList.contains('show');
            if (isCurrentlyOpen) {
                items.classList.remove('show');
                selected.classList.remove('select-arrow-active');
                adjustZIndex(null);
            } else {
                items.classList.add('show');
                selected.classList.add('select-arrow-active');
                adjustZIndex(selectId);
            }
        });

        // Manejar clics en las opciones del dropdown
        items.addEventListener('click', function(e) {
            e.stopPropagation();
            const target = e.target;
            if (target && target.hasAttribute('data-value')) {
                selected.textContent = target.textContent;
                container.setAttribute('data-value', target.getAttribute('data-value'));

                items.querySelectorAll('.selected').forEach(item => item.classList.remove('selected'));
                target.classList.add('selected');

                items.classList.remove('show');
                selected.classList.remove('select-arrow-active');
                adjustZIndex(null);
            }
        });
    });
}

/**
 * Cierra todos los selectores abiertos
 */
function closeAllSelect() {
    document.querySelectorAll('.select-items').forEach(items => items.classList.remove('show'));
    document.querySelectorAll('.select-selected').forEach(selected => selected.classList.remove('select-arrow-active'));
}

/**
 * Ajusta z-index para evitar superposición
 */
function adjustZIndex(activeSelectId) {
    document.querySelectorAll('.distance-field').forEach(field => field.style.zIndex = '100');
    document.querySelectorAll('.distance-field .custom-select').forEach(select => select.style.zIndex = '101');
    document.querySelectorAll('.distance-field .select-items').forEach(items => items.style.zIndex = '1000');

    if (activeSelectId) {
        const activeField = document.getElementById(activeSelectId + '-container')?.closest('.distance-field');
        const activeSelect = document.getElementById(activeSelectId + '-container');
        const activeItems = document.getElementById(activeSelectId + '-items');

        if (activeField) activeField.style.zIndex = '2000';
        if (activeSelect) activeSelect.style.zIndex = '2001';
        if (activeItems) activeItems.style.zIndex = '12000';
    }
}

// ========== INICIALIZACIÓN Y EVENT LISTENERS ==========
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar los selectores personalizados
    initCustomSelects();

    // Mostrar la visualización inicial
    updateDisplay();

    // Event listener para detectar Enter en el input de números
    const numInput = document.getElementById('numberInput');
    if (numInput) {
        numInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addNumber();
        });
    }

    // Cerrar dropdowns al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.custom-select')) {
            closeAllSelect();
            adjustZIndex(null);
        }
    });

    // Delegación para recalcular select lists cuando se agregan puntos (se usa updateDisplay)
});
