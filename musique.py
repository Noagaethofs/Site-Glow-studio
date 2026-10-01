# Musique originale synthétisée de zéro : techno de soirée, 130 bpm
# montée → drop au cachet, kick 4/4, basse en contretemps, ligne acide, stabs rave.
import numpy as np, wave, sys
SR = 44100
DUR = 8.8
N = int(SR * DUR)
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(130)

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

def scie_naive(freq_arr):
    ph = np.cumsum(freq_arr) / SR
    return 2 * (ph % 1.0) - 1

def passe_bas(x, cut, q):
    """Filtre à variable d'état (résonant) ; cut peut varier dans le temps."""
    y = np.zeros_like(x); lp = bp = 0.0
    cut = np.broadcast_to(cut, x.shape)
    f = 2 * np.sin(np.pi * np.minimum(cut, SR / 6) / SR)
    damp = 1.0 / q
    for i in range(len(x)):
        hp = x[i] - lp - damp * bp
        bp += f[i] * hp
        lp += f[i] * bp
        y[i] = lp
    return y

def bruit(n):
    x = rng.standard_normal(n); return np.diff(np.concatenate([[0], x]))

def kick():
    n = int(0.32 * SR); t = np.arange(n) / SR
    f = 46 + 150 * np.exp(-t / 0.028)
    s = np.sin(2*np.pi*np.cumsum(f)/SR) * env(n, 0.0005, 0.16)
    s[:40] += np.linspace(0.8, 0, 40)
    return np.tanh(2.0 * s)

def clap(g=1.0):
    n = int(0.25 * SR); s = bruit(n) * env(n, 0.001, 0.08)
    for k in (0.006, 0.013, 0.02):
        i = int(k * SR); s[i:] += bruit(n - i) * env(n - i, 0.001, 0.06) * 0.7
    return s * 0.4 * g

def charley(ouvert=False):
    n = int((0.2 if ouvert else 0.04) * SR)
    return bruit(n) * env(n, 0.0005, 0.06 if ouvert else 0.01) * 0.28

def crash(dur=2.0):
    n = int(dur * SR); return bruit(n) * env(n, 0.001, 0.8) * 0.22

def basse(m, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    s = scie_naive(np.full(n, hz(m))) + np.sin(2*np.pi*hz(m)*t)
    s = passe_bas(s, 300 + 900 * np.exp(-t / 0.04), 1.2)
    s = np.tanh(2.2 * s) * env(n, 0.002, 0.09)
    s[-120:] *= np.linspace(1, 0, 120)
    return s

def stab(notes, dur=0.35):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for m in notes:
        for d in (-0.1, 0.0, 0.1):
            s += scie_naive(np.full(n, hz(m + d)))
    s = passe_bas(s / (3 * len(notes)), 800 + 5000 * np.exp(-t / 0.06), 2.0)
    return s * env(n, 0.002, 0.12)

def cloche(m, dur=0.4):
    n = int(dur * SR); t = np.arange(n) / SR; f = hz(m)
    return (np.sin(2*np.pi*f*t) + 0.4*np.sin(2*np.pi*2.76*f*t)*np.exp(-t/0.05)) * env(n, 0.001, 0.15)

B = 60 / 130
T0 = 0.85
def tp(x): return T0 + x * B
nb_temps = int((DUR - T0) / B) + 1

# --- montée (0 → drop au cachet) : souffle filtré qui s'ouvre, roulement de claps qui accélère, sirène
n = int(T0 * SR); t = np.arange(n) / SR
souffle = passe_bas(rng.standard_normal(n), 300 + 9000 * (t / T0) ** 2, 3.0) * (t / T0) ** 1.5 * 0.5
ajoute(souffle, 0.0)
tt = 0.0
while tt < T0 - 0.03:
    ajoute(clap(0.25 + 0.7 * tt / T0), tt, 1.0)
    tt += 0.11 - 0.07 * tt / T0
sir = scie_naive(hz(57) * (1 + 1.0 * (t / T0) ** 2)) * (t / T0) * 0.15
ajoute(passe_bas(sir, 2500, 1.5), 0.0, 1.0, pan=0.3)

# --- le drop
ajoute(crash(2.2), T0, 1.0, pan=-0.2)
for i in range(nb_temps):
    ajoute(kick(), tp(i), 1.0)
    if i % 2 == 1: ajoute(clap(), tp(i), 1.0, pan=0.05)
    ajoute(charley(True), tp(i + 0.5), 0.9, pan=0.3)
    for q in (0.25, 0.75): ajoute(charley(), tp(i + q), 0.7, pan=-0.3)
    ajoute(charley(), tp(i), 0.4, pan=-0.3)
    # basse « roulante » sur les doubles croches hors temps
    racine = 33 if (i // 4) % 2 == 0 else 31   # la, puis sol
    for q in (0.25, 0.5, 0.75):
        ajoute(basse(racine + (12 if q == 0.5 else 0), B * 0.22), tp(i + q), 0.45)

# --- ligne acide (doubles croches) qui s'ouvre au fil du morceau
pas = [57, 57, 69, 57, 60, 57, 72, 57, 57, 64, 57, 67, 69, 57, 60, 62]
accent = [1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0]
d16 = B / 4
debut = tp(0); fin_acid = DUR
n_pas = int((fin_acid - debut) / d16)
freqs = np.zeros(int((fin_acid - debut) * SR) + 1); acc_env = np.zeros_like(freqs)
for k in range(n_pas):
    i0 = int(k * d16 * SR); i1 = int((k + 1) * d16 * SR)
    m = pas[k % 16] - 12 + (-2 if (k // 16) % 2 else 0)
    freqs[i0:i1] = hz(m)
    seg = np.arange(i1 - i0) / SR
    acc_env[i0:i1] = (1.0 if accent[k % 16] else 0.5) * np.exp(-seg / 0.05)
lent = np.linspace(0, 1, len(freqs))
cut = 250 + 2600 * lent ** 1.4 + 2200 * acc_env * (0.4 + lent)
acid = passe_bas(scie_naive(freqs), cut, 7.0)
acid = np.tanh(2.5 * acid) * (0.35 + 0.65 * (acc_env > 0.01))
ajoute(acid * 0.16, debut, 1.0, pan=-0.15)

# --- stabs rave (avec écho) chaque mesure
for bar in range(nb_temps // 4 + 1):
    notes = [57, 60, 64, 67, 71] if bar % 2 == 0 else [55, 59, 62, 66, 69]
    for x in (0.5, 2.75):
        s = stab(notes)
        for e, g in enumerate((0.42, 0.2, 0.09)):
            ajoute(s, tp(bar * 4 + x + e * 0.75), g, pan=0.35 * (-1) ** e)

# --- éclats quand la carte sort, impact quand l'invitation apparaît, final
for k, m in enumerate([88, 91, 93, 96, 100]):
    ajoute(cloche(m), 2.2 + k * 0.05, 0.13, pan=-0.5 + 0.25 * k)
ajoute(crash(1.5), tp(6), 0.7, pan=0.25)
n = int(1.2 * SR); t = np.arange(n) / SR
impact = np.sin(2*np.pi*np.cumsum(60 * np.exp(-t / 0.3) + 30) / SR) * env(n, 0.001, 0.35)
ajoute(impact, tp(6), 0.5)
ajoute(crash(1.5), tp(16), 0.8)

st = np.stack([L, R], 1)
fo = int(0.5 * SR); st[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.2
st /= np.percentile(np.abs(st), 99.7)
st = np.tanh(st * 0.95) * 0.9
pcm = (st * 32767).astype(np.int16)
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('ok')
