from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Union

# =============================================================================
# Auth Models
# =============================================================================
class EmailLoginRequest(BaseModel):
    email: str
    password: str

class CallbackRequest(BaseModel):
    code: str

# =============================================================================
# Settings Models
# =============================================================================
class GeneralSettingsUpdate(BaseModel):
    language: Optional[str] = None
    user_role_id: Optional[Union[str, int]] = None
    team_role_id: Optional[Union[str, int]] = None

class WelcomeSettingsUpdate(BaseModel):
    channel_id: Optional[Union[str, int]] = None
    auto_role_id: Optional[Union[str, int]] = None

class AntiSpamSettingsUpdate(BaseModel):
    log_channel_id: Optional[Union[str, int]] = None
    max_messages: Optional[int] = 5
    time_frame: Optional[int] = 10

class GlobalChatSettingsUpdate(BaseModel):
    channel_id: Optional[Union[str, int]] = None
    filter_enabled: Optional[bool] = None
    nsfw_filter: Optional[bool] = None
    embed_color: Optional[str] = None

class LoggingSettingsUpdate(BaseModel):
    channel_id: Optional[Union[str, int]] = None

class AutoRoleSettingsUpdate(BaseModel):
    role_id: Optional[Union[str, int]] = None

class AutoDeleteItem(BaseModel):
    channel_id: Union[str, int]
    duration: int
    exclude_pinned: Optional[bool] = True
    exclude_bots: Optional[bool] = False

class TempVCSettingsUpdate(BaseModel):
    creator_channel_id: Optional[Union[str, int]] = None
    category_id: Optional[Union[str, int]] = None
    auto_delete_time: Optional[int] = 0
    ui_enabled: Optional[bool] = False
    ui_prefix: Optional[str] = "🔧"

# =============================================================================
# Admin Models
# =============================================================================
class BlacklistAddRequest(BaseModel):
    user_id: str
    reason: Optional[str] = "Kein Grund angegeben"

# =============================================================================
# Management Models
# =============================================================================
class AutoResponderAddRequest(BaseModel):
    keyword: str
    response: str
    match_type: Optional[str] = "partial"

class ApplicationQuestionsUpdate(BaseModel):
    questions: List[str]

# =============================================================================
# User Models
# =============================================================================
class UserSettingsUpdate(BaseModel):
    language: Optional[str] = None
    is_private: Optional[bool] = None
