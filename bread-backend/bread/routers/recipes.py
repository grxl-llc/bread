from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from bread.database import get_db
from bread import models, schemas

router = APIRouter()


# ------------------------------------------------------------
# Create recipe
# ------------------------------------------------------------

@router.post("/", response_model=schemas.RecipeRead)
def create_recipe(
    recipe: schemas.RecipeCreate,
    db: Session = Depends(get_db)
):
    new_recipe = models.Recipe(
        name=recipe.name,
        description=recipe.description,
        servings=recipe.servings
    )
    db.add(new_recipe)
    db.commit()
    db.refresh(new_recipe)
    return new_recipe


# ------------------------------------------------------------
# List all recipes
# ------------------------------------------------------------

@router.get("/", response_model=List[schemas.RecipeRead])
def list_recipes(db: Session = Depends(get_db)):
    return db.query(models.Recipe).all()


# ------------------------------------------------------------
# Get recipe by ID
# ------------------------------------------------------------

@router.get("/{recipe_id}", response_model=schemas.RecipeRead)
def get_recipe(
    recipe_id: int,
    db: Session = Depends(get_db)
):
    recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return recipe


# ------------------------------------------------------------
# Update recipe
# ------------------------------------------------------------

@router.put("/{recipe_id}", response_model=schemas.RecipeRead)
def update_recipe(
    recipe_id: int,
    recipe: schemas.RecipeCreate,
    db: Session = Depends(get_db)
):
    db_recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()
    if not db_recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    db_recipe.name = recipe.name
    db_recipe.description = recipe.description
    db_recipe.servings = recipe.servings

    db.commit()
    db.refresh(db_recipe)
    return db_recipe


# ------------------------------------------------------------
# Delete recipe
# ------------------------------------------------------------

@router.delete("/{recipe_id}")
def delete_recipe(
    recipe_id: int,
    db: Session = Depends(get_db)
):
    recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    db.delete(recipe)
    db.commit()
    return {"detail": "Recipe deleted"}


# ------------------------------------------------------------
# Add ingredient to recipe
# ------------------------------------------------------------

@router.post("/{recipe_id}/ingredients", response_model=schemas.RecipeIngredientRead)
def add_ingredient_to_recipe(
    recipe_id: int,
    ingredient: schemas.RecipeIngredientCreate,
    db: Session = Depends(get_db)
):
    recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    ing = db.query(models.Ingredient).filter(models.Ingredient.id == ingredient.ingredient_id).first()
    if not ing:
        raise HTTPException(status_code=404, detail="Ingredient not found")

    new_ri = models.RecipeIngredient(
        recipe_id=recipe_id,
        ingredient_id=ingredient.ingredient_id,
        quantity=ingredient.quantity,
        unit=ingredient.unit
    )

    db.add(new_ri)
    db.commit()
    db.refresh(new_ri)
    return new_ri


# ------------------------------------------------------------
# List ingredients in a recipe
# ------------------------------------------------------------

@router.get("/{recipe_id}/ingredients", response_model=List[schemas.RecipeIngredientRead])
def list_recipe_ingredients(
    recipe_id: int,
    db: Session = Depends(get_db)
):
    recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    return recipe.ingredients
