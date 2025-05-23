from pydantic import BaseModel

class Cat(BaseModel):
    id: int
    name: str
    sex: str
    birthday: str
    image_url: str
    feed: bool
    feed_count: int