from psycopg import Connection
from app.repositories import site_change_repository
from app.schemas.auth import UserResponse


def attach_site_change_status(connection: Connection, user: UserResponse, project: dict) -> dict:
    is_creator = user.role == "Government Official" and project.get("created_by") == user.id
    is_assigned = user.role == "Urban Planner" and project.get("planner_id") == user.id
    if is_creator or is_assigned:
        project["site_change_status"] = site_change_repository.get_open_site_change_status(connection, project["id"])
    else:
        project["site_change_status"] = None
    return project


def attach_site_change_statuses(connection: Connection, user: UserResponse, projects: list[dict]) -> list[dict]:
    if user.role not in ("Government Official", "Urban Planner"):
        for p in projects:
            p["site_change_status"] = None
        return projects

    pids = [
        p["id"] for p in projects
        if (user.role == "Government Official" and p.get("created_by") == user.id)
        or (user.role == "Urban Planner" and p.get("planner_id") == user.id)
    ]
    status_map = site_change_repository.get_open_site_changes_statuses(connection, pids)
    for p in projects:
        if (user.role == "Government Official" and p.get("created_by") == user.id) or (user.role == "Urban Planner" and p.get("planner_id") == user.id):
            p["site_change_status"] = status_map.get(p["id"])
        else:
            p["site_change_status"] = None
    return projects
