import os
import sys
import subprocess
import tempfile
import time
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from pydantic import BaseModel
from typing import Optional
from google import genai
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Initialize the Gemini client
client = genai.Client(api_key=GEMINI_API_KEY)

# Initialize FastAPI app
app = FastAPI(title="Summarizer API & Code Panel", version="1.0")

# Request and response models for original summarize
class SummaryRequest(BaseModel):
    text: str
    max_length: Optional[int] = 150

class SummaryResponse(BaseModel):
    summary: str

@app.post("/summarize", response_model=SummaryResponse)
def summarize(request: SummaryRequest):
    try:
        prompt = f"Summarize the following text briefly in under {request.max_length} words:\n\n{request.text}"
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        summary = response.text.strip()
        return {"summary": summary}
    except Exception as e:
        print(f"Error during summarization: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

# --- CODE RUNNER PANEL BACKEND ---

# Models for execution
class CodeRequest(BaseModel):
    code: str

class CodeResponse(BaseModel):
    stdout: str
    stderr: str
    exit_code: int
    elapsed_time: float

# Models for AI Assistant
class ExplainRequest(BaseModel):
    code: str
    stdout: Optional[str] = ""
    stderr: Optional[str] = ""
    exit_code: Optional[int] = 0

class GenerateRequest(BaseModel):
    prompt: str
    current_code: Optional[str] = ""

@app.post("/api/run", response_model=CodeResponse)
def run_python_code(request: CodeRequest):
    """
    Executes Python code in an isolated subprocess.
    Applies a 5-second timeout safety net to prevent infinite loops.
    """
    # Create temporary file safely for Windows compatibility
    fd, temp_file_path = tempfile.mkstemp(suffix=".py")
    try:
        with os.fdopen(fd, 'w', encoding='utf-8') as f:
            f.write(request.code)
            
        start_time = time.perf_counter()
        # Execute script in subprocess using current Python environment interpreter
        result = subprocess.run(
            [sys.executable, temp_file_path],
            capture_output=True,
            text=True,
            timeout=5.0
        )
        elapsed_time = time.perf_counter() - start_time
        stdout = result.stdout
        stderr = result.stderr
        exit_code = result.returncode
    except subprocess.TimeoutExpired as e:
        elapsed_time = 5.0
        stdout = e.stdout or ""
        stderr = (e.stderr or "") + "\n[Execution Timeout: Code took longer than 5.0 seconds to run]"
        exit_code = -1
    except Exception as e:
        elapsed_time = 0.0
        stdout = ""
        stderr = f"System Error executing script: {str(e)}"
        exit_code = -1
    finally:
        # Securely remove temporary script after execution
        try:
            os.remove(temp_file_path)
        except Exception:
            pass
            
    return {
        "stdout": stdout,
        "stderr": stderr,
        "exit_code": exit_code,
        "elapsed_time": elapsed_time
    }

@app.post("/api/ai/explain")
def explain_code(request: ExplainRequest):
    """
    Uses Gemini to explain Python execution errors or suggest code optimizations.
    """
    try:
        prompt = (
            "You are an expert Python debugger and programming mentor.\n"
            "Below is the Python script that was executed:\n"
            f"```python\n{request.code}\n```\n\n"
        )
        if request.stderr or request.exit_code != 0:
            prompt += (
                f"Standard Error / Exceptions raised:\n```\n{request.stderr}\n```\n"
                f"Exit Code: {request.exit_code}\n\n"
                "Please explain clearly why this error occurred in plain language. "
                "Provide a corrected and optimized version of the code inside a standard markdown ```python block. "
                "Highlight what was changed and why."
            )
        else:
            prompt += (
                f"Standard Output:\n```\n{request.stdout}\n```\n\n"
                "The code executed successfully. Please describe what the script does, "
                "and propose 2-3 advanced code improvements, performance enhancements, or modular restructurings, "
                "providing a refactored version of the code inside a standard markdown ```python block."
            )

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        return {"explanation": response.text}
    except Exception as e:
        print(f"Error during AI explanation: {e}")
        raise HTTPException(status_code=500, detail=f"Gemini API Error: {str(e)}")

@app.post("/api/ai/generate")
def generate_code(request: GenerateRequest):
    """
    Generates or modifies Python code from a user prompt using Gemini.
    """
    try:
        prompt = (
            "You are an expert Python software engineer.\n"
            f"The user wants you to generate code to: '{request.prompt}'.\n"
        )
        if request.current_code:
            prompt += (
                "The editor currently contains this code:\n"
                f"```python\n{request.current_code}\n```\n"
                "Modify, extend, or rewrite it according to the request.\n"
            )
        prompt += (
            "Explain your logic briefly first, then output the final complete, runnable "
            "Python script enclosed inside standard ```python and ``` backticks so the user can import it."
        )

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        return {"result": response.text}
    except Exception as e:
        print(f"Error during AI code generation: {e}")
        raise HTTPException(status_code=500, detail=f"Gemini API Error: {str(e)}")

# Mount static UI assets
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", response_class=HTMLResponse)
def get_dashboard():
    """
    Serves the developer panel dashboard at the root URL.
    """
    index_path = os.path.join("static", "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return HTMLResponse("<h2>PyPanel.ai dashboard index.html not found. Make sure the static folder is configured properly!</h2>")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("genai_app:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=True)