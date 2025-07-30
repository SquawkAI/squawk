import os
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma

load_dotenv()

OPENAI_API_KEY=os.getenv("OPENAI_API_KEY")

loader = PyPDFLoader("example.pdf")
documents = loader.load()

# TODO: Determine best chunk_size and chunk_overlap
splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
chunks = splitter.split_documents(documents)

embeddings = OpenAIEmbeddings(api_key=OPENAI_API_KEY)
vectorstore = Chroma.from_documents(chunks, embeddings, persist_directory=None)