from sqlalchemy.orm import Session
from fastapi import HTTPException
from . import models
from sqlalchemy.ext.mutable import MutableDict
import json
import random

def convert_to_mutabledict(d):
    if isinstance(d, dict):
        # Recursiv, convertim toate valorile dict în MutableDict
        return MutableDict({k: convert_to_mutabledict(v) for k, v in d.items()})
    else:
        # Dacă nu e dict (ex. string), îl returnăm așa
        return d

class ProgressService:
    @staticmethod
    def getProgresByUserId(db: Session, user_id: int):
        progres = db.query(models.ProgresUtilizator).filter(models.ProgresUtilizator.user_id == user_id).first()
        if not progres:
            raise HTTPException(status_code=404, detail="Progresul utilizatorului nu a fost găsit.")
        return progres

    @staticmethod
    def getExercitiiNerezolvate(db: Session, user_id: int):
        progres = ProgressService.getProgresByUserId(db, user_id)
        structura = progres.exercitii_nerezolvate

        for k, v in structura.items():
            if isinstance(v, str):
                try:
                    structura[k] = json.loads(v)
                except json.JSONDecodeError:
                    structura[k] = []

        capitole_ordonate = sorted((int(k) for k in structura if structura[k]), reverse=True)

        if not capitole_ordonate:
            return []

        capitol_curent = str(capitole_ordonate[0])
        exercitii_finale = structura[capitol_curent][:]

        exercitii_vechi = []
        for cap in sorted(structura.keys(), key=int):
            if int(cap) < int(capitol_curent):
                exercitii_vechi.extend(structura[cap])

        rezultat = []
        for ex in exercitii_finale:
            rezultat.append(ex)
            if exercitii_vechi and random.random() < 0.2:
                ex_vechi = random.choice(exercitii_vechi)
                rezultat.append(ex_vechi)
                exercitii_vechi.remove(ex_vechi)
        print(rezultat)
        return rezultat

    @staticmethod
    def getRecunoastereNotaPortativ(db: Session, user_id: int):
        progres = ProgressService.getProgresByUserId(db, user_id)
        return progres.recunoastere_nota_portativ

    @staticmethod
    def getNumberOfUsers(db:Session):
        users = db.query(models.ProgresUtilizator).all()
        return len(users)


    @staticmethod
    def getRecunoastereRitm(db: Session, user_id: int):
        progres = ProgressService.getProgresByUserId(db, user_id)
        return progres.recunoastere_ritm

    @staticmethod
    def getUltimulExercitiuParcurs(db: Session, user_id: int):
        progres = ProgressService.getProgresByUserId(db, user_id)
        print(progres.ultimul_exercitiu_parcurs)
        print(progres.clasa_note)
        return progres.ultimul_exercitiu_parcurs

    @staticmethod
    def getAuzAbsolut(db: Session, user_id: int):
        progres = ProgressService.getProgresByUserId(db, user_id)
        return progres.auz_absolut

    @staticmethod
    def getAcurateteCapitol(db: Session, user_id: int):
        progres = ProgressService.getProgresByUserId(db, user_id)
        return progres.acuratete_capitol

    @staticmethod
    def getClasaRitm(db: Session, user_id: int):
        progres = ProgressService.getProgresByUserId(db, user_id)
        return progres.clasa_ritm

    @staticmethod
    def getClasaNote(db: Session, user_id: int):
        progres = ProgressService.getProgresByUserId(db, user_id)
        return progres.clasa_note
    @staticmethod
    def updateEx(db:Session, user_id:int,ex:int):
        progres = db.query(models.ProgresUtilizator).filter(models.ProgresUtilizator.user_id == user_id).first()
        if not progres:
            raise HTTPException(status_code=404, detail="Progresul utilizatorului nu a fost găsit.")
        progres.ultimul_exercitiu_parcurs=ex
        db.commit()
        db.refresh(progres)

    @staticmethod
    def updateRecunoastereIntervale(db: Session, user_id: int, date_noi: dict):
        progres = db.query(models.ProgresUtilizator).filter(models.ProgresUtilizator.user_id == user_id).first()
        if not progres:
            raise HTTPException(status_code=404, detail="Progresul utilizatorului nu a fost găsit.")

        # Dacă e None, inițializează cu MutableDict-uri goale
        if progres.recunoastere_intervale is None:
            progres.recunoastere_intervale = MutableDict({
                "auz": MutableDict(),
                "scris": MutableDict()
            })
        else:
            # Dacă există deja, convertește toate dict-urile în MutableDict recursiv
            progres.recunoastere_intervale = convert_to_mutabledict(progres.recunoastere_intervale)

        # Lucrează direct pe progres.recunoastere_intervale, care e acum complet MutableDict
        for cheie in ["auz", "scris"]:
            if cheie not in progres.recunoastere_intervale:
                progres.recunoastere_intervale[cheie] = MutableDict()

            # Asigură-te că subdictionarele sunt tot MutableDict
            progres.recunoastere_intervale[cheie] = convert_to_mutabledict(progres.recunoastere_intervale[cheie])

            for k, v in date_noi.get(cheie, {}).items():
                vechi = progres.recunoastere_intervale[cheie].get(k, "0/0")
                corecte_v, total_v = map(int, vechi.split('/'))
                corecte_n, total_n = map(int, v.split('/'))

                corecte_final = corecte_v + corecte_n
                total_final = total_v + total_n

                progres.recunoastere_intervale[cheie][k] = f"{corecte_final}/{total_final}"

        print(progres.recunoastere_intervale)
        db.commit()
        db.refresh(progres)
        print("Dupa commit")
        print(progres.recunoastere_intervale)
        return progres.recunoastere_intervale

    @staticmethod
    def updateAuzAbsolut(db: Session, user_id: int, nota_raw: str, corect: int):
        progres = db.query(models.ProgresUtilizator).filter(models.ProgresUtilizator.user_id == user_id).first()
        if not progres:
            raise HTTPException(status_code=404, detail="Progresul utilizatorului nu a fost găsit.")

        # Normalizează nota (e.g., sol# -> Sol#)
        nota = nota_raw.strip().capitalize()
        if len(nota) > 1 and nota[1] in ['#', 'b', '♯', '♭']:
            nota = nota[0].upper() + nota[1:]

        # Inițializează structura dacă e None
        if progres.auz_absolut is None:
            progres.auz_absolut = MutableDict()
        else:
            progres.auz_absolut = convert_to_mutabledict(progres.auz_absolut)

        if nota not in progres.auz_absolut:
            progres.auz_absolut[nota] = "0/0"

        corecte_v, total_v = map(int, progres.auz_absolut[nota].split('/'))
        total_v += 1
        if corect==1:
            print("E corect")
            corecte_v += 1

        progres.auz_absolut[nota] = f"{corecte_v}/{total_v}"

        db.commit()
        db.refresh(progres)
        return progres.auz_absolut

    @staticmethod
    def updateRecunoastereRitm(db: Session, user_id: int, date_noi: dict):
        progres = db.query(models.ProgresUtilizator).filter(models.ProgresUtilizator.user_id == user_id).first()
        if not progres:
            raise HTTPException(status_code=404, detail="Progresul utilizatorului nu a fost găsit.")

        # Dacă e None, inițializează cu MutableDict-uri goale
        if progres.recunoastere_ritm is None:
            progres.recunoastere_ritm = MutableDict({
                "auz": MutableDict(),
                "scris": MutableDict()
            })
        else:
            # Dacă există deja, convertește toate dict-urile în MutableDict recursiv
            progres.recunoastere_ritm = convert_to_mutabledict(progres.recunoastere_ritm)

        for cheie in ["auz", "scris"]:
            if cheie not in progres.recunoastere_ritm:
                progres.recunoastere_ritm[cheie] = MutableDict()
            progres.recunoastere_ritm[cheie] = convert_to_mutabledict(progres.recunoastere_ritm[cheie])

            for k, v in date_noi.get(cheie, {}).items():
                vechi = progres.recunoastere_ritm[cheie].get(k, "0/0")
                corecte_v, total_v = map(int, vechi.split('/'))
                corecte_n, total_n = map(int, v.split('/'))

                corecte_final = corecte_v + corecte_n
                total_final = total_v + total_n

                progres.recunoastere_ritm[cheie][k] = f"{corecte_final}/{total_final}"

        print(progres.recunoastere_ritm)
        db.commit()
        db.refresh(progres)
        print("Dupa commit")
        print(progres.recunoastere_ritm)
        return progres.recunoastere_ritm

    @staticmethod
    def actualizare_exercitii(db: Session,chapter_id: int,exercise_id: int,idUser:int,result: int ):
        user = db.query(models.ProgresUtilizator).filter(models.ProgresUtilizator.user_id==idUser).first()
        if not user:
            raise HTTPException(status_code=404, detail="Utilizator inexistent.")

        #aici preiau exercitiul pentru a-i vedea raspunsul corect
        content = db.query(models.Content).filter(models.Content.id == exercise_id).first()

        if not content:
            raise HTTPException(status_code=404, detail="Exercițiu inexistent.")

        chapter_key = str(chapter_id)

        note_valide = {
            "Do", "Re", "Mi", "Fa", "Sol", "La", "Si",
            "Do#", "Re#", "Fa#", "Sol#", "La#"
        }
        corecte, total = map(int, user.acuratete_capitol[chapter_key].split("/"))

        nota_corecta = None
        raspuns_note = content.raspuns_corect or []
        nota_normalizata=raspuns_note[0].strip().lower().capitalize()
        if nota_normalizata in note_valide:
            nota_corecta=nota_normalizata

        val = user.exercitii_nerezolvate[chapter_key]
        if isinstance(val, str):
            nerezolvate_capitol = json.loads(val)
        else:
            nerezolvate_capitol = val

        if result == 1:
            corecte += 1
            total += 1

            if exercise_id in nerezolvate_capitol:
                nerezolvate_capitol.remove(exercise_id)

            if nota_corecta:
                c, t = map(int, user.recunoastere_nota_portativ[nota_corecta].split("/"))
                c += 1
                t += 1
                updated = dict(user.recunoastere_nota_portativ)
                updated[nota_corecta] = f"{c}/{t}"
                user.recunoastere_nota_portativ = updated

        elif result == 2:
            total += 1
            print("Exercitiu gresit = "+ str(exercise_id))
            if exercise_id not in nerezolvate_capitol:
                nerezolvate_capitol.append(exercise_id)
                print(nerezolvate_capitol)
            else:
                print("E acolo")

            if nota_corecta:
                c, t = map(int, user.recunoastere_nota_portativ[nota_corecta].split("/"))
                t += 1
                updated = dict(user.recunoastere_nota_portativ)
                updated[nota_corecta] = f"{c}/{t}"
                user.recunoastere_nota_portativ = updated

        # Reatribuiri JSON
        updated_acuratete = dict(user.acuratete_capitol)
        updated_acuratete[chapter_key] = f"{corecte}/{total}"
        user.acuratete_capitol = updated_acuratete

        #updated_nerezolvate = dict(user.exercitii_nerezolvate)
        #updated_nerezolvate[chapter_key] = nerezolvate_capitol
        user.exercitii_nerezolvate[chapter_key] = nerezolvate_capitol
        db.commit()
        db.refresh(user)

        return {
            "acuratete_capitol": user.acuratete_capitol[chapter_key],
            "nerezolvate": user.exercitii_nerezolvate[chapter_key],
            "recunoastere_note_portativ": user.recunoastere_nota_portativ
        }
