# dot-source this file or run in a PowerShell session to load .env and start the API
param(
  [switch]$Package
)

$ErrorActionPreference = 'Stop'

# Load .env if present
$envPath = Join-Path $PSScriptRoot '.env'
if (Test-Path $envPath) {
  Write-Host "Loading environment from .env"
  foreach ($line in Get-Content $envPath) {
    if ($line -match '^(\s*#|\s*$)') { continue }
    if ($line -match '^(?<k>[^=]+)=(?<v>.*)$') {
      $k = $matches['k'].Trim()
      $v = $matches['v']
      # Remove possible quotes
      if ($v.StartsWith('"') -and $v.EndsWith('"')) { $v = $v.Substring(1, $v.Length-2) }
      if ($v.StartsWith("'") -and $v.EndsWith("'")) { $v = $v.Substring(1, $v.Length-2) }
      Set-Item -Path "env:$k" -Value $v
    }
  }
} else {
  Write-Host ".env not found; relying on current environment variables"
}

Set-Location $PSScriptRoot

if ($Package) {
  mvn -q -DskipTests package
  java -jar (Get-ChildItem target\backend-*.jar | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
} else {
  mvn spring-boot:run
}
