"""
MindShield Pro - Backend Server
Secure FastAPI server with MongoDB using PyMongo
"""

import os
import re
import time,uvicorn
from datetime import datetime, timedelta
from typing import List, Optional
from urllib.parse import urlparse
from collections import defaultdict
from time import time as current_time
from fastapi import FastAPI, HTTPException, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, validator
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import DuplicateKeyError, PyMongoError, ConnectionFailure

# ==================== CONFIGURATION ====================

PORT = int(os.getenv("PORT", 3001))
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/content-blocker")

# Initialize FastAPI
app = FastAPI(
    title="MindShield Pro API",
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# MongoDB client
mongo_client: Optional[MongoClient] = None
db = None

# Track server start time
START_TIME = time.time()

# In-memory rate limiting
rate_limit_store = defaultdict(list)
RATE_LIMIT_WINDOW = 60  # 1 minute
RATE_LIMIT_MAX = 100  # 100 requests per minute


# ==================== PYDANTIC MODELS ====================

class Settings(BaseModel):
    model: str = "gpt-oss:120b-cloud"
    enabled: bool = True
    whitelist: List[str] = []
    showWarning: bool = True

    @validator('model')
    def validate_model(cls, v):
        if v:
            sanitized = sanitize_string(v, 100)
            if not re.match(r'^[a-zA-Z0-9][a-zA-Z0-9:.\-_]*$', sanitized):
                raise ValueError('Invalid model name')
            return sanitized
        return v

    @validator('whitelist')
    def validate_whitelist(cls, v):
        if v:
            return [sanitize_string(domain, 253) for domain in v if isinstance(domain, str)]
        return []


class SettingsUpdate(BaseModel):
    model: Optional[str] = None
    enabled: Optional[bool] = None
    whitelist: Optional[List[str]] = None
    showWarning: Optional[bool] = None

    @validator('model')
    def validate_model(cls, v):
        if v:
            sanitized = sanitize_string(v, 100)
            if not re.match(r'^[a-zA-Z0-9][a-zA-Z0-9:.\-_]*$', sanitized):
                raise ValueError('Invalid model name')
            return sanitized
        return v

    @validator('whitelist')
    def validate_whitelist(cls, v):
        if v:
            return [sanitize_string(domain, 253) for domain in v if isinstance(domain, str)]
        return v


class CacheEntry(BaseModel):
    url: str
    content: Optional[str] = ""
    result: str
    reason: Optional[str] = ""
    confidence: float = 0.5

    @validator('url')
    def validate_url(cls, v):
        if not is_valid_url(v):
            raise ValueError('Invalid URL')
        return v

    @validator('result')
    def validate_result(cls, v):
        if v not in ['allow', 'block']:
            raise ValueError('Result must be "allow" or "block"')
        return v

    @validator('content')
    def sanitize_content(cls, v):
        return sanitize_string(v, 500) if v else ""

    @validator('reason')
    def sanitize_reason(cls, v):
        return sanitize_string(v, 200) if v else ""

    @validator('confidence')
    def validate_confidence(cls, v):
        return max(0, min(1, float(v)))


class CacheResponse(BaseModel):
    hit: bool
    result: Optional[str] = None
    confidence: Optional[float] = None


class StatsResponse(BaseModel):
    total: int
    blocked: int
    allowed: int


class HealthResponse(BaseModel):
    status: str
    mongodb: bool
    uptime: float
    version: str

class WebContext(BaseModel):
    context: str
    modelName: str

class aiResponse(BaseModel):
    result: str
    
# ==================== UTILITY FUNCTIONS ====================

def is_valid_url(url: str) -> bool:
    """Validate URL format"""
    if not url or not isinstance(url, str) or len(url) > 2048:
        return False
    try:
        parsed = urlparse(url)
        return parsed.scheme in ['http', 'https']
    except Exception:
        return False


def sanitize_string(text: str, max_length: int = 500) -> str:
    """Sanitize string input"""
    if not text or not isinstance(text, str):
        return ""
    
    # Remove dangerous characters
    sanitized = text.replace('<', '').replace('>', '')
    sanitized = re.sub(r'javascript:', '', sanitized, flags=re.IGNORECASE)
    
    return sanitized.strip()[:max_length]


def check_rate_limit(client_ip: str) -> bool:
    """Check if client has exceeded rate limit"""
    now = current_time()
    
    # Clean old entries
    rate_limit_store[client_ip] = [
        req_time for req_time in rate_limit_store[client_ip]
        if now - req_time < RATE_LIMIT_WINDOW
    ]
    
    # Check limit
    if len(rate_limit_store[client_ip]) >= RATE_LIMIT_MAX:
        return False
    
    # Add current request
    rate_limit_store[client_ip].append(now)
    return True


# ==================== MIDDLEWARE ====================

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "chrome-extension://*",
        "http://localhost:*",
        "http://127.0.0.1:*"
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type"],
    max_age=86400
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add security headers and rate limiting"""
    # Rate limiting
    client_ip = request.client.host
    if not check_rate_limit(client_ip):
        return JSONResponse(
            status_code=429,
            content={"error": "Too many requests, please try again later"}
        )
    
    # Process request
    response = await call_next(request)
    
    # Add security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    return response


# ==================== DATABASE CONNECTION ====================

@app.on_event("startup")
async def startup_db_client():
    """Initialize MongoDB connection on startup"""
    global mongo_client, db
    try:
        mongo_client = MongoClient(
            MONGO_URI,
            serverSelectionTimeoutMS=5000,
            maxPoolSize=10
        )
        
        # Test connection
        mongo_client.admin.command('ping')
        print("✅ Connected to MongoDB")
        
        # Get database
        db = mongo_client.get_default_database()
        
        # Create indexes
        db.cache.create_index([("url", ASCENDING)], unique=True)
        db.cache.create_index([("expiresAt", ASCENDING)], expireAfterSeconds=0)
        
        # Create default settings if not exists
        if db.settings.count_documents({"_id": "default"}) == 0:
            db.settings.insert_one({
                "_id": "default",
                "model": "gpt-oss:120b-cloud",
                "enabled": True,
                "whitelist": [],
                "showWarning": True,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            })
            print("✅ Created default settings")
            
    except ConnectionFailure as e:
        print(f"❌ MongoDB connection error: {str(e)}")
        raise
    except Exception as e:
        print(f"❌ Unexpected error during startup: {str(e)}")
        raise


@app.on_event("shutdown")
async def shutdown_db_client():
    """Close MongoDB connection on shutdown"""
    global mongo_client
    if mongo_client:
        mongo_client.close()
        print("Closed MongoDB connection")


# ==================== SETTINGS ENDPOINTS ====================

@app.get("/api/settings", response_model=Settings)
async def get_settings(request: Request):
    """Retrieve settings"""
    try:
        settings_doc = db.settings.find_one({"_id": "default"})
        
        if not settings_doc:
            # Create default settings
            settings_doc = {
                "_id": "default",
                "model": "gpt-oss:120b-cloud",
                "enabled": True,
                "whitelist": [],
                "showWarning": True,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
            db.settings.insert_one(settings_doc)
        
        return Settings(
            model=settings_doc.get("model", "gpt-oss:120b-cloud"),
            enabled=settings_doc.get("enabled", True),
            whitelist=settings_doc.get("whitelist", []),
            showWarning=settings_doc.get("showWarning", True)
        )
    except PyMongoError as e:
        print(f"Database error fetching settings: {str(e)}")
        raise HTTPException(status_code=500, detail="Database error")
    except Exception as e:
        print(f"Error fetching settings: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/settings", response_model=Settings)
async def update_settings(request: Request, settings_update: SettingsUpdate):
    """Update settings"""
    try:
        update_data = {"updatedAt": datetime.utcnow()}
        
        if settings_update.model is not None:
            update_data["model"] = settings_update.model
        
        if settings_update.enabled is not None:
            update_data["enabled"] = settings_update.enabled
        
        if settings_update.whitelist is not None:
            update_data["whitelist"] = settings_update.whitelist
        
        if settings_update.showWarning is not None:
            update_data["showWarning"] = settings_update.showWarning
        
        result = db.settings.find_one_and_update(
            {"_id": "default"},
            {
                "$set": update_data,
                "$setOnInsert": {"createdAt": datetime.utcnow()}
            },
            upsert=True,
            return_document=True
        )
        
        return Settings(
            model=result.get("model", "gpt-oss:120b-cloud"),
            enabled=result.get("enabled", True),
            whitelist=result.get("whitelist", []),
            showWarning=result.get("showWarning", True)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PyMongoError as e:
        print(f"Database error updating settings: {str(e)}")
        raise HTTPException(status_code=500, detail="Database error")
    except Exception as e:
        print(f"Error updating settings: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==================== CACHE ENDPOINTS ====================

@app.get("/api/cache", response_model=CacheResponse)
async def check_cache(request: Request, url: str = Query(...)):
    """Check cache for URL"""
    try:
        if not is_valid_url(url):
            raise HTTPException(status_code=400, detail="Invalid URL")
        
        cached = db.cache.find_one({
            "url": url,
            "expiresAt": {"$gt": datetime.utcnow()}
        })
        
        if cached:
            return CacheResponse(
                hit=True,
                result=cached.get("result"),
                confidence=cached.get("confidence", 0.5)
            )
        else:
            return CacheResponse(hit=False)
            
    except HTTPException:
        raise
    except PyMongoError as e:
        print(f"Database error checking cache: {str(e)}")
        raise HTTPException(status_code=500, detail="Database error")
    except Exception as e:
        print(f"Error checking cache: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/cache")
async def save_to_cache(request: Request, cache_entry: CacheEntry):
    """Save to cache"""
    try:
        cache_data = {
            "url": cache_entry.url,
            "content": cache_entry.content,
            "result": cache_entry.result,
            "reason": cache_entry.reason,
            "confidence": cache_entry.confidence,
            "scannedAt": datetime.utcnow(),
            "expiresAt": datetime.utcnow() + timedelta(hours=1),
            "updatedAt": datetime.utcnow()
        }
        
        result = db.cache.find_one_and_update(
            {"url": cache_entry.url},
            {
                "$set": cache_data,
                "$setOnInsert": {"createdAt": datetime.utcnow()}
            },
            upsert=True,
            return_document=True
        )
        
        return JSONResponse(content={
            "url": result["url"],
            "result": result["result"],
            "confidence": result["confidence"]
        })
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="Cache entry already exists")
    except PyMongoError as e:
        print(f"Database error saving to cache: {str(e)}")
        raise HTTPException(status_code=500, detail="Database error")
    except Exception as e:
        print(f"Error saving to cache: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.delete("/api/cache")
async def clear_cache(request: Request):
    """Clear all cache"""
    try:
        result = db.cache.delete_many({})
        return JSONResponse(content={
            "success": True,
            "message": f"Cache cleared ({result.deleted_count} entries deleted)"
        })
    except PyMongoError as e:
        print(f"Database error clearing cache: {str(e)}")
        raise HTTPException(status_code=500, detail="Database error")
    except Exception as e:
        print(f"Error clearing cache: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/cache/stats", response_model=StatsResponse)
async def get_cache_stats(request: Request):
    """Get cache statistics"""
    try:
        total = db.cache.count_documents({})
        blocked = db.cache.count_documents({"result": "block"})
        allowed = db.cache.count_documents({"result": "allow"})
        
        return StatsResponse(total=total, blocked=blocked, allowed=allowed)
    except PyMongoError as e:
        print(f"Database error getting stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Database error")
    except Exception as e:
        print(f"Error getting stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/cache/all")
async def get_all_cache_entries(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100)
):
    """Get all cache entries (for charts)"""
    try:
        skip = (page - 1) * limit
        
        cursor = db.cache.find(
            {},
            {"url": 1, "result": 1, "scannedAt": 1, "confidence": 1, "_id": 0}
        ).sort("scannedAt", DESCENDING).skip(skip).limit(limit)
        
        entries = list(cursor)
        
        # Convert datetime to ISO format for JSON serialization
        for entry in entries:
            if "scannedAt" in entry:
                entry["scannedAt"] = entry["scannedAt"].isoformat()
        
        return JSONResponse(content=entries)
    except PyMongoError as e:
        print(f"Database error getting cache entries: {str(e)}")
        raise HTTPException(status_code=500, detail="Database error")
    except Exception as e:
        print(f"Error getting cache entries: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==================== HEALTH CHECK ====================

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    try:
        mongodb_connected = False
        if mongo_client:
            try:
                mongo_client.admin.command('ping')
                mongodb_connected = True
            except Exception:
                mongodb_connected = False
        
        uptime = time.time() - START_TIME
        
        return HealthResponse(
            status="ok",
            mongodb=mongodb_connected,
            uptime=round(uptime, 2),
            version="3.0.0"
        )
    except Exception as e:
        print(f"Error in health check: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

# ==================== Call Ollama =============

@app.get("/api/llmcall")
async def validateContent():
    """
    Call AI model and check content is valid or not
    """
    ...
# ==================== ERROR HANDLERS ====================

@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    """Handle 404 errors"""
    return JSONResponse(
        status_code=404,
        content={"error": "Endpoint not found"}
    )


@app.exception_handler(500)
async def internal_error_handler(request: Request, exc):
    """Handle 500 errors"""
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error"}
    )

# ==================== MAIN ====================

if __name__ == "__main__":
    
    print("🚀 MindShield Pro Server v3.0.0")
    print(f"   Running on http://localhost:{PORT}")
    print(f"   MongoDB: {MONGO_URI}")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=PORT,
        reload=False,
        log_level="info"
    )