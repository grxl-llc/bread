from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.dialects.sqlite import JSON
from sqlalchemy.orm import relationship
from app.database import Base


# -------------------------
# USER MODEL
# -------------------------

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, nullable=False)
    zipcode = Column(String, nullable=False)
    preferred_stores = Column(JSON, nullable=False)


# -------------------------
# RECIPE MODEL
# -------------------------

class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    ingredients = Column(JSON, nullable=False)
    instructions = Column(String, nullable=False)
    image_url = Column(String, nullable=True)


# -------------------------
# HOUSEHOLD MODEL
# -------------------------

class Household(Base):
    __tablename__ = "households"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)

    members = relationship("HouseholdMember", back_populates="household")


# -------------------------
# HOUSEHOLD MEMBER MODEL
# -------------------------

class HouseholdMember(Base):
    __tablename__ = "household_members"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=True)
    dietary_restrictions = Column(JSON, nullable=True)

    household_id = Column(Integer, ForeignKey("households.id"))
    household = relationship("Household", back_populates="members")


# -------------------------
# STORE MODEL
# -------------------------

class Store(Base):
    __tablename__ = "stores"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    store_type = Column(String, nullable=False)  # kroger, walmart, instacart, etc.

# -------------------------
# INGREDIENT MODEL
# -------------------------
class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
