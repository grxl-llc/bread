import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Integer, DateTime, Text
from sqlalchemy.dialects.sqlite import JSON
from app.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    password_hash = Column(String, nullable=True)  # null for OAuth-only accounts
    avatar_url = Column(String, nullable=True)
    bio = Column(Text, nullable=True)

    # Roles & status
    is_creator = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)
    role = Column(String, default="user")  # user, creator, admin
    badges = Column(JSON, default=list)

    # Social graph (denormalized counts for fast reads)
    followers_count = Column(Integer, default=0)
    following_count = Column(Integer, default=0)
    following_list = Column(JSON, default=list)  # list of user IDs being followed

    # Household
    household_members = Column(JSON, default=list)
    household_public = Column(Boolean, default=False)

    # Connected shopping accounts
    connected_accounts = Column(JSON, default=dict)
    preferred_stores = Column(JSON, default=list)
    zipcode = Column(String, nullable=True)
    use_live_location = Column(Boolean, default=False)  # opt-in: price by current location vs saved zip
    favorite_products = Column(JSON, default=list)      # product names the user favorited for deals

    # Subscription
    subscription_status = Column(String, default="free")  # free, active, cancelled
    bread_plus_active = Column(Boolean, default=False)
    subscription_id = Column(String, nullable=True)

    # Creator program
    creator_application_status = Column(String, nullable=True)  # pending, approved, rejected
    creator_tier = Column(String, nullable=True)                 # bronze, silver, gold, platinum

    # Pantry trial
    account_created_at = Column(DateTime, nullable=True)
    pantry_trial_end_date = Column(DateTime, nullable=True)
    pantry_tutorial_completed = Column(Boolean, default=False)

    # Onboarding
    signup_onboarding_complete = Column(Boolean, default=False)

    # OAuth
    google_id = Column(String, nullable=True, unique=True)
    apple_id = Column(String, nullable=True, unique=True)

    created_date = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
