import os
import tempfile

from fastapi import FastAPI, File, HTTPException, UploadFile

from app.chunker import chunk_resume
from app.resume_parser import parse_resume


app = FastAPI(
    title="CareerCopilot AI Analyzer",
    version="1.0.0"
)


@app.get("/")
def root():
    return {
        "message": "CareerCopilot AI Analyzer is running"
    }


@app.get("/api/health")
def health():
    return {
        "status": "healthy"
    }


@app.post("/api/resume/parse")
async def parse_resume_endpoint(file: UploadFile = File(...)):
    filename = file.filename or ""

    extension = os.path.splitext(filename)[1].lower()

    if extension not in [".pdf", ".docx"]:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX resumes are supported."
        )

    file_bytes = await file.read()

    if not file_bytes:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty."
        )

    temporary_path = None

    try:
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=extension
        ) as temporary_file:

            temporary_file.write(file_bytes)
            temporary_path = temporary_file.name

        text = parse_resume(temporary_path)

        chunks = chunk_resume(text)

        return {
            "filename": filename,
            "characters": len(text),
            "chunks_count": len(chunks),
            "chunks": chunks
        }

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Resume processing failed: {error}"
        )

    finally:
        if temporary_path and os.path.exists(temporary_path):
            os.remove(temporary_path)