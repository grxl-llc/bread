import boto3
from app.config import settings


def get_ivs_client():
    return boto3.client(
        "ivs",
        region_name=settings.ivs_region,
        aws_access_key_id=settings.aws_access_key_id or None,
        aws_secret_access_key=settings.aws_secret_access_key or None,
    )


def get_ivs_chat_client():
    return boto3.client(
        "ivschat",
        region_name=settings.ivs_region,
        aws_access_key_id=settings.aws_access_key_id or None,
        aws_secret_access_key=settings.aws_secret_access_key or None,
    )


def create_channel(creator_email: str) -> dict:
    """
    Create a new IVS channel for a creator.
    Returns channel ARN, stream key, ingest endpoint, and playback URL.
    """
    ivs = get_ivs_client()

    channel = ivs.create_channel(
        name=f"bread-{creator_email.replace('@', '-').replace('.', '-')}",
        latencyMode="LOW",           # ~5 second latency — good for live Q&A
        type="STANDARD",
        recordingConfigurationArn="",  # set after configuring S3 recording
    )

    stream_key_resp = ivs.create_stream_key(channelArn=channel["channel"]["arn"])

    return {
        "channel_arn": channel["channel"]["arn"],
        "playback_url": channel["channel"]["playbackUrl"],
        "ingest_endpoint": channel["channel"]["ingestEndpoint"],
        "stream_key": stream_key_resp["streamKey"]["value"],
        "stream_key_arn": stream_key_resp["streamKey"]["arn"],
    }


def create_chat_room(tutorial_id: str) -> dict:
    """Create an IVS Chat room for a live session."""
    chat = get_ivs_chat_client()

    room = chat.create_room(
        name=f"bread-chat-{tutorial_id}",
        maximumMessageLength=500,
        maximumMessageRatePerSecond=10,
    )

    return {
        "chat_room_arn": room["arn"],
        "chat_room_id": room["id"],
    }


def create_chat_token(chat_room_arn: str, user_id: str, user_name: str, is_creator: bool = False) -> dict:
    """
    Create a short-lived chat token for a viewer or creator.
    Creators get SEND_MESSAGE + DELETE_MESSAGE capabilities.
    Viewers get SEND_MESSAGE only.
    """
    chat = get_ivs_chat_client()

    capabilities = ["SEND_MESSAGE"]
    if is_creator:
        capabilities.append("DELETE_MESSAGE")

    token = chat.create_chat_token(
        roomIdentifier=chat_room_arn,
        userId=user_id,
        attributes={"username": user_name},
        capabilities=capabilities,
        sessionDurationInMinutes=180,  # 3-hour live session max
    )

    return {
        "token": token["token"],
        "session_expiration_time": token["sessionExpirationTime"].isoformat(),
        "token_expiration_time": token["tokenExpirationTime"].isoformat(),
    }


def delete_channel(channel_arn: str):
    ivs = get_ivs_client()
    ivs.delete_channel(arn=channel_arn)


def delete_chat_room(room_arn: str):
    chat = get_ivs_chat_client()
    chat.delete_room(identifier=room_arn)
