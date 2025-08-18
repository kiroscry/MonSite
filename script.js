const purchases = JSON.parse(localStorage.getItem('purchases')) || [];
const sales = JSON.parse(localStorage.getItem('sales')) || [];
const adjustments = JSON.parse(localStorage.getItem('adjustments')) || [];
let nextId = JSON.parse(localStorage.getItem('nextId')) || 1;

function saveData() {
  localStorage.setItem('purchases', JSON.stringify(purchases));
  localStorage.setItem('sales', JSON.stringify(sales));
  localStorage.setItem('adjustments', JSON.stringify(adjustments));
  localStorage.setItem('nextId', nextId);
}

function computeStock() {
  const stock = {};
  purchases.forEach(p => {
    stock[p.name] = (stock[p.name] || 0) + p.quantity;
  });
  sales.forEach(s => {
    stock[s.name] = (stock[s.name] || 0) - s.quantity;
  });
  adjustments.forEach(a => {
    stock[a.name] = (stock[a.name] || 0) - a.quantity;
  });
  return stock;
}

function updateStockTable() {
  const tbody = document.getElementById('stock-body');
  tbody.innerHTML = '';
  const stock = computeStock();
  Object.entries(stock).forEach(([name, qty]) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${name}</td><td>${qty}</td>`;
    tbody.appendChild(tr);
  });
}

function computeProfit(start, end) {
  const labels = [];
  const data = [];
  let total = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    labels.push(dateStr);
    const revenue = sales
      .filter(s => s.date === dateStr)
      .reduce((sum, s) => sum + s.price * s.quantity, 0);
    const cost = purchases
      .filter(p => p.date === dateStr)
      .reduce((sum, p) => sum + p.cost * p.quantity, 0);
    const profit = revenue - cost;
    data.push(profit);
    total += profit;
  }
  return { labels, data, total };
}

let profitChart;

function updateDashboard() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);
  const { labels, data, total } = computeProfit(start, end);
  document.getElementById('profit').textContent = total.toFixed(2);
  profitChart.data.labels = labels;
  profitChart.data.datasets[0].data = data;
  profitChart.update();
}

document.getElementById('purchase-form').addEventListener('submit', e => {
  e.preventDefault();
  const form = e.target;
  const item = {
    id: nextId++,
    name: form.name.value,
    quantity: parseInt(form.quantity.value),
    cost: parseFloat(form.cost.value),
    date: form.date.value
  };
  purchases.push(item);
  saveData();
  form.reset();
  updateStockTable();
  updateDashboard();
});

document.getElementById('sale-form').addEventListener('submit', e => {
  e.preventDefault();
  const form = e.target;
  const stock = computeStock();
  const qty = parseInt(form.quantity.value);
  if (stock[form.name.value] < qty) {
    alert('Stock insuffisant');
    return;
  }
  const item = {
    id: nextId++,
    name: form.name.value,
    quantity: qty,
    price: parseFloat(form.price.value),
    date: form.date.value
  };
  sales.push(item);
  saveData();
  form.reset();
  updateStockTable();
  updateDashboard();
});

document.getElementById('adjust-form').addEventListener('submit', e => {
  e.preventDefault();
  const form = e.target;
  const item = {
    id: nextId++,
    name: form.name.value,
    quantity: parseInt(form.quantity.value),
    date: form.date.value
  };
  adjustments.push(item);
  saveData();
  form.reset();
  updateStockTable();
  updateDashboard();
});

window.addEventListener('DOMContentLoaded', () => {
  const ctx = document.getElementById('profitChart').getContext('2d');
  profitChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Bénéfice',
        data: [],
        borderColor: '#4e73df',
        fill: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
  const today = new Date().toISOString().split('T')[0];
  document.querySelectorAll('input[type="date"]').forEach(inp => inp.value = today);
  updateStockTable();
  updateDashboard();
});
