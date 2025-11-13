# Kill all processes using port 9000
Write-Host "Finding processes using port 9000..." -ForegroundColor Yellow

$connections = netstat -ano | Select-String ":9000" | Select-String "LISTENING"

if ($connections) {
    $pids = @()
    foreach ($line in $connections) {
        if ($line -match '\s+(\d+)\s*$') {
            $pid = $matches[1]
            if ($pid -ne "0" -and $pids -notcontains $pid) {
                $pids += $pid
            }
        }
    }
    
    if ($pids.Count -gt 0) {
        Write-Host "Found $($pids.Count) process(es) using port 9000" -ForegroundColor Yellow
        foreach ($pid in $pids) {
            Write-Host "Killing process $pid..." -ForegroundColor Red
            taskkill /PID $pid /F 2>$null
        }
        Write-Host "Waiting for port to be released..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
        Write-Host "Port 9000 is now free!" -ForegroundColor Green
    } else {
        Write-Host "No processes found using port 9000" -ForegroundColor Green
    }
} else {
    Write-Host "Port 9000 is already free!" -ForegroundColor Green
}
