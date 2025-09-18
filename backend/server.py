from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from enum import Enum
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="RevisionPro API", version="1.0.0")
api_router = APIRouter(prefix="/api")

# Enums
class DifficultyLevel(str, Enum):
    EASY = "Easy"
    MODERATE = "Moderate" 
    HARD = "Hard"

class PerformanceStatus(str, Enum):
    NOT_STARTED = "Not Started"
    STRUGGLED = "Struggled"
    MASTERED = "Mastered"

class RevisionPerformance(str, Enum):
    STRUGGLED = "Struggled"
    MASTERED = "Mastered"

# Models
class Subject(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SubjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""

class Topic(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    subject_id: str
    name: str
    description: Optional[str] = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TopicCreate(BaseModel):
    subject_id: str
    name: str
    description: Optional[str] = ""

class Subtopic(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    topic_id: str
    name: str
    description: Optional[str] = ""
    difficulty: DifficultyLevel = DifficultyLevel.MODERATE
    performance_status: PerformanceStatus = PerformanceStatus.NOT_STARTED
    last_revised: Optional[datetime] = None
    revision_count: int = 0
    notes: Optional[str] = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SubtopicCreate(BaseModel):
    topic_id: str
    name: str
    description: Optional[str] = ""
    difficulty: DifficultyLevel = DifficultyLevel.MODERATE

class SubtopicUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[DifficultyLevel] = None
    notes: Optional[str] = None

class RevisionHistory(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    subtopic_id: str
    performance: RevisionPerformance
    notes: Optional[str] = ""
    revised_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RevisionCreate(BaseModel):
    subtopic_id: str
    performance: RevisionPerformance
    notes: Optional[str] = ""

class DashboardStats(BaseModel):
    total_subjects: int
    total_topics: int
    total_subtopics: int
    overdue_count: int
    mastered_count: int
    struggled_count: int
    not_started_count: int

class AIRecommendation(BaseModel):
    subtopic_id: str
    subtopic_name: str
    topic_name: str
    subject_name: str
    priority_score: float
    reason: str
    days_since_revision: Optional[int]

# Helper functions
def prepare_for_mongo(data):
    """Prepare data for MongoDB storage"""
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
    return data

def parse_from_mongo(item):
    """Parse data from MongoDB"""
    if isinstance(item, dict):
        for key, value in item.items():
            if key.endswith('_at') or key.endswith('revised') and isinstance(value, str):
                try:
                    item[key] = datetime.fromisoformat(value.replace('Z', '+00:00'))
                except:
                    pass
    return item

# Subject endpoints
@api_router.post("/subjects", response_model=Subject)
async def create_subject(subject: SubjectCreate):
    subject_obj = Subject(**subject.dict())
    subject_dict = prepare_for_mongo(subject_obj.dict())
    await db.subjects.insert_one(subject_dict)
    return subject_obj

@api_router.get("/subjects", response_model=List[Subject])
async def get_subjects():
    subjects = await db.subjects.find().to_list(1000)
    return [Subject(**parse_from_mongo(subject)) for subject in subjects]

@api_router.delete("/subjects/{subject_id}")
async def delete_subject(subject_id: str):
    # Also delete related topics and subtopics
    await db.subtopics.delete_many({"topic_id": {"$in": [topic["id"] for topic in await db.topics.find({"subject_id": subject_id}).to_list(1000)]}})
    await db.topics.delete_many({"subject_id": subject_id})
    result = await db.subjects.delete_one({"id": subject_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Subject not found")
    return {"message": "Subject deleted successfully"}

# Topic endpoints
@api_router.post("/topics", response_model=Topic)
async def create_topic(topic: TopicCreate):
    # Verify subject exists
    subject = await db.subjects.find_one({"id": topic.subject_id})
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    topic_obj = Topic(**topic.dict())
    topic_dict = prepare_for_mongo(topic_obj.dict())
    await db.topics.insert_one(topic_dict)
    return topic_obj

@api_router.get("/topics", response_model=List[Topic])
async def get_topics(subject_id: Optional[str] = None):
    query = {"subject_id": subject_id} if subject_id else {}
    topics = await db.topics.find(query).to_list(1000)
    return [Topic(**parse_from_mongo(topic)) for topic in topics]

@api_router.delete("/topics/{topic_id}")
async def delete_topic(topic_id: str):
    # Also delete related subtopics
    await db.subtopics.delete_many({"topic_id": topic_id})
    result = await db.topics.delete_one({"id": topic_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Topic not found")
    return {"message": "Topic deleted successfully"}

# Subtopic endpoints
@api_router.post("/subtopics", response_model=Subtopic)
async def create_subtopic(subtopic: SubtopicCreate):
    # Verify topic exists
    topic = await db.topics.find_one({"id": subtopic.topic_id})
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    subtopic_obj = Subtopic(**subtopic.dict())
    subtopic_dict = prepare_for_mongo(subtopic_obj.dict())
    await db.subtopics.insert_one(subtopic_dict)
    return subtopic_obj

@api_router.get("/subtopics", response_model=List[Subtopic])
async def get_subtopics(topic_id: Optional[str] = None):
    query = {"topic_id": topic_id} if topic_id else {}
    subtopics = await db.subtopics.find(query).to_list(1000)
    return [Subtopic(**parse_from_mongo(subtopic)) for subtopic in subtopics]

@api_router.put("/subtopics/{subtopic_id}", response_model=Subtopic)
async def update_subtopic(subtopic_id: str, update: SubtopicUpdate):
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.subtopics.update_one(
        {"id": subtopic_id}, 
        {"$set": prepare_for_mongo(update_data)}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Subtopic not found")
    
    updated_subtopic = await db.subtopics.find_one({"id": subtopic_id})
    return Subtopic(**parse_from_mongo(updated_subtopic))

@api_router.delete("/subtopics/{subtopic_id}")
async def delete_subtopic(subtopic_id: str):
    result = await db.subtopics.delete_one({"id": subtopic_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Subtopic not found")
    return {"message": "Subtopic deleted successfully"}

# Revision endpoints
@api_router.post("/revisions", response_model=RevisionHistory)
async def create_revision(revision: RevisionCreate):
    # Verify subtopic exists
    subtopic = await db.subtopics.find_one({"id": revision.subtopic_id})
    if not subtopic:
        raise HTTPException(status_code=404, detail="Subtopic not found")
    
    # Create revision history
    revision_obj = RevisionHistory(**revision.dict())
    revision_dict = prepare_for_mongo(revision_obj.dict())
    await db.revision_history.insert_one(revision_dict)
    
    # Update subtopic
    now = datetime.now(timezone.utc)
    update_data = {
        "last_revised": now.isoformat(),
        "revision_count": subtopic.get("revision_count", 0) + 1,
        "performance_status": revision.performance.value
    }
    await db.subtopics.update_one(
        {"id": revision.subtopic_id},
        {"$set": update_data}
    )
    
    return revision_obj

@api_router.get("/revisions/{subtopic_id}", response_model=List[RevisionHistory])
async def get_revision_history(subtopic_id: str):
    revisions = await db.revision_history.find({"subtopic_id": subtopic_id}).to_list(1000)
    return [RevisionHistory(**parse_from_mongo(revision)) for revision in revisions]

# Dashboard endpoint
@api_router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats():
    subjects_count = await db.subjects.count_documents({})
    topics_count = await db.topics.count_documents({})
    subtopics_count = await db.subtopics.count_documents({})
    
    # Count by performance status
    mastered_count = await db.subtopics.count_documents({"performance_status": "Mastered"})
    struggled_count = await db.subtopics.count_documents({"performance_status": "Struggled"})
    not_started_count = await db.subtopics.count_documents({"performance_status": "Not Started"})
    
    # Count overdue items (not revised in 7+ days)
    seven_days_ago = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    seven_days_ago = (seven_days_ago - timedelta(days=7)).isoformat()
    
    overdue_count = await db.subtopics.count_documents({
        "$or": [
            {"last_revised": {"$lt": seven_days_ago}},
            {"last_revised": None}
        ]
    })
    
    return DashboardStats(
        total_subjects=subjects_count,
        total_topics=topics_count,
        total_subtopics=subtopics_count,
        overdue_count=overdue_count,
        mastered_count=mastered_count,
        struggled_count=struggled_count,
        not_started_count=not_started_count
    )

# AI Recommendations endpoint
@api_router.get("/recommendations", response_model=List[AIRecommendation])
async def get_ai_recommendations(limit: int = 5):
    try:
        # Get all subtopics with their related data
        pipeline = [
            {
                "$lookup": {
                    "from": "topics",
                    "localField": "topic_id",
                    "foreignField": "id",
                    "as": "topic"
                }
            },
            {
                "$lookup": {
                    "from": "subjects", 
                    "localField": "topic.subject_id",
                    "foreignField": "id",
                    "as": "subject"
                }
            },
            {"$unwind": "$topic"},
            {"$unwind": "$subject"},
            {"$limit": 50}  # Limit for AI processing
        ]
        
        subtopics_data = await db.subtopics.aggregate(pipeline).to_list(50)
        
        if not subtopics_data:
            return []
        
        # Prepare data for AI analysis
        study_data = []
        for item in subtopics_data:
            days_since_revision = None
            if item.get('last_revised'):
                try:
                    last_revised = datetime.fromisoformat(item['last_revised'].replace('Z', '+00:00'))
                    days_since_revision = (datetime.now(timezone.utc) - last_revised).days
                except:
                    pass
            
            study_data.append({
                "subtopic_id": item['id'],
                "name": item['name'],
                "topic": item['topic']['name'],
                "subject": item['subject']['name'],
                "difficulty": item.get('difficulty', 'Moderate'),
                "performance": item.get('performance_status', 'Not Started'),
                "revision_count": item.get('revision_count', 0),
                "days_since_revision": days_since_revision
            })
        
        # Use basic algorithm for recommendations
        # AI functionality temporarily disabled
        return _basic_recommendations(study_data, limit)
            
    except Exception as e:
        logger.error(f"Error getting recommendations: {e}")
        return []

def _basic_recommendations(study_data, limit):
    """Fallback recommendation algorithm"""
    def calculate_priority(item):
        score = 5.0  # Base score
        
        # Time-based priority
        days = item['days_since_revision']
        if days is None:
            score += 3  # Never studied
        elif days > 14:
            score += 2.5
        elif days > 7:
            score += 2
        elif days > 3:
            score += 1
        
        # Performance-based priority
        if item['performance'] == 'Struggled':
            score += 2
        elif item['performance'] == 'Not Started':
            score += 1.5
        elif item['performance'] == 'Mastered':
            score -= 1
        
        # Difficulty-based priority
        if item['difficulty'] == 'Hard':
            score += 1
        elif item['difficulty'] == 'Easy':
            score -= 0.5
            
        return min(10.0, max(0.0, score))
    
    # Sort by priority
    for item in study_data:
        item['priority_score'] = calculate_priority(item)
    
    study_data.sort(key=lambda x: x['priority_score'], reverse=True)
    
    recommendations = []
    for item in study_data[:limit]:
        reason = f"Priority score: {item['priority_score']:.1f}. "
        if item['days_since_revision'] is None:
            reason += "Never studied before."
        else:
            reason += f"Last revised {item['days_since_revision']} days ago."
        if item['performance'] == 'Struggled':
            reason += " Previous difficulty noted."
            
        recommendations.append(AIRecommendation(
            subtopic_id=item['subtopic_id'],
            subtopic_name=item['name'],
            topic_name=item['topic'],
            subject_name=item['subject'],
            priority_score=item['priority_score'],
            reason=reason,
            days_since_revision=item['days_since_revision']
        ))
    
    return recommendations

# Include router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()