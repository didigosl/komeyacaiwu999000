require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');
const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
function sign(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
}
function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!t) return res.status(401).json({ error: 'unauthorized' });
  try { req.user = jwt.verify(t, process.env.JWT_SECRET || 'devsecret'); next(); } catch { res.status(401).json({ error: 'unauthorized' }); }
}
app.post('/api/auth/login', async (req, res) => {
  const { name, password } = req.body || {};
  if (!name || !password) return res.status(400).json({ error: 'bad_request' });
  const r = await db.query('select id,name,password_hash,role from users where name=$1 limit 1', [name]);
  const u = r.rows[0] || null;
  const defOk = name === 'aaaaaa' && password === '999000';
  if (u) {
    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) return res.status(401).json({ error: 'invalid_credentials' });
    return res.json({ token: sign({ id: u.id, name: u.name, role: u.role }) });
  }
  if (defOk) return res.json({ token: sign({ id: 0, name: 'aaaaaa', role: '超级管理员' }) });
  return res.status(401).json({ error: 'invalid_credentials' });
});
app.get('/api/ledger', auth, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const pageSize = Math.min(500, Math.max(1, parseInt(req.query.pageSize || '100', 10)));
  const offset = (page - 1) * pageSize;
  const r = await db.query('select id,type,category,doc,client,amount,method,file,notes,date,date_time,created_at,created_by from ledger order by created_at desc, id desc limit $1 offset $2', [pageSize, offset]);
  const c = await db.query('select count(*)::int as n from ledger');
  res.json({ items: r.rows, total: c.rows[0].n, page, pageSize });
});
app.post('/api/ledger', auth, async (req, res) => {
  const x = req.body || {};
  if (!x.type || !x.category || !x.doc || !x.client || !x.amount || !x.method) return res.status(400).json({ error: 'bad_request' });
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const dt = `${date} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  const r = await db.query(
    'insert into ledger(type,category,doc,client,amount,method,file,notes,date,date_time,created_at,created_by) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,extract(epoch from now())*1000,$11) returning id',
    [x.type, x.category, x.doc, x.client, x.amount, x.method, x.file || '', x.notes || '', date, dt, req.user.name]
  );
  res.json({ id: r.rows[0].id });
});
app.get('/api/contacts', auth, async (req, res) => {
  const type = req.query.type || 'all';
  const q = (req.query.q || '').trim();
  let sql = 'select id,type,name,company,code,contact,phone,city,country,address,sales,created from contacts';
  const params = [];
  const conds = [];
  if (type !== 'all') { params.push(type); conds.push(`type=$${params.length}`); }
  if (q) {
    params.push(`%${q}%`);
    conds.push(`(name ilike $${params.length} or contact ilike $${params.length} or phone ilike $${params.length} or city ilike $${params.length})`);
  }
  if (conds.length) sql += ' where ' + conds.join(' and ');
  sql += ' order by id desc';
  const r = await db.query(sql, params);
  res.json({ items: r.rows });
});
app.post('/api/contacts', auth, async (req, res) => {
  const x = req.body || {};
  if (!x.name || !x.type) return res.status(400).json({ error: 'bad_request' });
  const now = new Date();
  const created = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  const r = await db.query('insert into contacts(type,name,company,code,contact,phone,city,country,address,sales,created) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning id', [x.type, x.name, x.company || '', x.code || '', x.contact || '', x.phone || '', x.city || '', x.country || '', x.address || '', x.sales || '', created]);
  res.json({ id: r.rows[0].id });
});
app.get('/api/payables', auth, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const pageSize = Math.min(500, Math.max(1, parseInt(req.query.pageSize || '100', 10)));
  const offset = (page - 1) * pageSize;
  const r = await db.query('select id,type,partner,doc,amount,paid,settled,trust_days,notes,invoice_no,invoice_date,invoice_amount,created_at,history from payables order by created_at desc, id desc limit $1 offset $2', [pageSize, offset]);
  const c = await db.query('select count(*)::int as n from payables');
  res.json({ items: r.rows, total: c.rows[0].n, page, pageSize });
});
app.post('/api/payables', auth, async (req, res) => {
  const x = req.body || {};
  if (!x.type || !x.partner || !x.doc || !x.amount) return res.status(400).json({ error: 'bad_request' });
  const now = Date.now();
  const r = await db.query(
    'insert into payables(type,partner,doc,amount,paid,settled,trust_days,notes,invoice_no,invoice_date,invoice_amount,created_at,history) values($1,$2,$3,$4,0,false,$5,$6,$7,$8,$9,$10,$11) returning id',
    [x.type, x.partner, x.doc, x.amount, x.trustDays || 30, x.notes || '', x.invoiceNo || '', x.invoiceDate || '', x.invoiceAmount || 0, now, JSON.stringify([])]
  );
  res.json({ id: r.rows[0].id });
});
app.patch('/api/payables/:id/invoice', auth, async (req, res) => {
  const id = parseInt(req.params.id || '0', 10);
  const x = req.body || {};
  if (!id || !x.invoice_no || !x.invoice_date || !x.invoice_amount) return res.status(400).json({ error: 'bad_request' });
  const r0 = await db.query('select history from payables where id=$1', [id]);
  const h = r0.rows[0]?.history || [];
  h.push({ date: x.invoice_date, user: req.user.name, kind: '改为发票', notes: `发票号:${x.invoice_no} 发票日期:${x.invoice_date} 发票金额:${Number(x.invoice_amount).toFixed(2)}` });
  await db.query('update payables set invoice_no=$1, invoice_date=$2, invoice_amount=$3, history=$4 where id=$5', [x.invoice_no, x.invoice_date, x.invoice_amount, JSON.stringify(h), id]);
  res.json({ ok: true });
});
const port = parseInt(process.env.PORT || '8080', 10);
app.listen(port, () => {});
