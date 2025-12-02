
function convertir() {
    const r = parseFloat(document.getElementById("r").value);
    const theta = parseFloat(document.getElementById("theta").value);

    if (isNaN(r) || isNaN(theta)) {
        document.getElementById("resultado").innerText = "Por favor ingrese valores válidos.";
        return;
    }

    // Conversión a radianes
    const rad = theta * Math.PI / 180;

    // Forma exponencial: r·e^{iθ}
    const resultado = `${r.toFixed(4)} · e^{i(${rad.toFixed(4)})}`;

    document.getElementById("resultado").innerText = resultado;
}
