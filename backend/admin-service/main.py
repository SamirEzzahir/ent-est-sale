from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {"service": "admin-service running"}