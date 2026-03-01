const records = [];
const payRecords = [];
let payEditingId = null;
const partners = [];
const contactsData = {
  customers: [
    { name:'客户A', contact:'张三', phone:'13800000001', city:'上海', remark:'重要客户', owner:'客户', created:'2026/01/01 10:00:00' },
    { name:'客户B', contact:'李四', phone:'13800000002', city:'杭州', remark:'', owner:'客户', created:'2026/01/02 11:20:00' },
    { name:'客户C', contact:'王五', phone:'13800000003', city:'苏州', remark:'', owner:'客户', created:'2026/01/03 09:10:00' }
  ],
  merchants: [
    { name:'商家A', contact:'刘一', phone:'13900000001', city:'上海', remark:'', owner:'商家', created:'2026/01/01 10:00:00' },
    { name:'商家B', contact:'陈二', phone:'13900000002', city:'杭州', remark:'', owner:'商家', created:'2026/01/02 11:20:00' },
    { name:'商家C', contact:'周三', phone:'13900000003', city:'苏州', remark:'', owner:'商家', created:'2026/01/03 09:10:00' }
  ],
  others: [
    { name:'单位A', contact:'赵一', phone:'13700000001', city:'上海', remark:'', owner:'其它', created:'2026/01/01 10:00:00' },
    { name:'单位B', contact:'钱二', phone:'13700000002', city:'杭州', remark:'', owner:'其它', created:'2026/01/02 11:20:00' },
    { name:'单位C', contact:'孙三', phone:'13700000003', city:'苏州', remark:'', owner:'其它', created:'2026/01/03 09:10:00' }
  ]
};
const entryType = document.getElementById('entry-type');
const entryCategory = document.getElementById('entry-category');
const entryClient = document.getElementById('entry-client');
const entryAmount = document.getElementById('entry-amount');
const entryMethod = document.getElementById('entry-method');
const entryFile = document.getElementById('entry-file');
const entryNotes = document.getElementById('entry-notes');
const entryForm = document.getElementById('entry-form');
const entrySubmitBtn = entryForm?.querySelector('button[type="submit"]');
const rows = document.getElementById('rows');
const homeChartRows = document.getElementById('home-chart-rows');
const homePeriodSel = document.getElementById('home-period');
const filterType = document.getElementById('filter-type');
const filterKey = document.getElementById('filter-key');
const filterStart = document.getElementById('filter-start');
const filterEnd = document.getElementById('filter-end');
const ledgerPager = document.getElementById('global-pager-controls') || document.getElementById('ledger-pager');
const ledgerTableWrap = document.getElementById('ledger-table-wrap');
const ldType = document.getElementById('ld-type');
const ldTypeDD = document.getElementById('ld-type-dd');
const ldTypeList = document.getElementById('ld-type-list');
const ldTypeLabel = document.getElementById('ld-type-label');
const ldCat = document.getElementById('ld-cat');
const ldCatDD = document.getElementById('ld-cat-dd');
const ldCatList = document.getElementById('ld-cat-list');
const ldCatLabel = document.getElementById('ld-cat-label');
const ldOwner = document.getElementById('ld-owner');
const ldOwnerDD = document.getElementById('ld-owner-dd');
const ldOwnerList = document.getElementById('ld-owner-list');
const ldOwnerLabel = document.getElementById('ld-owner-label');
let ledgerPage = 1;
const ledgerPageSize = 100;
function updateLedgerHeaderCover() {}
let ledgerHdrType = 'all';
let ledgerHdrCat = '';
let ledgerHdrOwner = '';
function clientOwner(name) {
  const all = [...contactsData.customers, ...contactsData.merchants, ...contactsData.others];
  const obj = all.find(x => (x.name||'') === (name||''));
  return obj ? (obj.owner || '') : '';
}
function openLedgerTypeFilter() {
  ldTypeDD.style.display = 'block';
  ldTypeList.innerHTML = '';
  const addItem = (label, val) => {
    const row = document.createElement('div'); row.className='dd-item'; row.textContent = label;
    row.addEventListener('click', () => {
      ledgerHdrType = val;
      ldTypeDD.style.display='none';
      setLabel(ldTypeLabel, '类型', val!=='all');
      ledgerPage = 1;
      applyFilters();
      ldCatLabel && setLabel(ldCatLabel, '子类目', !!ledgerHdrCat);
    });
    ldTypeList.appendChild(row);
  };
  addItem('全部', 'all');
  addItem('收入', '收入');
  addItem('开支', '开支');
}
function openLedgerCatFilter() {
  ldCatDD.style.display = 'block';
  ldCatList.innerHTML = '';
  const addItem = (label, val) => {
    const row = document.createElement('div'); row.className='dd-item'; row.textContent = label;
    row.addEventListener('click', () => {
      ledgerHdrCat = val;
      ldCatDD.style.display='none';
      setLabel(ldCatLabel, '子类目', !!val);
      ledgerPage = 1;
      applyFilters();
    });
    ldCatList.appendChild(row);
  };
  addItem('全部', '');
  const types = ledgerHdrType==='all' ? categoriesData.map(c=>c.name) : [ledgerHdrType];
  types.forEach(t => {
    const children = (categoriesData.find(c=>c.name===t)?.children) || [];
    children.forEach(n => addItem(n, n));
  });
}
function openLedgerOwnerFilter() {
  ldOwnerDD.style.display = 'block';
  ldOwnerList.innerHTML = '';
  const addItem = (label, val) => {
    const row = document.createElement('div'); row.className='dd-item'; row.textContent = label;
    row.addEventListener('click', () => {
      ledgerHdrOwner = val;
      ldOwnerDD.style.display='none';
      setLabel(ldOwnerLabel, '往来单位', !!val);
      ledgerPage = 1;
      applyFilters();
    });
    ldOwnerList.appendChild(row);
  };
  addItem('全部', '');
  addItem('客户', '客户');
  addItem('商家', '商家');
  addItem('其它往来单位', '其它');
}
ldType?.addEventListener('click', (e) => { e.stopPropagation(); openLedgerTypeFilter(); });
ldCat?.addEventListener('click', (e) => { e.stopPropagation(); openLedgerCatFilter(); });
ldOwner?.addEventListener('click', (e) => { e.stopPropagation(); openLedgerOwnerFilter(); });
const accRows = document.getElementById('acc-rows');
const accAdd = document.getElementById('acc-add');
const accountsData = [
  { name:'现金账户', balance:0, desc:'系统预置账户', created:'2026/02/08 00:00:00', initialSet:false },
  { name:'银行账户 BBVA', balance:0, desc:'系统预置账户', created:'2026/02/08 00:00:00', initialSet:false },
  { name:'银行账户 Santander', balance:0, desc:'系统预置账户', created:'2026/02/08 00:00:00', initialSet:false },
  { name:'人民币账号1', balance:0, desc:'系统预置账户', created:'2026/02/08 00:00:00', initialSet:false },
  { name:'人民币账户 中智', balance:0, desc:'系统预置账户', created:'2026/02/08 00:00:00', initialSet:false }
];
function loadJSON(key, def) {
  try { const v = JSON.parse(localStorage.getItem(key) || ''); return v ?? def; } catch { return def; }
}
function saveJSON(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}
function initPersist() {
  const recs = loadJSON('records', []);
  if (Array.isArray(recs)) {
    recs.forEach(r => { if (r && typeof r.fileUrl === 'string' && /^blob:/i.test(r.fileUrl)) delete r.fileUrl; });
    recs.forEach(r => {
      if (r && !r.createdAt) {
        const ts = Date.parse(r.dateTime || r.date || '');
        if (!isNaN(ts)) r.createdAt = ts;
      }
    });
    records.splice(0, records.length, ...recs);
  }
  const pays = loadJSON('payRecords', []);
  if (Array.isArray(pays)) {
    pays.forEach(r => {
      if (r && !r.createdAt) {
        const h0 = (r.history && r.history[0] && (r.history[0].date || r.history[0].dateTime)) || null;
        const ts = Date.parse(h0 || r.date || '');
        if (!isNaN(ts)) r.createdAt = ts;
      }
    });
    payRecords.splice(0, payRecords.length, ...pays);
  }
  const contactsSaved = loadJSON('contactsData', null);
  if (contactsSaved && typeof contactsSaved === 'object') {
    ['customers','merchants','others'].forEach(k => { if (Array.isArray(contactsSaved[k])) contactsData[k] = contactsSaved[k]; });
  }
  const accs = loadJSON('accountsData', null);
  if (Array.isArray(accs)) { accountsData.splice(0, accountsData.length, ...accs); }
  const cats = loadJSON('categoriesData', null);
  if (Array.isArray(cats)) { categoriesData.splice(0, categoriesData.length, ...cats); }
  const roles = loadJSON('rolesData', null);
  if (Array.isArray(roles)) { rolesData.splice(0, rolesData.length, ...roles); }
  const ensureRole = (name, desc) => {
    if (!rolesData.some(r => r.name === name)) {
      const maxId = rolesData.reduce((m,r)=>Math.max(m, r.id||0), 0);
      const now = new Date();
      const created = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
      rolesData.push({ id:maxId+1, name, desc, created, immutable:true });
    }
  };
  ensureRole('财务','系统预置角色');
  ensureRole('股东','系统预置角色');
  ensureRole('后台管理人员','系统预置角色');
  saveJSON('rolesData', rolesData);
  const sales = loadJSON('salesData', null);
  if (Array.isArray(sales)) { salesData.splice(0, salesData.length, ...sales); }
}
function refreshAccountOptions() {
  entryMethod.innerHTML = '<option value=\"\">请选择</option>';
  accountsData.slice().reverse().forEach(a => {
    const opt = document.createElement('option');
    opt.value = a.name; opt.textContent = a.name;
    entryMethod.appendChild(opt);
  });
}
function renderAccounts() {
  accRows.innerHTML = '';
  const list = accountsData.map((a, i) => ({ a, i }));
  list.slice().reverse().forEach(({ a, i }) => {
    const tr = document.createElement('tr');
    const ops = document.createElement('td');
    ops.className = 'actions';
    const edit = document.createElement('a'); edit.href='#'; edit.textContent='编辑'; edit.className='link-blue';
    const del = document.createElement('a'); del.href='#'; del.textContent='删除'; del.className='link-red';
    ops.append(edit, document.createTextNode(' '), del);
    if (!a.initialSet) {
      const initBtn = document.createElement('a');
      initBtn.href='#'; initBtn.textContent='初始设置'; initBtn.className='link-orange';
      ops.append(document.createTextNode(' '), initBtn);
      initBtn.addEventListener('click', e => {
        e.preventDefault();
        pendingAccInitIndex = i;
        accInitAmount.value = '';
        accInitModal.style.display = 'flex';
      });
    }
    [a.name, a.balance.toFixed(2), a.desc || '', a.created].forEach(v => { const td = document.createElement('td'); td.textContent = v; tr.appendChild(td); });
    tr.appendChild(ops);
    accRows.appendChild(tr);
    edit.addEventListener('click', e => {
      e.preventDefault();
      pendingAccEditIndex = i;
      accEditName.value = a.name || '';
      accEditDesc.value = a.desc || '';
      accEditModal.style.display = 'flex';
    });
    del.addEventListener('click', e => {
      e.preventDefault();
      const used = records.some(r => r.method === a.name);
      if (used) { alert('该账户有相关信息正在使用中无法被删除'); return; }
      pendingAccDeleteIndex = i;
      accDeleteModal.style.display = 'flex';
    });
  });
}
const accInitModal = document.getElementById('acc-init-modal');
const accInitAmount = document.getElementById('acc-init-amount');
const accInitCancel = document.getElementById('acc-init-cancel');
const accInitOk = document.getElementById('acc-init-ok');
let pendingAccInitIndex = null;
const accCreateModal = document.getElementById('acc-create-modal');
const accCreateForm = document.getElementById('acc-create-form');
const accCreateCancel = document.getElementById('acc-create-cancel');
const accCreateName = document.getElementById('acc-create-name');
const accCreateDesc = document.getElementById('acc-create-desc');
const accDeleteModal = document.getElementById('acc-delete-modal');
const accDeleteCancel = document.getElementById('acc-delete-cancel');
const accDeleteOk = document.getElementById('acc-delete-ok');
let pendingAccDeleteIndex = null;
const accEditModal = document.getElementById('acc-edit-modal');
const accEditForm = document.getElementById('acc-edit-form');
const accEditCancel = document.getElementById('acc-edit-cancel');
const accEditName = document.getElementById('acc-edit-name');
const accEditDesc = document.getElementById('acc-edit-desc');
let pendingAccEditIndex = null;
accInitCancel?.addEventListener('click', () => {
  accInitModal.style.display = 'none';
  pendingAccInitIndex = null;
});
accInitOk?.addEventListener('click', async () => {
  if (pendingAccInitIndex != null) {
    const amt = parseFloat(accInitAmount.value || '0');
    if (isNaN(amt)) return;
    accountsData[pendingAccInitIndex].balance = amt;
    accountsData[pendingAccInitIndex].initialSet = true;
    accInitModal.style.display = 'none';
    await apiAccountInit(accountsData[pendingAccInitIndex]?.name || '', amt);
    await apiAccountsList();
    refreshAccountOptions();
    renderAccounts();
    saveJSON('accountsData', accountsData);
    pendingAccInitIndex = null;
  }
});
accCreateCancel?.addEventListener('click', () => {
  accCreateModal.style.display = 'none';
});
accCreateForm?.addEventListener('submit', async e => {
  e.preventDefault();
  const name = (accCreateName?.value || '').trim();
  const desc = (accCreateDesc?.value || '').trim();
  if (!name) return;
  if (accountsData.some(a => a.name === name)) { alert('账户名称已存在'); return; }
  const now = new Date();
  const created = `${now.getFullYear()}/${String(now.getMonth()+1).padStart(2,'0')}/${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
  accountsData.push({ name, balance:0, desc, created, initialSet:false });
  accCreateModal.style.display = 'none';
  await apiAccountCreate({ name, balance:0, desc, created, initialSet:false });
  await apiAccountsList();
  refreshAccountOptions();
  renderAccounts();
  saveJSON('accountsData', accountsData);
});
accEditCancel?.addEventListener('click', () => {
  accEditModal.style.display = 'none';
  pendingAccEditIndex = null;
});
accEditForm?.addEventListener('submit', async e => {
  e.preventDefault();
  if (pendingAccEditIndex == null) return;
  const name = (accEditName?.value || '').trim();
  const desc = (accEditDesc?.value || '').trim();
  if (!name) return;
  const oldName = accountsData[pendingAccEditIndex].name;
  if (name !== oldName && accountsData.some((x, i) => x.name === name && i !== pendingAccEditIndex)) { alert('账户名称已存在'); return; }
  accountsData[pendingAccEditIndex].name = name;
  accountsData[pendingAccEditIndex].desc = desc;
  records.forEach(r => { if (r.method === oldName) r.method = name; });
  accEditModal.style.display = 'none';
  pendingAccEditIndex = null;
  await apiAccountUpdateByName({ name: oldName, newName: name, desc });
  await apiAccountsList();
  refreshAccountOptions();
  renderAccounts();
  saveJSON('accountsData', accountsData);
  saveJSON('records', records);
});
accDeleteCancel?.addEventListener('click', () => {
  accDeleteModal.style.display = 'none';
  pendingAccDeleteIndex = null;
});
accDeleteOk?.addEventListener('click', async () => {
  if (pendingAccDeleteIndex != null) {
    const name = accountsData[pendingAccDeleteIndex]?.name || '';
    const ok = await apiAccountDeleteByName(name);
    if (ok) accountsData.splice(pendingAccDeleteIndex,1);
    await apiAccountsList();
    refreshAccountOptions();
    renderAccounts();
    saveJSON('accountsData', accountsData);
  }
  accDeleteModal.style.display = 'none';
  pendingAccDeleteIndex = null;
});
const clientDD = document.getElementById('client-dd');
const clientSearch = document.getElementById('client-search');
const clientList = document.getElementById('client-list');
const clientPlus = document.getElementById('client-plus');
const clientWrap = document.getElementById('client-wrap');
const clientModal = document.getElementById('client-modal');
const clientModalForm = document.getElementById('client-modal-form');
const clientCancel = document.getElementById('client-cancel');
let clientModalTab = 'customers';
const fileViewer = document.getElementById('file-viewer');
const fileViewerBox = document.getElementById('file-viewer-box');
function allContacts() {
  return [...contactsData.customers, ...contactsData.merchants, ...contactsData.others];
}
function renderClientDropdown() {
  const q = (clientSearch.value || '').trim();
  const data = allContacts().filter(x => {
    if (!q) return true;
    return [x.name,x.contact,x.phone,x.city,(x.remark||'')].some(v => (v||'').includes(q));
  });
  clientList.innerHTML = '';
  data.forEach(item => {
    const row = document.createElement('div');
    row.className = 'dd-item';
    const left = document.createElement('div');
    left.textContent = item.name;
    const right = document.createElement('div');
    right.style.color = '#94a3b8';
    right.textContent = `${item.contact || ''} ${item.phone || ''} ${item.city || ''}`.trim();
    row.append(left, right);
    row.addEventListener('click', () => {
      entryClient.value = item.name;
      clientDD.style.display = 'none';
    });
    clientList.appendChild(row);
  });
}
function openClientDropdown() {
  clientDD.style.display = 'block';
  clientSearch.value = '';
  renderClientDropdown();
  const entryCard = document.getElementById('entry-form')?.closest('.card');
  if (entryCard) {
    const cr = entryCard.getBoundingClientRect();
    const gap = 16;
    clientDD.style.position = 'fixed';
    clientDD.style.left = `${Math.max(0, cr.left - cr.width - gap)}px`;
    clientDD.style.top = `${cr.top}px`;
    clientDD.style.width = `${cr.width}px`;
    clientDD.style.height = `${cr.height}px`;
    clientDD.style.zIndex = '90';
    const head = clientDD.querySelector('.dd-head');
    const list = clientDD.querySelector('.dd-list');
    const headH = head ? head.getBoundingClientRect().height : 48;
    if (list) { list.style.maxHeight = `${cr.height - headH - 24}px`; list.style.overflow = 'auto'; }
  }
  clientSearch.focus();
}
entryClient.addEventListener('focus', openClientDropdown);
entryClient.addEventListener('click', openClientDropdown);
clientSearch.addEventListener('input', renderClientDropdown);
document.addEventListener('click', (e) => {
  if (!clientWrap.contains(e.target) && !clientDD.contains(e.target)) clientDD.style.display = 'none';
});
clientPlus?.addEventListener('click', () => {
  clientDD.style.display = 'none';
  clientModal.style.display = 'flex';
  clientModalTab = 'customers';
  document.querySelectorAll('.pill').forEach(p => p.classList.toggle('active', p.getAttribute('data-target') === clientModalTab));
});
document.querySelectorAll('.pill[data-target]').forEach(p => {
  p.addEventListener('click', () => {
    clientModalTab = p.getAttribute('data-target');
    document.querySelectorAll('.pill').forEach(x => x.classList.remove('active'));
    p.classList.add('active');
  });
});
clientCancel?.addEventListener('click', () => {
  clientModal.style.display = 'none';
});
clientModalForm?.addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('m-name').value.trim();
  const company = document.getElementById('m-company').value.trim();
  const code = document.getElementById('m-code').value.trim();
  const contact = document.getElementById('m-contact').value.trim();
  const phone = document.getElementById('m-phone').value.trim();
  const country = document.getElementById('m-country').value.trim();
  const address = document.getElementById('m-address').value.trim();
  const zip = document.getElementById('m-zip').value.trim();
  const city = document.getElementById('m-city').value.trim();
  const remark = document.getElementById('m-remark').value.trim();
  if (!name) return;
  const now = new Date();
  const created = `${now.getFullYear()}/${String(now.getMonth()+1).padStart(2,'0')}/${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
  const ownerLabel = clientModalTab==='customers'?'客户':clientModalTab==='merchants'?'商家':'其它';
  contactsData[clientModalTab].push({ name, contact, phone, city, remark, owner: ownerLabel, created, company, code, country, address, zip });
  ['m-name','m-company','m-code','m-contact','m-phone','m-country','m-address','m-zip','m-city','m-remark'].forEach(id => document.getElementById(id).value='');
  clientModal.style.display = 'none';
  entryClient.value = name;
  renderClientDropdown();
  saveJSON('contactsData', contactsData);
});
fileViewer.addEventListener('click', (e) => {
  if (e.target === fileViewer) fileViewer.style.display = 'none';
});
function getCatChildrenByName(name) {
  const cat = categoriesData.find(c => c.name === name);
  return cat ? cat.children : [];
}
function refreshLedgerTypeOptions() {
  const prev = entryType.value;
  entryType.innerHTML = '<option value="">请选择类型</option>';
  categoriesData.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.name; opt.textContent = c.name;
    entryType.appendChild(opt);
  });
  if (categoriesData.some(c => c.name === prev)) entryType.value = prev;
}
function setCategories() {
  const t = entryType.value;
  const list = getCatChildrenByName(t);
  const prev = entryCategory.value;
  entryCategory.innerHTML = '<option value="">请选择子类目</option>';
  list.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    entryCategory.appendChild(opt);
  });
  if (list.includes(prev)) entryCategory.value = prev;
}
entryType.addEventListener('change', setCategories);
const entryDoc = document.getElementById('entry-doc');
entryCategory.addEventListener('change', () => { entryDoc?.focus(); });
function linkDocToPayable() {
  const doc = (entryDoc?.value || '').trim();
  const type = entryType.value;
  if (!doc) return;
  const targetType = type === '收入' ? '应收账款' : (type === '支出' ? '应付账款' : null);
  if (!targetType) return;
  const rec = payRecords.find(r => (r.doc||'') === doc && r.type === targetType);
  if (rec) {
    entryClient.value = rec.partner || '';
    const remaining = Math.max(0, (rec.amount||0) - (rec.paid||0));
    entryAmount.value = String(remaining || rec.amount || 0);
    if (typeof clientDD !== 'undefined' && clientDD) clientDD.style.display = 'none';
    entryMethod?.focus();
  }
}
entryDoc?.addEventListener('blur', linkDocToPayable);
entryDoc?.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') {
    linkDocToPayable();
    entryMethod?.focus();
  }
});
function adjustSelect(sel, delta) {
  if (!sel) return;
  const len = sel.options.length;
  let idx = sel.selectedIndex;
  idx = Math.max(0, Math.min(len-1, idx + delta));
  sel.selectedIndex = idx;
  sel.dispatchEvent(new Event('change', { bubbles: true }));
}
entryMethod?.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') { e.preventDefault(); adjustSelect(entryMethod, 1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); adjustSelect(entryMethod, -1); }
  else if (e.key === 'Enter') { e.preventDefault(); entryMethod.blur(); }
});
let ledgerEditingId = null;
function setLedgerEdit(rec) {
  ledgerEditingId = rec.id || null;
  if (entryType) entryType.value = rec.type || '';
  setCategories();
  if (entryCategory) entryCategory.value = rec.category || '';
  if (entryDoc) entryDoc.value = rec.doc || '';
  if (entryClient) entryClient.value = rec.client || '';
  if (entryAmount) entryAmount.value = String(rec.amount || 0);
  if (entryMethod) entryMethod.value = rec.method || '';
  if (entryNotes) entryNotes.value = rec.notes || '';
  if (entryFile) entryFile.value = '';
  if (entrySubmitBtn) entrySubmitBtn.textContent = '保存修改';
  entryForm?.scrollIntoView({ behavior:'smooth', block:'start' });
}
function clearLedgerEdit() {
  ledgerEditingId = null;
  if (entrySubmitBtn) entrySubmitBtn.textContent = '提交';
}
function render(data) {
  rows.innerHTML = '';
  if (!data.length) {
    const tr = document.createElement('tr');
    tr.className = 'empty';
    const td = document.createElement('td');
    td.colSpan = 11;
    td.textContent = '暂无流水记录';
    tr.appendChild(td);
    rows.appendChild(tr);
    return;
  }
  for (const r of data) {
    const tr = document.createElement('tr');
    const canEdit = r.confirmed === false && r.id;
    const amt = (r.type === '开支' || r.type === '支出') ? (-r.amount).toFixed(2) : r.amount.toFixed(2);
    const makeTd = (text) => {
      const td = document.createElement('td');
      td.textContent = text;
      return td;
    };
    tr.appendChild(makeTd(r.type || ''));
    tr.appendChild(makeTd(r.category || ''));
    tr.appendChild(makeTd(r.doc || ''));
    tr.appendChild(makeTd(r.client || ''));
    tr.appendChild(makeTd(amt));
    tr.appendChild(makeTd(r.method || ''));
    const tdFile = document.createElement('td');
    if (r.fileUrl) {
      if ((r.fileType || '').includes('pdf') || /\.pdf$/i.test(r.fileName||'')) {
        const span = document.createElement('span');
        span.className = 'thumb-pdf';
        span.textContent = 'PDF';
        span.addEventListener('click', () => {
          fileViewerBox.innerHTML = '';
          const emb = document.createElement('embed');
          emb.src = r.fileUrl;
          emb.type = 'application/pdf';
          fileViewerBox.appendChild(emb);
          fileViewer.style.display = 'flex';
        });
        tdFile.appendChild(span);
      } else {
        const img = document.createElement('img');
        img.className = 'thumb-img';
        img.src = r.fileUrl;
        img.alt = r.fileName || '附件';
        img.addEventListener('click', () => {
          fileViewerBox.innerHTML = '';
          const full = document.createElement('img');
          full.src = r.fileUrl;
          fileViewerBox.appendChild(full);
          fileViewer.style.display = 'flex';
        });
        tdFile.appendChild(img);
      }
    } else {
      tdFile.textContent = r.file ? r.file : '-';
    }
    tr.appendChild(tdFile);
    tr.appendChild(makeTd(r.entry || ''));
    tr.appendChild(makeTd(r.notes || ''));
    tr.appendChild(makeTd(r.date || ''));
    const tdOps = document.createElement('td');
    if (canEdit) {
      const editBtn = document.createElement('a'); editBtn.href = '#'; editBtn.textContent = '修改'; editBtn.className = 'link-blue';
      const okBtn = document.createElement('a'); okBtn.href = '#'; okBtn.textContent = '确认'; okBtn.className = 'link-green';
      tdOps.append(editBtn, document.createTextNode(' '), okBtn);
      editBtn.addEventListener('click', e => {
        e.preventDefault();
        setLedgerEdit(r);
      });
      okBtn.addEventListener('click', async e => {
        e.preventDefault();
        try {
          await apiFetchJSON('/api/ledger/' + String(r.id) + '/confirm', { method:'PUT' });
          clearLedgerEdit();
          loadLedgerFromServer();
          loadPayablesFromServer();
          apiAccountsList().then(() => { refreshAccountOptions(); renderAccounts(); });
        } catch {}
      });
    }
    tr.appendChild(tdOps);
    if (r.type === '收入') tr.classList.add('row-income');
    if (r.type === '开支' || r.type === '支出') tr.classList.add('row-expense');
    rows.appendChild(tr);
  }
}
function getFilters() {
  const t = filterType.value;
  const key = filterKey.value.trim();
  const s = filterStart.value ? new Date(filterStart.value) : null;
  const e = filterEnd.value ? new Date(filterEnd.value) : null;
  return { t, key, s, e };
}
function applyFilters() {
  const { t, key, s, e } = getFilters();
  const outAll = records.filter(r => {
    if (t !== 'all' && r.type !== t) return false;
    if (ledgerHdrType !== 'all') {
      if (ledgerHdrType === '开支') { if (!(r.type === '开支' || r.type === '支出')) return false; }
      else if (r.type !== ledgerHdrType) return false;
    }
    if (ledgerHdrCat && r.category !== ledgerHdrCat) return false;
    if (ledgerHdrOwner) {
      const owner = clientOwner(r.client || '');
      if (owner !== ledgerHdrOwner) return false;
    }
    if (key && !((r.client||'').includes(key) || (r.notes||'').includes(key))) return false;
    const d = new Date(r.date);
    if (s && d < s) return false;
    if (e && d > e) return false;
    return true;
  });
  function ts(r) {
    const t1 = r.createdAt || 0;
    const t2 = r.dateTime ? Date.parse(r.dateTime) : 0;
    const t3 = r.date ? Date.parse(r.date) : 0;
    return t1 || t2 || t3 || 0;
  }
  outAll.sort((a,b) => ts(b) - ts(a));
  const total = outAll.length;
  const totalPages = Math.max(1, Math.ceil(total / ledgerPageSize));
  if (ledgerPage > totalPages) ledgerPage = totalPages;
  const startIdx = (ledgerPage - 1) * ledgerPageSize;
  const out = outAll.slice(startIdx, startIdx + ledgerPageSize);
  render(out);
  if (ledgerTableWrap) ledgerTableWrap.scrollTop = 0;
  updateLedgerHeaderCover();
  const gp = document.getElementById('global-pager'); if (gp) gp.style.display = 'flex';
  if (ledgerPager) {
    ledgerPager.innerHTML = '';
    ledgerPager.style.display = 'flex';
    const makeBtn = (label, page, disabled=false, active=false) => {
      const b = document.createElement('a');
      b.href = '#'; b.textContent = label;
      b.style.padding = '4px 8px';
      b.style.border = '1px solid #334155';
      b.style.borderRadius = '4px';
      b.style.color = active ? '#000' : '#cbd5e1';
      b.style.background = active ? '#cbd5e1' : 'transparent';
      b.style.pointerEvents = disabled ? 'none' : 'auto';
      b.style.opacity = disabled ? '0.4' : '1';
      b.addEventListener('click', e => { e.preventDefault(); ledgerPage = page; applyFilters(); });
      ledgerPager.appendChild(b);
    };
    makeBtn('«', Math.max(1, ledgerPage-1), ledgerPage<=1);
    const maxButtons = 9;
    let start = Math.max(1, ledgerPage - Math.floor(maxButtons/2));
    let end = Math.min(totalPages, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);
    for (let p = start; p <= end; p++) makeBtn(String(p), p, false, p===ledgerPage);
    makeBtn('»', Math.min(totalPages, ledgerPage+1), ledgerPage>=totalPages);
  }
  const infoEl = document.getElementById('pay-footer-info');
  if (infoEl) {
    const totalCount = (records || []).length;
    const todayStr = (() => { const d = new Date(); const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const dd=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${dd}`; })();
    const toTs = r => r.createdAt || (r.dateTime ? Date.parse(r.dateTime) : 0) || (r.date ? Date.parse(r.date) : 0) || 0;
    const todayCount = (records || []).filter(r => {
      const t = toTs(r); if (!t) return false;
      const d = new Date(t); const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const dd=String(d.getDate()).padStart(2,'0');
      return `${y}-${m}-${dd}` === todayStr;
    }).length;
    const latestTs = Math.max(0, ...((records||[]).map(toTs)));
    const latestCount = latestTs ? (records || []).filter(r => toTs(r) === latestTs).length : 0;
    const mk = (text) => { const s = document.createElement('span'); s.className = 'info-pill'; s.textContent = text; return s; };
    infoEl.innerHTML = '';
    infoEl.appendChild(mk(`共 ${totalCount} 条记录`));
    infoEl.appendChild(mk(`今日上传 ${todayCount} 条`));
    infoEl.appendChild(mk(`最后次上传 ${latestCount || 1} 条`));
  }
}
filterKey.addEventListener('input', applyFilters);
filterType.addEventListener('change', () => { ledgerPage = 1; applyFilters(); });
filterStart.addEventListener('change', () => { ledgerPage = 1; applyFilters(); });
filterEnd.addEventListener('change', () => { ledgerPage = 1; applyFilters(); });
document.getElementById('system-clear-ledger')?.addEventListener('click', async () => {
  if (!confirm('确认清空收支记账的所有数据？此操作不可撤销。')) return;
  try {
    await apiFetchJSON('/api/ledger', { method:'DELETE' });
    records.splice(0, records.length);
    saveJSON('records', records);
    loadLedgerFromServer();
    loadPayablesFromServer();
    apiAccountsList().then(() => { refreshAccountOptions(); renderAccounts(); });
    renderContacts();
  } catch {}
});
document.getElementById('system-clear-pay')?.addEventListener('click', async () => {
  if (!confirm('确定清空应收/应付所有记录？此操作不可恢复')) return;
  try {
    await apiFetchJSON('/api/payables', { method:'DELETE' });
    payRecords.splice(0, payRecords.length);
    saveJSON('payRecords', payRecords);
    payPage = 1;
    loadPayablesFromServer();
    renderContacts();
  } catch {}
});
document.getElementById('entry-form').addEventListener('submit', async e => {
  e.preventDefault();
  [document.getElementById('entry-doc'), entryClient, entryAmount, entryMethod].forEach(el => el?.classList.remove('invalid'));
  const u = getAuthUser(); const roleName = u?.role || '';
  if (roleName !== '超级管理员') {
    const role = rolesData.find(r => r.name === roleName);
    const allowed = !!(role && role.perms && role.perms.ledger && role.perms.ledger.create);
    if (!allowed) { alert('当前角色无“收支记账新增”权限'); return; }
  }
  const type = entryType.value;
  const category = entryCategory.value;
  const doc = (document.getElementById('entry-doc')?.value || '').trim();
  const clientVal = (entryClient.value || '').trim();
  const amountStr = (entryAmount.value || '').trim();
  const method = entryMethod.value;
  if (!type || !category) return;
  const invalidEls = [];
  if (!doc) invalidEls.push(document.getElementById('entry-doc'));
  if (!clientVal) invalidEls.push(entryClient);
  if (!amountStr) invalidEls.push(entryAmount);
  if (!method) invalidEls.push(entryMethod);
  if (invalidEls.length) {
    invalidEls.forEach(el => {
      if (!el) return;
      el.classList.add('invalid');
      const clear = () => el.classList.remove('invalid');
      el.addEventListener('input', clear, { once: true });
      el.addEventListener('change', clear, { once: true });
    });
    invalidEls[0]?.focus();
    return;
  }
  const amount = parseFloat(amountStr || '0');
  const fileObj = entryFile.files[0] || null;
  const file = fileObj ? fileObj.name : '';
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const dateTime = `${date} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
  const rec = { type, category, doc, client: clientVal, amount, method, file, entry:'手动', notes: entryNotes.value.trim(), date, dateTime, createdAt: Date.now(), confirmed: false };
  if (fileObj) {
    const extOk = /(\.jpe?g|\.pdf)$/i.test(fileObj.name);
    if (!extOk) { alert('仅支持 JPG 或 PDF 文件'); return; }
    rec.fileType = fileObj.type || '';
    rec.fileName = fileObj.name;
    rec.fileUrl = URL.createObjectURL(fileObj);
  }
  try {
    if (ledgerEditingId) {
      await apiFetchJSON('/api/ledger/' + String(ledgerEditingId), {
        method:'PUT',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ type, category, doc, client: clientVal, amount, method, file:'', notes: rec.notes || '', date, dateTime, createdBy: (getAuthUser()?.name || '') })
      });
      clearLedgerEdit();
    } else {
      await apiFetchJSON('/api/ledger', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ type, category, doc, client: clientVal, amount, method, file:'', notes: rec.notes || '', date, dateTime, createdBy: (getAuthUser()?.name || ''), confirmed:false })
      });
    }
  } catch {}
  loadLedgerFromServer();
  document.getElementById('entry-doc').value = '';
  entryClient.value = '';
  entryAmount.value = '';
  entryMethod.value = '';
  entryFile.value = '';
  entryNotes.value = '';
  [document.getElementById('entry-doc'), entryClient, entryAmount, entryMethod].forEach(el => el?.classList.remove('invalid'));
  ledgerPage = 1;
  applyFilters();
  saveJSON('records', records.map(r => {
    const { fileUrl, ...rest } = r;
    return rest;
  }));
  saveJSON('accountsData', accountsData);
  if (document.getElementById('page-home')?.style.display === 'block') renderHomeChart('month');
});
const payRows = document.getElementById('pay-rows');
const payType = document.getElementById('pay-type');
const payPartner = document.getElementById('pay-partner');
const partnerAdd = document.getElementById('partner-add');
const payDoc = document.getElementById('pay-doc');
const paySales = document.getElementById('pay-sales');
const payAmount = document.getElementById('pay-amount');
const payTrust = document.getElementById('pay-trust');
const payNotes = document.getElementById('pay-notes');
const payForm = document.getElementById('pay-form');
const paySubmitBtn = payForm?.querySelector('button[type="submit"]');
function payDocExists(doc, recType, excludeId) {
  const d = String(doc || '').trim();
  if (!d) return false;
  return payRecords.some(r => String(r.doc||'').trim() === d && r.type === recType && (!excludeId || r.id !== excludeId));
}
function setPayDocInvalid(flag) {
  if (!payDoc) return;
  payDoc.style.color = flag ? 'var(--red)' : '';
  const lbl = document.getElementById('pay-label-doc');
  if (lbl) {
    if (flag) lbl.classList.add('invalid-label'); else lbl.classList.remove('invalid-label');
  }
}
function validatePayDoc(showAlert) {
  const type = payType?.value || '';
  const doc = (payDoc?.value || '').trim();
  if (!type || !doc) { setPayDocInvalid(false); return; }
  const exists = payDocExists(doc, type, payEditingId);
  setPayDocInvalid(exists);
  if (exists && showAlert) alert('凭证号已存在');
}
payDoc?.addEventListener('input', () => validatePayDoc(false));
payDoc?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    validatePayDoc(true);
    if (payDoc.style.color) { e.preventDefault(); e.stopPropagation(); }
  }
});
payType?.addEventListener('change', () => validatePayDoc(false));
const payImportFile = document.getElementById('pay-import-file');
payImportFile?.addEventListener('click', () => { try { payImportFile.value = ''; } catch {} });
const payImportHint = document.getElementById('pay-import-hint');
const payImportModal = document.getElementById('pay-import-modal');
const payImportRows = document.getElementById('pay-import-rows');
const payImportSummary = document.getElementById('pay-import-summary');
const payImportCancel = document.getElementById('pay-import-cancel');
const payImportCommit = document.getElementById('pay-import-commit');
const sumRecvEl = document.getElementById('sum-recv');
const sumPayEl = document.getElementById('sum-pay');
const payFilterKey = document.getElementById('pay-filter-key');
const payExportBtn = document.getElementById('pay-export');
const payClearBtn = document.getElementById('pay-clear');
let paySubmitLock = false;
let payLastPageData = [];
const payPager = document.getElementById('global-pager-controls') || document.getElementById('pay-pager');
const payFooterInfo = document.getElementById('pay-footer-info');
const payTableWrap = document.getElementById('pay-table-wrap');
const thType = document.getElementById('th-type');
const thTypeDD = document.getElementById('th-type-dd');
const thTypeList = document.getElementById('th-type-list');
const thTypeLabel = document.getElementById('th-type-label');
const thSales = document.getElementById('th-sales');
const thSalesDD = document.getElementById('th-sales-dd');
const thSalesList = document.getElementById('th-sales-list');
const thSalesLabel = document.getElementById('th-sales-label');
const thArrears = document.getElementById('th-arrears');
const thArrearsDD = document.getElementById('th-arrears-dd');
const thArrearsList = document.getElementById('th-arrears-list');
const thArrearsLabel = document.getElementById('th-arrears-label');
const thTrust = document.getElementById('th-trust');
const thTrustDD = document.getElementById('th-trust-dd');
const thTrustList = document.getElementById('th-trust-list');
const thTrustLabel = document.getElementById('th-trust-label');
let payFilterSalesName = '';
let payFilterStatus = 'all';
let payFilterType = 'all';
let payFilterOverdue = 'all';
let payPage = 1;
const payPageSize = 100;
function setLabel(el, text, active) {
  if (!el) return;
  el.textContent = text + ' ▾';
  el.style.color = active ? '#ef4444' : '';
}
function openTypeFilter() {
  thTypeDD.style.display = 'block';
  thTypeList.innerHTML = '';
  const addItem = (label, val) => {
    const row = document.createElement('div'); row.className='dd-item'; row.textContent = label;
    row.addEventListener('click', () => { payFilterType = val; thTypeDD.style.display='none'; setLabel(thTypeLabel, val==='all'?'款项类型':'应'+(val==='recv'?'收':'付'), val!=='all'); payPage = 1; renderPayables(); });
    thTypeList.appendChild(row);
  };
  addItem('全部', 'all');
  addItem('应收', 'recv');
  addItem('应付', 'pay');
}
function openSalesFilter() {
  thSalesDD.style.display = 'block';
  thSalesList.innerHTML = '';
  const addItem = (label, val) => {
    const row = document.createElement('div'); row.className='dd-item'; row.textContent = label;
    row.addEventListener('click', () => { payFilterSalesName = val; thSalesDD.style.display='none'; setLabel(thSalesLabel, val ? (val==='__none__'?'无业务员':val) : '业务员', !!val); payPage = 1; renderPayables(); });
    thSalesList.appendChild(row);
  };
  addItem('全部', '');
  addItem('无业务员', '__none__');
  (salesData || []).forEach(s => addItem(s.name, s.name));
}
function openArrearsFilter() {
  thArrearsDD.style.display = 'block';
  thArrearsList.innerHTML = '';
  const addItem = (label, val) => {
    const row = document.createElement('div'); row.className='dd-item'; row.textContent = label;
    row.addEventListener('click', () => { payFilterStatus = val; thArrearsDD.style.display='none'; setLabel(thArrearsLabel, val==='all'?'欠款':(val==='arrears'?'欠款订单':'订单完成'), val!=='all'); payPage = 1; renderPayables(); });
    thArrearsList.appendChild(row);
  };
  addItem('全部订单', 'all');
  addItem('欠款订单', 'arrears');
  addItem('订单完成', 'done');
}
function openTrustFilter() {
  thTrustDD.style.display = 'block';
  thTrustList.innerHTML = '';
  const addItem = (label, val) => {
    const row = document.createElement('div'); row.className='dd-item'; row.textContent = label;
    row.addEventListener('click', () => { payFilterOverdue = val; thTrustDD.style.display='none'; setLabel(thTrustLabel, val==='all'?'信任天数':(val==='overdue'?'已逾期':'未逾期'), val!=='all'); payPage = 1; renderPayables(); });
    thTrustList.appendChild(row);
  };
  addItem('全部', 'all');
  addItem('已逾期', 'overdue');
  addItem('未逾期', 'not');
}
thType?.addEventListener('click', (e) => { e.stopPropagation(); openTypeFilter(); });
thSales?.addEventListener('click', (e) => { e.stopPropagation(); openSalesFilter(); });
thArrears?.addEventListener('click', (e) => { e.stopPropagation(); openArrearsFilter(); });
thTrust?.addEventListener('click', (e) => { e.stopPropagation(); openTrustFilter(); });
const typeSwitch = document.getElementById('type-switch');
const typeItems = typeSwitch ? typeSwitch.querySelectorAll('.type-item') : [];
function setPayType(val) {
  payType.value = val;
  typeItems.forEach(btn => {
    const is = btn.getAttribute('data-type') === val;
    btn.classList.toggle('active', is);
    btn.classList.toggle('recv', is && val === '应收账款');
    btn.classList.toggle('pay', is && val === '应付账款');
  });
}
typeItems.forEach(btn => {
  btn.addEventListener('click', () => setPayType(btn.getAttribute('data-type')));
});
setPayType('应收账款');
const payWrap = document.getElementById('pay-wrap');
const payDD = document.getElementById('pay-dd');
const paySearch = document.getElementById('pay-search');
const payList = document.getElementById('pay-list');
partnerAdd?.addEventListener('click', () => {
  const name = payPartner.value.trim();
  if (!name) return;
  if (!partners.includes(name)) partners.push(name);
});
function renderPayDropdown() {
  const q = (paySearch?.value || payPartner.value || '').trim();
  const data = allContacts().filter(x => {
    if (!q) return true;
    return [x.name,x.contact,x.phone,x.city,(x.remark||'')].some(v => (v||'').includes(q));
  });
  payList.innerHTML = '';
  data.forEach(item => {
    const row = document.createElement('div');
    row.className = 'dd-item';
    const left = document.createElement('div');
    left.textContent = item.name;
    const right = document.createElement('div');
    right.style.color = '#94a3b8';
    right.textContent = `${item.contact || ''} ${item.phone || ''} ${item.city || ''}`.trim();
    row.append(left, right);
    row.addEventListener('click', () => {
      payPartner.value = item.name;
      if (paySales) {
        const bound = (item.sales || '').trim();
        paySales.value = bound && [...paySales.options].some(o => o.value === bound) ? bound : '';
      }
      payDD.style.display = 'none';
      document.getElementById('pay-label-partner')?.classList.remove('invalid-label');
    });
    payList.appendChild(row);
  });
}
function openPayDropdown() {
  const card = document.getElementById('pay-form')?.closest('.card') || document.querySelector('#page-payables .row .card:nth-child(2)');
  const cr = card?.getBoundingClientRect();
  const ddHead = payDD.querySelector('.dd-head');
  if (ddHead) ddHead.style.display = 'block';
  payDD.style.display = 'block';
  payDD.style.position = 'fixed';
  if (cr) {
    const gap = 16;
    payDD.style.left = `${Math.max(0, cr.left - cr.width - gap)}px`;
    payDD.style.top = `${cr.top}px`;
    payDD.style.width = `${cr.width}px`;
    payDD.style.height = `${cr.height}px`;
    const head = payDD.querySelector('.dd-head');
    const list = payDD.querySelector('.dd-list');
    const headH = head ? head.getBoundingClientRect().height : 48;
    if (list) { list.style.maxHeight = `${cr.height - headH - 24}px`; list.style.overflow = 'auto'; }
  }
  payDD.style.zIndex = '90';
  renderPayDropdown();
}
payPartner.addEventListener('focus', openPayDropdown);
payPartner.addEventListener('click', openPayDropdown);
payPartner.addEventListener('input', renderPayDropdown);
payPartner.addEventListener('input', () => {
  if ((payPartner.value || '').trim()) document.getElementById('pay-label-partner')?.classList.remove('invalid-label');
});
paySearch?.addEventListener('input', renderPayDropdown);
document.addEventListener('click', (e) => {
  if (!payWrap?.contains(e.target) && !payDD?.contains(e.target)) payDD.style.display = 'none';
  if (!thType?.contains(e.target)) thTypeDD.style.display = 'none';
  if (!thSales?.contains(e.target)) thSalesDD.style.display = 'none';
  if (!thArrears?.contains(e.target)) thArrearsDD.style.display = 'none';
  if (!thTrust?.contains(e.target)) thTrustDD.style.display = 'none';
  if (!ldType?.contains(e.target)) ldTypeDD.style.display = 'none';
  if (!ldCat?.contains(e.target)) ldCatDD.style.display = 'none';
  if (!ldOwner?.contains(e.target)) ldOwnerDD.style.display = 'none';
});
const payHistoryModal = document.getElementById('pay-history-modal');
const payHistoryHead = document.getElementById('pay-history-head');
const payHistoryList = document.getElementById('pay-history-list');
const payHistoryClose = document.getElementById('pay-history-close');
const payHistoryNotesText = document.getElementById('pay-history-notes-text');
const payHistoryNotesInput = document.getElementById('pay-history-notes-input');
const payHistoryNotesAdd = document.getElementById('pay-history-notes-add');
let payHistoryCurrentRec = null;
function openPayHistory(rec) {
  const total = (rec.amount || 0);
  const paid = (rec.paid || 0);
  const arrears = Math.max(0, total - paid);
  payHistoryHead.innerHTML = `<div>单据号：${rec.doc || ''}　往来单位：${rec.partner || ''}　金额：${total.toFixed(2)}　已付：${paid.toFixed(2)}　欠款：${arrears.toFixed(2)}</div>`;
  payHistoryNotesText.textContent = rec.notes || '';
  if (payHistoryNotesInput) payHistoryNotesInput.value = '';
  payHistoryCurrentRec = rec;
  const hist = rec.history || [];
  payHistoryList.innerHTML = '';
  if (!hist.length) {
    const div = document.createElement('div'); div.textContent = '暂无历史记录';
    payHistoryList.appendChild(div);
  } else {
    hist.forEach(h => {
      const row = document.createElement('div');
      const amt = typeof h.amount === 'number' ? h.amount.toFixed(2) : (h.amount || '');
      row.textContent = `${h.date || ''}  操作人员：${h.user || ''}  操作：${h.kind || ''}${amt ? '  金额：'+amt : ''}${h.method ? '  方式：'+h.method : ''}${h.notes ? '  备注：'+h.notes : ''}`;
      payHistoryList.appendChild(row);
    });
  }
  payHistoryModal.style.display = 'flex';
}
payHistoryClose?.addEventListener('click', () => { payHistoryModal.style.display = 'none'; });
payHistoryNotesAdd?.addEventListener('click', () => {
  const rec = payHistoryCurrentRec;
  const text = (payHistoryNotesInput?.value || '').trim();
  if (!rec || !text || rec.confirmed === true) return;
  const now = new Date();
  const dt = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
  const user = (getAuthUser()?.name) || '';
  rec.history = rec.history || [];
  rec.history.push({ date: dt, user, kind: '备注', amount: '', partner: rec.partner, doc: rec.doc, notes: text });
  rec.notes = [rec.notes || '', text].filter(Boolean).join('\n');
  payHistoryNotesText.textContent = rec.notes || '';
  const row = document.createElement('div');
  row.textContent = `${dt}  操作人员：${user}  操作：备注  备注：${text}`;
  payHistoryList.appendChild(row);
  if (payHistoryNotesInput) payHistoryNotesInput.value = '';
  renderPayables();
  saveJSON('payRecords', payRecords);
  if (rec.id && rec.confirmed === false) {
    apiFetchJSON('/api/payables/' + String(rec.id), { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(rec) })
      .then(() => loadPayablesFromServer())
      .catch(() => {});
  }
});
const invoiceModal = document.getElementById('invoice-modal');
const invoiceForm = document.getElementById('invoice-form');
const invoiceNoEl = document.getElementById('invoice-no');
const invoiceDateEl = document.getElementById('invoice-date');
const invoiceAmountEl = document.getElementById('invoice-amount');
const invoiceCancel = document.getElementById('invoice-cancel');
let invoiceCurrentRec = null;
function openInvoiceModal(rec) {
  if (rec.confirmed === true) return;
  invoiceCurrentRec = rec;
  if (invoiceNoEl) invoiceNoEl.value = rec.invoiceNo || '';
  if (invoiceDateEl) invoiceDateEl.value = rec.invoiceDate || '';
  if (invoiceAmountEl) invoiceAmountEl.value = ((rec.invoiceAmount||0) > 0) ? String(rec.invoiceAmount) : '';
  if (invoiceModal) invoiceModal.style.display = 'flex';
}
invoiceCancel?.addEventListener('click', () => { if (invoiceModal) invoiceModal.style.display = 'none'; });
invoiceForm?.addEventListener('submit', e => {
  e.preventDefault();
  const rec = invoiceCurrentRec; if (!rec) return;
  const no = (invoiceNoEl?.value || '').trim();
  const date = invoiceDateEl?.value || '';
  const amt = parseFloat(invoiceAmountEl?.value || '');
  if (!no || !date || !Number.isFinite(amt)) return;
  rec.invoiceNo = no;
  rec.invoiceDate = date;
  rec.invoiceAmount = Math.max(0, amt);
  rec.history = rec.history || [];
  const now = new Date();
  const dt = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
  rec.history.push({ date: dt, user: (getAuthUser()?.name)||'', kind: '改为发票', notes: `发票号:${no} 发票日期:${date} 发票金额:${rec.invoiceAmount.toFixed(2)}` });
  saveJSON('payRecords', payRecords);
  renderPayables();
  if (rec.id && rec.confirmed === false) {
    apiFetchJSON('/api/payables/' + String(rec.id), { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(rec) })
      .then(() => loadPayablesFromServer())
      .catch(() => {});
  }
  if (invoiceModal) invoiceModal.style.display = 'none';
});
function trustLabelDisplay(rec) {
  if (rec.settled) return { label: '-', overdue: false };
  const dValRaw = rec.trustDays;
  if (dValRaw == null || isNaN(dValRaw)) return { label: '', overdue: false };
  if (dValRaw === 0) return { label: '立即', overdue: false };
  return { label: `${dValRaw}天`, overdue: false };
}
function summarizeNotes(text, perLine, maxLines) {
  const s = String(text || '');
  if (!s) return '';
  const lines = s.split(/\r?\n/);
  const out = [];
  let overflow = false;
  const take = Math.min(maxLines, lines.length);
  for (let i = 0; i < take; i++) {
    const chs = Array.from(lines[i] || '');
    if (chs.length > perLine) { out.push(chs.slice(0, perLine).join('')); overflow = true; }
    else { out.push(lines[i]); }
  }
  if (lines.length > maxLines) overflow = true;
  if (overflow && out.length) out[out.length - 1] = out[out.length - 1] + '…';
  return out.join('\n');
}
function setPayEdit(rec) {
  payEditingId = rec.id || null;
  setPayType(rec.type || '应收账款');
  if (payPartner) payPartner.value = rec.partner || '';
  if (payDoc) payDoc.value = rec.doc || '';
  if (paySales) {
    const sv = rec.sales || '';
    paySales.value = [...paySales.options].some(o => o.value === sv) ? sv : '';
  }
  if (payAmount) payAmount.value = String(rec.amount || 0);
  if (payTrust) payTrust.value = (rec.trustDays ?? '').toString();
  if (payNotes) payNotes.value = rec.notes || '';
  if (paySubmitBtn) paySubmitBtn.textContent = '保存修改';
  payForm?.scrollIntoView({ behavior:'smooth', block:'start' });
}
function clearPayEdit() {
  payEditingId = null;
  if (paySubmitBtn) paySubmitBtn.textContent = '提交';
}
function renderPayables() {
  const gp = document.getElementById('global-pager'); if (gp) gp.style.display = 'flex';
  if (paySales) {
    const prev = paySales.value;
    paySales.innerHTML = '<option value="">请选择业务员</option>';
    (salesData || []).forEach(s => {
      const opt = document.createElement('option'); opt.value = s.name; opt.textContent = s.name;
      paySales.appendChild(opt);
    });
    if ([...paySales.options].some(o => o.value === prev)) paySales.value = prev;
  }
  let recv = 0, pay = 0;
  for (const r of payRecords) {
    if (r.settled) continue;
    if (/应收/.test(r.type)) recv += r.amount || 0;
    else if (/应付/.test(r.type)) pay += r.amount || 0;
  }
  if (sumRecvEl) sumRecvEl.textContent = recv.toFixed(2);
  if (sumPayEl) sumPayEl.textContent = pay.toFixed(2);
  const key = (payFilterKey?.value || '').trim();
  let listAll = payRecords.filter(r => {
    if (!key) return true;
    return [r.partner||'', r.doc||'', r.notes||''].some(v => v.includes(key));
  });
  if (payFilterType !== 'all') {
    listAll = listAll.filter(r => (payFilterType === 'recv' ? /应收/.test(r.type) : /应付/.test(r.type)));
  }
  if (payFilterSalesName) {
    listAll = listAll.filter(r => {
      if (payFilterSalesName === '__none__') return !(r.sales);
      return (r.sales || '') === payFilterSalesName;
    });
  }
  if (payFilterOverdue !== 'all') {
    listAll = listAll.filter(r => {
      const trustDaysVal = r.trustDays ?? null;
      let isOverdue = false;
      if (!r.settled && trustDaysVal != null && trustDaysVal > 0) {
        const start = new Date(r.date);
        const now = new Date();
        const diffDays = Math.floor((now - start) / (1000*60*60*24));
        const overdueDays = diffDays - trustDaysVal;
        if (overdueDays > 0) isOverdue = true;
      }
      return payFilterOverdue === 'overdue' ? isOverdue : !isOverdue;
    });
  }
  if (payFilterStatus !== 'all') {
    listAll = listAll.filter(r => {
      const arrears = Math.max(0, (r.amount || 0) - (r.paid || 0));
      if (payFilterStatus === 'arrears') return arrears > 0;
      if (payFilterStatus === 'done') return arrears === 0;
      return true;
    });
  }
  const hasBatch = listAll.some(r => r.batchAt);
  const listSorted = hasBatch ? listAll.slice().sort((a,b) => {
    const byBatch = (b.batchAt || 0) - (a.batchAt || 0);
    if (byBatch !== 0) return byBatch;
    const ao = (a.batchOrder != null) ? a.batchOrder : (a.createdAt || 0);
    const bo = (b.batchOrder != null) ? b.batchOrder : (b.createdAt || 0);
    return ao - bo;
  }) : listAll;
  const total = listSorted.length;
  const totalPages = Math.max(1, Math.ceil(total / payPageSize));
  if (payPage > totalPages) payPage = totalPages;
  const startIdx = (payPage - 1) * payPageSize;
  const list = listSorted.slice(startIdx, startIdx + payPageSize);
  payLastPageData = list.slice();
  payRows.innerHTML = '';
  if (!list.length) {
    const tr = document.createElement('tr');
    tr.className = 'empty';
    const td = document.createElement('td'); td.colSpan = 12; td.textContent = '暂无记录';
    tr.appendChild(td); payRows.appendChild(tr);
    return;
  }
  for (const r of list) {
    const tr = document.createElement('tr');
    const typeDisplay = /应收/.test(r.type) ? '应收' : '应付';
    const tl = trustLabelDisplay(r);
    const trustLabel = tl.label;
    const isOverdue = tl.overdue;
    const paid = r.paid || 0;
    const arrears = Math.max(0, (r.amount || 0) - paid);
    const canEdit = r.confirmed === false && r.id;
    const tdType = document.createElement('td'); tdType.textContent = typeDisplay; tr.appendChild(tdType);
    const tdPartner = document.createElement('td'); tdPartner.textContent = r.partner || ''; tr.appendChild(tdPartner);
    const tdDoc = document.createElement('td');
    const docUp = document.createElement('div'); docUp.textContent = (r.doc || '');
    const docDown = document.createElement('div'); docDown.textContent = r.source === 'import' ? parseDateCN(r.date || '') : ''; docDown.style.color = '#9ca3af'; docDown.style.fontSize = '12px';
    tdDoc.appendChild(docUp); if (docDown.textContent) tdDoc.appendChild(docDown);
    tr.appendChild(tdDoc);
    const tdAmount = document.createElement('td'); tdAmount.textContent = (r.amount||0).toFixed(2); tr.appendChild(tdAmount);
    const tdInv = document.createElement('td');
    const invUp = document.createElement('div');
    const invNo = (r.invoiceNo || '');
    if (invNo) {
      invUp.textContent = invNo;
    } else if (r.confirmed === false) {
      const a = document.createElement('a'); a.href='#'; a.textContent='-'; a.className='link-blue';
      a.addEventListener('click', e => { e.preventDefault(); openInvoiceModal(r); });
      invUp.appendChild(a);
    } else {
      invUp.textContent = '-';
    }
    const invDown = document.createElement('div'); invDown.textContent = parseDateCN(r.invoiceDate || ''); invDown.style.color = '#9ca3af'; invDown.style.fontSize = '12px';
    tdInv.appendChild(invUp); tdInv.appendChild(invDown);
    tr.appendChild(tdInv);
    const tdInvAmt = document.createElement('td');
    const invAmtNum = Number(r.invoiceAmount || 0);
    if (invAmtNum > 0 && isFinite(invAmtNum)) {
      tdInvAmt.textContent = invAmtNum.toFixed(2);
    } else if (r.confirmed === false) {
      const a = document.createElement('a'); a.href='#'; a.textContent='-'; a.className='link-blue';
      a.addEventListener('click', e => { e.preventDefault(); openInvoiceModal(r); });
      tdInvAmt.appendChild(a);
    } else {
      tdInvAmt.textContent = '-';
    }
    tr.appendChild(tdInvAmt);
    const tdAr = document.createElement('td'); tdAr.textContent = arrears.toFixed(2); tr.appendChild(tdAr);
    const tdTrust = document.createElement('td'); tdTrust.textContent = trustLabel; if (isOverdue) tdTrust.classList.add('overdue'); tr.appendChild(tdTrust);
    const tdNotes = document.createElement('td');
    tdNotes.textContent = summarizeNotes(r.notes, 10, 2);
    tdNotes.style.whiteSpace = 'pre-wrap';
    tdNotes.style.wordBreak = 'break-all';
    tr.appendChild(tdNotes);
    const tdSales = document.createElement('td'); tdSales.textContent = r.sales || '-'; tr.appendChild(tdSales);
    const tdDate = document.createElement('td'); tdDate.textContent = safePayDate(r); tr.appendChild(tdDate);
    const ops = document.createElement('td');
    if (canEdit) {
      const editBtn = document.createElement('a'); editBtn.href='#'; editBtn.textContent='修改'; editBtn.className='link-blue';
      const okBtn = document.createElement('a'); okBtn.href='#'; okBtn.textContent='确认'; okBtn.className='link-green';
      ops.append(editBtn, document.createTextNode(' '), okBtn, document.createTextNode(' '));
      editBtn.addEventListener('click', e => {
        e.preventDefault();
        setPayEdit(r);
      });
      okBtn.addEventListener('click', async e => {
        e.preventDefault();
        try {
          await apiFetchJSON('/api/payables/' + String(r.id) + '/confirm', { method:'PUT' });
          clearPayEdit();
          loadPayablesFromServer();
          renderContacts();
        } catch {}
      });
    }
    const btn = document.createElement('a'); btn.href='#'; btn.textContent='详情'; btn.className='link-blue';
    ops.appendChild(btn);
    tr.appendChild(ops);
    btn.addEventListener('click', e => {
      e.preventDefault();
      openPayHistory(r);
    });
    if (r.settled) tr.classList.add('pay-row-settled');
    else if (typeDisplay === '应收') tr.classList.add('pay-row-recv');
    else tr.classList.add('pay-row-pay');
    payRows.appendChild(tr);
  }
  if (payTableWrap) payTableWrap.scrollTop = 0;
  if (payPager) {
    payPager.innerHTML = '';
    payPager.style.display = 'flex';
    const makeBtn = (label, page, disabled=false, active=false) => {
      const b = document.createElement('a');
      b.href = '#'; b.textContent = label;
      b.style.padding = '4px 8px';
      b.style.border = '1px solid #334155';
      b.style.borderRadius = '4px';
      b.style.color = active ? '#000' : '#cbd5e1';
      b.style.background = active ? '#cbd5e1' : 'transparent';
      b.style.pointerEvents = disabled ? 'none' : 'auto';
      b.style.opacity = disabled ? '0.4' : '1';
      b.addEventListener('click', e => { e.preventDefault(); payPage = page; renderPayables(); });
      payPager.appendChild(b);
    };
    makeBtn('«', Math.max(1, payPage-1), payPage<=1);
    const maxButtons = 9;
    let start = Math.max(1, payPage - Math.floor(maxButtons/2));
    let end = Math.min(totalPages, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);
    for (let p = start; p <= end; p++) makeBtn(String(p), p, false, p===payPage);
    makeBtn('»', Math.min(totalPages, payPage+1), payPage>=totalPages);
  }
  if (payFooterInfo) {
    const totalCount = payRecords.length;
    const today = formatDateFromTs(Date.now());
    const todayCount = payRecords.filter(r => formatDateFromTs(r.createdAt) === today).length;
    const latestBatch = Math.max(0, ...payRecords.map(r => r.batchAt || 0));
    const latestBatchCount = latestBatch ? payRecords.filter(r => (r.batchAt||0) === latestBatch).length : (payRecords.length ? 1 : 0);
    payFooterInfo.innerHTML = '';
    const mk = (text) => { const s = document.createElement('span'); s.className = 'info-pill'; s.textContent = text; return s; };
    payFooterInfo.appendChild(mk(`共 ${totalCount} 条记录`));
    payFooterInfo.appendChild(mk(`今日上传 ${todayCount} 条`));
    payFooterInfo.appendChild(mk(`最后次上传 ${latestBatchCount} 条`));
  }
}
payFilterKey?.addEventListener('input', () => { payPage = 1; renderPayables(); });
payExportBtn?.addEventListener('click', () => {
  const data = payLastPageData || [];
  if (!data.length) { alert('当前页面无记录可导出'); return; }
  const rows = [];
  rows.push(['款项类型','往来单位','单据/凭证号','业务员','金额','发票号','发票日期','发票金额','欠款','信任天数','备注','日期']);
  data.forEach(r => {
    const typeDisplay = /应收/.test(r.type) ? '应收' : '应付';
    const tl = trustLabelDisplay(r);
    const trustLabel = tl.label;
    const paid = r.paid || 0;
    const arrears = Math.max(0, (r.amount || 0) - paid);
    const invAmtCell = (Number(r.invoiceAmount||0) > 0) ? (r.invoiceAmount||0).toFixed(2) : '-';
    const outDate = (r.source === 'manual') ? (safePayDate(r) || '') : (r.date || '');
    rows.push([typeDisplay, r.partner || '', r.doc || '', r.sales || '', (r.amount||0).toFixed(2), r.invoiceNo || '', r.invoiceDate || '', invAmtCell, arrears.toFixed(2), trustLabel, r.notes || '', outDate]);
  });
  let html = '<html><head><meta charset="UTF-8"></head><body><table border="1">';
  rows.forEach(r => { html += '<tr>' + r.map(c => `<td>${String(c).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</td>`).join('') + '</tr>'; });
  html += '</table></body></html>';
  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=UTF-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const now = new Date();
  const ts = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}`;
  a.download = `应收应付账款_${ts}.xls`;
  a.href = url;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});
payClearBtn?.addEventListener('click', async () => {
  if (!confirm('确定清空应收/应付所有记录？此操作不可恢复')) return;
  try {
    await apiFetchJSON('/api/payables', { method:'DELETE' });
    payRecords.splice(0, payRecords.length);
    saveJSON('payRecords', payRecords);
    payPage = 1;
    loadPayablesFromServer();
    renderContacts();
  } catch {}
});
const handlePayFormSubmit = async (e) => {
  if (e) { e.preventDefault(); e.stopPropagation(); }
  if (paySubmitLock) return;
  paySubmitLock = true;
  document.getElementById('pay-label-partner')?.classList.remove('invalid-label');
  document.getElementById('pay-label-doc')?.classList.remove('invalid-label');
  document.getElementById('pay-label-amount')?.classList.remove('invalid-label');
  if (payImportParsed.length) {
    let covered = 0, inserted = 0, createdCustomers = 0, createdMerchants = 0;
    const batchAt = Date.now();
    let batchOrder = 0;
    payImportParsed.forEach(rec => {
      rec.confirmed = false;
      rec.batchAt = batchAt;
      rec.batchOrder = batchOrder++;
      rec.createdAt = batchAt;
      const existedBefore = [...contactsData.customers, ...contactsData.merchants, ...contactsData.others]
        .some(x => (x.name||'') === (rec.partner||''));
      ensureContactForPartner(rec.partner, rec.type, rec.sales);
      if (!existedBefore && (rec.partner||'').trim()) {
        if (/应付/.test(rec.type)) createdMerchants++; else createdCustomers++;
      }
      const hasKey = (rec.partner||'').trim() && (rec.doc||'').trim();
      if (hasKey) {
        const ex = findExistingPayRecord(rec);
        if (ex) { mergePayRecord(ex, rec); ex.batchAt = batchAt; ex.batchOrder = rec.batchOrder; ex.createdAt = batchAt; covered++; return; }
      }
      payRecords.push(rec); inserted++;
    });
    const uploadList = payImportParsed.slice();
    payImportParsed = [];
    if (payImportFile) payImportFile.value = '';
    if (payImportHint) payImportHint.textContent = '批量导入完成';
    payPage = 1;
    apiFetchJSON('/api/payables/import', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ records: uploadList }) })
      .then(() => loadPayablesFromServer())
      .catch(() => {});
    renderPayables();
    if (contactsSearch) contactsSearch.value = '';
    renderContacts();
    saveJSON('payRecords', payRecords);
    saveJSON('contactsData', contactsData);
    const gp = document.getElementById('global-pager'); if (gp) gp.style.display = 'flex';
    renderPayables();
    alert(`导入完成：新增记录 ${inserted} 条，覆盖更新 ${covered} 条，新增客户 ${createdCustomers} 条，新增商家 ${createdMerchants} 条。`);
    return;
  }
  const type = payType.value;
  const partner = payPartner.value.trim();
  const doc = payDoc.value.trim();
  const sales = (paySales?.value || '').trim();
  const amountStr = (payAmount.value || '').trim();
  const amount = parseFloat(amountStr || '');
  const trustDays = parseInt(payTrust.value || '0', 10);
  const notes = payNotes.value.trim();
  const invalidLabels = [];
  if (!type) return;
  if (!partner) invalidLabels.push('pay-label-partner');
  if (!doc) invalidLabels.push('pay-label-doc');
  if (!amountStr || !amount) invalidLabels.push('pay-label-amount');
  if (invalidLabels.length) {
    invalidLabels.forEach(id => {
      const el = document.getElementById(id);
      el?.classList.add('invalid-label');
    });
    const focusEl = !partner ? payPartner : (!doc ? payDoc : payAmount);
    focusEl?.focus();
    const clearPartner = () => document.getElementById('pay-label-partner')?.classList.remove('invalid-label');
    const clearDoc = () => document.getElementById('pay-label-doc')?.classList.remove('invalid-label');
    const clearAmount = () => document.getElementById('pay-label-amount')?.classList.remove('invalid-label');
    payPartner.addEventListener('input', clearPartner, { once: true });
    payDoc.addEventListener('input', clearDoc, { once: true });
    payAmount.addEventListener('input', clearAmount, { once: true });
    alert('请补全必填项');
    paySubmitLock = false;
    return;
  }
  if (payDocExists(doc, type, payEditingId)) {
    setPayDocInvalid(true);
    alert('凭证号已存在');
    paySubmitLock = false;
    return;
  }
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const dateTime = `${date} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
  const creator = (getAuthUser()?.name) || '';
  if (payEditingId) {
    const origin = payRecords.find(r => r.id === payEditingId) || {};
    const paidVal = Number(origin.paid || 0);
    const settledVal = amount > 0 && paidVal >= amount;
    const payload = {
      type, partner, doc, sales, amount,
      paid: paidVal,
      trustDays,
      notes,
      date,
      settled: settledVal,
      history: origin.history || [],
      createdAt: origin.createdAt || Date.now(),
      invoiceNo: origin.invoiceNo || '',
      invoiceDate: origin.invoiceDate || '',
      invoiceAmount: Number(origin.invoiceAmount || 0),
      source: origin.source || 'manual',
      batchAt: origin.batchAt || 0,
      batchOrder: origin.batchOrder ?? 0,
      confirmed: false
    };
    try {
      await apiFetchJSON('/api/payables/' + String(payEditingId), { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      clearPayEdit();
      loadPayablesFromServer();
      renderContacts();
    } catch {}
  } else {
    const rec = { type, partner, doc, sales, amount, paid: 0, trustDays, notes, date, settled:false, history: [], createdAt: Date.now(), invoiceNo:'', invoiceDate:'', invoiceAmount:0, source:'manual', confirmed:false };
    rec.batchAt = Date.now();
    rec.batchOrder = 0;
    rec.history.push({ date: dateTime, user: creator, kind: '创建', amount, partner, doc, notes });
    apiFetchJSON('/api/payables', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(rec) })
      .then((res) => { if (res && res.id) rec.id = res.id; loadPayablesFromServer(); })
      .catch(() => { payRecords.push(rec); });
  }
  payPartner.value = '';
  payDoc.value = '';
  if (paySales) paySales.value = '';
  payAmount.value = '';
  payTrust.value = '30';
  payNotes.value = '';
  document.getElementById('pay-label-partner')?.classList.remove('invalid-label');
  document.getElementById('pay-label-doc')?.classList.remove('invalid-label');
  document.getElementById('pay-label-amount')?.classList.remove('invalid-label');
  payPage = 1;
  renderPayables();
  renderContacts();
  saveJSON('payRecords', payRecords);
  saveJSON('contactsData', contactsData);
  const gp = document.getElementById('global-pager'); if (gp) gp.style.display = 'flex';
  renderPayables();
  paySubmitLock = false;
};
payForm?.addEventListener('submit', handlePayFormSubmit);
paySubmitBtn?.addEventListener('click', handlePayFormSubmit);
let payImportParsed = [];
let payImportInvalidCount = 0;
let payImportRequiredMissingCount = 0;
function parseCSV(text) {
  const rows = [];
  let i = 0, cur = '', inQ = false, row = [];
  while (i < text.length) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i+1] === '"') { cur += '"'; i += 2; continue; }
        inQ = false; i++; continue;
      }
      cur += ch; i++; continue;
    }
    if (ch === '"') { inQ = true; i++; continue; }
    if (ch === ',') { row.push(cur.trim()); cur = ''; i++; continue; }
    if (ch === '\n') { row.push(cur.trim()); rows.push(row); row = []; cur = ''; i++; continue; }
    if (ch === '\r') { i++; continue; }
    cur += ch; i++;
  }
  if (cur.length || row.length) { row.push(cur.trim()); rows.push(row); }
  return rows;
}
function parseXLS(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const table = doc.querySelector('table');
  const rows = [];
  if (!table) return rows;
  table.querySelectorAll('tr').forEach(tr => {
    const row = [];
    tr.querySelectorAll('td,th').forEach(td => row.push(td.textContent.trim()));
    if (row.length) rows.push(row);
  });
  return rows;
}
function parseXLSX(buffer) {
  try {
    const wb = XLSX.read(buffer, { type: 'array' });
    const wsname = wb.SheetNames[0];
    const ws = wb.Sheets[wsname];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true });
    return rows || [];
  } catch (e) {
    alert('解析 .xlsx 文件失败');
    return [];
  }
}
function parseTrustDays(val) {
  const s = String(val || '').trim();
  if (!s) return NaN;
  if (s.includes('立即')) return 0;
  const m = new RegExp('(\\d+)').exec(s);
  return m ? parseInt(m[1], 10) : NaN;
}
function parseDateCN(text) {
  const s = String(text || '').trim();
  if (!s) return '';
  if (/^\d{4}[-\/\.]\d{1,2}[-\/\.]\d{1,2}$/.test(s)) {
    const parts = s.split(/[-\/\.]/);
    const y = parts[0];
    const mm = String(parseInt(parts[1],10)).padStart(2,'0');
    const dd = String(parseInt(parts[2],10)).padStart(2,'0');
    return `${y}-${mm}-${dd}`;
  }
  const mCNFull = new RegExp('(\\d{4})\\s*年\\s*(\\d{1,2})\\s*月\\s*(\\d{1,2})\\s*日').exec(s);
  if (mCNFull) {
    const y = mCNFull[1];
    const mm = String(parseInt(mCNFull[2],10)).padStart(2,'0');
    const dd = String(parseInt(mCNFull[3],10)).padStart(2,'0');
    return `${y}-${mm}-${dd}`;
  }
  const mCN = new RegExp('(\\d{1,2})\\s*月\\s*(\\d{1,2})\\s*日').exec(s);
  if (mCN) {
    const y = new Date().getFullYear();
    const mm = String(parseInt(mCN[1],10)).padStart(2,'0');
    const dd = String(parseInt(mCN[2],10)).padStart(2,'0');
    return `${y}-${mm}-${dd}`;
  }
  const mMD = new RegExp('(\\d{1,2})[-\\/\\.]?(\\d{1,2})$').exec(s);
  if (mMD) {
    const y = new Date().getFullYear();
    const mm = String(parseInt(mMD[1],10)).padStart(2,'0');
    const dd = String(parseInt(mMD[2],10)).padStart(2,'0');
    return `${y}-${mm}-${dd}`;
  }
  return s;
}
function formatDateFromTs(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${dd}`;
}
function safePayDate(rec) {
  const t0 = Number(rec.createdAt);
  if (Number.isFinite(t0) && t0 > 0) return formatDateFromTs(t0);
  const t1 = Date.parse(rec.date || rec.invoiceDate || '');
  if (!isNaN(t1)) return formatDateFromTs(t1);
  return formatDateFromTs(Date.now());
}
function rowToRecord(cols) {
  const [typeCol, partner, doc, date, amountCol, invoiceNo, invoiceDate, invoiceAmountCol, trustCol, notes, sales, paidCol] = cols;
  const type = /应付/.test(String(typeCol)) ? '应付账款' : '应收账款';
  const amount = parseFloat(String(amountCol).replace(/,/g,'')) || 0;
  const paidFromSheet = parseFloat(String(paidCol||'').replace(/,/g,'')) || 0;
  const trustDaysIn = parseTrustDays(trustCol);
  const trustDays = Number.isFinite(trustDaysIn) ? trustDaysIn : parseInt(document.getElementById('pay-trust')?.value || '30', 10);
  const now = new Date();
  const creator = (getAuthUser()?.name) || '';
  const createdAt = Date.now();
  const dIn = parseDateCN(date);
  const d = (dIn && new RegExp('^\\d{4}-\\d{2}-\\d{2}$').test(dIn)) ? dIn :
    `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const dt = `${d} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
  const invoiceAmount = parseFloat(String(invoiceAmountCol||'').replace(/,/g,'')) || 0;
  const paid = Math.min(paidFromSheet, amount);
  const rec = { type, partner: String(partner||'').trim(), doc: String(doc||'').trim(), sales, amount, paid, trustDays, notes, date: d, settled:(paid>=amount && amount>0), history: [], createdAt, invoiceNo: (invoiceNo||''), invoiceDate: parseDateCN(invoiceDate||''), invoiceAmount, source: 'import', confirmed:false };
  rec.history.push({ date: dt, user: creator, kind: '创建', amount, partner, doc, notes });
  if (invoiceNo || invoiceAmount) {
    rec.history.push({ date: dt, user: creator, kind: '发票', amount: invoiceAmount, partner, doc, notes: `发票号:${invoiceNo||'-'} 发票日期:${rec.invoiceDate||'-'}` });
  }
  if (paid > 0) {
    rec.history.push({ date: dt, user: creator, kind: '银行付款', amount: paid, partner, doc, notes: '' });
  }
  return rec;
}
function previewImport(rows) {
  const headerRow = rows[0] ? rows[0].map(x => String(x).trim()) : [];
  const hasHeader = headerRow.some(x => /类型|款项|往来单位|凭证|发票|日期/.test(x));
  const dataRows = hasHeader ? rows.slice(1) : rows;
  function idxOf(names) {
    for (const n of names) {
      const i = headerRow.findIndex(h => h && h.includes(n));
      if (i >= 0) return i;
    }
    return -1;
  }
  const idx = {
    type: hasHeader ? idxOf(['应收应付']) : 0,
    partner: hasHeader ? idxOf(['往来单位']) : 1,
    doc: hasHeader ? idxOf(['单据凭证号']) : 2,
    date: hasHeader ? idxOf(['出单日期']) : 3,
    amount: hasHeader ? idxOf(['订单金额']) : 4,
    invoiceNo: hasHeader ? idxOf(['发票号']) : 5,
    invoiceDate: hasHeader ? idxOf(['发票日期']) : 6,
    invoiceAmount: hasHeader ? idxOf(['发票金额']) : 7,
    trustDays: hasHeader ? idxOf(['信任天数']) : 8,
    notes: hasHeader ? idxOf(['备注']) : 9,
    sales: hasHeader ? idxOf(['业务员']) : 10,
    paid: hasHeader ? idxOf(['支付情况','已支付','支付金额','支付']) : -1,
  };
  const selectedType = payType?.value || '';
  const selectedFlag = /应付/.test(selectedType) ? '应付' : '应收';
  payImportParsed = [];
  payImportInvalidCount = 0;
  payImportRows.innerHTML = '';
  let cntTypeMismatch = 0;
  let cntUpdatedEst = 0;
  let cntNewCustomersEst = 0;
  let cntNewMerchantsEst = 0;
  let parsedVisibleCount = 0;
  let requiredMissingCount = 0;
  const existCustomers = new Set((contactsData.customers||[]).map(x => String(x.name||'').trim()));
  const existMerchants = new Set((contactsData.merchants||[]).map(x => String(x.name||'').trim()));
  dataRows.forEach(row => {
    let rowType = String(row[idx.type] ?? '').trim();
    const originalTypeEmpty = !rowType;
    if (!rowType) rowType = selectedFlag;
    const partnerName = String(row[idx.partner] ?? '').trim();
    const docVal = String(row[idx.doc] ?? '').trim();
    const amtVal = String(row[idx.amount] ?? '').trim();
    if (![rowType, partnerName, docVal, amtVal].some(v => String(v||'').trim())) return;
    const colsX = [
      row[idx.type] ?? '',
      partnerName,
      row[idx.doc] ?? '',
      row[idx.date] ?? '',
      row[idx.amount] ?? '',
      row[idx.invoiceNo] ?? '',
      row[idx.invoiceDate] ?? '',
      row[idx.invoiceAmount] ?? '',
      row[idx.trustDays] ?? '',
      row[idx.notes] ?? '',
      row[idx.sales] ?? '',
      (idx.paid >= 0 ? row[idx.paid] : ''),
    ];
    const tr = document.createElement('tr');
    let isErrorRow = false;
    let errorReason = '';
    if (rowType && !rowType.includes(selectedFlag)) { isErrorRow = true; errorReason = '性质不匹配：页面与A列不一致'; cntTypeMismatch++; colsX[0] = selectedFlag; }
    const missType = originalTypeEmpty;
    const missPartner = !partnerName;
    const missDoc = !docVal;
    const missAmount = !amtVal;
    if (missPartner) { isErrorRow = true; errorReason = errorReason ? (errorReason + '；店名为空') : '店名为空'; payImportInvalidCount++; }
    const isRequiredMissing = missType || missPartner || missDoc || missAmount;
    if (isRequiredMissing) requiredMissingCount++;
    const previewCells = [
      row[idx.type] ?? '',
      partnerName,
      row[idx.doc] ?? '',
      row[idx.date] ?? '',
      row[idx.amount] ?? '',
      row[idx.invoiceNo] ?? '',
      row[idx.invoiceDate] ?? '',
      row[idx.invoiceAmount] ?? '',
      row[idx.trustDays] ?? '',
      (idx.paid >= 0 ? row[idx.paid] : ''),
      row[idx.notes] ?? '',
      row[idx.sales] ?? '',
    ];
    previewCells.forEach((v, ci) => {
      const td = document.createElement('td');
      td.textContent = String(v ?? '');
      const needHighlight = (ci === 0 && missType) || (ci === 1 && missPartner) || (ci === 2 && missDoc) || (ci === 4 && missAmount);
      if (needHighlight || (isErrorRow && (ci === 0 || ci === 1))) { td.className = 'error-cell'; td.title = errorReason || '必填项为空'; }
      tr.appendChild(td);
    });
    payImportRows.appendChild(tr);
    if (isRequiredMissing) return;
    parsedVisibleCount++;
    const rec = rowToRecord(colsX);
    payImportParsed.push(rec);
    const existsRec = findExistingPayRecord(rec);
    if (existsRec) cntUpdatedEst++;
    const isRecv = /应收/.test(rec.type);
    if (isRecv) {
      if (!existCustomers.has(rec.partner.trim())) cntNewCustomersEst++;
    } else {
      if (!existMerchants.has(rec.partner.trim())) cntNewMerchantsEst++;
    }
  });
  const summary = [
    `已解析 ${parsedVisibleCount} 条`,
    (cntUpdatedEst ? `预计覆盖 ${cntUpdatedEst} 条` : ''),
    ((cntNewCustomersEst+cntNewMerchantsEst) ? `预计新增客户/商家 ${cntNewCustomersEst+cntNewMerchantsEst} 条` : ''),
    (payImportInvalidCount ? `已跳过店名为空 ${payImportInvalidCount} 条` : ''),
    (cntTypeMismatch ? `性质不匹配 ${cntTypeMismatch} 条（A列与页面不一致，不导入）` : ''),
    (requiredMissingCount ? `存在必填项为空 ${requiredMissingCount} 条（应收应付/往来单位/凭证号/订单金额），请修正后再入库` : ''),
  ].filter(Boolean).join(' | ');
  payImportSummary.textContent = summary;
  if (payImportHint) {
    if (requiredMissingCount) payImportHint.textContent = `存在必填项为空 ${requiredMissingCount} 条，无法入库`;
    else payImportHint.textContent = `已选择 ${parsedVisibleCount} 条，点击下方提交完成入库`;
  }
  payImportRequiredMissingCount = requiredMissingCount;
  if (payImportCommit) payImportCommit.disabled = false;
}
payImportFile?.addEventListener('change', () => {
  const file = payImportFile?.files?.[0];
  if (!file) { return; }
  const name = (file.name || '').toLowerCase();
  const reader = new FileReader();
  try { payImportModal.style.display = 'flex'; setImportModalWidth(); } catch {}
  if (name.endsWith('.csv')) {
    reader.onload = () => { try { previewImport(parseCSV(reader.result)); setImportModalWidth(); } catch {} };
    reader.readAsText(file, 'utf-8');
  } else if (name.endsWith('.xls')) {
    reader.onload = () => { try { previewImport(parseXLS(reader.result)); setImportModalWidth(); } catch {} };
    reader.readAsText(file, 'utf-8');
  } else if (name.endsWith('.xlsx')) {
    reader.onload = () => { try { previewImport(parseXLSX(reader.result)); setImportModalWidth(); } catch {} };
    reader.readAsArrayBuffer(file);
  } else {
    alert('不支持的文件类型');
  }
});
function setImportModalWidth() {
  const card = document.querySelector('#page-payables .card');
  const modalBox = document.querySelector('#pay-import-modal .modal');
  if (card && modalBox) {
    const w = Math.floor(card.getBoundingClientRect().width);
    modalBox.style.width = w + 'px';
    modalBox.style.maxWidth = 'none';
  }
}
payImportCancel?.addEventListener('click', () => { payImportModal.style.display = 'none'; });
function ensureContactForPartner(name, type, salesName) {
  const pname = String(name || '').trim();
  if (!pname) return;
  const tab = /应付/.test(type) ? 'merchants' : 'customers';
  const ownerLabel = tab === 'merchants' ? '商家' : '客户';
  const existsInTab = (contactsData[tab] || []).some(x => (String(x.name||'').trim()) === pname);
  if (existsInTab) return;
  const now = new Date();
  const created = `${now.getFullYear()}/${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
  contactsData[tab].push({ name: pname, contact:'', phone:'', city:'', remark:'', owner: ownerLabel, created, company:'', code:'', country:'', address:'', zip:'', sales: (salesName||'').trim() });
}
function findExistingPayRecord(rec) {
  const p = String(rec.partner || '').trim();
  const d = String(rec.doc || '').trim();
  return payRecords.find(r =>
    r.type === rec.type &&
    String(r.partner||'').trim() === p &&
    String(r.doc||'').trim() === d
  );
}
function mergePayRecord(target, src) {
  const now = new Date();
  const dateTime = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
  const user = (getAuthUser()?.name) || '';
  target.sales = src.sales || target.sales || '';
  if (!isNaN(src.amount)) target.amount = src.amount;
  if (!isNaN(src.paid)) {
    const newPaid = src.paid;
    target.paid = Math.min(newPaid, target.amount || 0);
  }
  if (!isNaN(src.trustDays)) target.trustDays = src.trustDays;
  target.notes = src.notes || target.notes || '';
  target.date = src.date || target.date;
  target.invoiceNo = src.invoiceNo || target.invoiceNo || '';
  target.invoiceDate = src.invoiceDate || target.invoiceDate || '';
  if (!isNaN(src.invoiceAmount)) target.invoiceAmount = src.invoiceAmount;
  target.settled = (target.paid || 0) >= (target.amount || 0) && (target.amount || 0) > 0;
  target.history = target.history || [];
  target.history.push({ date: dateTime, user, kind: '导入覆盖', amount: src.amount, partner: target.partner, doc: target.doc, notes: '批量导入覆盖现有记录' });
  if (src.invoiceNo || src.invoiceAmount) {
    target.history.push({ date: dateTime, user, kind: '发票', amount: src.invoiceAmount, partner: target.partner, doc: target.doc, notes: `发票号:${src.invoiceNo||'-'} 发票日期:${src.invoiceDate||'-'}` });
  }
  if (src.paid) {
    target.history.push({ date: dateTime, user, kind: '银行付款', amount: src.paid, partner: target.partner, doc: target.doc, notes: '' });
  }
}
let payImportCommitLock = false;
const handlePayImportCommit = async (e) => {
  if (e) { e.preventDefault(); e.stopPropagation(); }
  if (payImportCommitLock) return;
  payImportCommitLock = true;
  if (payImportRequiredMissingCount) { alert(`存在必填项为空 ${payImportRequiredMissingCount} 条，无法入库`); payImportCommitLock = false; return; }
  let createdCustomers = 0, createdMerchants = 0;
  let covered = 0, inserted = 0;
  const batchAt = Date.now();
  let batchOrder = 0;
  const beforeCustomers = new Set((contactsData.customers||[]).map(x => String(x.name||'').trim()));
  const beforeMerchants = new Set((contactsData.merchants||[]).map(x => String(x.name||'').trim()));
  payImportParsed.forEach(rec => {
    rec.batchAt = batchAt;
    rec.batchOrder = batchOrder++;
    rec.createdAt = batchAt;
    const existedBefore = [...contactsData.customers, ...contactsData.merchants, ...contactsData.others]
      .some(x => (x.name||'') === (rec.partner||''));
    ensureContactForPartner(rec.partner, rec.type, rec.sales);
    if (!existedBefore && (rec.partner||'').trim()) {
      if (/应付/.test(rec.type)) createdMerchants++; else createdCustomers++;
    }
    const hasKey = (rec.partner||'').trim() && (rec.doc||'').trim();
    if (hasKey) {
      const ex = findExistingPayRecord(rec);
      if (ex) { mergePayRecord(ex, rec); ex.batchAt = batchAt; ex.batchOrder = rec.batchOrder; ex.createdAt = batchAt; ex.source = 'import'; covered++; return; }
    }
    payRecords.push(rec); inserted++;
  });
  payImportParsed = [];
  payImportInvalidCount = 0;
  payImportModal.style.display = 'none';
  payPage = 1;
  renderPayables();
  renderContacts?.();
  saveJSON('payRecords', payRecords);
  saveJSON('contactsData', contactsData);
  apiFetchJSON('/api/payables/import', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ records: payRecords.filter(r => r.batchAt === batchAt) }) })
    .then(() => loadPayablesFromServer())
    .catch(() => {});
  const totalChanged = inserted + covered + createdCustomers + createdMerchants;
  if (totalChanged > 0) {
    alert(`导入完成：新增记录 ${inserted} 条，覆盖更新 ${covered} 条，新增客户 ${createdCustomers} 条，新增商家 ${createdMerchants} 条。`);
  }
  payImportCommitLock = false;
};
if (payImportCommit) {
  payImportCommit.addEventListener('click', handlePayImportCommit);
  payImportCommit.onclick = handlePayImportCommit;
}
let contactsTab = 'customers';
const contactsRows = document.getElementById('contacts-rows');
const contactsSearch = document.getElementById('contacts-search');
const confirmModal = document.getElementById('confirm-modal');
const confirmCancel = document.getElementById('confirm-cancel');
const confirmOk = document.getElementById('confirm-ok');
const partnerOrdersRows = document.getElementById('partner-orders-rows');
const partnerOrdersHead = document.getElementById('partner-orders-head');
let contactsPage = 1;
const contactsPageSize = 100;
let pendingDeleteIndex = null;
let pendingDeleteTab = null;
function partnerTotal(name) {
  let sum = 0;
  payRecords.forEach(r => { if ((r.partner||'') === name) sum += r.amount || 0; });
  return sum.toFixed(2);
}
function partnerArrears(name, ownerLabel) {
  let sum = 0;
  payRecords.forEach(r => {
    if ((r.partner||'') !== name) return;
    const isRecv = /应收/.test(r.type||'');
    const isPay = /应付/.test(r.type||'');
    if (ownerLabel === '客户' && !isRecv) return;
    if (ownerLabel === '商家' && !isPay) return;
    const arrears = Math.max(0, (r.amount||0) - (r.paid||0));
    sum += arrears;
  });
  return sum.toFixed(2);
}
function formatDateTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  const hh = String(d.getHours()).padStart(2,'0');
  const mm = String(d.getMinutes()).padStart(2,'0');
  return `${y}-${m}-${dd} ${hh}:${mm}`;
}
function openAmountHistory(partnerName, ownerLabel) {
  const modal = document.getElementById('amount-history-modal');
  const head = document.getElementById('amount-history-head');
  const rowsEl = document.getElementById('amount-history-rows');
  const list = [];
  payRecords.forEach(r => {
    if ((r.partner||'') !== partnerName) return;
    const ts = r.createdAt || (r.date ? Date.parse(r.date) : 0);
    const amt = Number(r.amount||0);
    const isRecv = /应收/.test(r.type||'');
    const change = isRecv ? amt : -amt;
    const label = isRecv ? `应收账款记录 + ${amt.toFixed(2)}` : `应付账款记录 - ${amt.toFixed(2)}`;
    const user = (r.history && r.history[0] && r.history[0].user) || (getAuthUser()?.name || '');
    list.push({ ts, doc: r.doc || '', change, label, user });
  });
  records.forEach(rec => {
    if ((rec.client||'') !== partnerName) return;
    if (rec.type === '收入') {
      const ts = rec.createdAt || (rec.dateTime ? Date.parse(rec.dateTime) : (rec.date ? Date.parse(rec.date) : 0));
      const amt = Number(rec.amount||0);
      const change = -amt;
      const label = `收支记账收入 - ${amt.toFixed(2)}`;
      const user = getAuthUser()?.name || '';
      list.push({ ts, doc: rec.doc || '', change, label, user });
    }
  });
  list.sort((a,b) => a.ts - b.ts);
  let cum = 0;
  const withCum = list.map(x => { cum += x.change; return { ...x, cum }; });
  rowsEl.innerHTML = '';
  const render = [...withCum].reverse();
  render.forEach((x, idx) => {
    const tr = document.createElement('tr');
    const seq = document.createElement('td'); seq.textContent = String(render.length - idx); tr.appendChild(seq);
    const dt = document.createElement('td'); dt.textContent = formatDateTime(x.ts); tr.appendChild(dt);
    const doc = document.createElement('td'); doc.textContent = x.doc || '-'; tr.appendChild(doc);
    const change = document.createElement('td'); change.textContent = x.label; tr.appendChild(change);
    const arrears = document.createElement('td'); arrears.textContent = Number.isFinite(x.cum) ? x.cum.toFixed(2) : '-'; tr.appendChild(arrears);
    const user = document.createElement('td'); user.textContent = x.user || '-'; tr.appendChild(user);
    rowsEl.appendChild(tr);
  });
  head.textContent = `往来单位：${partnerName}`;
  modal.style.display = 'flex';
  document.getElementById('amount-history-close')?.addEventListener('click', () => { modal.style.display = 'none'; });
}
function openPartnerOrders(name) {
  const modal = document.getElementById('partner-orders-modal');
  const head = document.getElementById('partner-orders-head');
  const rowsEl = document.getElementById('partner-orders-rows');
  head.textContent = '往来单位：' + (name || '');
  const list = payRecords.filter(r => (r.partner || '') === (name || ''));
  rowsEl.innerHTML = '';
  list.forEach(r => {
    const tr = document.createElement('tr');
    const paid = r.paid || 0;
    const arrears = Math.max(0, (r.amount || 0) - paid);
    [r.type, r.partner || '', r.doc || '', (r.amount||0).toFixed(2), paid.toFixed(2), arrears.toFixed(2), r.date || ''].forEach((v,i) => {
      const td = document.createElement('td');
      td.textContent = String(v);
      if (i===5 && arrears>0) td.style.color = '#ef4444';
      tr.appendChild(td);
    });
    rowsEl.appendChild(tr);
  });
  modal.style.display = 'flex';
  document.getElementById('partner-orders-close')?.addEventListener('click', () => { modal.style.display = 'none'; });
}
async function renderContacts() {
  const list = contactsData[contactsTab] || [];
  const key = (contactsSearch?.value || '').trim();
  await apiContactsList(contactsTab, key, contactsPage, contactsPageSize);
  await seedDefaultContacts(contactsTab);
  await apiContactsList(contactsTab, key, contactsPage, contactsPageSize);
  const fresh = contactsData[contactsTab] || [];
  const filtered = fresh.filter(x => {
    if (!key) return true;
    const k = String(key).toLowerCase();
    return [x.name, x.company, x.code, x.contact, x.phone, x.sales]
      .some(v => String(v||'').toLowerCase().includes(k));
  });
  const ordered = filtered.slice().reverse();
  const total = ordered.length;
  const totalPages = Math.max(1, Math.ceil(total / contactsPageSize));
  if (contactsPage > totalPages) contactsPage = totalPages;
  const startIdx = (contactsPage - 1) * contactsPageSize;
  const data = ordered.slice(startIdx, startIdx + contactsPageSize);
  const gp = document.getElementById('global-pager');
  const sel = document.getElementById('ct-sales');
  if (sel) {
    const prev = sel.value;
    sel.innerHTML = '<option value="">请选择业务员</option>';
    (salesData || []).forEach(s => {
      const opt = document.createElement('option'); opt.value = s.name; opt.textContent = s.name;
      sel.appendChild(opt);
    });
    if ([...sel.options].some(o => o.value === prev)) sel.value = prev;
  }
  contactsRows.innerHTML = '';
  for (const r of data) {
    const tr = document.createElement('tr');
    const ops = document.createElement('td');
    ops.className = 'actions';
    ops.innerHTML = '<a href="#" class="link-blue">编辑</a><a href="#" class="link-red">删除</a><a href="#" class="link-green">订单记录</a><a href="#" class="link-orange">金额记录</a>';
    const cells = [r.name, r.company || '', r.code || '', r.contact, r.phone, r.city, r.remark || '', r.sales || '-', partnerTotal(r.name), partnerArrears(r.name, r.owner || ''), r.created];
    cells.forEach((v, idx) => {
      const td = document.createElement('td');
      if (idx === 9) {
        const num = parseFloat(String(v));
        if (isFinite(num) && num <= 0) {
          td.textContent = '-';
        } else {
          td.textContent = Number.isFinite(num) ? num.toFixed(2) : String(v||'');
          td.style.color = '#ef4444';
        }
      } else {
        td.textContent = v;
      }
      tr.appendChild(td);
    });
    tr.appendChild(ops);
    contactsRows.appendChild(tr);
    const del = ops.querySelector('.link-red');
    del.addEventListener('click', e => {
      e.preventDefault();
      const name = r.name || '';
      const ownerLabel = r.owner || '';
      const inUse = payRecords.some(x => (x.partner||'') === name) || records.some(x => (x.client||'') === name) || (parseFloat(partnerArrears(name, ownerLabel)) > 0);
      if (inUse) { alert('该客户正在使用中，无法被删除'); return; }
      pendingDeleteIndex = contactsData[contactsTab].indexOf(r);
      pendingDeleteTab = contactsTab;
      confirmModal.style.display = 'flex';
    });
    const edit = ops.querySelector('.link-blue');
    edit.addEventListener('click', e => {
      e.preventDefault();
      const i = contactsData[contactsTab].indexOf(r);
      if (i>=0) {
        editingIndex = i;
        editingTab = contactsTab;
        fillContactsForm(r);
        ctSubmitBtn.textContent = '保存';
      if (ctSubmitTop) ctSubmitTop.textContent = '保存';
      }
    });
    const ordersLink = ops.querySelector('.link-green');
    ordersLink.addEventListener('click', e => {
      e.preventDefault();
      const n = encodeURIComponent(r.name || '');
      location.hash = '#partner-orders:' + n;
    });
    const amountLink = ops.querySelector('.link-orange');
    amountLink.addEventListener('click', e => {
      e.preventDefault();
      openAmountHistory(r.name, r.owner || '');
    });
  }
  const pager = document.getElementById('global-pager-controls');
  const isContactsVisible = (document.getElementById('page-contacts')?.style.display === 'block');
  if (pager && isContactsVisible) {
    pager.innerHTML = '';
    const makeBtn = (label, page, disabled=false, active=false) => {
      const b = document.createElement('a');
      b.href = '#'; b.textContent = label;
      b.style.padding = '4px 8px';
      b.style.border = '1px solid #334155';
      b.style.borderRadius = '4px';
      b.style.color = active ? '#000' : '#cbd5e1';
      b.style.background = active ? '#cbd5e1' : 'transparent';
      b.style.pointerEvents = disabled ? 'none' : 'auto';
      b.style.opacity = disabled ? '0.4' : '1';
      b.addEventListener('click', e => { e.preventDefault(); contactsPage = page; renderContacts(); });
      pager.appendChild(b);
    };
    makeBtn('«', Math.max(1, contactsPage-1), contactsPage<=1);
    const maxButtons = 9;
    let start = Math.max(1, contactsPage - Math.floor(maxButtons/2));
    let end = Math.min(totalPages, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);
    for (let p = start; p <= end; p++) makeBtn(String(p), p, false, p===contactsPage);
    makeBtn('»', Math.min(totalPages, contactsPage+1), contactsPage>=totalPages);
  }
  const infoEl = document.getElementById('pay-footer-info');
  if (infoEl) {
    const todayStr = (() => { const d = new Date(); const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const dd=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${dd}`; })();
    const toTs = x => { const t = Date.parse(x.created || ''); return Number.isFinite(t) ? t : 0; };
    const listAll = list || [];
    const totalCount = listAll.length;
    const todayCount = listAll.filter(x => {
      const t = toTs(x); if (!t) return false;
      const d = new Date(t); const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const dd=String(d.getDate()).padStart(2,'0');
      return `${y}-${m}-${dd}` === todayStr;
    }).length;
    const latestTs = Math.max(0, ...(listAll.map(toTs)));
    const latestCount = latestTs ? listAll.filter(x => toTs(x) === latestTs).length : (totalCount ? 1 : 0);
    const mk = (text) => { const s = document.createElement('span'); s.className = 'info-pill'; s.textContent = text; return s; };
    infoEl.innerHTML = '';
    infoEl.appendChild(mk(`共 ${totalCount} 条记录`));
    infoEl.appendChild(mk(`今日上传 ${todayCount} 条`));
    infoEl.appendChild(mk(`最后次上传 ${latestCount} 条`));
  }
}
confirmCancel?.addEventListener('click', () => {
  confirmModal.style.display = 'none';
  pendingDeleteIndex = null;
  pendingDeleteTab = null;
});
confirmOk?.addEventListener('click', async () => {
  if (pendingDeleteIndex !== null && pendingDeleteTab) {
    const target = contactsData[pendingDeleteTab][pendingDeleteIndex];
    const name = target?.name || '';
    const ownerLabel = target?.owner || '';
    const inUse = payRecords.some(x => (x.partner||'') === name) || records.some(x => (x.client||'') === name) || (parseFloat(partnerArrears(name, ownerLabel)) > 0);
    if (inUse) {
      alert('该客户正在使用中，无法被删除');
    } else {
      const ok = await apiContactsDeleteByName(ownerLabel || (pendingDeleteTab==='customers'?'客户':pendingDeleteTab==='merchants'?'商家':'其它'), name);
      if (ok) contactsData[pendingDeleteTab].splice(pendingDeleteIndex,1);
      await apiContactsList(pendingDeleteTab, contactsSearch?.value || '', contactsPage, contactsPageSize);
      renderContacts();
      saveJSON('contactsData', contactsData);
    }
  }
  confirmModal.style.display = 'none';
  pendingDeleteIndex = null;
  pendingDeleteTab = null;
});
document.querySelectorAll('.tab[data-tab]').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    contactsTab = b.getAttribute('data-tab');
    contactsPage = 1;
    renderContacts();
  });
});
contactsSearch?.addEventListener('input', () => { contactsPage = 1; renderContacts(); });
const ctForm = document.getElementById('contacts-form');
const ctSubmitBtn = document.getElementById('contacts-submit');
const ctSubmitTop = document.getElementById('contacts-submit-top');
let editingIndex = null;
let editingTab = null;
function fillContactsForm(r) {
  document.getElementById('ct-name').value = r.name || '';
  document.getElementById('ct-company').value = r.company || '';
  document.getElementById('ct-code').value = r.code || '';
  document.getElementById('ct-contact').value = r.contact || '';
  document.getElementById('ct-phone').value = r.phone || '';
  document.getElementById('ct-country').value = r.country || '';
  document.getElementById('ct-address').value = r.address || '';
  document.getElementById('ct-zip').value = r.zip || '';
  document.getElementById('ct-city').value = r.city || '';
  document.getElementById('ct-remark').value = r.remark || '';
  const ctSales = document.getElementById('ct-sales'); if (ctSales) ctSales.value = r.sales || '';
}
function clearContactsForm() {
  ['ct-name','ct-company','ct-code','ct-contact','ct-phone','ct-country','ct-address','ct-zip','ct-city','ct-remark'].forEach(id => document.getElementById(id).value='');
  const ctSales = document.getElementById('ct-sales'); if (ctSales) ctSales.value = '';
}
ctSubmitTop?.addEventListener('click', () => { ctForm?.requestSubmit?.(); });
ctForm?.addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('ct-name').value.trim();
  const company = document.getElementById('ct-company').value.trim();
  const code = document.getElementById('ct-code').value.trim();
  const contact = document.getElementById('ct-contact').value.trim();
  const phone = document.getElementById('ct-phone').value.trim();
  const country = document.getElementById('ct-country').value.trim();
  const address = document.getElementById('ct-address').value.trim();
  const zip = document.getElementById('ct-zip').value.trim();
  const city = document.getElementById('ct-city').value.trim();
  const remark = document.getElementById('ct-remark').value.trim();
  const sales = (document.getElementById('ct-sales')?.value || '').trim();
  if (!name) return;
  if (editingIndex !== null) {
    const target = contactsData[editingTab][editingIndex];
    target.name = name;
    target.company = company;
    target.code = code;
    target.contact = contact;
    target.phone = phone;
    target.country = country;
    target.address = address;
    target.zip = zip;
    target.city = city;
    target.remark = remark;
    target.sales = sales || '';
    editingIndex = null;
    editingTab = null;
    ctSubmitBtn.textContent = '新增';
    if (ctSubmitTop) ctSubmitTop.textContent = '新增';
    await apiContactsUpdateByName({ name, company, code, contact, phone, city, remark, owner: contactsTab==='customers'?'客户':contactsTab==='merchants'?'商家':'其它', country, address, zip, sales: sales||'' });
  } else {
    const now = new Date();
    const created = `${now.getFullYear()}/${String(now.getMonth()+1).padStart(2,'0')}/${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    contactsData[contactsTab].push({ name, contact, phone, city, remark, owner: contactsTab==='customers'?'客户':contactsTab==='merchants'?'商家':'其它', created, company, code, country, address, zip, sales: sales || '' });
    await apiContactsCreate({ name, contact, phone, city, remark, owner: contactsTab==='customers'?'客户':contactsTab==='merchants'?'商家':'其它', created, company, code, country, address, zip, sales: sales || '' });
  }
  clearContactsForm();
  await apiContactsList(contactsTab, contactsSearch?.value || '', contactsPage, contactsPageSize);
  renderContacts();
  saveJSON('contactsData', contactsData);
});
const catList = document.getElementById('cat-list');
const addCatBtn = document.getElementById('add-cat');
const categoriesData = [
  { name:'收入', children:['服务收入(现金)','服务收入(银行)','银行储蓄','现金借贷','订单收入','其它收入'] },
  { name:'开支', children:['现金开支','员工工资','出差补贴','人工开支','其它开支'] }
];
function renderCats() {
  catList.innerHTML = '';
  categoriesData.forEach((cat, idx) => {
    const panel = document.createElement('div');
    panel.className = 'cat-panel';
    const header = document.createElement('div');
    header.className = 'cat-header';
    const title = document.createElement('div');
    title.className = 'cat-title';
    title.textContent = '— ' + cat.name;
    const actions = document.createElement('div');
    actions.className = 'cat-actions';
    const addBtn = document.createElement('button'); addBtn.className = 'btn-icon btn-green'; addBtn.textContent = '+'; addBtn.title = '新增二级类目';
    const editBtn = document.createElement('button'); editBtn.className = 'btn-icon btn-blue'; editBtn.textContent = '✎'; editBtn.title = '编辑一级类目';
    const delBlocked = (cat.name === '收入' || cat.name === '开支');
    actions.append(addBtn, editBtn);
    let delBtn = null;
    if (!delBlocked) {
      delBtn = document.createElement('button'); delBtn.className = 'btn-icon btn-red'; delBtn.textContent = '🗑'; delBtn.title = '删除一级类目';
      actions.append(delBtn);
    }
    header.append(title, actions);
    const items = document.createElement('div');
    items.className = 'cat-items';
    cat.children.forEach((name, j) => {
      const row = document.createElement('div');
      row.className = 'cat-item';
      const nm = document.createElement('div'); nm.className = 'cat-name'; nm.textContent = name;
      const ops = document.createElement('div'); ops.className = 'cat-actions';
      const e = document.createElement('button'); e.className = 'btn-icon btn-blue'; e.textContent = '✎'; e.title = '编辑';
      const d = document.createElement('button'); d.className = 'btn-icon btn-red'; d.textContent = '🗑'; d.title = '删除';
      ops.append(e, d);
      row.append(nm, ops);
      items.appendChild(row);
      e.addEventListener('click', () => {
        const val = prompt('编辑名称', name);
        if (val && val.trim()) { categoriesData[idx].children[j] = val.trim(); renderCats(); saveJSON('categoriesData', categoriesData); apiCategoriesSave(); }
      });
      d.addEventListener('click', () => {
        categoriesData[idx].children.splice(j,1);
        renderCats();
        saveJSON('categoriesData', categoriesData);
        apiCategoriesSave();
      });
    });
    panel.append(header, items);
    catList.appendChild(panel);
    addBtn.addEventListener('click', () => {
      const val = prompt('新增二级类目名称');
      if (val && val.trim()) { categoriesData[idx].children.push(val.trim()); renderCats(); saveJSON('categoriesData', categoriesData); apiCategoriesSave(); }
    });
    editBtn.addEventListener('click', () => {
      const val = prompt('编辑一级类目名称', cat.name);
      if (val && val.trim()) { categoriesData[idx].name = val.trim(); renderCats(); saveJSON('categoriesData', categoriesData); apiCategoriesSave(); }
    });
    if (delBtn) {
      delBtn.addEventListener('click', () => {
        if (confirm('确定删除该一级类目？')) { categoriesData.splice(idx,1); renderCats(); saveJSON('categoriesData', categoriesData); apiCategoriesSave(); }
      });
    }
  });
  refreshLedgerTypeOptions();
  setCategories();
}
addCatBtn?.addEventListener('click', () => {
  const val = prompt('新增一级类目名称');
  if (val && val.trim()) { categoriesData.push({ name: val.trim(), children: [] }); renderCats(); saveJSON('categoriesData', categoriesData); apiCategoriesSave(); }
});
const roleRows = document.getElementById('role-rows');
const roleSearch = document.getElementById('role-search');
const rolePageSize = document.getElementById('role-page-size');
const rolePrev = document.getElementById('role-prev');
const roleNext = document.getElementById('role-next');
const rolePageEl = document.getElementById('role-page');
const roleSummary = document.getElementById('role-summary');
const roleCreate = document.getElementById('role-create');
const roleModal = document.getElementById('role-modal');
const roleForm = document.getElementById('role-form');
const roleCancel = document.getElementById('role-cancel');
const rolesData = [];
const permSchema = {
  home: { label:'首页', actions:{ view:'进入' } },
  ledger: { label:'收支记账', actions:{ view:'进入', create:'新增', edit:'编辑', delete:'删除', export:'导出' } },
  payables: { label:'应收/应付账款', actions:{ view:'进入', create:'新增', edit:'编辑', delete:'删除', import:'批量导入', export:'导出' } },
  contacts: { label:'往来单位', actions:{ view:'进入', create:'新增', edit:'编辑', delete:'删除' } },
  analytics: { label:'统计分析', actions:{ view:'进入' } },
  categories: { label:'分类管理', actions:{ view:'进入', manage:'维护类目' } },
  accounts: { label:'账户管理', actions:{ view:'进入', create_account:'新增账户', edit_account:'编辑账户', delete_account:'删除账户', init_account:'初始金额' } },
  user_accounts: { label:'帐号管理', actions:{ view:'进入', create_user:'创建账号', reset_password:'重置密码', enable_user:'启用/停用' } },
  role_accounts: { label:'角色管理', actions:{ view:'进入', create_role:'创建角色', edit_role:'编辑角色', delete_role:'删除角色' } },
  sales_accounts: { label:'业务员管理', actions:{ view:'进入', create_sales:'新增', edit_sales:'编辑', delete_sales:'删除' } }
};
function allTruePerms() {
  const p = {}; Object.keys(permSchema).forEach(m => { p[m]={}; Object.keys(permSchema[m].actions).forEach(a => p[m][a]=true); }); return p;
}
function getRoleByName(name) { return rolesData.find(r => r.name === name); }
function currentUserRole() {
  const u = getAuthUser();
  if (!u) return null;
  const roleName = u.role || (u.name==='aaaaaa'?'超级管理员':'');
  return getRoleByName(roleName) || null;
}
function currentPerms() {
  const r = currentUserRole();
  if (!r || r.name==='超级管理员') return allTruePerms();
  return r.perms || {};
}
function can(module, action) {
  const u = getAuthUser();
  const roleName = (u?.role) || getUserRoleName(u?.name || '');
  if (roleName === '超级管理员') return true;
  const role = rolesData.find(r => r.name === roleName);
  const perms = role?.perms || {};
  const m = perms[module] || {};
  return action ? !!m[action] : !!m.view;
}
const rolePermsModal = document.getElementById('role-perms-modal');
const rolePermsForm = document.getElementById('role-perms-form');
const rolePermsCancel = document.getElementById('role-perms-cancel');
const permsWrap = document.getElementById('perms-wrap');
const rolePermsPageEl = document.getElementById('page-role-perms');
const rolePermsBack = document.getElementById('role-perms-back');
const rolePermsFormPage = document.getElementById('role-perms-form-page');
const permsPageWrap = document.getElementById('perms-page-wrap');
let editingPermRole = null;
function openPermsEditor(role) {
  editingPermRole = role;
  permsPageWrap.innerHTML = '';
  const perms = role.perms || {};
  Object.keys(permSchema).forEach(mod => {
    const box = document.createElement('div'); box.className='cat-panel';
    const top = document.createElement('div'); top.className='cat-header'; top.textContent = permSchema[mod].label;
    const cont = document.createElement('div'); cont.style.padding='12px 16px';
    Object.entries(permSchema[mod].actions).forEach(([act,label]) => {
      const row = document.createElement('label'); row.style.display='block'; row.style.margin='6px 0'; row.style.cursor='pointer';
      const cb = document.createElement('input'); cb.type='checkbox'; cb.dataset.mod=mod; cb.dataset.act=act; cb.checked = !!(perms[mod] && perms[mod][act]);
      cb.style.marginRight='8px';
      row.append(cb, document.createTextNode(label));
      cont.appendChild(row);
    });
    box.append(top, cont);
    permsPageWrap.appendChild(box);
  });
  location.hash = '#role-perms';
}
rolePermsCancel?.addEventListener('click', () => { rolePermsModal.style.display='none'; editingPermRole=null; });
rolePermsForm?.addEventListener('submit', async e => {
  e.preventDefault();
  if (!editingPermRole) return;
  const newPerms = {};
  Object.keys(permSchema).forEach(m => { newPerms[m] = {}; });
  permsWrap.querySelectorAll('input[type=checkbox]').forEach(cb => {
    const mod = cb.dataset.mod; const act = cb.dataset.act;
    if (cb.checked) newPerms[mod][act] = true;
  });
  editingPermRole.perms = newPerms;
  await apiRoleUpdatePerms(editingPermRole.id, newPerms);
  rolePermsModal.style.display='none';
  editingPermRole = null;
  renderRoles();
});
rolePermsBack?.addEventListener('click', () => { location.hash = '#role-accounts'; });
rolePermsFormPage?.addEventListener('submit', async e => {
  e.preventDefault();
  if (!editingPermRole) return;
  const newPerms = {};
  Object.keys(permSchema).forEach(m => { newPerms[m] = {}; });
  permsPageWrap.querySelectorAll('input[type=checkbox]').forEach(cb => {
    const mod = cb.dataset.mod; const act = cb.dataset.act;
    if (cb.checked) newPerms[mod][act] = true;
  });
  editingPermRole.perms = newPerms;
  await apiRoleUpdatePerms(editingPermRole.id, newPerms);
  editingPermRole = null;
  location.hash = '#role-accounts';
  renderRoles();
});
let rolePage = 1;
async function apiRolesList() {
  try {
    const list = await apiFetchJSON('/api/roles');
    if (Array.isArray(list)) rolesData.splice(0, rolesData.length, ...list.map(r => ({ id:r.id, name:r.name, desc:r.desc||'', created:r.created||'', immutable: !!r.immutable, perms: r.perms || {} })));
  } catch {}
}
async function apiRoleCreate(obj) {
  try { const r = await apiFetchJSON('/api/roles', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(obj) }); return r?.id; } catch { return null; }
}
async function apiRoleDelete(id) {
  try { const r = await fetch(API_BASE + '/api/roles/'+String(id), { method:'DELETE' }); return r.ok; } catch { return false; }
}
async function apiRoleUpdatePerms(id, perms) {
  try { await apiFetchJSON('/api/roles/'+String(id)+'/perms', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ perms }) }); } catch {}
}
function renderRoles() {
  const key = (roleSearch?.value || '').trim();
  const size = parseInt(rolePageSize?.value || '10', 10);
  const data = rolesData.filter(r => {
    if (!key) return true;
    return [r.name, r.desc, String(r.id)].some(v => (v||'').includes(key));
  }).sort((a,b)=>b.id-a.id);
  const total = data.length;
  const totalPages = Math.max(1, Math.ceil(total/size));
  if (rolePage > totalPages) rolePage = totalPages;
  const start = (rolePage-1)*size;
  const pageData = data.slice(start, start+size);
  roleRows.innerHTML = '';
  pageData.forEach(r => {
    const tr = document.createElement('tr');
    [r.id, r.name, r.desc, r.created].forEach(v => { const td = document.createElement('td'); td.textContent = v; tr.appendChild(td); });
    const ops = document.createElement('td'); ops.className='actions';
    if ((r.name || '') === '超级管理员') {
      const tip = document.createElement('span'); tip.className='tag'; tip.textContent='不可编辑/删除';
      ops.append(tip);
    } else {
      const edit = document.createElement('a'); edit.href='#'; edit.textContent='编辑'; edit.className='link-blue';
      ops.append(edit);
      edit.addEventListener('click', e => { e.preventDefault(); openPermsEditor(r); });
    }
    tr.appendChild(ops);
    roleRows.appendChild(tr);
  });
  roleSummary.textContent = `显示 ${Math.min(total,start+1)} 到 ${Math.min(total,start+pageData.length)} 项，共 ${total} 项`;
  rolePageEl.textContent = String(rolePage);
}
roleSearch?.addEventListener('input', () => { rolePage = 1; renderRoles(); });
rolePageSize?.addEventListener('change', () => { rolePage = 1; renderRoles(); });
rolePrev?.addEventListener('click', () => { if (rolePage > 1) { rolePage--; renderRoles(); } });
roleNext?.addEventListener('click', () => {
  const size = parseInt(rolePageSize?.value || '10',10);
  const totalPages = Math.max(1, Math.ceil(rolesData.filter(r => (roleSearch?.value||'') ? [r.name,r.desc,String(r.id)].some(v => v.includes(roleSearch.value)) : true).length/size));
  if (rolePage < totalPages) { rolePage++; renderRoles(); }
});
roleCreate?.addEventListener('click', () => {
  roleModal.style.display = 'flex';
  document.getElementById('r-name').value='';
  document.getElementById('r-desc').value='';
});
roleCancel?.addEventListener('click', () => { roleModal.style.display = 'none'; });
roleForm?.addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('r-name').value.trim();
  const desc = document.getElementById('r-desc').value.trim();
  if (!name) return;
  const now = new Date();
  const created = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
  await apiRoleCreate({ name, desc, created, perms:{} });
  await apiRolesList();
  roleModal.style.display = 'none';
  rolePage = 1;
  renderRoles();
});
const userRows = document.getElementById('user-rows');
const userSearch = document.getElementById('user-search');
const userPageSize = document.getElementById('user-page-size');
const userPrev = document.getElementById('user-prev');
const userNext = document.getElementById('user-next');
const userPageEl = document.getElementById('user-page');
const userSummary = document.getElementById('user-summary');
const userCreate = document.getElementById('user-create');
const userModal = document.getElementById('user-modal');
const userForm = document.getElementById('user-form');
const userCancel = document.getElementById('user-cancel');
const userAccounts = [];
(function syncInitialPasswords(){
  const m = getPwdMap();
  userAccounts.forEach(u => { if (u.password) m[u.name] = u.password; });
  setPwdMap(m);
})();
let userPage = 1;
function renderUserAccounts() {
  const key = (userSearch?.value || '').trim();
  const size = parseInt(userPageSize?.value || '10', 10);
  const data = userAccounts.filter(u => {
    if (!key) return true;
    return [u.name, u.role, String(u.id)].some(v => (v||'').includes(key));
  }).sort((a,b)=>b.id-a.id);
  const total = data.length;
  const totalPages = Math.max(1, Math.ceil(total/size));
  if (userPage > totalPages) userPage = totalPages;
  const start = (userPage-1)*size;
  const pageData = data.slice(start, start+size);
  if (!userRows) return;
  userRows.innerHTML = '';
  pageData.forEach(u => {
    const tr = document.createElement('tr');
    const tdId = document.createElement('td'); tdId.textContent = String(u.id); tr.appendChild(tdId);
    const tdName = document.createElement('td'); tdName.textContent = u.name; tr.appendChild(tdName);
    const tdRole = document.createElement('td');
    if (u.name === 'aaaaaa') {
      tdRole.textContent = '超级管理员';
    } else {
      const sel = document.createElement('select');
      rolesData.forEach(r => {
        const opt = document.createElement('option'); opt.value = r.name; opt.textContent = r.name;
        sel.appendChild(opt);
      });
      sel.value = u.role || '';
      sel.addEventListener('change', () => {
        u.role = sel.value || '';
        saveJSON('userAccounts', userAccounts);
        const au = getAuthUser();
        if (au && au.name === u.name) setAuthUser({ ...au, role: u.role });
        renderUserAccounts();
      });
      tdRole.appendChild(sel);
    }
    tr.appendChild(tdRole);
    const tdCreated = document.createElement('td'); tdCreated.textContent = u.created || ''; tr.appendChild(tdCreated);
    const tdStatus = document.createElement('td');
    const sw = document.createElement('div'); sw.className = 'switch' + (u.enabled ? '' : ' off');
    const btn = document.createElement('button'); btn.textContent = u.enabled ? 'ON' : 'OFF';
    btn.addEventListener('click', async () => { u.enabled = !u.enabled; await apiUserUpdate(u.id, { role: u.role, enabled: u.enabled }); renderUserAccounts(); saveJSON('userAccounts', userAccounts); });
    sw.appendChild(btn); tdStatus.appendChild(sw); tr.appendChild(tdStatus);
    const tdOps = document.createElement('td');
    const reset = document.createElement('a'); reset.href='#'; reset.textContent='重置密码'; reset.className='link-blue';
    reset.addEventListener('click', e => {
      e.preventDefault();
      pendingResetUser = u;
      const np = u.name === 'aaaaaa' ? '999000' : '111111';
      resetMsg.textContent = `已经将帐号 ${u.name} 密码重置，重置后密码为“${np}”`;
      resetModal.style.display = 'flex';
    });
    tdOps.appendChild(reset); tr.appendChild(tdOps);
    userRows.appendChild(tr);
  });
  if (userSummary) userSummary.textContent = `显示 ${Math.min(total,start+1)} 到 ${Math.min(total,start+pageData.length)} 项，共 ${total} 项`;
  if (userPageEl) userPageEl.textContent = String(userPage);
}
userSearch?.addEventListener('input', () => { userPage = 1; renderUserAccounts(); });
userPageSize?.addEventListener('change', () => { userPage = 1; renderUserAccounts(); });
userPrev?.addEventListener('click', () => { if (userPage > 1) { userPage--; renderUserAccounts(); } });
userNext?.addEventListener('click', () => {
  const size = parseInt(userPageSize?.value || '10',10);
  const totalPages = Math.max(1, Math.ceil(userAccounts.filter(u => (userSearch?.value||'') ? [u.name,u.role,String(u.id)].some(v => v.includes(userSearch.value)) : true).length/size));
  if (userPage < totalPages) { userPage++; renderUserAccounts(); }
});
userCreate?.addEventListener('click', () => { userModal.style.display = 'flex'; document.getElementById('u-name').value=''; document.getElementById('u-role').value=''; });
userCancel?.addEventListener('click', () => { userModal.style.display = 'none'; });
userForm?.addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('u-name').value.trim();
  const role = document.getElementById('u-role').value.trim() || '普通用户';
  if (!name) return;
  const now = new Date();
  const created = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
  await apiUserCreate({ name, role, created, password:'111111' });
  await apiUsersList();
  userModal.style.display = 'none';
  userPage = 1;
  renderUserAccounts();
});
const salesRows = document.getElementById('sales-rows');
const salesSearch = document.getElementById('sales-search');
const salesCreate = document.getElementById('sales-create');
const salesModal = document.getElementById('sales-modal');
const salesForm = document.getElementById('sales-form');
const salesCancel = document.getElementById('sales-cancel');
const sName = document.getElementById('s-name');
const sRegion = document.getElementById('s-region');
const sPhone = document.getElementById('s-phone');
const sBase = document.getElementById('s-base');
const sRate = document.getElementById('s-rate');
const sCommission = document.getElementById('s-commission');
const salesData = [];
let editingSalesId = null;
function renderSales() {
  const key = (salesSearch?.value || '').trim();
  const data = salesData.filter(x => {
    if (!key) return true;
    return [x.name, x.region, x.phone].some(v => (v||'').includes(key));
  }).sort((a,b)=>b.id-a.id);
  if (!salesRows) return;
  salesRows.innerHTML = '';
  data.forEach(s => {
    const tr = document.createElement('tr');
    const related = payRecords.filter(r => (r.sales || '') === (s.name || ''));
    const docs = Array.from(new Set(related.map(r => (r.doc || '')).filter(Boolean)));
    const ordersCount = docs.length;
    const totalAmount = related.reduce((sum, r) => sum + (r.amount || 0), 0);
    const arrearsAmount = related.reduce((sum, r) => sum + Math.max(0, (r.amount || 0) - (r.paid || 0)), 0);
    const cells = [s.id, s.name, s.region || '', s.phone || '', (s.base||0).toFixed(2), (s.rate||0), (s.commission||0).toFixed(2)];
    cells.forEach(v => { const td = document.createElement('td'); td.textContent = String(v); tr.appendChild(td); });
    const tdOrders = document.createElement('td');
    const aOrders = document.createElement('a'); aOrders.href='#'; aOrders.textContent=String(ordersCount); aOrders.className='link-blue';
    tdOrders.appendChild(aOrders); tr.appendChild(tdOrders);
    const tdTotal = document.createElement('td'); tdTotal.textContent = totalAmount.toFixed(2); tr.appendChild(tdTotal);
    const tdArrears = document.createElement('td'); tdArrears.textContent = arrearsAmount.toFixed(2); tdArrears.style.color = '#ef4444'; tr.appendChild(tdArrears);
    const tdCreated = document.createElement('td'); tdCreated.textContent = s.created || ''; tr.appendChild(tdCreated);
    const ops = document.createElement('td'); ops.className='actions';
    const edit = document.createElement('a'); edit.href='#'; edit.textContent='编辑'; edit.className='link-blue';
    const del = document.createElement('a'); del.href='#'; del.textContent='删除'; del.className='link-red';
    ops.append(edit, document.createTextNode(' '), del);
    tr.appendChild(ops);
    salesRows.appendChild(tr);
    aOrders.addEventListener('click', e => { e.preventDefault(); openSalesOrders(s.name); });
    edit.addEventListener('click', e => {
      e.preventDefault();
      editingSalesId = s.id;
      sName.value = s.name || '';
      sRegion.value = s.region || '';
      sPhone.value = s.phone || '';
      sBase.value = s.base != null ? s.base : '';
      sRate.value = s.rate != null ? s.rate : '';
      sCommission.value = s.commission != null ? s.commission : '';
      salesModal.style.display = 'flex';
    });
    del.addEventListener('click', async e => {
      e.preventDefault();
      if (!confirm('确定删除该业务员？')) return;
      const i = salesData.findIndex(x => x.id === s.id);
      if (i>=0) {
        const ok = await apiSalesDelete(s.id);
        if (ok) salesData.splice(i,1);
        await apiSalesList(salesSearch?.value || '');
        renderSales();
        saveJSON('salesData', salesData);
      }
    });
    tdArrears.addEventListener('click', e => { e.preventDefault(); openSalesArrears(s.name); });
  });
  const sel = document.getElementById('ct-sales');
  if (sel) {
    const prev = sel.value;
    sel.innerHTML = '<option value="">请选择业务员</option>';
    salesData.forEach(s => {
      const opt = document.createElement('option'); opt.value = s.name; opt.textContent = s.name;
      sel.appendChild(opt);
    });
    if ([...sel.options].some(o => o.value === prev)) sel.value = prev;
  }
}
salesCreate?.addEventListener('click', () => {
  editingSalesId = null;
  sName.value=''; sRegion.value=''; sPhone.value=''; sBase.value=''; sRate.value=''; sCommission.value='';
  salesModal.style.display = 'flex';
});
salesCancel?.addEventListener('click', () => { salesModal.style.display = 'none'; editingSalesId = null; });
salesForm?.addEventListener('submit', async e => {
  e.preventDefault();
  const name = sName.value.trim();
  const region = sRegion.value.trim();
  const phone = sPhone.value.trim();
  const base = parseFloat(sBase.value || '0');
  const rate = parseFloat(sRate.value || '0');
  const commission = parseFloat(sCommission.value || '0');
  if (!name || !phone) return;
  if (editingSalesId != null) {
    const s = salesData.find(x => x.id === editingSalesId);
    if (s) { s.name=name; s.region=region; s.phone=phone; s.base=isNaN(base)?0:base; s.rate=isNaN(rate)?0:rate; s.commission=isNaN(commission)?0:commission; }
    await apiSalesUpdate(editingSalesId, { name, region, phone, base:isNaN(base)?0:base, rate:isNaN(rate)?0:rate, commission:isNaN(commission)?0:commission });
  } else {
    const maxId = salesData.reduce((m,x)=>Math.max(m,x.id||0),0);
    const now = new Date();
    const created = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    salesData.push({ id:maxId+1, name, region, phone, base:isNaN(base)?0:base, rate:isNaN(rate)?0:rate, commission:isNaN(commission)?0:commission, created });
    await apiSalesCreate({ name, region, phone, base:isNaN(base)?0:base, rate:isNaN(rate)?0:rate, commission:isNaN(commission)?0:commission, created });
  }
  salesModal.style.display = 'none';
  editingSalesId = null;
  await apiSalesList(salesSearch?.value || '');
  renderSales();
  saveJSON('salesData', salesData);
});
salesSearch?.addEventListener('input', async () => { await apiSalesList(salesSearch?.value || ''); renderSales(); });
const salesOrdersModal = document.getElementById('sales-orders-modal');
const salesOrdersRows = document.getElementById('sales-orders-rows');
const salesOrdersHead = document.getElementById('sales-orders-head');
const salesOrdersClose = document.getElementById('sales-orders-close');
const salesArrearsModal = document.getElementById('sales-arrears-modal');
const salesArrearsRows = document.getElementById('sales-arrears-rows');
const salesArrearsHead = document.getElementById('sales-arrears-head');
const salesArrearsClose = document.getElementById('sales-arrears-close');
function openSalesOrders(name) {
  salesOrdersHead.textContent = '业务员：' + (name || '');
  const list = payRecords.filter(r => (r.sales || '') === (name || ''));
  salesOrdersRows.innerHTML = '';
  list.forEach(r => {
    const tr = document.createElement('tr');
    const paid = r.paid || 0;
    const arrears = Math.max(0, (r.amount || 0) - paid);
    [r.type, r.partner || '', r.doc || '', (r.amount||0).toFixed(2), paid.toFixed(2), arrears.toFixed(2), r.date || ''].forEach((v,i) => {
      const td = document.createElement('td');
      td.textContent = String(v);
      if (i===5 && arrears>0) td.style.color = '#ef4444';
      tr.appendChild(td);
    });
    salesOrdersRows.appendChild(tr);
  });
  salesOrdersModal.style.display = 'flex';
}
function openSalesArrears(name) {
  salesArrearsHead.textContent = '业务员：' + (name || '');
  const list = payRecords.filter(r => (r.sales || '') === (name || '') && Math.max(0,(r.amount||0) - (r.paid||0)) > 0);
  salesArrearsRows.innerHTML = '';
  list.forEach(r => {
    const tr = document.createElement('tr');
    const paid = r.paid || 0;
    const remain = Math.max(0, (r.amount || 0) - paid);
    [r.type, r.partner || '', r.doc || '', (r.amount||0).toFixed(2), paid.toFixed(2), remain.toFixed(2), r.date || ''].forEach((v,i) => {
      const td = document.createElement('td');
      td.textContent = String(v);
      if (i===5) td.style.color = '#ef4444';
      tr.appendChild(td);
    });
    salesArrearsRows.appendChild(tr);
  });
  salesArrearsModal.style.display = 'flex';
}
salesOrdersClose?.addEventListener('click', () => { salesOrdersModal.style.display = 'none'; });
salesArrearsClose?.addEventListener('click', () => { salesArrearsModal.style.display = 'none'; });
const logoutBtn = document.getElementById('logout-btn');
const authUserTag = document.getElementById('auth-user-tag');
const loginForm = document.getElementById('login-form');
const loginUser = document.getElementById('login-user');
const loginPass = document.getElementById('login-pass');
const loginMsg = document.getElementById('login-msg');
function getAuthUser() {
  try { return JSON.parse(localStorage.getItem('authUser') || 'null'); } catch { return null; }
}
function setAuthUI() {
  const u = getAuthUser();
  if (u) {
    authUserTag.style.display = 'inline-block';
    authUserTag.textContent = '当前用户：' + u.name;
    logoutBtn.style.display = 'block';
  } else {
    authUserTag.style.display = 'none';
    logoutBtn.style.display = 'none';
  }
}
function setAuthUser(u) {
  if (u) localStorage.setItem('authUser', JSON.stringify(u));
  else localStorage.removeItem('authUser');
  setAuthUI();
}
function getUserRoleName(name) {
  const au = getAuthUser();
  if (au && au.name === name) return au.role || '';
  return '';
}
function getPwdMap() {
  try { return JSON.parse(localStorage.getItem('userPasswords') || '{}'); } catch { return {}; }
}
function setPwdMap(map) {
  localStorage.setItem('userPasswords', JSON.stringify(map || {}));
}
const API_BASE = ((location.hostname === 'localhost') && location.port && location.port !== '80' && location.port !== '443') ? 'http://localhost:5001' : '';
function getAuthToken() { try { return localStorage.getItem('authToken') || ''; } catch { return ''; } }
async function apiFetchJSON(path, opts) {
  const token = getAuthToken();
  const headers = Object.assign({}, (opts && opts.headers) || {});
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const r = await fetch(API_BASE + path, { ...(opts||{}), headers });
  if (r.status === 401) { location.hash = '#login'; throw new Error('unauthorized'); }
  if (!r.ok) throw new Error('network_error');
  return await r.json();
}
async function loadLedgerFromServer() {
  try {
    const list = await apiFetchJSON('/api/ledger');
    if (Array.isArray(list)) {
      records.splice(0, records.length, ...list.map(r => {
        const createdRaw = Number(r.created_at);
        const createdAt = Number.isFinite(createdRaw) && createdRaw > 0 ? createdRaw : (Date.parse(r.date_time || r.date || '') || Date.now());
        return {
          id: r.id,
          type: r.type || '',
          category: r.category || '',
          doc: r.doc || '',
          client: r.client || '',
          amount: Number(r.amount || 0),
          method: r.method || '',
          file: r.file || '',
          notes: r.notes || '',
          date: r.date || '',
          dateTime: r.date_time || '',
          createdAt,
          createdBy: r.created_by || '',
          confirmed: r.confirmed !== false,
          entry: '手动'
        };
      }));
      saveJSON('records', records);
      applyFilters();
      const hm = document.getElementById('page-home');
      if (hm && hm.style.display === 'block') renderHomeChart(homePeriodSel?.value || 'month');
    }
  } catch {}
}
async function loadPayablesFromServer() {
  try {
    const list = await apiFetchJSON('/api/payables');
    if (Array.isArray(list)) {
      payRecords.splice(0, payRecords.length, ...list.map(r => {
        const createdRaw = Number(r.created_at);
        const createdAt = Number.isFinite(createdRaw) && createdRaw > 0 ? createdRaw : (Date.parse(r.date || '') || Date.now());
        return {
          id: r.id,
          type: r.type, partner: r.partner, doc: r.doc, sales: r.sales,
          amount: Number(r.amount||0), paid: Number(r.paid||0),
          trustDays: r.trust_days ?? null, notes: r.notes || '',
          date: r.date || '', settled: !!r.settled, history: r.history || [],
          createdAt, invoiceNo: r.invoice_no || '',
          invoiceDate: r.invoice_date || '', invoiceAmount: Number(r.invoice_amount||0),
          source: r.source || 'import', batchAt: r.batch_at || 0, batchOrder: r.batch_order ?? 0,
          confirmed: r.confirmed !== false
        };
      }));
      saveJSON('payRecords', payRecords);
      renderPayables();
    }
  } catch {}
}
async function apiContactsList(tab, q, page, size) {
  try {
    const params = new URLSearchParams({ tab: tab||'customers', q: q||'', page: String(page||1), size: String(size||100) });
    const list = await apiFetchJSON('/api/contacts?' + params.toString());
    const key = tab==='merchants'?'merchants':(tab==='others'?'others':'customers');
    if (Array.isArray(list)) contactsData[key] = list.map(x => ({
      name:x.name, contact:x.contact, phone:x.phone, city:x.city, remark:x.remark, owner:x.owner, created:x.created,
      company:x.company, code:x.code, country:x.country, address:x.address, zip:x.zip, sales:x.sales
    }));
  } catch {}
}
async function apiContactsCreate(obj) {
  try {
    await apiFetchJSON('/api/contacts', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(obj) });
  } catch {}
}
async function apiContactsUpdateByName(obj) {
  try {
    await apiFetchJSON('/api/contacts/by-name', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(obj) });
  } catch {}
}
async function apiContactsDeleteByName(owner, name) {
  try {
    const params = new URLSearchParams({ owner, name });
    const r = await fetch(API_BASE + '/api/contacts/by-name?' + params.toString(), { method:'DELETE' });
    return r.ok;
  } catch { return false; }
}
function ownerLabelOfTab(tab) {
  return tab==='merchants' ? '商家' : (tab==='others' ? '其它' : '客户');
}
async function seedDefaultContacts(tab) {
  const owner = ownerLabelOfTab(tab);
  const now = new Date();
  const created = `${now.getFullYear()}/${String(now.getMonth()+1).padStart(2,'0')}/${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
  let seeds = [];
  if (owner === '商家') {
    seeds = [
      { name:'商家A', contact:'刘一', phone:'13900000001', city:'上海', remark:'', owner, created },
      { name:'商家B', contact:'陈二', phone:'13900000002', city:'杭州', remark:'', owner, created },
      { name:'商家C', contact:'周三', phone:'13900000003', city:'苏州', remark:'', owner, created }
    ];
  } else if (owner === '其它') {
    seeds = [
      { name:'单位A', contact:'赵一', phone:'13700000001', city:'上海', remark:'', owner, created },
      { name:'单位B', contact:'钱二', phone:'13700000002', city:'杭州', remark:'', owner, created },
      { name:'单位C', contact:'孙三', phone:'13700000003', city:'苏州', remark:'', owner, created }
    ];
  } else {
    seeds = [
      { name:'客户A', contact:'张一', phone:'13800000001', city:'上海', remark:'', owner, created },
      { name:'客户B', contact:'李二', phone:'13800000002', city:'杭州', remark:'', owner, created },
      { name:'客户C', contact:'王三', phone:'13800000003', city:'苏州', remark:'', owner, created }
    ];
  }
  const existing = (contactsData[tab] || []);
  for (const s of seeds) {
    const exists = existing.some(x => (x.name === s.name) && (x.owner === owner));
    if (!exists) { try { await apiContactsCreate(s); } catch {} }
  }
}
async function apiAccountsList() {
  try {
    const list = await apiFetchJSON('/api/accounts');
    if (Array.isArray(list)) {
      accountsData.splice(0, accountsData.length, ...list.map(x => ({ name:x.name, balance:Number(x.balance||0), desc:x.desc||'', created:x.created||'', initialSet: !!x.initial_set })));
    }
  } catch {}
}
async function apiAccountCreate(obj) {
  try { await apiFetchJSON('/api/accounts', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(obj) }); } catch {}
}
async function apiAccountUpdateByName(obj) {
  try { await apiFetchJSON('/api/accounts/by-name', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(obj) }); } catch {}
}
async function apiAccountInit(name, amount) {
  try { await apiFetchJSON('/api/accounts/init', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, amount }) }); } catch {}
}
async function apiAccountDeleteByName(name) {
  try {
    const params = new URLSearchParams({ name });
    const r = await fetch(API_BASE + '/api/accounts/by-name?' + params.toString(), { method:'DELETE' });
    return r.ok;
  } catch { return false; }
}
async function apiCategoriesList() {
  try {
    const list = await apiFetchJSON('/api/categories');
    if (Array.isArray(list)) {
      categoriesData.splice(0, categoriesData.length, ...list.map(x => ({ name: x.name, children: Array.isArray(x.children) ? x.children : [] })));
    }
  } catch {}
}
async function apiCategoriesSave() {
  try {
    await apiFetchJSON('/api/categories', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ list: categoriesData }) });
  } catch {}
}
async function apiSalesList(q) {
  try {
    const params = new URLSearchParams({ q: q||'' });
    const list = await apiFetchJSON('/api/sales?' + params.toString());
    if (Array.isArray(list)) {
      salesData.splice(0, salesData.length, ...list.map(x => ({ id:x.id, name:x.name, region:x.region||'', phone:x.phone||'', base:Number(x.base||0), rate:Number(x.rate||0), commission:Number(x.commission||0), created:x.created||'' })));
    }
  } catch {}
}
async function apiSalesCreate(obj) {
  try { const r = await apiFetchJSON('/api/sales', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(obj) }); return r?.id; } catch { return null; }
}
async function apiSalesUpdate(id, obj) {
  try { await apiFetchJSON('/api/sales/' + String(id||0), { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(obj) }); } catch {}
}
async function apiSalesDelete(id) {
  try { const r = await fetch(API_BASE + '/api/sales/' + String(id||0), { method:'DELETE' }); return r.ok; } catch { return false; }
}
async function apiUsersList() {
  try {
    const list = await apiFetchJSON('/api/users');
    if (Array.isArray(list)) userAccounts.splice(0, userAccounts.length, ...list.map(u => ({ id:u.id, name:u.name, role:u.role||'', created:u.created||'', enabled: !!u.enabled })));
  } catch {}
}
async function apiUserCreate(obj) {
  try { const r = await apiFetchJSON('/api/users', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(obj) }); return r?.id; } catch { return null; }
}
async function apiUserUpdate(id, obj) {
  try { await apiFetchJSON('/api/users/'+String(id), { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(obj) }); } catch {}
}
async function apiUserResetPassword(id, password) {
  try { await apiFetchJSON('/api/users/'+String(id)+'/reset-password', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ password }) }); } catch {}
}
const logoutModal = document.getElementById('logout-modal');
const logoutCancel = document.getElementById('logout-cancel');
const logoutOk = document.getElementById('logout-ok');
const resetModal = document.getElementById('reset-modal');
const resetMsg = document.getElementById('reset-msg');
const resetCancel = document.getElementById('reset-cancel');
const resetOk = document.getElementById('reset-ok');
let pendingResetUser = null;
logoutBtn?.addEventListener('click', () => {
  logoutModal.style.display = 'flex';
});
authUserTag?.addEventListener('click', () => {
  const u = getAuthUser();
  const cpUser = document.getElementById('cp-user');
  const oldEl = document.getElementById('cp-old');
  const n1 = document.getElementById('cp-new1');
  const n2 = document.getElementById('cp-new2');
  if (cpUser) cpUser.textContent = u?.name || '';
  if (oldEl) oldEl.value = '';
  if (n1) n1.value = '';
  if (n2) n2.value = '';
  document.getElementById('change-pwd-modal').style.display = 'flex';
});
logoutCancel?.addEventListener('click', () => {
  logoutModal.style.display = 'none';
});
logoutOk?.addEventListener('click', () => {
  logoutModal.style.display = 'none';
  setAuthUser(null);
  localStorage.removeItem('authToken');
  location.href = './login.html';
});
resetCancel?.addEventListener('click', () => {
  resetModal.style.display = 'none';
  pendingResetUser = null;
});
resetOk?.addEventListener('click', async () => {
  if (pendingResetUser) {
    const np = pendingResetUser.name === 'aaaaaa' ? '999000' : '111111';
    await apiUserResetPassword(pendingResetUser.id, np);
    await apiUsersList();
    apiUsersList().then(() => renderUserAccounts());
  }
  resetModal.style.display = 'none';
  pendingResetUser = null;
});
const cpCancel = document.getElementById('cp-cancel');
const cpOk = document.getElementById('cp-ok');
cpCancel?.addEventListener('click', () => {
  document.getElementById('change-pwd-modal').style.display = 'none';
});
cpOk?.addEventListener('click', () => {
  const u = getAuthUser();
  const name = u?.name || '';
  const old = document.getElementById('cp-old').value || '';
  const n1 = document.getElementById('cp-new1').value || '';
  const n2 = document.getElementById('cp-new2').value || '';
  if (!name || !old || !n1 || !n2) return;
  if (n1 !== n2) { alert('两次输入的新密码不一致'); return; }
  const m = getPwdMap();
  const current = m[name] || (userAccounts.find(x => x.name === name)?.password || '');
  if (String(current) !== String(old)) { alert('当前密码不正确'); return; }
  m[name] = n1;
  setPwdMap(m);
  const idx = userAccounts.findIndex(x => x.name === name);
  if (idx >= 0) userAccounts[idx].password = n1;
  saveJSON('userAccounts', userAccounts);
  document.getElementById('change-pwd-modal').style.display = 'none';
  alert('修改密码成功');
});
loginForm?.addEventListener('submit', async e => {
  e.preventDefault();
  const name = (loginUser.value || '').trim();
  const password = loginPass.value || '';
  try {
    const r = await apiFetchJSON('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, password }) });
    if (r && r.token && r.user) {
      localStorage.setItem('authToken', r.token);
      setAuthUser({ name: r.user.name, role: r.user.role || '' });
      loginMsg.style.display = 'none';
      location.hash = '#ledger';
    } else { loginMsg.style.display = 'inline-block'; }
  } catch {
    loginMsg.style.display = 'inline-block';
  }
});
function tsOf(rec) {
  const ts = rec.createdAt || Date.parse(rec.dateTime || rec.date || '');
  return isNaN(ts) ? Date.now() : ts;
}
function formatLabel(ts, mode) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  if (mode === 'year') return String(y);
  if (mode === 'month') return `${y}-${m}`;
  return `${m}-${dd}`;
}
function buckets(mode) {
  const now = new Date();
  const list = [];
  if (mode === 'year') {
    for (let i=11;i>=0;i--) { const y = now.getFullYear() - i; list.push({ key: String(y), start: new Date(y,0,1).getTime(), end: new Date(y,11,31,23,59,59).getTime() }); }
  } else if (mode === 'day') {
    for (let i=29;i>=0;i--) { const d = new Date(now.getFullYear(), now.getMonth(), now.getDate()-i); const s=new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime(); const e=s+24*3600*1000-1; list.push({ key: formatLabel(s,'day'), start:s, end:e }); }
  } else {
    for (let i=11;i>=0;i--) { const d = new Date(now.getFullYear(), now.getMonth()-i, 1); const s=d.getTime(); const e=new Date(d.getFullYear(), d.getMonth()+1, 1).getTime()-1; list.push({ key: formatLabel(s,'month'), start:s, end:e }); }
  }
  return list;
}
async function renderHomeChart(mode='month') {
  if (!homeChartRows) return;
  let data = [];
  try {
    const range = mode==='day' ? 30 : 12;
    data = await apiFetchJSON(`/api/analytics/ledger-summary?period=${mode}&range=${range}`);
  } catch {
    const bs = buckets(mode);
    data = bs.map(b => {
      let income = 0, expense = 0;
      records.forEach(r => {
        const t = tsOf(r);
        if (t >= b.start && t <= b.end) {
          if (r.type === '收入') income += Number(r.amount||0);
          if (r.type === '开支' || r.type === '支出') expense += Number(r.amount||0);
        }
      });
      return { label: b.key, income, expense };
    });
  }
  const maxVal = Math.max(1, ...data.map(x => Math.max(x.income, x.expense)));
  const h = 220;
  homeChartRows.innerHTML = '';
  data.forEach(x => {
    const col = document.createElement('div');
    col.style.display='flex'; col.style.flexDirection='column'; col.style.alignItems='center'; col.style.gap='8px';
    const bars = document.createElement('div');
    bars.style.display='flex'; bars.style.gap='0px'; bars.style.alignItems='flex-end';
    const mkBar = (val,color) => {
      const b = document.createElement('div');
      b.style.width='12px'; b.style.height=Math.round(h*val/maxVal)+'px';
      b.style.background=color; b.style.border='1px solid #334155'; b.style.borderRadius='4px';
      const tag = document.createElement('div');
      tag.textContent = (val||0).toFixed(2);
      tag.style.color='#cbd5e1'; tag.style.fontSize='12px'; tag.style.textAlign='center';
      tag.style.marginBottom='4px';
      const wrap = document.createElement('div');
      wrap.style.display='flex'; wrap.style.flexDirection='column'; wrap.style.alignItems='center'; wrap.style.margin='0'; wrap.style.padding='0';
      wrap.appendChild(tag); wrap.appendChild(b);
      return wrap;
    };
    bars.appendChild(mkBar(x.income,'#16a34a'));
    bars.appendChild(mkBar(x.expense,'#f59e0b'));
    const label = document.createElement('div'); label.textContent = x.label; label.style.color='#94a3b8'; label.style.fontSize='12px';
    col.appendChild(bars); col.appendChild(label);
    homeChartRows.appendChild(col);
  });
}
homePeriodSel?.addEventListener('change', () => { const v=homePeriodSel.value||'month'; renderHomeChart(v); });
async function route() {
  const hash = location.hash || '#ledger';
  const au = getAuthUser(); if (au && !au.role) { setAuthUser({ ...au, role: getUserRoleName(au.name) }); }
  document.querySelectorAll('.nav a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === hash));
  (function applyNavPerms(){
    const u = getAuthUser();
    const roleName = (u?.role) || getUserRoleName(u?.name || '');
    const role = roleName ? rolesData.find(r => r.name === roleName) : null;
    const perms = (roleName==='超级管理员') ? allTruePerms() : (role?.perms || {});
    const map = {
      '#home':'home', '#ledger':'ledger', '#payables':'payables', '#contacts':'contacts', '#analytics':'analytics',
      '#system':'system', '#categories':'categories', '#accounts':'accounts', '#user-accounts':'user_accounts', '#role-accounts':'role_accounts', '#sales-accounts':'sales_accounts'
    };
    document.querySelectorAll('.nav a').forEach(a => {
      const m = map[a.getAttribute('href') || ''];
      const allow = (roleName==='超级管理员') ? true
        : (m==='home' ? true
        : (m==='system' ? false
        : !!(perms[m] && perms[m].view)));
      a.style.display = allow ? 'block' : 'none';
    });
  })();
  const home = document.getElementById('page-home');
  const ledger = document.getElementById('page-ledger');
  const payables = document.getElementById('page-payables');
  const contacts = document.getElementById('page-contacts');
  const categories = document.getElementById('page-categories');
  const accounts = document.getElementById('page-accounts');
  const userAccounts = document.getElementById('page-user-accounts');
  const salesAccounts = document.getElementById('page-sales-accounts');
  const roleAccounts = document.getElementById('page-role-accounts');
  const partnerOrdersPage = document.getElementById('page-partner-orders');
  const systemPage = document.getElementById('page-system');
  const loginPage = document.getElementById('page-login');
  const empty = document.getElementById('page-empty');
  const authed = !!(getAuthUser() && (localStorage.getItem('authToken') || ''));
  if (!authed) { location.href = './login.html'; return; }
  if (systemPage) systemPage.style.display = 'none';
  function ensureView(module) {
    const u = getAuthUser(); const roleName = u?.role || '';
    const nameWithFallback = roleName || getUserRoleName(u?.name || '');
    if (nameWithFallback==='超级管理员' || module==='home') return true;
    const role = rolesData.find(r => r.name === nameWithFallback);
    const allow = !!(role && role.perms && role.perms[module] && role.perms[module].view);
    if (!allow) { location.hash = '#home'; return false; }
    return true;
  }
  if (hash === '#home') {
    ledger.style.display = 'none';
    payables.style.display = 'none';
    contacts.style.display = 'none';
    categories.style.display = 'none';
    accounts.style.display = 'none';
    userAccounts.style.display = 'none';
    salesAccounts.style.display = 'none';
    roleAccounts.style.display = 'none';
    if (partnerOrdersPage) partnerOrdersPage.style.display = 'none';
    loginPage.style.display = 'none';
    empty.style.display = 'none';
    if (home) {
      home.style.display = 'block';
      if (homePeriodSel) homePeriodSel.value = 'month';
      renderHomeChart('month');
      const gp = document.getElementById('global-pager'); if (gp) gp.style.display = 'none';
    }
  } else if (hash === '#ledger') {
    if (home) home.style.display = 'none';
    if (partnerOrdersPage) partnerOrdersPage.style.display = 'none';
    if (!ensureView('ledger')) return;
    ledger.style.display = 'block';
    payables.style.display = 'none';
    contacts.style.display = 'none';
    const gpEl = document.getElementById('global-pager'); if (gpEl) gpEl.style.display = 'none';
    categories.style.display = 'none';
    accounts.style.display = 'none';
    salesAccounts.style.display = 'none';
    userAccounts.style.display = 'none';
    roleAccounts.style.display = 'none';
    loginPage.style.display = 'none';
    empty.style.display = 'none';
    try {
      ledgerHdrType = 'all';
      ledgerHdrCat = '';
      ledgerHdrOwner = '';
      setLabel(document.getElementById('ld-type-label'), '类型', false);
      setLabel(document.getElementById('ld-cat-label'), '子类目', false);
      setLabel(document.getElementById('ld-owner-label'), '往来单位', false);
    } catch {}
    await loadLedgerFromServer();
    applyFilters();
  } else if (hash === '#payables') {
    if (home) home.style.display = 'none';
    if (partnerOrdersPage) partnerOrdersPage.style.display = 'none';
    if (!ensureView('payables')) return;
    ledger.style.display = 'none';
    payables.style.display = 'block';
    contacts.style.display = 'none';
    const gp = document.getElementById('global-pager'); if (gp) gp.style.display = 'flex';
    const uw = document.getElementById('undo-wrap'); if (uw) uw.style.display = 'none';
    categories.style.display = 'none';
    accounts.style.display = 'none';
    salesAccounts.style.display = 'none';
    userAccounts.style.display = 'none';
    roleAccounts.style.display = 'none';
    loginPage.style.display = 'none';
    empty.style.display = 'none';
    try {
      payFilterType = 'all';
      payFilterSalesName = '';
      payFilterStatus = 'all';
      payFilterOverdue = 'all';
      payPage = 1;
      const setDefault = () => {
        const reset = (el, text) => { if (el) { el.textContent = text + ' ▾'; el.style.color = ''; } };
        reset(document.getElementById('th-type-label'), '款项类型');
        reset(document.getElementById('th-sales-label'), '业务员');
        reset(document.getElementById('th-arrears-label'), '欠款');
        reset(document.getElementById('th-trust-label'), '信任天数');
      };
      setDefault();
    } catch {}
    await loadPayablesFromServer();
    renderPayables();
  } else if (hash === '#contacts') {
    if (home) home.style.display = 'none';
    if (partnerOrdersPage) partnerOrdersPage.style.display = 'none';
    if (!ensureView('contacts')) return;
    ledger.style.display = 'none';
    payables.style.display = 'none';
    contacts.style.display = 'block';
    const gp = document.getElementById('global-pager'); if (gp) gp.style.display = 'flex';
    const uw = document.getElementById('undo-wrap'); if (uw) uw.style.display = 'none';
    categories.style.display = 'none';
    accounts.style.display = 'none';
    userAccounts.style.display = 'none';
    roleAccounts.style.display = 'none';
    loginPage.style.display = 'none';
    empty.style.display = 'none';
    renderContacts();
  } else if (hash.startsWith('#partner-orders')) {
    const nameParam = decodeURIComponent((hash.split(':')[1] || '').trim());
    if (home) home.style.display = 'none';
    ledger.style.display = 'none';
    payables.style.display = 'none';
    contacts.style.display = 'none';
    categories.style.display = 'none';
    accounts.style.display = 'none';
    userAccounts.style.display = 'none';
    salesAccounts.style.display = 'none';
    roleAccounts.style.display = 'none';
    loginPage.style.display = 'none';
    empty.style.display = 'none';
    const gp = document.getElementById('global-pager'); if (gp) gp.style.display = 'none';
    if (partnerOrdersPage) {
      partnerOrdersPage.style.display = 'block';
      partnerOrdersHead.textContent = '往来单位：' + (nameParam || '');
      partnerOrdersRows.innerHTML = '';
      await loadPayablesFromServer();
      const list = payRecords.filter(r => (r.partner || '') === (nameParam || ''));
      list.forEach(r => {
        const tr = document.createElement('tr');
        const paid = r.paid || 0;
        const arrears = Math.max(0, (r.amount || 0) - paid);
        [r.type, r.partner || '', r.doc || '', (r.amount||0).toFixed(2), (r.invoiceNo||''), (Number(r.invoiceAmount||0).toFixed(2)), paid.toFixed(2), arrears.toFixed(2), r.date || ''].forEach((v,i) => {
          const td = document.createElement('td');
          td.textContent = String(v);
          if (i===7 && arrears>0) td.style.color = '#ef4444';
          tr.appendChild(td);
        });
        partnerOrdersRows.appendChild(tr);
      });
    }
  } else if (hash === '#categories') {
    if (home) home.style.display = 'none';
    if (partnerOrdersPage) partnerOrdersPage.style.display = 'none';
    if (!ensureView('categories')) return;
    ledger.style.display = 'none';
    payables.style.display = 'none';
    contacts.style.display = 'none';
    categories.style.display = 'block';
    const uw = document.getElementById('undo-wrap'); if (uw) uw.style.display = 'none';
    accounts.style.display = 'none';
    userAccounts.style.display = 'none';
    roleAccounts.style.display = 'none';
    loginPage.style.display = 'none';
    empty.style.display = 'none';
    await apiCategoriesList();
    renderCats();
  } else if (hash === '#accounts') {
    if (home) home.style.display = 'none';
    if (partnerOrdersPage) partnerOrdersPage.style.display = 'none';
    if (!ensureView('accounts')) return;
    ledger.style.display = 'none';
    payables.style.display = 'none';
    contacts.style.display = 'none';
    categories.style.display = 'none';
    accounts.style.display = 'block';
    const uw = document.getElementById('undo-wrap'); if (uw) uw.style.display = 'none';
    userAccounts.style.display = 'none';
    salesAccounts.style.display = 'none';
    const gp = document.getElementById('global-pager'); if (gp) gp.style.display = 'none';
    roleAccounts.style.display = 'none';
    loginPage.style.display = 'none';
    empty.style.display = 'none';
    await apiAccountsList();
    refreshAccountOptions();
    renderAccounts();
  } else if (hash === '#user-accounts') {
    if (home) home.style.display = 'none';
    if (partnerOrdersPage) partnerOrdersPage.style.display = 'none';
    if (!ensureView('user_accounts')) return;
    ledger.style.display = 'none';
    payables.style.display = 'none';
    contacts.style.display = 'none';
    categories.style.display = 'none';
    accounts.style.display = 'none';
    userAccounts.style.display = 'block';
    const uw = document.getElementById('undo-wrap'); if (uw) uw.style.display = 'none';
    salesAccounts.style.display = 'none';
    const gpEl = document.getElementById('global-pager'); if (gpEl) gpEl.style.display = 'none';
    roleAccounts.style.display = 'none';
    loginPage.style.display = 'none';
    empty.style.display = 'none';
    await apiUsersList();
    renderUserAccounts();
  } else if (hash === '#role-accounts') {
    if (home) home.style.display = 'none';
    if (partnerOrdersPage) partnerOrdersPage.style.display = 'none';
    if (!ensureView('role_accounts')) return;
    ledger.style.display = 'none';
    payables.style.display = 'none';
    contacts.style.display = 'none';
    categories.style.display = 'none';
    accounts.style.display = 'none';
    userAccounts.style.display = 'none';
    salesAccounts.style.display = 'none';
    roleAccounts.style.display = 'block';
    const permsPage = document.getElementById('page-role-perms'); if (permsPage) permsPage.style.display = 'none';
    const uw = document.getElementById('undo-wrap'); if (uw) uw.style.display = 'none';
    loginPage.style.display = 'none';
    empty.style.display = 'none';
    await apiRolesList();
    renderRoles();
  } else if (hash === '#role-perms') {
    if (home) home.style.display = 'none';
    if (partnerOrdersPage) partnerOrdersPage.style.display = 'none';
    ledger.style.display = 'none';
    payables.style.display = 'none';
    contacts.style.display = 'none';
    categories.style.display = 'none';
    accounts.style.display = 'none';
    userAccounts.style.display = 'none';
    salesAccounts.style.display = 'none';
    roleAccounts.style.display = 'none';
    const gp = document.getElementById('global-pager'); if (gp) gp.style.display = 'none';
    const permsPage = document.getElementById('page-role-perms'); if (permsPage) permsPage.style.display = 'block';
    loginPage.style.display = 'none';
    empty.style.display = 'none';
  } else if (hash === '#sales-accounts') {
    if (home) home.style.display = 'none';
    if (partnerOrdersPage) partnerOrdersPage.style.display = 'none';
    if (!ensureView('sales_accounts')) return;
    ledger.style.display = 'none';
    payables.style.display = 'none';
    contacts.style.display = 'none';
    categories.style.display = 'none';
    accounts.style.display = 'none';
    userAccounts.style.display = 'none';
    salesAccounts.style.display = 'block';
    roleAccounts.style.display = 'none';
    const uw = document.getElementById('undo-wrap'); if (uw) uw.style.display = 'none';
    loginPage.style.display = 'none';
    empty.style.display = 'none';
    await apiSalesList();
    renderSales();
  } else if (hash === '#system') {
    if (home) home.style.display = 'none';
    if (partnerOrdersPage) partnerOrdersPage.style.display = 'none';
    const u = getAuthUser(); const rn = (u?.role) || getUserRoleName(u?.name || '');
    if (rn !== '超级管理员') { location.hash = '#home'; return; }
    ledger.style.display = 'none';
    payables.style.display = 'none';
    contacts.style.display = 'none';
    categories.style.display = 'none';
    accounts.style.display = 'none';
    userAccounts.style.display = 'none';
    salesAccounts.style.display = 'none';
    roleAccounts.style.display = 'none';
    systemPage.style.display = 'block';
    loginPage.style.display = 'none';
    empty.style.display = 'none';
  } else if (hash === '#login') {
    if (home) home.style.display = 'none';
    if (partnerOrdersPage) partnerOrdersPage.style.display = 'none';
    ledger.style.display = 'none';
    payables.style.display = 'none';
    contacts.style.display = 'none';
    categories.style.display = 'none';
    accounts.style.display = 'none';
    userAccounts.style.display = 'none';
    roleAccounts.style.display = 'none';
    loginPage.style.display = 'block';
    empty.style.display = 'none';
  } else {
    if (home) home.style.display = 'none';
    if (partnerOrdersPage) partnerOrdersPage.style.display = 'none';
    ledger.style.display = 'none';
    payables.style.display = 'none';
    contacts.style.display = 'none';
    categories.style.display = 'none';
    accounts.style.display = 'none';
    userAccounts.style.display = 'none';
    roleAccounts.style.display = 'none';
    loginPage.style.display = 'none';
    empty.style.display = 'block';
  }
}
window.addEventListener('hashchange', route);
document.querySelectorAll('.nav a').forEach(a => {
  a.addEventListener('click', () => setTimeout(() => route(), 0));
});
initPersist();
setAuthUI();
loadLedgerFromServer();
loadPayablesFromServer();
applyFilters();
window.addEventListener('resize', updateLedgerHeaderCover);
document.getElementById('partner-orders-back')?.addEventListener('click', () => { location.hash = '#contacts'; });
renderContacts();
apiCategoriesList().then(() => renderCats());
apiAccountsList().then(() => { refreshAccountOptions(); renderAccounts(); });
apiSalesList().then(() => renderSales());
apiRolesList().then(() => { renderRoles(); route(); });
apiUsersList().then(() => renderUserAccounts());
refreshLedgerTypeOptions();
setCategories();
(function initPageByHash(){
  const h = location.hash || '#ledger';
  const isPayables = (h === '#payables');
  const gp = document.getElementById('global-pager');
  if (!isPayables && gp) gp.style.display = 'none';
  if (isPayables) renderPayables();
})();
accAdd?.addEventListener('click', () => {
  const nameEl = document.getElementById('acc-create-name');
  const descEl = document.getElementById('acc-create-desc');
  const modal = document.getElementById('acc-create-modal');
  if (nameEl) nameEl.value = '';
  if (descEl) descEl.value = '';
  if (modal) modal.style.display = 'flex';
});
function showAccCreate() {
  const nameEl = document.getElementById('acc-create-name');
  const descEl = document.getElementById('acc-create-desc');
  const modal = document.getElementById('acc-create-modal');
  if (nameEl) nameEl.value = '';
  if (descEl) descEl.value = '';
  if (modal) modal.style.display = 'flex';
}
document.addEventListener('click', e => {
  const btn = e.target.closest && e.target.closest('#acc-add');
  if (!btn) return;
  const nameEl = document.getElementById('acc-create-name');
  const descEl = document.getElementById('acc-create-desc');
  const modal = document.getElementById('acc-create-modal');
  if (nameEl) nameEl.value = '';
  if (descEl) descEl.value = '';
  if (modal) modal.style.display = 'flex';
  e.preventDefault();
});
