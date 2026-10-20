@echo off
title RetailQE - Reset System Under Test
echo ==================================================
echo WARNING: This deletes the local RetailQE DB volume
echo and recreates the training environment from seed.
echo ==================================================
set /p confirm=Type RESET to continue: 
if /I not "%confirm%"=="RESET" (
    echo Reset cancelled.
    pause
    exit /b
)
docker compose down -v
docker compose up --build
pause
