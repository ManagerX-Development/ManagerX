import sys
import os

# Füge den aktuellen Ordner (mxmariadb) zum Systempfad hinzu
pkg_dir = os.path.dirname(os.path.abspath(__file__))
if pkg_dir not in sys.path:
    sys.path.append(pkg_dir)

from .antispam_db import SpamDB as AntiSpamDatabase
from .autodelete_db import AutoDeleteDB
from .autorole_db import AutoRoleDatabase
from .globalchat_db import GlobalChatDatabase
from .settings_db import SettingsDB
from .levelsystem_db import LevelDatabase
from .logging_db import LoggingDatabase
from .notes_db import NotesDatabase
from .stats_db import StatsDB
from .vc_db import TempVCDatabase
from .warn_db import WarnDatabase
from .welcome_db import WelcomeDatabase
from .profile_db import ProfileDB
from .economy_db import EconomyDatabase
