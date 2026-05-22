import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env", override=False)


def _e(name: str, default: str = "") -> str:
    return os.environ.get(name, default).strip()


CREATOR_SUPABASE_CONFIG = {
    "Marques Brownlee": {
        "supabase_url": _e("SUPABASE_MARQUES_URL"),
        "supabase_key": _e("SUPABASE_MARQUES_KEY"),
        "knowledge_table": _e("SUPABASE_MARQUES_TABLE", "mkbhd_videos"),
    },
    "Austin Evans": {
        "supabase_url": _e("SUPABASE_AUSTIN_URL"),
        "supabase_key": _e("SUPABASE_AUSTIN_KEY"),
        "knowledge_table": _e("SUPABASE_AUSTIN_TABLE", "justine_videos"),
    },
    "Zack Nelson": {
        "supabase_url": _e("SUPABASE_ZACK_URL"),
        "supabase_key": _e("SUPABASE_ZACK_KEY"),
        "knowledge_table": _e("SUPABASE_ZACK_TABLE", "jerry_videos"),
    },
    "Lewis George Hilsenteger": {
        "supabase_url": _e("SUPABASE_LEWIS_URL"),
        "supabase_key": _e("SUPABASE_LEWIS_KEY"),
        "knowledge_table": _e("SUPABASE_LEWIS_TABLE", "unbox_videos"),
    },
}


def get_creator_config(creator_name: str) -> dict:
    return CREATOR_SUPABASE_CONFIG.get(
        creator_name, {"supabase_url": "", "supabase_key": ""}
    )


def set_creator_config(creator_name: str, url: str, key: str):
    if creator_name in CREATOR_SUPABASE_CONFIG:
        CREATOR_SUPABASE_CONFIG[creator_name]["supabase_url"] = url
        CREATOR_SUPABASE_CONFIG[creator_name]["supabase_key"] = key
        print(f"Updated {creator_name} Supabase configuration")
    else:
        print(f"Creator '{creator_name}' not found")
