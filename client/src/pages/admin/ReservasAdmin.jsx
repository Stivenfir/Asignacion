import { useEffect, useMemo, useRef, useState } from "react";

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

const COLUMNAS = [
  { key: "FechaReserva", label: "Fecha", sortable: true },
  { key: "Persona", label: "Persona", sortable: true },
  { key: "NombreArea", label: "Área", sortable: true },
  { key: "NoPuesto", label: "Puesto", sortable: true },
  { key: "ReservaActiva", label: "Estado", sortable: true },
  { key: "IdEmpleadoPuestoTrabajo", label: "ID Reserva", sortable: true },
];

export default function ReservasAdmin() {
  const API = import.meta.env.VITE_API_URL || "http://localhost:3000";
  const [reservas, setReservas] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exportando, setExportando] = useState(false);

  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todas");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [sortBy, setSortBy] = useState("FechaReserva");
  const [sortDir, setSortDir] = useState("desc");
  const [columnasVisibles, setColumnasVisibles] = useState(() =>
    Object.fromEntries(COLUMNAS.map((c) => [c.key, true])),
  );

  const indicePuestosRef = useRef(null);

  const construirIndicePuestos = async (headers) => {
    if (indicePuestosRef.current) return indicePuestosRef.current;

    const indice = new Map();
    const resPisos = await fetch(`${API}/api/pisos`, { headers });
    const pisos = resPisos.ok ? await resPisos.json() : [];

    for (const piso of Array.isArray(pisos) ? pisos : []) {
      const idPiso = Number(piso?.IDPiso);
      if (!idPiso) continue;

      const resAreas = await fetch(`${API}/api/areas/piso/${idPiso}`, { headers });
      if (!resAreas.ok) continue;

      const areas = await resAreas.json();
      const listaAreas = Array.isArray(areas) ? areas : [];

      const puestosAreas = await Promise.all(
        listaAreas
          .filter((a) => a?.IdAreaPiso)
          .map((a) => fetch(`${API}/api/puestos/area/${a.IdAreaPiso}`, { headers }).then((r) => (r.ok ? r.json() : []))),
      );

      for (let i = 0; i < listaAreas.length; i += 1) {
        const area = listaAreas[i];
        const puestos = Array.isArray(puestosAreas[i]) ? puestosAreas[i] : [];
        for (const puesto of puestos) {
          const idPuesto = Number(puesto?.IdPuestoTrabajo);
          if (!idPuesto || indice.has(idPuesto)) continue;
          indice.set(idPuesto, {
            NombreArea: area?.NombreArea ?? null,
            NoPuesto: puesto?.NoPuesto ?? puesto?.NumeroPuesto ?? puesto?.Puesto ?? null,
          });
        }
      }
    }

    indicePuestosRef.current = indice;
    return indice;
  };

  const enriquecer = async (items, headers) => {
    const indice = await construirIndicePuestos(headers);

    return (Array.isArray(items) ? items : []).map((reserva) => {
      const info = indice.get(Number(reserva?.IdPuestoTrabajo));
      return {
        ...reserva,
        NombreEmpleadoVista: getNombreEmpleado(reserva),
        NombreArea: reserva?.NombreArea ?? reserva?.Area ?? info?.NombreArea ?? null,
        NoPuesto:
          reserva?.NoPuesto ?? reserva?.NumeroPuesto ?? reserva?.Puesto ?? info?.NoPuesto ?? reserva?.IdPuestoTrabajo ?? null,
      };
    });
  };

  const cargarReservas = async ({ page = meta.page, pageSize = meta.pageSize } = {}) => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const qs = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        search: filtroTexto,
        estado: filtroEstado,
        fechaInicio,
        fechaFin,
        sortBy,
        sortDir,
      });

      const res = await fetch(`${API}/api/reservas/todas-paginadas?${qs.toString()}`, { headers });
      if (!res.ok) throw new Error(`No se pudieron cargar reservas (${res.status})`);

      const payload = await res.json();
      const enriquecidas = await enriquecer(payload?.items || [], headers);
      setReservas(enriquecidas);
      setMeta(payload?.meta || { page: 1, pageSize: 20, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || "Error al cargar reservas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarReservas({ page: 1, pageSize: meta.pageSize });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEstado, fechaInicio, fechaFin, sortBy, sortDir]);

  useEffect(() => {
    const t = setTimeout(() => {
      cargarReservas({ page: 1, pageSize: meta.pageSize });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroTexto]);

  const resumen = useMemo(() => {
    let activas = 0;
    let canceladas = 0;
    for (const reserva of reservas) {
      if (reserva?.ReservaActiva) activas += 1;
      else canceladas += 1;
    }
    return { total: meta.total || 0, activas, canceladas };
  }, [reservas, meta.total]);

  const columnasActivas = COLUMNAS.filter((c) => columnasVisibles[c.key]);

  const toggleSort = (campo) => {
    if (sortBy === campo) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(campo);
    setSortDir("asc");
  };

  const obtenerTodoParaExportar = async () => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    const acumulado = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
      const qs = new URLSearchParams({
        page: String(page),
        pageSize: "200",
        search: filtroTexto,
        estado: filtroEstado,
        fechaInicio,
        fechaFin,
        sortBy,
        sortDir,
      });
      const res = await fetch(`${API}/api/reservas/todas-paginadas?${qs.toString()}`, { headers });
      if (!res.ok) throw new Error("No fue posible obtener datos para exportar");
      const payload = await res.json();
      totalPages = payload?.meta?.totalPages || 1;
      const enriquecidas = await enriquecer(payload?.items || [], headers);
      acumulado.push(...enriquecidas);
      page += 1;
    }

    return acumulado;
  };

  const exportar = async (tipo) => {
    try {
      setExportando(true);
      const data = await obtenerTodoParaExportar();
      const filas = data.map((r) => ({
        Fecha: formatearFecha(r?.FechaReserva),
        Persona: r?.NombreEmpleadoVista || "Sin nombre",
        "ID Empleado": r?.IdEmpleado || "N/D",
        Área: getValorCampo(r, ["NombreArea", "Area"]) || "Sin área",
        Puesto: getValorCampo(r, ["NoPuesto", "NumeroPuesto", "Puesto", "IdPuestoTrabajo"]) || "Sin puesto",
        Estado: r?.ReservaActiva ? "Activa" : "Cancelada",
        "ID Reserva": r?.IdEmpleadoPuestoTrabajo || "-",
      }));

      const headers = Object.keys(filas[0] || {});
      const rowsCsv = [headers.join(",")]
        .concat(
          filas.map((row) =>
            headers
              .map((h) => `"${String(row[h] ?? "").replaceAll('"', '""')}"`)
              .join(","),
          ),
        )
        .join("\n");

      const rowsTsv = [headers.join("\t")]
        .concat(
          filas.map((row) => headers.map((h) => String(row[h] ?? "")).join("\t")),
        )
        .join("\n");

      const contenido = tipo === "csv" ? rowsCsv : rowsTsv;
      const blob = new Blob([contenido], {
        type:
          tipo === "csv"
            ? "text/csv;charset=utf-8;"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reservas_filtradas_${Date.now()}.${tipo === "csv" ? "csv" : "xlsx"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || "Error al exportar");
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-white via-blue-50/70 to-indigo-50/60 p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">📅 Lista de Reservas</h1>
        <p className="text-sm text-gray-700 mt-1">Paginación server-side, orden dinámico y exportación con filtros aplicados.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"><p className="text-xs text-gray-500">Total filtrado</p><p className="text-3xl font-semibold">{resumen.total}</p></div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"><p className="text-xs text-gray-500">Activas (página)</p><p className="text-3xl font-semibold text-emerald-700">{resumen.activas}</p></div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"><p className="text-xs text-gray-500">Canceladas (página)</p><p className="text-3xl font-semibold text-rose-700">{resumen.canceladas}</p></div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <input value={filtroTexto} onChange={(e) => setFiltroTexto(e.target.value)} placeholder="Buscar" className="md:col-span-2 px-3 py-2 rounded-lg border border-gray-300" />
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300"><option value="todas">Todas</option><option value="activas">Activas</option><option value="canceladas">Canceladas</option></select>
          <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300" />
          <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300" />
          <select value={meta.pageSize} onChange={(e) => cargarReservas({ page: 1, pageSize: Number(e.target.value) })} className="px-3 py-2 rounded-lg border border-gray-300"><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option><option value={100}>100</option></select>
        </div>

        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {COLUMNAS.map((col) => (
              <button key={col.key} type="button" onClick={() => setColumnasVisibles((prev) => ({ ...prev, [col.key]: !prev[col.key] }))} className={`px-2 py-1 text-xs rounded-full border ${columnasVisibles[col.key] ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                {columnasVisibles[col.key] ? "👁" : "🙈"} {col.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => exportar("csv")} disabled={exportando} className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm">Exportar CSV</button>
            <button type="button" onClick={() => exportar("xlsx")} disabled={exportando} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm">Exportar XLSX</button>
          </div>
        </div>

        <div className="overflow-x-auto border border-gray-200 rounded-xl">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                {columnasActivas.map((col) => (
                  <th key={col.key} className="text-left p-3 font-semibold">
                    <button type="button" onClick={() => col.sortable && toggleSort(col.key === "Persona" ? "NombreEmpleado" : col.key)} className="inline-flex items-center gap-1">
                      {col.label} {sortBy === (col.key === "Persona" ? "NombreEmpleado" : col.key) ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="p-4 text-gray-500" colSpan={columnasActivas.length}>Cargando reservas...</td></tr>
              ) : error ? (
                <tr><td className="p-4 text-rose-600" colSpan={columnasActivas.length}>{error}</td></tr>
              ) : reservas.length === 0 ? (
                <tr><td className="p-4 text-gray-500" colSpan={columnasActivas.length}>No hay reservas con esos filtros.</td></tr>
              ) : (
                reservas.map((r, idx) => (
                  <tr key={`${r?.IdEmpleadoPuestoTrabajo}-${idx}`} className="border-t border-gray-100 odd:bg-white even:bg-gray-50/50">
                    {columnasVisibles.FechaReserva && <td className="p-3">{formatearFecha(r?.FechaReserva)}</td>}
                    {columnasVisibles.Persona && <td className="p-3"><p className="font-medium">{r?.NombreEmpleadoVista || "Sin nombre"}</p><p className="text-xs text-gray-500">ID: {r?.IdEmpleado || "N/D"}</p></td>}
                    {columnasVisibles.NombreArea && <td className="p-3">{getValorCampo(r, ["NombreArea", "Area"]) || "Sin área"}</td>}
                    {columnasVisibles.NoPuesto && <td className="p-3">{getValorCampo(r, ["NoPuesto", "NumeroPuesto", "Puesto", "IdPuestoTrabajo"]) || "Sin puesto"}</td>}
                    {columnasVisibles.ReservaActiva && <td className="p-3">{r?.ReservaActiva ? "Activa" : "Cancelada"}</td>}
                    {columnasVisibles.IdEmpleadoPuestoTrabajo && <td className="p-3">{r?.IdEmpleadoPuestoTrabajo || "-"}</td>}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-600">Página {meta.page} de {meta.totalPages} · {meta.total} registros</p>
          <div className="flex gap-2">
            <button type="button" disabled={loading || meta.page <= 1} onClick={() => cargarReservas({ page: meta.page - 1, pageSize: meta.pageSize })} className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50">Anterior</button>
            <button type="button" disabled={loading || meta.page >= meta.totalPages} onClick={() => cargarReservas({ page: meta.page + 1, pageSize: meta.pageSize })} className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50">Siguiente</button>
          </div>
        </div>
      </div>
    </div>
  );
}
