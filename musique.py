# Ambiance originale synthétisée de zéro : une soirée entendue d'un peu loin.
# Musique house étouffée « à travers le mur », sans voix.
import numpy as np, wave, sys
from scipy import signal
SR = 44100
DUR = float(sys.argv[2]) if len(sys.argv) > 2 else 13.3
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
mediums = filtre(mus, [500, 1500], 'band', 2) * 0.1
mus = reverb(graves * 1.4 + mediums, 0.7, 1200, 0.3)

# ---------------- mixage ----------------
def norm(x): return x / (np.sqrt((x ** 2).mean()) + 1e-9)
mix = norm(mus)
fi = int(0.5 * SR); mix[:fi] *= np.linspace(0, 1, fi)[:, None]
fo = int(0.7 * SR); mix[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.2
mix /= np.percentile(np.abs(mix), 99.8)
mix = np.tanh(mix * 0.85) * 0.9
pcm = (mix * 32767).astype(np.int16)
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('ok')
