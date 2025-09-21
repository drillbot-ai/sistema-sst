# Sistema de Gestión Integral SST para Transporte

Este repositorio contiene un prototipo de un sistema de gestión integral enfocado en seguridad y salud en el trabajo (SG‑SST), calidad, medio ambiente y SARLAFT para una empresa de transporte. El proyecto está organizado en tres partes:

* **backend/** – una API básica escrita en TypeScript con un servidor HTTP basado en Express que expone algunos recursos para vehículos, conductores y reportes de seguridad. Está estructurada siguiendo conceptos de NestJS (módulos, servicios y controladores) pero sin dependencias externas, por lo que funciona de forma independiente. La conexión a la base de datos se realiza mediante Prisma y un contenedor de PostgreSQL configurado en `docker‑compose.yml`.
* **frontend/** – una aplicación web construida con Next.js 15 y TypeScript. Utiliza tailwindcss y shadcn/ui para la interfaz y proporciona páginas para listar vehículos, registrar inspecciones y mostrar indicadores básicos.
* **mobile/** – un esqueleto de aplicación móvil usando React Native con Expo. Incluye un formulario sencillo que permite a los conductores enviar inspecciones diarias y novedades.

## Funcionalidades implementadas

* **Modelos de datos**: El esquema de Prisma define las entidades `Vehicle`, `Driver`, `Inspection`, `Accident`, `Poliza` y `Capacitacion`, permitiendo gestionar flota, conductores, inspecciones preoperacionales, mantenimientos, accidentes, pólizas de seguro y registros de capacitaciones de SST. 
* **Formularios digitales**: Se proporcionan páginas en el frontend para registrar inspecciones preoperacionales, mantenimientos y accidentes. La app móvil incluye un formulario simplificado de inspección que se conecta con la API mediante axios.
* **Indicadores clave**: El backend expone un endpoint `/api/metrics` que calcula conteos de accidentes, inspecciones, capacitaciones, pólizas y vehículos, así como una frecuencia básica de accidentalidad (accidentes/vehículos). En el frontend existe una vista de indicadores que consume este endpoint.
* **Generación de PDF**: Mediante pdfkit se genera un reporte PDF para cada accidente a través del endpoint `/api/reports/accident/:id`, facilitando la exportación de información normativa.
* **Conexión móvil/API**: La app móvil utiliza axios para enviar datos al servidor Express. Se define una constante `API_BASE_URL` para ajustar fácilmente la URL según el entorno (simulador, dispositivo físico o servidor desplegado).

### Nueva funcionalidad: autenticación y control de accesos (RBAC)

Se incorporó un mecanismo de autenticación basado en JWT:

* **Registro e inicio de sesión**: Nuevos endpoints `/api/auth/register` y `/api/auth/login` permiten crear usuarios y obtener un token. Se añadió la entidad `User` en la base de datos con roles `DRIVER`, `SUPERVISOR` y `MANAGER`.
* **Protección de rutas**: Algunas operaciones (creación de accidentes, pólizas y capacitaciones) exigen estar autenticado y disponer de permisos adecuados. La función `authenticate()` actúa como middleware y revisa el rol incluido en el token.
* **Gestión de sesión en el frontend**: Se añadió un `AuthProvider` en Next.js que gestiona el token en `localStorage`, provee login/logout y expone el usuario actual. Las páginas de formularios ahora requieren estar autenticado y envían el token en la cabecera `Authorization`.

### Gestión segura de sesiones con Refresh Tokens

Para evitar que las sesiones caduquen durante el uso, la autenticación se extendió con **refresh tokens**. Ahora el backend devuelve un token de actualización junto con el JWT de acceso al iniciar sesión. El frontend y la app móvil almacenan ambos valores y, antes de que expire el JWT, se comunican con `/api/auth/refresh` para obtener un nuevo par de tokens. La rotación segura revoca el refresh token anterior y genera uno nuevo en cada operación. También existe un endpoint `/api/auth/logout` para revocar el refresh token al cerrar sesión. La lógica de actualización automática está implementada en el `AuthProvider` del frontend y en la app móvil usando `AsyncStorage`.

### Validación robusta con Zod

Para cada endpoint crítico se definieron esquemas Zod que validan entradas (registro de usuarios, creación de pólizas y capacitaciones). Las respuestas con error incluyen detalles del esquema para facilitar la depuración.

### Almacenamiento de archivos en S3

La API incorpora `/api/polizas/presigned` que devuelve una URL prefirmada de Amazon S3 para subir documentos digitalizados de pólizas. La clave (`fileKey`) y URL (`fileUrl`) se pueden almacenar en la entidad `Poliza` para referenciar el archivo. Para utilizar esta función se deben configurar variables de entorno `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` y `AWS_S3_BUCKET` en el archivo `.env`.

### Pruebas automatizadas

* **Backend**: Se integró Vitest y Supertest. Los tests se localizan en `backend/tests/` y cubren la autenticación y la creación de pólizas.
* **Frontend**: Se añadió configuración básica de Playwright para pruebas end‑to‑end. Un test de ejemplo comprueba que la página de login se carga correctamente.

Ejecutar los tests:

```bash
# Backend
cd backend
npm test

# Frontend (requiere que la app esté corriendo en otra consola)
cd ../frontend
npx playwright test
```

Para simplificar la instalación en Windows se incluye un script `start.bat` en la raíz del proyecto que levanta la base de datos con Docker, instala las dependencias de cada paquete y arranca los servidores de desarrollo. Consulte la documentación en cada carpeta para más detalles sobre la estructura y funcionamiento.

### Nueva funcionalidad móvil

La app móvil ahora soporta **inicio de sesión** y muestra los formularios según el rol del usuario. Con el token JWT almacenado en `AsyncStorage` se pueden crear inspecciones (todos los roles) y accidentes (solo `SUPERVISOR` o `MANAGER`) directamente desde el teléfono. El estado de autenticación se mantiene entre sesiones.

Además, la aplicación móvil muestra un listado de los accidentes recientes y un botón para **descargar el reporte PDF** de cada uno utilizando el endpoint `/api/reports/accident/:id`. De esta forma, los conductores y supervisores pueden acceder a los informes desde su dispositivo.

### Paginación y filtros

Las rutas de listado (`/api/vehicles`, `/api/inspections`, `/api/accidents`, etc.) aceptan parámetros `limit`, `offset` y `search` para implementar **paginación y búsqueda**. El frontend incluye campos de búsqueda y botones “Anterior” y “Siguiente”. Ajuste `limit` en el código o a través de la URL para paginar de forma diferente.

### CI/CD con GitHub Actions y despliegue

Se agregó un workflow en `.github/workflows/ci.yml` que instala dependencias, genera el cliente Prisma, aplica migraciones (`npx prisma migrate deploy`) y ejecuta las pruebas. Esta configuración sirve como base para integraciones continuas y puede extenderse para desplegar automáticamente a **Fly.io** (usando `fly.toml` y el `Dockerfile` del backend) o a **Vercel** (para la parte frontend). Ajuste las credenciales y archivos de configuración según su entorno.

Para una configuración mínima en Fly.io, se proporciona un ejemplo de `fly.toml` que especifica el nombre de la app, la región y la ruta al `Dockerfile` del backend. Fly.io incluye certificados TLS automáticos cuando el dominio apunta a la aplicación. Para desplegar el frontend en Vercel, cree un proyecto desde el directorio `frontend/` y configure las variables de entorno necesarias (`NEXT_PUBLIC_API_BASE_URL`, etc.). Vercel genera certificados TLS automáticamente para los dominios `.vercel.app` y los personalizados.

### Documentación con Swagger y diagramas

Se integró **Swagger** mediante `swagger-ui-express` y `swagger-jsdoc`. La documentación se expone en `http://localhost:3001/api/docs`. Puede añadir anotaciones JSDoc en `src/main.ts` o modificar `src/swagger.ts` para ampliar el esquema. Además, se añadió un diagrama de arquitectura en formato Mermaid en `docs/architecture.mmd` para visualizar la relación entre los componentes (frontend, backend, móvil, base de datos y S3).
