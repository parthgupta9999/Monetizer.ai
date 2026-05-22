import json
import logging
from typing import List, Dict, Any, Optional

import config as app_config
import numpy as np
from langchain_community.embeddings import HuggingFaceEmbeddings
from sentence_transformers import SentenceTransformer
from supabase import create_client, Client

from creator_config import get_creator_config

logger = logging.getLogger(__name__)

class RAGService:
    def __init__(self):
        self.supabase_clients = {}
        try:
            self.embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
            self.embedding_dim = 384
            self.langchain_embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2",
                model_kwargs={"device": "cpu"},
            )
            logger.info("Embedding models loaded")
        except Exception as e:
            logger.error("Embedding model load failed: %s", e)
            self.embedding_model = None
            self.langchain_embeddings = None
    
    def get_supabase_client(self, creator_name: str) -> Optional[Client]:
        if creator_name in self.supabase_clients:
            return self.supabase_clients[creator_name]

        cfg = get_creator_config(creator_name)
        supabase_url = cfg.get("supabase_url", "").rstrip("/")
        supabase_key = cfg.get("supabase_key", "")

        if not supabase_url or not supabase_key:
            logger.warning("No Supabase configuration for %s", creator_name)
            return None

        try:
            client = create_client(supabase_url, supabase_key)
            self.supabase_clients[creator_name] = client
            logger.info("Supabase client ready for %s", creator_name)
            return client
        except Exception as e:
            logger.error("Supabase client failed for %s: %s", creator_name, e)
            return None
    
    def generate_embedding(self, text: str) -> List[float]:
        if not self.embedding_model:
            return []
        
        try:
            embedding = self.embedding_model.encode(text)
            return embedding.tolist()
        except Exception as e:
            logger.error("Embedding error: %s", e)
            return []
    
    def search_knowledge_base(
        self, query: str, creator_name: str, creator_id: int, limit: int = 5
    ) -> List[Dict[str, Any]]:
        supabase = self.get_supabase_client(creator_name)

        if not supabase or not self.embedding_model:
            logger.warning("Supabase or embeddings unavailable, empty search")
            return []

        try:
            cfg = get_creator_config(creator_name)
            table_name = cfg.get("knowledge_table", "creator_knowledge")

            query_embedding = self.generate_embedding(query)
            if not query_embedding:
                return []
            
            # Try different search methods
            # Method 1: Use RPC function if available
            try:
                response = supabase.rpc(
                    'match_creator_knowledge',
                    {
                        'query_embedding': query_embedding,
                        'creator_id': creator_id,
                        'match_threshold': 0.7,
                        'match_count': limit
                    }
                ).execute()
                
                if response.data and len(response.data) > 0:
                    logger.info(f"✅ Found {len(response.data)} relevant knowledge entries via RPC")
                    return response.data
            except Exception as rpc_error:
                logger.info(f"ℹ️ RPC function not available, trying direct table query: {rpc_error}")
            
            # Method 2: Use LangChain for semantic similarity search
            try:
                # Get all entries from the table
                response = supabase.table(table_name).select('*').limit(100).execute()
                
                if response.data and len(response.data) > 0:
                    logger.info(f"✅ Found {len(response.data)} entries from {table_name}")
                    
                    # Use LangChain for semantic similarity matching
                    # Generate query embedding
                    query_embedding = self.generate_embedding(query)
                    if not query_embedding:
                        return []
                    
                    # Calculate similarity scores for all entries
                    relevant_entries = []
                    query_embedding_np = np.array(query_embedding)
                    
                    for entry in response.data:
                        # Get text content from various fields
                        title = entry.get('title', '')
                        description = entry.get('description', '')
                        content = entry.get('content', '')
                        transcript = entry.get('transcript', '')
                        
                        # Combine all text fields
                        combined_text = f"{title} {description} {content} {transcript}".strip()
                        
                        if not combined_text:
                            continue
                        
                        # Generate embedding for this entry
                        entry_embedding = self.generate_embedding(combined_text)
                        if not entry_embedding:
                            continue
                        
                        # Calculate cosine similarity
                        entry_embedding_np = np.array(entry_embedding)
                        similarity = np.dot(query_embedding_np, entry_embedding_np) / (
                            np.linalg.norm(query_embedding_np) * np.linalg.norm(entry_embedding_np)
                        )
                        
                        # Very permissive threshold: accept anything with >0.1 similarity (very low bar)
                        if similarity > 0.1:
                            entry['similarity'] = float(similarity)
                            relevant_entries.append(entry)
                    
                    # Sort by similarity and return top results
                    relevant_entries.sort(key=lambda x: x.get('similarity', 0), reverse=True)
                    
                    if relevant_entries:
                        logger.info(f"✅ Found {len(relevant_entries)} relevant entries via semantic search")
                        return relevant_entries[:limit]
                    else:
                        logger.info("ℹ️ No relevant entries found via semantic search")
                        return []
                        
            except Exception as semantic_error:
                logger.warning(f"⚠️ Semantic search failed: {semantic_error}")
                # Fallback: return first few entries if semantic search fails
                try:
                    response = supabase.table(table_name).select('*').limit(limit).execute()
                    if response.data:
                        logger.info(f"⚠️ Using fallback: returning first {len(response.data)} entries")
                        return response.data
                except:
                    pass
                return []
            
            logger.info("ℹ️ No relevant knowledge found")
            return []
                
        except Exception as e:
            logger.error(f"❌ Error searching knowledge base: {e}")
            return []
    
    def get_creator_info(self, creator_name: str, creator_id: int) -> Dict[str, Any]:
        """Get creator information"""
        supabase = self.get_supabase_client(creator_name)
        
        if not supabase:
            return {}
        
        try:
            response = supabase.table('creators').select('*').eq('id', creator_id).execute()
            if response.data:
                return response.data[0]
            return {}
        except Exception as e:
            logger.error(f"❌ Error getting creator info: {e}")
            return {}
    
    def build_context_from_knowledge(self, knowledge_entries: List[Dict[str, Any]]) -> str:
        """Build context string from retrieved knowledge entries"""
        if not knowledge_entries:
            return ""
        
        context_parts = []
        for entry in knowledge_entries:
            # Handle different table structures
            # Standard structure: content, metadata
            # mkbhd_videos structure: might have title, description, transcript, etc.
            
            content = entry.get('content', '') or entry.get('description', '') or entry.get('transcript', '')
            title = entry.get('title', '')
            metadata = entry.get('metadata', {})
            
            # If metadata is a string, try to parse it
            if isinstance(metadata, str):
                try:
                    import json
                    metadata = json.loads(metadata)
                except:
                    metadata = {}
            
            source = metadata.get('source', '') or entry.get('source', '') or title
            
            # Build context entry
            if title:
                context_parts.append(f"Video: {title}\n{content}")
            elif source:
                context_parts.append(f"Source: {source}\nContent: {content}")
            else:
                context_parts.append(content)
        
        return "\n\n".join(context_parts)
    
    def retrieve_and_augment(self, query: str, creator_name: str, creator_id: int) -> Dict[str, Any]:
        """Main RAG function: retrieve relevant knowledge and prepare for augmentation"""
        try:
            # Get creator information
            creator_info = self.get_creator_info(creator_name, creator_id)
            if not creator_info:
                # If we can't get creator info, use the passed name
                creator_info = {'name': creator_name, 'specialty': 'tech expert'}
            
            # Search for relevant knowledge (retrieve more entries for better context)
            knowledge_entries = self.search_knowledge_base(query, creator_name, creator_id, limit=5)
            
            # Check if knowledge entries are truly relevant (not just low similarity matches)
            is_relevant = False
            if knowledge_entries:
                # Check the highest similarity score (entries might not have this field if from fallback)
                best_similarity = 0
                for entry in knowledge_entries:
                    similarity = entry.get('similarity', 0)
                    if similarity > best_similarity:
                        best_similarity = similarity
                
                if best_similarity >= 0.3:  # Threshold for truly relevant content
                    is_relevant = True
                    logger.info(f"✅ Best similarity score: {best_similarity:.3f} - content is relevant")
                elif best_similarity > 0:
                    logger.info(f"⚠️ Best similarity score: {best_similarity:.3f} - content is NOT relevant enough")
                else:
                    # No similarity scores (fallback path) - assume relevant if we got entries
                    is_relevant = True
                    logger.info(f"ℹ️ No similarity scores found, assuming content is relevant")
            
            if not knowledge_entries or not is_relevant:
                # No relevant knowledge found - return fallback response WITHOUT link
                fallback_response = f"I haven't made any videos or content about that topic. As {creator_name}, I focus on {creator_info.get('specialty', 'tech content')}, so I don't have specific insights on that particular subject."
                
                return {
                    'enhanced_system_prompt': f"You are {creator_name}. Respond as this creator would, but mention that you haven't covered this topic.",
                    'knowledge_context': '',
                    'creator_info': creator_info,
                    'retrieved_entries': 0,
                    'fallback_response': fallback_response,
                    'has_knowledge': False
                }
            
            knowledge_context = self.build_context_from_knowledge(knowledge_entries)

            logger.info("RAG context length %s chars", len(knowledge_context))

            if not knowledge_context or len(knowledge_context.strip()) < 10:
                logger.info("Knowledge context empty, fallback")
                fallback_response = f"I haven't made any videos or content about that topic. As {creator_name}, I focus on {creator_info.get('specialty', 'tech content')}, so I don't have specific insights on that particular subject."

                return {
                    "enhanced_system_prompt": f"You are {creator_name}. Respond as this creator would, but mention that you haven't covered this topic.",
                    "knowledge_context": "",
                    "creator_info": creator_info,
                    "retrieved_entries": 0,
                    "fallback_response": fallback_response,
                    "has_knowledge": False,
                }

            logger.info("RAG matched %s entries", len(knowledge_entries))

            if app_config.AFFILIATE_LINK:
                link_block = f"""
Link rule:
- End every reply with a new line: [click here to buy]({app_config.AFFILIATE_LINK})
- Do not add other shopping links unless they appear in the knowledge below.
"""
            else:
                link_block = """
Links:
- Do not invent URLs; only use links that appear in the knowledge when relevant.
"""

            enhanced_system_prompt = f"""You are {creator_name}. Answer only from the knowledge below.

{link_block}

Rules:
- Use only the knowledge block; no outside facts or guesses.
- If the topic is not covered, say you have not made videos about it.
- Be conversational (about 2–4 short paragraphs when the material supports it).

KNOWLEDGE:
{knowledge_context}

Question: {query}
"""

            return {
                "enhanced_system_prompt": enhanced_system_prompt,
                "knowledge_context": knowledge_context,
                "creator_info": creator_info,
                "retrieved_entries": len(knowledge_entries),
                "fallback_response": None,
                "has_knowledge": True,
            }

        except Exception as e:
            logger.error("retrieve_and_augment: %s", e)
            return {
                "enhanced_system_prompt": f"You are an AI assistant. Answer the user's question: {query}",
                "knowledge_context": "",
                "creator_info": {},
                "retrieved_entries": 0,
                "fallback_response": "I'm having trouble accessing my knowledge base right now. Please try again later.",
                "has_knowledge": False,
            }


rag_service = RAGService()
