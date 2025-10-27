document.addEventListener("DOMContentLoaded", () => {
    fetch("http://localhost:3000/organizaciones")
        .then(response => {
        if (!response.ok) {
            throw new Error("Error al cargar las organizaciones");
        }
        return response.json();
        })
        .then(data => {
        mostrarOrganizaciones(data);
        })
    .catch(error => {
      console.error("Error en la carga:", error);
    });
});
function mostrarOrganizaciones(lista) {
    console.log(lista);
  const contenedor = document.querySelector(".zona-organizaciones");

  lista.forEach(org => {
    const tarjeta = document.createElement("div");
    tarjeta.classList.add("organizacion");

    tarjeta.innerHTML = `
      <img src="img/${org.nombre.replace(/\s+/g, "_").toLowerCase()}.jpg" alt="${org.nombre}" data-id="${org.id}">
      <input type="number" min="0" step="0.01" placeholder="Cantidad a donar">
      <p>${org.nombre}</p>
    `;

    contenedor.appendChild(tarjeta);
  });
}
