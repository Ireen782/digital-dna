import os

from PIL import Image, ImageDraw

SCALE = 16
SIZE = 32 * SCALE

img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
d = ImageDraw.Draw(img)


def p(x, y):
    return (x * SCALE, y * SCALE)


def circle(cx, cy, r, fill):
    d.ellipse(
        (cx * SCALE - r * SCALE, cy * SCALE - r * SCALE, cx * SCALE + r * SCALE, cy * SCALE + r * SCALE),
        fill=fill,
    )


def strand(points, color, width):
    pts = [p(x, y) for x, y in points]
    d.line(pts, fill=color, width=int(width * SCALE), joint="curve")
    for x, y in points:
        circle(x, y, width / 2, color)


PURPLE = (91, 42, 158, 255)
DARK = (58, 26, 102, 255)
PALE = (230, 220, 247, 255)
WHITE = (255, 255, 255, 255)
LAVENDER = (201, 177, 240, 255)

# Document body with folded corner
d.polygon([p(4, 4), p(6, 2), p(20, 2), p(28, 10), p(28, 28), p(26, 30), p(6, 30), p(4, 28)], fill=PURPLE)
circle(6, 4, 2, PURPLE)
circle(6, 28, 2, PURPLE)
circle(26, 28, 2, PURPLE)
d.polygon([p(20, 2), p(28, 10), p(22, 10), p(20, 8)], fill=DARK)

# Text lines
strand([(21.5, 11), (10.5, 11)], PALE, 1.3)
strand([(18.9, 14), (13.1, 14)], PALE, 1.3)
strand([(13.1, 17), (18.9, 17)], PALE, 1.3)
strand([(10.5, 20), (21.5, 20)], PALE, 1.3)

# Double helix
strand(
    [(16.0, 7), (18.0, 8), (19.7, 9), (20.9, 10), (21.5, 11), (21.3, 12), (20.4, 13), (18.9, 14),
     (17.0, 15), (15.0, 16), (13.1, 17), (11.6, 18), (10.7, 19), (10.5, 20), (11.1, 21), (12.3, 22),
     (14.0, 23), (16.0, 24), (18.0, 25)],
    WHITE, 2.2,
)
strand(
    [(16.0, 7), (14.0, 8), (12.3, 9), (11.1, 10), (10.5, 11), (10.7, 12), (11.6, 13), (13.1, 14),
     (15.0, 15), (17.0, 16), (18.9, 17), (20.4, 18), (21.3, 19), (21.5, 20), (20.9, 21), (19.7, 22),
     (18.0, 23), (16.0, 24), (14.0, 25)],
    LAVENDER, 2.2,
)

os.makedirs("backend/assets", exist_ok=True)
img.save("backend/assets/logo.png")
print("Saved backend/assets/logo.png")