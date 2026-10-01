# Musique originale synthétisée de zéro : disco-house pêchue, 128 bpm
import numpy as np, wave, sys
SR = 44100
DUR = 8.8
N = int(SR * DUR)
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(14)

def hz(n): return 440.0 * 2 ** ((n - 69) / 12)

def ajoute(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N or i < 0: return
    sig = sig[:N - i] * gain
    L[i:i + len(sig)] += sig * np.sqrt((1 - pan) / 2) * 1.414
    R[i:i + len(sig)] += sig * np.sqrt((1 + pan) / 2) * 1.414

def env(n, a, d):
    t = np.arange(n) / SR; e = np.exp(-t / d); ra = int(a * SR)
    if ra: e[:ra] *= np.linspace(0, 1, ra)
    return e

def scie(f, t, harm=14, brillance=1.0):
    s = np.zeros_like(t)
    for k in range(1, harm + 1):
        if f * k > 16000: break
        s += np.sin(2*np.pi*f*k*t) / k * np.exp(-(k - 1) * 0.08 / brillance)
    return s

def cuivres(notes, dur):  # stab brillant façon section de cuivres
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for m in notes:
        for det in (-0.08, 0.08):
            s += scie(hz(m + det), t, 16)
    e = env(n, 0.006, 0.16)
    s[-300:] *= np.linspace(1, 0, 300)
    return s * e / (2 * len(notes))

def basse(m, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.tanh(2.2 * (scie(hz(m), t, 8) * 0.8 + np.sin(2*np.pi*hz(m)*t)))
    s *= env(n, 0.003, 0.12); s[-150:] *= np.linspace(1, 0, 150)
    return s

def kick():
    n = int(0.28 * SR); t = np.arange(n) / SR
    f = 48 + 130 * np.exp(-t / 0.03)
    s = np.sin(2*np.pi*np.cumsum(f)/SR) * env(n, 0.0005, 0.11)
    s[:60] += np.linspace(0.6, 0, 60)  # attaque
    return np.tanh(1.5 * s)

def bruit(n):
    x = rng.standard_normal(n); return np.diff(np.concatenate([[0], x]))

def clap(g=1.0):
    n = int(0.22 * SR); s = bruit(n) * env(n, 0.001, 0.07)
    for k in (0.007, 0.015, 0.022):
        i = int(k * SR); s[i:] += bruit(n - i) * env(n - i, 0.001, 0.06) * 0.7
    return s * 0.45 * g

def charley(ouvert=False):
    n = int((0.22 if ouvert else 0.05) * SR)
    return bruit(n) * env(n, 0.0005, 0.07 if ouvert else 0.012) * 0.3

def crash():
    n = int(1.8 * SR); return bruit(n) * env(n, 0.001, 0.6) * 0.22

def cloche(m, dur=0.5):
    n = int(dur * SR); t = np.arange(n) / SR; f = hz(m)
    return (np.sin(2*np.pi*f*t) + 0.4*np.sin(2*np.pi*2.76*f*t)*np.exp(-t/0.05)) * env(n, 0.001, 0.18)

def lead(m, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    vib = 0.004 * np.sin(2*np.pi*6*t) * np.clip(t * 4, 0, 1)
    s = scie(hz(m), t * (1 + vib), 10) + 0.5 * np.sign(np.sin(2*np.pi*hz(m + 12)*t)) * 0.15
    s *= env(n, 0.004, 0.22); s[-200:] *= np.linspace(1, 0, 200)
    return s

B = 60 / 128      # un temps
T0 = 0.85         # le cachet se brise : le groove démarre
def tp(i): return T0 + i * B   # i en temps (peut être fractionnaire)

# --- intro (0 → 0.85 s) : roulement qui accélère + montée de souffle
for k, x in enumerate(np.linspace(0, 0.78, 12) ** 1.0):
    ajoute(clap(0.35 + 0.05 * k), 0.85 - (0.85 - x) * 1.0 - 0.0 if False else x, 1.0, pan=0.1)
n = int(0.85 * SR); souf = bruit(n) * np.linspace(0, 1, n) ** 2 * 0.25
ajoute(souf, 0.0)
for k, m in enumerate([67, 71, 74, 79]):
    ajoute(cloche(m + 12, 0.3), 0.25 + k * 0.14, 0.18)

# --- harmonie : 4 mesures + accroche finale
acc = [[62, 65, 69, 72], [62, 67, 71, 74], [64, 67, 71, 74], [62, 65, 69, 72]]
rac = [38, 43, 40, 38]
acc_fin = [60, 64, 67, 71, 74]
nb_temps = int((DUR - T0) / B) + 1

for i in range(nb_temps):
    b = min(i // 4, 3)
    # batterie : kick sur tous les temps, clap 2 et 4, charleston ouvert à contretemps, fermé en doubles
    ajoute(kick(), tp(i), 1.0)
    if i % 2 == 1: ajoute(clap(), tp(i), 1.0, pan=0.05)
    ajoute(charley(True), tp(i + 0.5), 0.8, pan=0.3)
    for q in (0.25, 0.75): ajoute(charley(), tp(i + q), 0.6, pan=-0.3)
    # basse disco en octaves sur les croches
    for h, o in ((0, 0), (0.5, 12)):
        ajoute(basse(rac[b] + o, B * 0.45), tp(i + h), 0.5)
# stabs de cuivres syncopés
for bar in range(4):
    for x in (0, 1.5, 2.5, 3.5):
        ajoute(cuivres(acc[bar], 0.22), tp(bar * 4 + x), 0.55, pan=-0.2)
# riff accrocheur (mesure, temps, note, durée)
riff = [(0, 74, .2), (0.5, 77, .2), (1, 81, .35), (1.75, 79, .2), (2.25, 77, .2), (2.75, 74, .3), (3.5, 72, .3)]
for bar in range(4):
    for x, m, d in riff:
        dec = 2 if bar == 2 else 0
        ajoute(lead(m + dec, d + 0.05), tp(bar * 4 + x), 0.2, pan=0.2)
# crash au démarrage, scintillement des éclats, montée vers la carte finale
ajoute(crash(), tp(0), 1.0, pan=-0.2)
for k, m in enumerate([88, 91, 93, 96, 98, 100]):
    ajoute(cloche(m, 0.35), 2.2 + k * 0.05, 0.16, pan=-0.6 + 0.24 * k)
ajoute(crash(), tp(8), 0.8, pan=0.2)          # l'invitation apparaît
ajoute(cuivres(acc_fin, 0.5), tp(8), 0.5)
ajoute(crash(), tp(16), 0.9)
ajoute(cuivres(acc_fin, 0.9), tp(16), 0.7)    # accord final

st = np.stack([L, R], 1)
fo = int(0.6 * SR); st[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.3
st /= np.percentile(np.abs(st), 99.7)
st = np.tanh(st * 0.9) * 0.9
pcm = (st * 32767).astype(np.int16)
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('ok')
