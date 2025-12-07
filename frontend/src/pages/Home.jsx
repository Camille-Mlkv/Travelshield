import { Link } from 'react-router-dom';

function Home() {
  const modules = [
    { id: 1, name: "Задержка рейса" },
    { id: 2, name: "Потеря багажа" },
    { id: 3, name: "Отмена бронирования" },
  ];

  return (
    <div>

      <h2>Страховые модули</h2>
      <div className="module-container">
        {modules.map(m => (
          <Link key={m.id} to={`/module/${m.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="module-card">
              {m.name}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Home;
