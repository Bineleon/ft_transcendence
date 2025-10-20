import './css/style.css'

fetch('http://localhost:3000/api/ping')
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error('Erreur backend:', err));
