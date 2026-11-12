import os
import shutil
import subprocess

DRIVE_DAY1 = r"G:\My Drive\Al-bayan\Day 1"
os.makedirs(DRIVE_DAY1, exist_ok=True)

REELS = [
    {
        "comp": "CheerfulFaceMotion",
        "cover": "Cover-22-CheerfulFace",
        "name": "22-cheerful-face",
        "video_title": "Video 1 - A Cheerful Face (Sahih Muslim 2626)"
    },
    {
        "comp": "SecretDuaMotion",
        "cover": "Cover-23-SecretDua",
        "name": "23-secret-dua",
        "video_title": "Video 2 - The Secret Prayer (Sahih Muslim 2733)"
    },
    {
        "comp": "SmallDeedsMotion",
        "cover": "Cover-24-SmallDeeds",
        "name": "24-small-deeds",
        "video_title": "Video 3 - Small But Daily (Sahih al-Bukhari 6464)"
    }
]

for r in REELS:
    print(f"\n==========================================")
    print(f"Rendering {r['video_title']}...")
    out_dir = os.path.join("out", "videos", r["name"])
    os.makedirs(out_dir, exist_ok=True)

    mp4_path = os.path.join(out_dir, f"{r['name']}.mp4")
    cover_path = os.path.join(out_dir, f"{r['name']}-cover.png")

    # Render video
    print(f"Rendering MP4 to {mp4_path}...")
    subprocess.run(["npx", "remotion", "render", r["comp"], mp4_path, "--port=3125", "--log=warn"], cwd="brand", check=True, shell=True)

    # Render cover thumbnail
    print(f"Rendering Cover to {cover_path}...")
    subprocess.run(["npx", "remotion", "still", r["cover"], cover_path, "--port=3125", "--log=warn"], cwd="brand", check=True, shell=True)

    # Copy to Google Drive Day 1
    drive_mp4 = os.path.join(DRIVE_DAY1, f"{r['name']}.mp4")
    drive_cover = os.path.join(DRIVE_DAY1, f"{r['name']}-cover.png")
    shutil.copy2(os.path.join("brand", mp4_path), drive_mp4)
    shutil.copy2(os.path.join("brand", cover_path), drive_cover)
    print(f"Copied to Google Drive: {drive_mp4} & {drive_cover}")

print("\nAll 3 videos and thumbnails rendered and copied to Google Drive Day 1 successfully!")
