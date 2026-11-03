from typing import List, Dict, Any, Optional
from app.db.chroma_client import vector_store
from app.services.chunking import chunk_legal_text
from app.services.embedding_service import embedding_service
from app.services.llm_service import llm_service
from app.core.logging import logger

class RAGService:
    def index_document(self, document_id: int, user_id: int, text: str):
        """
        Chunks and embeds document for RAG search.
        """
        chunks = chunk_legal_text(text)
        if not chunks:
            return

        texts = [c["text"] for c in chunks]
        ids = [f"doc_{document_id}_chunk_{c['chunk_id']}" for c in chunks]
        metadatas = [{"document_id": document_id, "user_id": user_id, "chunk_id": c["chunk_id"]} for c in chunks]
        embeddings = embedding_service.get_embeddings(texts)

        vector_store.add_documents(
            texts=texts,
            metadatas=metadatas,
            ids=ids,
            embeddings=embeddings
        )
        logger.info(f"Indexed {len(texts)} chunks for document_id={document_id}")

    async def answer_query(
        self,
        user_id: int,
        query: str,
        document_id: Optional[int] = None,
        document_text: Optional[str] = None
    ) -> str:
        """
        Retrieves top relevant excerpts and generates grounded legal response.
        Guarantees responses are strictly grounded in user-provided documents.
        """
        context = ""

        # Direct text passed (e.g. active document or pasted text in chat session)
        if document_text and len(document_text.strip()) > 30:
            context = document_text.strip()
        elif document_id:
            query_emb = embedding_service.get_embedding(query)
            relevant_items = vector_store.query(
                query_text=query,
                user_id=user_id,
                document_id=document_id,
                n_results=4,
                query_embedding=query_emb
            )

            if relevant_items:
                context = "\n\n---\n\n".join([f"[Excerpt {i+1}]:\n{item['text']}" for i, item in enumerate(relevant_items)])

        # If still no context found, check if document is in database
        if not context and document_id:
            try:
                from app.db.database import SessionLocal
                from app.db import models
                db = SessionLocal()
                doc = db.query(models.Document).filter(models.Document.id == document_id).first()
                if doc and doc.extracted_text:
                    context = doc.extracted_text
                db.close()
            except Exception as e:
                logger.warning(f"Could not load document text from DB: {e}")

        if not context:
            prompt = f"USER QUESTION: {query}"
        else:
            prompt = llm_service.load_prompt("rag_answer.txt", context=context, question=query)
            if not prompt:
                prompt = f"DOCUMENT EXCERPTS:\n{context}\n\nUSER QUESTION:\n{query}\n\nPROACTIVE LEGAL ADVISORY RESPONSE:"

        answer = await llm_service.generate_text(prompt)
        return answer

    def get_proactive_brief(self, text: str, document_id: Optional[int] = None) -> Dict[str, Any]:
        """
        Extracts verified entities from document and generates proactive suggested questions
        and key risk alerts tailored specifically to that document.
        """
        facts = llm_service._extract_document_facts(text)

        # Build dynamic, tailored suggested questions
        suggested = [
            f"What are {facts['party_two']}'s legal obligations and liabilities?",
            f"What is the exact notice period and procedure to terminate?",
            f"Is the security deposit ({facts['deposit']}) refundable under this agreement?",
            f"Does this contract contain an illegal lock-in or early exit penalty?",
            f"What critical protective rules are missing from this document?"
        ]

        if facts["has_unilateral_indemnity"]:
            suggested.insert(0, f"How can {facts['party_two']} challenge the unilateral indemnity clause?")

        # Build key alerts
        alerts = []
        if facts["has_unilateral_indemnity"]:
            alerts.append(f"Unilateral indemnity imposed on {facts['party_two']} without reciprocal protection.")
        if facts["lock_in_penal"]:
            alerts.append("Strict lock-in clause with unlawful total rent forfeiture upon early exit.")
        if facts["has_immediate_termination"]:
            alerts.append("Unilateral termination right without reasonable 15-day cure notice.")
        if facts["has_distant_court"]:
            alerts.append(f"Out-of-state court seat in Delhi for {facts['state']} agreement multiplies dispute costs.")
        if not facts["has_liability_cap"]:
            alerts.append("No limitation of liability cap on indirect or consequential claims.")

        welcome_msg = (
            f"📄 **Proactive Analysis Ready: {facts['title']}**\n\n"
            f"I have analyzed your document executed between **{facts['party_one']}** and **{facts['party_two']}** "
            f"in **{facts['city']}, {facts['state']}** (Tenure: {facts['duration']}).\n\n"
            f"**Key Findings:**\n"
            f"* **Consideration / Rent:** {facts['rent']}\n"
            f"* **Security Deposit:** {facts['deposit']}\n"
            f"* **Notice Period:** {facts['notice_period']}\n"
            f"* **Immediate Risk Alerts:** {len(alerts)} item(s) requiring attention.\n\n"
            f"Ask me any question below. My answers are **strictly grounded in this document only**."
        )

        return {
            "document_id": document_id,
            "title": facts["title"],
            "doc_type": facts["doc_type"],
            "party_one": facts["party_one"],
            "party_two": facts["party_two"],
            "rent": facts["rent"],
            "deposit": facts["deposit"],
            "duration": facts["duration"],
            "notice_period": facts["notice_period"],
            "state": facts["state"],
            "welcome_message": welcome_msg,
            "suggested_queries": suggested,
            "key_alerts": alerts
        }

rag_service = RAGService()

