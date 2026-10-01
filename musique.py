# Ambiance originale synthétisée de zéro : une soirée entendue d'un peu loin.
# Musique house étouffée « à travers le mur », brouhaha de conversations et verres qui trinquent.
import numpy as np, wave, sys
from scipy import signal
SR = 44100
DUR = 8.8
N = int(SR * DUR)
rng = np.random.default_rng(1450)

def hz(n): return 440.0 * 2 ** ((n - 69) / 12)
def vide(): return np.zeros((N, 2))

def ajoute(bus, sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N or i < 0: return
    sig = sig[:N - i] * gain
    bus[i:i + len(sig), 0] += sig * np.sqrt((1 - pan) / 2) * 1.414
    bus[i:i + len(sig), 1] += sig * np.sqrt((1 + pan) / 2) * 1.414

def env(n, a, d):
    t = np.arange(n) / SR; e = np.exp(-t / d); ra = int(a * SR)
    if ra: e[:ra] *= np.linspace(0, 1, ra)
    return e

def bruit(n): return rng.standard_normal(n)

def filtre(x, f, kind='low', ordre=4):
    sos = signal.butter(ordre, f, btype=kind, fs=SR, output='sos')
    return signal.sosfilt(sos, x, axis=0)

def reverb(x, duree=0.9, clarte=3000, mix=0.35):
    n = int(duree * SR); t = np.arange(n) / SR
    ir = np.stack([bruit(n), bruit(n)], 1) * np.exp(-t / (duree / 6.9))[:, None]
    ir = filtre(ir, clarte, 'low', 2); ir /= np.sqrt((ir ** 2).sum(0))
    mouille = np.stack([signal.fftconvolve(x[:, c], ir[:, c])[:N] for c in range(2)], 1)
    return x * (1 - mix) + mouille * mix * 3

# ---------------- la musique (house, 124 bpm) ----------------
mus = vide()
B = 60 / 124
def kick():
    n = int(0.35 * SR); t = np.arange(n) / SR
    f = 50 + 90 * np.exp(-t / 0.035)
    return np.tanh(1.6 * np.sin(2*np.pi*np.cumsum(f)/SR) * env(n, 0.001, 0.2))
def basse(m, dur):
    n = int(dur * SR); t = np.arange(n) / SR; f = hz(m)
    s = np.sin(2*np.pi*f*t) + 0.3*np.sin(2*np.pi*2*f*t) + 0.15*np.sin(2*np.pi*3*f*t)
    s *= np.minimum(1, t / 0.005) * env(n, 0, 0.25); s[-200:] *= np.linspace(1, 0, 200)
    return np.tanh(1.5 * s)
def clap():
    n = int(0.2 * SR); s = bruit(n) * env(n, 0.001, 0.07)
    return filtre(s, [900, 6000], 'band', 2) * 0.8
def charley(ouvert):
    n = int((0.18 if ouvert else 0.04) * SR)
    return filtre(bruit(n), 7000, 'high', 2) * env(n, 0.0005, 0.05 if ouvert else 0.01) * 0.4
def accord(notes, dur):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for m in notes:
        for d in (-0.07, 0.07):
            f = hz(m + d)
            s += np.sin(2*np.pi*f*t) + 0.5*np.sin(2*np.pi*2*f*t) + 0.25*np.sin(2*np.pi*3*f*t)
    return s * env(n, 0.005, 0.2) / (2 * len(notes))

grille = [([57, 60, 64, 67], 33), ([53, 57, 60, 64], 29), ([55, 59, 62, 65], 31), ([52, 55, 59, 62], 28)]
t0 = -0.3   # la soirée a déjà commencé
i = 0
while t0 + i * B < DUR:
    t = t0 + i * B; bar = (i // 4) % 4
    ch, rac = grille[bar]
    ajoute(mus, kick(), t, 1.0)
    if i % 2: ajoute(mus, clap(), t, 0.6)
    ajoute(mus, charley(True), t + B / 2, 0.6, 0.2)
    ajoute(mus, basse(rac + 12, B * 0.4), t + B / 2, 0.55)
    if i % 4 in (0, 2): ajoute(mus, accord(ch, 0.4), t + B * 0.75, 0.5, -0.2)
    i += 1
# à travers le mur : on ne garde que les graves, plus un soupçon de médiums
graves = filtre(mus, 380, 'low', 4)
mediums = filtre(mus, [600, 1800], 'band', 2) * 0.07
mus = reverb(graves * 1.4 + mediums, 0.7, 1200, 0.3)

# ---------------- le brouhaha ----------------
foule = vide()
voyelles = [(730, 1090, 2440), (530, 1840, 2480), (270, 2290, 3010), (570, 840, 2410),
            (300, 870, 2240), (660, 1720, 2410), (490, 1350, 1690)]
def voix(f0, echelle, debut, fin, pan, gain):
    t = debut
    while t < fin:
        phrase_fin = t + rng.uniform(0.8, 2.4)
        while t < min(phrase_fin, fin):
            d = rng.uniform(0.09, 0.22); n = int(d * SR)
            tt = np.arange(n) / SR
            f = f0 * (1 + 0.08 * np.sin(2*np.pi*rng.uniform(1, 3)*tt + rng.uniform(0, 6))) * rng.uniform(0.92, 1.1)
            ph = np.cumsum(f) / SR
            src = (2 * (ph % 1) - 1)                       # cordes vocales
            src = src + bruit(n) * 0.25 * np.exp(-tt / 0.02)  # petite consonne
            v = voyelles[rng.integers(len(voyelles))]
            s = np.zeros(n)
            for k, (fc, bw, g) in enumerate(zip(v, (90, 110, 160), (1.0, 0.6, 0.3))):
                fc *= echelle
                s += filtre(src, [max(80, fc - bw), min(SR / 2 - 100, fc + bw)], 'band', 2) * g
            s *= np.sin(np.pi * np.arange(n) / n) ** 0.7 * rng.uniform(0.5, 1.0)
            ajoute(foule, s, t, gain, pan)
            t += d * rng.uniform(0.85, 1.05)
        t += rng.uniform(0.25, 1.0)

for k in range(16):
    femme = k % 2 == 0
    voix(rng.uniform(190, 240) if femme else rng.uniform(95, 135), 1.15 if femme else 1.0,
         rng.uniform(-1.0, 0.3), DUR, rng.uniform(-0.8, 0.8), rng.uniform(0.5, 1.0))
foule = filtre(foule, 2600, 'low', 2)
foule = reverb(foule, 0.8, 3500, 0.4)

# ---------------- verres qui trinquent ----------------
verres = vide()
def tchin(t, pan):
    for j in range(rng.integers(1, 3)):
        n = int(0.9 * SR); tt = np.arange(n) / SR; s = np.zeros(n)
        base = rng.uniform(2300, 3200)
        for r, g in ((1, 1), (2.32, 0.5), (4.25, 0.25), (6.8, 0.12)):
            s += g * np.sin(2*np.pi*base*r*tt) * np.exp(-tt / (0.35 / r ** 0.5))
        s[:30] *= np.linspace(0, 1, 30)
        ajoute(verres, s, t + j * rng.uniform(0.03, 0.08), 0.05, pan)
for t in (0.5, 1.9, 2.25, 3.7, 5.2, 6.4, 7.6):
    tchin(t + rng.uniform(-0.1, 0.1), rng.uniform(-0.7, 0.7))
verres = reverb(verres, 1.0, 5000, 0.45)

# ---------------- mixage ----------------
def norm(x): return x / (np.sqrt((x ** 2).mean()) + 1e-9)
mix = norm(mus) * 1.0 + norm(foule) * 0.42 + norm(verres) * 0.12
fi = int(0.5 * SR); mix[:fi] *= np.linspace(0, 1, fi)[:, None]
fo = int(0.7 * SR); mix[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.2
mix /= np.percentile(np.abs(mix), 99.8)
mix = np.tanh(mix * 0.85) * 0.9
pcm = (mix * 32767).astype(np.int16)
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('ok')
