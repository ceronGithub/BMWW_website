# FILE    : tools/local-launcher/start-bmww-local.ps1
# PURPOSE : maliit na local web server (127.0.0.1 lang) para sa BMWW folder, tapos bubuksan ang Chrome/Edge sa http://localhost:8765/index.html
# DEPENDS : Windows PowerShell 5.1 o mas bago; Chrome o Edge
# VERSION : v1.1 | 2026-11-24 | Batch G: switch na -NoBrowser (para sa ongoing-monitor)
# VERSION : v1 | 2026-11-24 | bagong file (Batch F: Task 5 at 9); hindi pa nasubukan sa totoong Windows
param([switch]$NoBrowser)

$ErrorActionPreference = 'Stop'

# Config (nasa taas lahat, walang hardcoded sa logic)
$Port = 8765
$Browser = 'auto'   # auto | chrome | edge
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$Url = "http://localhost:$Port/index.html"
$MimeMap = @{
  '.html' = 'text/html; charset=utf-8'; '.css' = 'text/css; charset=utf-8'; '.js' = 'application/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'; '.txt' = 'text/plain; charset=utf-8'; '.png' = 'image/png'; '.jpg' = 'image/jpeg'
  '.svg' = 'image/svg+xml'; '.ico' = 'image/x-icon'; '.woff2' = 'font/woff2'; '.woff' = 'font/woff'; '.ttf' = 'font/ttf'
}

if (-not (Test-Path (Join-Path $ProjectRoot 'index.html'))) {
  Write-Host 'Walang index.html sa project folder. Siguraduhing buo ang na-extract na folder.' -ForegroundColor Red
  exit 1
}

# Binubuksan ang Chrome o Edge (auto: Chrome muna).
function Open-Browser([string]$TargetUrl) {
  if ($NoBrowser) { return }
  $chromePath = @("$env:ProgramFiles\Google\Chrome\Application\chrome.exe", "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe", "$env:LocalAppData\Google\Chrome\Application\chrome.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
  $edgePath = @("${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe", "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
  if ($Browser -ne 'edge' -and $chromePath) { Start-Process $chromePath -ArgumentList $TargetUrl; return }
  if ($edgePath) { Start-Process $edgePath -ArgumentList $TargetUrl; return }
  Write-Host "Walang nakitang Chrome o Edge. Buksan mo mismo ang $TargetUrl" -ForegroundColor Yellow
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
try {
  $listener.Start()
} catch {
  # Kapag may gumagamit na ng port, malamang bukas na ang server: buksan na lang ang browser.
  Write-Host "Hindi masimulan ang server sa port $Port (baka bukas na). Bubuksan na lang ang browser." -ForegroundColor Yellow
  Open-Browser $Url
  exit 0
}

Write-Host "BMWW server: $Url" -ForegroundColor Green
Write-Host 'HUWAG ISARA ang window na ito habang ginagamit ang BMWW. Ctrl+C para itigil.'
Open-Browser $Url

while ($listener.IsListening) {
  $context = $listener.GetContext()
  $response = $context.Response
  try {
    $relative = [System.Uri]::UnescapeDataString($context.Request.Url.AbsolutePath).TrimStart('/')
    if ([string]::IsNullOrEmpty($relative)) { $relative = 'index.html' }
    $fullPath = [System.IO.Path]::GetFullPath((Join-Path $ProjectRoot $relative))
    # Bawal lumabas sa project folder; bawal din ang tools at .git
    $isInside = $fullPath.StartsWith($ProjectRoot, [System.StringComparison]::OrdinalIgnoreCase)
    $isBlocked = $fullPath -match '\\(\.git|tools)(\\|$)'
    if (-not $isInside -or $isBlocked -or -not (Test-Path $fullPath -PathType Leaf)) {
      $response.StatusCode = 404
    } else {
      $extension = [System.IO.Path]::GetExtension($fullPath).ToLower()
      $mime = $MimeMap[$extension]
      if (-not $mime) { $mime = 'application/octet-stream' }
      $bytes = [System.IO.File]::ReadAllBytes($fullPath)
      $response.ContentType = $mime
      $response.Headers.Add('Cache-Control', 'no-cache')
      $response.Headers.Add('X-Content-Type-Options', 'nosniff')
      $response.ContentLength64 = $bytes.Length
      $response.OutputStream.Write($bytes, 0, $bytes.Length)
    }
  } catch {
    $response.StatusCode = 500
  } finally {
    $response.OutputStream.Close()
  }
}
