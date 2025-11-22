const UPTIME_KUMA_URL = '/api/uptimekuma'; // замените на эндпоинт вашего Uptime Kuma
const PAYMENT_ENDPOINT = '/api/payments/yookassa';
const REMNAWAVE_ENDPOINT = '/api/remnawave/subscriptions';

const plans = {
  trial: { name: 'Тест на час', duration: '1h', price: '0 ₽' },
  month: { name: '1 месяц', duration: '1m', price: '990 ₽' },
  two_months: { name: '2 месяца', duration: '2m', price: '1890 ₽' },
  three_months: { name: '3 месяца', duration: '3m', price: '2690 ₽' },
};

const modal = document.getElementById('purchase-modal');
const purchaseForm = document.getElementById('purchase-form');
const alertBox = document.getElementById('form-alert');
const formNote = document.getElementById('form-note');
let currentPlan = 'month';

function openPurchaseModal(planKey) {
  currentPlan = planKey;
  const plan = plans[planKey];
  document.getElementById('modal-plan-label').textContent = plan?.name || 'Подписка';
  formNote.textContent = `Тариф: ${plan?.name || ''}. Стоимость: ${plan?.price || ''}.`;
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
}

function closePurchaseModal() {
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  alertBox.hidden = true;
  purchaseForm.reset();
}

purchaseForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = purchaseForm.email.value.trim();

  if (!email) {
    showAlert('Укажите корректную почту.');
    return;
  }

  try {
    purchaseForm.querySelector('button[type="submit"]').disabled = true;
    showAlert('Готовим ссылку на оплату…', true);

    const paymentResponse = await createPayment(email, currentPlan);
    if (!paymentResponse?.paymentUrl) {
      throw new Error('Не удалось получить ссылку на оплату.');
    }

    // Перенаправляем на оплату. После успешного возврата должен сработать ваш backend-хук,
    // который вызовет RemnaWave и отправит письмо. Можно дополнительно опционально дернуть
    // фронтом, если юзер вернулся сразу.
    window.location.href = paymentResponse.paymentUrl;
  } catch (error) {
    showAlert(error.message || 'Что-то пошло не так. Попробуйте снова.');
  } finally {
    purchaseForm.querySelector('button[type="submit"]').disabled = false;
  }
});

function showAlert(message, muted = false) {
  alertBox.textContent = message;
  alertBox.style.background = muted ? 'rgba(255,255,255,0.05)' : '';
  alertBox.hidden = false;
}

async function createPayment(email, planKey) {
  const response = await fetch(PAYMENT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, plan: planKey }),
  });

  if (!response.ok) {
    throw new Error('Ошибка при запросе ЮKassa.');
  }
  return response.json();
}

async function fetchServerStatus() {
  try {
    const response = await fetch(UPTIME_KUMA_URL);
    if (!response.ok) throw new Error('Uptime Kuma недоступен');

    const data = await response.json();
    renderServers(data.monitors || []);
  } catch (error) {
    renderServers([]);
    console.error('Не удалось получить статусы:', error);
  }
}

function renderServers(monitors) {
  const container = document.getElementById('server-status');
  container.innerHTML = '';

  if (!monitors.length) {
    container.innerHTML = '<p class="muted">Нет данных от Uptime Kuma. Проверьте URL API.</p>';
    document.getElementById('server-count').textContent = '0';
    document.getElementById('avg-uptime').textContent = '—';
    return;
  }

  const uptimeValues = [];

  monitors.forEach((monitor) => {
    const uptime = monitor.uptime || monitor.avgResponseTime || 0;
    uptimeValues.push(Number(uptime));

    const statusCard = document.createElement('div');
    statusCard.className = 'status-card';
    statusCard.innerHTML = `
      <div class="status">
        <span class="dot ${monitor.status === 1 ? 'dot--green' : 'dot--red'}"></span>
        <strong>${monitor.name || 'Сервер'}</strong>
      </div>
      <div class="muted">Доступность: ${uptime}%</div>
      <div class="muted">Локация: ${monitor.hostname || monitor.url || '—'}</div>
    `;
    container.appendChild(statusCard);
  });

  const avg = Math.round(uptimeValues.reduce((a, b) => a + b, 0) / uptimeValues.length);
  document.getElementById('server-count').textContent = monitors.length;
  document.getElementById('avg-uptime').textContent = `${avg}%`;
}

// Пример функции, которую можно вызвать после успешной оплаты (например, на странице успеха)
async function provisionSubscription(email, planKey) {
  const response = await fetch(REMNAWAVE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, plan: planKey }),
  });

  if (!response.ok) {
    throw new Error('Не удалось создать пользователя в RemnaWave.');
  }

  return response.json();
}

// Делаем доступной для внешних сценариев (например, на странице успеха)
window.provisionSubscription = provisionSubscription;

fetchServerStatus();
