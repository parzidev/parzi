import os
import cv2
import yt_dlp

YOUTUBE_URL = "https://www.youtube.com/watch?v=FtutLA63Cp8"
DOWNLOAD_DIR = "images"
VIDEO_FILENAME = "bad_apple.mp4"

def download_video():
    print("Downloading video...")
    ydl_opts = {
        'format': 'best',
        'outtmpl': VIDEO_FILENAME,
        'extractor_args': {'youtube': {'player_client': ['android', 'web']}}
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([YOUTUBE_URL])
    print("Video download completed.")

def extract_frames():
    print("Extracting frames (4 frames per second)...")
    if not os.path.exists(DOWNLOAD_DIR):
        os.makedirs(DOWNLOAD_DIR)

    cap = cv2.VideoCapture(VIDEO_FILENAME)
    fps = cap.get(cv2.CAP_PROP_FPS)
    
    if fps == 0:
        print("Error: Could not read video or FPS is 0.")
        return

    frame_count = 0
    success = True
    
    while success:
        success, frame = cap.read()
        if not success:
            break
            
        step = int(fps / 4)
        if step > 0 and frame_count % step == 0:
            index = frame_count // step
            output_path = os.path.join(DOWNLOAD_DIR, f"{index + 1}.png")
            resized_frame = cv2.resize(frame, (64, 64))
            cv2.imwrite(output_path, resized_frame)
            
        frame_count += 1

    cap.release()
    print(f"Process completed. Images saved to '{DOWNLOAD_DIR}' folder.")

if __name__ == "__main__":
    if not os.path.exists(VIDEO_FILENAME):
        download_video()
    else:
        print("Video already exists, skipping download.")
        
    extract_frames()
