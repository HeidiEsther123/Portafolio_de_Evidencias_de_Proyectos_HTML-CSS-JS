   // Variables globales
let patternsData = null;
let conversionHistory = [];
let stats = {
    totalConversions: 0,
    satisfactoryConversions: 0,
    totalPatterns: 0,
    fileSize: 0,
    lastUpdate: null
};

// Patrones por defecto para comenzar
const defaultPatterns = {
    "patterns": [
        {
            "id": 1,
            "natural": "La suma de {var1} y {var2}",
            "algebraic": "{var1} + {var2}",
            "category": "operaciones_basicas"
        },
        {
            "id": 2,
            "natural": "La resta de {var1} y {var2}",
            "algebraic": "{var1} - {var2}",
            "category": "operaciones_basicas"
        },
        {
            "id": 3,
            "natural": "El producto de {var1} por {var2}",
            "algebraic": "{var1} × {var2}",
            "category": "operaciones_basicas"
        },
        {
            "id": 4,
            "natural": "El cociente de {var1} sobre {var2}",
            "algebraic": "{var1} ÷ {var2}",
            "category": "operaciones_basicas"
        },
        {
            "id": 5,
            "natural": "La suma de los cuadrados de {var1} y {var2}",
            "algebraic": "{var1}^2 + {var2}^2",
            "category": "combinadas"
        }
    ]
};

// InicializaciÃ³n cuando se carga la pÃ¡gina
document.addEventListener('DOMContentLoaded', function() {
    // Cargar patrones por defecto
    loadPatterns(defaultPatterns);
    
    // Configurar event listeners
    setupEventListeners();
    
    // Actualizar mÃ©tricas iniciales
    updateMetrics();
});

// Configurar todos los event listeners
function setupEventListeners() {
    // Botones de conversiÃ³n
    document.getElementById('convert-to-algebraic-btn').addEventListener('click', () => {
        convertNaturalToAlgebraic();
    });
    
    document.getElementById('convert-to-natural-btn').addEventListener('click', () => {
        convertAlgebraicToNatural();
    });
    
    // Botones de evaluaciÃ³n - Columna Natural
    document.getElementById('natural-satisfactory-btn').addEventListener('click', () => {
        markAsSatisfactory('natural');
    });
    
    document.getElementById('natural-improve-btn').addEventListener('click', () => {
        markForImprovement('natural');
    });
    
    document.getElementById('natural-add-pattern-btn').addEventListener('click', () => {
        showAddPatternDialog('natural');
    });
    
    // Botones de evaluaciÃ³n - Columna Algebraica
    document.getElementById('algebraic-satisfactory-btn').addEventListener('click', () => {
        markAsSatisfactory('algebraic');
    });
    
    document.getElementById('algebraic-improve-btn').addEventListener('click', () => {
        markForImprovement('algebraic');
    });
    
    document.getElementById('algebraic-add-pattern-btn').addEventListener('click', () => {
        showAddPatternDialog('algebraic');
    });
    
    // Manejo de archivos JSON
    document.getElementById('json-file-input').addEventListener('change', handleFileSelection);
    document.getElementById('load-json-btn').addEventListener('click', loadJSONFile);
    document.getElementById('reset-json-btn').addEventListener('click', resetToDefault);
    
    // Historial
    document.getElementById('clear-history-btn').addEventListener('click', clearHistory);
    document.getElementById('export-history-btn').addEventListener('click', exportHistory);
}

// FunciÃ³n para convertir lenguaje natural a algebraico
function convertNaturalToAlgebraic() {
    const input = document.getElementById('natural-input').value.trim();
    if (!input) {
        alert('Por favor, ingresa una expresión en lenguaje natural');
        return;
    }
    
    const result = processNaturalToAlgebraic(input);
    displayResult('natural', input, result);
    
    // Actualizar estadÃ­sticas
    stats.totalConversions++;
    addToHistory('natural-to-algebraic', input, result);
    updateMetrics();
}

// FunciÃ³n para convertir algebraico a lenguaje natural
function convertAlgebraicToNatural() {
    const input = document.getElementById('algebraic-input').value.trim();
    if (!input) {
        alert('Por favor, ingresa una expresión algebraica');
        return;
    }
    
    const result = processAlgebraicToNatural(input);
    displayResult('algebraic', input, result);
    
    // Actualizar estadÃ­sticas
    stats.totalConversions++;
    addToHistory('algebraic-to-natural', input, result);
    updateMetrics();
}

// Procesar conversiÃ³n de natural a algebraico
function processNaturalToAlgebraic(input) {
    if (!patternsData || !patternsData.patterns) {
        return "Error: No hay patrones cargados";
    }
    
    const normalizedInput = input.toLowerCase();
    
    // Buscar patrones que coincidan
    for (let pattern of patternsData.patterns) {
        const match = matchNaturalPattern(normalizedInput, pattern.natural);
        if (match.isMatch) {
            return substituteVariables(pattern.algebraic, match.variables);
        }
    }
    
    return "No se encontró un patrón coincidente. Considera agregar este caso a los patrones.";
}

// Procesar conversiÃ³n de algebraico a natural
function processAlgebraicToNatural(input) {
    if (!patternsData || !patternsData.patterns) {
        return "Error: No hay patrones cargados";
    }
    
    const normalizedInput = normalizeAlgebraicExpression(input);
    
    // Buscar patrones que coincidan
    for (let pattern of patternsData.patterns) {
        const match = matchAlgebraicPattern(normalizedInput, pattern.algebraic);
        if (match.isMatch) {
            return substituteVariables(pattern.natural, match.variables);
        }
    }
    
    return "No se encontró un patrón coincidente. Considera agregar este caso a los patrones.";
}

// FunciÃ³n para hacer coincidir patrones de lenguaje natural

function matchNaturalPattern(input, pattern) {
    // Convertir patrÃ³n a regex
    let regex = pattern.toLowerCase();
    const variables = {};
    let varCounter = 0;
    
    // Reemplazar variables con grupos de captura
    regex = regex.replace(/\{(\w+)\}/g, (match, varName) => {
        variables[varName] = varCounter++;
        return '([a-zA-Z0-9_]+)';
    });
    
    // Hacer que los espacios sean opcionales y flexibles
    regex = regex.replace(/\s+/g, '\\s*');
    regex = '^\\s*' + regex + '\\s*$';
    
    const regexPattern = new RegExp(regex);
    const match = input.match(regexPattern);
    
    if (match) {
        const extractedVars = {};
        for (let [varName, index] of Object.entries(variables)) {
            extractedVars[varName] = match[index + 1];
        }
        return { isMatch: true, variables: extractedVars };
    }
    
    return { isMatch: false, variables: {} };
}

function matchAlgebraicPattern(input, pattern) {
    let normalizedInput = normalizeAlgebraicExpression(input);
    let normalizedPattern = normalizeAlgebraicExpression(pattern);
    
    console.log('=== DEBUGGING MATCH ===');
    console.log('Pattern original:', pattern);
    console.log('Pattern normalizado:', normalizedPattern);
    console.log('Input normalizado:', normalizedInput);
    
    // Primero escapar caracteres especiales EXCEPTO las llaves
    let regex = normalizedPattern.replace(/[\+\-\*\^]/g, '\\$&');
    console.log('Después de escapar:', regex);
    
    // Luego reemplazar variables con grupos de captura
    const variables = {};
    let varCounter = 0;
    
    regex = regex.replace(/\{(\w+)\}/g, (match, varName) => {
        variables[varName] = varCounter++;
        console.log(`Variable encontrada: ${varName} en posición ${varCounter-1}`);
        return '([a-zA-Z0-9_]+)';
    });
    
    regex = '^\\s*' + regex + '\\s*$';
    
    console.log('Regex final:', regex);
    console.log('Variables mapeadas:', variables);
    
    const regexPattern = new RegExp(regex);
    const match = normalizedInput.match(regexPattern);
    
    console.log('Match result:', match);
    console.log('=== END DEBUG ===');
    
    if (match) {
        const extractedVars = {};
        for (let [varName, index] of Object.entries(variables)) {
            extractedVars[varName] = match[index + 1];
        }
        return { isMatch: true, variables: extractedVars };
    }
    
    return { isMatch: false, variables: {} };
}
function normalizeAlgebraicExpression(expr) {
    // Quita espacios alrededor de operadores y normaliza espacios
    return expr
        .replace(/\s+/g, '') // quita todos los espacios
        .replace(/([a-zA-Z])(?=[a-zA-Z])/g, '$1*') // opcional: x*y → x*y
        .trim();
}

function matchAlgebraicPattern(input, pattern) {
    let normalizedInput = normalizeAlgebraicExpression(input);
    let normalizedPattern = normalizeAlgebraicExpression(pattern);

    console.log('=== DEBUGGING MATCH ===');
    console.log('Pattern original:', pattern);
    console.log('Pattern normalizado:', normalizedPattern);
    console.log('Input original:', input);
    console.log('Input normalizado:', normalizedInput);

    const variables = {};
    let varCounter = 0;

    // Reemplazar variables con grupos de captura ANTES de escapar caracteres
    let regex = normalizedPattern.replace(/\{(\w+)\}/g, (match, varName) => {
        variables[varName] = varCounter++;
        console.log(`Variable encontrada: ${varName} en posición ${varCounter - 1}`);
        // Mejor regex: acepta negativos, decimales, fracciones, letras
        return '([+-]?[a-zA-Z0-9./]+)';
    });

    // Escapar caracteres especiales (después de capturas)
    regex = regex.replace(/[\+\-\*\^]/g, '\\$&');

    // Asegurar coincidencia completa
    regex = '^\\s*' + regex + '\\s*$';

    console.log('Regex final:', regex);
    console.log('Variables mapeadas:', variables);

    const regexPattern = new RegExp(regex);
    const match = normalizedInput.match(regexPattern);

    console.log('Match result:', match);
    console.log('=== END DEBUG ===');

    if (match) {
        const extractedVars = {};
        for (let [varName, index] of Object.entries(variables)) {
            extractedVars[varName] = match[index + 1];
        }
        return { isMatch: true, variables: extractedVars };
    }

    return { isMatch: false, variables: {} };
}
// Normalizar expresiones algebraicas
function normalizeAlgebraicExpression(expr) {
    return expr
        .replace(/\s+/g, '') // Quitar espacios
        .replace(/²/g, '^2') // Convertir ² a ^2 (no Â²)
        .replace(/³/g, '^3') // Convertir ³ a ^3 (no Â³)
        .replace(/\*/g, '×') // Normalizar multiplicación (no Ã—)
        .replace(/\//g, '÷') // Normalizar división (no Ã·)
        .toLowerCase();
}

// Sustituir variables en el patrÃ³n
function substituteVariables(template, variables) {
    let result = template;
    for (let [varName, value] of Object.entries(variables)) {
        const regex = new RegExp(`\\{${varName}\\}`, 'g');
        result = result.replace(regex, value);
    }
    return result;
}

// Mostrar resultado en la interfaz
function displayResult(column, input, result) {
    const resultSection = document.getElementById(`${column}-result`);
    const outputElement = document.getElementById(`${column}-output`);
    
    outputElement.textContent = result;
    resultSection.style.display = 'block';
}

// Marcar como satisfactorio
function markAsSatisfactory(column) {
    stats.satisfactoryConversions++;
    updateMetrics();
    
    // Feedback visual
    showFeedback(`Marcado como satisfactorio`, 'success');
    
    // Ocultar la secciÃ³n de resultado despuÃ©s de un tiempo
    setTimeout(() => {
        document.getElementById(`${column}-result`).style.display = 'none';
    }, 2000);
}

// Marcar para mejora
function markForImprovement(column) {
    showFeedback('Marcado para mejora. Considera agregar un nuevo patrón.', 'warning');
}

// Mostrar diÃ¡logo para agregar patrÃ³n
function showAddPatternDialog(column) {
    const input = document.getElementById(`${column === 'natural' ? 'natural' : 'algebraic'}-input`).value;
    const output = document.getElementById(`${column}-output`).textContent;
    
    const naturalText = column === 'natural' ? input : output;
    const algebraicText = column === 'natural' ? output : input;
    
    const newNatural = prompt('Expresión en lenguaje natural:', naturalText);
    if (!newNatural) return;
    
    const newAlgebraic = prompt('Expresión algebraica:', algebraicText);
    if (!newAlgebraic) return;
    
    const category = prompt('Categoría­a (opcional):', 'personalizado') || 'personalizado';
    
    addNewPattern(newNatural, newAlgebraic, category);
}

// Agregar nuevo patrÃ³n
function addNewPattern(natural, algebraic, category = 'personalizado') {
    if (!patternsData) {
        patternsData = { patterns: [] };
    }
    
    const newId = Math.max(...patternsData.patterns.map(p => p.id || 0), 0) + 1;
    const newPattern = {
        id: newId,
        natural: natural,
        algebraic: algebraic,
        category: category
    };
    
    patternsData.patterns.push(newPattern);
    stats.totalPatterns = patternsData.patterns.length;
    updateMetrics();
    
    showFeedback(`Nuevo patrón agregado: "${natural}" - "${algebraic}"`, 'success');
}

// Cargar patrones
function loadPatterns(data) {
    patternsData = data;
    stats.totalPatterns = data.patterns ? data.patterns.length : 0;
    stats.lastUpdate = new Date().toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
    updateMetrics();
}

// Manejar selecciÃ³n de archivo
function handleFileSelection() {
    const fileInput = document.getElementById('json-file-input');
    const fileName = document.getElementById('file-name');
    const loadButton = document.getElementById('load-json-btn');
    
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        fileName.textContent = file.name;
        stats.fileSize = Math.round(file.size / 1024);
        loadButton.disabled = false;
    } else {
        fileName.textContent = 'Ningún archivo seleccionado';
        stats.fileSize = 0;
        loadButton.disabled = true;
    }
    updateMetrics();
}

// Cargar archivo JSON
function loadJSONFile() {
    const fileInput = document.getElementById('json-file-input');
    if (fileInput.files.length === 0) {
        alert('Por favor, selecciona un archivo JSON');
        return;
    }
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const jsonData = JSON.parse(e.target.result);
            
            // Validar estructura del JSON
            if (!jsonData.patterns || !Array.isArray(jsonData.patterns)) {
                throw new Error('El archivo JSON debe tener una propiedad "patterns" que sea un array');
            }
            
            loadPatterns(jsonData);
            showFeedback(`Archivo cargado exitosamente: ${file.name}`, 'success');
            
        } catch (error) {
            alert(`Error al cargar el archivo: ${error.message}`);
        }
    };
    
    reader.readAsText(file);
}

// Resetear a patrones por defecto
function resetToDefault() {
    if (confirm('¿Estás seguro de que quieres resetear a los patrones por defecto?')) {
        loadPatterns(defaultPatterns);
        stats.fileSize = 0;
        document.getElementById('file-name').textContent = 'Ningún archivo seleccionado';
        document.getElementById('json-file-input').value = '';
        showFeedback('Patrones reseteados a valores por defecto', 'info');
    }
}

// Agregar al historial
function addToHistory(type, input, output) {
    const historyItem = {
        timestamp: new Date().toLocaleString('es-ES'),
        type: type,
        input: input,
        output: output
    };
    
    conversionHistory.unshift(historyItem); // Agregar al inicio
    if (conversionHistory.length > 50) { // Limitar historial
        conversionHistory.pop();
    }
    
    updateHistoryDisplay();
}

// Actualizar visualizaciÃ³n del historial
function updateHistoryDisplay() {
    const historyContainer = document.getElementById('conversion-history');
    
    if (conversionHistory.length === 0) {
        historyContainer.innerHTML = '<p class="no-history">No hay conversiones realizadas aún</p>';
        return;
    }
    
    const historyHTML = conversionHistory.map(item => `
        <div class="history-item">
            <div class="history-header">
                <span class="history-type">${item.type === 'natural-to-algebraic' ? 'Natural a Algebraico' : 'Algebraico a Natural'}</span>
                <span class="history-timestamp">${item.timestamp}</span>
            </div>
            <div class="history-content">
                <div><strong>Entrada:</strong> ${item.input}</div>
                <div><strong>Resultado:</strong> ${item.output}</div>
            </div>
        </div>
    `).join('');
    
    historyContainer.innerHTML = historyHTML;
}

// Limpiar historial
function clearHistory() {
    if (confirm('¿Estás seguro de que quieres limpiar el historial?')) {
        conversionHistory = [];
        updateHistoryDisplay();
        showFeedback('Historial limpiado', 'info');
    }
}

// Exportar historial
function exportHistory() {
    if (conversionHistory.length === 0) {
        alert('No hay historial para exportar');
        return;
    }
    
    const dataStr = JSON.stringify(conversionHistory, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `historial_conversiones_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showFeedback('Historial exportado exitosamente', 'success');
}

// Actualizar mÃ©tricas en la interfaz
function updateMetrics() {
    document.getElementById('total-patterns').textContent = stats.totalPatterns;
    document.getElementById('file-size').textContent = stats.fileSize > 0 ? `${stats.fileSize} KB` : '0 KB';
    document.getElementById('conversions-count').textContent = stats.totalConversions;
    
    // Calcular tasa de satisfacciÃ³n
    const satisfactionRate = stats.totalConversions > 0 
        ? Math.round((stats.satisfactoryConversions / stats.totalConversions) * 100)
        : 0;
    document.getElementById('satisfaction-rate').textContent = `${satisfactionRate}%`;
    
    document.getElementById('last-update').textContent = stats.lastUpdate || '--';
    
    // Calcular complejidad promedio
    const avgComplexity = calculateAverageComplexity();
    document.getElementById('avg-complexity').textContent = avgComplexity;
}

// Calcular complejidad promedio
function calculateAverageComplexity() {
    if (!patternsData || !patternsData.patterns || patternsData.patterns.length === 0) {
        return 0;
    }
    
    const totalWords = patternsData.patterns.reduce((sum, pattern) => {
        const wordCount = pattern.natural.split(' ').length;
        return sum + wordCount;
    }, 0);
    
    return Math.round(totalWords / patternsData.patterns.length);
}

// Mostrar feedback al usuario
function showFeedback(message, type = 'info') {
    // Crear elemento de feedback si no existe
    let feedbackElement = document.getElementById('feedback-message');
    if (!feedbackElement) {
        feedbackElement = document.createElement('div');
        feedbackElement.id = 'feedback-message';
        feedbackElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem;
            border-radius: 4px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(feedbackElement);
    }
    
    // Configurar estilos segÃºn el tipo
    const colors = {
        'success': '#10b981',
        'error': '#ef4444',
        'warning': '#f59e0b',
        'info': '#3b82f6'
    };
    
    feedbackElement.style.backgroundColor = colors[type] || colors['info'];
    feedbackElement.textContent = message;
    feedbackElement.style.opacity = '1';
    
    // Ocultar despuÃ©s de 3 segundos
    setTimeout(() => {
        feedbackElement.style.opacity = '0';
    }, 3000);
}

