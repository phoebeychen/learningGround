import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

type Cat = {
  id: number;
  name: string;
  sex: string;
  birthday: string;
  image_url: string;
  feed: boolean;
  feed_count: number;
};

function App() {
  const [cats, setCats] = useState<Cat[]>([]);

  useEffect(() => {
    axios.get<Cat[]>('http://127.0.0.1:8000/cats')
      .then(response => setCats(response.data))
      .catch(error => console.error('Error fetching cats:', error));
  }, []);



const feedCat = (id: number) => {
  axios.post(`http://127.0.0.1:8000/adopt/${id}`)
    .then(response => {
      alert(response.data.message);  // 显示你喂了 xx 几次
      setCats(prev =>
        prev.map(cat =>
          cat.id === id
            ? { ...cat, feed: true, feed_count: (cat.feed_count || 0) + 1 }
            : cat
        )
      );
    })
    .catch(err => {
      if (err.response?.data?.detail) {
        alert(err.response.data.detail);
      } else {
        alert("喂养失败！");
      }
    });
};

const deleteCat = (id: number) => {
  axios.delete(`http://127.0.0.1:8000/cats/${id}`)
    .then(response => {
      alert(response.data.message);  // 显示弃养消息
      setCats(prev => prev.filter(cat => cat.id !== id));
    })
    .catch(err => {
      if (err.response?.data?.detail) {
        alert(err.response.data.detail);
      } else {
        alert("删除失败！");
      }
    });
};



  return (
    <div className="App">
      <h1>VirtualCats 🐾</h1>

      <div className="cat-grid">
        {cats.map(cat => (
          <div key={cat.id} className="cat-card">
              <img src={"http://127.0.0.1:8000"+cat.image_url} alt={`图片：${cat.name}`} />
            <h2>{cat.name}</h2>
              <p>生日：{cat.birthday}</p>
              <p>性别：{cat.sex}</p>
            <p>喂养次数：{cat.feed_count}</p>
              <button onClick={() => feedCat(cat.id)}>喂养</button>
            <button onClick={() => deleteCat(cat.id)} style={{ marginLeft: "10px", backgroundColor: "red", color: "white" }}>弃养</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
