# SUEÑOS AI: Context collection
$OutputFile = "suenos_ai_audit_context.txt"

"--- SUENOS AI: PROJECT CONTEXT ---" | Out-File -FilePath $OutputFile -Encoding UTF8
"Generated on: $(Get-Date)" | Add-Content -Path $OutputFile

# 1. Project Structure
"`n`n--- PROJECT STRUCTURE ---" | Add-Content -Path $OutputFile
Get-ChildItem -Recurse -Depth 3 | Where-Object { $_.FullName -notmatch 'node_modules|\.git' } | Select-Object FullName | Add-Content -Path $OutputFile

# 2. Config Files
$files = @("package.json", "app.json", "app.config.js", "eas.json", ".env.example")
foreach ($file in $files) {
    if (Test-Path $file) {
        "`n`n--- FILE: $file ---" | Add-Content -Path $OutputFile
        Get-Content $file | Add-Content -Path $OutputFile
    }
}

# 3. Source Code (app and src)
"`n`n--- SOURCE CODE ---" | Add-Content -Path $OutputFile
$codeFiles = Get-ChildItem -Path "app", "src" -Include "*.ts", "*.tsx", "*.js" -Recurse -ErrorAction SilentlyContinue
foreach ($file in $codeFiles) {
    "`n--- FILE: $($file.FullName) ---" | Add-Content -Path $OutputFile
    Get-Content $file.FullName | Add-Content -Path $OutputFile
}

Write-Host "Done! Data collected in $OutputFile" -ForegroundColor Cyan