import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { query } from './db.js';
import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Schema bootstrap (idempotent)
async function ensureSchema() {
  await query(`
    create table if not exists payables (
      id serial primary key,
      type text not null,
      partner text not null,
      doc text not null,
      amount numeric not null default 0,
      paid numeric not null default 0,
      settled boolean not null default false,
      trust_days int,
      notes text,
      invoice_no text,
      invoice_date text,
      invoice_amount numeric default 0,
      sales text,
      date text,
      created_at bigint,
      batch_at bigint,
      batch_order int,
      source text,
      history jsonb default '[]'::jsonb
    );
    create unique index if not exists uniq_payables_type_doc on payables(type, doc);
    create table if not exists ledger (
      id serial primary key,
      type text not null,
      category text,
      doc text,
      client text,
      amount numeric not null default 0,
      method text,
      file text,
      notes text,
      date text,
      date_time text,
      created_at bigint,
      created_by text
    );
    create table if not exists contacts (
      id serial primary key,
      name text not null,
      contact text,
      phone text,
      city text,
      remark text,
      owner text not null, -- '客户' | '商家' | '其它'
      created text,
      company text,
      code text,
      country text,
      address text,
      zip text,
      sales text
    );
    create unique index if not exists uniq_contacts_owner_name on contacts(owner, name);
    create table if not exists accounts (
      id serial primary key,
      name text not null unique,
      balance numeric not null default 0,
      description text,
      created text,
      initial_set boolean not null default false
    );
    create table if not exists categories (
      name text primary key,
      children jsonb not null default '[]'::jsonb
    );
    create table if not exists sales (
      id serial primary key,
      name text not null unique,
      region text,
      phone text,
      base numeric default 0,
      rate numeric default 0,
      commission numeric default 0,
      created text
    );
    create table if not exists roles (
      id serial primary key,
      name text not null unique,
      description text,
      created text,
      immutable boolean not null default false,
      perms jsonb not null default '{}'::jsonb
    );
    create table if not exists users (
      id serial primary key,
      name text not null unique,
      role text,
      created text,
      enabled boolean not null default true,
      password text
    );
  `);
}
// Ensure schema then defaults sequentially to avoid race
(async () => {
  try {
    await ensureSchema();
    await ensureDefaults();
  } catch (e) {
    console.error(e);
  }
})();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_please_change';
function base64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_');
}
function signJwt(payload, expiresInSec = 24*3600) {
  const header = { alg:'HS256', typ:'JWT' };
  const now = Math.floor(Date.now()/1000);
  const body = { ...payload, iat: now, exp: now + expiresInSec };
  const h = base64url(JSON.stringify(header));
  const p = base64url(JSON.stringify(body));
  const data = h + '.' + p;
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64').replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_');
  return data + '.' + sig;
}
function verifyJwt(token) {
  try {
    const [h,p,s] = String(token||'').split('.');
    if (!h || !p || !s) return null;
    const data = h+'.'+p;
    const sig2 = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64').replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_');
    if (sig2 !== s) return null;
    const payload = JSON.parse(Buffer.from(p.replace(/-/g,'+').replace(/_/g,'/'), 'base64').toString('utf8'));
    if (payload.exp && Math.floor(Date.now()/1000) > payload.exp) return null;
    return payload;
  } catch { return null; }
}
async function ensureDefaults() {
  const r = await query('select count(*)::int as c from roles', []);
  if (r.rows[0].c === 0) {
    const now = new Date().toISOString().slice(0,19).replace('T',' ');
    await query("insert into roles(name, description, created, immutable, perms) values($1,$2,$3,true,$4)", ['超级管理员','系统预置角色', now, JSON.stringify({})]);
    await query("insert into roles(name, description, created, immutable, perms) values($1,$2,$3,true,$4)", ['财务','系统预置角色', now, JSON.stringify({})]);
    await query("insert into roles(name, description, created, immutable, perms) values($1,$2,$3,true,$4)", ['股东','系统预置角色', now, JSON.stringify({})]);
    await query("insert into roles(name, description, created, immutable, perms) values($1,$2,$3,true,$4)", ['后台管理人员','系统预置角色', now, JSON.stringify({})]);
  }
  const u = await query('select count(*)::int as c from users where name=$1', ['aaaaaa']);
  if (u.rows[0].c === 0) {
    const now = new Date().toISOString().slice(0,19).replace('T',' ');
    await query('insert into users(name, role, created, enabled, password) values($1,$2,$3,true,$4)', ['aaaaaa','超级管理员', now, '999000']);
  }
  // Seed default users if missing
  const u2 = await query('select count(*)::int as c from users where name=$1', ['shuangqun']);
  if (u2.rows[0].c === 0) {
    const now = new Date().toISOString().slice(0,19).replace('T',' ');
    await query('insert into users(name, role, created, enabled, password) values($1,$2,$3,true,$4)', ['shuangqun','股东', now, '111111']);
  }
  const u3 = await query('select count(*)::int as c from users where name=$1', ['caiwu']);
  if (u3.rows[0].c === 0) {
    const now = new Date().toISOString().slice(0,19).replace('T',' ');
    await query('insert into users(name, role, created, enabled, password) values($1,$2,$3,true,$4)', ['caiwu','财务', now, '111111']);
  }
  const c1 = await query('select count(*)::int as c from categories', []);
  if (c1.rows[0].c === 0) {
    const incomeChildren = ['服务收入(现金)','服务收入(银行)','银行储蓄','现金借贷','订单收入','其它收入'];
    const expenseChildren = ['现金开支','员工工资','出差补贴','人工开支','其它开支'];
    await query('insert into categories(name, children) values($1,$2)', ['收入', JSON.stringify(incomeChildren)]);
    await query('insert into categories(name, children) values($1,$2)', ['开支', JSON.stringify(expenseChildren)]);
  }
  const a1 = await query('select count(*)::int as c from accounts', []);
  if (a1.rows[0].c === 0) {
    const now = new Date().toISOString().slice(0,19).replace('T',' ');
    await query('insert into accounts(name, balance, description, created, initial_set) values($1,$2,$3,$4,$5)', ['现金账户', 0, '系统预置账户', now, false]);
    await query('insert into accounts(name, balance, description, created, initial_set) values($1,$2,$3,$4,$5)', ['银行账户 BBVA', 0, '系统预置账户', now, false]);
    await query('insert into accounts(name, balance, description, created, initial_set) values($1,$2,$3,$4,$5)', ['银行账户 Santander', 0, '系统预置账户', now, false]);
    await query('insert into accounts(name, balance, description, created, initial_set) values($1,$2,$3,$4,$5)', ['人民币账号1', 0, '系统预置账户', now, false]);
    await query('insert into accounts(name, balance, description, created, initial_set) values($1,$2,$3,$4,$5)', ['人民币账户 中智', 0, '系统预置账户', now, false]);
  }
  // Ensure named preset accounts exist even if table not empty
  const presetNames = ['现金账户','银行账户 BBVA','银行账户 Santander','人民币账号1','人民币账户 中智'];
  for (const nm of presetNames) {
    const r = await query('select count(*)::int as c from accounts where name=$1', [nm]);
    if (r.rows[0].c === 0) {
      const now2 = new Date().toISOString().slice(0,19).replace('T',' ');
      await query('insert into accounts(name, balance, description, created, initial_set) values($1,$2,$3,$4,$5)', [nm, 0, '系统预置账户', now2, false]);
    }
  }
  // Migrate old generic names to new presets then remove old accounts
  await query('update ledger set method=$1 where method=$2', ['现金账户', '现金']);
  await query('update ledger set method=$1 where method=$2', ['银行账户 BBVA', '银行']);
  await query('delete from accounts where name = any($1::text[])', [[ '现金', '银行' ]]);
  const ct = await query('select count(*)::int as c from contacts', []);
  if (ct.rows[0].c === 0) {
    const now = new Date().toISOString().slice(0,19).replace('T',' ');
    await query('insert into contacts(name, contact, phone, city, remark, owner, created, company, code, country, address, zip, sales) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',
      ['示例客户A','','','', '', '客户', now, '', '', '', '', '', '']);
    await query('insert into contacts(name, contact, phone, city, remark, owner, created, company, code, country, address, zip, sales) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',
      ['示例商家B','','','', '', '商家', now, '', '', '', '', '', '']);
    await query('insert into contacts(name, contact, phone, city, remark, owner, created, company, code, country, address, zip, sales) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',
      ['示例往来C','','','', '', '其它', now, '', '', '', '', '', '']);
  }
}

async function authRequired(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const payload = verifyJwt(token);
  if (!payload) return res.status(401).json({ error:'unauthorized' });
  req.user = { name: payload.name, role: payload.role };
  next();
}
function ensureAllow(module, action) {
  return async (req, res, next) => {
    if (!req.user) return res.status(401).json({ error:'unauthorized' });
    const roleName = req.user.role || '';
    if (roleName === '超级管理员') return next();
    const r = await query('select perms from roles where name=$1', [roleName]);
    const perms = (r.rows[0]?.perms) || {};
    if (perms[module] && perms[module][action]) return next();
    return res.status(403).json({ error:'forbidden' });
  };
}

// Auth endpoints
app.post('/api/auth/login', async (req, res) => {
  const { name='', password='' } = req.body || {};
  const r = await query('select name, role, enabled, password from users where name=$1', [name]);
  const u = r.rows[0];
  if (!u || !u.enabled || String(u.password||'') !== String(password||'')) return res.status(401).json({ error:'bad_credentials' });
  const token = signJwt({ name: u.name, role: u.role||'' }, 24*3600);
  res.json({ token, user: { name: u.name, role: u.role||'' } });
});
app.get('/api/auth/me', authRequired, async (req, res) => {
  res.json({ user: req.user });
});

function normalizePayable(rec) {
  const now = Date.now();
  const paid = Math.min(Number(rec.paid || 0), Number(rec.amount || 0));
  const settled = Number(rec.amount || 0) > 0 && paid >= Number(rec.amount || 0);
  const history = Array.isArray(rec.history) ? rec.history : [];
  return {
    type: String(rec.type || ''),
    partner: String(rec.partner || ''),
    doc: String(rec.doc || ''),
    amount: Number(rec.amount || 0),
    paid,
    settled,
    trust_days: rec.trustDays ?? null,
    notes: String(rec.notes || ''),
    invoice_no: String(rec.invoiceNo || ''),
    invoice_date: String(rec.invoiceDate || ''),
    invoice_amount: Number(rec.invoiceAmount || 0),
    sales: String(rec.sales || ''),
    date: String(rec.date || ''),
    created_at: Number(rec.createdAt || now),
    batch_at: Number(rec.batchAt || now),
    batch_order: rec.batchOrder ?? 0,
    source: String(rec.source || 'import'),
    history
  };
}

app.get('/api/payables', authRequired, ensureAllow('payables','view'), async (req, res) => {
  const { q, type } = req.query;
  const params = [];
  let sql = 'select * from payables';
  const conds = [];
  if (type && (type === '应收账款' || type === '应付账款')) { params.push(type); conds.push(`type=$${params.length}`); }
  if (q) { params.push(`%${q}%`); conds.push(`(partner ilike $${params.length} or doc ilike $${params.length})`); }
  if (conds.length) sql += ' where ' + conds.join(' and ');
  sql += ' order by batch_at desc nulls last, batch_order asc nulls last, created_at desc';
  const r = await query(sql, params);
  res.json(r.rows);
});

app.post('/api/payables', authRequired, ensureAllow('payables','create'), async (req, res) => {
  const p = normalizePayable({ ...req.body, source: req.body.source || 'manual' });
  if (!p.type || !p.partner || !p.doc || !p.amount) return res.status(400).json({ error: 'bad_request' });
  // upsert by (type, doc)
  const r = await query(`
    insert into payables(type,partner,doc,amount,paid,settled,trust_days,notes,invoice_no,invoice_date,invoice_amount,sales,date,created_at,batch_at,batch_order,source,history)
    values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
    on conflict (type, doc) do update set
      partner=excluded.partner,
      amount=excluded.amount,
      paid=excluded.paid,
      settled=excluded.settled,
      trust_days=excluded.trust_days,
      notes=excluded.notes,
      invoice_no=excluded.invoice_no,
      invoice_date=excluded.invoice_date,
      invoice_amount=excluded.invoice_amount,
      sales=excluded.sales,
      date=excluded.date,
      created_at=excluded.created_at,
      batch_at=excluded.batch_at,
      batch_order=excluded.batch_order,
      source=excluded.source,
      history=excluded.history
    returning *;
  `, [p.type,p.partner,p.doc,p.amount,p.paid,p.settled,p.trust_days,p.notes,p.invoice_no,p.invoice_date,p.invoice_amount,p.sales,p.date,p.created_at,p.batch_at,p.batch_order,p.source,JSON.stringify(p.history)]);
  res.json({ id: r.rows[0].id });
});

app.post('/api/payables/import', authRequired, ensureAllow('payables','import'), async (req, res) => {
  const list = Array.isArray(req.body.records) ? req.body.records : [];
  let inserted = 0, updated = 0;
  for (const rec of list) {
    const p = normalizePayable(rec);
    if (!p.type || !p.partner || !p.doc || !p.amount) continue;
    const r = await query(`
      insert into payables(type,partner,doc,amount,paid,settled,trust_days,notes,invoice_no,invoice_date,invoice_amount,sales,date,created_at,batch_at,batch_order,source,history)
      values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      on conflict (type, doc) do update set
        partner=excluded.partner,
        amount=excluded.amount,
        paid=excluded.paid,
        settled=excluded.settled,
        trust_days=excluded.trust_days,
        notes=excluded.notes,
        invoice_no=excluded.invoice_no,
        invoice_date=excluded.invoice_date,
        invoice_amount=excluded.invoice_amount,
        sales=excluded.sales,
        date=excluded.date,
        created_at=excluded.created_at,
        batch_at=excluded.batch_at,
        batch_order=excluded.batch_order,
        source=excluded.source,
        history=excluded.history
      returning xmax = 0 as inserted;
    `, [p.type,p.partner,p.doc,p.amount,p.paid,p.settled,p.trust_days,p.notes,p.invoice_no,p.invoice_date,p.invoice_amount,p.sales,p.date,p.created_at,p.batch_at,p.batch_order,p.source,JSON.stringify(p.history)]);
    if (r.rows[0]?.inserted) inserted++; else updated++;
  }
  res.json({ inserted, updated });
});

app.post('/api/ledger', authRequired, ensureAllow('ledger','create'), async (req, res) => {
  const x = req.body || {};
  const now = Date.now();
  const r = await query(`
    insert into ledger(type,category,doc,client,amount,method,file,notes,date,date_time,created_at,created_by)
    values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    returning id
  `, [x.type||'', x.category||'', x.doc||'', x.client||'', Number(x.amount||0), x.method||'', x.file||'', x.notes||'', x.date||'', x.dateTime||'', now, x.createdBy||'']);
  // Sync with payables
  if (x.doc && x.type) {
    if (x.type === '收入') {
      await query(`update payables set paid = least(coalesce(paid,0) + $1, amount), settled = (least(coalesce(paid,0) + $1, amount) >= amount),
        history = coalesce(history,'[]'::jsonb) || jsonb_build_array(jsonb_build_object('date',$2,'user',$3,'kind','银行付款','amount',$1,'partner',client,'doc',doc,'notes',$4))
        where doc=$5 and type='应收账款'`, [Number(x.amount||0), x.dateTime||x.date||'', x.createdBy||'', x.notes||'', x.doc]);
      if (x.method) await query(`update accounts set balance = coalesce(balance,0) + $1 where name=$2`, [Number(x.amount||0), x.method||'']);
    } else if (x.type === '支出' || x.type === '开支') {
      await query(`update payables set paid = least(coalesce(paid,0) + $1, amount), settled = (least(coalesce(paid,0) + $1, amount) >= amount),
        history = coalesce(history,'[]'::jsonb) || jsonb_build_array(jsonb_build_object('date',$2,'user',$3,'kind','银行付款','amount',$1,'partner',client,'doc',doc,'notes',$4))
        where doc=$5 and type='应付账款'`, [Number(x.amount||0), x.dateTime||x.date||'', x.createdBy||'', x.notes||'', x.doc]);
      if (x.method) await query(`update accounts set balance = coalesce(balance,0) - $1 where name=$2`, [Number(x.amount||0), x.method||'']);
    }
  }
  res.json({ id: r.rows[0].id });
});

// Contacts endpoints
app.get('/api/contacts', authRequired, ensureAllow('contacts','view'), async (req, res) => {
  const { tab = 'customers', q = '', page = '1', size = '100' } = req.query;
  const owner = tab === 'merchants' ? '商家' : (tab === 'others' ? '其它' : '客户');
  const p = [];
  let sql = 'select * from contacts where owner=$1';
  p.push(owner);
  if (q && String(q).trim()) {
    p.push('%' + q.trim() + '%');
    sql += ` and (name ilike $${p.length} or company ilike $${p.length} or code ilike $${p.length} or contact ilike $${p.length} or phone ilike $${p.length} or sales ilike $${p.length})`;
  }
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.max(1, Math.min(500, parseInt(size, 10) || 100));
  sql += ' order by id desc';
  sql += ` limit ${pageSize} offset ${(pageNum-1)*pageSize}`;
  const r = await query(sql, p);
  res.json(r.rows);
});

app.post('/api/contacts', authRequired, ensureAllow('contacts','create'), async (req, res) => {
  const x = req.body || {};
  const owner = x.owner || '客户';
  const r = await query(`
    insert into contacts(name, contact, phone, city, remark, owner, created, company, code, country, address, zip, sales)
    values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) returning id
  `, [x.name||'', x.contact||'', x.phone||'', x.city||'', x.remark||'', owner, x.created||'', x.company||'', x.code||'', x.country||'', x.address||'', x.zip||'', x.sales||'']);
  res.json({ id: r.rows[0].id });
});

app.put('/api/contacts/by-name', authRequired, ensureAllow('contacts','edit'), async (req, res) => {
  const x = req.body || {};
  const owner = x.owner || '客户';
  await query(`
    update contacts set contact=$1, phone=$2, city=$3, remark=$4, company=$5, code=$6, country=$7, address=$8, zip=$9, sales=$10
    where owner=$11 and name=$12
  `, [x.contact||'', x.phone||'', x.city||'', x.remark||'', x.company||'', x.code||'', x.country||'', x.address||'', x.zip||'', x.sales||'', owner, x.name||'']);
  res.json({ ok: true });
});

app.delete('/api/contacts/by-name', authRequired, ensureAllow('contacts','delete'), async (req, res) => {
  const { owner = '客户', name = '' } = req.query;
  const p1 = await query('select count(*)::int as c from payables where partner=$1', [name]);
  const p2 = await query('select count(*)::int as c from ledger where client=$1', [name]);
  const inUse = (p1.rows[0].c > 0) || (p2.rows[0].c > 0);
  if (inUse) return res.status(400).json({ error: 'in_use' });
  await query('delete from contacts where owner=$1 and name=$2', [owner, name]);
  res.json({ ok: true });
});

// Accounts endpoints
app.get('/api/accounts', authRequired, ensureAllow('accounts','view'), async (req, res) => {
  const r = await query('select name,balance,description as desc,created,initial_set from accounts order by id desc');
  res.json(r.rows);
});
app.post('/api/accounts', authRequired, ensureAllow('accounts','create_account'), async (req, res) => {
  const x = req.body || {};
  const r = await query(`insert into accounts(name, balance, description, created, initial_set) values($1,$2,$3,$4,$5) returning id`,
    [x.name||'', Number(x.balance||0), x.desc||'', x.created||'', !!x.initialSet]);
  res.json({ id: r.rows[0].id });
});
app.put('/api/accounts/by-name', authRequired, ensureAllow('accounts','edit_account'), async (req, res) => {
  const x = req.body || {};
  await query(`update accounts set name=$1, description=$2 where name=$3`, [x.newName||x.name||'', x.desc||'', x.name||'']);
  res.json({ ok: true });
});
app.put('/api/accounts/init', authRequired, ensureAllow('accounts','init_account'), async (req, res) => {
  const { name = '', amount = 0 } = req.body || {};
  await query(`update accounts set balance=$1, initial_set=true where name=$2`, [Number(amount||0), name]);
  res.json({ ok: true });
});
app.delete('/api/accounts/by-name', authRequired, ensureAllow('accounts','delete_account'), async (req, res) => {
  const { name = '' } = req.query;
  const used = await query('select count(*)::int as c from ledger where method=$1', [name]);
  if (used.rows[0].c > 0) return res.status(400).json({ error: 'in_use' });
  await query('delete from accounts where name=$1', [name]);
  res.json({ ok: true });
});
// Categories endpoints
app.get('/api/categories', authRequired, ensureAllow('categories','view'), async (req, res) => {
  const r = await query('select * from categories order by name');
  res.json(r.rows.map(x => ({ name: x.name, children: x.children || [] })));
});
app.put('/api/categories', authRequired, ensureAllow('categories','manage'), async (req, res) => {
  const list = Array.isArray(req.body?.list) ? req.body.list : [];
  await query('delete from categories', []);
  for (const c of list) {
    await query('insert into categories(name, children) values($1,$2)', [String(c.name||''), JSON.stringify(Array.isArray(c.children)?c.children:[])]);
  }
  res.json({ ok: true, count: list.length });
});
// Sales endpoints
app.get('/api/sales', authRequired, ensureAllow('sales_accounts','view'), async (req, res) => {
  const { q='' } = req.query;
  let sql = 'select * from sales';
  const p = [];
  if (q && q.trim()) { sql += ' where (name ilike $1 or region ilike $1 or phone ilike $1)'; p.push('%'+q.trim()+'%'); }
  sql += ' order by id desc';
  const r = await query(sql, p);
  res.json(r.rows);
});
app.post('/api/sales', authRequired, ensureAllow('sales_accounts','create_sales'), async (req, res) => {
  const x = req.body || {};
  const r = await query(`insert into sales(name, region, phone, base, rate, commission, created) values($1,$2,$3,$4,$5,$6,$7) returning id`,
    [x.name||'', x.region||'', x.phone||'', Number(x.base||0), Number(x.rate||0), Number(x.commission||0), x.created||'']);
  res.json({ id: r.rows[0].id });
});
app.put('/api/sales/:id', authRequired, ensureAllow('sales_accounts','edit_sales'), async (req, res) => {
  const id = parseInt(req.params.id, 10) || 0;
  const x = req.body || {};
  await query(`update sales set name=$1, region=$2, phone=$3, base=$4, rate=$5, commission=$6 where id=$7`,
    [x.name||'', x.region||'', x.phone||'', Number(x.base||0), Number(x.rate||0), Number(x.commission||0), id]);
  res.json({ ok: true });
});
app.delete('/api/sales/:id', authRequired, ensureAllow('sales_accounts','delete_sales'), async (req, res) => {
  const id = parseInt(req.params.id, 10) || 0;
  const r = await query('select name from sales where id=$1', [id]);
  if (!r.rows[0]) return res.status(404).json({ error: 'not_found' });
  const name = r.rows[0].name;
  const used = await query('select count(*)::int as c from payables where sales=$1', [name]);
  if (used.rows[0].c > 0) return res.status(400).json({ error: 'in_use' });
  await query('delete from sales where id=$1', [id]);
  res.json({ ok: true });
});
// Roles endpoints
app.get('/api/roles', authRequired, async (req, res) => {
  const r = await query('select id,name,description as desc,created,immutable,perms from roles order by id');
  res.json(r.rows);
});
app.get('/api/roles/me', authRequired, async (req, res) => {
  const roleName = req.user?.role || '';
  if (!roleName) return res.json({ name:'', perms:{} });
  const r = await query('select name, perms from roles where name=$1', [roleName]);
  const row = r.rows[0];
  res.json({ name: row?.name || roleName, perms: row?.perms || {} });
});
app.post('/api/roles', authRequired, ensureAllow('role_accounts','create_role'), async (req, res) => {
  const x = req.body || {};
  const r = await query('insert into roles(name, description, created, immutable, perms) values($1,$2,$3,false,$4) returning id',
    [x.name||'', x.desc||'', x.created||'', JSON.stringify(x.perms||{})]);
  res.json({ id: r.rows[0].id });
});
app.put('/api/roles/:id', authRequired, ensureAllow('role_accounts','edit_role'), async (req, res) => {
  const id = parseInt(req.params.id, 10) || 0;
  const x = req.body || {};
  const r0 = await query('select immutable from roles where id=$1', [id]);
  if (!r0.rows[0]) return res.status(404).json({ error: 'not_found' });
  if (r0.rows[0].immutable) return res.status(400).json({ error: 'immutable' });
  await query('update roles set name=$1, description=$2 where id=$3', [x.name||'', x.desc||'', id]);
  res.json({ ok: true });
});
app.put('/api/roles/:id/perms', authRequired, ensureAllow('role_accounts','edit_role'), async (req, res) => {
  const id = parseInt(req.params.id, 10) || 0;
  const x = req.body || {};
  const r0 = await query('select name, immutable from roles where id=$1', [id]);
  if (!r0.rows[0]) return res.status(404).json({ error: 'not_found' });
  if ((r0.rows[0].name || '') === '超级管理员') return res.status(400).json({ error: 'immutable' });
  await query('update roles set perms=$1 where id=$2', [JSON.stringify(x.perms||{}), id]);
  res.json({ ok: true });
});
app.delete('/api/roles/:id', authRequired, ensureAllow('role_accounts','delete_role'), async (req, res) => {
  const id = parseInt(req.params.id, 10) || 0;
  const r0 = await query('select name, immutable from roles where id=$1', [id]);
  if (!r0.rows[0]) return res.status(404).json({ error: 'not_found' });
  if (r0.rows[0].immutable) return res.status(400).json({ error: 'immutable' });
  const used = await query('select count(*)::int as c from users where role=$1', [r0.rows[0].name]);
  if (used.rows[0].c > 0) return res.status(400).json({ error: 'in_use' });
  await query('delete from roles where id=$1', [id]);
  res.json({ ok: true });
});
// Users endpoints
app.get('/api/users', authRequired, ensureAllow('user_accounts','view'), async (req, res) => {
  const r = await query('select * from users order by id desc');
  res.json(r.rows);
});
app.post('/api/users', authRequired, ensureAllow('user_accounts','create_user'), async (req, res) => {
  const x = req.body || {};
  const r = await query('insert into users(name, role, created, enabled, password) values($1,$2,$3,true,$4) returning id',
    [x.name||'', x.role||'', x.created||'', x.password||'']);
  res.json({ id: r.rows[0].id });
});
app.put('/api/users/:id', authRequired, ensureAllow('user_accounts','enable_user'), async (req, res) => {
  const id = parseInt(req.params.id, 10) || 0;
  const x = req.body || {};
  await query('update users set role=$1, enabled=$2 where id=$3', [x.role||'', !!x.enabled, id]);
  res.json({ ok: true });
});
app.post('/api/users/:id/reset-password', authRequired, ensureAllow('user_accounts','reset_password'), async (req, res) => {
  const id = parseInt(req.params.id, 10) || 0;
  const { password = '111111' } = req.body || {};
  await query('update users set password=$1 where id=$2', [password, id]);
  res.json({ ok: true });
});
app.get('/api/analytics/ledger-summary', authRequired, ensureAllow('ledger','view'), async (req, res) => {
  const { period='month', range='12' } = req.query;
  const n = Math.max(1, Math.min(365, parseInt(range, 10) || 12));
  const now = new Date();
  const out = [];
  function fmtYMD(d) {
    const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), dd=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${dd}`;
  }
  for (let i=n-1;i>=0;i--) {
    let label = '';
    let start = '', end = '';
    if (period === 'year') {
      const y = now.getFullYear() - i;
      label = String(y);
      start = `${y}-01-01`; end = `${y}-12-31`;
    } else if (period === 'day') {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate()-i);
      label = `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      start = fmtYMD(d); end = fmtYMD(d);
    } else {
      const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
      const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0');
      label = `${y}-${m}`;
      start = `${y}-${m}-01`;
      const d2 = new Date(d.getFullYear(), d.getMonth()+1, 0);
      end = fmtYMD(d2);
    }
    const r = await query(`
      select type, sum(amount)::numeric(12,2) as total
      from ledger
      where date >= $1 and date <= $2
      group by type
    `, [start, end]);
    const income = Number((r.rows.find(x => x.type === '收入')?.total) || 0);
    const expense = Number((r.rows.find(x => x.type === '开支')?.total) || 0);
    out.push({ label, income, expense });
  }
  res.json(out);
});
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
