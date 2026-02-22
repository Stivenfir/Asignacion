import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const modulos = {
  "/admin/asignaciones": {
    titulo: "Re-asignar Puestos",
    icono: "🔄",
    descripcion:
      "Estamos afinando este módulo para que puedas reasignar puestos con trazabilidad, reglas y mejor control operativo.",
  },
  "/admin/parametros": {
    titulo: "Parametrización",
    icono: "⚙️",
    descripcion:
      "Este módulo está en mantenimiento para habilitar una configuración más completa y segura del sistema.",
  },
};

const chips = [
  "Mejoras de experiencia",
  "Ajustes de seguridad",
  "Optimización de rendimiento",
  "Liberación próxima",
];

export default function ModuloEnMantenimiento() {
  const location = useLocation();

  const config = useMemo(
    () =>
      modulos[location.pathname] || {
        titulo: "Módulo en mantenimiento",
        icono: "🛠️",
        descripcion: "Estamos trabajando en este módulo. Vuelve pronto para ver novedades.",
      },
    [location.pathname],
  );

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative overflow-hidden rounded-3xl border border-amber-200/80 bg-gradient-to-br from-white via-amber-50 to-orange-100 p-8 shadow-xl"
      >
        <motion.div
          aria-hidden
          className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-amber-300/20 blur-2xl"
          animate={{ scale: [1, 1.12, 1], x: [0, -18, 0], y: [0, 14, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="absolute -bottom-24 -left-20 w-80 h-80 rounded-full bg-orange-300/20 blur-2xl"
          animate={{ scale: [1, 1.08, 1], x: [0, 22, 0], y: [0, -12, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-start gap-6">
          <div className="relative">
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.12, 0.35] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-2xl bg-amber-400/50"
            />

            <motion.div
              animate={{ rotate: [0, -10, 10, -6, 0] }}
              transition={{ duration: 2.1, repeat: Infinity, repeatDelay: 0.8 }}
              className="relative w-16 h-16 rounded-2xl bg-white border border-amber-200 shadow-md flex items-center justify-center text-3xl"
            >
              {config.icono}
            </motion.div>
          </div>

          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{config.titulo}</h1>
            <p className="mt-3 text-gray-700 leading-relaxed">{config.descripcion}</p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 text-sm font-semibold border border-amber-200">
                🚧 Próximamente
              </span>

              <div className="relative h-2 w-44 rounded-full bg-amber-100 overflow-hidden border border-amber-200">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                  animate={{ width: ["28%", "72%", "48%"] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute inset-y-0 w-12 bg-white/40 blur-[2px]"
                  animate={{ x: [-20, 190] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                />
              </div>
            </div>

            <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {chips.map((item, i) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i + 0.1 }}
                  whileHover={{ y: -2, scale: 1.01 }}
                  className="rounded-xl border border-amber-200 bg-white/80 px-3 py-2 text-sm text-gray-700 shadow-sm"
                >
                  {item}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
