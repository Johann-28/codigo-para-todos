"""
FastAPI Application for Código para Todos Learning Platform
Main application entry point with router configuration and CORS setup.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, diagnostic, learning_paths, home
from app.core.config import settings

# Create FastAPI application instance
app = FastAPI(
    title="Código para Todos API",
    description="Backend API for the Código para Todos learning platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://localhost:3000"],  # Angular/React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers for different modules
app.include_router(
    auth.router,
    prefix="/api/auth",
    tags=["Authentication"]
)

app.include_router(
    diagnostic.router,
    prefix="/api/diagnostic",
    tags=["Diagnostic Evaluation"]
)

app.include_router(
    learning_paths.router,
    prefix="/api/learning-paths",
    tags=["Learning Paths"]
)

app.include_router(
    home.router,
    prefix="/api/home",
    tags=["Dashboard & Home"]
)

@app.get("/")
async def root():
    """Root endpoint for API health check"""
    return {
        "message": "Welcome to Código para Todos API",
        "version": "1.0.0",
        "status": "active",
        "docs": "/docs"
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {"status": "healthy", "service": "codigo-para-todos-api"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )