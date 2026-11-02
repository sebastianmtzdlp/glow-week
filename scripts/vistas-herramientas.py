# Pasa las capturas de mentorias/herramientas/vistas/*.png a .webp de 240x369 (2x de 120 px) y borra el .png.
import glob, os
from PIL import Image
for f in glob.glob("mentorias/herramientas/vistas/*.png"):
    im = Image.open(f).convert("RGB")
    im = im.resize((240, round(im.height * 240 / im.width)), Image.LANCZOS)
    im.save(f[:-4] + ".webp", "WEBP", quality=72, method=6)
    os.remove(f)
    print(f[:-4] + ".webp", os.path.getsize(f[:-4] + ".webp"))
