@echo off
title RetailQE - Start System Under Test
echo ============================================
echo RetailQE System Under Test
echo Starting SQL Server, API and React Web App
echo ============================================
docker compose up --build
pause
