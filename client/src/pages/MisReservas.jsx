// client/src/pages/MisReservas.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useReservas } from "./hooks/useReservas";
import ReservasSidebar from "./components/reservas/ReservasSidebar";
import ReservasPanel from "./components/reservas/ReservasPanel";
import ConfirmacionReservaModal from "./components/reservas/ConfirmacionReservaModal";
import VisualizarPuestoModal from "./components/reservas/VisualizarPuestoModal";
import MapaReservaModal from "./components/reservas/MapaReservaModal";
import AyudaReservas from "./components/reservas/AyudaReservas";

export default function MisReservas() {
  const navigate = useNavigate();
  const reservasData = useReservas();
  const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const [modalConfirmacion, setModalConfirmacion] = useState(false);
  const [reservaPendiente, setReservaPendiente] = useState(null);
  const [modalVisualizacion, setModalVisualizacion] = useState(false);
  const [modalMapaReserva, setModalMapaReserva] = useState(false);
  const [reservaMapaSeleccionada, setReservaMapaSeleccionada] = useState(null);

  const reservasActivas = reservasData.reservas.filter((r) => r.ReservaActiva).length;

  const handleSolicitarReserva = async (fechaSeleccionada) => {
    try {
      if (!reservasData.pisoSeleccionado?.IDPiso) {
        reservasData.setMensaje({
          tipo: "error",
          texto: "✗ Debes seleccionar un piso primero",
        });
        return;
      }

      const token = localStorage.getItem("token");
      const fechaFormateada = new Date(fechaSeleccionada)
        .toISOString()
        .split("T")[0];
      const url = `${API}/api/reservas/disponibles/${fechaFormateada}?idPiso=${reservasData.pisoSeleccionado.IDPiso}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const puestosDisponibles = await res.json();
      if (!puestosDisponibles || puestosDisponibles.length === 0) {
        reservasData.setMensaje({
          tipo: "error",
          texto: "✗ No hay puestos disponibles en tu piso para esa fecha",
        });
        return;
      }

      const puestoAsignado = puestosDisponibles[0];

      setReservaPendiente({
        fecha: fechaSeleccionada,
        puestoAsignado,
        pisoSeleccionado: reservasData.pisoSeleccionado,
      });

      setModalConfirmacion(true);
    } catch (error) {
      console.error("Error al solicitar reserva:", error);
      reservasData.setMensaje({
        tipo: "error",
        texto: `✗ ${error.message}`,
      });
    }
  };

  const handleConfirmarReserva = async () => {
    try {
      if (!reservaPendiente?.puestoAsignado?.IdPuestoTrabajo) {
        throw new Error("No se pudo obtener el ID del puesto");
      }

      if (!reservaPendiente?.fecha) {
        throw new Error("No se pudo obtener la fecha de reserva");
      }

      const token = localStorage.getItem("token");
      const fechaFormateada =
        reservaPendiente.fecha instanceof Date
          ? reservaPendiente.fecha.toISOString().split("T")[0]
          : reservaPendiente.fecha;

      const res = await fetch(`${API}/api/reservas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          idPuestoTrabajo: Number(
            reservaPendiente.puestoAsignado.IdPuestoTrabajo,
          ),
          fecha: fechaFormateada,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al crear la reserva");
      }

      reservasData.setMensaje({
        tipo: "success",
        texto: "✓ Reserva creada exitosamente",
      });

      setModalConfirmacion(false);
      setReservaPendiente(null);

      await reservasData.cargarDatos();
    } catch (error) {
      console.error("Error al confirmar reserva:", error);
      reservasData.setMensaje({
        tipo: "error",
        texto: `✗ ${error.message}`,
      });
    }
  };

  const handleVerMapa = () => {
    setModalVisualizacion(true);
  };


  const handleVerMapaReserva = (reserva) => {
    if (!reserva) return;

    const pisoReserva = reservasData.pisos.find((piso) => {
      if (reserva.IdPiso != null) {
        return String(piso.IDPiso) === String(reserva.IdPiso);
      }
      if (reserva.NumeroPiso != null) {
        return String(piso.NumeroPiso) === String(reserva.NumeroPiso);
      }
      return false;
    }) || null;

    setReservaMapaSeleccionada({
      ...reserva,
      __pisoSeleccionado: pisoReserva,
    });
    setModalMapaReserva(true);
  };


  if (reservasData.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
      <header className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        <div className="px-4 md:px-6 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                📋 Mis Reservas
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Gestiona tus reservas de puestos de trabajo
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                  🧭 Piso activo: {reservasData.pisoSeleccionado ? `Piso ${reservasData.pisoSeleccionado.NumeroPiso}` : "Sin seleccionar"}
                </span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                  ✅ Reservas activas: {reservasActivas}
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              ← Volver
            </button>
          </div>
        </div>
      </header>


      {reservasData.pisos.length === 0 && (
        <div className="mt-4 p-4 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-800">
          <p className="font-medium">
            ⚠️ No se encontraron pisos con puestos disponibles para reservar.
          </p>
        </div>
      )}

      {["global", "all-pisos"].includes(reservasData.scopePisos) && reservasData.pisos.length > 0 && (
        <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800">
          <p className="font-medium">
            ℹ️ No encontramos configuración completa por área, así que te mostramos pisos disponibles para que puedas reservar.
          </p>
        </div>
      )}

            <AnimatePresence>
      {reservasData.mensaje && (
        <motion.div
          key={reservasData.mensaje.texto}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={`mt-4 p-4 rounded-xl ${
            reservasData.mensaje.tipo === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          <p className="font-medium">{reservasData.mensaje.texto}</p>
        </motion.div>
      )}
      </AnimatePresence>

      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mt-4"
      >
        {/* ✅ AGREGAR: Componente de ayuda contextual */}
        <AyudaReservas
          pisos={reservasData.pisos}
          onSeleccionarPiso={reservasData.setPisoSeleccionado}
          scopePisos={reservasData.scopePisos}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ReservasSidebar
            pisos={reservasData.pisos}
            pisoSeleccionado={reservasData.pisoSeleccionado}
            onSeleccionarPiso={reservasData.setPisoSeleccionado}
            scopePisos={reservasData.scopePisos}
          />

          <ReservasPanel
            pisoSeleccionado={reservasData.pisoSeleccionado}
            reservas={reservasData.reservas}
            loadingReservas={reservasData.loadingReservas}
            onSolicitarReserva={handleSolicitarReserva}
            onCancelarReserva={reservasData.cancelarReserva}
            onVerMapaReserva={handleVerMapaReserva}
          />
        </div>
      </motion.main>

      {modalConfirmacion && reservaPendiente && (
        <ConfirmacionReservaModal
          pisoSeleccionado={reservaPendiente.pisoSeleccionado}
          fechaSeleccionada={reservaPendiente.fecha}
          puestoAsignado={reservaPendiente.puestoAsignado}
          onConfirmar={handleConfirmarReserva}
          onVerMapa={handleVerMapa}
          onCancelar={() => {
            setModalConfirmacion(false);
            setReservaPendiente(null);
          }}
        />
      )}

      {modalVisualizacion && reservaPendiente && (
        <VisualizarPuestoModal
          puestoAsignado={reservaPendiente.puestoAsignado}
          pisoSeleccionado={reservaPendiente.pisoSeleccionado}
          onClose={() => setModalVisualizacion(false)}
        />
      )}

      {modalMapaReserva && reservaMapaSeleccionada && (
        <MapaReservaModal
          reserva={reservaMapaSeleccionada}
          pisoSeleccionado={reservaMapaSeleccionada.__pisoSeleccionado || null}
          areaAsignada={{
            NombreArea: reservaMapaSeleccionada.NombreArea || "Área asignada",
            IdArea: reservaMapaSeleccionada.IdArea || null,
          }}
          onClose={() => {
            setModalMapaReserva(false);
            setReservaMapaSeleccionada(null);
          }}
        />
      )}

      </div>
    </div>
  );
}
