import { useState, useEffect } from 'react';

function Policies() {
  const [policies, setPolicies] = useState([]);

  useEffect(() => {
    const userId = document.cookie.split("=")[1] || "1"; // Просто mock
    setPolicies([
      { id: 1, module: "Задержка рейса", status: "Активен", userId },
      { id: 2, module: "Потеря багажа", status: "Активен", userId },
    ]);
  }, []);

  return (
    <div className="card">
      <h2>Мои полисы</h2>
      <ul>
        {policies.map(p => (
          <li key={p.id}>{p.module} — {p.status}</li>
        ))}
      </ul>
    </div>
  );
}

export default Policies;
