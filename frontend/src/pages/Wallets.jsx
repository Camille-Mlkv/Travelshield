import { useState } from 'react';

function Wallets() {
  const [wallets, setWallets] = useState(JSON.parse(localStorage.getItem('wallets') || '[]'));
  const [newWallet, setNewWallet] = useState("");

  const addWallet = () => {
    if(newWallet) {
      const updated = [...wallets, newWallet];
      setWallets(updated);
      localStorage.setItem('wallets', JSON.stringify(updated));
      setNewWallet("");
    }
  };

  return (
    <div className="card">
      <h2>Кошельки</h2>
      <input 
        placeholder="Новый кошелек" 
        value={newWallet} 
        onChange={(e) => setNewWallet(e.target.value)}
      />
      <button onClick={addWallet}>Добавить</button>
      <ul>
        {wallets.map((w, i) => <li key={i}>{w}</li>)}
      </ul>
    </div>
  );
}

export default Wallets;
