import os
from dotenv import load_dotenv

import uuid
from fastapi import FastAPI, UploadFile, File, HTTPException

from langchain_community.document_loaders import PyPDFLoader, TextLoader, UnstructuredMarkdownLoader, UnstructuredWordDocumentLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

load_dotenv()
app = FastAPI()

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
async def embed_file(file: UploadFile = File(...)):
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
        splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        chunks = splitter.split_documents(documents)

        # TODO: Determine best embeddings
        embeddings = OpenAIEmbeddings()
        vectorstore = Chroma.from_documents(chunks, embeddings, persist_directory=None)

        for i, chunk in enumerate(chunks):
            print(f"Chunk {i+1}:\n{chunk.page_content}\n{'-' * 40}")

        os.remove(temp_path)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error processing file: {str(e)}")

    return {
        "message": f"Embedded {file.filename} successfully",
        "chunks": len(chunks),
    }
