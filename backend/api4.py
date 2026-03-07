import json
import os
import asyncio
from typing import List, Optional
from datetime import datetime
from fastapi import FastAPI, APIRouter, HTTPException, Header, Depends, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request as StarletteRequest
from pydantic import BaseModel
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, auth
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import DuplicateKeyError
import requests
import base64

# --- 1. CONFIGURATION ---
load_dotenv()

# Setup Cloudflare AI (for both text and image generation)
CLOUDFLARE_ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID")
CLOUDFLARE_API_TOKEN = os.getenv("CLOUDFLARE_API_TOKEN")

if CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN:
    print("✅ Cloudflare Workers AI credentials loaded")
    print(f"   Account ID: {CLOUDFLARE_ACCOUNT_ID[:10]}...")
else:
    print("⚠️ WARNING: Cloudflare credentials missing. Text and image generation will not work.")
    print("   Please set 'CLOUDFLARE_ACCOUNT_ID' and 'CLOUDFLARE_API_TOKEN' in your .env file")

# Setup MongoDB
import ssl
import certifi

# Setup MongoDB
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
import requests
from pymongo.errors import ServerSelectionTimeoutError

try:
    # Clean MongoDB Atlas connection - remove problematic SSL parameters
    if "mongodb.net" in MONGODB_URL or "mongodb+srv" in MONGODB_URL:
        # For Atlas, use a clean connection string without tlsAllowInvalidCertificates
        clean_url = MONGODB_URL.replace("&tlsAllowInvalidCertificates=true", "").replace("tlsAllowInvalidCertificates=true&", "").replace("?tlsAllowInvalidCertificates=true", "")
        
        # MongoDB Atlas connection with Windows-compatible SSL settings
        mongo_client = AsyncIOMotorClient(
            clean_url,
            serverSelectionTimeoutMS=5000,  # Reduced to 5s for faster startup check
            connectTimeoutMS=5000,
            socketTimeoutMS=5000,
            retryWrites=True,
            w='majority',
            tls=True,
            tlsCAFile=certifi.where(),
            tlsAllowInvalidCertificates=True,  # For development only
            tlsAllowInvalidHostnames=True,    # For development only
        )
    else:
        # Local MongoDB connection
        mongo_client = AsyncIOMotorClient(
            MONGODB_URL,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
            socketTimeoutMS=5000,
            retryWrites=True,
            w='majority'
        )
    
    db = mongo_client.mediamind_db
    print("✅ MongoDB client configured")
except Exception as e:
    print(f"⚠️ MongoDB configuration error: {e}")
    db = None
    mongo_client = None

# Collections - only initialize if db is available
if db is not None:
    users_collection = db.users
    history_collection = db.search_history
    image_history_collection = db.image_history
else:
    users_collection = None
    history_collection = None
    image_history_collection = None

# Setup Firebase
try:
    if not firebase_admin._apps:
        # Try to use environment variables first, fallback to serviceAccountKey.json
        service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "serviceAccountKey.json")
        
        if os.path.exists(service_account_path):
            cred = credentials.Certificate(service_account_path)
            firebase_admin.initialize_app(cred)
            print("✅ Firebase Admin Initialized from", service_account_path)
        else:
            # Try to use environment variables directly
            firebase_config = {
                "type": "service_account",
                "project_id": os.getenv("FIREBASE_PROJECT_ID"),
                "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
                "private_key": os.getenv("FIREBASE_PRIVATE_KEY", "").replace("\\n", "\n"),
                "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
                "client_id": os.getenv("FIREBASE_CLIENT_ID"),
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
            
            if all([firebase_config["project_id"], firebase_config["private_key"], firebase_config["client_email"]]):
                cred = credentials.Certificate(firebase_config)
                firebase_admin.initialize_app(cred)
                print("✅ Firebase Admin Initialized from environment variables")
            else:
                raise FileNotFoundError(f"Firebase service account file not found at {service_account_path} and environment variables not set")
except Exception as e:
    print(f"❌ Firebase setup failed: {e}")
    print("⚠️ Authentication will not work. Please check your Firebase configuration.")

# App Setup
app = FastAPI(title="MediaMind API")
router = APIRouter(prefix="/api/mediamind/v1", tags=["MediaMind AI"])

# CORS Configuration - Allow frontend origins
# Note: Must be added BEFORE including the router
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        # Allow Vercel Deployments
        "https://media-mind-ai.vercel.app",
        "https://mediamind-ai.vercel.app"
    ],
    # Since Vercel auto-generates preview URLs, a more robust option is regex:
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# --- 2. DATABASE MODELS ---
class UserProfile(BaseModel):
    uid: str
    email: str
    display_name: Optional[str] = None
    photo_url: Optional[str] = None
    created_at: datetime
    last_login: datetime
    preferences: dict = {}

class SearchHistoryEntry(BaseModel):
    uid: str
    role_name: str
    user_input: str
    result: str
    temperature: float
    top_p: float
    timestamp: datetime

class ImageGenerationInput(BaseModel):
    prompt: str
    role_name: Optional[str] = None
    model: str = "@cf/black-forest-labs/flux-2-dev"
    width: int = 1024
    height: int = 768
    steps: int = 25
    guidance: float = 7.5
    temperature: float = 0.7  # For prompt enhancement
    top_p: float = 0.9  # For prompt enhancement

class ImageGenerationOutput(BaseModel):
    image_base64: str
    prompt: str
    enhanced_prompt: str
    model: str
    timestamp: str

# --- 3. DEBUG HANDLER ---
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    error_details = exc.errors()
    print(f"\n❌ VALIDATION ERROR: {error_details}\n")
    return JSONResponse(status_code=422, content={"detail": error_details})

# --- 4. AUTHENTICATION & USER MANAGEMENT ---
async def verify_token(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid auth header")
    
    # Check if Firebase Admin is initialized
    if not firebase_admin._apps:
        print("❌ Firebase Admin not initialized - cannot verify tokens")
        raise HTTPException(status_code=500, detail="Authentication service not configured")
    
    try:
        token = authorization.split("Bearer ")[1]
        print(f"🔍 Verifying token (length: {len(token)})...")
        
        decoded_token = auth.verify_id_token(token)
        print(f"✅ Token verified successfully for user: {decoded_token.get('email', 'unknown')}")
        
        # Update or create user in MongoDB
        await update_user_profile(decoded_token)
        
        return decoded_token
    except ValueError as e:
        # Firebase Admin SDK raises ValueError for invalid/expired tokens
        error_msg = str(e).lower()
        if "expired" in error_msg:
            print(f"❌ Firebase Token Expired: {e}")
            raise HTTPException(status_code=401, detail="Token has expired")
        elif "revoked" in error_msg:
            print(f"❌ Firebase Token Revoked: {e}")
            raise HTTPException(status_code=401, detail="Token has been revoked")
        else:
            print(f"❌ Firebase Invalid Token: {e}")
            raise HTTPException(status_code=401, detail="Invalid token format")
    except Exception as e:
        print(f"❌ Auth Error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=401, detail=f"Invalid or Expired Token: {str(e)}")

async def update_user_profile(decoded_token: dict):
    """Create or update user profile in MongoDB"""
    if users_collection is None:
        print("⚠️ MongoDB not available, skipping user profile update")
        return
    
    uid = decoded_token.get("uid")
    email = decoded_token.get("email")
    
    existing_user = await users_collection.find_one({"uid": uid})
    
    if existing_user:
        # Update last login
        await users_collection.update_one(
            {"uid": uid},
            {"$set": {"last_login": datetime.utcnow()}}
        )
    else:
        # Create new user
        user_data = {
            "uid": uid,
            "email": email,
            "display_name": decoded_token.get("name"),
            "photo_url": decoded_token.get("picture"),
            "created_at": datetime.utcnow(),
            "last_login": datetime.utcnow(),
            "preferences": {}
        }
        await users_collection.insert_one(user_data)
        print(f"✅ New user created: {email}")

# --- 5. PROMPT ENHANCEMENT FUNCTION ---
def enhance_prompt_cloudflare(user_prompt: str, role_name: Optional[str] = None, temperature: float = 0.5, top_p: float = 0.9) -> str:
    """Enhance image generation prompt - Ultra-fast with smart fallback"""
    if not CLOUDFLARE_ACCOUNT_ID or not CLOUDFLARE_API_TOKEN:
        print("⚠️ Cloudflare credentials missing, using fallback")
        return fallback_enhance_prompt(user_prompt, role_name)
    
    # Get use-case specific instruction if available
    instruction = "Extract visual subject, add quality details like lighting and composition. Make it look professional. Do NOT include any text, words, or letters in the image prompt."
    enhancement_temp = 0.3
    enhancement_tokens = 40
    
    if ENHANCEMENT_DATA and role_name and role_name in ENHANCEMENT_DATA:
        use_case_conf = ENHANCEMENT_DATA[role_name]
        instruction = use_case_conf.get("instruction", instruction)
        enhancement_temp = use_case_conf.get("temperature", enhancement_temp)
        enhancement_tokens = use_case_conf.get("max_tokens", enhancement_tokens)
    elif ENHANCEMENT_DATA and "default" in ENHANCEMENT_DATA:
        use_case_conf = ENHANCEMENT_DATA["default"]
        instruction = use_case_conf.get("instruction", instruction)
        enhancement_temp = use_case_conf.get("temperature", enhancement_temp)
        enhancement_tokens = use_case_conf.get("max_tokens", enhancement_tokens)

    instruction += """\nExamples:
"swimming" → "Swimmer in pool, action shot, 8k"
"cricket" → "Cricket match, stadium, 8k"
"regression" → "Sigmoid curve graph, clean, 8k"
Return enhanced prompt only."""
    
    model = "@cf/meta/llama-3.1-8b-instruct"
    endpoint = f"https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/run/{model}"
    
    headers = {
        "Authorization": f"Bearer {CLOUDFLARE_API_TOKEN}",
        "Content-Type": "application/json"
    }
    
    # Allow up to 1000 characters for sequential flows
    truncated = user_prompt[:1000] if len(user_prompt) > 1000 else user_prompt
    
    payload = {
        "messages": [{"role": "user", "content": f"{instruction}\n\nText: {truncated}"}],
        "max_tokens": enhancement_tokens,
        "temperature": enhancement_temp,
    }
    
    try:
        # 8-second timeout for longer contexts
        response = requests.post(endpoint, headers=headers, json=payload, timeout=8)
        response.raise_for_status()
        
        enhanced = response.json()['result']['response'].strip()
        
        # Quick validation
        if enhanced and len(enhanced) > 10 and enhanced.lower() != user_prompt.lower()[:len(enhanced)]:
            print(f"✅ API enhanced in <3s")
            return enhanced
        
        print(f"⚠️ API response invalid, using fallback")
        return fallback_enhance_prompt(user_prompt, role_name)
        
    except requests.exceptions.Timeout:
        print(f"⚠️ API timeout (>3s), using fallback")
        return fallback_enhance_prompt(user_prompt, role_name)
    except Exception as e:
        print(f"⚠️ API error, using fallback: {str(e)[:30]}")
        return fallback_enhance_prompt(user_prompt, role_name)


def fallback_enhance_prompt(user_prompt: str, role_name: Optional[str] = None) -> str:
    """Fast local enhancement when API fails - Smart keyword extraction"""
    import re
    
    prompt_lower = user_prompt.lower()
    
    # STEP 1: Remove non-visual trigger words that confuse the model
    non_visual_words = ['email', 'write', 'explain', 'describe', 'tell', 'about', 'post', 'article', 'blog', 'letter', 'message']
    for word in non_visual_words:
        prompt_lower = re.sub(rf'\b{word}\b', '', prompt_lower)
    
    # STEP 2: Define visual subject mappings (NO TEXT in images)
    subject_map = {
        # Sports (most specific first)
        'swimming competition': 'Olympic swimmer at finish line touching wall, water splashing, indoor aquatic center, victory moment, action sports photography, dramatic lighting, 8k, no text',
        'swimming': 'Professional swimmer mid-stroke in Olympic pool, water splashing dramatically, underwater view, action sports photography, motion freeze, dramatic lighting, 8k detail, no text',
        'cricket world cup': 'Cricket team celebrating with trophy on field, stadium packed with crowd, confetti falling, professional sports photography, golden hour lighting, 8k, no text',
        'cricket': 'Cricket batsman hitting powerful shot in stadium, ball in motion, crowd in background, professional sports photography, action shot, golden hour lighting, 8k, no text',
        'football': 'Football player kicking ball in stadium, dynamic action, professional sports photography, motion capture, dramatic lighting, 8k detail, no text',
        'running race': 'Athletes sprinting at finish line, photo finish moment, Olympic stadium, sports photography, dramatic lighting, 8k, no text',
        'running': 'Athletic sprinter in full stride on track, Olympic stadium, sports photography, motion blur background, dramatic lighting, 8k, no text',
        '100m race': 'Sprinters exploding from starting blocks, Olympic track, action sports photography, dramatic lighting, 8k, no text',
        '200m': 'Athletes racing around curve of track, Olympic stadium, sports photography, dynamic action, 8k, no text',
        'race': 'Athletes competing at finish line, victory moment, sports photography, dynamic action, dramatic lighting, 8k, no text',
        'gold medal': 'Athlete on podium with gold medal raised high, celebration moment, Olympic ceremony, professional photography, dramatic lighting, 8k, no text',
        'nationals': 'Championship podium ceremony with athletes, medals being awarded, professional sports photography, dramatic lighting, 8k, no text',
        
        # Technical/Data Science  
        'logistic regression': 'Clean sigmoid curve visualization on dark background, glowing blue S-curve line, scattered data points, mathematical graph, minimalist design, professional data visualization, no text or labels',
        'regression': 'Mathematical graph with smooth curve fitting through data points, clean visualization, professional design, dark background, glowing blue elements, no text',
        'machine learning': 'Abstract neural network with glowing nodes and connections, futuristic digital art, blue and purple colors, 8k, no text',
        'algorithm': 'Abstract flowchart with glowing connections, futuristic tech visualization, clean design, professional aesthetic, no text',
        'data science': 'Abstract data visualization with flowing particles forming patterns, futuristic aesthetic, blue and purple tones, 8k, no text',
        'neural network': 'Glowing neural network structure with interconnected nodes, futuristic digital art, blue lighting, 8k, no text',
        'decision tree': 'Abstract tree diagram with glowing branches and nodes, data visualization, clean design, dark background, no text',
        
        # Business/Office
        'internship': 'Modern tech office with glass walls, young professional at desk with laptop, natural lighting, corporate environment, architectural photography, 8k, no text',
        'infosys': 'Modern corporate tech office building, glass architecture, professional photography, blue hour lighting, 8k, no text',
        'springboard': 'Modern collaborative workspace with people working together, natural lighting, professional environment, 8k, no text',
        'office': 'Contemporary open office space, modern furniture, natural lighting, professional photography, clean aesthetic, 8k, no text',
        'meeting': 'Professional business meeting in modern conference room, natural lighting, corporate photography, 8k, no text',
        'workplace': 'Modern collaborative workspace, natural lighting, professional environment, architectural photography, 8k, no text',
        
        # Technology
        'coding': 'Developer workspace with glowing monitors, ambient lighting, professional setup, 8k, no readable text',
        'programming': 'Abstract code visualization with glowing syntax, dark background, futuristic aesthetic, 8k, no readable text',
        'software': 'Modern software interface visualization, clean UI design, professional aesthetic, 8k, no text',
        'ai': 'Futuristic AI visualization with glowing elements, digital art, blue and purple tones, 8k, no text',
        'technology': 'Abstract tech visualization with circuits and connections, futuristic design, 8k, no text',
        
        # Education
        'learning': 'Modern classroom with natural lighting, educational environment, professional photography, 8k, no text',
        'teaching': 'Interactive learning space, modern educational setting, bright lighting, professional photography, 8k, no text',
        'education': 'Contemporary learning environment, natural lighting, professional photography, 8k, no text',
        
        # Nature/Environment
        'climate': 'Dramatic glacier landscape, environmental photography, cinematic lighting, 8k detail, no text',
        'nature': 'Lush forest landscape, vibrant ecosystem, nature photography, golden hour lighting, 8k, no text',
        'forest': 'Dense forest with sunlight filtering through canopy, nature photography, dramatic lighting, 8k, no text',
        'environment': 'Natural landscape with dramatic sky, environmental photography, cinematic composition, 8k, no text',
    }
    
    # STEP 3: Find ALL matching keywords and prioritize by specificity
    matches = []
    for keyword, enhancement in subject_map.items():
        if keyword in prompt_lower:
            # Score by keyword length (longer = more specific) and position (earlier = more important)
            position = prompt_lower.find(keyword)
            specificity_score = len(keyword) * 100 - position  # Longer keywords and earlier position score higher
            matches.append((specificity_score, keyword, enhancement))
    
    if matches:
        # Use highest scoring match (most specific and earliest)
        matches.sort(reverse=True)
        keyword = matches[0][1]
        enhancement = matches[0][2]
        print(f"✅ Fallback: matched '{keyword}' from prompt")
        return enhancement
    
    # STEP 4: Extract nouns as last resort
    words = prompt_lower.split()
    # Filter out common non-visual words
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their'}
    meaningful_words = [w for w in words if w not in stop_words and len(w) > 3]
    
    if meaningful_words:
        # Use first few meaningful words as subject
        subject = ' '.join(meaningful_words[:3])
        print(f"✅ Fallback: extracted subject '{subject}'")
        return f"Professional visualization of {subject}, clean aesthetic, dramatic lighting, high detail, 8k quality, cinematic composition, no text or labels"
    
    # Use-case specific fallback
    if ENHANCEMENT_DATA and role_name and role_name in ENHANCEMENT_DATA:
        fallback_subject = ENHANCEMENT_DATA[role_name].get("fallback_subject")
        if fallback_subject:
            print(f"✅ Using use-case fallback for '{role_name}'")
            return fallback_subject

    if ENHANCEMENT_DATA and "default" in ENHANCEMENT_DATA:
         fallback_subject = ENHANCEMENT_DATA["default"].get("fallback_subject")
         if fallback_subject:
             return fallback_subject

    # Generic fallback
    print(f"✅ Using generic fallback")
    return f"Professional visualization, clean aesthetic, dramatic lighting, high detail, 8k quality, cinematic composition, no text or labels"

# --- 6. CLOUDFLARE TEXT GENERATION ---
def generate_text_cloudflare(system_instruction: str, user_input: str, 
                             temperature: float = 0.7, top_p: float = 0.9,
                             model: str = "@cf/meta/llama-3.1-8b-instruct",
                             max_tokens: int = 4096) -> str:
    """Generate text content using Cloudflare Workers AI - Optimized"""
    if not CLOUDFLARE_ACCOUNT_ID or not CLOUDFLARE_API_TOKEN:
        raise HTTPException(500, "Cloudflare credentials not configured")
    
    endpoint = f"https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/run/{model}"
    
    headers = {
        "Authorization": f"Bearer {CLOUDFLARE_API_TOKEN}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "messages": [
            {
                "role": "system",
                "content": system_instruction
            },
            {
                "role": "user",
                "content": user_input
            }
        ],
        "temperature": temperature,
        "top_p": top_p,
        "max_tokens": max_tokens
    }
    
    try:
        print(f"🔄 Calling Cloudflare Workers AI: {model} (max_tokens: {max_tokens})")
        # Optimized timeout: 60s for normal, 120s for long content
        timeout = 120 if max_tokens > 2000 else 60
        response = requests.post(endpoint, headers=headers, json=payload, timeout=timeout)
        response.raise_for_status()
        
        data = response.json()
        result_text = data['result']['response'].strip()
        print(f"✅ Text generated successfully (length: {len(result_text)})")
        return result_text
        
    except requests.exceptions.HTTPError as e:
        error_msg = f"Cloudflare API error: {e}"
        if e.response is not None:
            try:
                error_data = e.response.json()
                error_msg = f"Cloudflare API error: {error_data}"
            except:
                error_msg = f"Cloudflare API error: {e.response.text}"
        print(f"❌ {error_msg}")
        raise HTTPException(500, detail=error_msg)
    except Exception as e:
        error_msg = f"Cloudflare API error: {str(e)}"
        print(f"❌ {error_msg}")
        raise HTTPException(500, detail=error_msg)

# --- 7. CLOUDFLARE IMAGE GENERATION ---
def generate_image_cloudflare(prompt: str, model: str, width: int, height: int, 
                              steps: int, guidance: float) -> str:
    """Generate image using Cloudflare Workers AI"""
    if not CLOUDFLARE_ACCOUNT_ID or not CLOUDFLARE_API_TOKEN:
        raise HTTPException(500, "Cloudflare credentials not configured")
    
    endpoint = f"https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/run/{model}"
    
    # Prepare multipart form data (required by Cloudflare Workers AI for image generation)
    files = {
        'prompt': (None, prompt),
    }
    
    # Add model-specific parameters with validation
    if model == "@cf/black-forest-labs/flux-2-dev":
        # Flux-2-dev parameters
        files['width'] = (None, str(width))
        files['height'] = (None, str(height))
        files['steps'] = (None, str(min(steps, 25)))  # Max 25 steps
        files['guidance'] = (None, str(guidance))
    elif model == "@cf/black-forest-labs/flux-1-schnell":
        # Flux-1-schnell parameters (faster, fixed 4 steps)
        files['width'] = (None, str(width))
        files['height'] = (None, str(height))
        files['num_steps'] = (None, str(4))  # Fixed for schnell
    else:
        # Default parameters
        files['width'] = (None, str(width))
        files['height'] = (None, str(height))
    
    headers = {
        "Authorization": f"Bearer {CLOUDFLARE_API_TOKEN}"
        # Don't set Content-Type - requests will set it automatically for multipart
    }
    
    try:
        print(f"🔵 Calling Cloudflare: {model}")
        print(f"📝 Prompt: {prompt[:100]}...")
        print(f"📐 Parameters: width={width}, height={height}, steps={steps}, guidance={guidance}")
        
        response = requests.post(endpoint, headers=headers, files=files, timeout=120)
        
        print(f"📡 Response Status: {response.status_code}")
        
        # Log error details before raising
        if response.status_code != 200:
            print(f"❌ Error Response: {response.text}")
            try:
                error_data = response.json()
                if "errors" in error_data and len(error_data["errors"]) > 0:
                    err_msg = error_data["errors"][0].get("message", "")
                    err_code = error_data["errors"][0].get("code")
                    if err_code == 3030 or "flagged" in err_msg.lower():
                        raise HTTPException(400, "Image generation flagged by AI safety filters. Please try a different prompt.")
            except ValueError:
                pass
        
        response.raise_for_status()
        
        result = response.json()
        
        # Extract base64 image
        if 'result' in result and 'image' in result['result']:
            image_base64 = result['result']['image']
            print(f"✅ Image generated successfully (base64 length: {len(image_base64)})")
            return image_base64
        else:
            print(f"⚠️ Unexpected response format: {result}")
            raise HTTPException(500, f"Unexpected response format: {list(result.keys())}")
            
    except requests.exceptions.RequestException as e:
        error_msg = f"Image generation failed: {str(e)}"
        print(f"❌ Cloudflare API Error: {error_msg}")
        if hasattr(e, 'response') and e.response is not None:
            error_detail = e.response.text
            print(f"📄 Error Details: {error_detail}")
            # Include error details in exception
            raise HTTPException(500, f"{error_msg} - Details: {error_detail[:200]}")
        raise HTTPException(500, error_msg)

# --- 7. DATA LOADING ---
def load_prompts():
    try:
        with open('mediamind.json', 'r') as f: 
            data = json.load(f)
            print("✅ mediamind.json loaded successfully")
            return data
    except Exception as e:
        print(f"❌ Error loading mediamind.json: {e}")
        return None

DATA = load_prompts()

def load_prompt_enhancements():
    try:
        with open('prompt_enhancement.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
            print("✅ prompt_enhancement.json loaded successfully")
            return data.get("use_cases", {})
    except Exception as e:
        print(f"❌ Error loading prompt_enhancement.json: {e}")
        return None

ENHANCEMENT_DATA = load_prompt_enhancements()

class RoleInfo(BaseModel):
    name: str
    engine: str
    description: str
    ui_placeholder: str

class GenerationInput(BaseModel):
    role_name: str
    user_input: str
    temperature: float = 0.7
    top_p: float = 0.9

class GenerationOutput(BaseModel):
    role: str
    result: str

class UserPreferences(BaseModel):
    default_temperature: Optional[float] = None
    default_top_p: Optional[float] = None
    favorite_roles: Optional[List[str]] = None
    username: Optional[str] = None

# --- 8. ENDPOINTS ---

@router.get("/roles", response_model=List[RoleInfo])
def get_roles():
    if not DATA: raise HTTPException(500, "Config missing")
    return [RoleInfo(name=r["name"], engine=r["engine"], description=r["description"], ui_placeholder=r["ui_placeholder"]) for r in DATA["mediamind_use_cases"]]

@router.post("/generate", response_model=GenerationOutput)
async def generate_content(payload: GenerationInput, user: dict = Depends(verify_token)):
    if not DATA: raise HTTPException(500, "Data not loaded")
    
    # 1. Find Role & System Prompt
    role_data = next((r for r in DATA["mediamind_use_cases"] if r["name"] == payload.role_name), None)
    
    if not role_data: 
        raise HTTPException(404, f"Role '{payload.role_name}' not found")

    system_instruction = role_data["system_prompt"]
    print(f"🤖 Cloudflare Workers AI Role: {payload.role_name}")

    # Check if Cloudflare credentials are available
    if not CLOUDFLARE_ACCOUNT_ID or not CLOUDFLARE_API_TOKEN:
        error_msg = "Cloudflare credentials are missing. Please set 'CLOUDFLARE_ACCOUNT_ID' and 'CLOUDFLARE_API_TOKEN' in your .env file."
        print(f"❌ {error_msg}")
        raise HTTPException(500, detail=error_msg)

    try:
        # 2. Call Cloudflare Workers AI for text generation
        # Using Llama 3.1 8B Instruct (free tier) - can be changed to @cf/meta/llama-3-70b-instruct for better quality
        # Set max_tokens to 4096 for longer blog content (default is usually 512-1024)
        # Run in thread pool to avoid blocking the async event loop
        result_text = await asyncio.to_thread(
            generate_text_cloudflare,
            system_instruction=system_instruction,
            user_input=payload.user_input,
            temperature=payload.temperature,
            top_p=payload.top_p,
            model="@cf/meta/llama-3.1-8b-instruct",
            max_tokens=4096
        )
        
        # 4. Save to search history
        if history_collection is not None:
            history_entry = {
                "uid": user["uid"],
                "role_name": payload.role_name,
                "user_input": payload.user_input,
                "result": result_text,
                "temperature": payload.temperature,
                "top_p": payload.top_p,
                "timestamp": datetime.utcnow()
            }
            await history_collection.insert_one(history_entry)
        
        return {"role": payload.role_name, "result": result_text}

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        error_str = str(e)
        print(f"❌ Cloudflare Workers AI Error: {error_str}")
        
        # Provide more helpful error messages
        if "401" in error_str or "Unauthorized" in error_str:
            error_msg = "Cloudflare API token is invalid. Please check your 'CLOUDFLARE_API_TOKEN' in your .env file."
        elif "403" in error_str or "Forbidden" in error_str:
            error_msg = "Cloudflare API access denied. Please check your 'CLOUDFLARE_ACCOUNT_ID' and 'CLOUDFLARE_API_TOKEN'."
        elif "429" in error_str or "rate limit" in error_str.lower():
            error_msg = "Cloudflare rate limit exceeded. Please try again later."
        else:
            error_msg = f"Cloudflare Workers AI error: {error_str}"
        
        raise HTTPException(500, detail=error_msg)

@router.post("/generate-image", response_model=ImageGenerationOutput)
async def generate_image(payload: ImageGenerationInput, user: dict = Depends(verify_token)):
    """Generate image using Cloudflare Workers AI with optimized prompt enhancement"""
    try:
        print(f"🎨 Generating image for user: {user['uid']}")
        print(f"📝 Original Prompt: {payload.prompt[:100]}...")
        print(f"⚙️ Settings: temp={payload.temperature}, top_p={payload.top_p}")
        
        # Run prompt enhancement in thread pool to avoid blocking async event loop
        enhanced_prompt = await asyncio.to_thread(
            enhance_prompt_cloudflare,
            payload.prompt, 
            role_name=payload.role_name,
            temperature=payload.temperature,
            top_p=payload.top_p
        )
        print(f"✨ Enhanced Prompt: {enhanced_prompt[:100]}...")
        
        # Generate image in thread pool (non-blocking)
        image_base64 = await asyncio.to_thread(
            generate_image_cloudflare,
            prompt=enhanced_prompt,
            model=payload.model,
            width=payload.width,
            height=payload.height,
            steps=payload.steps,
            guidance=payload.guidance
        )
        
        # Save to image history
        if image_history_collection is not None:
            image_entry = {
                "uid": user["uid"],
                "original_prompt": payload.prompt,
                "enhanced_prompt": enhanced_prompt,
                "model": payload.model,
                "width": payload.width,
                "height": payload.height,
                "temperature": payload.temperature,
                "top_p": payload.top_p,
                "image_base64": image_base64,
                "timestamp": datetime.utcnow()
            }
            await image_history_collection.insert_one(image_entry)
        
        return {
            "image_base64": image_base64,
            "prompt": payload.prompt,
            "enhanced_prompt": enhanced_prompt,
            "model": payload.model,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        print(f"Image Generation Error: {e}")
        raise HTTPException(500, detail=str(e))

@router.get("/image-history")
async def get_image_history(limit: int = 20, user: dict = Depends(verify_token)):
    """Get user's image generation history"""
    if image_history_collection is None:
        raise HTTPException(500, "MongoDB not available")
    try:
        history = await image_history_collection.find(
            {"uid": user["uid"]}
        ).sort("timestamp", -1).limit(limit).to_list(length=limit)
        
        # Convert ObjectId to string
        for item in history:
            item["_id"] = str(item["_id"])
            item["timestamp"] = item["timestamp"].isoformat()
            # Don't send full base64 in list view
            item["image_base64"] = item["image_base64"][:50] + "..."
        
        return {"history": history}
    except Exception as e:
        print(f"Image History Error: {e}")
        raise HTTPException(500, detail=str(e))

@router.get("/history")
async def get_history(limit: int = 50, user: dict = Depends(verify_token)):
    """Get user's search history"""
    if history_collection is None:
        raise HTTPException(500, "MongoDB not available")
    try:
        history = await history_collection.find(
            {"uid": user["uid"]}
        ).sort("timestamp", -1).limit(limit).to_list(length=limit)
        
        # Convert ObjectId to string for JSON serialization
        for item in history:
            item["_id"] = str(item["_id"])
            item["timestamp"] = item["timestamp"].isoformat()
        
        return {"history": history}
    except Exception as e:
        print(f"History Error: {e}")
        raise HTTPException(500, detail=str(e))

@router.delete("/history/{history_id}")
async def delete_history_item(history_id: str, user: dict = Depends(verify_token)):
    """Delete a specific history item"""
    if history_collection is None:
        raise HTTPException(500, "MongoDB not available")
    from bson import ObjectId
    try:
        result = await history_collection.delete_one({
            "_id": ObjectId(history_id),
            "uid": user["uid"]
        })
        
        if result.deleted_count == 0:
            raise HTTPException(404, "History item not found")
        
        return {"message": "History item deleted"}
    except Exception as e:
        print(f"Delete Error: {e}")
        raise HTTPException(500, detail=str(e))

@router.delete("/history")
async def clear_history(user: dict = Depends(verify_token)):
    """Clear all user history"""
    if history_collection is None:
        raise HTTPException(500, "MongoDB not available")
    try:
        result = await history_collection.delete_many({"uid": user["uid"]})
        return {"message": f"Deleted {result.deleted_count} history items"}
    except Exception as e:
        print(f"Clear History Error: {e}")
        raise HTTPException(500, detail=str(e))

@router.get("/profile")
async def get_profile(user: dict = Depends(verify_token)):
    """Get user profile"""
    if users_collection is None:
        raise HTTPException(500, "MongoDB not available")
    try:
        profile = await users_collection.find_one({"uid": user["uid"]})
        if profile:
            profile["_id"] = str(profile["_id"])
            profile["created_at"] = profile["created_at"].isoformat()
            profile["last_login"] = profile["last_login"].isoformat()
        return profile
    except Exception as e:
        print(f"Profile Error: {e}")
        raise HTTPException(500, detail=str(e))

@router.put("/profile/preferences")
async def update_preferences(preferences: UserPreferences, user: dict = Depends(verify_token)):
    """Update user preferences"""
    if users_collection is None:
        raise HTTPException(500, "MongoDB not available")
    try:
        prefs_dict = preferences.model_dump(exclude_unset=True)
        
        await users_collection.update_one(
            {"uid": user["uid"]},
            {"$set": {"preferences": prefs_dict}}
        )
        
        return {"message": "Preferences updated", "preferences": prefs_dict}
    except Exception as e:
        print(f"Preferences Error: {e}")
        raise HTTPException(500, detail=str(e))

@router.get("/stats")
async def get_user_stats(user: dict = Depends(verify_token)):
    """Get user statistics"""
    if history_collection is None or image_history_collection is None:
        raise HTTPException(500, "MongoDB not available")
    try:
        total_searches = await history_collection.count_documents({"uid": user["uid"]})
        total_images = await image_history_collection.count_documents({"uid": user["uid"]})
        
        # Get most used roles
        pipeline = [
            {"$match": {"uid": user["uid"]}},
            {"$group": {"_id": "$role_name", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 5}
        ]
        most_used_roles = await history_collection.aggregate(pipeline).to_list(length=5)
        
        return {
            "total_searches": total_searches,
            "total_images": total_images,
            "most_used_roles": most_used_roles
        }
    except Exception as e:
        print(f"Stats Error: {e}")
        raise HTTPException(500, detail=str(e))

# --- 9. STARTUP & SHUTDOWN ---
@app.on_event("startup")
async def startup_db():
    """Create indexes and test connection on startup"""
    global db, users_collection, history_collection, image_history_collection, mongo_client
    
    if db is None:
        print("⚠️ MongoDB not available (initialization failed), skipping startup checks")
        return
        
    try:
        # Test connection explicitly
        print("🔄 Testing MongoDB connection...")
        await db.command("ping")
        print("✅ MongoDB connection confirmed")
        
        # Create indexes for better query performance
        if users_collection is not None:
            await users_collection.create_index("uid", unique=True)
            await users_collection.create_index("email")
        if history_collection is not None:
            await history_collection.create_index([("uid", 1), ("timestamp", -1)])
        if image_history_collection is not None:
            await image_history_collection.create_index([("uid", 1), ("timestamp", -1)])
        print("✅ MongoDB indexes created")
        
    except ServerSelectionTimeoutError as e:
        error_str = str(e)
        print(f"\n❌ MongoDB Connection Failed: {error_str[:100]}...")
        
        # Check for SSL/IP whitelist issues
        if "SSL" in error_str and "alert internal error" in error_str:
            print("\n" + "="*60)
            print("🔴 CRITICAL ERROR: MongoDB Atlas IP Whitelist Issue")
            print("="*60)
            try:
                ip = requests.get('https://api.ipify.org', timeout=5).text.strip()
                print(f"🌍 YOUR PUBLIC IP: {ip}")
            except:
                print("🌍 YOUR PUBLIC IP: [Could not determine]")
                ip = "YOUR_IP_ADDRESS"
            
            print(f"\n⚠️  ACTION REQUIRED: You must whitelist this IP in MongoDB Atlas.")
            print(f"1. Go to MongoDB Atlas Dashboard")
            print(f"2. Navigate to 'Network Access' tab")
            print(f"3. Click 'Add IP Address'")
            print(f"4. Add Current IP Address: {ip}")
            print("="*60 + "\n")
        
        # Disable DB to prevent 500 errors in app
        print("⚠️  Disabling MongoDB features to allow app startup...")
        db = None
        users_collection = None
        history_collection = None
        image_history_collection = None
        if mongo_client:
            mongo_client.close()
            mongo_client = None

    except Exception as e:
        print(f"⚠️ MongoDB startup error: {e}")
        # Don't disable DB for other errors, might be transient

@app.on_event("shutdown")
async def shutdown_db():
    """Close MongoDB connection on shutdown"""
    if mongo_client:
        mongo_client.close()
        print("MongoDB connection closed")

# Add explicit OPTIONS handler for CORS preflight
@app.options("/{full_path:path}")
async def options_handler(full_path: str, request: StarletteRequest):
    origin = request.headers.get("origin")
    response = JSONResponse(content={"message": "OK"})
    if origin and origin in [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ]:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

# Add CORS headers to all responses
@app.middleware("http")
async def add_cors_header(request: StarletteRequest, call_next):
    origin = request.headers.get("origin")
    response = await call_next(request)
    
    # Add CORS headers if origin matches
    if origin and origin in [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ]:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "*"
    
    return response

app.include_router(router)

# --- 10. RUN SERVER ---
if __name__ == "__main__":
    import uvicorn
    # Use host="0.0.0.0" to allow access from other devices on your network
    # Use host="127.0.0.1" for localhost only
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)
