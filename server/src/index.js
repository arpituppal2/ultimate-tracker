const express = require('express');
const cors = require('cors');
const app = express();

const allowedOrigins = [
    process.env.CLIENT_URL,
    'https://ultimate-tracker-lac.vercel.app',
    'https://loveypants.netlify.app',
    'https://loveypants.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
  ].filter(Boolean);

app.use(cors({
    origin: (origin, cb) => {
          if (!origin) return cb(null, true);
          if (allowedOrigins.includes(origin)) return cb(null, true);
          return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

app.use(express.json());

//  Routes 
app.use('/api/auth',            require('./routes/auth'));
app.use('/api/tasks',           require('./routes/tasks'));
app.use('/api/submissions',     require('./routes/submissions'));
app.use('/api/habits',          require('./routes/habits'));
app.use('/api/ledger',          require('./routes/ledger'));
app.use('/api/reviews',         require('./routes/reviews'));
app.use('/api/quarters',        require('./routes/quarters'));
app.use('/api/admin',           require('./routes/admin'));
app.use('/api/stats',           require('./routes/stats'));
app.use('/api/weeks',           require('./routes/weeks'));
app.use('/api/feedback',        require('./routes/feedback'));
app.use('/api/user',            require('./routes/user'));
app.use('/api/colleges',        require('./routes/colleges'));
app.use('/api/problem-comments',require('./routes/problemComments'));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
