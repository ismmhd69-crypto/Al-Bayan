# Applies any new database changes in supabase/migrations to the Al Bayan Supabase project.
# Uses the personal access token saved in the Windows setting SUPABASE_ACCESS_TOKEN.
# Stops without changing anything if the project name is wrong. Changes already applied are skipped.
$ErrorActionPreference = 'Stop'
$t = [Environment]::GetEnvironmentVariable('SUPABASE_ACCESS_TOKEN', 'User')
if (-not $t) { throw 'SUPABASE_ACCESS_TOKEN is not set' }
$h = @{ Authorization = "Bearer $t" }
$ref = 'jnietkyxgnocyizvjiel'
$base = "https://api.supabase.com/v1/projects/$ref"

$p = Invoke-RestMethod -Uri $base -Headers $h
"project: $($p.name) / $($p.region)"
if ($p.name -ne 'Al Bayan') { throw 'wrong project, stopping' }

$applied = @((Invoke-RestMethod -Uri "$base/database/migrations" -Headers $h) | ForEach-Object { $_.name })
$files = Get-ChildItem "$PSScriptRoot\migrations\*.sql" | Sort-Object Name
$pending = @($files | Where-Object { $applied -notcontains $_.BaseName })
if ($pending.Count -eq 0) { 'nothing new to apply'; return }

foreach ($f in $pending) {
  $sql = [IO.File]::ReadAllText($f.FullName, [Text.Encoding]::UTF8)
  $body = @{ query = $sql; name = $f.BaseName } | ConvertTo-Json
  try {
    Invoke-RestMethod -Method Post -Uri "$base/database/migrations" -Headers $h -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($body)) | Out-Null
    "applied: $($f.BaseName)"
  } catch {
    "FAILED: $($f.BaseName)"
    $_.ErrorDetails.Message
    throw
  }
}
