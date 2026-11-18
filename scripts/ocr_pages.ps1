Add-Type -AssemblyName System.Runtime.WindowsRuntime
[Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.BitmapDecoder, Windows.Foundation, ContentType = WindowsRuntime] | Out-Null
[Windows.Storage.StorageFile, Windows.Foundation, ContentType = WindowsRuntime] | Out-Null

$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()

function Await($asyncOp) {
    $task = [System.WindowsRuntimeSystemExtensions]::AsTask($asyncOp)
    $task.Wait()
    return $task.Result
}

$pageDir = "C:\Users\windows\OneDrive\Desktop\personal mine\vvit\Mine Projects\Faculty-selection-portal\scripts\temp_pages"

for ($i = 1; $i -le 10; $i++) {
    $imgPath = Join-Path $pageDir "page_$i.png"
    if (Test-Path $imgPath) {
        $file = Await([Windows.Storage.StorageFile]::GetFileFromPathAsync($imgPath))
        $stream = Await($file.OpenAsync([Windows.Storage.FileAccessMode]::Read))
        $decoder = Await([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream))
        $bitmap = Await($decoder.GetSoftwareBitmapAsync())
        $res = Await($engine.RecognizeAsync($bitmap))
        
        $lines = $res.Lines | ForEach-Object { $_.Text }
        $outTxt = Join-Path $pageDir "page_$i.txt"
        $lines | Out-File -FilePath $outTxt -Encoding utf8
        Write-Output "OCRed page $i -> $($lines.Count) lines"
    }
}
Write-Output "OCR finished!"
