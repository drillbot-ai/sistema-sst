export type SidebarItem = { href: string; label: string };
export type SidebarGroup = { title: string; items: SidebarItem[] };

export function getDefaultSidebarGroups(): SidebarGroup[] {
  return [
    {
      title: 'Dashboard',
      items: [ { href: '/metrics', label: 'Dashboard' } ],
    },
    {
      title: 'Operaciones',
      items: [
        { href: '/', label: 'Vehículos' },
        { href: '/inspecciones', label: 'Inspecciones' },
        { href: '/mantenimientos', label: 'Mantenimientos' },
        { href: '/accidentes', label: 'Accidentes' },
        { href: '/polizas', label: 'Pólizas' },
        { href: '/capacitaciones', label: 'Capacitaciones' },
        { href: '/contratistas', label: 'Contratistas' },
        { href: '/formularios', label: 'Formularios' },
      ],
    },
    {
      title: 'Compras',
      items: [
        { href: '/compras', label: 'Resumen' },
        { href: '/compras/proveedores', label: 'Proveedores' },
        { href: '/compras/ordenes', label: 'Órdenes de compra' },
        { href: '/compras/requisiciones', label: 'Requisiciones' },
        { href: '/compras/inventario', label: 'Inventario' },
        { href: '/compras/facturas', label: 'Facturas' },
      ],
    },
    {
      title: 'RRHH',
      items: [
        { href: '/rrhh', label: 'Resumen' },
        { href: '/rrhh/empleados', label: 'Empleados' },
        { href: '/rrhh/nomina', label: 'Nómina' },
        { href: '/rrhh/contratos', label: 'Contratos' },
        { href: '/rrhh/ausentismo', label: 'Ausentismo' },
        { href: '/rrhh/evaluaciones', label: 'Evaluaciones' },
      ],
    },
    {
      title: 'HSE',
      items: [
        { href: '/hse', label: 'Resumen' },
        { href: '/hse/matriz-riesgos', label: 'Matriz de riesgos' },
        { href: '/hse/indicadores', label: 'Indicadores' },
        { href: '/hse/planes-accion', label: 'Planes de acción' },
        { href: '/hse/documentos', label: 'Documentos' },
      ],
    },
    {
      title: 'Alta Gerencia',
      items: [
        { href: '/gerencia', label: 'Tablero ejecutivo' },
        { href: '/gerencia/kpi', label: 'KPI estratégicos' },
        { href: '/gerencia/informes', label: 'Informes' },
        { href: '/gerencia/auditorias', label: 'Auditorías' },
        { href: '/gerencia/cumplimiento', label: 'Cumplimiento' },
      ],
    },
    {
      title: 'Ajustes',
      items: [
        { href: '/ajustes', label: 'Configuración de la empresa' },
        { href: '/ajustes/estilos', label: 'Estilos' },
        { href: '/ajustes/modulos', label: 'Módulos' },
        { href: '/ajustes/numeracion', label: 'Numeración' },
        { href: '/ajustes/seguridad', label: 'Seguridad' },
        { href: '/ajustes/localizacion', label: 'Localización' },
        { href: '/ajustes/backup', label: 'Backup y reset' },
        { href: '/ajustes/integraciones', label: 'Integraciones' },
        { href: '/ajustes/notificaciones', label: 'Notificaciones' },
        { href: '/ajustes/auditoria', label: 'Auditoría' },
        { href: '/ajustes/plantillas', label: 'Plantillas' },
        { href: '/ajustes/automatizaciones', label: 'Automatizaciones' },
        { href: '/ajustes/avanzado', label: 'Avanzado' },
      ],
    },
  ];
}
