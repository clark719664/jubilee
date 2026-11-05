import base64
import glob
import json
import os
import shutil
import subprocess
import sys
import time
import urllib.parse
import urllib.request

BATCH = json.loads(base64.b64decode("__BATCH_B64__"))
OUT = "/kaggle/working/out"
os.makedirs(OUT, exist_ok=True)
T0 = time.time()
LOG = []


def log(msg):
    line = f"[{time.time() - T0:7.1f}s] {msg}"
    print(line, flush=True)
    LOG.append(line)


def sh(cmd):
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if r.returncode:
        log(f"FAILED: {cmd}\n{r.stdout[-2000:]}\n{r.stderr[-2000:]}")
        raise SystemExit(1)
    return r.stdout


root = "/tmp" if shutil.disk_usage("/tmp").free > 40 * 2**30 else "/kaggle/working"
comfy = f"{root}/ComfyUI"
log(f"model root {root}, free {shutil.disk_usage(root).free / 2**30:.1f} GB")
sh(f"git clone --depth 1 https://github.com/comfyanonymous/ComfyUI.git {comfy}")
sh(f"git clone --depth 1 https://github.com/city96/ComfyUI-GGUF.git {comfy}/custom_nodes/ComfyUI-GGUF")
sh(f"grep -viE '^(torch|torchvision|torchaudio)\\b' {comfy}/requirements.txt > /tmp/req.txt && "
   f"pip install -q -r /tmp/req.txt gguf")
log("comfy installed")

PARALLEL_CURL = r"""
url="$1"; out="$2"; n=8
size=$(curl -sIL "$url" | grep -i '^content-length' | tail -1 | tr -dc 0-9)
if [ -z "$size" ] || [ "$size" -lt 1000000000 ]; then exec curl -sSL --retry 5 -o "$out" "$url"; fi
chunk=$(( (size + n - 1) / n ))
for i in $(seq 0 $((n-1))); do
  s=$((i*chunk)); e=$((s+chunk-1)); [ $e -ge $size ] && e=$((size-1))
  curl -sSL --retry 5 -r $s-$e -o "$out.part$i" "$url" &
done
wait
cat $(for i in $(seq 0 $((n-1))); do echo "$out.part$i"; done) > "$out" && rm -f "$out".part*
"""
procs = []
for m in BATCH["models"]:
    dest = f"{comfy}/models/{m['dir']}"
    os.makedirs(dest, exist_ok=True)
    target = f"{dest}/{os.path.basename(m['file'])}"
    url = f"https://huggingface.co/{m['repo']}/resolve/main/{m['file']}"
    procs.append((target, subprocess.Popen(["bash", "-c", PARALLEL_CURL, "_", url, target])))
while any(pr.poll() is None for _, pr in procs):
    time.sleep(30)
    log("downloading: " + ", ".join(
        f"{os.path.basename(t_)[:24]} {sum(os.path.getsize(x) for x in glob.glob(t_ + '*')) / 2**30:.1f}GB"
        for t_, _ in procs))
for t_, pr in procs:
    if pr.returncode:
        log(f"download FAILED {t_}")
        raise SystemExit(1)
log("models ready")

os.makedirs(f"{comfy}/input", exist_ok=True)
for name, b64 in BATCH["refs"].items():
    with open(f"{comfy}/input/{name}", "wb") as f:
        f.write(base64.b64decode(b64))

server = subprocess.Popen([sys.executable, "main.py", "--listen", "127.0.0.1", "--port", "8188",
                          "--disable-auto-launch", "--cuda-device", "0"],
                         cwd=comfy, stdout=open("/kaggle/working/comfy.log", "w"),
                         stderr=subprocess.STDOUT)
URL = "http://127.0.0.1:8188"


def get(path):
    with urllib.request.urlopen(URL + path, timeout=60) as r:
        return r.read()


for _ in range(180):
    try:
        get("/system_stats")
        break
    except Exception:
        time.sleep(2)
log("comfy up")

results = []
for job in BATCH["jobs"]:
    t = time.time()
    try:
        req = urllib.request.Request(URL + "/prompt", data=json.dumps({"prompt": job["graph"]}).encode(),
                                     headers={"Content-Type": "application/json"})
        pid = json.loads(urllib.request.urlopen(req, timeout=60).read())["prompt_id"]
        while True:
            h = json.loads(get(f"/history/{pid}"))
            if pid in h:
                entry = h[pid]
                if entry.get("status", {}).get("status_str") == "error":
                    raise RuntimeError(json.dumps(entry["status"].get("messages"))[-1500:])
                if entry.get("outputs"):
                    break
            time.sleep(1)
        img = next(i for o in entry["outputs"].values() for i in o.get("images", []))
        q = urllib.parse.urlencode(img)
        with open(f"{OUT}/{job['id']}.png", "wb") as f:
            f.write(get(f"/view?{q}"))
        results.append({"id": job["id"], "ok": True, "seconds": round(time.time() - t, 1)})
        log(f"done {job['id']} {time.time() - t:.1f}s")
    except Exception as e:
        results.append({"id": job["id"], "ok": False, "error": str(e)[-1500:]})
        log(f"ERROR {job['id']}: {e}")
    with open("/kaggle/working/results.json", "w") as f:
        json.dump({"results": results, "log": LOG}, f, indent=1)

server.terminate()
log("batch finished")
