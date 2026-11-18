Add-Type -AssemblyName System.Drawing
[Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.BitmapDecoder, Windows.Foundation, ContentType = WindowsRuntime] | Out-Null
[Windows.Storage.StorageFile, Windows.Foundation, ContentType = WindowsRuntime] | Out-Null

$lang = [Windows.Globalization.Language]::new("en-US")
$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($lang)
if (-not $engine) {
    $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
}
Write-Output "Engine created: $($engine -ne $null)"
