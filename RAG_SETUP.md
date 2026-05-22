# RAG Integration Setup Guide

## 🚀 **Quick Start**

### **1. Install Dependencies**
```bash
conda activate base
pip install -r requirements.txt
```

### **2. Set up Supabase**

#### **A. Create Supabase Project**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Get your project URL and anon key

#### **B. Set up Creator-Specific Supabase APIs**

You can configure separate Supabase APIs for each creator. Use the setup script:

**For MKBHD only:**
```bash
python setup_creator_api.py
```

**For all creators:**
```bash
python setup_creator_api.py --all
```

Or set the `SUPABASE_*` variables in `.env` (see `.env.example`); `creator_config.py` loads them at startup.

#### **C. Set up Database Schema**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL from `supabase_schema.sql`

### **3. Populate Embeddings**
```bash
python setup_embeddings.py
```

### **4. Test the Integration**
```bash
python server.py
```

## 🔧 **How It Works**

### **Flow:**
1. **User Query** → "What's the best iPhone for photography?"
2. **Generate Embedding** → Convert query to vector
3. **Search Supabase** → Find similar knowledge entries
4. **Retrieve Context** → Get relevant creator knowledge
5. **Enhanced Response** → Use knowledge to augment Groq API response

### **Fallback Behavior:**
- If no knowledge found → "I haven't made any videos on that topic"
- If Supabase unavailable → Use original Groq API
- If embedding fails → Use fallback response

## 📊 **Database Schema**

### **Tables:**
- `creators` - Creator information and expertise
- `creator_knowledge` - Knowledge base with embeddings
- `match_creator_knowledge()` - Vector similarity search function

### **Sample Data:**
- 5 creators with expertise areas
- Sample knowledge entries for each creator
- Vector embeddings for semantic search

## 🎯 **Testing**

### **Test Queries:**
- "What's the best iPhone for photography?" → Should find Marques Brownlee's camera knowledge
- "Best gaming graphics card?" → Should find Austin Evans' PC building knowledge
- "Random topic" → Should return fallback response

### **Expected Responses:**
- **With Knowledge**: Detailed response using creator's actual content
- **Without Knowledge**: "I haven't made any videos on that topic"

## 🔍 **Debugging**

### **Check Logs:**
- Look for "✅ RAG-enhanced response" for successful knowledge retrieval
- Look for "ℹ️ No knowledge found" for fallback responses
- Check Supabase connection in logs

### **Common Issues:**
1. **Supabase not configured** → Set environment variables
2. **No embeddings** → Run `python setup_embeddings.py`
3. **No knowledge found** → Add more knowledge entries to database

## 📈 **Next Steps**

1. **Add Real Knowledge**: Replace sample data with actual creator content
2. **Fine-tune Thresholds**: Adjust similarity thresholds for better results
3. **Add More Creators**: Expand the knowledge base
4. **Monitor Performance**: Track knowledge retrieval success rates
