import os
import tempfile
from pathlib import Path
from dotenv import load_dotenv
import asyncio

import uuid
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from supabase import create_client, Client

from langchain_community.document_loaders import PyPDFLoader, TextLoader, UnstructuredMarkdownLoader, UnstructuredWordDocumentLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings

from utils.security import get_user_id_from_request, assert_file_owned

load_dotenv()

APP_ENV = os.getenv("APP_ENV")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

app = FastAPI()
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# TODO: Determine best embeddings
embeddings_model = OpenAIEmbeddings(model="text-embedding-3-small")

SUPPORTED_TYPES = {
    ".pdf": PyPDFLoader,
    # ".txt": TextLoader,
    # ".md": UnstructuredMarkdownLoader,
    # ".docx": UnstructuredWordDocumentLoader,
}


@app.get('/status')
async def status_check():
    return {"status": "ok", "message": "Embedding service is live"}


@app.post('/')
async def embed_file(request: Request, file_id: str = Form(...), file: UploadFile = File(...)):
    user_id = get_user_id_from_request(request)
    assert_file_owned(supabase, file_id, user_id)

    ext = os.path.splitext(file.filename)[1].lower()

    if ext not in SUPPORTED_TYPES:
        raise HTTPException(
            status_code=400, detail=f"Unsupported file type: {ext}")

    if (not check_file_id(file_id)):
        raise HTTPException(status_code=400, detail="file_id not found")

    temp_path = Path(tempfile.gettempdir()) / f"{uuid.uuid4()}_{file.filename}"
    try:
        contents = await file.read()
        temp_path.write_bytes(contents)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Could not persist upload: {e}")

    try:
        loader_cls = SUPPORTED_TYPES[ext]
        loader = loader_cls(temp_path)
        documents = loader.load()

        # TODO: Determine best chunk_size and chunk_overlap
        splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
            encoding_name="cl100k_base",
            chunk_size=500,
            chunk_overlap=100,
            add_start_index=True,
        )
        chunks = splitter.split_documents(documents)

        save_chunks_and_embeddings(file_id, chunks)

        supabase.table("files").update(
            {"status": "completed"}).eq("id", file_id).execute()

    except Exception as e:
        supabase.table("files").update(
            {"status": "failed"}).eq("id", file_id).execute()

        raise HTTPException(
            status_code=500, detail=f"Error processing file: {str(e)}")
    finally:
        os.remove(temp_path)

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


def _batched(seq, n):
    for i in range(0, len(seq), n):
        yield seq[i:i+n]


def save_chunks_and_embeddings(file_id, chunks):
    # Prepare rows and texts (preserve order by chunk_index)
    chunk_rows = []
    texts = []
    for i, chunk in enumerate(chunks):
        content = (chunk.page_content or "").strip()
        chunk_rows.append({
            "file_id": file_id,
            "content": content,
            "chunk_index": i
        })
        texts.append(content)

    # 1) Insert all chunks in one go (returns ids)
    # If your client supports .select(), you can do: .select("id,chunk_index")
    inserted = supabase.table("chunks").insert(chunk_rows).execute()
    if not inserted.data or len(inserted.data) != len(chunk_rows):
        raise RuntimeError("Failed to insert chunks or row count mismatch.")
    # Map chunk_index -> generated id
    idx_to_id = {row["chunk_index"]: row["id"] for row in inserted.data}

    # 2) Embed documents in batches (NOT embed_query)
    EMB_BATCH = 128  # tune as needed for rate limits
    vectors = [None] * len(texts)
    pos = 0
    for batch in _batched(texts, EMB_BATCH):
        vecs = embeddings_model.embed_documents(batch)  # list[list[float]]
        vectors[pos:pos+len(vecs)] = vecs
        pos += len(vecs)

    # 3) Insert embeddings in batches
    DB_BATCH = 500
    emb_rows = [{"chunk_id": idx_to_id[i], "embedding": vec}
                for i, vec in enumerate(vectors)]
    for batch in _batched(emb_rows, DB_BATCH):
        supabase.table("embeddings").insert(batch).execute()
