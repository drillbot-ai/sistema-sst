@echo off
REM Script de arranque para el sistema SST en Windows
REM Ejecuta DB (Docker), backend y frontend en ventanas separadas y maneja limpieza previa.
chcp 65001 > NUL

setlocal ENABLEDELAYEDEXPANSION
title Start SG-SST
echo Preparando el entorno del Sistema SG-SST...

REM 0. Terminar procesos Node que puedan bloquear puertos/archivos
echo Cerrando procesos Node residuales...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force"

REM 1. Liberar puertos comunes (3002 backend, 3000/3001 frontend)
echo Liberando puertos 3002, 3001 y 3000 si estan en uso...
for %%P in (3002 3001 3000) do (
  powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $p=(Get-NetTCPConnection -State Listen -LocalPort %%P -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess; if ($p) { Write-Host 'Matando PID' $p 'en puerto' %%P; Stop-Process -Id $p -Force -ErrorAction SilentlyContinue } } catch { }"
)

REM 2. Verificar archivo .env del backend
IF NOT EXIST backend\.env (
  IF EXIST backend\.env.example (
    echo Copiando archivo .env de ejemplo...
    copy /Y backend\.env.example backend\.env > NUL
  ) ELSE (
    echo Advertencia: backend\.env no existe y no hay .env.example. Continuando...
  )
)

REM 3. Base de datos con Docker
echo Reiniciando servicios de Docker...
call docker-compose down --remove-orphans > NUL 2>&1
docker-compose up -d
IF ERRORLEVEL 1 (
  echo Error al iniciar Docker. Asegurese de tener Docker Desktop ejecutandose.
  GOTO end
)
echo Esperando a que la base de datos este lista...
REM breve espera para permitir readiness del contenedor DB
timeout /t 3 /nobreak > NUL

REM 4. Backend: instalar deps, Prisma y seed
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
  echo Cargando datos iniciales - seed ...
  call npm run db:seed
)
popd

REM 5. Frontend: instalar deps y limpiar cache .next (evitar EPERM en Windows)
pushd frontend
IF NOT EXIST node_modules (
  echo Instalando dependencias del frontend...
  call npm install
)
echo Limpiando cache frontend (rimraf .next)...
call npm run clean 2> NUL
popd

REM 6. Lanzar servidores en nuevas ventanas
echo Iniciando servicios...
REM Backend: compilar y arrancar en puerto 3002
start "SST Backend" cmd /k "title SST Backend && cd backend && set PORT=3002 && npm run build && npm start"
REM Frontend: Next dev en puerto 3000
start "SST Frontend" cmd /k "title SST Frontend && cd frontend && set PORT=3000 && set NEXT_TELEMETRY_DISABLED=1 && set NODE_OPTIONS= && npm run dev:clean"

echo.
echo Sistema iniciado.
echo - Backend:  http://localhost:3002
echo - Frontend: http://localhost:3000 (si 3000 ocupado, Next usara el siguiente disponible)
echo Para detener, cierre las ventanas del Backend/Frontend y ejecute: docker-compose down

:end
echo.
echo Presione cualquier tecla para cerrar esta ventana...
pause > nul
endlocal