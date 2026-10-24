import logging
import zoneinfo
from datetime import datetime, timedelta, timezone
from psycopg import Connection

logger = logging.getLogger(__name__)

KOLKATA_TZ = zoneinfo.ZoneInfo("Asia/Kolkata")


def format_indian_datetime(dt: datetime) -> str:
    """Format UTC datetime into Indian date and time in Asia/Kolkata timezone."""
    tz_dt = dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    ist_dt = tz_dt.astimezone(KOLKATA_TZ)
    return ist_dt.strftime("%d %b %Y, %I:%M %p IST")


def process_deadline_reminders(connection: Connection) -> int:
    """Send deadline reminders to the creating official (created_by) only.

    Rules:
      - Project stage must be 'OpenForResponse' and is_demo = false
      - One reminder when within 3 days, one when within 1 day
      - Each sent once per threshold / deadline (deduplicated by user_id, project_id, kind, and text)
      - Never send a reminder for a deadline already passed
    """
    now = datetime.now(timezone.utc)
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT id, title, created_by, response_deadline
            FROM projects
            WHERE stage = 'OpenForResponse'
              AND response_deadline IS NOT NULL
              AND response_deadline > %s
              AND is_demo = FALSE
            """,
            (now,),
        )
        projects = cursor.fetchall()

    if not projects:
        return 0

    sent_count = 0
    with connection.cursor() as cursor:
        for project in projects:
            deadline = project["response_deadline"]
            if not deadline:
                continue
            tz_deadline = deadline if deadline.tzinfo else deadline.replace(tzinfo=timezone.utc)
            time_left = tz_deadline - now

            if time_left <= timedelta(0):
                continue
            elif time_left <= timedelta(days=1):
                threshold = "1 day"
            elif time_left <= timedelta(days=3):
                threshold = "3 days"
            else:
                continue

            indian_dt_str = format_indian_datetime(tz_deadline)
            title = project["title"]
            message = (
                f'Reminder: Response deadline for "{title}" is within {threshold} ({indian_dt_str}).'
            )
            user_id = project["created_by"]
            project_id = project["id"]

            # Deduplicate WITHOUT a new table: check existing notification with same message
            cursor.execute(
                """
                SELECT 1 FROM notifications
                WHERE user_id = %s
                  AND project_id = %s
                  AND kind = 'deadline_reminder'
                  AND message = %s
                LIMIT 1
                """,
                (user_id, project_id, message),
            )
            if cursor.fetchone() is not None:
                continue

            cursor.execute(
                """
                INSERT INTO notifications (user_id, project_id, kind, message, created_at)
                VALUES (%s, %s, 'deadline_reminder', %s, NOW())
                """,
                (user_id, project_id, message),
            )
            sent_count += 1

    connection.commit()
    return sent_count
