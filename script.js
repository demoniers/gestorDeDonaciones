let tramiteDonaciones = [];
let tramiteDonacionesNuevas = [];
let organizaciones = [];
document.addEventListener("DOMContentLoaded", () => {
    fetch("http://localhost:3000/organizaciones")
        .then(response => {
        if (!response.ok) {
            throw new Error("Error al cargar las organizaciones");
        }
        return response.json();
        })
        .then(data => {
          organizaciones = data;
          mostrarOrganizaciones(data);
        })
    .catch(error => {
      console.error("Error en la carga:", error);
    });
    fetch("http://localhost:3000/tramiteDonacion")
      .then(response => {
        if (!response.ok) {
          throw new Error("Error al cargar los datos del trámite");
        }
        return response.json(); // Convierte la respuesta en JSON
      })
      .then(data => {
        tramiteDonaciones = data; // array que guarda los datos
        console.log(tramiteDonaciones)
        actualizarDonaciones();
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
      <img src="img/${org.nombre.replace(/[/\s]+/g, "_").toLowerCase()}.jpg" alt="${org.nombre}" data-id="${org.id}" onClick="añadirDonacion(${org.id})">
      <input type="number" min="0" step="0.01" placeholder="Cantidad a donar" id="donacion${org.id}">
      <p>${org.nombre}</p>
    `;

    contenedor.appendChild(tarjeta);
  });
}

function añadirDonacion(organizacion) {
  const donacion = parseFloat(document.getElementById('donacion'+organizacion).value);
  console.log(donacion+" Se a dona a "+organizacion);
  const fechaHoy = new Date();
  const mes =  (fechaHoy.getMonth()+1);
  const anio = fechaHoy.getFullYear();
  const fecha =  `${mes}/${anio}`;
  comprobarDonaciones(organizacion, donacion, fecha)
  document.getElementById('donacion'+organizacion).value = '';
  actualizarDonaciones();

}

function comprobarDonaciones(org, importe, fecha) {
  let tramite = tramiteDonaciones.find(t => t.fecha === fecha);

  if (tramite) {
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
  } else {
    const nuevoTramite = {
      id: tramiteDonaciones.length + 1,
      fecha: fecha,
      donaciones: [{
        idOrganizacion: org,
        importeTotal: importe,
        numDonaci: 1
      }]
    };
    tramiteDonaciones.push(nuevoTramite);
    tramiteDonacionesNuevas.push(nuevoTramite);
  }
}

function actualizarDonaciones() {
  const contenedor = document.getElementById("registro-donaciones");
  contenedor.innerHTML = ""; // Limpiamos para reconstruir

  // Ordenamos los trámites por fecha ascendente (puedes invertir si prefieres descendente)
  const tramitesOrdenados = [...tramiteDonacionesNuevas].sort((a, b) => {
    const [mesA, añoA] = a.fecha.split("/").map(Number);
    const [mesB, añoB] = b.fecha.split("/").map(Number);
    return añoA !== añoB ? añoA - añoB : mesA - mesB;
  });

  let nuevaUltimaOrgId = null;

  tramitesOrdenados.forEach(tramite => {
    // Añadimos encabezado de fecha
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

  // Resaltamos todas las líneas de la última organización donada
  document.querySelectorAll(".donacion-linea").forEach(el => {
    const id = parseInt(el.dataset.orgId);
    if (id === nuevaUltimaOrgId) {
      el.classList.add("resaltado");
    } else {
      el.classList.remove("resaltado");
    }
  });

  ultimaOrgId = nuevaUltimaOrgId;
  console.log("Actualizando apartado lateral");
}

function finalizarTramite() {
  const resumen = document.getElementById("resumen-final");
  resumen.innerHTML = "";

  const fechaHora = new Date();
  const fechaTexto = fechaHora.toLocaleString("es-ES");
  const pFecha = document.createElement("p");
  pFecha.textContent = `Trámite realizado el ${fechaTexto}`;
  resumen.appendChild(pFecha);

  const resumenOrg = [];
  let totalGlobal = 0;
  let totalDonaciones = 0;

  tramiteDonacionesNuevas.forEach(tramite => {
    tramite.donaciones.forEach(d => {
      let org = resumenOrg.find(o => o.id == d.idOrganizacion);
      if (!org) {
        resumenOrg.push({
          id: d.idOrganizacion,
          total: d.importeTotal,
          cantidad: d.numDonaciones
        });
      } else {
        org.total += d.importeTotal;
        org.cantidad += d.numDonaciones;
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
    const nombre = datos?.nombre || `Org ${org.id}`;
    const media = org.total / org.cantidad;

    const linea = document.createElement("p");
    linea.textContent = `${nombre}: ${org.cantidad} donaciones, media ${media.toFixed(2)}€, total ${Math.floor(org.total * 100) / 100}€`;
    resumen.appendChild(linea);

    totalGlobal += org.total;
    totalDonaciones += org.cantidad;

    if (datos.tipo === "personas") {
      alert(`${datos.nombre} trabaja con personas de ${datos.rangoEdad}. ${datos.acoge ? "Tramita acogidas." : "No tramita acogidas."}`);
    } else if (datos.tipo === "animales") {
      alert(`${datos.nombre} trabaja con ${datos.multiraza ? "todo tipo de animales" : "una raza concreta"} a nivel ${datos.ambito}.`);
    }
  });

  const pTotal = document.createElement("p");
  pTotal.textContent = `Aporte total: ${(Math.floor(totalGlobal * 100) / 100).toFixed(2)}€`;
  resumen.appendChild(pTotal);

  const pMedia = document.createElement("p");
  const mediaGlobal = totalGlobal / totalDonaciones;
  pMedia.textContent = `Aporte medio por donación: ${mediaGlobal.toFixed(3)}€`;
  resumen.appendChild(pMedia);

  // Mostrar el modal
  document.getElementById("modal-resumen").style.display = "block";

  // Enviar al backend
  fetch("http://localhost:3000/tramiteDonacion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tramiteDonacionesNuevas)
  })
  .then(response => {
    if (!response.ok) throw new Error("Error al guardar el trámite");
    console.log("Trámite enviado al backend");
  })
  .catch(error => {
    console.error("Error al enviar:", error);
  });

  // Reinicio automático tras 10 segundos
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
