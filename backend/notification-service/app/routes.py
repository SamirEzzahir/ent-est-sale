import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from .cassandra_client import get_session
from .auth_client import validate_token

router = APIRouter()


class MessageCreate(BaseModel):
    recipient_id: str
    subject: str
    content: str


class AnnouncementCreate(BaseModel):
    course_id: str
    title: str
    content: str
    pinned: bool = False


class NotificationCreate(BaseModel):
    user_id: str
    type: str
    title: str
    message: str
    link: Optional[str] = None


async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    token = authorization.split(" ")[1]
    return await validate_token(token)


@router.get("/health")
async def health():
    return {"service": "notification-service", "status": "ok"}


@router.post("/messages")
async def send_message(msg: MessageCreate, current_user: dict = Depends(get_current_user)):
    session = get_session()
    session.set_keyspace('ent')
    message_id = uuid.uuid4()
    sender_id = current_user.get("username") or current_user.get("id")

    try:
        cql = """
        INSERT INTO messages (message_id, sender_id, recipient_id, subject, content, sent_date, read)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """

        session.execute(
            cql,
            (message_id, sender_id, msg.recipient_id, msg.subject, msg.content, datetime.utcnow(), False)
        )
        return {"message_id": str(message_id), "message": "Message sent"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send message: {str(e)}")


@router.get("/messages")
async def get_messages(current_user: dict = Depends(get_current_user)):
    session = get_session()
    session.set_keyspace('ent')
    user_id = current_user.get("username") or current_user.get("id")

    try:
        cql = "SELECT message_id, sender_id, recipient_id, subject, content, sent_date, read FROM messages WHERE recipient_id = ?"
        rows = session.execute(cql, (user_id,))

        return [
            {
                "message_id": str(row.message_id),
                "sender_id": row.sender_id,
                "recipient_id": row.recipient_id,
                "subject": row.subject,
                "content": row.content,
                "sent_date": str(row.sent_date) if row.sent_date else None,
                "read": row.read,
            }
            for row in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get messages: {str(e)}")


@router.post("/announcements")
async def create_announcement(announcement: AnnouncementCreate, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Only teachers/admins can post announcements")

    session = get_session()
    session.set_keyspace('ent')
    announcement_id = uuid.uuid4()
    created_by = current_user.get("username") or current_user.get("id")

    try:
        cql = """
        INSERT INTO announcements (announcement_id, course_id, title, content, created_by, created_date, pinned)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """

        session.execute(
            cql,
            (announcement_id, uuid.UUID(announcement.course_id), announcement.title, announcement.content, created_by, datetime.utcnow(), announcement.pinned)
        )
        return {"announcement_id": str(announcement_id), "message": "Announcement posted"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid UUID: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create announcement: {str(e)}")


@router.get("/announcements/{course_id}")
async def get_announcements(course_id: str, current_user: dict = Depends(get_current_user)):
    session = get_session()
    session.set_keyspace('ent')

    try:
        cql = "SELECT announcement_id, course_id, title, content, created_by, created_date, pinned FROM announcements WHERE course_id = ?"
        rows = session.execute(cql, (uuid.UUID(course_id),))

        return [
            {
                "announcement_id": str(row.announcement_id),
                "course_id": str(row.course_id),
                "title": row.title,
                "content": row.content,
                "created_by": row.created_by,
                "created_date": str(row.created_date) if row.created_date else None,
                "pinned": row.pinned,
            }
            for row in rows
        ]
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid course_id format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get announcements: {str(e)}")


@router.post("/")
async def create_notification(notif: NotificationCreate, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create notifications")

    session = get_session()
    session.set_keyspace('ent')
    notification_id = uuid.uuid4()

    try:
        cql = """
        INSERT INTO notifications (notification_id, user_id, type, title, message, read, created_date, link)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """

        session.execute(
            cql,
            (notification_id, notif.user_id, notif.type, notif.title, notif.message, False, datetime.utcnow(), notif.link)
        )
        return {"notification_id": str(notification_id), "message": "Notification created"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create notification: {str(e)}")


@router.get("/")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    session = get_session()
    session.set_keyspace('ent')
    user_id = current_user.get("username") or current_user.get("id")

    try:
        cql = "SELECT notification_id, user_id, type, title, message, read, created_date, link FROM notifications WHERE user_id = ?"
        rows = session.execute(cql, (user_id,))

        return [
            {
                "notification_id": str(row.notification_id),
                "user_id": row.user_id,
                "type": row.type,
                "title": row.title,
                "message": row.message,
                "read": row.read,
                "created_date": str(row.created_date) if row.created_date else None,
                "link": row.link,
            }
            for row in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get notifications: {str(e)}")
