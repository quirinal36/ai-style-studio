"""Async task management for long-running Gatys style transfers."""

import asyncio
import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class TaskStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    ERROR = "error"


@dataclass
class TaskInfo:
    task_id: str
    status: TaskStatus = TaskStatus.PENDING
    created_at: float = field(default_factory=time.time)
    started_at: float | None = None
    completed_at: float | None = None
    progress: dict = field(default_factory=dict)
    result: dict | None = None
    error: str | None = None
    cancel_event: asyncio.Event = field(default_factory=asyncio.Event)


class TaskManager:
    """Manages async Gatys transfer tasks. Only 1 concurrent task allowed (CPU constraint)."""

    def __init__(self):
        self._tasks: dict[str, TaskInfo] = {}
        self._lock = asyncio.Lock()
        self._active_task_id: str | None = None

    async def create_task(self) -> str:
        """Create a new transfer task. Returns task_id.

        Raises ValueError if a task is already running.
        """
        async with self._lock:
            if self._active_task_id and self._tasks[self._active_task_id].status == TaskStatus.PROCESSING:
                raise ValueError("이전 변환이 진행 중입니다. 완료 후 다시 시도해주세요.")

            task_id = uuid.uuid4().hex[:16]
            self._tasks[task_id] = TaskInfo(task_id=task_id)
            return task_id

    async def start_task(self, task_id: str):
        """Mark task as processing."""
        async with self._lock:
            task = self._get_task(task_id)
            task.status = TaskStatus.PROCESSING
            task.started_at = time.time()
            self._active_task_id = task_id

    async def update_progress(self, task_id: str, progress: dict):
        """Update task progress info (step, losses, preview_url)."""
        task = self._get_task(task_id)
        task.progress = progress

    async def complete_task(self, task_id: str, result: dict):
        """Mark task as completed with result."""
        async with self._lock:
            task = self._get_task(task_id)
            task.status = TaskStatus.COMPLETED
            task.completed_at = time.time()
            task.result = result
            if self._active_task_id == task_id:
                self._active_task_id = None

    async def fail_task(self, task_id: str, error: str):
        """Mark task as failed with error message."""
        async with self._lock:
            task = self._get_task(task_id)
            task.status = TaskStatus.ERROR
            task.completed_at = time.time()
            task.error = error
            if self._active_task_id == task_id:
                self._active_task_id = None

    async def cancel_task(self, task_id: str) -> bool:
        """Signal cancellation for a running task."""
        async with self._lock:
            task = self._get_task(task_id)
            if task.status != TaskStatus.PROCESSING:
                return False
            task.cancel_event.set()
            task.status = TaskStatus.CANCELLED
            task.completed_at = time.time()
            if self._active_task_id == task_id:
                self._active_task_id = None
            return True

    def get_task(self, task_id: str) -> TaskInfo:
        """Public accessor for task info."""
        return self._get_task(task_id)

    def _get_task(self, task_id: str) -> TaskInfo:
        task = self._tasks.get(task_id)
        if not task:
            raise KeyError(f"Task {task_id} not found")
        return task


# Singleton instance
task_manager = TaskManager()
