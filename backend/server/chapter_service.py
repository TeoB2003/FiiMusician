from fastapi import HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from random import sample
from math import ceil
from . import models

class ChapterService:
    @staticmethod
    def getChapters(db: Session):
        return [titlu[0] for titlu in db.query(models.Capitol.titlu).order_by(models.Capitol.id.asc()).all()]

    @staticmethod
    def getSubchaptersForChapter(db:Session, chapterName:str):
        chapter = db.query(models.Capitol).filter(models.Capitol.titlu == chapterName).first()
        if not chapter:
            return []

        ordered_ids = chapter.ordinesubcapitole

        if not ordered_ids:
            return []

        subchapters = db.query(models.Subcapitol).filter(models.Subcapitol.idcapitol == chapter.id).all()
        subchapter_map = {sc.id: sc for sc in subchapters}

        ordered_subchapters = [subchapter_map[sc_id] for sc_id in ordered_ids if sc_id in subchapter_map]

        return [sc.titlu for sc in ordered_subchapters]

    @staticmethod
    def getOrderForSubchapter(db:Session,id: int):
        subchapter=db.query(models.Subcapitol).filter(models.Subcapitol.id == id).first()
        #print(subchapter.titlu)
        #print(subchapter.ordinecontent)
        order=subchapter.ordinecontent
        return order

    @staticmethod
    def getNextSubchapter(db: Session, current_subchapter_id: int):
        # Găsim subcapitolul curent
        print("Subcapitol curent ")
        print(current_subchapter_id)
        current = db.query(models.Subcapitol).filter(models.Subcapitol.id == current_subchapter_id).first()
        if not current:
            return None


        chapter = db.query(models.Capitol).filter(models.Capitol.id == current.idcapitol).first()
        if not chapter or not chapter.ordinesubcapitole:
            print("Am iesit l chapter")
            return None

        try:
            idx = chapter.ordinesubcapitole.index(current_subchapter_id)
            next_id = chapter.ordinesubcapitole[idx + 1]
            print(next_id)
        except IndexError:
            # Am ajuns la finalul subcapitolelor din acest capitol
            next_chapter = ChapterService.getNextChapter(db, chapter.id)
            if not next_chapter or not next_chapter.ordinesubcapitole:
                return None  # Nu există următorul capitol sau nu are subcapitole

            first_sub_id = next_chapter.ordinesubcapitole[0]
            return db.query(models.Subcapitol).filter(models.Subcapitol.id == first_sub_id).first()
        except ValueError:
            return None
        return db.query(models.Subcapitol).filter(models.Subcapitol.id == next_id).first()

    @staticmethod
    def getNextChapter(db: Session, current_chapter_id: int):
        chapters = db.query(models.Capitol).order_by(models.Capitol.id).all()
        ids = [c.id for c in chapters]

        try:
            idx = ids.index(current_chapter_id)
            next_id = ids[idx + 1]
        except (ValueError, IndexError):
            return None

        return db.query(models.Capitol).filter(models.Capitol.id == next_id).first()

    @staticmethod
    def getSubchapterId(db:Session, name:str):
        object=db.query(models.Subcapitol).filter(models.Subcapitol.titlu==name).first()
        return object.id

    @staticmethod
    def getIndexForSubchapter(db:Session, idCapitol: int, idSub: int):
        object=db.query(models.Capitol).filter(models.Capitol.id==idCapitol).first()
        if not object:
            return None
        order=object.ordinesubcapitole
        return order.index(idSub)

    @staticmethod
    def getExerciseOrder(chapterId: int, db: Session):
        # Obține capitolul
        chapter = db.query(models.Capitol).filter(models.Capitol.id == chapterId).first()
        if not chapter:
            raise HTTPException(status_code=404, detail="Capitolul nu a fost găsit.")

        # Ia ordinea subcapitolelor
        subchapter_ids_ordered = chapter.ordinesubcapitole or []

        final_exercise_ids = []

        for sub_id in subchapter_ids_ordered:
            ordine_ex = ChapterService.getOrderForSubchapter(db, sub_id)

            if ordine_ex:
                nr_to_select = ceil(len(ordine_ex) * 0.6)
                selected = set(sample(ordine_ex, nr_to_select))
                ordered_subset = [eid for eid in ordine_ex if eid in selected]
                final_exercise_ids.extend(ordered_subset)

        return final_exercise_ids

    @staticmethod
    def getChapterForId(chapterId, db:Session):
        chapter = db.query(models.Capitol).filter(models.Capitol.id == chapterId).first()
        return chapter