import { useEffect, useMemo, useState } from "react";

function formatearFecha(valor) {
  if (!valor) return "Sin fecha";
  const [soloFecha] = String(valor).split(" ");
  const fecha = new Date(`${soloFecha}T00:00:00`);
  if (Number.isNaN(fecha.getTime())) return String(valor);

  return fecha.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getFechaComparable(valor) {
  if (!valor) return "";
  const [soloFecha] = String(valor).split(" ");
  return soloFecha;
}

function getValorCampo(obj, claves = []) {
  for (const clave of claves) {
    const valor = obj?.[clave];
    if (valor !== undefined && valor !== null && String(valor).trim() !== "") {
      return valor;
    }
  }
  return "";
}

function getNombreEmpleado(reserva) {
  const nombre = getValorCampo(reserva, [
    "NombreEmpleado",
    "Empleado",
    "Nombre",
    "NombreUsuario",
    "Usuario",
    "Username",
    "UserName",
  ]);

  if (nombre) return String(nombre);
  if (reserva?.IdEmpleado) return `Sin nombre (ID ${reserva.IdEmpleado})`;
  return "Sin nombre";
}

export default function ReservasAdmin() {
  const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todas");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  useEffect(() => {
    const cargarReservas = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const resReservas = await fetch(`${API}/api/reservas/todas-enriquecidas`, { headers });

        if (!resReservas.ok) {
          const mensaje = await resReservas.text();
          throw new Error(`No se pudieron cargar reservas (${resReservas.status}): ${mensaje}`);
        }

        const dataReservas = await resReservas.json();
        const reservasBase = Array.isArray(dataReservas) ? dataReservas : [];

        const enriquecidas = reservasBase.map((reserva) => ({
          ...reserva,
          NombreEmpleadoVista: getNombreEmpleado(reserva),
          NombreArea: reserva?.NombreArea ?? reserva?.Area ?? null,
          NoPuesto:
            reserva?.NoPuesto ?? reserva?.NumeroPuesto ?? reserva?.Puesto ?? reserva?.IdPuestoTrabajo ?? null,
          NumeroPiso: reserva?.NumeroPiso ?? null,
        }));

        enriquecidas.sort((a, b) => {
          const fechaA = getFechaComparable(b?.FechaReserva);
          const fechaB = getFechaComparable(a?.FechaReserva);
          return String(fechaA).localeCompare(String(fechaB));
        });

        setReservas(enriquecidas);
      } catch (err) {
        setError(err.message || "Error al cargar reservas");
      } finally {
        setLoading(false);
      }
    };

    cargarReservas();
  }, [API]);

  const reservasFiltradas = useMemo(() => {
    const texto = filtroTexto.trim().toLowerCase();

    return reservas.filter((reserva) => {
      const fechaComparable = getFechaComparable(reserva?.FechaReserva);
      const estaActiva = Boolean(reserva?.ReservaActiva);

      if (filtroEstado === "activas" && !estaActiva) return false;
      if (filtroEstado === "canceladas" && estaActiva) return false;

      if (fechaInicio && fechaComparable < fechaInicio) return false;
      if (fechaFin && fechaComparable > fechaFin) return false;

      if (!texto) return true;

      const camposBusqueda = [
        reserva?.NombreEmpleadoVista,
        getValorCampo(reserva, ["IdEmpleado", "NombreUsuario"]),
        getValorCampo(reserva, ["NombreArea", "Area", "IdArea"]),
        getValorCampo(reserva, ["NoPuesto", "NumeroPuesto", "Puesto", "IdPuestoTrabajo"]),
        getValorCampo(reserva, ["IdEmpleadoPuestoTrabajo"]),
      ]
        .map((v) => String(v || "").toLowerCase())
        .join(" ");

      return camposBusqueda.includes(texto);
    });
  }, [reservas, filtroEstado, fechaInicio, fechaFin, filtroTexto]);

  const resumen = useMemo(() => {
    const porDia = new Map();
    let activas = 0;
    let canceladas = 0;

    for (const reserva of reservasFiltradas) {
      const fecha = getFechaComparable(reserva?.FechaReserva) || "Sin fecha";
      porDia.set(fecha, (porDia.get(fecha) || 0) + 1);

      if (reserva?.ReservaActiva) activas += 1;
      else canceladas += 1;
    }

    const dias = Array.from(porDia.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 7);

    return { total: reservasFiltradas.length, activas, canceladas, dias };
  }, [reservasFiltradas]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-white via-blue-50/70 to-indigo-50/60 p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">📅 Lista de Reservas</h1>
        <p className="text-sm text-gray-700 mt-1">
          Panel administrativo de reservas (hasta 5000), con filtros avanzados y visualización operativa por persona, área y estado.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs text-gray-500">Total filtrado</p>
          <p className="text-3xl font-semibold text-gray-900">{resumen.total}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs text-gray-500">Activas</p>
          <p className="text-3xl font-semibold text-emerald-700">{resumen.activas}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs text-gray-500">Canceladas</p>
          <p className="text-3xl font-semibold text-rose-700">{resumen.canceladas}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs text-gray-500">Días con reservas</p>
          <p className="text-3xl font-semibold text-indigo-700">{resumen.dias.length}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <h2 className="text-lg font-semibold text-gray-900">Filtros y detalle de reservas</h2>
          <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
            Datos en tiempo real
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            placeholder="Buscar por persona, área, puesto, ID reserva o ID empleado"
            className="md:col-span-2 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todas">Todas</option>
            <option value="activas">Activas</option>
            <option value="canceladas">Canceladas</option>
          </select>

          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Si no seleccionas rango de fechas, se muestran todas las reservas disponibles.
          </p>
          <button
            type="button"
            onClick={() => {
              setFiltroTexto("");
              setFiltroEstado("todas");
              setFechaInicio("");
              setFechaFin("");
            }}
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
          >
            Limpiar filtros
          </button>
        </div>

        <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-inner">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="text-left p-3 font-semibold">Fecha</th>
                <th className="text-left p-3 font-semibold">Persona</th>
                <th className="text-left p-3 font-semibold">Área</th>
                <th className="text-left p-3 font-semibold">Puesto</th>
                <th className="text-left p-3 font-semibold">Estado</th>
                <th className="text-left p-3 font-semibold">ID Reserva</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="p-4 text-gray-500" colSpan={6}>Cargando reservas...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td className="p-4 text-rose-600" colSpan={6}>{error}</td>
                </tr>
              ) : reservasFiltradas.length === 0 ? (
                <tr>
                  <td className="p-4 text-gray-500" colSpan={6}>No hay reservas con esos filtros.</td>
                </tr>
              ) : (
                reservasFiltradas.map((reserva, idx) => (
                  <tr
                    key={`${reserva?.IdEmpleadoPuestoTrabajo}-${reserva?.FechaReserva}-${idx}`}
                    className="border-t border-gray-100 odd:bg-white even:bg-gray-50/50"
                  >
                    <td className="p-3 text-gray-700">{formatearFecha(reserva?.FechaReserva)}</td>
                    <td className="p-3 text-gray-900">
                      <p className="font-medium">{reserva?.NombreEmpleadoVista || "Sin nombre"}</p>
                      <p className="text-xs text-gray-500">ID Empleado: {reserva?.IdEmpleado || "N/D"}</p>
                    </td>
                    <td className="p-3 text-gray-700">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {getValorCampo(reserva, ["NombreArea", "Area"]) || "Sin área"}
                      </span>
                    </td>
                    <td className="p-3 text-gray-700 font-medium">{(() => {
                      const puesto = getValorCampo(reserva, ["NoPuesto", "NumeroPuesto", "Puesto", "IdPuestoTrabajo"]);
                      return puesto ? `#${puesto}` : "Sin puesto";
                    })()}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          reserva?.ReservaActiva ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {reserva?.ReservaActiva ? "Activa" : "Cancelada"}
                      </span>
                    </td>
                    <td className="p-3 text-gray-500">{reserva?.IdEmpleadoPuestoTrabajo || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Reservas por día (últimos 7 días filtrados)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {resumen.dias.length === 0 ? (
            <p className="text-sm text-gray-500">No hay datos para mostrar.</p>
          ) : (
            resumen.dias.map(([fecha, cantidad]) => (
              <div key={fecha} className="rounded-xl border border-gray-200 p-3 bg-gray-50">
                <p className="text-xs text-gray-500">{formatearFecha(fecha)}</p>
                <p className="text-xl font-semibold text-gray-900">{cantidad}</p>
                <p className="text-xs text-gray-600">reservaciones</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
