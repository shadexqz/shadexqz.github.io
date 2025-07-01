const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;

// Хранилище в памяти
let mailboxes = {};
let emails = {};

// Настройка почтового сервера (используем Mailtrap для тестов)
const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "your-mailtrap-user",
    pass: "your-mailtrap-pass"
  }
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Создание почтового ящика
app.post('/create', (req, res) => {
  const id = uuidv4().split('-')[0];
  const address = `${id}@timed-mail.com`;
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 часа
  
  mailboxes[address] = {
    id,
    address,
    createdAt: Date.now(),
    expiresAt,
    emails: []
  };
  
  res.json({ address, expiresAt });
});

// Проверка почты
app.get('/inbox/:address', (req, res) => {
  const address = req.params.address;
  
  if (mailboxes[address]) {
    res.json({
      emails: mailboxes[address].emails,
      expiresIn: mailboxes[address].expiresAt - Date.now()
    });
  } else {
    res.status(404).json({ error: 'Mailbox not found' });
  }
});

// Отправка письма
app.post('/send', async (req, res) => {
  const { from, to, subject, text } = req.body;
  
  try {
    await transporter.sendMail({
      from: from || `no-reply@timed-mail.com`,
      to,
      subject,
      text
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Веб-интерфейс
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Очистка устаревших ящиков каждые 5 минут
setInterval(() => {
  const now = Date.now();
  for (const address in mailboxes) {
    if (mailboxes[address].expiresAt < now) {
      delete mailboxes[address];
    }
  }
}, 300000);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
