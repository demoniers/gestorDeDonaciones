let tramiteDonaciones = [];
let tramiteDonacionesNuevas = [];
let organizaciones = [];
let ultimaOrgId = null;

document.addEventListener("DOMContentLoaded", () => {
  fetch("http://localhost:3000/organizaciones")
    .then(response => {
      if (!response.ok) throw new Error("Error al cargar las organizaciones");
      return response.json();
    })
    .then(data => {
      organizaciones = data;
      mostrarOrganizaciones(data);
    })
    .catch(error => console.error("Error en la carga:", error));

  fetch("http://localhost:3000/tramiteDonacion")
    .then(response => {
      if (!response.ok) throw new Error("Error al cargar los datos del trámite");
      return response.json();
    })
    .then(data => {
      tramiteDonaciones = data;
      actualizarDonaciones();
    })
    .catch(error => console.error("Error en la carga:", error));
});

function mostrarOrganizaciones(lista) {
  const contenedor = document.querySelector(".zona-organizaciones");
  lista.forEach(org => {
    const tarjeta = document.createElement("div");
    tarjeta.classList.add("organizacion");
    tarjeta.innerHTML = `
      <img src="img/${org.nombre.replace(/[/\s]+/g, "_").toLowerCase()}.jpg" alt="${org.nombre}" data-id="${org.id}" onClick="añadirDonacion(${org.id})">
      <input type="number" min="0" step="0.01" placeholder="Cantidad a donar" id="donacion${org.id}">
      <p>${org.nombre}</p>
    `;
    contenedor.appendChild(tarjeta);
  });
}

function añadirDonacion(organizacion) {
  const input = document.getElementById('donacion' + organizacion);
  const donacion = parseFloat(input.value);
  if (isNaN(donacion) || donacion <= 0) return;

  const fechaHoy = new Date();
  const mes = fechaHoy.getMonth() + 1;
  const anio = fechaHoy.getFullYear();
  const fecha = `${mes}/${anio}`;

  comprobarDonaciones(organizacion, donacion, fecha);
  input.value = '';
  actualizarDonaciones();
}

function comprobarDonaciones(org, importe, fecha) {
  let tramite = tramiteDonaciones.find(t => t.fecha === fecha);
  if (!tramite) {
    tramite = {
      id: tramiteDonaciones.length + 1,
      fecha: fecha,
      donaciones: [{
        idOrganizacion: org,
        importeTotal: importe,
        numDonaciones: 1
      }]
    };
    tramiteDonaciones.push(tramite);
    tramiteDonacionesNuevas.push(tramite);
  } else {
    let donacion = tramite.donaciones.find(d => d.idOrganizacion === org);
    if (donacion) {
      donacion.numDonaciones += 1;
      donacion.importeTotal += importe;
    } else {
      tramite.donaciones.push({
        idOrganizacion: org,
        importeTotal: importe,
        numDonaciones: 1
      });
    }
    if (!tramiteDonacionesNuevas.find(t => t.fecha === fecha)) {
      tramiteDonacionesNuevas.push(tramite);
    }
  }
}

function actualizarDonaciones() {
  const contenedor = document.getElementById("registro-donaciones");
  contenedor.innerHTML = "";

  const tramitesOrdenados = [...tramiteDonacionesNuevas].sort((a, b) => {
    const [mesA, añoA] = a.fecha.split("/").map(Number);
    const [mesB, añoB] = b.fecha.split("/").map(Number);
    return añoA !== añoB ? añoA - añoB : mesA - mesB;
  });

  let nuevaUltimaOrgId = null;

  tramitesOrdenados.forEach(tramite => {
    const fechaTitulo = document.createElement("h4");
    fechaTitulo.textContent = `Donaciones de ${tramite.fecha}`;
    contenedor.appendChild(fechaTitulo);

    tramite.donaciones.forEach(donacion => {
      const org = organizaciones.find(o => o.id === donacion.idOrganizacion);
      if (!org) return;

      const linea = document.createElement("div");
      linea.textContent = `${org.nombre} ${donacion.importeTotal.toFixed(2)}€`;
      linea.classList.add("donacion-linea");
      linea.dataset.orgId = donacion.idOrganizacion;

      contenedor.appendChild(linea);
      nuevaUltimaOrgId = donacion.idOrganizacion;
    });
  });

  document.querySelectorAll(".donacion-linea").forEach(el => {
    const id = parseInt(el.dataset.orgId);
    el.classList.toggle("resaltado", id === nuevaUltimaOrgId);
  });

  ultimaOrgId = nuevaUltimaOrgId;
  console.log("Actualizando apartado lateral");
}

function finalizarTramite() {
  const resumen = document.getElementById("resumen-final");
  resumen.innerHTML = "";

  const fechaHora = new Date();
  const fechaTexto = fechaHora.toLocaleString("es-ES");
  resumen.appendChild(document.createElement("p")).textContent = `Trámite realizado el ${fechaTexto}`;

  const resumenOrg = [];
  let totalGlobal = 0;
  let totalDonaciones = 0;

  tramiteDonacionesNuevas.forEach(tramite => {
    tramite.donaciones.forEach(d => {
      if (!d || typeof d.idOrganizacion === "undefined") return;
      let org = resumenOrg.find(o => o.id === d.idOrganizacion);
      if (!org) {
        resumenOrg.push({
          id: d.idOrganizacion,
          totalActual: d.importeTotal,
          cantidadActual: d.numDonaciones
        });
      } else {
        org.totalActual += d.importeTotal;
        org.cantidadActual += d.numDonaciones;
      }
    });
  });

  resumenOrg.sort((a, b) => {
    const nombreA = organizaciones.find(o => o.id === a.id)?.nombre || "";
    const nombreB = organizaciones.find(o => o.id === b.id)?.nombre || "";
    return nombreB.localeCompare(nombreA);
  });

  resumenOrg.forEach(org => {
    const datos = organizaciones.find(o => o.id === org.id);
    if (!datos) return;

    const nombre = datos.nombre;
    const totalHistorico = tramiteDonaciones
      .flatMap(t => Array.isArray(t.donaciones) ? t.donaciones : [])
      .filter(d => d && d.idOrganizacion === org.id)
      .reduce((acc, d) => acc + (d.numDonaciones || 0), 0);

    const totalDonacionesOrg = totalHistorico + org.cantidadActual;
    const mediaActual = org.cantidadActual > 0 ? org.totalActual / org.cantidadActual : 0;

    resumen.appendChild(document.createElement("p")).textContent =
      `${nombre}: ${totalDonacionesOrg} donaciones, media ${mediaActual.toFixed(2)}€, total ${org.totalActual.toFixed(2)}€`;

    totalGlobal += org.totalActual;
    totalDonaciones += org.cantidadActual;

    const peculiaridades = document.createElement("p");
    peculiaridades.style.fontStyle = "italic";

    if (datos.tipo === "personas") {
      peculiaridades.textContent = `${nombre} trabaja con personas de ${datos.rangoEdad}. ${datos.acoge ? "Tramita acogidas." : "No tramita acogidas."}`;
    } else if (datos.tipo === "animales") {
      peculiaridades.textContent = `${nombre} trabaja con ${datos.multiraza ? "todo tipo de animales" : "una raza concreta"} a nivel ${datos.ambito}.`;
    }

    resumen.appendChild(peculiaridades);
  });

  resumen.appendChild(document.createElement("p")).textContent =
    `Aporte total: ${totalGlobal.toFixed(2)}€`;

  const mediaGlobal = totalDonaciones > 0 ? totalGlobal / totalDonaciones : 0;
  resumen.appendChild(document.createElement("p")).textContent =
    `Aporte medio por donación: ${mediaGlobal.toFixed(3)}€`;

  document.getElementById("modal-resumen").style.display = "block";

  fetch("http://localhost:3000/tramiteDonacion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tramiteDonacionesNuevas)
  })
    .then(response => {
      if (!response.ok) throw new Error("Error al guardar el trámite");
      console.log("Trámite enviado al backend");
      tramiteDonaciones = tramiteDonaciones.concat(tramiteDonacionesNuevas);
    })
    .catch(error => console.error("Error al enviar:", error));

  setTimeout(() => {
    document.getElementById("registro-donaciones").innerHTML = "";
    resumen.innerHTML = "";
    document.getElementById("modal-resumen").style.display = "none";
    tramiteDonacionesNuevas = [];
    ultimaOrgId = null;
    console.log("Trámite reiniciado");
  }, 10000);
}

function cerrarModal() {
  document.getElementById("modal-resumen").style.display = "none";
}