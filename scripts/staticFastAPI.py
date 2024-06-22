from modules import script_callbacks
from modules.shared import cmd_opts
import gradio as gr
from fastapi import FastAPI
from fastapi.responses import FileResponse
from scripts.logger import logger

import os
cwd = os.path.normpath(os.path.join(__file__, "../../"))


def on_app_started(_: gr.Blocks, app: FastAPI) -> None:
    api_base = "/BetterPrompt"
    @app.get(f"{api_base}/static/{{file_path:path}}")
    async def serve_static_file(file_path: str):
        file_full_path = f"{cwd}/static/{file_path}"
        return FileResponse(file_full_path)
    
script_callbacks.on_app_started(on_app_started)
