import random
from typing import Dict
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Body
from pydantic import BaseModel

#import models
from . import auth_service
from .database import get_db, Base, engine
from . import chapter_service
from . import content_service
from . import  progres_user
from . import music_generator
from . import k_means

Base.metadata.create_all(bind=engine)



class ProgressData(BaseModel):
    userId: int
    lastEx: int
class Scoruri(BaseModel):
    auz: Dict[str, str]
    scris: Dict[str, str]
class UpdateUserPayload(BaseModel):
    username: str = ''
    password: str = ''

class UpdateProgresPayload(BaseModel):
    recunoastere_intervale: Scoruri | None = None
    recunoastere_ritm: Scoruri | None = None
app = FastAPI()

origins = [
    "http://localhost:4200",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
current_index = 0
id_subcapitol=1
first_time=True

@app.post("/signup")
def signup( username: str = Body(...),
    password: str = Body(...),
    emailAdress: str = Body(...),
    db=Depends(get_db)):
    return auth_service.AuthService.signup(username, password, emailAdress,db)

@app.post("/save-progress")
def save(data: ProgressData,db=Depends(get_db)):
    global first_time
    first_time=True
    print("out")
    print("Date primite")
    print(data.lastEx)
    progres_user.ProgressService.updateEx(db,data.userId, data.lastEx)

@app.post("/login")
def login(  username: str = Body(...), password: str = Body(...), db = Depends(get_db)):
    print(username)
    return auth_service.AuthService.login(username, password,db)

@app.get("/user")
def user_info(token: str = Depends(auth_service.oauth2_scheme), db=Depends(get_db)):
    return auth_service.AuthService.get_user_info(db, token)

@app.get("/chapters")
def get_chapters(db=Depends(get_db)):
    return chapter_service.ChapterService.getChapters(db)

@app.get("/chapters/{chapter_name}/subchapters")
def get_subchapters(chapter_name: str, db=Depends(get_db)):
    print(chapter_name)
    return chapter_service.ChapterService.getSubchaptersForChapter(db, chapter_name)


@app.get("/content/{user_id}")
def get_next_content(user_id: int, db=Depends(get_db)):
    global current_index, id_subcapitol, first_time
    #de vazut ce fac cand trebuie schimbat subcapitolul in first_time!!!
    index_ex=0
    print(first_time)
    if first_time:
        index_ex = progres_user.ProgressService.getUltimulExercitiuParcurs(db, user_id)
        print("Index-ul ultimul exercitiu")
        print(index_ex)
        id_subcapitol = content_service.ContentService.getSubchapterForId(db, index_ex)
        print(id_subcapitol)


    order = chapter_service.ChapterService.getOrderForSubchapter(db, id_subcapitol)
    print(order)
    if first_time:
        current_index=order.index(index_ex)
        first_time = False
    print(current_index)

    if not order or current_index >=len(order):
        print("I am in")
        next_subchapter = chapter_service.ChapterService.getNextSubchapter(db, id_subcapitol)
        if not next_subchapter:
            next_subchapter.id = 1  # fallback
        id_subcapitol = next_subchapter.id
        order = chapter_service.ChapterService.getOrderForSubchapter(db, id_subcapitol)
        current_index=0

        if not order:
            raise HTTPException(status_code=404, detail="Subcapitolul nou nu are exerciții.")

    current_ex_id = order[current_index]
    content = content_service.ContentService.getExById(db, current_ex_id)
    print("Index curent in oordine")
    print(current_index)
    print(order[current_index])
    if not content:
        raise HTTPException(status_code=404, detail="Exercițiul nu există.")

    current_index += 1
    return content


@app.get("/earExercise/{userId}")
def earExercise(userId:int, db=Depends(get_db)):
    numar_random=random.uniform(0,1)
    user = progres_user.ProgressService.getProgresByUserId(db, userId)
    if numar_random<0.7:
        print("testare auz")
        nivel = user.clasa_note
        nivel_ritm=user.clasa_ritm
        note=music_generator.generateMusic(user.recunoastere_intervale, user.recunoastere_ritm,nivel, nivel_ritm,True)
        rezultat = {
            "tip_exercitiu": "ear-training",
            "note": note,
            "variante_raspuns": []
        }
        print(rezultat)
    else:
        print("auz absolut")
        object=music_generator.perfectPitch(user.auz_absolut)

        rezultat = {
            "tip_exercitiu": "perfect-intonation",
            "note": object["nota"],
            "variante_raspuns": object["variante"]
        }
        print(rezultat)
    return rezultat

@app.get("/update-last-ex/{user_id}/{chapter_id}")
def update_last_exercise(user_id: int, chapter_id: int, db = Depends(get_db)):
    chapter = chapter_service.ChapterService.getChapterForId(chapter_id, db)
    if not chapter or not chapter.ordinesubcapitole:
        raise HTTPException(status_code=404, detail="Capitolul nu a fost găsit sau nu are subcapitole.")
    first_subchapter_id = chapter.ordinesubcapitole[0]

    ordine = chapter_service.ChapterService.getOrderForSubchapter(db, first_subchapter_id)
    if not ordine:
        raise HTTPException(status_code=404, detail="Subcapitolul nu are conținut.")

    first_content_id = ordine[0]
    #fortez preluarea noului capitol
    global first_time
    first_time=True
    progres_user.ProgressService.updateEx(db, user_id, first_content_id)

@app.get("/chapters/{idCapitol}/{idSubcapitol}")
def getSubchapterIndex(idCapitol:int, idSubcapitol: int, db=Depends(get_db)):
    index=chapter_service.ChapterService.getIndexForSubchapter(db,idCapitol,idSubcapitol)
    return index

@app.get("/theory/{id}")
def getTheory(id:int, db=Depends(get_db)):
 content=content_service.ContentService.getExById(db,id)
 return content

@app.get("/order/{name}")
def getOrderForSubchapterTheory(name:str, db=Depends(get_db)):
    print("Nume subcapitol primit:", name)
    id= chapter_service.ChapterService.getSubchapterId(db,name)
    order=chapter_service.ChapterService.getOrderForSubchapter(db,id)
    theory=content_service.ContentService.getTheoryIdForSubchapter(db,id)
    print(theory)
    final_order=[]
    print(order)
    for el in order:
        if el in theory:
            final_order.append(el)
    return final_order

@app.get("/order-test/{chapterId}")
def getExerciseOrder(chapterId:int, db=Depends(get_db)):
    order_in_chapter=chapter_service.ChapterService.getExerciseOrder(chapterId,db)
    exercises_int=content_service.ContentService.getExerciseForChapter(db,chapterId)
    exercises= []
    for item in order_in_chapter:
        if item in exercises_int:
            exercises.append(item)
    print(exercises)

    return exercises


@app.put("/progres/{user_id}/recunoastere-intervale")
def update_recunoastere_intervale(user_id: int, date_noi: UpdateProgresPayload, db = Depends(get_db)):
    #print("Date primite")
    #print(date_noi)
    print(date_noi.recunoastere_intervale)
    print(date_noi.recunoastere_ritm)
    data_dict = date_noi.recunoastere_intervale.dict() if date_noi.recunoastere_intervale else {}
    ritm_dict=date_noi.recunoastere_ritm.dict() if date_noi.recunoastere_ritm else {}
    object1= progres_user.ProgressService.updateRecunoastereIntervale(db, user_id, data_dict)
    object2=progres_user.ProgressService.updateRecunoastereRitm(db,user_id, ritm_dict)
    return {"intervale ":object1,"ritm":object2}

@app.get("/absolutePitch/{userId}/{nota}/{correct}")
def procesare_nota(userId: int, nota: str,correct: int, db = Depends(get_db)):
    print("nota e "+ nota)
    return progres_user.ProgressService.updateAuzAbsolut(db, userId, nota, correct)

@app.put("/updatedate/{user_id}")
def update_user(user_id: int, data: UpdateUserPayload, db= Depends(get_db)):
    response1={}
    response2={}
    if data.username!='':
        response1=auth_service.AuthService.update_username(db,user_id,data.username)
    if data.password!='':
        response2=auth_service.AuthService.update_password(db,user_id, data.password)
    return {"parola":response2 ,"username": response1}

@app.get("/result-ex/{chapter_id}/{exercise_id}/{user_id}/{result}")
def get_result_exercise(chapter_id: int, exercise_id: int,user_id:int,result: int, db=Depends(get_db)):
    return progres_user.ProgressService.actualizare_exercitii(db, chapter_id, exercise_id, user_id,result)

@app.get("/get-levels")
def get_levels(db=Depends(get_db)):
    number_of_users = progres_user.ProgressService.getNumberOfUsers(db)
    no_of_clusters = min(number_of_users, 3)
    k_means.aplica_kmeans_si_actualizeaza(db, k=no_of_clusters)
    return {"clusters": no_of_clusters}

@app.get("/unresolved-exercise/{user_id}")
def get_order_for_ex(user_id:int,db=Depends(get_db)):
   result=progres_user.ProgressService.getExercitiiNerezolvate(db,user_id)
   return result