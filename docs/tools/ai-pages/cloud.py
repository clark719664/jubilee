"""Generate coloring page drawings on a free Kaggle GPU, so nothing heavy runs on this PC.

    python cloud.py <kaggle-cli> <jobs.json> <output-dir>

jobs.json is [{"id": "christmas-tree", "subject": "...", "seed": 1}]. Uses FLUX.1 schnell (Apache-2.0).
"""
import base64
import json
import pathlib
import subprocess
import sys
import time

HERE = pathlib.Path(__file__).parent
STYLE = (
    "black and white children's coloring book page of {subject}. "
    "Thick bold clean black outlines on a pure white background, simple large rounded shapes, "
    "cute friendly cartoon style for young kids, one big subject filling the page, lots of open white space to color. "
    "Pure line art, no shading, no gray, no hatching, no filled black or gray areas, every shape left white inside, no text, no letters, no border."
)
MODEL = {"repo": "Comfy-Org/flux1-schnell", "file": "flux1-schnell-fp8.safetensors", "dir": "checkpoints"}


def graph(job):
    return {
        "1": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": MODEL["file"]}},
        "2": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["1", 1], "text": STYLE.format(subject=job["subject"])}},
        "3": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["1", 1], "text": ""}},
        "4": {"class_type": "EmptySD3LatentImage", "inputs": {"width": 1024, "height": 1024, "batch_size": 1}},
        "5": {"class_type": "KSampler", "inputs": {
            "model": ["1", 0], "seed": job["seed"], "steps": 4, "cfg": 1.0, "sampler_name": "euler", "scheduler": "simple",
            "positive": ["2", 0], "negative": ["3", 0], "latent_image": ["4", 0], "denoise": 1.0}},
        "6": {"class_type": "VAEDecode", "inputs": {"samples": ["5", 0], "vae": ["1", 2]}},
        "7": {"class_type": "SaveImage", "inputs": {"images": ["6", 0], "filename_prefix": "page"}},
    }


def main():
    cli, jobs_file, out_dir = sys.argv[1:4]
    jobs = json.loads(pathlib.Path(jobs_file).read_text(encoding="utf-8"))
    batch = {"models": [MODEL], "refs": {}, "jobs": [{"id": j["id"], "graph": graph(j)} for j in jobs]}
    work = pathlib.Path(out_dir) / "_kernel"
    work.mkdir(parents=True, exist_ok=True)
    blob = base64.b64encode(json.dumps(batch).encode()).decode()
    (work / "runner.py").write_text((HERE / "runner.py").read_text(encoding="utf-8").replace("__BATCH_B64__", blob), encoding="utf-8")
    kid = "clark719664/jubilee-coloring"
    (work / "kernel-metadata.json").write_text(json.dumps({
        "id": kid, "title": "jubilee-coloring", "code_file": "runner.py", "language": "python", "kernel_type": "script",
        "is_private": True, "enable_gpu": True, "enable_internet": True, "machine_shape": "NvidiaTeslaT4",
    }), encoding="utf-8")
    print(subprocess.run([cli, "kernels", "push", "-p", str(work)], capture_output=True, text=True).stdout[-300:], flush=True)
    start = time.time()
    while True:
        time.sleep(30)
        status = subprocess.run([cli, "kernels", "status", kid], capture_output=True, text=True).stdout.strip().splitlines()[-1]
        print(f"{status} {int(time.time() - start)}s", flush=True)
        if any(s in status.upper() for s in ("COMPLETE", "ERROR", "CANCEL")):
            break
    print(subprocess.run([cli, "kernels", "output", kid, "-p", out_dir], capture_output=True, text=True).stdout[-300:], flush=True)


if __name__ == "__main__":
    main()
