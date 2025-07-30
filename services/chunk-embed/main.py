import os
from dotenv import load_dotenv

import uuid
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from supabase import create_client, Client

from langchain_community.document_loaders import PyPDFLoader, TextLoader, UnstructuredMarkdownLoader, UnstructuredWordDocumentLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

app = FastAPI()
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# TODO: Determine best embeddings
embeddings_model = OpenAIEmbeddings()

SUPPORTED_TYPES = {
    ".pdf": PyPDFLoader,
    ".txt": TextLoader,
    ".md": UnstructuredMarkdownLoader,
    ".docx": UnstructuredWordDocumentLoader,
}

@app.get('/status')
async def status_check():
    return {"status": "ok", "message": "Embedding service is live"}

@app.post('/')
async def embed_file(file_id: str = Form(...), file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1].lower()

    if ext not in SUPPORTED_TYPES:
        raise HTTPException(
            status_code=400, detail=f"Unsupported file type: {ext}")

    temp_path = f"/tmp/{uuid.uuid4()}_{file.filename}"
    with open(temp_path, "wb") as f:
        f.write(await file.read())

    try:
        loader_cls = SUPPORTED_TYPES[ext]
        loader = loader_cls(temp_path)
        documents = loader.load()

        # TODO: Determine best chunk_size and chunk_overlap
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=500, chunk_overlap=50)
        chunks = splitter.split_documents(documents)

        if (not check_file_id(file_id)):
            raise HTTPException(status_code=400, detail="file_id not found")

        save_chunks_and_embeddings(file_id, chunks)

        os.remove(temp_path)
    except Exception as e:
        os.remove(temp_path)

        raise HTTPException(
            status_code=500, detail=f"Error processing file: {str(e)}")

    return {
        "message": f"Embedded {file.filename} successfully",
        "chunks": len(chunks),
    }

def check_file_id(file_id):
    file_check = supabase.table("files").select(
        "id").eq("id", str(file_id)).execute()

    if not file_check.data:
        return False

    return True

def save_chunks_and_embeddings(file_id, chunks):
    for i, chunk in enumerate(chunks):
        chunk_result = supabase.table("chunks").insert({
            "file_id": file_id,
            "content": chunk.page_content,
            "chunk_index": i
        }).execute()

        chunk_id = chunk_result.data[0]["id"]

        vector = embeddings_model.embed_query(chunk.page_content)

        supabase.table("embeddings").insert({
            "chunk_id": chunk_id,
            "embedding": vector
        }).execute()

    supabase.table("files").update(
        {"status": "completed"}).eq("id", file_id).execute()
