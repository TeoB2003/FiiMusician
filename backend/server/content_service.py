from sqlalchemy.orm import Session
from fastapi import HTTPException
from . import models

class ContentService:
    @staticmethod
    def getExById(db: Session, ex_id: int):
        exercise = db.query(models.Content).filter(models.Content.id == ex_id).first()
        if not exercise:
            raise HTTPException(status_code=404, detail="Exercițiul nu a fost găsit.")
        return exercise

    @staticmethod
    def getSubchapterForId(db: Session, content_id: int):
        content = db.query(models.Content).filter(models.Content.id == content_id).first()
        if not content:
            raise HTTPException(status_code=404, detail="Conținutul nu a fost găsit.")
        return content.subcapitol.id
    @staticmethod
    def getTheoryIdForSubchapter(db:Session, id:int):
        content=db.query(models.Content).filter(models.Content.id_subcapitol==id , models.Content.is_theory==True).all()
        return [c.id for c in content]
    @staticmethod
    def getExerciseForChapter(db: Session, idCapitol: int):
        content=db.query(models.Content).filter(models.Content.id_capitol==idCapitol, models.Content.is_theory==False).all()
        return [c.id for c in content]
