/* MOTEUR DE PERSISTANCE */
const StorageEngine = {
  get: () => JSON.parse(localStorage.getItem('argeo_v2')) || { balance: 0, pending: 0 },
  save: (data) => localStorage.setItem('argeo_v2', JSON.stringify(data)),
  pay: () => {
    let data = StorageEngine.get();
    data.balance += data.pending;
    data.pending = 0;
    StorageEngine.save(data);
    alert("Paiement versé !");
  }
};

/* MOTEUR CLAVIER */
const Keyboard = {
  add: (n) => console.log("Input:", n),
  clear: () => console.log("Reset"),
  confirm: () => document.getElementById('custom-keyboard').classList.remove('visible')
};

/* UI CONTROLLER */
const UI = {
  toggleGoal: () => document.getElementById('goal-card').classList.toggle('flipped'),
  showKeyboard: () => document.getElementById('custom-keyboard').classList.add('visible')
};