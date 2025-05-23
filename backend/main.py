from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from models import Cat



app = FastAPI()

# 允许跨域请求的来源列表
origins = [
    "http://localhost:3000",  # 前端开发地址
    "http://127.0.0.1:3000",
]

# 允许跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.mount("/static", StaticFiles(directory="static"), name="static")

# 模拟猫咪数据
cats_db  = [
    Cat(id=1, name="小乖", sex="Female", birthday="2023-03-26", image_url="/static/xiaoguai.jpg", feed=False, feed_count=0),
    Cat(id=2, name="小宝", sex="Female",birthday="2023-12-12", image_url="/static/xiaobao.jpg", feed=False, feed_count=0),
]

@app.get("/cats", response_model=list[Cat])
def get_cats():
    return cats_db


@app.post("/adopt/{cat_id}")
def adopt_cat(cat_id: int):
    for cat in cats_db:
        if cat.id == cat_id:
            cat.feed_count += 1
            cat.feed = True  # 曾喂养
            return {"message": f"你喂了 {cat.name} {cat.feed_count}次"}
    raise HTTPException(status_code=404, detail="Cat not found")


@app.delete("/cats/{cat_id}")
def delete_cat(cat_id: int):
    global cats_db
    for cat in cats_db:
        if cat.id == cat_id:
            cats_db = [c for c in cats_db if c.id != cat_id]
            return {"message": f" 你居然弃养{cat.name}！How dare you！"}
    raise HTTPException(status_code=404, detail="Cat not found")