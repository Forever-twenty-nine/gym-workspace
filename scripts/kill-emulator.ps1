"# scripts/kill-emulator.ps1"
"# Busca los PID que usan el puerto 8080 y pregunta antes de detenerlos."
$connections = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
if (-not $connections) {
    Write-Host "No se encontró ningún proceso escuchando en el puerto 8080."
    exit 0
}

# Recolecta PIDs únicos válidos (evita 0)
$owners = $connections | ForEach-Object { $_.OwningProcess } | Where-Object { $_ -and $_ -ne 0 } | Select-Object -Unique
if (-not $owners -or $owners.Count -eq 0) {
    Write-Host "No hay un proceso válido para detener (OwningProcess=0 o nulo)."
    exit 0
}

foreach ($emulatorPid in $owners) {
    # Obtener detalles del proceso mediante WMI/CIM (una consulta por PID)
    $procInfo = Get-CimInstance Win32_Process -Filter ("ProcessId={0}" -f $emulatorPid) -ErrorAction SilentlyContinue
    if (-not $procInfo) {
        Write-Host "No se encontró proceso con PID $emulatorPid"
        continue
    }
    $procInfo | Select-Object ProcessId,Name,CommandLine,ExecutablePath | Format-List
    $answer = Read-Host "Detener este proceso $emulatorPid? (s/n)"
    if ($answer -eq 's') {
        try {
            Stop-Process -Id $emulatorPid -Force -ErrorAction Stop
            Write-Host "Proceso $emulatorPid detenido."
        } catch {
            Write-Host "No se pudo detener el proceso: $_"
            exit 1
        }
    } else {
        Write-Host "Abortado por el usuario para PID $emulatorPid."
    }
}
