import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Boolean, DateTime, Text, Integer
from sqlalchemy.dialects.sqlite import JSON
from app.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class Ad(Base):
    """AdvertiserRequest — ad submissions from brands awaiting review."""
    __tablename__ = "ads"

    id = Column(String, primary_key=True, default=gen_uuid)
    advertiser_name = Column(String, nullable=True)
    company = Column(String, nullable=True)
    email = Column(String, nullable=True, index=True)
    ad_type = Column(String, nullable=True)
    budget = Column(Float, nullable=True)
    target_audience = Column(String, nullable=True)
    media_url = Column(String, nullable=True)
    status = Column(String, default="pending")  # pending_ai, pending_human, approved, rejected
    ai_review_notes = Column(Text, nullable=True)
    admin_notes = Column(Text, nullable=True)
    created_date = Column(DateTime, default=datetime.utcnow, index=True)


class ApprovedAd(Base):
    """Ads approved by admin, ready to serve in the feed."""
    __tablename__ = "approved_ads"

    id = Column(String, primary_key=True, default=gen_uuid)
    title = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    media_url = Column(String, nullable=True)
    ad_type = Column(String, nullable=True)
    cta_label = Column(String, nullable=True)
    cta_url = Column(String, nullable=True)
    advertiser_name = Column(String, nullable=True)
    source_request_id = Column(String, nullable=True, index=True)
    is_active = Column(Boolean, default=True)
    created_date = Column(DateTime, default=datetime.utcnow, index=True)


class BrandSponsorship(Base):
    """Brand product placements shown to creators and managed by admin."""
    __tablename__ = "brand_sponsorships"

    id = Column(String, primary_key=True, default=gen_uuid)
    brand_name = Column(String, nullable=False)
    generic_item = Column(String, nullable=True)
    category = Column(String, nullable=True)
    priority = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    created_date = Column(DateTime, default=datetime.utcnow)


class Brand(Base):
    __tablename__ = "brands"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    logo_url = Column(String, nullable=True)
    category = Column(String, nullable=True)
    contact_email = Column(String, nullable=True)
    website = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String, default="active")
    created_date = Column(DateTime, default=datetime.utcnow)


class BrandPartner(Base):
    __tablename__ = "brand_partners"

    id = Column(String, primary_key=True, default=gen_uuid)
    brand_id = Column(String, index=True, nullable=True)
    brand_name = Column(String, nullable=True)
    creator_email = Column(String, index=True, nullable=True)
    deal_type = Column(String, nullable=True)
    amount = Column(Float, nullable=True)
    status = Column(String, default="active")
    created_date = Column(DateTime, default=datetime.utcnow)


class CreatorApplication(Base):
    __tablename__ = "creator_applications"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_email = Column(String, index=True, nullable=False)
    name = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    social_links = Column(JSON, default=dict)
    content_types = Column(JSON, default=list)
    follower_count = Column(Integer, nullable=True)
    sample_content_url = Column(String, nullable=True)
    status = Column(String, default="pending")
    review_notes = Column(Text, nullable=True)
    created_date = Column(DateTime, default=datetime.utcnow)


class BrandApplication(Base):
    __tablename__ = "brand_applications"

    id = Column(String, primary_key=True, default=gen_uuid)
    company_name = Column(String, nullable=True)
    contact_name = Column(String, nullable=True)
    email = Column(String, nullable=True, index=True)
    website = Column(String, nullable=True)
    category = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    budget_range = Column(String, nullable=True)
    status = Column(String, default="pending")
    created_date = Column(DateTime, default=datetime.utcnow)
