#!/usr/bin/env python3
"""Build the birthday timelapse manifest and lightweight preview images."""

from __future__ import annotations

import json
import re
import shutil
import subprocess
from collections import Counter
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "timelapse"
THUMB_DIR = SOURCE_DIR / "thumbs"
DISPLAY_DIR = SOURCE_DIR / "display"
MANIFEST_PATH = SOURCE_DIR / "timelapse-data.js"
IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp", ".heic"}
ROTATION_OVERRIDES = {
    # This camera image was saved sideways without an EXIF orientation tag.
    "IMG_20250913_085813_083.jpg": -90,
}
MONTHS = (
    "",
    "Ocak",
    "Şubat",
    "Mart",
    "Nisan",
    "Mayıs",
    "Haziran",
    "Temmuz",
    "Ağustos",
    "Eylül",
    "Ekim",
    "Kasım",
    "Aralık",
)

FILENAME_PATTERNS = (
    re.compile(r"IMG-(?P<date>\d{8})-WA\d+", re.IGNORECASE),
    re.compile(r"IMG_(?P<date>\d{8})_(?P<time>\d{6})", re.IGNORECASE),
    re.compile(
        r"Screenshot_(?P<year>\d{4})-(?P<month>\d{2})-(?P<day>\d{2})"
        r"(?:-(?P<hour>\d{2})-(?P<minute>\d{2})-(?P<second>\d{2}))?",
        re.IGNORECASE,
    ),
)


def date_from_filename(path: Path) -> datetime | None:
    for pattern in FILENAME_PATTERNS:
        match = pattern.search(path.stem)
        if not match:
            continue

        groups = match.groupdict()
        if groups.get("date"):
            stamp = groups["date"] + groups.get("time", "")
            template = "%Y%m%d%H%M%S" if groups.get("time") else "%Y%m%d"
            return datetime.strptime(stamp, template)

        return datetime(
            int(groups["year"]),
            int(groups["month"]),
            int(groups["day"]),
            int(groups.get("hour") or 0),
            int(groups.get("minute") or 0),
            int(groups.get("second") or 0),
        )

    return None


def date_from_exif(path: Path) -> datetime | None:
    try:
        from PIL import Image
    except ImportError:
        return None

    try:
        with Image.open(path) as image:
            exif = image.getexif()
    except Exception:
        return None

    for tag in (36867, 36868, 306):
        value = exif.get(tag)
        if not value:
            continue
        try:
            return datetime.strptime(str(value), "%Y:%m:%d %H:%M:%S")
        except ValueError:
            continue

    return None


def date_from_filesystem(path: Path) -> datetime:
    stat = path.stat()
    timestamp = getattr(stat, "st_birthtime", stat.st_mtime)
    return datetime.fromtimestamp(timestamp)


def extract_date(path: Path) -> tuple[datetime, str]:
    filename_date = date_from_filename(path)
    if filename_date:
        return filename_date, "filename"

    exif_date = date_from_exif(path)
    if exif_date:
        return exif_date, "exif"

    return date_from_filesystem(path), "filesystem"


def preview_path(path: Path, rotation: int) -> Path:
    suffix = f"-rot{rotation}" if rotation else ""
    return THUMB_DIR / f"{path.stem}{suffix}.jpg"


def ensure_preview(path: Path, rotation: int) -> Path:
    preview = preview_path(path, rotation)
    if preview.exists() and preview.stat().st_mtime >= path.stat().st_mtime:
        return preview

    magick = shutil.which("magick")
    if not magick:
        raise RuntimeError("ImageMagick 'magick' command is required to generate previews.")

    command = [magick, str(path), "-auto-orient"]
    if rotation:
        command.extend(["-rotate", str(rotation)])
    command.extend(
        [
            "-thumbnail",
            "420x420^",
            "-gravity",
            "center",
            "-extent",
            "420x320",
            "-strip",
            "-quality",
            "76",
            str(preview),
        ]
    )
    subprocess.run(command, check=True)
    return preview


def display_path(path: Path, rotation: int) -> Path:
    return DISPLAY_DIR / f"{path.stem}-rot{rotation}{path.suffix.lower()}"


def ensure_display(path: Path, rotation: int) -> Path:
    if not rotation:
        return path

    display = display_path(path, rotation)
    if display.exists() and display.stat().st_mtime >= path.stat().st_mtime:
        return display

    magick = shutil.which("magick")
    if not magick:
        raise RuntimeError("ImageMagick 'magick' command is required to rotate display images.")

    subprocess.run(
        [
            magick,
            str(path),
            "-auto-orient",
            "-rotate",
            str(rotation),
            "-strip",
            "-quality",
            "92",
            str(display),
        ],
        check=True,
    )
    return display


def dimensions(path: Path) -> tuple[int, int]:
    magick = shutil.which("magick")
    if not magick:
        raise RuntimeError("ImageMagick 'magick' command is required to read image sizes.")

    result = subprocess.run(
        [magick, "identify", "-format", "%w %h", str(path)],
        check=True,
        capture_output=True,
        text=True,
    )
    width, height = result.stdout.split()
    return int(width), int(height)


def web_path(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def build_manifest() -> list[dict[str, str | int]]:
    THUMB_DIR.mkdir(parents=True, exist_ok=True)
    DISPLAY_DIR.mkdir(parents=True, exist_ok=True)
    items = []
    active_previews = set()
    active_displays = set()

    for path in sorted(SOURCE_DIR.iterdir()):
        if not path.is_file() or path.suffix.lower() not in IMAGE_SUFFIXES:
            continue

        date, source = extract_date(path)
        rotation = ROTATION_OVERRIDES.get(path.name, 0)
        preview = ensure_preview(path, rotation)
        display = ensure_display(path, rotation)
        width, height = dimensions(display)
        active_previews.add(preview)
        if display != path:
            active_displays.add(display)
        items.append(
            {
                "src": web_path(display),
                "thumb": web_path(preview),
                "isoDate": date.isoformat(timespec="seconds"),
                "sortKey": f"{date.isoformat(timespec='seconds')}|{path.name}",
                "day": date.day,
                "month": MONTHS[date.month],
                "monthKey": f"{date.year:04d}-{date.month:02d}",
                "monthLabel": f"{MONTHS[date.month]} {date.year}",
                "year": date.year,
                "dateLabel": f"{date.day} {MONTHS[date.month]}",
                "dialogLabel": f"{date.day} {MONTHS[date.month]} {date.year}",
                "dateSource": source,
                "orientation": "landscape" if width >= height else "portrait",
            }
        )

    for preview in THUMB_DIR.glob("*.jpg"):
        if preview not in active_previews:
            preview.unlink()

    for display in DISPLAY_DIR.iterdir():
        if display.is_file() and display not in active_displays:
            display.unlink()

    return sorted(items, key=lambda item: item["sortKey"])


def write_manifest(items: list[dict[str, str | int]]) -> None:
    payload = json.dumps(items, ensure_ascii=False, indent=2)
    MANIFEST_PATH.write_text(
        "// Generated by scripts/generate_timelapse_manifest.py\n"
        f"window.TIMELAPSE_ITEMS = {payload};\n",
        encoding="utf-8",
    )


def main() -> None:
    items = build_manifest()
    write_manifest(items)
    sources = Counter(item["dateSource"] for item in items)
    print(f"Generated {len(items)} timelapse entries in {MANIFEST_PATH.relative_to(ROOT)}")
    print("Date sources:", ", ".join(f"{key}={value}" for key, value in sorted(sources.items())))


if __name__ == "__main__":
    main()
