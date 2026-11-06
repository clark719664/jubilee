"""Translates the app's text on a free Kaggle GPU with TranslateGemma 12B through Ollama.

    python translate.py <kaggle-cli> <job.json> <output-dir>

job.json is {"langs": {"es": "Spanish"}, "strings": [...]}, or "todo": {"es": [...]} per language. Pass only what is left to do:
Kaggle refuses scripts over about a megabyte. Each language's results are saved as it goes.
"""
import base64
import gzip
import json
import pathlib
import subprocess
import sys
import time

RUNNER = r'''
import base64, concurrent.futures as cf, gzip, itertools, json, os, re, subprocess, time, urllib.request
JOB = json.loads(gzip.decompress(base64.b64decode("__JOB__")))
OUT = "/kaggle/working"
T0 = time.time()
LIMIT = 8.3 * 3600  # stop cleanly before Kaggle's session limit, so finished work is kept
def log(*a): print(round(time.time() - T0), *a, flush=True)
subprocess.run("apt-get install -y -qq zstd >/dev/null 2>&1; curl -fsSL https://ollama.com/install.sh | sh", shell=True, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
gpus = subprocess.run("nvidia-smi -L | wc -l", shell=True, capture_output=True, text=True).stdout.strip()
log("gpus", gpus)
PORTS = [11434 + i for i in range(max(1, int(gpus or 1)))]
for i, port in enumerate(PORTS):
    env = dict(os.environ, CUDA_VISIBLE_DEVICES=str(i), OLLAMA_HOST=f"127.0.0.1:{port}", OLLAMA_NUM_PARALLEL="4", OLLAMA_KEEP_ALIVE="24h")
    subprocess.Popen(["ollama", "serve"], env=env, stdout=open(f"{OUT}/ollama{i}.log", "w"), stderr=subprocess.STDOUT)
time.sleep(8)
subprocess.run(["ollama", "pull", "translategemma:12b"], env=dict(os.environ, OLLAMA_HOST=f"127.0.0.1:{PORTS[0]}"), check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
log("model ready")
SLOT = re.compile(r"\{\w+\}")
ports = itertools.cycle(PORTS)
def ask(text, code, name):
    prompt = (f"You are a professional English (en) to {name} ({code}) translator. Your goal is to accurately convey the meaning "
              f"and nuances of the original English text while adhering to {name} grammar, vocabulary, and cultural sensitivities. "
              f"This is friendly text for young children in a holiday app. "
              f"Produce only the {name} translation, without any additional explanations or commentary. "
              f"Please translate the following English text into {name}:\n\n\n{text}")
    req = urllib.request.Request(f"http://127.0.0.1:{next(ports)}/api/generate", data=json.dumps({
        "model": "translategemma:12b", "prompt": prompt, "stream": False, "options": {"temperature": 0.1, "num_predict": 700}}).encode(),
        headers={"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req, timeout=300).read())["response"].strip()
def clean(src, out):
    out = out.strip().strip("`").strip()
    out = out.split("\n\n")[0].strip()
    if src[-1:] not in ".!?…" and out[-1:] in ".。।۔":
        out = out[:-1].rstrip()
    return out
def one(text, code, name):
    slots = SLOT.findall(text)
    masked = text
    for i, s in enumerate(slots):
        masked = masked.replace(s, f"XQ{i}X", 1)
    masked = re.sub(r"\b([Ss])leeps? (until|to go|left)", lambda m: ("N" if m[1] == "S" else "n") + "ights " + m[2], masked)
    for attempt in range(3):
        try:
            t = clean(text, ask(masked, code, name))
            if not t or re.search(r"[{}]", t) or "```" in t:
                continue
            if all(f"XQ{i}X" in t for i in range(len(slots))):
                for i, s in enumerate(slots):
                    t = t.replace(f"XQ{i}X", s)
                return text, t
        except Exception as e:
            log("retry", repr(e)[:100])
    return text, None
for code, name in JOB["langs"].items():
    if time.time() - T0 > LIMIT:
        break
    done = {}
    todo = JOB["todo"][code] if "todo" in JOB else JOB["strings"]
    start = time.time()
    pool = cf.ThreadPoolExecutor(4 * len(PORTS))
    for i, (src, t) in enumerate(pool.map(lambda s: one(s, code, name) if time.time() - T0 < LIMIT else (s, None), todo)):
        if t:
            done[src] = t
        if i % 500 == 499:
            json.dump(done, open(f"{OUT}/{code}.json", "w"), ensure_ascii=False)
            log(code, i + 1, len(todo))
    pool.shutdown()
    json.dump(done, open(f"{OUT}/{code}.json", "w"), ensure_ascii=False)
    log("finished", code, len(done), "of", len(todo), round(time.time() - start), "s")
'''


def main():
    cli, job_file, out_dir = sys.argv[1:4]
    blob = base64.b64encode(gzip.compress(pathlib.Path(job_file).read_bytes())).decode()
    work = pathlib.Path(out_dir) / "_kernel"
    work.mkdir(parents=True, exist_ok=True)
    (work / "runner.py").write_text(RUNNER.replace("__JOB__", blob), encoding="utf-8")
    kid = "clark719664/jubilee-translate"
    (work / "kernel-metadata.json").write_text(json.dumps({
        "id": kid, "title": "jubilee-translate", "code_file": "runner.py", "language": "python", "kernel_type": "script",
        "is_private": True, "enable_gpu": True, "enable_internet": True, "machine_shape": "NvidiaTeslaT4",
    }), encoding="utf-8")
    print(subprocess.run([cli, "kernels", "push", "-p", str(work)], capture_output=True, text=True).stdout[-200:], flush=True)
    start = time.time()
    time.sleep(240)  # the old run's COMPLETE status lingers just after a push
    while True:
        time.sleep(60)
        status = subprocess.run([cli, "kernels", "status", kid], capture_output=True, text=True).stdout.strip().splitlines()[-1]
        print(f"{status} {int(time.time() - start)}s", flush=True)
        if any(s in status.upper() for s in ("COMPLETE", "ERROR", "CANCEL")):
            break
    print(subprocess.run([cli, "kernels", "output", kid, "-p", out_dir], capture_output=True, text=True, timeout=1800).stdout[-200:], flush=True)
    print("DOWNLOADED", flush=True)


if __name__ == "__main__":
    main()
