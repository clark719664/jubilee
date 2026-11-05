"""Records every line in Jot's voice on a free Kaggle machine, so nothing heavy runs on this PC.

    python record.py <kaggle-cli> <lines.json> <output-dir>

Supertonic 3 int8 through sherpa-onnx, speaker 1, speed 1.05, 5 steps: Jot's exact settings.
Weights: BigScience OpenRAIL-M; the code and the sherpa-onnx conversion are MIT and Apache-2.0.
"""
import base64
import gzip
import json
import pathlib
import subprocess
import sys
import time

RUNNER = r'''
import base64, gzip, json, os, subprocess, sys, tarfile, time, urllib.request, wave
LINES = json.loads(gzip.decompress(base64.b64decode("__LINES__")))
OUT = "/kaggle/working/clips"
os.makedirs(OUT, exist_ok=True)
subprocess.run([sys.executable, "-m", "pip", "install", "-q", "sherpa-onnx", "numpy"], check=True)
import numpy as np
import sherpa_onnx
name = "sherpa-onnx-supertonic-3-tts-int8-2026-05-11"
urllib.request.urlretrieve(f"https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/{name}.tar.bz2", "/tmp/m.tar.bz2")
tarfile.open("/tmp/m.tar.bz2").extractall("/tmp")
d = f"/tmp/{name}"
tts = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
    supertonic=sherpa_onnx.OfflineTtsSupertonicModelConfig(
        duration_predictor=f"{d}/duration_predictor.int8.onnx", text_encoder=f"{d}/text_encoder.int8.onnx",
        vector_estimator=f"{d}/vector_estimator.int8.onnx", vocoder=f"{d}/vocoder.int8.onnx",
        tts_json=f"{d}/tts.json", unicode_indexer=f"{d}/unicode_indexer.bin", voice_style=f"{d}/voice.bin"),
    num_threads=4)))
t0 = time.time()
for i, line in enumerate(LINES):
    cfg = sherpa_onnx.GenerationConfig()
    cfg.sid = 1
    cfg.speed = 1.05
    cfg.num_steps = 5
    if line.get("lang"):
        cfg.extra = {"lang": line["lang"]}
    audio = tts.generate(line["text"], cfg)
    if i < 3:
        plain = sherpa_onnx.GenerationConfig()
        plain.sid, plain.speed, plain.num_steps = 1, 1.05, 5
        same = len(tts.generate(line["text"], plain).samples) == len(audio.samples)
        print("lang check", line.get("lang"), "same as default", same, flush=True)
    pcm = np.clip(np.array(audio.samples), -1, 1)
    with wave.open(f"/tmp/{line['id']}.wav", "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(audio.sample_rate)
        w.writeframes((pcm * 32767).astype(np.int16).tobytes())
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", f"/tmp/{line['id']}.wav", "-ac", "1", "-c:a", "aac", "-b:a", "48k", "-movflags", "+faststart", f"{OUT}/{line['id']}.m4a"], check=True)
    if i % 100 == 0:
        print(i, len(LINES), round(time.time() - t0), flush=True)
print("finished", len(os.listdir(OUT)), flush=True)
subprocess.run(["tar", "czf", "/kaggle/working/clips.tgz", "-C", "/kaggle/working", "clips"], check=True)
subprocess.run(["rm", "-rf", OUT])
'''


def main():
    cli, lines_file, out_dir = sys.argv[1:4]
    blob = base64.b64encode(gzip.compress(pathlib.Path(lines_file).read_bytes())).decode()
    work = pathlib.Path(out_dir) / "_kernel"
    work.mkdir(parents=True, exist_ok=True)
    (work / "runner.py").write_text(RUNNER.replace("__LINES__", blob), encoding="utf-8")
    kid = "clark719664/jubilee-voice"
    (work / "kernel-metadata.json").write_text(json.dumps({
        "id": kid, "title": "jubilee-voice", "code_file": "runner.py", "language": "python", "kernel_type": "script",
        "is_private": True, "enable_gpu": False, "enable_internet": True,
    }), encoding="utf-8")
    print(subprocess.run([cli, "kernels", "push", "-p", str(work)], capture_output=True, text=True).stdout[-200:], flush=True)
    start = time.time()
    while True:
        time.sleep(30)
        status = subprocess.run([cli, "kernels", "status", kid], capture_output=True, text=True).stdout.strip().splitlines()[-1]
        print(f"{status} {int(time.time() - start)}s", flush=True)
        if any(s in status.upper() for s in ("COMPLETE", "ERROR", "CANCEL")):
            break
    print(subprocess.run([cli, "kernels", "output", kid, "-p", out_dir], capture_output=True, text=True).stdout[-200:], flush=True)


if __name__ == "__main__":
    main()
