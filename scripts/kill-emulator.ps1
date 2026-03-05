# scripts/kill-emulator.ps1
# Busca los PID que usan los puertos de los emuladores de Firebase y pregunta antes de detenerlos.

$ports = @(8080, 9099, 9199, 4000)
$totalKilled = 0

foreach ($port in $ports) {
    Write-Host "`n🔍 Buscando procesos en el puerto $port..." -ForegroundColor Cyan
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    
    if (-not $connections) {
        Write-Host "✅ Puerto $port libre." -ForegroundColor Gray
        continue
    }

    # Recolecta PIDs únicos válidos (evita 0)
    $owners = $connections | ForEach-Object { $_.OwningProcess } | Where-Object { $_ -and $_ -ne 0 } | Select-Object -Unique
    
    if (-not $owners -or $owners.Count -eq 0) {
        Write-Host "⚠️ Puerto $port ocupado pero no se pudo identificar el proceso." -ForegroundColor Yellow
        continue
    }

    foreach ($emulatorPid in $owners) {
        $procInfo = Get-CimInstance Win32_Process -Filter ("ProcessId={0}" -f $emulatorPid) -ErrorAction SilentlyContinue
        if (-not $procInfo) {
            Write-Host "❓ No se encontró proceso con PID $emulatorPid" -ForegroundColor Yellow
            continue
        }

        Write-Host "----------------------------------------------------"
        Write-Host "PUERTO: $port" -ForegroundColor Green
        Write-Host "PID:    $($procInfo.ProcessId)"
        Write-Host "NOMBRE: $($procInfo.Name)"
        Write-Host "RUTA:   $($procInfo.ExecutablePath)"
        
        $answer = Read-Host "🛑 ¿Detener este proceso? (s/n)"
        if ($answer -eq 's') {
            try {
                Stop-Process -Id $emulatorPid -Force -ErrorAction Stop
                Write-Host "🔥 Proceso $emulatorPid detenido." -ForegroundColor Green
                $totalKilled++
            } catch {
                Write-Host "❌ No se pudo detener el proceso: $_" -ForegroundColor Red
            }
        } else {
            Write-Host "⏭️ Saltado." -ForegroundColor Gray
        }
    }
}

Write-Host "`n✨ Finalizado. Procesos detenidos: $totalKilled" -ForegroundColor Cyan
