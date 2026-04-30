from datetime import datetime
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Dict, Any
from uuid import uuid4
import os
import re
import subprocess
import textwrap

import httpx
from PIL import Image, ImageDraw

from app.core.config import settings
from app.core.database import get_database
from app.models.video_lectures import VideoLectureCreate, VideoLectureResponse


def _supabase_base_url() -> str:
    base = (settings.SUPABASE_URL or "").strip().rstrip("/")
    if base.endswith("/rest/v1"):
        base = base[:-8]
    return base


def _supabase_headers(content_type: str = "application/octet-stream") -> dict:
    service_key = (settings.SUPABASE_SERVICE_ROLE_KEY or "").strip()
    return {
        "Authorization": f"Bearer {service_key}",
        "apikey": service_key,
        "x-upsert": "true",
        "Content-Type": content_type,
    }


async def _upload_to_supabase_storage(path: str, content: bytes, content_type: str) -> str:
    bucket = (settings.SUPABASE_STORAGE_BUCKET or "").strip()
    base = _supabase_base_url()
    upload_url = f"{base}/storage/v1/object/{bucket}/{path}"
    async with httpx.AsyncClient(timeout=60.0) as client:
        upload_resp = await client.post(upload_url, headers=_supabase_headers(content_type), content=content)
    if upload_resp.status_code >= 400:
        raise RuntimeError(f"Supabase upload failed ({upload_resp.status_code}): {upload_resp.text}")

    sign_url = f"{base}/storage/v1/object/sign/{bucket}/{path}"
    async with httpx.AsyncClient(timeout=30.0) as client:
        sign_resp = await client.post(
            sign_url,
            headers=_supabase_headers("application/json"),
            json={"expiresIn": 60 * 60 * 24 * 7},
        )
    if sign_resp.status_code < 400:
        signed_payload = sign_resp.json()
        signed_relative = signed_payload.get("signedURL")
        if signed_relative:
            return f"{base}/storage/v1{signed_relative}"
    return f"{base}/storage/v1/object/public/{bucket}/{path}"


class VideoLecturesService:
    @staticmethod
    def _require_db():
        db = get_database()
        if db is None:
            raise RuntimeError("Database connection is not available")
        return db

    @staticmethod
    def _sanitize_filename(value: str) -> str:
        cleaned = re.sub(r"[^a-zA-Z0-9\-_\s]", "", value or "").strip()
        cleaned = re.sub(r"\s+", "-", cleaned)
        return cleaned[:80] or "video-lecture"

    @staticmethod
    def _create_cover_image(path: str, title: str, topic: str, voice_style: str):
        img = Image.new("RGB", (1280, 720), color=(15, 23, 42))
        draw = ImageDraw.Draw(img)
        draw.rectangle((0, 0, 1280, 120), fill=(30, 41, 59))
        draw.rectangle((60, 78, 460, 90), fill=(56, 189, 248))
        draw.text((70, 28), "INTELLILEARN VIDEO LECTURE", fill=(148, 163, 184))
        draw.text((70, 220), title[:90], fill=(241, 245, 249))
        draw.text((70, 300), f"Topic: {topic[:120]}", fill=(148, 163, 184))
        draw.text((70, 350), f"Voice: {voice_style}", fill=(56, 189, 248))
        img.save(path, format="PNG")

    @staticmethod
    def _chunk_script(script: str) -> list[str]:
        lines = [
            re.sub(r"\s+", " ", line).strip()
            for line in str(script).replace("\r", "\n").split("\n")
            if line.strip()
        ]
        if not lines:
            return ["Lecture overview"]

        chunks: list[str] = []
        # Prefer section-like chunks first.
        for line in lines:
            parts = re.split(r"(?<=[.!?])\s+", line)
            for part in parts:
                sentence = part.strip()
                if sentence:
                    chunks.append(sentence)

        merged: list[str] = []
        current = ""
        for sentence in chunks:
            candidate = f"{current} {sentence}".strip() if current else sentence
            if len(candidate) <= 210:
                current = candidate
            else:
                if current:
                    merged.append(current)
                current = sentence
        if current:
            merged.append(current)

        return merged[:8] if merged else ["Lecture overview"]

    @staticmethod
    def _create_scene_image(
        path: str,
        title: str,
        topic: str,
        scene_text: str,
        scene_index: int,
        total_scenes: int,
    ):
        img = Image.new("RGB", (1280, 720), color=(5, 20, 45))
        draw = ImageDraw.Draw(img)

        # Layered bars / cards for AI-like style.
        draw.rectangle((0, 0, 1280, 120), fill=(17, 39, 78))
        draw.rectangle((0, 120, 1280, 720), fill=(6, 25, 58))
        draw.rounded_rectangle((48, 170, 1230, 660), radius=24, fill=(8, 35, 78))
        draw.rectangle((48, 118, 420, 136), fill=(56, 189, 248))
        draw.rectangle((48, 142, 320, 148), fill=(99, 102, 241))

        scene_label = f"Scene {scene_index + 1} / {max(total_scenes, 1)}"
        draw.text((58, 34), "INTELLILEARN AI VIDEO LECTURE", fill=(147, 197, 253))
        draw.text((1080, 34), scene_label, fill=(125, 211, 252))
        draw.text((58, 80), title[:80], fill=(226, 232, 240))
        draw.text((58, 200), f"Topic: {topic[:120]}", fill=(148, 163, 184))

        wrapped = textwrap.wrap(scene_text, width=70)[:8]
        y = 258
        for line in wrapped:
            draw.text((76, y), f"- {line}", fill=(226, 232, 240))
            y += 46

        # Visual guide strip.
        progress_width = int((scene_index + 1) / max(total_scenes, 1) * 1180)
        draw.rounded_rectangle((52, 676, 1232, 700), radius=8, fill=(15, 52, 96))
        draw.rounded_rectangle((52, 676, 52 + progress_width, 700), radius=8, fill=(56, 189, 248))
        img.save(path, format="PNG")

    @staticmethod
    def _tts_to_audio(script: str, audio_path: str, speed: float):
        try:
            from gtts import gTTS
            tts = gTTS(text=script[:3500], lang="en", slow=bool(speed < 0.95))
            tts.save(audio_path)
            return os.path.exists(audio_path) and os.path.getsize(audio_path) > 0
        except Exception:
            return False

    def _render_video(self, title: str, topic: str, script: str, voice_style: str, voice_speed: float) -> tuple[bytes, int]:
        try:
            import imageio_ffmpeg
            ffmpeg_bin = imageio_ffmpeg.get_ffmpeg_exe()
        except Exception as e:
            raise RuntimeError(f"Video dependencies missing: {e}")

        with TemporaryDirectory() as tmp:
            audio_path = os.path.join(tmp, "voice.mp3")
            video_path = os.path.join(tmp, "lecture.mp4")
            silent_path = os.path.join(tmp, "silent_lecture.mp4")
            concat_list_path = os.path.join(tmp, "segments.txt")

            has_audio = self._tts_to_audio(script, audio_path, voice_speed)
            script_chunks = self._chunk_script(script)
            estimated_duration = max(24, min(260, int(len(script.split()) / 2.5)))
            duration_sec = estimated_duration
            scene_count = max(1, len(script_chunks))
            words_per_scene = [max(8, len(chunk.split())) for chunk in script_chunks]
            total_weight = max(1, sum(words_per_scene))

            segment_files: list[str] = []
            for idx, chunk in enumerate(script_chunks):
                scene_image_path = os.path.join(tmp, f"scene_{idx:02d}.png")
                segment_path = os.path.join(tmp, f"seg_{idx:02d}.mp4")
                self._create_scene_image(
                    scene_image_path,
                    title,
                    topic,
                    chunk,
                    idx,
                    scene_count,
                )

                seg_duration = max(4.0, round(estimated_duration * (words_per_scene[idx] / total_weight), 2))
                cmd_scene = [
                    ffmpeg_bin,
                    "-y",
                    "-loop",
                    "1",
                    "-i",
                    scene_image_path,
                    "-c:v",
                    "libx264",
                    "-t",
                    str(seg_duration),
                    "-pix_fmt",
                    "yuv420p",
                    "-an",
                    segment_path,
                ]
                run_scene = subprocess.run(cmd_scene, capture_output=True, text=True)
                if run_scene.returncode != 0:
                    raise RuntimeError(run_scene.stderr.strip() or "ffmpeg scene render failed")
                segment_files.append(segment_path)

            with open(concat_list_path, "w", encoding="utf-8") as f:
                for seg in segment_files:
                    f.write(f"file '{seg}'\n")

            concat_cmd = [
                ffmpeg_bin,
                "-y",
                "-f",
                "concat",
                "-safe",
                "0",
                "-i",
                concat_list_path,
                "-c",
                "copy",
                silent_path,
            ]
            run_concat = subprocess.run(concat_cmd, capture_output=True, text=True)
            if run_concat.returncode != 0:
                raise RuntimeError(run_concat.stderr.strip() or "ffmpeg concat failed")

            if has_audio:
                # Keep metadata stable without relying on ffprobe availability.
                duration_sec = estimated_duration

                cmd = [
                    ffmpeg_bin,
                    "-y",
                    "-i",
                    silent_path,
                    "-i",
                    audio_path,
                    "-c:a",
                    "aac",
                    "-b:a",
                    "128k",
                    "-shortest",
                    video_path,
                ]
            else:
                cmd = [
                    ffmpeg_bin,
                    "-y",
                    "-i",
                    silent_path,
                    "-c",
                    "copy",
                    video_path,
                ]

            run = subprocess.run(cmd, capture_output=True, text=True)
            if run.returncode != 0:
                raise RuntimeError(run.stderr.strip() or "ffmpeg rendering failed")

            with open(video_path, "rb") as f:
                return f.read(), duration_sec

    async def create_video_lecture(self, user_id: str, payload: VideoLectureCreate) -> VideoLectureResponse:
        lecture_id = str(uuid4())
        safe_name = self._sanitize_filename(payload.title)
        file_name = f"{safe_name}-{lecture_id[:8]}.mp4"
        storage_path = f"uploads/video-lectures/{user_id}/{file_name}"

        video_bytes, duration_sec = self._render_video(
            payload.title,
            payload.topic,
            payload.script,
            payload.voiceStyle.value,
            payload.voiceSpeed,
        )
        video_url = await _upload_to_supabase_storage(storage_path, video_bytes, "video/mp4")

        doc = {
            "id": lecture_id,
            "userId": user_id,
            "title": payload.title,
            "topic": payload.topic,
            "videoUrl": video_url,
            "durationSec": duration_sec,
            "voiceStyle": payload.voiceStyle.value,
            "voiceSpeed": payload.voiceSpeed,
            "tags": ["AI-Generated", "Video Lecture", payload.topic],
            "createdAt": datetime.utcnow(),
        }
        db = self._require_db()
        db.collection("video_lectures").document(lecture_id).set(doc)
        return VideoLectureResponse(**doc)

    async def list_video_lectures(self, user_id: str, page: int = 1, limit: int = 50) -> Dict[str, Any]:
        db = self._require_db()
        skip = (page - 1) * limit
        docs = db.collection("video_lectures").where("userId", "==", user_id).stream()
        rows = []
        for doc in docs:
            row = doc.to_dict() or {}
            row["id"] = doc.id
            rows.append(row)
        rows.sort(key=lambda x: x.get("createdAt") or datetime.min, reverse=True)
        total = len(rows)
        records = rows[skip:skip + limit]
        return {
            "videoLectures": [VideoLectureResponse(**item) for item in records],
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": (total + limit - 1) // limit,
        }


video_lectures_service = VideoLecturesService()
