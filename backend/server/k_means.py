from sqlalchemy.orm import Session
from .  import models
import math
import random
import json
from fastapi import Depends, APIRouter


app = APIRouter()

def parse_score(data):
    correct = total = 0
    for val in data.values():
        try:
            c, t = map(int, val.split("/"))
            correct += c
            total += t
        except:
            continue
    return correct / total if total > 0 else 0.0

def dist(a, b):
    return math.sqrt((a[0] - b[0])**2 + (a[1] - b[1])**2)

def mean(points):
    if not points:
        return [0.0, 0.0]
    x = sum(p[0] for p in points) / len(points)
    y = sum(p[1] for p in points) / len(points)
    return [x, y]

def kmeans(X, k=3, max_iter=20):
    centers = random.sample(X, k)
    for _ in range(max_iter):
        clusters = [[] for _ in range(k)]
        for x in X:
            distances = [dist(x, c) for c in centers]
            i = distances.index(min(distances))
            clusters[i].append(x)
        new_centers = [mean(cluster) if cluster else random.choice(X) for cluster in clusters]
        if new_centers == centers:
            break
        centers = new_centers
    return centers, clusters

def atribuie_etichete(centers):
    labels = ["incepator", "avansat", "expert"]
    total_scores = [(i, sum(c)) for i, c in enumerate(centers)]
    sorted_scores = sorted(total_scores, key=lambda x: x[1])

    mapping = {}
    for rank, (i, _) in enumerate(sorted_scores):
        label = labels[min(rank, len(labels) - 1)]
        mapping[i] = label
    return mapping

def aplica_kmeans_si_actualizeaza(db: Session, k: int = 3):
    users = db.query(models.ProgresUtilizator).all()

    puncte_note = []
    puncte_ritm = []

    for u in users:
        # NOTE
        intervale = u.recunoastere_intervale or {}
        auz_note = parse_score(intervale.get("auz", {}))
        scris_note = (parse_score(intervale.get("scris", {})) + parse_score(u.auz_absolut or {})) / 2
        puncte_note.append([auz_note, scris_note])

        # RITM
        ritm = u.recunoastere_ritm or {}
        auz_ritm = parse_score(ritm.get("auz", {}))
        scris_ritm = parse_score(ritm.get("scris", {}))
        puncte_ritm.append([auz_ritm, scris_ritm])

    center_note, clusters_note = kmeans(puncte_note, k=k)
    center_ritm, clusters_ritm = kmeans(puncte_ritm, k=k)

    etichete_note = atribuie_etichete(center_note)
    etichete_ritm = atribuie_etichete(center_ritm)

    for idx, user in enumerate(users):
        nota = puncte_note[idx]
        ritm = puncte_ritm[idx]

        cl_note = min(range(k), key=lambda i: dist(nota, center_note[i]))
        cl_ritm = min(range(k), key=lambda i: dist(ritm, center_ritm[i]))

        user.clasa_note = etichete_note[cl_note]
        user.clasa_ritm = etichete_ritm[cl_ritm]

    db.commit()
