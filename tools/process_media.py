"""Připraví média pro appku Mňamka.

Použití:
    python tools/process_media.py            # obrázky -> media/img/*.webp, videa -> media/video, ikony -> icons/
    python tools/process_media.py --frames DIR  # vytáhne snímky z videí (1 fps) do DIR pro přepis receptů
"""
import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SRC_IMG = ROOT / "Obrazky"
SRC_VID = ROOT / "Videa"
OUT_IMG = ROOT / "media" / "img"
OUT_VID = ROOT / "media" / "video"
OUT_ICONS = ROOT / "icons"

MAX_WIDTH = 720
PEACH = (247, 200, 170)
CREAM = (255, 248, 238)
SAGE = (143, 170, 140)
BROWN = (120, 85, 60)


def convert_images():
    OUT_IMG.mkdir(parents=True, exist_ok=True)
    for src in sorted(SRC_IMG.glob("*.jpg")):
        if "(" in src.stem:  # duplicitní kopie typu "WA0039(1).jpg"
            continue
        dst = OUT_IMG / (src.stem + ".webp")
        if dst.exists():
            continue
        with Image.open(src) as im:
            im = im.convert("RGB")
            if im.width > MAX_WIDTH:
                im = im.resize((MAX_WIDTH, round(im.height * MAX_WIDTH / im.width)), Image.LANCZOS)
            im.save(dst, "WEBP", quality=72, method=6)
        print("img", dst.name)


def copy_videos():
    OUT_VID.mkdir(parents=True, exist_ok=True)
    for src in sorted(SRC_VID.glob("*.mp4")):
        dst = OUT_VID / src.name
        if not dst.exists():
            shutil.copy2(src, dst)
            print("vid", dst.name)


def draw_icon(size, padding_ratio):
    """Miska s lžičkou na broskvovém pozadí."""
    im = Image.new("RGB", (size, size), PEACH)
    d = ImageDraw.Draw(im)
    s = size * (1 - 2 * padding_ratio)
    ox = oy = size * padding_ratio

    def p(x, y):
        return (ox + x * s, oy + y * s)

    # lžička
    d.line([p(0.62, 0.12), p(0.50, 0.50)], fill=BROWN, width=max(2, round(s * 0.045)))
    d.ellipse([p(0.56, 0.04), p(0.72, 0.22)], fill=BROWN)
    # kaše
    d.ellipse([p(0.16, 0.40), p(0.84, 0.58)], fill=CREAM)
    # miska (spodní půlkruh)
    d.chord([p(0.10, 0.20), p(0.90, 0.92)], start=0, end=180, fill=SAGE)
    d.rectangle([p(0.10, 0.54), p(0.90, 0.57)], fill=SAGE)
    # podstavec
    d.rounded_rectangle([p(0.36, 0.88), p(0.64, 0.94)], radius=s * 0.02, fill=SAGE)
    return im


def make_icons():
    OUT_ICONS.mkdir(parents=True, exist_ok=True)
    draw_icon(192, 0.12).save(OUT_ICONS / "icon-192.png")
    draw_icon(512, 0.12).save(OUT_ICONS / "icon-512.png")
    draw_icon(512, 0.22).save(OUT_ICONS / "icon-maskable-512.png")
    draw_icon(180, 0.12).save(OUT_ICONS / "apple-touch-icon.png")
    print("icons ok")


def extract_frames(out_dir):
    import imageio_ffmpeg

    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    for src in sorted(SRC_VID.glob("*.mp4")):
        target = Path(out_dir) / src.stem
        target.mkdir(parents=True, exist_ok=True)
        subprocess.run(
            [ffmpeg, "-loglevel", "error", "-y", "-i", str(src), "-vf", "fps=1,scale=480:-2",
             str(target / "f_%03d.jpg")],
            check=True,
        )
        print("frames", src.stem, len(list(target.glob("*.jpg"))))


if __name__ == "__main__":
    if len(sys.argv) == 3 and sys.argv[1] == "--frames":
        extract_frames(sys.argv[2])
    else:
        convert_images()
        copy_videos()
        make_icons()
