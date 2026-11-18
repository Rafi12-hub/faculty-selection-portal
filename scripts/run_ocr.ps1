$code = Get-Content 'scripts\WinOcr.cs' -Raw
$winmdPath = "C:\Windows\System32\WinMetadata\Windows.Media.Ocr.winmd"
$storageWinmd = "C:\Windows\System32\WinMetadata\Windows.Storage.winmd"
$imagingWinmd = "C:\Windows\System32\WinMetadata\Windows.Graphics.Imaging.winmd"
$foundationWinmd = "C:\Windows\System32\WinMetadata\Windows.Foundation.winmd"

Add-Type -TypeDefinition $code -ReferencedAssemblies @(
    "System.Runtime.WindowsRuntime.dll",
    $winmdPath,
    $storageWinmd,
    $imagingWinmd,
    $foundationWinmd
)

Write-Output "WinOcr compiled successfully!"

$pageDir = "C:\Users\windows\OneDrive\Desktop\personal mine\vvit\Mine Projects\Faculty-selection-portal\scripts\temp_pages"

for ($i = 1; $i -le 10; $i++) {
    $imgPath = Join-Path $pageDir "page_$i.png"
    if (Test-Path $imgPath) {
        $lines = [WinOcr]::OcrFile($imgPath).GetAwaiter().GetResult()
        $outTxt = Join-Path $pageDir "page_$i.txt"
        $lines | Out-File -FilePath $outTxt -Encoding utf8
        Write-Output "OCRed page $i -> $($lines.Count) lines"
    }
}
