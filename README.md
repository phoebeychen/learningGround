# Mini fullstack project - Virtual Cat

A simple full-stack project to simulate adopting virtual cats. Built with **FastAPI** and **React + TypeScript**.

---

### 1. Backend Setup (FastAPI)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate 
pip install fastapi uvicorn
uvicorn main:app --reload
```

### 2. Frontend Setup (React + TypeScript)

```bash
cd frontend
npm install
npm start
```

> The frontend expects the backend running at `http://127.0.0.1:8000`

---

### 3. Project Structure

```
virtual_cat/
├── backend/
│   ├── main.py          # FastAPI main app
│   ├── models.py        # Pydantic models
│   └── static/          # Cat images
│       ├── xiaoguai.jpg
│       └── xiaobao.jpg
├── frontend/
│   ├── public/
│   └── src/
│       ├── App.tsx      # React App
│       └── App.css      # Styling
├── .gitignore
```

---

### 4. API Endpoints

| Method | Endpoint      | Description      |
| ------ | ------------- | ---------------- |
| GET    | `/cats`       | Get list of cats |
| POST   | `/adopt/{id}` | Feed a cat       |
| DELETE | `/cats/{id}`  | Abandon a cat    |

