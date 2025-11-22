# FoxCloud Landing

Одностраничный лендинг FoxCloud с тарифами VPN, статусом серверов и модальным окном покупки.

## Как запустить
Запуск не требует сборки: это статический сайт с HTML/CSS/JS.

### Быстрый предпросмотр локально
1. Откройте терминал в корне репозитория.
2. Поднимите простой сервер (любая альтернатива подойдёт):
   ```bash
   python -m http.server 8000
   ```
3. Перейдите в браузере на `http://localhost:8000` — страница сразу загрузится.

### Запуск через Caddy
1. Установите [Caddy](https://caddyserver.com/download) на сервер или локально.
2. При необходимости отредактируйте `root` и адреса backend-служб в `Caddyfile`:
   - `/api/uptimekuma` → ваш Uptime Kuma.
   - `/api/payments/yookassa` → backend, который создаёт платёж в ЮKassa и отдаёт `paymentUrl`.
   - `/api/remnawave/subscriptions` → backend, который вызывает RemnaWave для создания пользователя и выдачи подписки.
3. Запустите сервер из корня проекта:
   ```bash
   caddy run --config Caddyfile
   ```
4. Откройте `http://localhost:8000` — страница, API-прокси и CORS готовы к работе.

### Что нужно настроить перед показом клиентам
1. **Uptime Kuma**
   - В `assets/script.js` замените значение `UPTIME_KUMA_URL` на API-ендпоинт, отдающий JSON со статусами.
   - Убедитесь, что CORS разрешён для вашего домена.
2. **ЮKassa**
   - В `assets/script.js` укажите свой backend-роут в `PAYMENT_ENDPOINT`.
   - Backend должен принимать `{ email, plan }` и возвращать `{ paymentUrl }`, куда пользователь будет перенаправлён.
3. **RemnaWave**
   - В `assets/script.js` пропишите реальный путь в `REMNAWAVE_ENDPOINT`.
   - После успешной оплаты ваш backend может вызвать `window.provisionSubscription(email, plan)` или сам обратиться к этому ендпоинту, чтобы создать пользователя по почте и выдать подписку.

### Развёртывание на хостинге
1. Скопируйте файлы `index.html`, `assets/styles.css`, `assets/script.js` на любой static hosting (Nginx, S3+CloudFront, Netlify и т.п.).
2. Убедитесь, что backend-роуты `PAYMENT_ENDPOINT`, `REMNAWAVE_ENDPOINT` и `UPTIME_KUMA_URL` доступны с того же домена или имеют корректные CORS-заголовки.
3. Протестируйте кнопки покупки: введите тестовую почту, дождитесь редиректа на ЮKassa и проверьте, что после оплаты пользователь создаётся в RemnaWave.

## Интеграционные точки
- **Uptime Kuma**: замените `UPTIME_KUMA_URL` в `assets/script.js` на свой API-эндпоинт для загрузки статусов.
- **ЮKassa**: укажите свой backend-роут в `PAYMENT_ENDPOINT`, который должен возвращать `paymentUrl`.
- **RemnaWave**: пропишите конечный путь в `REMNAWAVE_ENDPOINT` и вызовите `window.provisionSubscription(email, plan)` после успешной оплаты.

## Скриншот превью
Если нужен быстрый скриншот, запустите сервер на 8000 порту и выполните любой headless-браузер (например, Playwright) с переходом на `http://localhost:8000`.
