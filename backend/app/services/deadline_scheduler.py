import asyncio
import logging
from datetime import datetime, timezone
from psycopg import Connection

from app.core.config import get_settings
from app.database.connection import get_connection
from app.services.deadline_reminders import process_deadline_reminders

logger = logging.getLogger(__name__)


def move_expired_projects_to_in_progress(connection: Connection) -> int:
    """Automatically move OpenForResponse projects to InProgress when response_deadline passes.

    Rules:
      - Atomic single UPDATE WHERE stage='OpenForResponse' AND response_deadline <= now() AND is_demo = false RETURNING id, ...
      - Project_events row (OpenForResponse -> InProgress, actor_id = created_by)
      - Notifications to creating official and every follower
      - All in the same transaction
    """
    now = datetime.now(timezone.utc)
    with connection.transaction():
        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE projects
                SET stage = 'InProgress',
                    status = 'InProgress',
                    updated_at = %s
                WHERE stage = 'OpenForResponse'
                  AND response_deadline IS NOT NULL
                  AND response_deadline <= %s
                  AND is_demo = FALSE
                RETURNING id, title, created_by, response_deadline
                """,
                (now, now),
            )
            expired_projects = cursor.fetchall()

            if not expired_projects:
                return 0

            for proj in expired_projects:
                proj_id = proj["id"]
                title = proj["title"]
                created_by = proj["created_by"]

                # Write project_events row (actor_id = created_by since actor_id is NOT NULL)
                cursor.execute(
                    """
                    INSERT INTO project_events (project_id, actor_id, from_stage, to_stage, note, created_at)
                    VALUES (%s, %s, 'OpenForResponse', 'InProgress', %s, NOW())
                    RETURNING id
                    """,
                    (
                        proj_id,
                        created_by,
                        "Response deadline reached: moved to In Progress automatically",
                    ),
                )
                event_row = cursor.fetchone()
                event_id = event_row["id"] if event_row else None

                # Query followers
                cursor.execute(
                    "SELECT user_id FROM project_follows WHERE project_id = %s",
                    (proj_id,),
                )
                follower_rows = cursor.fetchall()
                follower_ids = [r["user_id"] for r in follower_rows]

                # Recipients: creating official and every follower
                recipients = list(dict.fromkeys([created_by] + follower_ids))
                msg = f"Response period ended for {title}. The project is now In Progress."

                for uid in recipients:
                    cursor.execute(
                        """
                        INSERT INTO notifications (user_id, project_id, event_id, kind, message, created_at)
                        VALUES (%s, %s, %s, 'stage_in_progress', %s, NOW())
                        """,
                        (uid, proj_id, event_id, msg),
                    )

    return len(expired_projects)


def run_deadline_scheduler_pass() -> tuple[int, int]:
    """Execute one pass of the deadline scheduler (move expired projects + send reminders)."""
    with get_connection() as connection:
        moved_count = move_expired_projects_to_in_progress(connection)
        reminder_count = process_deadline_reminders(connection)

    logger.info(
        "Deadline scheduler pass completed: %d projects moved to In Progress, %d reminders sent.",
        moved_count,
        reminder_count,
    )
    return moved_count, reminder_count


async def run_deadline_scheduler_loop() -> None:
    """Background loop running deadline scheduler periodically."""
    settings = get_settings()
    interval = settings.deadline_scheduler_interval_seconds
    enabled = settings.deadline_scheduler_enabled

    logger.info(
        "Starting deadline scheduler loop (interval=%ds, enabled=%s)",
        interval,
        enabled,
    )

    while True:
        try:
            if settings.deadline_scheduler_enabled:
                await asyncio.to_thread(run_deadline_scheduler_pass)
        except asyncio.CancelledError:
            logger.info("Deadline scheduler loop cancelled.")
            raise
        except Exception as exc:
            logger.exception("Error in deadline scheduler pass: %s", exc)

        try:
            await asyncio.sleep(settings.deadline_scheduler_interval_seconds)
        except asyncio.CancelledError:
            logger.info("Deadline scheduler loop cancelled during sleep.")
            raise
