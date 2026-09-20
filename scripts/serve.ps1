# Mizan local 24/7 server runner (PowerShell 5.1+).
#
# Runs the PRODUCTION build (next start) as a hidden background process so it
# keeps serving and survives a closed terminal window. A keep-alive watcher and
# an optional logon scheduled task bring it back after a crash or reboot.
#
# Usage:  ./scripts/serve.ps1 -start | -stop | -status | -logs | -restart | -watch | -install | -uninstall
# npm:    npm run serve            (start)
#         npm run serve:status     (show status)
#         npm run serve:stop       (stop)
#         npm run serve:logs       (tail output)
#         npm run serve:install    (create logon task "MizanServer" -> auto start+watch on login)
#         npm run serve:uninstall  (delete the task and stop the server)

param(
  [ValidateSet("start", "stop", "status", "logs", "restart", "watch", "install", "uninstall")]
  [Parameter(Position = 0)]
  [string]$Action = "status",
  [int]$Port = 3000,
  [string]$HostAddr = "127.0.0.1",
  [switch]$Force
)

$ErrorActionPreference = "Stop"

$ROOT = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$RUN_DIR = Join-Path $env:LOCALAPPDATA "MizanServer"
$PID_FILE = Join-Path $RUN_DIR "server.pid"
$OUT_LOG = Join-Path $RUN_DIR "server.out.log"
$ERR_LOG = Join-Path $RUN_DIR "server.err.log"

$NEXT_BIN = Join-Path $ROOT "node_modules\next\dist\bin\next"

function Resolve-NodeExe {
  $cmd = Get-Command node.exe -ErrorAction SilentlyContinue
  if (-not $cmd) { throw "node.exe not found on PATH." }
  return $cmd.Source
}

function Read-RunningPid {
  if (Test-Path -LiteralPath $PID_FILE) {
    try { return [int](Get-Content -LiteralPath $PID_FILE -Raw).Trim() } catch { return $null }
  }
  return $null
}

function Test-PidAlive([int]$ProcId) {
  if (-not $ProcId) { return $false }
  return [bool](Get-Process -Id $ProcId -ErrorAction SilentlyContinue)
}

function Test-PortBusy {
  return [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

function Start-Server {
  if (-not (Test-Path -LiteralPath "$ROOT\.next")) {
    Write-Host "[serve] No .next build found. Run 'npm run build' first." -ForegroundColor Yellow
    return 2
  }
  $alive = Read-RunningPid
  if (Test-PidAlive $alive) {
    Write-Host "[serve] Already running (pid $alive) at http://$HostAddr`:$Port."
    return 0
  }
  if (Test-PortBusy) {
    Write-Host "[serve] Port $Port is already listening, but not by our recorded pid. Check for a stale process." -ForegroundColor Yellow
    return 2
  }

  New-Item -ItemType Directory -Force -Path $RUN_DIR | Out-Null
  $node = Resolve-NodeExe
  $args = @($NEXT_BIN, "start", "-H", $HostAddr, "-p", "$Port")
  $proc = Start-Process -FilePath $node -ArgumentList $args `
    -WorkingDirectory $ROOT -WindowStyle Hidden `
    -RedirectStandardOutput $OUT_LOG -RedirectStandardError $ERR_LOG -PassThru

  Set-Content -LiteralPath $PID_FILE -Value "$($proc.Id)" -Encoding ascii
  Start-Sleep -Seconds 3
  Write-Host "[serve] Started pid $($proc.Id) - http://$HostAddr`:$Port  (logs: $RUN_DIR)"
  return 0
}

function Stop-Server {
  $pidCur = Read-RunningPid
  if (Test-PidAlive $pidCur) {
    Stop-Process -Id $pidCur -Force -ErrorAction SilentlyContinue
    Write-Host "[serve] Stopped pid $pidCur."
  } elseif (Test-PortBusy) {
    Write-Host "[serve] Nothing running on pid $pidCur, but port $Port is busy. Not touched." -ForegroundColor Yellow
  } else {
    Write-Host "[serve] Not running."
  }
  Remove-Item -LiteralPath $PID_FILE -Force -ErrorAction SilentlyContinue
  return 0
}

function Show-Status {
  $pidCur = Read-RunningPid
  if (Test-PidAlive $pidCur) {
    Write-Host "[serve] RUNNING pid $pidCur - http://$HostAddr`:$Port"
  } else {
    Write-Host "[serve] NOT running."
  }
  $task = Get-ScheduledTask -TaskName "MizanServer" -ErrorAction SilentlyContinue
  if ($task) {
    Write-Host "[serve] Autostart task 'MizanServer' installed (runs at your next logon)."
  } else {
    Write-Host "[serve] Autostart task 'MizanServer' NOT installed. Use 'npm run serve:install'."
  }
  return 0
}

function Show-Logs {
  Write-Host "=== $OUT_LOG ===" -ForegroundColor Cyan
  if (Test-Path -LiteralPath $OUT_LOG) { Get-Content -LiteralPath $OUT_LOG -Tail 40 } else { Write-Host "(empty)" }
  Write-Host "=== $ERR_LOG ===" -ForegroundColor Cyan
  if (Test-Path -LiteralPath $ERR_LOG) { Get-Content -LiteralPath $ERR_LOG -Tail 40 } else { Write-Host "(empty)" }
  return 0
}

# Keep-alive loop used by the scheduled task: ensure the server is up ~every 15s.
function Start-Watch {
  Write-Host "[serve] Watcher running (checks every 15s). Ctrl+C to exit."
  while ($true) {
    $pidCur = Read-RunningPid
    if (-not (Test-PidAlive $pidCur)) {
      Start-Server | Out-Null
    }
    Start-Sleep -Seconds 15
  }
}

function Install-Task {
  Start-Server | Out-Null
  $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument `
    "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$PSCommandPath`" watch"
  $trigger = New-ScheduledTaskTrigger -AtLogOn -User (whoami)
  $settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Seconds 0) `
    -AllowStartIfOnBatteries
  try {
    Register-ScheduledTask -TaskName "MizanServer" -Action $action -Trigger $trigger `
      -Settings $settings -User (whoami) -Description "Mizan 24/7 localhost server (next start + keep-alive)" -Force | Out-Null
    Write-Host "[serve] Installed: 'MizanServer' auto-starts (and keeps alive) at your next logon."
  } catch {
    Write-Host "[serve] Failed to install the scheduled task: $($_.Exception.Message)" -ForegroundColor Yellow
    return 1
  }
  return 0
}

function Uninstall-Task {
  Stop-Server | Out-Null
  Unregister-ScheduledTask -TaskName "MizanServer" -Confirm:$false -ErrorAction SilentlyContinue
  Write-Host "[serve] Removed task 'MizanServer' (if present)."
  return 0
}

switch ($Action) {
  "start"     { exit (Start-Server) }
  "stop"      { exit (Stop-Server) }
  "status"    { exit (Show-Status) }
  "logs"      { exit (Show-Logs) }
  "restart"   { Stop-Server | Out-Null; Start-Sleep -Seconds 1; exit (Start-Server) }
  "watch"     { Start-Watch }
  "install"   { exit (Install-Task) }
  "uninstall" { exit (Uninstall-Task) }
}