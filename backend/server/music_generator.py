from random import randint, sample, choices, random
import json

note_ord = ["C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4",
            "C5", "C#5", "D5", "D#5", "E5", "F5", "F#5", "G5", "G#5", "A5", "A#5", "B5"]

durata_mapare = {
    "1": "w",   # whole
    "2": "h",   # half
    "4": "q",   # quarter
    "8": "8",   # eighth
    #"16": "16",
    #"32": "32",
    #"1.": "wd",  # whole dotted
    #"2.": "hd",  # half dotted
    "4.": "qd",  # quarter dotted
    "8.": "8d",  # eighth dotted
    #"16.": "16d"
}

def parse_intervale(data: dict) -> dict:
    result = {}
    for domeniu, capitole in data.items():
        result[domeniu] = {}
        for k, v in capitole.items():
            try:
                corecte, total = map(int, v.split("/"))
            except ValueError:
                corecte, total = 0, 0
            #inainte era tupl ()
            result[domeniu][int(k)] = [corecte, total]
    return result

def definitivareIntervale(date, intervale: dict):
    print("schimb unele intervale...")
    date_auz = date.get("auz", {})

    def calc_acuratete(i):
        corecte, total = date_auz.get(i, (0, 0))
        return corecte / total if total > 0 else 0

    categorii = ["incepator", "avansat", "expert"]
    performante = {
        cat: sorted([(i, calc_acuratete(i)) for i in intervale[cat]], key=lambda x: x[1])
        for cat in categorii
    }

    def schimba_intervale(cat1, cat2):
        list1 = performante[cat1]  # mai usoara
        list2 = performante[cat2]  # mai grea
        schimburi = []

        i, j = 0, len(list2) - 1
        while i < len(list1) and j >= 0:
            interval1, acc1 = list1[i]
            interval2, acc2 = list2[j]
            if acc2 > acc1:
                schimburi.append((interval1, interval2))
                i += 1
                j -= 1
            else:
                break

        for a, b in schimburi:
            print(f"mut {b} la {cat1} si {a} la {cat2}")
            intervale[cat1].remove(a)
            intervale[cat2].remove(b)
            intervale[cat1].append(b)
            intervale[cat2].append(a)

        # Reconstruim și resortăm performante
        for cat in [cat1, cat2]:
            performante[cat] = sorted(
                [(i, calc_acuratete(i)) for i in intervale[cat]],
                key=lambda x: x[1]
            )

    schimba_intervale("incepator", "avansat")


    # Compară avansat cu mediu
    schimba_intervale("avansat", "expert")

def parse_fraction(frac_str):
    try:
        num, den = map(int, frac_str.split("/"))
        return num / den if den > 0 else 0
    except:
        return 0

def note_to_index(note):
    return note_ord.index(note)

def index_to_note(index):
    return note_ord[index]

def is_valid_transition(note1, note2, allowed_intervals):
    idx1 = note_to_index(note1)
    idx2 = note_to_index(note2)
    interval = abs(idx2 - idx1)
    return interval in allowed_intervals

def generate_sequence(intervale, lungime, nr_alteratii, note_posibile):
    sequence = []

    def bkt(position):
        if position == lungime+1:
            return True
        if position == 0:
            nota1 = "A4"
            sequence.append(nota1)
            if bkt(position + 1):
                return True
        else:
            nota1 = sequence[-1]

        prev_note_poz = note_posibile.index(nota1)
        posibile_intervale = [
            i for i in intervale
            if 0 <= prev_note_poz + i < len(note_posibile)
        ]

        import random
        random.shuffle(posibile_intervale)

        for interval in posibile_intervale:
            nota2 = note_posibile[prev_note_poz + interval]
            nr_alteratii_curente = sum('#' in n for n in sequence)
            if '#' in nota2 and nr_alteratii_curente >= nr_alteratii:
                continue

            if is_valid_transition(nota1, nota2, intervale):
                print(interval)
                sequence.append(nota2)

                if bkt(position + 1):
                    return True
                sequence.pop()
        return False

    if bkt(0):
        return sequence[1:]
    else:
        return None

def format_note(n):
        print("Nota primita "+n)
        base = n[0].lower()
        if len(n) == 3:
            accidental = n[1]
            octave = n[2]
            return f"{base}/{octave}{accidental}"
        else:
            return f"{base}/{n[1]}n"

def generateMusic(json, jsonRitm,nivel_intervale: str,nivel_ritm,addAlteratii=True):
    alteratii=0

    octaves = {
        "incepator": [
            "C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4", "C5"
        ],
        "avansat": [
            "C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4",
            "C5", "C#5", "D5", "D#5", "E5", "F5", "F#5", "G5"
        ],
        "expert": [
            "B3", "C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4",
            "C5", "C#5", "D5", "D#5", "E5", "F5", "F#5", "G5", "G#5", "A5", "A#5", "B5", "C6"
        ],
    }
    intervale_dificultate = {
        "incepator": [0,3, 4, 5, 7, 12,-3,-4,-5,-7,-12],  # minoră 3, majoră 3, cvartă, cvintă, octavă
        "avansat": [2, 8, 9, 10, 13,-2,-8,-9,-10,-13],  # majoră 2, minoră 6, majoră 6, minoră 7, nonă mică
        "expert": [1, 6, 11, 14, 15,-1,-6,-11,-14,-15]  # minoră 2, triton, majoră 7, nona mare, decimă mică
    }
    date_ajustate=parse_intervale(json)
    print(date_ajustate)
    definitivareIntervale(date_ajustate,intervale_dificultate)

    if nivel_intervale=="incepator":
        print("sunt incepator")
        lungime=5

    elif nivel_intervale=="avansat":
        print("avansat")
        lungime=9
        alteratii=1
    else:
        print("expert")
        lungime=randint(12,15)
        alteratii=3

    if addAlteratii==False:
        alteratii=0

    nr_suplimentare = lungime // 4 # cate intervale preiau din urmatorul nivel de dificultate in poolul din care aleg noi date
    intervale = intervale_dificultate[nivel_intervale][:]

    niveluri = list(intervale_dificultate.keys())
    #print(niveluri)
    index_curent = niveluri.index(nivel_intervale)

    if index_curent + 1 < len(niveluri):
        nivel_urmator = niveluri[index_curent + 1]
        intervale_urmator = intervale_dificultate[nivel_urmator]
        #print(intervale_urmator)
        intervale_suplimentare = sample(intervale_urmator, min(nr_suplimentare, len(intervale_urmator)))
        intervale.extend(intervale_suplimentare)

    note = generate_sequence(intervale, lungime, alteratii, octaves[nivel_intervale])
    #durations = ['q'] * len(note)
    durations=genereazaRitm(jsonRitm,nivel_ritm,len(note))
    enharmonic_to_flat = {
        "A#": "Bb",
        "C#": "Db",
        "D#": "Eb",
        "F#": "Gb",
        "G#": "Ab"
    }

    for i in range(len(note)):
        nota = note[i]
        if '#' in nota:
            number = random()
            if number > 0.6:
                note_name, octave = nota[:-1], nota[-1]
                if note_name in enharmonic_to_flat:
                    note[i] = enharmonic_to_flat[note_name] + octave

    print("Note generate ")
    print(note)
    result = [
        {"pitch": format_note(n)[:3], "duration": durations[i], "accidental": format_note(n)[3]}
        for i, n in enumerate(note)
    ]
    return result

def perfectPitch(prob_dict):
    print("Perfect Pitch")
    print(prob_dict)
    def parse_fraction(frac_str):
        try:
            num, den = frac_str.split('/')
            num = float(num)
            den = float(den)
            return num / den if den != 0 else 0
        except:
            return 0

    def to_international(note_ro):
        mapping = {
            "Do": "C",
            "Do#": "C#",
            "Re": "D",
            "Re#": "D#",
            "Mi": "E",
            "Fa": "F",
            "Fa#": "F#",
            "Sol": "G",
            "Sol#": "G#",
            "La": "A",
            "La#": "A#",
            "Si": "B"
        }
        return mapping.get(note_ro, note_ro) + "4"

    #notele cu cea mai mica probabilitate au sanse mai mari sa apara
    notes_acuratete = [(note, parse_fraction(prob)) for note, prob in prob_dict.items()]
    notes_acuratete.sort(key=lambda x: x[1])

    total_accuracy = sum(prob for _, prob in notes_acuratete)
    general_accuracy = total_accuracy / len(notes_acuratete)

    first_three = notes_acuratete[:3]
    rest = notes_acuratete[3:]
    weights_first_three = [0.3, 0.2, 0.1]
    prob_rest_total = 0.4
    n_rest = len(rest)
    uniform_weight = prob_rest_total / n_rest

    candidates = []
    weights = []

    for i, (note, _) in enumerate(first_three):
        candidates.append(note)
        weights.append(weights_first_three[i])

    for (note, _) in rest:
        candidates.append(note)
        weights.append(uniform_weight)

    chosen_note_ro = choices(candidates, weights=weights, k=1)[0]
    chosen_note_int = to_international(chosen_note_ro)

    print("Nota aleasa:", chosen_note_int)
    all_notes = ["Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"]
    indexNota=all_notes.index(chosen_note_ro)

    def circular_distance(a, b, length=12):
        diff = abs(a - b)
        return min(diff, length - diff)

    if general_accuracy<0.25:
        print("Easy")
        variante_easy = [note for i, note in enumerate(all_notes)
                         if circular_distance(indexNota, i) > 4]
        variante_gresite = sample(variante_easy, 2)
        variante_final = [chosen_note_ro] + variante_gresite

    elif general_accuracy<0.65:
        print("Medium")
        variante_mediu = [note for i, note in enumerate(all_notes)
                          if 0 < circular_distance(indexNota, i) <= 4 and circular_distance(indexNota, i) not in (2,)]
        variante_gresite = sample(variante_mediu, 2)
        variante_final = [chosen_note_ro] + variante_gresite

    else:
        print("Hard")
        variante_potentiale = []
        for offset in [-2, -1, 1, 2]:
            idx = (indexNota + offset) % len(all_notes)
            variante_potentiale.append(all_notes[idx])
        variante_gresite = sample(variante_potentiale, 2)
        variante_final = [chosen_note_ro] + variante_gresite
    print("Variante ", variante_final)
    print(chosen_note_int)
    return { "nota":{"pitch": format_note(chosen_note_int)[:3], "duration": "q", "accidental": format_note(chosen_note_int)[3]}, "variante": variante_final}

def genereazaRitm(ritm_json, nivel="incepator", lungime=4):
    print(f"Generez ritm pentru nivelul: {nivel}")

    dificultati = {
        "incepator": ["4", "2"], #"1", "4.", "2."],
        "avansat": ["4","2","8", "1"], #"16", "1", "2.", "4."],
        "expert": ["4", "2", "8", "8.","1", "4."]#["16", "32", "16.", "8d", "4.", "2."]
    }
    # aici am treaba

    ritm_auz = ritm_json["auz"]
    acurateti = [(durata, parse_fraction(ritm_auz.get(durata, "0/0"))) for durata in ritm_auz]
    durate_nivel = dificultati[nivel]

    durate_candidate = [d for d, _ in acurateti if d in durate_nivel]

    if not durate_candidate:
        durate_candidate = durate_nivel
        weights = [1] * len(durate_candidate)
    else:
        weights = [1 - score for durata, score in acurateti if durata in durate_candidate]
        # dacă toate sunt 0, punem greutăți egale
        if all(w == 0 for w in weights):
            weights = [1] * len(durate_candidate)
    ritm = choices(durate_candidate,weights,k=lungime)

    rezultat = [durata_mapare[d] for d in ritm if d in durata_mapare]
    print("Ritm generat:", rezultat)
    return rezultat