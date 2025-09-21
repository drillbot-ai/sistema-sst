@echo off
setlocal EnableExtensions
set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"

echo Iniciando base de datos (Docker)...
pushd "%ROOT%"
docker-compose up -d
IF ERRORLEVEL 1 (
  echo Error al iniciar Docker. ¿Docker Desktop está ejecutándose?
  goto end
)
popd

echo Backend: instalando dependencias y generando Prisma
pushd "%BACKEND%"
IF NOT EXIST .env IF EXIST .env.example copy .env.example .env > NUL
IF NOT EXIST node_modules ( npm install )
npx prisma generate
npx prisma db push
start "SST Backend" cmd /k "cd /d "%BACKEND%" && npm run dev"
popd

echo Frontend: preparando e iniciando
pushd "%FRONTEND%"
IF NOT EXIST node_modules ( npm install )
start "SST Frontend" cmd /k "cd /d "%FRONTEND%" && npm run dev"
popd

start "Abrir Navegador" cmd /c "timeout /t 4 >nul && start http://localhost:3000"

echo Listo. Backend en http://localhost:3001, Frontend en http://localhost:3000

:end