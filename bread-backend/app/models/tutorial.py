import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Integer, Float, DateTime, Text
from sqlalchemy.dialects.sqlite import JSON
from app.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class Tutorial(Base):
    __tablename__ = "tutorials"

    id = Column(String, primary_key=True, default=gen_uuid)
    creator_email = Column(String, index=True, nullable=False)
    creator_name = Column(String, nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    dish_name = Column(String, nullable=True)
    video_url = Column(String, nullable=True)
    thumbnail_url = Column(String, nullable=True)
    duration = Column(Integer, nullable=True)       # minutes
    category = Column(String, nullable=True, index=True)
    tags = Column(JSON, default=list)
    visibility = Column(String, default="public")   # public, followers, private
    is_sponsored = Column(Boolean, default=False)

    # Live / replay state
    is_live = Column(Boolean, default=False)
    is_replay = Column(Boolean, default=False)
    viewer_count = Column(Integer, default=0)
    view_count = Column(Integer, default=0)
    like_count = Column(Integer, default=0)

    # Amazon IVS — populated when creator goes live
    ivs_channel_arn = Column(String, nullable=True)
    ivs_stream_key = Column(String, nullable=True)
    ivs_ingest_endpoint = Column(String, nullable=True)
    ivs_playback_url = Column(String, nullable=True)
    ivs_chat_room_arn = Column(String, nullable=True)

    created_date = Column(DateTime, default=datetime.utcnow, index=True)


class LiveSession(Base):
    __tablename__ = "live_sessions"

    id = Column(String, primary_key=True, default=gen_uuid)
    creator_email = Column(String, index=True, nullable=False)
    tutorial_id = Column(String, index=True, nullable=True)
    start_time = Column(DateTime, nullable=True)    # frontend uses start_time
    started_at = Column(DateTime, nullable=True)    # legacy alias
    ended_at = Column(DateTime, nullable=True)
    viewer_count = Column(Integer, default=0)
    peak_viewers = Column(Integer, default=0)
    ad_breaks_triggered = Column(Integer, default=0)
    total_watch_time = Column(Integer, default=0)   # minutes
    recording_url = Column(String, nullable=True)
    status = Column(String, default="live")         # live, ended
    created_date = Column(DateTime, default=datetime.utcnow)


class CreatorEarnings(Base):
    __tablename__ = "creator_earnings"

    id = Column(String, primary_key=True, default=gen_uuid)
    creator_email = Column(String, index=True, nullable=False)
    amount = Column(Float, nullable=False)
    source_type = Column(String, nullable=False)  # live_ad, replay_ad, sponsored, subscription
    reference_id = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    created_date = Column(DateTime, default=datetime.utcnow, index=True)


class SavedTutorial(Base):
    __tablename__ = "saved_tutorials"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_email = Column(String, index=True, nullable=False)
    tutorial_id = Column(String, index=True, nullable=False)
    created_date = Column(DateTime, default=datetime.utcnow)
