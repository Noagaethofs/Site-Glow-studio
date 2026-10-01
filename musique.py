# Musique originale synthétisée de zéro : fanfare festive sur l'air de « Joyeux anniversaire »
# (mélodie du domaine public), 3/4 rapide façon fanfare de fête.
import numpy as np, wave, sys
SR = 44100
DUR = 8.8
N = int(SR * DUR)
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(50)

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

def scie(f, t, harm=16, roll=0.06):
    s = np.zeros_like(t)
    for k in range(1, harm + 1):
        if f * k > 15000: break
        s += np.sin(2*np.pi*f*k*t) / k * np.exp(-(k - 1) * roll)
    return s

def cuivre(m, dur, roll=0.07):
    """Trompette/trombone : attaque cuivrée, vibrato, tenue puis relâche."""
    n = int((dur + 0.08) * SR); t = np.arange(n) / SR
    vib = 0.005 * np.sin(2*np.pi*5.5*t) * np.clip((t - 0.12) * 5, 0, 1)
    brill = np.clip(t / 0.03, 0, 1)            # le son s'ouvre à l'attaque
    s = scie(hz(m), t * (1 + vib), 18, roll + 0.25 * (1 - brill))
    e = np.minimum(1, t / 0.018) * (0.75 + 0.25 * np.exp(-t / 0.08))
    rel = int(0.08 * SR); e[-rel:] *= np.linspace(1, 0, rel)
    return s * e

def section(m, dur, harmo):
    s = cuivre(m, dur) + 0.6 * cuivre(m + 0.06, dur)
    if harmo is not None: s += 0.7 * cuivre(harmo, dur, 0.09)
    return s * 0.5

def piano(notes, dur):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for m in notes:
        f = hz(m); s += (np.sin(2*np.pi*f*t) + 0.5*np.sin(2*np.pi*2*f*t)*np.exp(-t/0.1) + 0.2*np.sin(2*np.pi*3*f*t)*np.exp(-t/0.05))
    s *= env(n, 0.002, 0.18); s[-100:] *= np.linspace(1, 0, 100)
    return s / len(notes)

def tuba(m, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.tanh(1.8 * (np.sin(2*np.pi*hz(m)*t) + 0.5*np.sin(2*np.pi*2*hz(m)*t) + 0.25*np.sin(2*np.pi*3*hz(m)*t)))
    s *= np.minimum(1, t / 0.01) * env(n, 0, 0.25); s[-200:] *= np.linspace(1, 0, 200)
    return s

def bruit(n):
    x = rng.standard_normal(n); return np.diff(np.concatenate([[0], x]))

def kick():
    n = int(0.25 * SR); t = np.arange(n) / SR
    f = 50 + 110 * np.exp(-t / 0.03)
    return np.tanh(1.4 * np.sin(2*np.pi*np.cumsum(f)/SR) * env(n, 0.0005, 0.1))

def caisse_claire(g=1.0):
    n = int(0.2 * SR); t = np.arange(n) / SR
    s = bruit(n) * env(n, 0.0005, 0.06) * 0.6 + np.sin(2*np.pi*190*t) * env(n, 0.0005, 0.04) * 0.5
    return s * g

def clap(g=1.0):
    n = int(0.2 * SR); s = bruit(n) * env(n, 0.001, 0.06)
    for k in (0.007, 0.014, 0.021):
        i = int(k * SR); s[i:] += bruit(n - i) * env(n - i, 0.001, 0.05) * 0.7
    return s * 0.45 * g

def tambourin():
    n = int(0.12 * SR); t = np.arange(n) / SR
    s = bruit(n) * env(n, 0.001, 0.03)
    for f in (5200, 7100, 9300): s += 0.2 * np.sin(2*np.pi*f*t) * env(n, 0.001, 0.04)
    return s * 0.25

def crash(dur=2.0):
    n = int(dur * SR); return bruit(n) * env(n, 0.001, 0.7) * 0.25

def cloche(m, dur=0.4):
    n = int(dur * SR); t = np.arange(n) / SR; f = hz(m)
    return (np.sin(2*np.pi*f*t) + 0.4*np.sin(2*np.pi*2.76*f*t)*np.exp(-t/0.05)) * env(n, 0.001, 0.15)

def langue_de_belle_mere(t0):
    """Sifflet de fête qui se déroule : glissando nasillard."""
    n = int(0.55 * SR); t = np.arange(n) / SR
    f = 520 + 380 * np.clip(t / 0.25, 0, 1) ** 0.7 + 12 * np.sin(2*np.pi*9*t)
    ph = 2*np.pi*np.cumsum(f)/SR
    s = sum(np.sin(k * ph) / k for k in range(1, 9)) * np.minimum(1, t / 0.02) * np.clip((0.55 - t) / 0.1, 0, 1)
    ajoute(s * 0.12, t0, pan=0.5)

B = 0.307                 # un temps (~195 bpm, en 3/4)
T0 = 0.85                 # le cachet se brise : levée « Joy-eux »
def tp(x): return T0 + B + x * B   # x = temps à partir du premier temps fort

# --- intro : roulement de caisse claire qui monte jusqu'au cachet
k = 0; t = 0.05
while t < T0 - 0.02:
    ajoute(caisse_claire(0.15 + 0.6 * t / T0), t, 1.0, pan=0.1)
    t += 0.085 - 0.045 * t / T0; k += 1
ajoute(crash(1.5), T0, 0.9, pan=-0.2)

# --- mélodie (temps, note, durée) en fa majeur, à partir de la levée
mel = [(-1, 72, .7), (-0.3, 72, .25),
       (0, 74, .9), (1, 72, .9), (2, 77, .9), (3, 76, 1.8), (5, 72, .7), (5.7, 72, .25),
       (6, 74, .9), (7, 72, .9), (8, 79, .9), (9, 77, 1.8), (11, 72, .7), (11.7, 72, .25),
       (12, 84, .9), (13, 81, .9), (14, 77, .9), (15, 76, .9), (16, 74, 1.4), (17, 82, .7), (17.7, 82, .25),
       (18, 81, .9), (19, 77, .9), (20, 79, .9), (21, 77, 2.6)]
gamme = [65, 67, 69, 70, 72, 74, 76, 77, 79, 81, 82, 84, 86]
def tierce_dessous(m):
    if m in gamme: i = gamme.index(m); return gamme[i - 2] if i >= 2 else m - 4
    return m - 4
for x, m, d in mel:
    ajoute(section(m, d * B, tierce_dessous(m)), tp(x), 0.6, pan=-0.1)
    ajoute(cuivre(m - 12, d * B, 0.12), tp(x), 0.12, pan=0.25)   # doublure à l'octave grave

# --- accompagnement « oum-pa-pa » : basse au 1er temps, accords aux 2e et 3e
acc = {0: (41, [65, 69, 72]), 1: (36, [64, 67, 70]), 2: (36, [64, 67, 70]), 3: (41, [65, 69, 72]),
       4: (41, [63, 69, 72]), 5: (46, [65, 70, 74]), 6: (41, [65, 69, 72]), 7: (41, [65, 69, 72])}
for bar in range(7):
    basse, ch = acc[bar]
    if bar == 6: ch2 = [64, 67, 70]
    else: ch2 = ch
    ajoute(tuba(basse, B * 0.9), tp(bar * 3), 0.55)
    ajoute(tuba(basse + 7, B * 0.6), tp(bar * 3 + 2.5), 0.25) if bar % 2 else None
    ajoute(piano(ch, B * 0.6), tp(bar * 3 + 1), 0.5, pan=0.3)
    ajoute(piano(ch2, B * 0.6), tp(bar * 3 + 2), 0.5, pan=0.3)
    ajoute(kick(), tp(bar * 3), 0.9)
    ajoute(caisse_claire(0.3), tp(bar * 3 + 1), 1.0)
    ajoute(caisse_claire(0.25), tp(bar * 3 + 2), 1.0)
    ajoute(clap(0.5), tp(bar * 3 + 1), 1.0, pan=-0.15)
    ajoute(clap(0.5), tp(bar * 3 + 2), 1.0, pan=0.15)
    for h in range(6): ajoute(tambourin(), tp(bar * 3 + h * 0.5), 0.55 if h % 2 else 0.35, pan=0.45)
# roulement vers la dernière phrase (« Joyeux anniversaire » final)
for k in range(6): ajoute(caisse_claire(0.25 + 0.06 * k), tp(16.5 + k * 0.25), 1.0)

# --- éclats argentés quand la carte sort, puis apparition de l'invitation
for k, m in enumerate([89, 93, 96, 98, 101]):
    ajoute(cloche(m), 2.2 + k * 0.05, 0.14, pan=-0.5 + 0.25 * k)
ajoute(crash(1.2), tp(9), 0.55, pan=0.3)

# --- final : accord tenu, trille de cuivres, cymbale, sifflet de fête
fin = tp(21)
ajoute(tuba(41, 1.3), fin, 0.6); ajoute(kick(), fin, 1.0)
ajoute(piano([65, 69, 72, 77], 1.2), fin, 0.6, pan=0.3)
ajoute(crash(1.8), fin, 1.0)
for i, m in enumerate([65, 69, 72]):
    ajoute(cuivre(m, 1.1), fin, 0.18, pan=-0.4 + 0.4 * i)
for k in range(8): ajoute(cloche(96 + (k % 2) * 2, 0.2), fin + 0.1 + k * 0.07, 0.08, pan=0.4)
langue_de_belle_mere(fin + 0.15)
langue_de_belle_mere(tp(3) + 0.05)

st = np.stack([L, R], 1)
fo = int(0.45 * SR); st[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.2
st /= np.percentile(np.abs(st), 99.7)
st = np.tanh(st * 0.9) * 0.9
pcm = (st * 32767).astype(np.int16)
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('ok, fin de la mélodie à', round(fin, 2), 's')
