"""Isola o brilho animado do waves.mp4 do teron.

O vídeo é um plate claro estático (prateleiras, labels, painel) com swirls azuis
girando por cima. O máximo por pixel ao longo dos 90 frames dá o plate "limpo" —
tudo que não se move. A diferença (plate - frame) cancela o estático e deixa só
o swirl.

Duas correções sobre o resíduo cru:
- ele sai laranja, porque um swirl azul derruba R e G e o que sobra é o
  complemento; então usamos só a magnitude e recolorimos no azul do neon da
  nossa arte (amostrado do video-block.png: ~107,201,255);
- as bordas dos textos do plate aparecem como fantasma, porque o swirl passa
  atrás delas; um blur forte apaga esse detalhe e não custa nada num brilho.
"""

import subprocess
import numpy as np
from PIL import Image, ImageFilter

# O fonte não fica versionado (2.6 MB e só serve para gerar o resultado):
#   curl -o wt-waves.mp4 https://teron.io/videos/pages/home/work-together/waves.mp4
SRC = "wt-waves.mp4"
OUT = "public/assets/wt-glow.webm"
W, H = 1280, 790
BLUR = 9        # em px; suficiente para sumir com texto e avatares
GAIN = 5.4
TINT = np.array([107, 201, 255]) / 255  # neon azul do video-block.png

raw = subprocess.run(
    ["ffmpeg", "-v", "error", "-i", SRC, "-vf", f"scale={W}:{H}",
     "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
    capture_output=True, check=True,
).stdout
f = np.frombuffer(raw, dtype=np.uint8).reshape(-1, H, W, 3)
print("frames lidos:", f.shape[0])

plate = f.max(axis=0).astype(np.int16)

out = np.empty_like(f)
for i, frame in enumerate(f):
    mag = (plate - frame.astype(np.int16)).max(axis=2).clip(0, 255).astype(np.uint8)
    mag = np.asarray(
        Image.fromarray(mag).filter(ImageFilter.GaussianBlur(BLUR)),
        dtype=np.float32,
    )
    out[i] = np.clip(mag[..., None] * GAIN * TINT, 0, 255).astype(np.uint8)

print("brilho: max", int(out.max()), "media", round(float(out.mean()), 2))

enc = subprocess.Popen(
    ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
     "-s", f"{W}x{H}", "-r", "30", "-i", "-",
     "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "40", "-an", OUT],
    stdin=subprocess.PIPE,
)
enc.communicate(out.tobytes())
print("encode rc:", enc.returncode)
