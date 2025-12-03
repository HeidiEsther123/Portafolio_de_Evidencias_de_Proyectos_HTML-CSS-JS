/* ==================== VARIABLES GLOBALES ==================== */ 
let points = []; 
let currentRange = 10; 
 
/* ==================== CONSTANTES MATEMÁTICAS ==================== 
*/ 
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
console.log('Variables y constantes inicializadas correctamente');
/* =========== FUNCIÓN PARA CONVERTIR TEXTO EN NÚMERO =========== */ 
function parseNumber(input) { 
    // Limpiar el input de espacios en blanco 
    input = input.trim().replace(/\s+/g, ''); 
 
    // Verificar si es una constante matemática directa 
    if (CONSTANTS.hasOwnProperty(input)) { 
        return CONSTANTS[input]; 
    } 
 
    // Reemplazar constantes matemáticas en la expresión 
    let processedInput = input; 
    for (const [symbol, value] of Object.entries(CONSTANTS)) { 
        // Crear expresión regular para reemplazar el símbolo 
        const regex = new RegExp(symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'); 
        processedInput = processedInput.replace(regex, value.toString()); 
    } 
 
    // Manejar fracciones simples (sin otros operadores) 
    if (input.includes('/') && !input.includes('*') && !input.includes('+') && !input.includes('-', 1)) { 
        const parts = input.split('/'); 
        if (parts.length === 2) { 
            const numerator = parseFloat(parts[0]); 
            const denominator = parseFloat(parts[1]); 
             
            // Verificar que ambos son números válidos y denominador no es cero 
            if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) { 
                return numerator / denominator;
            } 
        } 
    } 
 
    // Manejar raíces cuadradas básicas con símbolo √ 
    if (input.startsWith('√') && !input.includes('*') && !input.includes('+') && !input.includes('-', 1)) { 
        const radicand = parseFloat(input.slice(1)); 
        if (!isNaN(radicand) && radicand >= 0) { 
            return Math.sqrt(radicand); 
        } 
    } 
 
    // Manejar raíces cuadradas negativas 
    if (input.startsWith('-√') && !input.includes('*') && !input.includes('+')) { 
        const radicand = parseFloat(input.slice(2)); 
        if (!isNaN(radicand) && radicand >= 0) { 
            return -Math.sqrt(radicand); 
        } 
    } 
 
    // Manejar función sqrt() con cualquier expresión dentro 
    if (input.includes('sqrt(')) { 
        const match = input.match(/sqrt\(([^)]+)\)/); 
        if (match) { 
            const innerExpression = match[1]; 
            let innerValue; 
             
            try { 
                // Para fracciones simples dentro de sqrt() 
                if (innerExpression.includes('/') && !innerExpression.includes('*') &&  
                    !innerExpression.includes('+') && !innerExpression.includes('-', 1)) { 
                    const parts = innerExpression.split('/'); 
                    if (parts.length === 2) { 
                        const num = parseFloat(parts[0]); 
                        const den = parseFloat(parts[1]); 
                        if (!isNaN(num) && !isNaN(den) && den !== 0) { 
                            innerValue = num / den; 
                        } 
                    } 
                } else { 
                    // Para otras expresiones, evaluar directamente 
                    const safeChars = /^[0-9+\-*/.() ]+$/; 
                    if (safeChars.test(innerExpression)) { 
                        innerValue = Function('"use strict"; return (' + innerExpression + ')')(); 
                    } else { 
                        innerValue = parseFloat(innerExpression); 
                    } 
                } 
                 
                // Si el valor interno es válido, calcular su raíz cuadrada 
                if (!isNaN(innerValue) && innerValue >= 0) { 
                    return Math.sqrt(innerValue); 
                } 
            } catch (e) { 
                // Si falla la evaluación, continuar con el flujo normal 
            } 
        } 
    } 
 
    // Evaluar expresiones matemáticas más complejas 
    try { 
        // Reemplazar operadores por equivalentes de JavaScript 
        processedInput = processedInput.replace(/\^/g, '**'); // Potencias 
 
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
    /* ==================== FUNCIONES DE CLASIFICACIÓN ==================== */ 
function classifyNumber(num, originalInput) { 
    // Verificar si es un número natural (entero positivo) 
    if (num > 0 && Number.isInteger(num)) { 
        return 'naturals'; 
    } 
     
    // Verificar si es un número entero 
    if (Number.isInteger(num)) { 
        return 'integers'; 
    } 
     
    // Lista de constantes irracionales conocidas 
    const irrationalConstants = [ 
        'π', 'pi', 'e', 'φ', 'phi', 'τ', 'tau', 'ln2', 'ln10',  
        '√2', '√3', '√5', '√7', '√8', '√10', '√11', '√12', '√13', 
        '√15', '√17', '√19', '√20', '-√2', '-√3', '-√5' 
    ]; 
     
    // Si es una constante irracional directa 
    if (irrationalConstants.includes(originalInput)) { 
        return 'irrationals'; 
    } 
     
    // Verificar si contiene sqrt() y clasificar según el contenido 
    if (originalInput.includes('sqrt(')) { 
        const sqrtMatch = originalInput.match(/sqrt\(([^)]+)\)/); 
        if (sqrtMatch) { 
            const innerExpression = sqrtMatch[1]; 
            let innerValue;
            try { 
                // Evaluar lo que está dentro del sqrt() 
                if (innerExpression.includes('/')) { 
                    // Fracción simple 
                    const parts = innerExpression.split('/'); 
                    if (parts.length === 2) { 
                        const num = parseFloat(parts[0]); 
                        const den = parseFloat(parts[1]); 
                        if (!isNaN(num) && !isNaN(den) && den !== 0) { 
                            innerValue = num / den; 
                        } 
                    } 
                } else { 
                    // Número simple 
                    innerValue = parseFloat(innerExpression); 
                } 
                 
                if (!isNaN(innerValue) && innerValue >= 0) { 
                    const sqrtResult = Math.sqrt(innerValue); 
                     
                    // Verificar si es un cuadrado perfecto 
                    if (Number.isInteger(sqrtResult)) { 
                        // Es cuadrado perfecto 
                        if (sqrtResult > 0) { 
                            return 'naturals'; 
                        } else if (sqrtResult === 0) { 
                            return 'integers'; 
                        } 
                    } else { 
                        // No es cuadrado perfecto, es irracional 
                        return 'irrationals'; 
                    } 
                } 
            } catch (e) { 
                // Si hay error en la evaluación, asumir que es irracional 
                return 'irrationals'; 
            }
        } 
    } 
     
    // Verificar si contiene símbolo √ y no es cuadrado perfecto 
    if (originalInput.includes('√')) { 
        return 'irrationals'; 
    } 
     
    // Analizar expresiones con operaciones matemáticas 
    if (originalInput.includes('*') || originalInput.includes('+') ||  
        originalInput.includes('-') || originalInput.includes('/')) { 
         
        // Lista de símbolos irracionales para detectar en expresiones 
        const irrationalSymbols = ['π', 'pi', 'e', 'φ', 'phi', 'τ', 'tau', 'ln2', 'ln10', '√', 'sqrt']; 
         
        // Verificar si la expresión contiene números irracionales 
        const containsIrrationals = irrationalSymbols.some(symbol => originalInput.includes(symbol)); 
         
        if (containsIrrationals) { 
            // Casos especiales donde operaciones con irracionales pueden dar resultado racional 
            const specialRationalCases = [ 
                // Casos como π/π = 1, e/e = 1 
                /π\/π/, /pi\/pi/, /e\/e/, /φ\/φ/, /phi\/phi/, /τ\/τ/, /tau\/tau/, 
                /√2\/√2/, /√3\/√3/, /√5\/√5/, 
                 
                // Casos como π - π = 0 
                /π-π/, /pi-pi/, /e-e/, /φ-φ/, /phi-phi/, 
                 
                // Otros casos especiales 
                /2\*π\/τ/, /τ\/2\*π/ 
            ]; 
             
            const isSpecialRational = specialRationalCases.some(pattern => 
                pattern.test(originalInput.replace(/\s/g, '')) 
            ); 
             
            if (isSpecialRational) { 
                if (num > 0 && Number.isInteger(num)) { 
                    return 'naturals'; 
                } 
                if (Number.isInteger(num)) { 
                    return 'integers'; 
                } 
                return 'rationals'; 
            } 
             
            // Si contiene irracionales y no es caso especial, es irracional 
            return 'irrationals'; 
        } 
    } 
     
    // Verificar si es una fracción simple (racional) 
    if (originalInput.includes('/')) { 
        return 'rationals'; 
    } 
     
    // Si es decimal, asumimos que es racional a menos que se especifique lo contrario 
    return 'rationals'; 
} 
 
function getClassificationName(classification) { 
    const names = { 
        'naturals': 'ℕ (Naturales)', 
        'integers': 'ℤ (Enteros)',  
        'rationals': 'ℚ (Racionales)', 
        'irrationals': 'ℝ-ℚ (Irracionales)' 
    }; 
    return names[classification] || 'No clasificado'; 
}
/* ==================== FUNCIONES DE INTERFAZ DE USUARIO 
==================== */ 
function addNumber() { 
    const input = document.getElementById('numberInput').value; 
     
    if (!input) { 
        alert('Por favor ingresa un número'); 
        return; 
    } 
     
    const value = parseNumber(input); 
    if (value === null) { 
        alert('Formato de número no válido. Ejemplos válidos: sqrt(7), 2*π, 1/e, √2, -1/2'); 
        return; 
    } 
     
    if (Math.abs(value) > currentRange) { 
        alert(`El número está fuera del rango actual 
(-${currentRange} a ${currentRange}). El rango se puede modificar en 
el código.`); 
        return; 
    } 
     
    // Verificar si el punto ya existe (con tolerancia para errores de punto flotante) 
    const existingPoint = points.find(p => Math.abs(p.value - value) < 0.0001); 
    if (existingPoint) { 
        alert('Este número ya está en la recta numérica'); 
        return; 
    } 
     
    // Clasificar el número y agregarlo al array
    const classification = classifyNumber(value, input); 
     
    points.push({ 
        value: value, 
        originalInput: input, 
        classification: classification 
    }); 
     
    // Limpiar el input y actualizar la visualización 
    document.getElementById('numberInput').value = ''; 
    updateDisplay(); 
     
    console.log(`Número agregado: ${input} = ${value} 
(${classification})`); 
} 
 
function addPresetNumber(input) { 
    const value = parseNumber(input); 
     
    if (value === null || Math.abs(value) > currentRange) { 
        alert(`El número ${input} está fuera del rango actual`); 
        return; 
    } 
     
    // Verificar si el punto ya existe 
    const existingPoint = points.find(p => Math.abs(p.value - value) 
< 0.0001); 
    if (existingPoint) { 
        alert('Este número ya está en la recta numérica'); 
        return; 
    } 
     
    // Clasificar el número y agregarlo 
    const classification = classifyNumber(value, input); 
     
    points.push({ 
        value: value, 
        originalInput: input, 
        classification: classification
    }); 
     
    // Actualizar la visualización 
    updateDisplay(); 
     
    console.log(`Número predefinido agregado: ${input} = ${value} 
(${classification})`); 
} 
 
function clearAll() { 
    points = []; 
    updateDisplay(); 
    console.log('Todos los puntos eliminados'); 
} 
 
function updateDisplay() { 
    drawNumberLine(); 
    updatePointsList(); 
    updateDistanceSelectors(); 
} 
function drawNumberLine() {
    const lineContainer = document.getElementById("numberLine");
    lineContainer.innerHTML = "";

    // Línea base
    const line = document.createElement("div");
    line.className = "line";
    lineContainer.appendChild(line);

    // Marcas de -10 a 10
    for (let i = -currentRange; i <= currentRange; i++) {
        const tick = document.createElement("div");
        tick.className = "tick";

        // posición relativa
        const position = ((i + currentRange) / (2 * currentRange)) * 100;
        tick.style.left = position + "%";

        const label = document.createElement("div");
        label.className = "tick-label";
        label.textContent = i;
        label.style.left = position + "%";

        lineContainer.appendChild(tick);
        lineContainer.appendChild(label);
    }

    // Puntos agregados
    points.forEach(p => {
        const point = document.createElement("div");
        point.className = `number-point ${p.classification}`;
        const position = ((p.value + currentRange) / (2 * currentRange)) * 100;
        point.style.left = position + "%";

        const label = document.createElement("div");
        label.className = "point-label";
        label.textContent = p.originalInput;
        point.appendChild(label);

        lineContainer.appendChild(point);
    });
    function updatePointsList() {
    const pointsList = document.getElementById("pointsList");
    pointsList.innerHTML = "";

    points.forEach(p => {
        const div = document.createElement("div");
        div.className = "point-item";
        div.innerHTML = `<b>${p.originalInput}</b> = ${p.value.toFixed(3)}<br>
                         ${p.classification} (Posición: ${p.value.toFixed(3)})`;
        pointsList.appendChild(div);
    });
}
function updateDistanceSelectors() {
    const pointA = document.getElementById("pointA");
    const pointB = document.getElementById("pointB");

    pointA.innerHTML = "";
    pointB.innerHTML = "";

    points.forEach((p, index) => {
        const optionA = document.createElement("option");
        optionA.value = index;
        optionA.textContent = `${p.originalInput} (${p.value.toFixed(3)})`;
        pointA.appendChild(optionA);

        const optionB = document.createElement("option");
        optionB.value = index;
        optionB.textContent = `${p.originalInput} (${p.value.toFixed(3)})`;
        pointB.appendChild(optionB);
    });
}

// Evento para calcular distancia
document.getElementById("calculateDistance").addEventListener("click", () => {
    const pointA = document.getElementById("pointA").value;
    const pointB = document.getElementById("pointB").value;
    const result = document.getElementById("distanceResult");

    if (pointA === "" || pointB === "") {
        result.textContent = "Selecciona dos puntos.";
        return;
    }

    const valueA = points[pointA].value;
    const valueB = points[pointB].value;

    const distance = Math.abs(valueA - valueB);
    result.textContent = `d(A,B) = |${valueA.toFixed(3)} - ${valueB.toFixed(3)}| = ${distance.toFixed(3)}`;
});

}