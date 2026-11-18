[Windows.Storage.StorageFile, Windows.Foundation, ContentType = WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.BitmapDecoder, Windows.Foundation, ContentType = WindowsRuntime] | Out-Null
[Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime] | Out-Null

function Wait-Async($asyncOp) {
    while ($asyncOp.Status -eq [Windows.Foundation.AsyncStatus]::Started) {
        Start-Sleep -Milliseconds 10
    }
    return $asyncOp.GetResults()
}

$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
$imgPath = (Resolve-Path "scripts\temp_pages\page_1.png").Path

$file = Wait-Async ([Windows.Storage.StorageFile]::GetFileFromPathAsync($imgPath))
$stream = Wait-Async ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read))
$decoder = Wait-Async ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream))
$bitmap = Wait-Async ($decoder.GetSoftwareBitmapAsync())
$ocrResult = Wait-Async ($engine.RecognizeAsync($bitmap))

Write-Output "Lines recognized: $($ocrResult.Lines.Count)"
foreach ($line in ($ocrResult.Lines | Select-Object -First 10)) {
    Write-Output $line.Text
}
