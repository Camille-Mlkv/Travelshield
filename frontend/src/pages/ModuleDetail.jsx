import { useParams } from 'react-router-dom';
import { useState } from 'react';

export default function ModuleDetail() {
  const { id } = useParams();
  const [flightNumber, setFlightNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [walletAddress, setWalletAddress] = useState('');

  const wallets = JSON.parse(localStorage.getItem('wallets') || '[]');

  const buyPolicy = async () => {
    if (!flightNumber || !startDate || !endDate || !walletAddress) {
      return alert('Заполните все поля');
    }
    // Пока mock вызов смарт-контракта
    alert(`Полис для модуля ${id} куплен!\nРейс: ${flightNumber}`);
  };

  return (
    <div className="card">
      <h1>Модуль {id}</h1>
      <input placeholder="Flight Number" value={flightNumber} onChange={e => setFlightNumber(e.target.value)} />
      <input type="date" placeholder="Start Date" value={startDate} onChange={e => setStartDate(e.target.value)} />
      <input type="date" placeholder="End Date" value={endDate} onChange={e => setEndDate(e.target.value)} />

      <select value={walletAddress} onChange={e => setWalletAddress(e.target.value)}>
        <option value="">Выберите кошелек</option>
        {wallets.map((w,i) => <option key={i} value={w}>{w}</option>)}
      </select>

      <button onClick={buyPolicy}>Купить покрытие</button>
    </div>
  );
}
