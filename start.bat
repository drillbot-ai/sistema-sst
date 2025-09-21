@echo off
REM Script de arranque para el sistema SST en Windows
REM Ejecuta la base de datos, el backend y el frontend en ventanas separadas.

echo Preparando el entorno del Sistema SG‑SST...

REM 1. Verificar archivo de entorno. Si no existe .env en backend, copiar ejemplo
IF NOT EXIST backend\.env (
  echo Copiando archivo .env de ejemplo...
  copy backend\.env.example backend\.env > NUL
)

REM 2. Reiniciar la base de datos de Docker.
REM Intenta detener y eliminar cualquier contenedor previo asociado a este docker-compose
call docker-compose down --remove-orphans > NUL 2>&1
REM Levantar nuevamente la base de datos
docker-compose up -d
IF ERRORLEVEL 1 (
  echo Error al iniciar Docker. ¿Tiene Docker instalado y en ejecución?
  GOTO end
)

REM 3. Instalar dependencias y generar prisma en el backend
pushd backend
IF NOT EXIST node_modules (
  echo Instalando dependencias del backend...
  call npm install
)

IF EXIST prisma\schema.prisma (
  echo Generando cliente Prisma...
  call npx prisma generate
  echo Aplicando migraciones de Prisma...
  call npx prisma migrate deploy
)
popd

REM 4. Instalar dependencias del frontend
pushd frontend
IF NOT EXIST node_modules (
  echo Instalando dependencias del frontend...
  call npm install
)
popd

REM 5. Lanzar servidores en nuevas ventanas de consola
echo Iniciando servicios...
start "SST Backend" cmd /k "cd backend && npm run dev"
start "SST Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Sistema iniciado correctamente.
echo El backend se ejecuta en http://localhost:3001 y el frontend en http://localhost:3000
echo Para detener los servicios presione Ctrl+C en cada ventana o ejecute docker-compose down.

:end
echo.
echo Presione cualquier tecla para cerrar esta ventana...
pause > nul