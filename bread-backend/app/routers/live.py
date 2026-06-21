"""
Live streaming routes — Amazon IVS management.
Creators use these to start/end streams and get their stream keys.
Viewers use these to get chat tokens.
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.auth.dependencies import get_current_user, get_optional_user
from app.models.user import User
from app.models.tutorial import Tutorial, LiveSession
from app.services import ivs as ivs_service

router = APIRouter(prefix="/live", tags=["live"])


# ── Start a live stream ───────────────────────────────────────────────────────

class GoLiveRequest(BaseModel):
    title: str
    description: str = ""
    category: str = ""


@router.post("/start")
def start_live(
    body: GoLiveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not (current_user.is_creator or current_user.badges and "creator" in current_user.badges):
        raise HTTPException(status_code=403, detail="Creator account required to go live")

    # Create IVS channel + chat room
    channel = ivs_service.create_channel(current_user.email)
    chat = ivs_service.create_chat_room(f"{current_user.id}-{datetime.utcnow().timestamp()}")

    # Create Tutorial record
    tutorial = Tutorial(
        creator_email=current_user.email,
        title=body.title,
        description=body.description,
        category=body.category,
        is_live=True,
        ivs_channel_arn=channel["channel_arn"],
        ivs_stream_key=channel["stream_key"],
        ivs_ingest_endpoint=channel["ingest_endpoint"],
        ivs_playback_url=channel["playback_url"],
        ivs_chat_room_arn=chat["chat_room_arn"],
    )
    db.add(tutorial)

    # Create LiveSession record
    session = LiveSession(
        creator_email=current_user.email,
        tutorial_id=tutorial.id,
        started_at=datetime.utcnow(),
        status="live",
    )
    db.add(session)
    db.commit()
    db.refresh(tutorial)
    db.refresh(session)

    # Return stream key only to the creator
    return {
        "tutorial_id": tutorial.id,
        "session_id": session.id,
        "stream_key": channel["stream_key"],
        "ingest_endpoint": channel["ingest_endpoint"],
        "playback_url": channel["playback_url"],
        "chat_room_arn": chat["chat_room_arn"],
    }


# ── End a live stream ─────────────────────────────────────────────────────────

@router.post("/{tutorial_id}/end")
def end_live(
    tutorial_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tutorial = db.query(Tutorial).filter(Tutorial.id == tutorial_id).first()
    if not tutorial:
        raise HTTPException(status_code=404, detail="Tutorial not found")
    if tutorial.creator_email != current_user.email:
        raise HTTPException(status_code=403, detail="Not your stream")

    tutorial.is_live = False
    db.query(LiveSession).filter(
        LiveSession.tutorial_id == tutorial_id,
        LiveSession.status == "live"
    ).update({"status": "ended", "ended_at": datetime.utcnow()})

    db.commit()
    return {"ok": True, "tutorial_id": tutorial_id}


# ── Get chat token (viewer or creator) ───────────────────────────────────────

@router.get("/{tutorial_id}/chat-token")
def get_chat_token(
    tutorial_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tutorial = db.query(Tutorial).filter(Tutorial.id == tutorial_id).first()
    if not tutorial or not tutorial.ivs_chat_room_arn:
        raise HTTPException(status_code=404, detail="Live stream not found")

    is_creator = tutorial.creator_email == current_user.email

    token = ivs_service.create_chat_token(
        chat_room_arn=tutorial.ivs_chat_room_arn,
        user_id=current_user.id,
        user_name=current_user.full_name or current_user.email,
        is_creator=is_creator,
    )

    return {
        **token,
        "playback_url": tutorial.ivs_playback_url,
        "is_creator": is_creator,
    }


# ── Get active live streams ───────────────────────────────────────────────────

@router.get("/active")
def get_active_streams(db: Session = Depends(get_db)):
    tutorials = db.query(Tutorial).filter(Tutorial.is_live == True).all()
    return [
        {
            "id": t.id,
            "creator_email": t.creator_email,
            "title": t.title,
            "thumbnail_url": t.thumbnail_url,
            "playback_url": t.ivs_playback_url,
            "viewer_count": t.viewer_count,
            "category": t.category,
        }
        for t in tutorials
    ]
