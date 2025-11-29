const mensaje = document.getElementById('mensaje');
const charCount = document.querySelector('.char-count');
const matrizMensaje = document.getElementById('matrizMensaje');
const k11 = document.getElementById('k11');
const k12 = document.getElementById('k12');
const k21 = document.getElementById('k21');
const k22 = document.getElementById('k22');
const btnEncriptar = document.getElementById('encriptar');
const btnDesencriptar = document.getElementById('desencriptar');
const resultado = document.getElementById('resultado');

// Actualizar contador de caracteres
mensaje.addEventListener('input', () => {
    const len = mensaje.value.length;
    charCount.textContent = `${len}/30`;
    mostrarMatrizMensaje();
});

// Mostrar matriz del mensaje
function mostrarMatrizMensaje() {
    const texto = mensaje.value.toUpperCase().replace(/[^A-Z]/g, '');
    
    if (texto.length === 0) {
        matrizMensaje.textContent = 'Escribe un mensaje primero...';
        return;
    }
    
    const valores = texto.split('').map(char => char.charCodeAt(0) - 65);
    
    // Agrupar en pares
    let matriz = '[';
    for (let i = 0; i < valores.length; i += 2) {
        if (i > 0) matriz += ' ';
        matriz += '[' + valores[i];
        if (i + 1 < valores.length) {
            matriz += ', ' + valores[i + 1];
        } else {
            matriz += ', 23'; // Padding con 'X'
        }
        matriz += ']';
    }
    matriz += ']';
    
    matrizMensaje.textContent = matriz;
}

// Función de encriptación Hill
btnEncriptar.addEventListener('click', () => {
    // Validar inputs
    const key = [
        [parseInt(k11.value) || 0, parseInt(k12.value) || 0],
        [parseInt(k21.value) || 0, parseInt(k22.value) || 0]
    ];
    
    if (key[0][0] === 0 && key[0][1] === 0 && key[1][0] === 0 && key[1][1] === 0) {
        resultado.textContent = 'Error: Ingresa una matriz clave válida';
        resultado.classList.add('error');
        return;
    }
    
    const texto = mensaje.value.toUpperCase().replace(/[^A-Z]/g, '');
    
    if (texto.length === 0) {
        resultado.textContent = 'Error: Ingresa un mensaje';
        resultado.classList.add('error');
        return;
    }
    
    // Calcular determinante
    const det = (key[0][0] * key[1][1] - key[0][1] * key[1][0]) % 26;
    
    if (det === 0) {
        resultado.textContent = 'Error: La matriz no es invertible (determinante = 0)';
        resultado.classList.add('error');
        return;
    }
    
    // Convertir texto a números
    let numeros = texto.split('').map(char => char.charCodeAt(0) - 65);
    
    // Agregar padding si es impar
    if (numeros.length % 2 !== 0) {
        numeros.push(23); // 'X'
    }
    
    // Encriptar
    let encriptado = '';
    for (let i = 0; i < numeros.length; i += 2) {
        const v1 = numeros[i];
        const v2 = numeros[i + 1];
        
        const c1 = (key[0][0] * v1 + key[0][1] * v2) % 26;
        const c2 = (key[1][0] * v1 + key[1][1] * v2) % 26;
        
        encriptado += String.fromCharCode(65 + c1);
        encriptado += String.fromCharCode(65 + c2);
    }

    resultado.classList.remove('error');
    resultado.textContent = encriptado;
});

// Función de desencriptación Hill
btnDesencriptar.addEventListener('click', () => {
    const key = [
        [parseInt(k11.value) || 0, parseInt(k12.value) || 0],
        [parseInt(k21.value) || 0, parseInt(k22.value) || 0]
    ];

    const texto = resultado.textContent.toUpperCase().replace(/[^A-Z]/g, '');

    if (!texto) {
        resultado.textContent = 'Error: No hay texto cifrado';
        resultado.classList.add('error');
        return;
    }

    let det = (key[0][0] * key[1][1] - key[0][1] * key[1][0]) % 26;
    if (det < 0) det += 26;

    const inversos = [1,27,9,19,5,21,0,15,0,3,0,0,0,0,0,0,0,23,0,11,0,0,0,0,0,0];
    const detInv = inversos[det];

    if (!detInv) {
        resultado.textContent = 'Error: No existe inversa del determinante';
        resultado.classList.add('error');
        return;
    }

    const invKey = [
        [( key[1][1] * detInv) % 26, (-key[0][1] * detInv) % 26],
        [(-key[1][0] * detInv) % 26, ( key[0][0] * detInv) % 26]
    ];

    for (let i = 0; i < 2; i++)
        for (let j = 0; j < 2; j++)
            if (invKey[i][j] < 0) invKey[i][j] += 26;

    let nums = texto.split('').map(c => c.charCodeAt(0) - 65);
    let dec = '';

    for (let i = 0; i < nums.length; i += 2) {
        const p1 = (invKey[0][0] * nums[i] + invKey[0][1] * nums[i + 1]) % 26;
        const p2 = (invKey[1][0] * nums[i] + invKey[1][1] * nums[i + 1]) % 26;

        dec += String.fromCharCode(65 + p1);
        dec += String.fromCharCode(65 + p2);
    }

    resultado.classList.remove('error');
    resultado.textContent = dec;
});

