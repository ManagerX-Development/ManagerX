from fastapi import APIRouter
from .posts import router as posts_router
from .media import router as media_router
from .tags import router as tags_router
from .roadmap import router as roadmap_router
from .team import router as team_router
from .feedback import router as feedback_router

router = APIRouter(
    prefix="/cms",
    tags=["cms"]
)

router.include_router(posts_router)
router.include_router(media_router)
router.include_router(tags_router)
router.include_router(roadmap_router)
router.include_router(team_router)
router.include_router(feedback_router)
