import math
from typing import List

class EmbeddingService:
    """
    Computes semantic text embeddings for ChromaDB vector operations.
    """
    def __init__(self):
        self.model = None
        self._init_model()

    def _init_model(self):
        try:
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
        except Exception:
            self.model = None

    def get_embedding(self, text: str) -> List[float]:
        if self.model:
            try:
                emb = self.model.encode(text).tolist()
                return emb
            except Exception:
                pass
        return self._fallback_embedding(text)

    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        return [self.get_embedding(t) for t in texts]

    def _fallback_embedding(self, text: str) -> List[float]:
        vec = [0.0] * 64
        words = text.lower().split()
        for w in words:
            idx = abs(hash(w)) % 64
            vec[idx] += 1.0
        norm = math.sqrt(sum(x * x for x in vec)) or 1.0
        return [x / norm for x in vec]

embedding_service = EmbeddingService()
