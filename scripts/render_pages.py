import fitz
import os

pdf_path = r"C:\Users\windows\.gemini\antigravity\brain\977d6c08-0454-4e4d-bcec-03e882e8148a\.user_uploaded\media_1795001792340_009ac52d.pdf"
out_dir = r"C:\Users\windows\OneDrive\Desktop\personal mine\vvit\Mine Projects\Faculty-selection-portal\scripts\temp_pages"
os.makedirs(out_dir, exist_ok=True)

doc = fitz.open(pdf_path)
print(f"Total pages: {len(doc)}")

for i, page in enumerate(doc):
    pix = page.get_pixmap(dpi=200)
    out_file = os.path.join(out_dir, f"page_{i+1}.png")
    pix.save(out_file)
    print(f"Saved {out_file}")

print("All pages rendered!")
