from PIL import Image
from forensics.ela_check import ela_ratio

for name in ["Genuine.jpg", "Edited.jpg"]:
    path = "forensics/" + name
    with Image.open(path) as img:
        q = img.quantization[0][:4] if hasattr(img, "quantization") else None
        print(name, "size", img.size, "quant table start", q)
    for quality in (95, 85, 75, 65, 50):
        ratio, top, median = ela_ratio(path, quality=quality)
        print("  q=%d ratio=%.2f top=%.2f median=%.2f" % (quality, ratio, top, median))