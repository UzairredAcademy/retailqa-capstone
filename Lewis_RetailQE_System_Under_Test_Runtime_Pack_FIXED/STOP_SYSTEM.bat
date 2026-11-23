@echo off
title RetailQE - Stop System Under Test
echo Stopping RetailQE containers...
docker compose down
echo Done.
pause
