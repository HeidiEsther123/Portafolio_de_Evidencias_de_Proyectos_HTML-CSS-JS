// actividad14/script.js

    // Utilidad para limpiar strings
function cleanString(str) {
    return str.replace(/\s+/g, '');
}

// --- PARTE 1: Solución de Ecuaciones de una Variable (x) ---

/**
 * Resuelve ecuaciones lineales de una variable usando álgebra simbólica
 */
function resolverEcuacionParseada() {
    const ecuacionStr = document.getElementById('ecuacion').value;
    const resBox = document.getElementById('resDespejeParseado');
    const errorBox = document.getElementById('mensajeError');

    resBox.innerHTML = '';
    errorBox.innerText = '';

    try {
        // Dividir por el signo igual
        const partes = ecuacionStr.split('=');
        if (partes.length !== 2) {
            throw new Error("La ecuación debe contener exactamente un signo '='");
        }

        const ladoIzq = partes[0].trim();
        const ladoDer = partes[1].trim();

        // Crear la ecuación en formato: lado_izquierdo - lado_derecho
        const ecuacionFormateada = `(${ladoIzq}) - (${ladoDer})`;

        // Parsear y simplificar
        const nodo = math.parse(ecuacionFormateada);
        const simplificado = math.simplify(nodo);

        // Resolver manualmente para x
        // Formato típico después de simplificar: ax + b = 0
        const coeficientes = extraerCoeficientes(simplificado.toString());
        const solucion = -coeficientes.b / coeficientes.a;

        // Mostrar resultado
        resBox.innerHTML = `
            <div class="formula-original">
                <strong>Ecuación Original:</strong> ${ecuacionStr}
            </div>
            <p><strong>Solución:</strong> x = ${solucion}</p>
            <p><strong>Ecuación Simplificada:</strong> ${simplificado.toString()} = 0</p>
        `;
    } catch (error) {
        errorBox.innerText = `Error: ${error.message}`;
    }
}

/**
 * Extrae coeficientes de una ecuación lineal simplificada
 */
function extraerCoeficientes(ecuacion) {
    // Eliminar espacios
    ecuacion = ecuacion.replace(/\s+/g, '');

    let a = 0; // Coeficiente de x
    let b = 0; // Término independiente

    // Buscar términos con x
    const regexX = /([+-]?\d*\.?\d*)\*?x/g;
    let match;
    while ((match = regexX.exec(ecuacion)) !== null) {
        let coef = match[1];
        if (coef === '' || coef === '+') coef = '1';
        if (coef === '-') coef = '-1';
        a += parseFloat(coef);
    }

    // Buscar términos constantes (sin x)
    const sinX = ecuacion.replace(/[+-]?\d*\.?\d*\*?x/g, '');
    if (sinX) {
        try {
            b = math.evaluate(sinX);
        } catch (e) {
            b = 0;
        }
    }

    return { a, b };
}

// --- PARTE 2: Despeje Simbólico de Fórmulas ---

/**
 * Extrae todas las variables únicas de una fórmula
 */
function extractVariables(formulaStr) {
    const matches = formulaStr.match(/[a-zA-Z][a-zA-Z0-9]*/g);
    if (!matches) return [];
    return Array.from(new Set(matches));
}

/**
 * Despeja una variable de una fórmula
 */
function despejarVariable(expresionOriginal, variableObjetivo, variableDespejada) {
    try {
        // Limpiar espacios
        let expresion = expresionOriginal.replace(/\s+/g, '');

        // CASO ESPECIAL: Expresiones con paréntesis tipo coef(var ± const)/div
        // Ejemplo: 5(F-32)/9, despejar F
        const patronComplejo = /(\d*\.?\d*)\(([a-zA-Z]+)\s*([+-])\s*(\d+\.?\d*)\)\s*\/\s*(\d+\.?\d*)/;
        const matchComplejo = expresion.match(patronComplejo);

        if (matchComplejo && matchComplejo[2] === variableObjetivo) {
            const coef1 = matchComplejo[1] || '1';
            const operador = matchComplejo[3];
            const constante = matchComplejo[4];
            const divisor = matchComplejo[5];

            const operadorInverso = operador === '-' ? '+' : '-';

            if (coef1 === '1') {
                return `(${variableDespejada}) * (${divisor}) ${operadorInverso} ${constante}`;
            } else {
                return `(${variableDespejada}) * (${divisor}) / (${coef1}) ${operadorInverso} ${constante}`;
            }
        }

        // CASO: Suma o resta simple
        // Ejemplo: 14 - pOH, despejar pOH -> pOH = 14 - pH
        if (expresion.includes('+') || expresion.includes('-')) {
            const resultado = despejarSumaResta(expresion, variableObjetivo, variableDespejada);
            if (resultado !== null) {
                return resultado;
            }
        }

        // CASO: División simple
        if (expresion.includes('/')) {
            const partes = dividirPorOperadorPrincipal(expresion, '/');
            const numerador = partes[0];
            const denominador = partes[1];

            // Verificar si la variable está en el numerador o denominador
            if (numerador.includes(variableObjetivo)) {
                // Variable en numerador
                if (numerador === variableObjetivo) {
                    // varObjetivo / denominador
                    return `(${variableDespejada}) * (${denominador})`;
                } else {
                    // Multiplicación en numerador: a*b*varObjetivo / denominador
                    const factoresNum = extraerFactoresMultiplicacion(numerador);
                    const otrosFactores = factoresNum.filter(f => f !== variableObjetivo);

                    if (otrosFactores.length === 0) {
                        return `(${variableDespejada}) * (${denominador})`;
                    } else {
                        return `(${variableDespejada}) * (${denominador}) / (${otrosFactores.join(' * ')})`;
                    }
                }
            } else if (denominador.includes(variableObjetivo)) {
                // Variable en denominador
                if (denominador === variableObjetivo) {
                    // numerador / varObjetivo
                    return `(${numerador}) / (${variableDespejada})`;
                } else {
                    // Multiplicación en denominador
                    const factoresDen = extraerFactoresMultiplicacion(denominador);
                    const otrosFactores = factoresDen.filter(f => f !== variableObjetivo);

                    if (otrosFactores.length === 0) {
                        return `(${numerador}) / (${variableDespejada})`;
                    } else {
                        return `(${numerador}) / ((${variableDespejada}) * (${otrosFactores.join(' * ')}))`;
                    }
                }
            }
        }

        // CASO: Multiplicación simple (sin división)
        if (expresion.includes('*')) {
            const factores = extraerFactoresMultiplicacion(expresion);
            const otrosFactores = factores.filter(f => f !== variableObjetivo);

            if (otrosFactores.length === 0) {
                return variableDespejada;
            } else if (otrosFactores.length === 1) {
                return `(${variableDespejada}) / (${otrosFactores[0]})`;
            } else {
                return `(${variableDespejada}) / (${otrosFactores.join(' * ')})`;
            }
        }

        // CASO: Variable sola
        if (expresion === variableObjetivo) {
            return variableDespejada;
        }

        return expresion;

    } catch (error) {
        return `Error: ${error.message}`;
    }
}

/**
 * Despeja una variable de una expresión con suma o resta
 */
function despejarSumaResta(expresion, variableObjetivo, variableDespejada) {
    // Parsear la expresión en términos
    const terminos = parsearTerminos(expresion);

    // Encontrar el término que contiene la variable objetivo
    let terminoConVariable = null;
    let otrosTerminos = [];

    for (const termino of terminos) {
        if (termino.texto.includes(variableObjetivo)) {
            terminoConVariable = termino;
        } else {
            otrosTerminos.push(termino);
        }
    }

    if (!terminoConVariable) {
        return null;
    }

    // Construir el despeje
    // Si tenemos: A = B + C - D, y queremos despejar C
    // Entonces: C = A - B + D

    let resultado = variableDespejada;

    for (const termino of otrosTerminos) {
        // Invertir el signo
        const signoInverso = termino.signo === '+' ? '-' : '+';
        resultado += ` ${signoInverso} ${termino.texto}`;
    }

    // Si el término con la variable tiene coeficiente o signo negativo
    if (terminoConVariable.texto !== variableObjetivo) {
        // Caso: tiene coeficiente (ej: 2*var)
        if (terminoConVariable.texto.includes('*')) {
            const partes = terminoConVariable.texto.split('*');
            const coef = partes.find(p => p !== variableObjetivo);
            resultado = `(${resultado}) / (${coef})`;
        }
    }

    // Si el signo era negativo, invertir todo
    if (terminoConVariable.signo === '-') {
        resultado = `-(${resultado})`;
    }

    return resultado;
}

/**
 * Parsea una expresión en términos con sus signos
 */
function parsearTerminos(expresion) {
    const terminos = [];
    let actual = '';
    let signo = '+';
    let nivel = 0;

    for (let i = 0; i < expresion.length; i++) {
        const char = expresion[i];

        if (char === '(') {
            nivel++;
            actual += char;
        } else if (char === ')') {
            nivel--;
            actual += char;
        } else if ((char === '+' || char === '-') && nivel === 0 && actual !== '') {
            terminos.push({ signo: signo, texto: actual });
            signo = char;
            actual = '';
        } else if ((char === '+' || char === '-') && nivel === 0 && actual === '') {
            signo = char;
        } else {
            actual += char;
        }
    }

    if (actual) {
        terminos.push({ signo: signo, texto: actual });
    }

    return terminos;
}

/**
 * Divide una expresión por el operador principal (respetando paréntesis)
 */
function dividirPorOperadorPrincipal(expresion, operador) {
    let nivel = 0;
    let ultimaPosicion = -1;

    // Buscar el operador al nivel 0 de paréntesis (de derecha a izquierda para división)
    for (let i = expresion.length - 1; i >= 0; i--) {
        const char = expresion[i];

        if (char === ')') {
            nivel++;
        } else if (char === '(') {
            nivel--;
        } else if (char === operador && nivel === 0) {
            ultimaPosicion = i;
            break;
        }
    }

    if (ultimaPosicion === -1) {
        return [expresion];
    }

    const parte1 = expresion.substring(0, ultimaPosicion);
    const parte2 = expresion.substring(ultimaPosicion + 1);

    return [parte1, parte2];
}

/**
 * Extrae factores de una multiplicación (respetando paréntesis)
 */
function extraerFactoresMultiplicacion(expresion) {
    const factores = [];
    let actual = '';
    let nivel = 0;

    for (let i = 0; i < expresion.length; i++) {
        const char = expresion[i];

        if (char === '(') {
            nivel++;
            actual += char;
        } else if (char === ')') {
            nivel--;
            actual += char;
        } else if (char === '*' && nivel === 0) {
            if (actual) {
                factores.push(actual);
                actual = '';
            }
        } else {
            actual += char;
        }
    }

    if (actual) {
        factores.push(actual);
    }

    return factores;
}

/**
 * Procesa la fórmula y genera todos los despejes posibles
 */
function procesarFormulaLiteral() {
    const formulaStr = document.getElementById('formulaLiteral').value;
    const resBox = document.getElementById('resFormulaLiteral');
    const errorBox = document.getElementById('mensajeErrorFormula');

    resBox.innerHTML = '';
    errorBox.innerText = '';

    try {
        // Dividir por el signo igual
        const partes = formulaStr.split('=');
        if (partes.length !== 2) {
            throw new Error("La fórmula debe contener exactamente un signo '='");
        }

        const ladoIzq = partes[0].trim();
        const ladoDer = partes[1].trim();

        // Extraer todas las variables
        const variables = extractVariables(formulaStr);

        if (variables.length < 2) {
            throw new Error("Se necesitan al menos 2 variables distintas en la fórmula");
        }

        // Construir tabla de despejes
        let htmlTable = `
            <div class="formula-original">
                <strong>Fórmula Original:</strong> ${formulaStr}
            </div>
            <p><strong>Variables detectadas:</strong> ${variables.join(', ')}</p>
            <table>
                <thead>
                    <tr>
                        <th>Variable Despejada</th>
                        <th>Fórmula Resultante</th>
                    </tr>
                </thead>
                <tbody>
        `;

        // Generar despeje para cada variable
        for (const variable of variables) {
            let formulaDespejada;

            // Si la variable está en el lado izquierdo, mostrar la fórmula original
            if (ladoIzq === variable) {
                formulaDespejada = `${variable} = ${ladoDer}`;
            } else {
                // Necesitamos despejar esta variable del lado derecho
                const resultado = despejarVariable(ladoDer, variable, ladoIzq);
                formulaDespejada = `${variable} = ${resultado}`;
            }

            htmlTable += `
                <tr>
                    <td><strong>${variable}</strong></td>
                    <td><pre>${formulaDespejada}</pre></td>
                </tr>
            `;
        }

        htmlTable += `
                </tbody>
            </table>
            <div class="nota-didactica">
                <strong>Nota:</strong> Los despejes son generados usando manipulación algebraica directa.
                Soporta suma, resta, multiplicación, división y expresiones con paréntesis.
            </div>
        `;

        resBox.innerHTML = htmlTable;

    } catch (error) {
        errorBox.innerText = `Error: ${error.message}`;
    }
}

// --- Inicialización ---
document.addEventListener('DOMContentLoaded', () => {
    // Inicializa con los ejemplos al cargar
    resolverEcuacionParseada();
});
