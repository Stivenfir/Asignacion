import { useMemo } from "react";
import { useLocation } from "react-router-dom";

const modulos = {
  "/admin/asignaciones": {
    titulo: "Re-asignar Puestos",
    icono: "🔄",
    descripcion:
      "Estamos preparando este módulo para que puedas reasignar puestos con reglas y trazabilidad completa.",
  },
  "/admin/parametros": {
    titulo: "Parametrización",
    icono: "⚙️",
    descripcion:
      "Este módulo está en mantenimiento para habilitar configuración avanzada del sistema.",
  },
};

export default function ModuloEnMantenimiento() {
  const location = useLocation();

  const config = useMemo(() => {
    return (
      modulos[location.pathname] || {
        titulo: "Módulo en mantenimiento",
        icono: "🛠️",
        descripcion: "Estamos trabajando en este módulo. Vuelve pronto para ver novedades.",
      }
    );
  }, [location.pathname]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-white via-amber-50 to-orange-50 p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="text-4xl">{config.icono}</div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{config.titulo}</h1>
            <p className="mt-2 text-gray-700">{config.descripcion}</p>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 text-sm font-medium">
              <span>🚧</span>
              <span>Próximamente</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
