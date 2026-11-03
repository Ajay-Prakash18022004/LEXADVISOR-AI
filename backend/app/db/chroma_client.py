import os
import json
import math
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.core.logging import logger

class VectorStore:
    """
    Self-contained RAG Vector Store with ChromaDB backend or fast persistent embedded fallback.
    Guarantees user and document isolation via metadata filtering.
    """
    def __init__(self):
        self.chroma_client = None
        self.collection = None
        self.fallback_file = settings.CHROMA_PATH / "embedded_store.json"
        self._init_backend()

    def _init_backend(self):
        try:
            import chromadb
            self.chroma_client = chromadb.PersistentClient(path=str(settings.CHROMA_PATH))
            self.collection = self.chroma_client.get_or_create_collection(name="lexadvisor_documents")
            logger.info("ChromaDB vector client initialized successfully.")
        except Exception as e:
            logger.warning(f"ChromaDB native client not available ({e}). Using embedded vector storage engine.")
            self._init_fallback()

    def _init_fallback(self):
        if not self.fallback_file.exists():
            with open(self.fallback_file, "w", encoding="utf-8") as f:
                json.dump([], f)

    def _load_fallback(self) -> List[Dict[str, Any]]:
        try:
            with open(self.fallback_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def _save_fallback(self, records: List[Dict[str, Any]]):
        with open(self.fallback_file, "w", encoding="utf-8") as f:
            json.dump(records, f)

    def add_documents(self, texts: List[str], metadatas: List[Dict[str, Any]], ids: List[str], embeddings: Optional[List[List[float]]] = None):
        if self.collection:
            try:
                kwargs = {
                    "documents": texts,
                    "metadatas": metadatas,
                    "ids": ids
                }
                if embeddings:
                    kwargs["embeddings"] = embeddings
                self.collection.add(**kwargs)
                return
            except Exception as e:
                logger.error(f"Error adding to ChromaDB collection: {e}. Falling back.")

        # Fallback storage
        records = self._load_fallback()
        for idx, (doc_id, text, meta) in enumerate(zip(ids, texts, metadatas)):
            emb = embeddings[idx] if embeddings else self._mock_embed(text)
            records.append({
                "id": doc_id,
                "text": text,
                "metadata": meta,
                "embedding": emb
            })
        self._save_fallback(records)

    def query(self, query_text: str, user_id: int, document_id: Optional[int] = None, n_results: int = 4, query_embedding: Optional[List[float]] = None) -> List[Dict[str, Any]]:
        if self.collection:
            try:
                where_filter = {"user_id": user_id}
                if document_id is not None:
                    where_filter = {"$and": [{"user_id": user_id}, {"document_id": document_id}]}
                
                results = self.collection.query(
                    query_texts=[query_text],
                    n_results=n_results,
                    where=where_filter
                )
                
                items = []
                docs = results.get("documents", [[]])[0]
                metas = results.get("metadatas", [[]])[0]
                for doc, meta in zip(docs, metas):
                    items.append({"text": doc, "metadata": meta})
                if items:
                    return items
            except Exception as e:
                logger.warning(f"ChromaDB query fallback: {e}")

        # Fallback keyword and embedding search
        records = self._load_fallback()
        filtered = [
            r for r in records 
            if r.get("metadata", {}).get("user_id") == user_id and 
            (document_id is None or r.get("metadata", {}).get("document_id") == document_id)
        ]
        
        q_emb = query_embedding or self._mock_embed(query_text)
        scored = []
        for r in filtered:
            score = self._cosine_sim(q_emb, r.get("embedding", []))
            # Also boost if words appear
            words = set(query_text.lower().split())
            text_words = set(r["text"].lower().split())
            overlap = len(words.intersection(text_words)) / max(1, len(words))
            combined_score = (score * 0.5) + (overlap * 0.5)
            scored.append((combined_score, r))
            
        scored.sort(key=lambda x: x[0], reverse=True)
        return [{"text": item["text"], "metadata": item["metadata"]} for _, item in scored[:n_results]]

    def _mock_embed(self, text: str) -> List[float]:
        """Deterministic hash-based embedding for fallback search"""
        vec = [0.0] * 64
        words = text.lower().split()
        for w in words:
            idx = abs(hash(w)) % 64
            vec[idx] += 1.0
        norm = math.sqrt(sum(x * x for x in vec)) or 1.0
        return [x / norm for x in vec]

    def _cosine_sim(self, v1: List[float], v2: List[float]) -> float:
        if not v1 or not v2 or len(v1) != len(v2):
            return 0.0
        dot = sum(a * b for a, b in zip(v1, v2))
        return max(-1.0, min(1.0, dot))

vector_store = VectorStore()
