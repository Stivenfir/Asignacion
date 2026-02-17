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
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="rounded-3xl border border-amber-200 bg-gradient-to-br from-white via-amber-50 to-orange-100 p-8 shadow-lg"
      >
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <motion.div
            animate={{ rotate: [0, -8, 8, -5, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 1.2 }}
            className="w-16 h-16 rounded-2xl bg-white border border-amber-200 shadow-sm flex items-center justify-center text-3xl"
          >
            {config.icono}
          </motion.div>

          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{config.titulo}</h1>
            <p className="mt-3 text-gray-700 leading-relaxed">{config.descripcion}</p>

            <div className="mt-5 flex items-center gap-3">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 text-sm font-semibold border border-amber-200">
                🚧 Próximamente
              </span>
              <div className="flex items-center gap-1.5">
                <motion.span
                  className="w-2.5 h-2.5 rounded-full bg-amber-500"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.1, repeat: Infinity, delay: 0 }}
                />
                <motion.span
                  className="w-2.5 h-2.5 rounded-full bg-amber-500"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.1, repeat: Infinity, delay: 0.2 }}
                />
                <motion.span
                  className="w-2.5 h-2.5 rounded-full bg-amber-500"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.1, repeat: Infinity, delay: 0.4 }}
                />
              </div>
            </div>

            <div className="mt-6 grid sm:grid-cols-3 gap-3">
              {[
                "Mejoras de experiencia",
                "Ajustes de seguridad",
                "Liberación próxima",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-amber-200 bg-white/80 px-3 py-2 text-sm text-gray-700"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
