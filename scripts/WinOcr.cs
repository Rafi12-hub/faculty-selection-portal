using System;
using System.IO;
using System.Collections.Generic;
using System.Threading.Tasks;
using Windows.Media.Ocr;
using Windows.Graphics.Imaging;
using Windows.Storage;

public class WinOcr {
    public static async Task<List<string>> OcrFile(string path) {
        var file = await StorageFile.GetFileFromPathAsync(path);
        using (var stream = await file.OpenAsync(FileAccessMode.Read)) {
            var decoder = await BitmapDecoder.CreateAsync(stream);
            var bitmap = await decoder.GetSoftwareBitmapAsync();
            var engine = OcrEngine.TryCreateFromUserProfileLanguages();
            var ocrRes = await engine.RecognizeAsync(bitmap);
            var lines = new List<string>();
            foreach (var line in ocrRes.Lines) {
                lines.Add(line.Text);
            }
            return lines;
        }
    }
}
