import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Integer, Float, DateTime, Text, UniqueConstraint
from sqlalchemy.dialects.sqlite import JSON
from app.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class Post(Base):
    __tablename__ = "posts"

    id = Column(String, primary_key=True, default=gen_uuid)
    created_by = Column(String, index=True, nullable=False)  # user email
    author_name = Column(String, nullable=True)
    caption = Column(Text, nullable=True)
    media_url = Column(String, nullable=True)
    category = Column(String, nullable=True, index=True)
    likes_count = Column(Integer, default=0)

    # Recipe attachment
    recipe_id = Column(String, nullable=True, index=True)

    # Tutorial clip
    tutorial_id = Column(String, nullable=True, index=True)
    clip_start = Column(Float, nullable=True)
    clip_end = Column(Float, nullable=True)

    # AI-generated recipe guess from photo
    ai_recipe_guess = Column(JSON, nullable=True)

    created_date = Column(DateTime, default=datetime.utcnow, index=True)


class Comment(Base):
    __tablename__ = "comments"

    id = Column(String, primary_key=True, default=gen_uuid)
    post_id = Column(String, index=True, nullable=False)
    user_id = Column(String, index=True, nullable=False)
    user_name = Column(String, nullable=True)
    user_avatar = Column(String, nullable=True)
    text = Column(Text, nullable=False)
    created_date = Column(DateTime, default=datetime.utcnow, index=True)


class Like(Base):
    __tablename__ = "likes"

    id = Column(String, primary_key=True, default=gen_uuid)
    post_id = Column(String, index=True, nullable=False)
    user_id = Column(String, index=True, nullable=False)
    created_date = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint("post_id", "user_id", name="uq_like_post_user"),)


class Follow(Base):
    __tablename__ = "follows"

    id = Column(String, primary_key=True, default=gen_uuid)
    follower_id = Column(String, index=True, nullable=False)   # who is following
    following_id = Column(String, index=True, nullable=False)  # who is being followed
    created_date = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint("follower_id", "following_id", name="uq_follow"),)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_email = Column(String, index=True, nullable=False)  # recipient
    type = Column(String, nullable=False)  # follower, comment, dm, recipe_save, badge_unlock, system
    title = Column(String, nullable=True)
    message = Column(Text, nullable=True)
    actor_name = Column(String, nullable=True)  # who triggered it
    actor_email = Column(String, nullable=True)
    link = Column(String, nullable=True)  # navigation target
    read = Column(Boolean, default=False)
    created_date = Column(DateTime, default=datetime.utcnow, index=True)


class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=gen_uuid)
    sender_id = Column(String, index=True, nullable=False)
    receiver_id = Column(String, index=True, nullable=False)
    sender_name = Column(String, nullable=True)
    sender_avatar = Column(String, nullable=True)
    text = Column(Text, nullable=False)
    read = Column(Boolean, default=False)
    created_date = Column(DateTime, default=datetime.utcnow, index=True)
