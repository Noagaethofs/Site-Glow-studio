# Petite musique originale, synthétisée de zéro (aucun extrait existant) : groove jazzy-funk 120 bpm
import numpy as np, wave, sys
SR = 44100
DUR = 8.8
N = int(SR * DUR)
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(50)

def hz(n):  # n = numéro MIDI
    return 440.0 * 2 ** ((n - 69) / 12)

def ajoute(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N: return
    sig = sig[:N - i] * gain
    L[i:i + len(sig)] += sig * np.sqrt((1 - pan) / 2) * 1.414
    R[i:i + len(sig)] += sig * np.sqrt((1 + pan) / 2) * 1.414

def env(n, a, d):
    t = np.arange(n) / SR
    e = np.exp(-t / d)
    ra = int(a * SR)
    if ra: e[:ra] *= np.linspace(0, 1, ra)
    return e

def rhodes(notes, dur, d=0.9):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for m in notes:
        f = hz(m)
        s += np.sin(2*np.pi*f*t + 0.6*np.sin(2*np.pi*f*t)*np.exp(-t/0.15)) \
             + 0.25*np.sin(2*np.pi*2*f*t)*np.exp(-t/0.3)
    s *= env(n, 0.004, d) * (1 + 0.12*np.sin(2*np.pi*5*t))
    return s / max(1, len(notes))

def basse(m, dur):
    n = int(dur * SR); t = np.arange(n) / SR; f = hz(m)
    s = np.sin(2*np.pi*f*t) + 0.35*np.sin(2*np.pi*2*f*t) + 0.12*np.sin(2*np.pi*3*f*t)
    s = np.tanh(1.6 * s) * env(n, 0.005, 0.35)
    s[-200:] *= np.linspace(1, 0, 200)
    return s

def kick():
    n = int(0.3 * SR); t = np.arange(n) / SR
    f = 45 + 95 * np.exp(-t / 0.035)
    return np.sin(2*np.pi*np.cumsum(f)/SR) * env(n, 0.001, 0.12)

def bruit(n):
    x = rng.standard_normal(n)
    return np.diff(np.concatenate([[0], x]))  # passe-haut simple

def clap():
    n = int(0.25 * SR); s = bruit(n) * env(n, 0.001, 0.06)
    for k in (0.008, 0.016):
        i = int(k * SR); s[i:] += bruit(n - i) * env(n - i, 0.001, 0.05) * 0.6
    return s * 0.5

def charley(ouvert=False):
    n = int((0.25 if ouvert else 0.06) * SR)
    return bruit(bruit(n).size) * env(n, 0.0005, 0.08 if ouvert else 0.018) * 0.25

def vibra(m, dur=1.2):
    n = int(dur * SR); t = np.arange(n) / SR; f = hz(m)
    s = np.sin(2*np.pi*f*t) + 0.2*np.sin(2*np.pi*4*f*t)*np.exp(-t/0.05)
    return s * env(n, 0.002, 0.5) * (1 + 0.25*np.sin(2*np.pi*6*t))

def scintille(t0, notes):
    for k, m in enumerate(notes):
        ajoute(vibra(m, 0.9), t0 + k * 0.045, 0.16, pan=-0.6 + 1.2 * k / len(notes))

def souffle(t0, dur, montee=True):
    n = int(dur * SR); x = rng.standard_normal(n)
    # bruit filtré qui s'ouvre : moyenne glissante de taille décroissante
    out = np.zeros(n); taille = np.linspace(40, 4, n).astype(int) if montee else np.linspace(4, 40, n).astype(int)
    c = np.cumsum(np.concatenate([[0], x]))
    idx = np.arange(n)
    lo = np.maximum(0, idx - taille)
    out = (c[idx + 1] - c[lo]) / (idx + 1 - lo)
    e = np.linspace(0, 1, n) ** 2 if montee else np.linspace(1, 0, n) ** 2
    ajoute(out * e * 0.5, t0)

B = 0.5          # durée d'un temps (120 bpm)
T0 = 0.85        # premier temps : le cachet se brise
SW = 0.04        # léger swing

# levée : petite cascade de vibraphone pendant que l'enveloppe est posée
for k, m in enumerate([62, 65, 69, 72, 74]):
    ajoute(vibra(m, 1.0), 0.12 + k * 0.13, 0.14, pan=-0.3 + 0.15 * k)
souffle(0.35, 0.5)

accords = [[50, 53, 57, 60, 64], [43, 47, 50, 53, 57], [48, 52, 55, 59, 62], [48, 52, 55, 59, 62, 64]]
racines = [38, 43, 36, 36]
# motif de basse par mesure (temps, demi-tons depuis la racine, durée)
motif_basse = [(0, 0, .45), (1.5, 12, .2), (2, 7, .4), (3, 10, .2), (3.5, 12, .4)]
# accords syncopés (temps dans la mesure)
stabs = [(0, .45), (1.5, .3), (2.5, .3), (3.5, .4)]
# mélodie (mesure, temps, note, durée)
melodie = [(0, 0.5, 74, .4), (0, 1, 77, .4), (0, 1.5, 76, .3), (0, 2.5, 74, .6),
           (1, 0.5, 71, .4), (1, 1, 74, .4), (1, 2, 77, .5), (1, 3, 76, .4), (1, 3.5, 74, .4),
           (2, 0, 76, .8), (2, 1.5, 79, .4), (2, 2, 83, .4), (2, 2.5, 81, .4), (2, 3, 79, 1.0)]

def temps(b, x):
    t = T0 + (b * 4 + x) * B
    if (x * 2) % 2 == 1: t += SW
    return t

for b in range(3):
    for x, d in stabs:
        ajoute(rhodes(accords[b], d * 2 + 0.3, 0.5), temps(b, x), 0.42, pan=0.25)
    for x, st, d in motif_basse:
        ajoute(basse(racines[b] + st, d), temps(b, x), 0.55)
    for x in range(4):
        ajoute(kick(), temps(b, x), 0.9 if x in (0, 2) else 0.55)
        if x in (1, 3): ajoute(clap(), temps(b, x), 0.55, pan=0.05)
        for h in (0, 0.5):
            ajoute(charley(ouvert=(h == 0.5 and x == 3)), temps(b, x + h), 0.9 if h else 0.6, pan=-0.35)
for b, x, m, d in melodie:
    ajoute(vibra(m, d + 0.6), temps(b, x), 0.2, pan=-0.15)

# les éclats argentés quand la carte sort
scintille(2.2, [86, 88, 91, 93, 95, 98])
# l'invitation apparaît (mesure 4) : accord final qui résonne, petit coup de cymbale
souffle(T0 + 11 * B, 0.5)
t4 = T0 + 12 * B
ajoute(rhodes(accords[3], 2.4, 1.4), t4, 0.55, pan=0.2)
ajoute(basse(36, 1.2), t4, 0.6)
ajoute(kick(), t4, 0.9)
n = int(2.2 * SR); ajoute(bruit(n) * env(n, 0.002, 0.7) * 0.18, t4, 1, pan=0.3)
scintille(t4 + 0.15, [84, 88, 91, 95])

# mix : fondu d'entrée/sortie, normalisation douce
st = np.stack([L, R], 1)
st[:int(0.05 * SR)] *= np.linspace(0, 1, int(0.05 * SR))[:, None]
fo = int(1.0 * SR); st[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.5
st = np.tanh(st / np.max(np.abs(st)) * 1.3) * 0.85
pcm = (st * 32767).astype(np.int16)
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('ok', pcm.shape[0] / SR, 's')
