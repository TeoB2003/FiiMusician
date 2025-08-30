from sqlalchemy import Column, Integer, String, ForeignKey, ARRAY, Boolean, Text, JSON
from sqlalchemy.orm import relationship
from .database import Base
from sqlalchemy.ext.mutable import MutableDict
from sqlalchemy.dialects.postgresql import JSONB

class User(Base):
    __tablename__ = "users"

    userid = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    username = Column(String(255), nullable=False)


class Capitol(Base):
    __tablename__ = "capitole"

    id = Column(Integer, primary_key=True, index=True)
    titlu = Column(String(255), nullable=False)
    ordinesubcapitole = Column(ARRAY(Integer), default=[])

    # Relația între Capitol și Subcapitol
    subcapitole = relationship("Subcapitol", back_populates="capitol")

class Subcapitol(Base):
    __tablename__ = "subcapitole"

    id = Column(Integer, primary_key=True, index=True)
    idcapitol = Column(Integer, ForeignKey("capitole.id"), nullable=False)
    titlu = Column(String(255), nullable=False)
    ordinecontent = Column(ARRAY(Integer))

    capitol = relationship("Capitol", back_populates="subcapitole")

class Content(Base):
    __tablename__ = "content"

    id = Column(Integer, primary_key=True, index=True)
    is_theory = Column(Boolean, nullable=False)
    id_capitol = Column(Integer, ForeignKey("capitole.id"), nullable=False)
    id_subcapitol = Column(Integer, ForeignKey("subcapitole.id"), nullable=False)
    text = Column(Text)
    need_w_score = Column(Boolean, default=False)
    need_show_score = Column(Boolean, default=False)
    note = Column(JSON)
    variante = Column(ARRAY(String), nullable=True)
    raspuns_corect = Column(JSON)
    need_audio = Column(Boolean, default=False)
    needs_html=Column(Boolean, default=False)
    html_content=Column(Text)

    capitol = relationship("Capitol", backref="continut")
    subcapitol = relationship("Subcapitol", backref="continut")


class ProgresUtilizator(Base):
    __tablename__ = "progres_utilizator"

    user_id = Column(Integer, primary_key=True, index=True)
    exercitii_nerezolvate = Column(MutableDict.as_mutable(JSONB))
    recunoastere_intervale = Column(MutableDict.as_mutable(JSONB))
    recunoastere_nota_portativ = Column(MutableDict.as_mutable(JSONB))
    recunoastere_ritm = Column(MutableDict.as_mutable(JSONB))
    ultimul_exercitiu_parcurs = Column(Integer)
    auz_absolut = Column(MutableDict.as_mutable(JSONB))
    clasa_ritm = Column(String(255))
    clasa_note = Column(String(255))
    acuratete_capitol = Column(MutableDict.as_mutable(JSONB))


