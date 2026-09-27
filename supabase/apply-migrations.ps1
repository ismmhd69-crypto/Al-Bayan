# Applies the phase 2 database changes to the Al Bayan Supabase project.
# Uses the personal access token saved in the Windows setting SUPABASE_ACCESS_TOKEN.
# Stops without changing anything if the project name is wrong or tables already exist.
$ErrorActionPreference = 'Stop'
$t = [Environment]::GetEnvironmentVariable('SUPABASE_ACCESS_TOKEN', 'User')
$h = @{ Authorization = "Bearer $t" }
$ref = 'jnietkyxgnocyizvjiel'
$base = "https://api.supabase.com/v1/projects/$ref"

# Safety: confirm this is the Al Bayan project and it has no tables yet.
$p = Invoke-RestMethod -Uri $base -Headers $h
"project: $($p.name) / $($p.region)"
if ($p.name -ne 'Al Bayan') { throw 'wrong project' }
$q = @{ query = "select count(*)::int as n from information_schema.tables where table_schema in ('public','editorial')"; read_only = $true } | ConvertTo-Json
$n = (Invoke-RestMethod -Method Post -Uri "$base/database/query" -Headers $h -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($q)))[0].n
"existing tables: $n"
if ($n -ne 0) { throw 'database not empty, stopping' }

foreach ($f in @('20260927120000_phase2_content', '20260927120100_phase2_seed')) {
  $sql = [IO.File]::ReadAllText("$PSScriptRoot\migrations\$f.sql", [Text.Encoding]::UTF8)
  $body = @{ query = $sql; name = $f } | ConvertTo-Json
  try {
    Invoke-RestMethod -Method Post -Uri "$base/database/migrations" -Headers $h -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($body)) | Out-Null
    "applied: $f"
  } catch {
    "FAILED: $f"
    $_.ErrorDetails.Message
    throw
  }
}
