"""Turns a black-on-white drawing into a coloring page the app can fill.

    python vectorize.py <drawing.png> <page.svg>

Each white area enclosed by ink becomes a tappable region and the ink is laid over the top, so the
page works with the same tap-to-fill, undo, save and print as the hand-drawn pages.
Prints "regions ink% kb", or exits 2 when the drawing can't make a good page.
"""
import sys

import cv2
import numpy as np

SIZE = 800
INK = "#2a2340"
MIN_REGION = 150  # white areas smaller than this (in the 1024 px drawing) are absorbed into the ink
MIN_SPECK = 24    # ink specks smaller than this are noise


def clean(gray):
    ink = (gray < 150).astype(np.uint8)
    n, labels, stats, _ = cv2.connectedComponentsWithStats(ink, connectivity=8)
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] < MIN_SPECK:
            ink[labels == i] = 0
    return ink


def path(contours, scale):
    out = []
    for c in contours:
        pts = c.reshape(-1, 2) * scale
        out.append("M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in pts) + "Z")
    return out


def contours_of(mask, eps):
    found, _ = cv2.findContours(mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    return [cv2.approxPolyDP(c, eps, True) for c in found if len(c) >= 3]


def main():
    src, dst = sys.argv[1:3]
    gray = cv2.imread(src, cv2.IMREAD_GRAYSCALE)
    if gray is None:
        raise SystemExit(f"cannot read {src}")
    h, w = gray.shape
    scale = SIZE / max(w, h)
    # Close hairline gaps so one fill can't leak through a broken outline.
    ink = cv2.morphologyEx(clean(gray), cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))

    n, labels, stats, _ = cv2.connectedComponentsWithStats(1 - ink, connectivity=4)
    border = set(labels[0, :]) | set(labels[-1, :]) | set(labels[:, 0]) | set(labels[:, -1])
    keep = []
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] < MIN_REGION:
            ink[labels == i] = 1
        else:
            keep.append(i)

    shapes = []
    grow = np.ones((5, 5), np.uint8)
    for rank, i in enumerate(sorted(keep, key=lambda k: -stats[k, cv2.CC_STAT_AREA])):
        # Each region reaches under the ink so no white hairline shows between color and outline.
        mask = cv2.dilate((labels == i).astype(np.uint8), grow)
        name = "sky" if i in border and rank == 0 else f"r{rank}"
        d = "".join(path(contours_of(mask, 2.2), scale))
        shapes.append(f'<path d="{d}" data-fill="{name}" fill="#ffffff" fill-rule="evenodd" stroke="none"/>')

    # One path: every outline keeps its holes, or evenodd would fill a shape in solid.
    overlay = [f'<path d="{"".join(path(contours_of(ink, 0.85), scale))}" fill="{INK}" fill-rule="evenodd" stroke="none"/>']

    page = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" fill="#ffffff" stroke="none">', *shapes, *overlay, "</svg>", ""]
    text = "\n".join(page)
    ink_share = 100 * ink.mean()
    report = f"{len(shapes)} {ink_share:.1f} {len(text) / 1024:.0f}"
    if not 5 <= len(shapes) <= 300 or not 1.2 <= ink_share <= 32 or len(text) > 130 * 1024:
        print("reject", report)
        sys.exit(2)
    with open(dst, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)
    print(report)


if __name__ == "__main__":
    main()
