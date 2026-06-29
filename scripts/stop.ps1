# Kill whatever is listening on the dev/preview port (default 7443).
# Used by `make stop` / `make restart` so an orphaned Vite server never blocks the port.
param([int]$Port = 7443)

$pids = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess -Unique

if (-not $pids) {
  Write-Host "Nothing listening on port $Port."
  exit 0
}

foreach ($procId in $pids) {
  try {
    $name = (Get-Process -Id $procId -ErrorAction SilentlyContinue).ProcessName
    Stop-Process -Id $procId -Force -ErrorAction Stop
    Write-Host "Stopped PID $procId ($name) on port $Port."
  } catch {
    Write-Host "Could not stop PID $procId : $($_.Exception.Message)"
  }
}
