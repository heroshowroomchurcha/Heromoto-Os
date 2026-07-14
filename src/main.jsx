import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { supabase } from './lib/supabase';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import './styles.css';

const Icon = ({ name, size = 18 }) => {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    chart: <><path d="M4 19V5"/><path d="M4 19h17"/><path d="m7 15 3-4 3 2 5-7"/></>,
    bike: <><circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="m6 17 4-8h4l4 8M10 9 8 6h4l2 3"/></>,
    file: <><path d="M6 3h9l4 4v14H6z"/><path d="M15 3v5h5M9 13h6M9 17h6"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="4"/><path d="M17 11a4 4 0 0 0 0-8M21 21v-2a4 4 0 0 0-3-3.87"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    dots: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
    calendar: <><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    tag: <><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></>,
    card: <><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></>,
    key: <><path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/><path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/></>,
    box: <><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></>,
    calc: <><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/></>,
    x: <><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
};

const fallbackInventory = [];

const fallbackTestDriveInventory = [];

const fallbackSales = [];

const money = value => `₹ ${Number(value || 0).toLocaleString('en-IN')}`;
const dateLabel = value => new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
const greetingForHour = hour => hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : hour < 21 ? 'Good evening' : 'Good night';
const dashboardDateLabel = value => value.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase();



async function uploadCustomerDocument(file, customerId, kind, userId) {
  if (!file) return null;
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.-]+/g, '-');
  const path = `${userId}/${customerId}/${kind}-${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from('customer-documents').upload(path, file, { upsert: false, contentType: file.type || 'application/octet-stream' });
  if (error) throw error;
  return path;
}

async function uploadSaleDocument(file, saleId, kind, userId) {
  if (!file) return null;
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.-]+/g, '-');
  const path = `${userId}/sales/${saleId}/${kind}-${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from('customer-documents').upload(path, file, { upsert: false, contentType: file.type || 'application/octet-stream' });
  if (error) throw error;
  return path;
}

async function uploadVehicleImage(file, vehicleId) {
  if (!file) return null;
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.-]+/g, '-');
  const path = `${vehicleId}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from('vehicle-images').upload(path, file, { upsert: false, contentType: file.type || 'image/jpeg' });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from('vehicle-images').getPublicUrl(path);
  return publicUrl;
}

function AuthScreen() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setMessage('');
    const result = mode === 'signin' ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
    if (result.error) setMessage(result.error.message);
    else setMessage(mode === 'signin' ? 'Welcome back.' : 'Account created. Check your email if confirmation is enabled.');
    setBusy(false);
  }
  return <div className="auth-screen"><div className="auth-panel"><div className="auth-brand"><img src="/hero.png" alt="Hero MotoCorp" style={{height:'30px', width:'auto', objectFit:'contain'}}/><div><b>rideflow</b><small>SHOWROOM OS</small></div></div><p className="eyebrow">SECURE SHOWROOM LOGIN</p><h1>{mode === 'signin' ? 'Welcome back.' : 'Create staff access.'}</h1><p className="auth-copy">Sign in to manage sales, inventory and customer follow-ups.</p><form onSubmit={submit}>{mode === 'signup' && <label>Full name<input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Aamir Khan" required/></label>}<label>Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="staff@showroom.com" required/></label><label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 6 characters" minLength="6" required/></label><button className="primary-button auth-submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'signin' ? 'Sign in to RideFlow' : 'Create account'}</button></form>{message && <p className="auth-message">{message}</p>}<button className="auth-switch" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage(''); }}>{mode === 'signin' ? 'Need staff access? Create an account' : 'Already have an account? Sign in'}</button></div><div className="auth-side" style={{backgroundImage: 'url(/showroom-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center right'}}><div style={{position:'absolute',inset:0,background:'linear-gradient(135deg, rgba(15,15,15,0.82) 0%, rgba(25,25,25,0.55) 60%, rgba(10,10,10,0.7) 100%)'}} /><img src="/hero.png" alt="Hero" className="auth-side-mark" style={{position:'relative', zIndex:1, height:'36px', width:'auto', filter:'brightness(0) invert(1)'}}/><p style={{position:'relative', zIndex:1}}>One clean workspace for every ride sold, every RC updated, every customer remembered.</p><small style={{position:'relative', zIndex:1}}>Hero MotoCorp · Andheri</small></div></div>;
}

function App() {
  const [session, setSession] = useState(undefined);
  const [clock, setClock] = useState(() => new Date());
  const [profile, setProfile] = useState(null);
  const [active, setActive] = useState('Overview');
  const [query, setQuery] = useState('');
  const [inventory, setInventory] = useState(fallbackInventory);
  const [testDriveInventory, setTestDriveInventory] = useState(fallbackTestDriveInventory);
  const [sales, setSales] = useState(fallbackSales);
  const [rcRecords, setRcRecords] = useState([]);
  const [testDrives, setTestDrives] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [pendingDues, setPendingDues] = useState([]);
  const [showTestDriveModal, setShowTestDriveModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [invoiceSale, setInvoiceSale] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) {
        const { data: row } = await supabase.from('profiles').select('role, full_name').eq('id', data.session.user.id).maybeSingle();
        if (mounted) setProfile(row || { role: 'staff', full_name: data.session.user.email });
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        const { data: row } = await supabase.from('profiles').select('role, full_name').eq('id', nextSession.user.id).maybeSingle();
        setProfile(row || { role: 'staff', full_name: nextSession.user.email });
      } else setProfile(null);
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    const onSmsFailed = event => setToast(event.detail);
    window.addEventListener('rideflow:sms-failed', onSmsFailed);
    return () => window.removeEventListener('rideflow:sms-failed', onSmsFailed);
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;
    let mounted = true;
    async function load() {
      const [{ data: inv }, { data: tdInv }, { data: saleRows }, { data: rcRows }, { data: driveRows }, { data: customerRows }, { data: duesRows }] = await Promise.all([
        supabase.from('inventory').select('*').order('model'),
        supabase.from('test_drive_inventory').select('*').order('model'),
        supabase.from('sales').select('*').order('sale_date', { ascending: false }).limit(12),
        supabase.from('rc_records').select('*').order('created_at', { ascending: false }).limit(30),
        supabase.from('test_drives').select('*').order('scheduled_at', { ascending: true }).limit(30),
        supabase.from('customers').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('pending_dues').select('*').order('created_at', { ascending: false }).limit(50),
      ]);
      if (mounted) {
        if (inv) setInventory(inv);
        if (tdInv) setTestDriveInventory(tdInv);
        if (saleRows) setSales(saleRows);
        if (rcRows) setRcRecords(rcRows);
        if (driveRows) setTestDrives(driveRows);
        if (customerRows) setCustomers(customerRows);
        if (duesRows) setPendingDues(duesRows);
      }
    }
    load();
    return () => { mounted = false; };
  }, [session?.user?.id]);

  const filteredInventory = useMemo(() => inventory.filter(v => `${v.model} ${v.variant} ${v.color}`.toLowerCase().includes(query.toLowerCase())), [inventory, query]);
  const monthlySales = sales.reduce((sum, sale) => sum + Number(sale.sale_amount || 0), 0);
  const stockTotal = inventory.reduce((sum, v) => sum + Number(v.stock || 0), 0);
  const visibleCustomers = useMemo(() => {
    const map = new Map();
    customers.forEach(c => {
      const key = `${(c.name || '').toLowerCase().replace(/\s+/g, '')}-${(c.phone || '').replace(/\s+/g, '')}`;
      map.set(key, { ...c, last_vehicle: null, last_amount: null });
    });
    sales.forEach(sale => {
      const key = `${(sale.customer_name || '').toLowerCase().replace(/\s+/g, '')}-${(sale.customer_phone || '').replace(/\s+/g, '')}`;
      const existing = map.get(key);
      if (existing) {
        if (!existing.last_vehicle) {
          existing.last_vehicle = sale.vehicle_name;
          existing.last_amount = sale.sale_amount;
        }
      } else {
        map.set(key, {
          id: `sale-${sale.id}`,
          name: sale.customer_name,
          phone: sale.customer_phone,
          created_at: sale.sale_date,
          last_vehicle: sale.vehicle_name,
          last_amount: sale.sale_amount
        });
      }
    });
    return Array.from(map.values())
      .filter(c => c.last_vehicle)
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [customers, sales]);
  const visibleRcRecords = useMemo(() => rcRecords.length ? rcRecords : sales.filter(s => s.payment_status === 'Paid')
      .map(sale => ({ id: `pending-rc-${sale.id}`, sale_id: sale.id, customer_name: sale.customer_name, customer_phone: sale.customer_phone, vehicle_name: sale.vehicle_name, status: 'Pending', created_at: sale.sale_date })), [rcRecords, sales]);

  const filteredSales = useMemo(() => sales.filter(s => `${s.customer_name} ${s.vehicle_name} ${s.sale_type}`.toLowerCase().includes(query.toLowerCase())), [sales, query]);
  const filteredTestDrives = useMemo(() => testDrives.filter(d => `${d.customer_name} ${d.vehicle_name}`.toLowerCase().includes(query.toLowerCase())), [testDrives, query]);
  const filteredRcRecords = useMemo(() => visibleRcRecords.filter(r => `${r.customer_name} ${r.vehicle_name}`.toLowerCase().includes(query.toLowerCase())), [visibleRcRecords, query]);
  const filteredVisibleCustomers = useMemo(() => visibleCustomers.filter(c => `${c.name} ${c.phone} ${c.last_vehicle}`.toLowerCase().includes(query.toLowerCase())), [visibleCustomers, query]);
  const filteredPendingDues = useMemo(() => pendingDues.filter(d => `${d.customer_name} ${d.customer_phone}`.toLowerCase().includes(query.toLowerCase())), [pendingDues, query]);

  async function completeSale(form) {
    const vehicle = selectedVehicle;
    const discount = Math.min(Number(form.discount || 0), Number(vehicle.max_discount || 0));
    const exchangeValue = form.saleType === 'Exchange' ? Math.max(0, Number(form.exchangeValue || 0)) : 0;
    const exchangeDiscount = form.saleType === 'Exchange' ? Math.max(0, Number(form.exchangeDiscount || 0)) : 0;
    const saleAmount = Math.max(0, Number(vehicle.on_road_price || vehicle.ex_showroom_price) - discount - exchangeValue - exchangeDiscount);
    const kyc = { aadhaar_last4: String(form.aadhaar || '').replace(/\D/g, '').slice(-4), pan_masked: form.pan ? `${String(form.pan).slice(0, 2).toUpperCase()}****${String(form.pan).slice(-2).toUpperCase()}` : '' };
    const { data: customerRow } = await supabase.from('customers').insert({ name: form.customer, phone: form.phone, ...kyc }).select().single();
    let documentPaths = {};
    if (customerRow?.id && session?.user?.id) {
      try {
        const [aadhaar_document_path, pan_document_path] = await Promise.all([
          uploadCustomerDocument(form.aadhaarFile, customerRow.id, 'aadhaar', session.user.id),
          uploadCustomerDocument(form.panFile, customerRow.id, 'pan', session.user.id),
        ]);
        documentPaths = { aadhaar_document_path, pan_document_path };
        if (aadhaar_document_path || pan_document_path) await supabase.from('customers').update(documentPaths).eq('id', customerRow.id);
      } catch (documentError) {
        setToast(`Sale save ho rahi hai, lekin document upload fail hua: ${documentError.message}`);
      }
    }
    const sale = { customer_id: customerRow?.id || null, customer_name: form.customer, customer_phone: form.phone, vehicle_id: vehicle.id, vehicle_name: `${vehicle.model} ${vehicle.variant || ''}`.trim(), vehicle_color: form.vehicleColor || vehicle.color, original_price: vehicle.on_road_price || vehicle.ex_showroom_price, discount, sale_amount: saleAmount, payment_status: form.payment, signature_data: form.signature || null, sale_type: form.saleType || 'Sale', old_vehicle_name: form.oldVehicleName || '', old_vehicle_registration: form.oldVehicleRegistration || '', exchange_value: exchangeValue, exchange_discount: exchangeDiscount, emi_amount: form.emiAmount ? Number(form.emiAmount) : null, tenure_months: form.tenureMonths ? Number(form.tenureMonths) : null, amount_paid: form.amountPaid };
    const { data, error } = await supabase.from('sales').insert(sale).select().single();
    if (error) {
      setToast('Sale save nahi hui — pehle Supabase SQL tables/RLS check karo.');
      return;
    }
    const linkedSale = data || { ...sale, id: Date.now() };
    if (form.rcFile && session?.user?.id) {
      try {
        const rc_photo_path = await uploadSaleDocument(form.rcFile, linkedSale.id, 'rc-photo', session.user.id);
        await supabase.from('sales').update({ rc_photo_path }).eq('id', linkedSale.id);
        linkedSale.rc_photo_path = rc_photo_path;
      } catch (rcError) {
        setToast(`Sale save ho gayi, lekin RC photo upload fail hua: ${rcError.message}`);
      }
    }
    const { data: rcRow } = await supabase.from('rc_records').insert({ sale_id: linkedSale.id, customer_name: form.customer, customer_phone: form.phone, vehicle_name: sale.vehicle_name, status: 'Pending' }).select().single();
    let newStock = Math.max(0, vehicle.stock - 1);
    let newStockByColor = vehicle.stock_by_color || [];
    if (newStockByColor.length > 0 && form.vehicleColor) {
      newStockByColor = newStockByColor.map(item => item.color === form.vehicleColor ? { ...item, qty: Math.max(0, Number(item.qty) - 1) } : item);
      newStock = newStockByColor.reduce((sum, item) => sum + Number(item.qty || 0), 0);
    }
    
    await supabase.from('inventory').update({ stock: newStock, stock_by_color: newStockByColor, status: newStock <= 0 ? 'Sold out' : 'Available' }).eq('id', vehicle.id);
    setSales(current => [linkedSale, ...current]);
    setCustomers(current => [customerRow || { id: `local-${Date.now()}`, name: form.customer, phone: form.phone, ...kyc, created_at: new Date().toISOString(), last_vehicle: sale.vehicle_name, last_amount: saleAmount }, ...current]);
    setRcRecords(current => [rcRow || { id: Date.now(), sale_id: linkedSale.id, customer_name: form.customer, vehicle_name: sale.vehicle_name, status: 'Pending', created_at: new Date().toISOString() }, ...current]);
    setInventory(current => current.map(item => item.id === vehicle.id ? { ...item, stock: newStock, stock_by_color: newStockByColor } : item));
    setSelectedVehicle(null);
    setActive('Overview');
    setInvoiceSale({ sale: { ...linkedSale, sale_date: linkedSale.sale_date || new Date().toISOString() }, vehicle, customer: { name: form.customer, phone: form.phone, ...kyc, ...documentPaths }, saleAmount, discount, signature: form.signature });
    setToast(`${vehicle.model} sale saved — ${money(saleAmount)} dashboard mein sync ho gaya.`);
    setTimeout(() => setToast(''), 5000);
  }

  async function saveTestDrive(form) {
    const vehicle = testDriveInventory.find(item => String(item.id) === String(form.vehicleId));
    const record = { customer_name: form.customer, phone: form.phone, vehicle_id: vehicle?.id || null, vehicle_name: vehicle ? `${vehicle.model} ${vehicle.variant || ''}`.trim() : form.vehicleName, scheduled_at: `${form.date}T${form.time}:00`, status: 'Upcoming', notes: form.notes };
    const { data, error } = await supabase.from('test_drives').insert(record).select().single();
    if (error) { setToast('Test drive save nahi hui — Supabase test_drives policy check karo.'); return; }
    setTestDrives(current => [...current, data || { ...record, id: Date.now() }].sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at)));
    setShowTestDriveModal(false);
    setToast(`Test drive booked for ${form.customer}.`);
    setTimeout(() => setToast(''), 4000);
  }

  async function downloadBackup() {
    let csv = 'Data Type,Date,Customer Name,Phone,Details,Amount\n';
    sales.forEach(s => {
      csv += `Sale,${new Date(s.sale_date).toLocaleDateString()},"${s.customer_name || ''}","","${s.vehicle_name || ''}",${s.sale_amount}\n`;
    });
    customers.forEach(c => {
      csv += `Customer,${new Date(c.created_at).toLocaleDateString()},"${c.name || ''}","${c.phone || ''}","Kyc added",\n`;
    });
    pendingDues.forEach(d => {
      csv += `Pending Due,${new Date(d.created_at).toLocaleDateString()},"${d.customer_name || ''}","${d.customer_phone || ''}","Status: ${d.status}",${d.amount}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `RideFlow_Backup_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setToast('Backup downloaded successfully.');
  }

  if (session === undefined) return <div className="auth-loading"/>;
  if (!session) return <AuthScreen />;
  const isOwner = profile?.role === 'owner';
  const nav = [{ label: 'Overview', icon: 'grid' }, { label: 'Inventory', icon: 'bike' }, { label: 'Sales', icon: 'tag', count: sales.length || undefined }, { label: 'Test drives', icon: 'key', count: testDrives.filter(t => t.status !== 'Completed').length || undefined }, { label: 'Number plate', icon: 'file', count: rcRecords.filter(r => r.status !== 'Completed').length || undefined }, { label: 'Customers', icon: 'users', count: visibleCustomers?.length || undefined }, { label: 'Pending dues', icon: 'file', count: pendingDues.filter(d => d.status === 'Pending').length || undefined }, { label: 'EMI calculator', icon: 'calc' }];
  const visibleNav = nav;
  return <div className="app-shell"><aside className="sidebar"><div className="brand"><div className="brand-mark">R</div><div><strong>rideflow</strong><span>SHOWROOM OS</span></div></div><div className="branch-select"><span className="online-dot"/> Hero MotoCorp <b>·</b> Andheri <Icon name="arrow" size={13}/></div><nav>{visibleNav.map(item => <button key={item.label} className={active === item.label ? 'nav-item active' : 'nav-item'} onClick={() => setActive(item.label)}><Icon name={item.icon}/><span>{item.label}</span>{item.count && <em>{item.count}</em>}</button>)}</nav><div className="sidebar-bottom"><div className="sync"><span className="pulse"/><div><b>Supabase synced</b><small>{isOwner ? 'Owner access · Secure' : 'Staff access · Limited'}</small></div></div><button className="user-row" onClick={() => supabase.auth.signOut()}><div className="avatar me">{(profile?.full_name || session.user.email || 'NK').slice(0,2).toUpperCase()}</div><div><b>{profile?.full_name || session.user.email}</b><small>{isOwner ? 'Showroom owner' : 'Showroom staff'} · Sign out</small></div><Icon name="dots" size={16}/></button></div></aside>
    <main className="main-content"><header className="topbar"><div className="breadcrumb"><div className="topbar-brand"><img src="/hero.png" alt="Hero MotoCorp" style={{height:'28px', width:'auto', objectFit:'contain'}}/></div></div><div className="top-actions"><label className="search"><Icon name="search" size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search vehicles, customers..."/></label><button className="icon-button" onClick={() => { setToast('No new notifications'); setTimeout(() => setToast(''), 3000); }}><Icon name="bell"/></button><button className="primary-button" onClick={() => setActive('Inventory')}><Icon name="plus" size={17}/> New sale</button></div></header><div className="content-wrap"><section className="page-heading"><div><p className="eyebrow">{dashboardDateLabel(clock)} <span className="live"><i/> LIVE</span></p><h1>{active === 'Overview' ? `${greetingForHour(clock.getHours())}, Nihal.` : active}</h1><p className="subcopy">{active === 'Overview' ? 'Your showroom numbers, inventory and follow-ups in one view.' : active === 'Inventory' ? 'Show customers every available bike, price and offer limit.' : `Manage your ${active.toLowerCase()} records from one place.`}</p></div><button className="date-button"><Icon name="calendar" size={16}/> Supabase live <span className="live-dot"/></button></section>
      {active === 'Overview' ? <Overview sales={filteredSales} inventory={inventory} monthlySales={monthlySales} stockTotal={stockTotal} rcRecords={filteredRcRecords} setActive={setActive} onDownloadBackup={downloadBackup} />
      : active === 'Inventory' ? selectedModel ? <VehicleDetail vehicle={selectedModel} onBack={() => setSelectedModel(null)} onSell={() => setSelectedVehicle(selectedModel)} /> : <Inventory vehicles={filteredInventory} onSell={setSelectedVehicle} onDetails={setSelectedModel} onManage={() => setActive('Inventory management')} />
      : active === 'Test drives' ? <TestDrivesWorkspace drives={filteredTestDrives} vehicles={testDriveInventory} onAdd={() => setShowTestDriveModal(true)} onStatusChange={async (drive, status) => {
          const { error } = await supabase.from('test_drives').update({ status }).eq('id', drive.id);
          if (!error) {
            setTestDrives(current => current.map(item => item.id === drive.id ? { ...item, status } : item));
            setToast(`Test drive status updated: ${status}`);
            setTimeout(() => setToast(''), 4000);
          }
        }} onInventoryChange={setTestDriveInventory} onToast={setToast} />
      : active === 'Number plate' ? <RCTracker records={filteredRcRecords} onStatusChange={async (record, status) => {
          if (String(record.id).startsWith('sale-rc-')) {
            setToast('Is sale ka RC Supabase mein create karne ke liye setup.sql policies run karo.');
            setTimeout(() => setToast(''), 4000);
            return;
          }
          const { error } = await supabase.from('rc_records').update({ status, ...(status === 'Completed' ? { completed_at: new Date().toISOString() } : {}) }).eq('id', record.id);
          if (!error) {
            setRcRecords(current => current.map(item => item.id === record.id ? { ...item, status } : item));
            setToast(`RC status updated: ${status}`);
            setTimeout(() => setToast(''), 5000);
          }
        }} />
      : active === 'Customers' ? <Customers records={filteredVisibleCustomers} drives={filteredTestDrives} />
      : active === 'Sales' ? <SalesWorkspace sales={filteredSales} userId={session.user.id} onChange={setSales} onToast={setToast} />
      : active === 'Test ride inventory' ? <TestRideInventoryWorkspace vehicles={testDriveInventory} onChange={setTestDriveInventory} onToast={setToast} />
      : active === 'EMI calculator' ? <EMIWorkspace defaultAmount={inventory[0]?.on_road_price || 100000} />
      : active === 'Pending dues' ? <PendingDuesWorkspace dues={filteredPendingDues} onChange={setPendingDues} onToast={setToast} />
      : active === 'Inventory management' ? <InventoryManagementWorkspace inventory={filteredInventory} onChange={setInventory} onToast={setToast} /> : <section className="placeholder-panel panel"><div className="empty-icon"><Icon name="chart" size={27}/></div><h2>{active} workspace ready</h2><p>Database connected. Is module ka next workflow yahan manage hoga.</p><button className="primary-button" onClick={() => setActive('Inventory')}><Icon name="bike" size={17}/> Open inventory</button></section>}
    </div></main>
    {selectedVehicle && <SaleModal vehicle={selectedVehicle} onClose={() => setSelectedVehicle(null)} onSave={completeSale} />}
    {invoiceSale && <InvoiceModal record={invoiceSale} onClose={() => setInvoiceSale(null)} />}
    {showTestDriveModal && <TestDriveModal vehicles={testDriveInventory} onClose={() => setShowTestDriveModal(false)} onSave={saveTestDrive} />}
    {toast && <div className="toast"><Icon name="check" size={16}/>{toast}</div>}
  </div>;
}

function Overview({ sales, inventory, monthlySales, stockTotal, rcRecords, setActive, onDownloadBackup }) {
  const pendingRcCount = rcRecords?.filter(r => r.status !== 'Completed').length || 0;
  return <><section className="metrics"><Metric label="MONTHLY SALES" value={money(monthlySales)} delta="LIVE" foot="this month" accent="red"/><Metric label="UNITS SOLD" value={sales.length} delta="SYNCED" foot="sales records"/><Metric label="AVAILABLE STOCK" value={stockTotal} delta="LIVE" foot="bikes in inventory"/><Metric label="NUMBER PLATE PENDING" value={pendingRcCount.toString().padStart(2, '0')} delta={`${pendingRcCount} pending`} foot="needs attention" accent="amber"/></section><section className="workspace-grid"><div className="panel sales-panel"><div className="panel-head"><div><p className="eyebrow">CONNECTED DATA</p><h2>Latest sales</h2></div><button className="text-button" onClick={() => setActive('Sales')}>View all <Icon name="arrow" size={15}/></button></div><div className="table-head"><span>Customer</span><span>Vehicle</span><span>Sale value</span><span>Updated</span><span>Status</span><span></span></div>{sales.slice(0, 5).map((s, i) => <div className="sale-row" key={s.id || i}><div className="customer"><div className="avatar" style={{background:['#e8d4ce','#dce3d3','#d9dcea','#e8e0cc'][i % 4]}}>{String(s.customer_name || 'NK').split(' ').map(x => x[0]).join('').slice(0,2)}</div><b>{s.customer_name}</b></div><span className="vehicle-highlight"><b>{s.vehicle_name || 'Vehicle not added'}</b></span><b>{money(s.sale_amount)}</b><span className="muted">{dateLabel(s.sale_date)}</span><span className={s.sale_type === 'Return' ? 'status danger' : s.sale_type === 'Exchange' ? 'status info' : s.payment_status === 'Paid' ? 'status success' : 'status warning'}><i/>{s.sale_type || (s.payment_status === 'Paid' ? 'Paid' : 'Number plate pending')}</span><button className="row-dots" title="Open sales actions" aria-label={`Open actions for ${s.vehicle_name || 'sale'}`} onClick={() => setActive('Sales')}><Icon name="dots" size={16}/></button></div>)}</div><div className="side-stack"><div className="panel follow-panel"><div className="panel-head"><div><p className="eyebrow">INVENTORY SIGNAL</p><h2>Stock watch</h2></div><span className="count-badge">{inventory.filter(v => v.stock <= 2).length}</span></div><div className="follow-list">{inventory.filter(v => v.stock <= 2).map(v => <div className="follow-item" key={v.id}><div className="avatar small">{v.model.slice(0,2).toUpperCase()}</div><div className="follow-copy"><b>{v.model}</b><span>{v.variant} · {v.stock} left</span></div><div className="follow-tag today">Low stock</div></div>)}</div><button className="outline-button" onClick={() => setActive('Inventory')}>Open inventory <Icon name="arrow" size={15}/></button></div><div className="panel quick-panel"><div className="quick-glyph"><Icon name="bike" size={20}/></div><div><p className="eyebrow">INVENTORY VALUE</p><h2>{money(inventory.reduce((sum, v) => sum + (v.on_road_price || 0) * (v.stock || 0), 0))}</h2><span>{stockTotal} units currently available</span></div></div><div className="panel quick-panel" style={{cursor: 'pointer'}} onClick={onDownloadBackup}><div className="quick-glyph" style={{background: '#e2efe1', color: '#528d5f'}}><Icon name="file" size={20}/></div><div><p className="eyebrow">DATA EXPORT</p><h2 style={{fontSize: '18px', fontWeight: '600', letterSpacing: '-0.02em', margin: '4px 0 2px'}}>Download Backup</h2><span style={{fontSize: '13px', color: '#657487'}}>Export sales, customers & dues as CSV</span></div></div></div></section></>;
}

function EMICalculator({ defaultAmount }) {
  const [price, setPrice] = useState(defaultAmount); const [downPayment, setDownPayment] = useState(Math.round(defaultAmount * 0.2)); const [rate, setRate] = useState(11.5); const [months, setMonths] = useState(36);
  const principal = Math.max(0, Number(price) - Number(downPayment)); const monthlyRate = Number(rate) / 1200; const emi = monthlyRate ? principal * monthlyRate * (1 + monthlyRate) ** months / ((1 + monthlyRate) ** months - 1) : principal / months; const totalPayable = emi * months; const interest = Math.max(0, totalPayable - principal);
  return <section className="emi-panel panel"><div className="emi-copy"><p className="eyebrow">CUSTOMER TOOL</p><h2>Monthly EMI estimate</h2><p>Customer ko on-road price aur finance plan instantly samjhao.</p><div className="emi-result"><small>ESTIMATED MONTHLY EMI</small><strong>{money(Math.round(emi))}</strong><span>{months} months · {rate}% annual interest</span></div></div><div className="emi-form"><label>On-road price<input type="number" value={price} onChange={e => setPrice(e.target.value)}/></label><label>Down payment<input type="number" value={downPayment} onChange={e => setDownPayment(e.target.value)}/></label><label>Interest rate <span>{rate}%</span><input type="range" min="7" max="20" step="0.5" value={rate} onChange={e => setRate(e.target.value)}/></label><label>Tenure <span>{months} months</span><input type="range" min="12" max="84" step="12" value={months} onChange={e => setMonths(e.target.value)}/></label><div className="emi-breakdown"><span>Loan amount <b>{money(principal)}</b></span><span>Total interest <b>{money(Math.round(interest))}</b></span></div></div></section>;
}

function EMIWorkspace({ defaultAmount }) {
  return <section className="emi-workspace"><div className="emi-workspace-heading"><div><p className="eyebrow">CUSTOMER TOOL</p><h2>Finance desk</h2><p>Customer ke saamne bike ka monthly plan instantly calculate karo.</p></div><div className="emi-use-note"><span>LIVE CALCULATION</span><b>Adjust inputs → share estimate</b></div></div><EMICalculator defaultAmount={defaultAmount} /></section>;
}

function Inventory({ vehicles, onSell, onDetails, onManage }) {
  const [category, setCategory] = useState('all');
  const getCc = vehicle => Number(vehicle.cc || ({ 'Splendor+': 100, 'Pleasure+': 110, 'Xtreme 125R': 125, 'Glamour': 125, 'Xtreme 160R': 160, 'Maverick 440': 440 }[vehicle.model] || 0));
  const categories = [{ id: 'all', label: 'All bikes', detail: 'Every model' }, { id: 'commuter', label: '100–125 cc', detail: 'City & daily use' }, { id: 'premium', label: '150–200 cc', detail: 'Performance bikes' }, { id: 'big', label: '400 cc+', detail: 'Premium touring' }];
  const visible = vehicles.filter(vehicle => category === 'all' || category === 'commuter' && getCc(vehicle) >= 100 && getCc(vehicle) <= 125 || category === 'premium' && getCc(vehicle) >= 150 && getCc(vehicle) <= 200 || category === 'big' && getCc(vehicle) >= 400);
  return <section className="inventory-layout"><div className="inventory-toolbar"><div><p className="eyebrow">CUSTOMER VIEW · FILTER BY ENGINE</p><h2>{categories.find(item => item.id === category)?.label}</h2></div><div className="inventory-actions-wrap" style={{display: 'flex', alignItems: 'center', gap: '16px'}}><div className="inventory-count">{visible.length} models · {visible.reduce((sum, v) => sum + Number(v.stock || 0), 0)} units</div><button className="outline-button" style={{margin: 0}} onClick={onManage}><Icon name="grid" size={14}/> Manage stock</button></div></div><div className="cc-tabs">{categories.map((item, index) => <button key={item.id} className={`cc-tab cc-tab-${item.id} ${category === item.id ? 'active' : ''}`} onClick={() => setCategory(item.id)}><span className="cc-tab-index">0{index + 1}</span><b>{item.label}</b><span>{item.detail}</span></button>)}</div><div className="inventory-grid">{visible.map(vehicle => <article className="inventory-card" key={vehicle.id} onClick={() => onDetails(vehicle)}><div className="bike-visual"><div className="bike-badge">{getCc(vehicle)} CC</div>{vehicle.image_url ? <img src={vehicle.image_url} style={{width:'100%', height:'100%', maxHeight:'120px', objectFit:'contain', marginTop:'auto'}} alt=""/> : <Icon name="bike" size={56}/>}<span>{vehicle.color}</span><em className="view-detail-hint">View details <Icon name="arrow" size={12}/></em></div><div className="inventory-card-body"><div className="inventory-card-top"><div><h3>{vehicle.model}</h3><p>{vehicle.variant} · {getCc(vehicle)} cc</p></div><span className={vehicle.stock <= 2 ? 'stock-chip low' : 'stock-chip'}><i/>{vehicle.stock} in stock</span></div><div className="price-line"><div><small>ON-ROAD PRICE</small><strong>{money(vehicle.on_road_price || vehicle.ex_showroom_price)}</strong></div></div><div className="inventory-footer"><span>Ex-showroom {money(vehicle.ex_showroom_price)}</span><button className="sell-button" disabled={!vehicle.stock} onClick={e => { e.stopPropagation(); onSell(vehicle); }}>{vehicle.stock ? 'Sell this bike' : 'Sold out'} <Icon name="arrow" size={15}/></button></div></div></article>)}</div></section>;
}

function VehicleDetail({ vehicle, onBack, onSell }) {
  const cc = Number(vehicle.cc || ({ 'Splendor+': 100, 'Pleasure+': 110, 'Xtreme 125R': 125, 'Glamour': 125, 'Xtreme 160R': 160, 'Maverick 440': 440 }[vehicle.model] || 0));
  const colors = vehicle.available_colors || ({ 'Splendor+': ['Black', 'Silver', 'Blue'], 'Pleasure+': ['Pearl White', 'Matte Grey', 'Red'], 'Xtreme 125R': ['Matte Red', 'Black', 'Blue'], 'Glamour': ['Candy Red', 'Black', 'Grey'], 'Xtreme 160R': ['Sports Red', 'Stealth Black', 'Grey'], 'Maverick 440': ['Phantom Black', 'Stone Grey', 'Red'] }[vehicle.model] || [vehicle.color]);
  return <section className="vehicle-detail"><button className="back-link" onClick={onBack}>← Back to inventory</button><div className="vehicle-detail-grid"><div className="vehicle-hero"><span className="bike-badge">{cc} CC · HERO</span>{vehicle.image_url ? <img src={vehicle.image_url} style={{width:'100%', maxHeight:'200px', objectFit:'contain'}} alt=""/> : <Icon name="bike" size={130}/>}<small>{vehicle.color}</small></div><div className="vehicle-info"><p className="eyebrow">MODEL DETAILS</p><h2>{vehicle.model}</h2><p className="vehicle-variant">{vehicle.variant} · {cc} cc</p><div className="vehicle-price"><small>ON-ROAD PRICE</small><strong>{money(vehicle.on_road_price || vehicle.ex_showroom_price)}</strong><span>Ex-showroom {money(vehicle.ex_showroom_price)}</span></div><div className="vehicle-actions"><button className="primary-button" disabled={!vehicle.stock} onClick={onSell}>{vehicle.stock ? 'Start sale' : 'Sold out'} <Icon name="arrow" size={15}/></button><span className={vehicle.stock <= 2 ? 'stock-chip low' : 'stock-chip'}><i/>{vehicle.stock} units available</span></div></div></div><div className="vehicle-detail-lower"><div className="detail-section"><p className="eyebrow">AVAILABLE COLOURS</p><h3>Choose a finish for the customer</h3><div className="color-list">{colors.map((color, index) => <span key={color}><i style={{background:['#212121','#bfc1c4','#b44538','#657487','#8f8f87'][index % 5]}}/>{color}</span>)}</div></div><div className="detail-section"><p className="eyebrow">FINANCE SNAPSHOT</p><h3>Starting EMI</h3><div className="detail-number">{money(Math.round(((Number(vehicle.on_road_price || vehicle.ex_showroom_price) * .8) * .115 / 12 * (1 + .115 / 12) ** 36) / ((1 + .115 / 12) ** 36 - 1)))}</div><span className="detail-note">20% down · 11.5% · 36 months</span></div></div></section>;
}

function TestDrivesWorkspace({ drives, vehicles, onAdd, onStatusChange, onInventoryChange, onToast }) {
  const [tab, setTab] = useState('Bookings');
  if (tab === 'Demo fleet') {
    return <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
      <div className="workspace-tabs-group" style={{padding: '24px 32px 0'}}>
        <div className="workspace-tabs">
          <button className={tab === 'Bookings' ? 'active' : ''} onClick={() => setTab('Bookings')}>Bookings</button>
          <button className={tab === 'Demo fleet' ? 'active' : ''} onClick={() => setTab('Demo fleet')}>Demo fleet</button>
        </div>
      </div>
      <TestRideInventoryWorkspace vehicles={vehicles} onChange={onInventoryChange} onToast={onToast} />
    </div>;
  }
  return <section className="test-drive-layout"><div className="workspace-tabs-group" style={{marginBottom: '24px'}}><div className="workspace-tabs"><button className={tab === 'Bookings' ? 'active' : ''} onClick={() => setTab('Bookings')}>Bookings</button><button className={tab === 'Demo fleet' ? 'active' : ''} onClick={() => setTab('Demo fleet')}>Demo fleet</button></div></div><div className="test-drive-header"><div><p className="eyebrow">CUSTOMER FOLLOW-UP</p><h2>Test drive bookings</h2><p>Every enquiry ko appointment aur follow-up status ke saath track karo.</p></div><button className="primary-button" onClick={onAdd}><Icon name="plus" size={16}/> Book test drive</button></div><div className="drive-stats"><div><b>{drives.filter(d => d.status === 'Upcoming').length}</b><span>upcoming</span></div><div><b>{drives.filter(d => d.status === 'Confirmed').length}</b><span>confirmed</span></div><div><b>{drives.filter(d => d.status === 'Completed').length}</b><span>completed</span></div><div><b>{vehicles.length}</b><span>bikes available</span></div></div>{drives.length ? <div className="panel drive-table"><div className="table-head drive-table-head"><span>Customer</span><span>Vehicle</span><span>Appointment</span><span>Status</span><span>Update</span></div>{drives.map((drive, index) => <div className="drive-row" key={drive.id || index}><div className="customer"><div className="avatar" style={{background:['#e8d4ce','#dce3d3','#d9dcea','#e8e0cc'][index % 4]}}>{String(drive.customer_name || 'NK').split(' ').map(x => x[0]).join('').slice(0,2)}</div><div><b>{drive.customer_name}</b><small>{drive.phone || 'No phone added'}</small></div></div><span className="muted">{drive.vehicle_name || 'Vehicle not selected'}</span><span className="appointment"><b>{dateLabel(drive.scheduled_at)}</b><small>{new Date(drive.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</small></span><span className={`status ${drive.status === 'Completed' ? 'success' : drive.status === 'Confirmed' ? 'info' : drive.status === 'No-show' ? 'warning' : ''}`}><i/>{drive.status}</span><select value={drive.status} onChange={e => onStatusChange(drive, e.target.value)}><option>Upcoming</option><option>Confirmed</option><option>Completed</option><option>No-show</option></select></div>)}</div> : <div className="panel placeholder-panel"><div className="empty-icon"><Icon name="bike" size={27}/></div><h2>No test drives booked</h2><p>Customer ka naam, bike aur appointment time add karke first booking create karo.</p><button className="primary-button" onClick={onAdd}><Icon name="plus" size={16}/> Book first test drive</button></div>}</section>;
}

function Customers({ records, drives }) {
  const [tab, setTab] = useState('Sales');
  
  // Deduplicate test drive customers by phone/name to only show unique customers
  const uniqueDrivesMap = new Map();
  if (drives) {
    [...drives].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).forEach(d => {
      const key = (d.phone || '') + (d.customer_name || '').toLowerCase();
      if (!uniqueDrivesMap.has(key)) uniqueDrivesMap.set(key, d);
    });
  }
  const uniqueDrives = Array.from(uniqueDrivesMap.values());

  return <section className="customers-layout">
    <div className="workspace-tabs-group" style={{marginBottom: '24px'}}>
      <div className="workspace-tabs">
        <button className={tab === 'Sales' ? 'active' : ''} onClick={() => setTab('Sales')}>Sales customers</button>
        <button className={tab === 'Test drives' ? 'active' : ''} onClick={() => setTab('Test drives')}>Test drive customers</button>
      </div>
    </div>
    <div className="customers-header">
      <div>
        <p className="eyebrow">RELATIONSHIP LOG</p>
        <h2>Customer directory</h2>
        <p>Sales, test drives aur RC follow-up ka single customer view.</p>
      </div>
      <span className="inventory-count">{tab === 'Sales' ? records.length : uniqueDrives.length} customers</span>
    </div>
    
    {tab === 'Sales' ? (
      records.length ? <div className="panel customer-table"><div className="table-head customer-table-head"><span>Customer</span><span>Phone</span><span>KYC</span><span>Last vehicle</span><span>Last amount</span><span>Added</span></div>{records.map((record, index) => <div className="customer-row" key={record.id || index}><div className="customer"><div className="avatar" style={{background:['#e8d4ce','#dce3d3','#d9dcea','#e8e0cc'][index % 4]}}>{String(record.name || 'NK').split(' ').map(x => x[0]).join('').slice(0,2)}</div><b>{record.name}</b></div><span className="muted">{record.phone || 'No phone added'}</span><span className="kyc-cell">A •••• {record.aadhaar_last4 || '—'}<br/>P {record.pan_masked || '—'}</span><span className="muted">{record.last_vehicle || 'Sale record linked'}</span><b>{record.last_amount ? money(record.last_amount) : '—'}</b><span className="muted">{dateLabel(record.created_at)}</span></div>)}</div> : <div className="panel placeholder-panel"><div className="empty-icon"><Icon name="users" size={27}/></div><h2>No customers yet</h2><p>Inventory se sale karte hi customer yahan automatically sync hoga.</p></div>
    ) : (
      uniqueDrives.length ? <div className="panel customer-table"><div className="table-head customer-table-head"><span>Customer</span><span>Phone</span><span>Interested in</span><span>Appointment</span><span>Status</span><span></span></div>{uniqueDrives.map((record, index) => <div className="customer-row" key={record.id || index}><div className="customer"><div className="avatar" style={{background:['#e8d4ce','#dce3d3','#d9dcea','#e8e0cc'][index % 4]}}>{String(record.customer_name || 'NK').split(' ').map(x => x[0]).join('').slice(0,2)}</div><b>{record.customer_name}</b></div><span className="muted">{record.phone || 'No phone added'}</span><span className="muted">{record.vehicle_name || 'Vehicle not selected'}</span><b>{dateLabel(record.scheduled_at)}</b><span className={`status ${record.status === 'Completed' ? 'success' : record.status === 'Confirmed' ? 'info' : record.status === 'No-show' ? 'warning' : ''}`}><i/>{record.status}</span><span /></div>)}</div> : <div className="panel placeholder-panel"><div className="empty-icon"><Icon name="users" size={27}/></div><h2>No test drive customers yet</h2><p>Test drives book karte hi customer yahan automatically sync hoga.</p></div>
    )}
  </section>;
}

function TestDriveModal({ vehicles, onClose, onSave }) {
  const today = new Date().toISOString().slice(0, 10);
  const availableVehicles = vehicles.filter(vehicle => Number(vehicle.stock || 0) > 0);
  const [customer, setCustomer] = useState(''); const [phone, setPhone] = useState(''); const [vehicleId, setVehicleId] = useState(availableVehicles[0]?.id || ''); const [date, setDate] = useState(today); const [time, setTime] = useState('11:00'); const [notes, setNotes] = useState('');
  useEffect(() => { if (!availableVehicles.some(vehicle => String(vehicle.id) === String(vehicleId))) setVehicleId(availableVehicles[0]?.id || ''); }, [vehicles]);
  return <div className="modal-backdrop" onClick={onClose}><div className="modal test-drive-modal" onClick={e => e.stopPropagation()}><div className="modal-head"><div><p className="eyebrow">QUICK BOOKING</p><h2>Book test drive</h2></div><button className="close" onClick={onClose}>×</button></div><div className="form-grid"><label>Customer name<input value={customer} onChange={e => setCustomer(e.target.value)} placeholder="e.g. Vikram Singh" required/></label><label>Phone number<input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98XXX XXXXX"/></label><label>Vehicle<select required value={vehicleId} onChange={e => setVehicleId(e.target.value)}><option value="">Select a bike</option>{availableVehicles.map(v => <option key={v.id} value={v.id}>{v.model} · {v.variant} · {v.cc || '—'} cc · {v.stock} in stock</option>)}</select></label><label>Appointment date<input type="date" min={today} value={date} onChange={e => setDate(e.target.value)}/></label><label>Time<input type="time" value={time} onChange={e => setTime(e.target.value)}/></label><label>Notes<input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Interested in finance..."/></label></div><div className="modal-foot"><button className="ghost-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={!customer || !vehicleId || !availableVehicles.length} onClick={() => onSave({ customer, phone, vehicleId, date, time, notes })}><Icon name="calendar" size={16}/> Save booking</button></div></div></div>;
}



function SalesWorkspace({ sales, userId, onChange, onToast }) {
  const [tab, setTab] = useState('Cash');
  const [selectedSale, setSelectedSale] = useState(null);
  const [editingSale, setEditingSale] = useState(null);
  const [confirmClear, setConfirmClear] = useState(null);
  async function saveSaleUpdate(values) {
    const patch = { customer_name: values.customerName.trim(), customer_phone: values.phone.trim(), vehicle_name: values.vehicleName.trim(), sale_amount: Number(values.saleAmount || 0), discount: Number(values.discount || 0), payment_status: values.paymentStatus, sale_type: values.saleType, old_vehicle_name: values.oldVehicleName.trim(), old_vehicle_registration: values.oldVehicleRegistration.trim(), exchange_discount: Number(values.exchangeDiscount || 0), updated_at: new Date().toISOString(), emi_amount: values.emiAmount ? Number(values.emiAmount) : null, tenure_months: values.tenureMonths ? Number(values.tenureMonths) : null, amount_paid: Number(values.amountPaid || 0) };
    if (values.rcPhoto && userId) {
      try { patch.rc_photo_path = await uploadSaleDocument(values.rcPhoto, editingSale.id, 'rc-photo', userId); } catch (error) { onToast?.(`RC photo upload failed: ${error.message}`); return; }
    }
    const { data, error } = await supabase.from('sales').update(patch).eq('id', editingSale.id).select().single();
    if (error) { onToast?.(`Sale update failed: ${error.message}`); return; }
    const updated = data || { ...editingSale, ...patch };
    onChange?.(sales.map(sale => sale.id === editingSale.id ? updated : sale));
    setEditingSale(null);
    setSelectedSale(updated);
    onToast?.('Sale details updated and synced.');
    window.setTimeout(() => onToast?.(''), 4000);
  }
  function promptClearPayment(sale) {
    setConfirmClear(sale);
  }
  async function proceedClearPayment() {
    const sale = confirmClear;
    if (!sale) return;
    setConfirmClear(null);
    const { data, error } = await supabase.from('sales').update({ payment_status: 'Paid', amount_paid: sale.sale_amount, updated_at: new Date().toISOString() }).eq('id', sale.id).select().single();
    if (error) { onToast?.(`Failed to clear payment: ${error.message}`); return; }
    onChange?.(sales.map(s => s.id === sale.id ? data || { ...s, payment_status: 'Paid' } : s));
    onToast?.(`Payment cleared for ${sale.customer_name}. Marked as Paid.`);
  }
  const visibleSales = tab === 'Finance' ? sales.filter(s => s.payment_status === 'Finance') : tab === 'Pending' ? sales.filter(s => s.payment_status === 'Pending') : sales.filter(s => s.payment_status === 'Paid');
  return <section className="sales-workspace"><div className="sales-workspace-head"><div><p className="eyebrow">CONNECTED SALES</p><h2>{tab === 'Finance' ? 'Finance desk' : tab === 'Pending' ? 'Pending payments' : 'Cash sales'}</h2><p>{tab === 'Finance' ? 'All financed vehicles stored separately.' : tab === 'Pending' ? 'Track un-cleared payments here.' : 'Edit returns, exchanges, discounts and RC records from here.'}</p></div><div className="workspace-tabs-group"><div className="workspace-tabs"><button className={tab === 'Cash' ? 'active' : ''} onClick={() => setTab('Cash')}>Cash sales</button><button className={tab === 'Finance' ? 'active' : ''} onClick={() => setTab('Finance')}>Finance</button><button className={tab === 'Pending' ? 'active' : ''} onClick={() => setTab('Pending')}>Pending</button></div><span className="inventory-count">{visibleSales.length} records</span></div></div>{visibleSales.length ? <div className="panel sales-records"><div className="table-head sales-record-head"><span>Customer</span><span>Vehicle</span><span>Sale value</span><span>Date</span><span>Payment</span><span></span></div>{visibleSales.map((sale, index) => <div className="sales-record-row" key={sale.id || index}><div className="customer"><div className="avatar" style={{background:['#e8d4ce','#dce3d3','#d9dcea','#e8e0cc'][index % 4]}}>{String(sale.customer_name || 'NK').split(' ').map(x => x[0]).join('').slice(0,2)}</div><div><b>{sale.customer_name}</b><small>{sale.customer_phone || 'No phone added'}</small></div></div><span className="vehicle-highlight"><b>{sale.vehicle_name || 'Vehicle not added'}</b></span><strong>{money(sale.sale_amount)}</strong><span className="muted">{dateLabel(sale.sale_date)}</span><span className={sale.sale_type === 'Return' ? 'status danger' : sale.sale_type === 'Exchange' ? 'status info' : sale.payment_status === 'Paid' ? 'status success' : 'status warning'}><i/>{sale.sale_type || sale.payment_status || 'Pending'}</span><div className="sale-row-actions">{tab === 'Pending' && <button className="outline-button" style={{padding: '5px 10px', margin: 0, width: 'auto'}} onClick={() => promptClearPayment(sale)}>Clear Payment</button>}<button className="text-button" onClick={() => setSelectedSale(sale)}>View</button><button className="text-button" onClick={() => setEditingSale(sale)}>Edit</button></div></div>)}</div> : <div className="panel placeholder-panel"><div className="empty-icon"><Icon name="chart" size={27}/></div><h2>No sales yet</h2><p>Inventory se sale save karte hi yahan sync ho jayegi.</p></div>}{selectedSale && <CustomerDetailModal sale={selectedSale} onClose={() => setSelectedSale(null)} />}{editingSale && <SaleEditModal sale={editingSale} onClose={() => setEditingSale(null)} onSave={saveSaleUpdate} />}{confirmClear && <ConfirmModal message={<>Is <b>{confirmClear.customer_name}</b> ka pending <b>{money(Math.max(0, confirmClear.sale_amount - (confirmClear.amount_paid || 0)))}</b> clear ho gaya hai? Is action ko undo nahi kiya ja sakta.</>} confirmText="Yes, clear payment" onConfirm={proceedClearPayment} onCancel={() => setConfirmClear(null)} />}</section>;
}

function SaleEditModal({ sale, onClose, onSave }) {
  const [form, setForm] = useState({ customerName: sale.customer_name || '', phone: sale.customer_phone || '', vehicleName: sale.vehicle_name || '', saleAmount: sale.sale_amount || 0, discount: sale.discount || 0, paymentStatus: sale.payment_status || 'Pending', saleType: sale.sale_type || 'Sale', oldVehicleName: sale.old_vehicle_name || '', oldVehicleRegistration: sale.old_vehicle_registration || '', exchangeDiscount: sale.exchange_discount || 0, rcPhoto: null, emiAmount: sale.emi_amount || '', tenureMonths: sale.tenure_months || '', amountPaid: sale.amount_paid || 0 });
  const [busy, setBusy] = useState(false);
  const update = (key, value) => setForm(current => ({ ...current, [key]: value }));
  async function submit(event) { event.preventDefault(); setBusy(true); await onSave(form); setBusy(false); }
  const needsExchange = form.saleType === 'Exchange';
  return <div className="modal-backdrop" onClick={onClose}><form className="modal sale-edit-modal" onClick={event => event.stopPropagation()} onSubmit={submit}><div className="modal-head"><div><p className="eyebrow">EDIT SALE · #{sale.id}</p><h2>Update sale record</h2></div><button type="button" className="close" onClick={onClose}>×</button></div><div className="form-grid"><label>Customer name<input value={form.customerName} onChange={event => update('customerName', event.target.value)} required/></label><label>Phone number<input value={form.phone} onChange={event => update('phone', event.target.value)}/></label><label>Current vehicle<input value={form.vehicleName} onChange={event => update('vehicleName', event.target.value)} required/></label><label>Sale amount<input type="number" min="0" value={form.saleAmount} onChange={event => update('saleAmount', event.target.value)} required/></label><label>Discount<input type="number" min="0" value={form.discount} onChange={event => update('discount', event.target.value)}/></label><label>Amount paid (Advance)<input type="number" min="0" value={form.amountPaid} onChange={event => update('amountPaid', event.target.value)}/></label><label>Payment status<select value={form.paymentStatus} onChange={event => update('paymentStatus', event.target.value)}><option>Pending</option><option>Paid</option><option>Finance</option></select></label>{form.paymentStatus === 'Finance' && <><label>EMI Amount<input type="number" min="0" value={form.emiAmount} onChange={e => update('emiAmount', e.target.value)} placeholder="e.g. 3500"/></label><label>Tenure (Months)<input type="number" min="0" value={form.tenureMonths} onChange={e => update('tenureMonths', e.target.value)} placeholder="e.g. 24"/></label></>}<label>Record type<select value={form.saleType} onChange={event => update('saleType', event.target.value)}><option>Sale</option><option>Return</option><option>Exchange</option></select></label>{needsExchange && <><label>Old bike model/name<input value={form.oldVehicleName} onChange={event => update('oldVehicleName', event.target.value)} placeholder="e.g. Splendor+ 2019" required/></label><label>Old bike registration number<input value={form.oldVehicleRegistration} onChange={event => update('oldVehicleRegistration', event.target.value)} placeholder="MH01AB1234" required/></label><label>Exchange discount<input type="number" min="0" value={form.exchangeDiscount} onChange={event => update('exchangeDiscount', event.target.value)}/></label><label>Upload old bike RC photo<input type="file" accept="image/*,.pdf" onChange={event => update('rcPhoto', event.target.files?.[0] || null)}/><small className="hint">Private Supabase storage</small></label></>}</div><div className="modal-foot"><button type="button" className="ghost-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={busy} type="submit">{busy ? 'Saving…' : 'Save changes'}</button></div></form></div>;
}



function CustomerDetailModal({ sale, onClose }) {
  return <div className="modal-backdrop" onClick={onClose}><div className="modal customer-detail-modal" onClick={event => event.stopPropagation()}><div className="modal-head"><div><p className="eyebrow">CUSTOMER PROFILE</p><h2>{sale.customer_name}</h2></div><button className="close" onClick={onClose}>×</button></div><div className="customer-detail-grid"><div><small>PHONE NUMBER</small><strong>{sale.customer_phone || 'Not added'}</strong></div><div className="vehicle-detail-highlight"><small>VEHICLE</small><strong>{sale.vehicle_name || 'Not added'}</strong></div><div><small>SALE VALUE</small><strong>{money(sale.sale_amount)}</strong></div>{sale.payment_status !== 'Paid' && <div><small>AMOUNT PAID</small><strong>{money(sale.amount_paid || 0)}</strong></div>}{sale.payment_status !== 'Paid' && <div><small>AMOUNT PENDING</small><strong style={{ color: '#d32f2f' }}>{money(Math.max(0, sale.sale_amount - (sale.amount_paid || 0)))}</strong></div>}<div><small>PAYMENT STATUS</small><strong>{sale.payment_status || 'Pending'}</strong></div>{sale.payment_status === 'Finance' && <div><small>EMI & TENURE</small><strong>{sale.emi_amount ? `${money(sale.emi_amount)} / ${sale.tenure_months}m` : 'Not recorded'}</strong></div>}<div><small>SALE DATE</small><strong>{dateLabel(sale.sale_date)}</strong></div><div><small>SALE ID</small><strong>#{sale.id}</strong></div></div><div className="customer-detail-note"><span>KYC documents</span><b>Stored privately in Supabase</b><small>Aadhaar/PAN are masked in the UI. Authorized staff can access uploaded documents from the customer record.</small></div><div className="modal-foot"><button className="primary-button" onClick={onClose}>Done</button></div></div></div>;
}

function InventoryManagementWorkspace({ inventory, onChange, onToast }) {
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [editingStockByColor, setEditingStockByColor] = useState([]);
  const [busy, setBusy] = useState(false);

  function openEdit(vehicle) {
    setEditing({ ...vehicle, file: null });
    setEditingStockByColor(vehicle.stock_by_color || []);
  }

  async function confirmRemove() {
    if (!deleting) return;
    setBusy(true);
    const vehicle = deleting;
    const { error } = await supabase.from('inventory').delete().eq('id', vehicle.id);
    if (error) {
      onToast?.('Failed to delete: ' + error.message);
    } else {
      onChange(inventory.filter(v => v.id !== vehicle.id));
      onToast?.(`Deleted ${vehicle.model}.`);
    }
    setBusy(false);
    setDeleting(null);
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    const totalStock = editingStockByColor.reduce((sum, item) => sum + Number(item.qty || 0), 0);
    const payload = { 
      ex_showroom_price: Number(editing.ex_showroom_price), 
      on_road_price: Number(editing.on_road_price),
      stock: totalStock,
      stock_by_color: editingStockByColor,
      status: totalStock > 0 ? 'Available' : 'Unavailable'
    };
    
    if (editing.file) {
      try {
        payload.image_url = await uploadVehicleImage(editing.file, editing.id);
      } catch (err) {
        onToast?.('Image upload failed: ' + err.message);
        setBusy(false);
        return;
      }
    }
    
    const { data, error } = await supabase.from('inventory').update(payload).eq('id', editing.id).select().single();
    if (error) {
      onToast?.('Failed to update: ' + error.message);
      setBusy(false);
      return;
    }
    
    onChange(inventory.map(v => v.id === editing.id ? data : v));
    onToast?.(`Updated ${editing.model} successfully.`);
    setEditing(null);
    setBusy(false);
  }

  return <section className="sales-workspace">
    <div className="sales-workspace-head">
      <div>
        <p className="eyebrow">INVENTORY SETUP</p>
        <h2>Inventory Management</h2>
        <p>Update stock, pricing, and bike photos for the showroom catalog.</p>
      </div>
      <div className="workspace-tabs-group">
        <span className="inventory-count">{inventory.length} models</span>
      </div>
    </div>
    <div className="panel sales-records">
      <div className="table-head sales-record-head" style={{gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr'}}>
        <span>Vehicle</span>
        <span>Ex-showroom</span>
        <span>On-road</span>
        <span>Stock</span>
        <span></span>
      </div>
      {inventory.map(v => <div className="sales-record-row" key={v.id} style={{gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr'}}>
        <div className="customer">
          <div className="avatar" style={{background: '#f1f3f5', overflow: 'hidden'}}>
            {v.image_url ? <img src={v.image_url} style={{width:'100%', height:'100%', objectFit:'cover'}} alt=""/> : <Icon name="bike" size={16}/>}
          </div>
          <div>
            <b>{v.model}</b>
            <small>{v.variant}</small>
          </div>
        </div>
        <span>{money(v.ex_showroom_price)}</span>
        <span>{money(v.on_road_price)}</span>
        <span className={v.stock <= 2 ? 'status warning' : 'status success'}><i/>{v.stock} left</span>
        <div className="sale-row-actions">
          <button className="outline-button" style={{padding: '5px 10px', margin: 0, width: 'auto'}} onClick={() => openEdit(v)}>Edit</button>
          <button className="outline-button danger-button" style={{padding: '5px 10px', margin: '0 0 0 8px', width: 'auto'}} onClick={() => setDeleting(v)}>Delete</button>
        </div>
      </div>)}
    </div>
    {editing && <div className="modal-backdrop" onClick={() => setEditing(null)}>
      <div className="modal sale-modal" style={{maxWidth: '500px'}} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Edit {editing.model}</h2>
          <button className="icon-button" onClick={() => setEditing(null)}><Icon name="x" size={20}/></button>
        </div>
        <form className="modal-body form-grid" style={{gridTemplateColumns: '1fr', gap: '16px'}} onSubmit={save}>
          <div style={{display: 'flex', gap: '16px'}}>
            <label style={{flex: 1}}>Ex-showroom Price (₹)<input type="number" required value={editing.ex_showroom_price} onChange={e => setEditing({...editing, ex_showroom_price: e.target.value})}/></label>
            <label style={{flex: 1}}>On-road Price (₹)<input type="number" required value={editing.on_road_price} onChange={e => setEditing({...editing, on_road_price: e.target.value})}/></label>
          </div>
          <div>
            <label>Color-wise Stock</label>
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', padding: '12px', background: '#f8f9fa', borderRadius: '8px'}}>
              {editingStockByColor.map((item, idx) => (
                <div key={idx} style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                  <input type="text" placeholder="Color (e.g. Matte Red)" required value={item.color} onChange={e => {
                    const newArr = [...editingStockByColor];
                    newArr[idx].color = e.target.value;
                    setEditingStockByColor(newArr);
                  }} style={{flex: 1}}/>
                  <input type="number" placeholder="Qty" min="0" required value={item.qty} onChange={e => {
                    const newArr = [...editingStockByColor];
                    newArr[idx].qty = Number(e.target.value);
                    setEditingStockByColor(newArr);
                  }} style={{width: '80px'}}/>
                  <button type="button" className="icon-button" onClick={() => {
                    setEditingStockByColor(editingStockByColor.filter((_, i) => i !== idx));
                  }}><Icon name="x" size={16}/></button>
                </div>
              ))}
              <button type="button" className="ghost-button compact-button" style={{alignSelf: 'flex-start', marginTop: '4px'}} onClick={() => setEditingStockByColor([...editingStockByColor, { color: '', qty: 1 }])}>+ Add color variant</button>
            </div>
            <small className="hint">Total stock is calculated automatically.</small>
          </div>
          <div>
            <label>Upload Photo<input type="file" accept="image/*" onChange={e => setEditing({...editing, file: e.target.files[0]})}/><small className="hint">Overrides the current bike photo.</small></label>
          </div>
          <div className="modal-foot" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="ghost-button" onClick={() => setEditing(null)} style={{ flex: 1 }}>Cancel</button>
            <button type="submit" disabled={busy} className="primary-button" style={{ flex: 1 }}>{busy ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>}
    {deleting && <div className="modal-backdrop" onClick={() => setDeleting(null)}>
      <div className="modal sale-modal" style={{maxWidth: '400px'}} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Delete {deleting.model}?</h2>
          <button className="icon-button" onClick={() => setDeleting(null)}><Icon name="x" size={20}/></button>
        </div>
        <div className="modal-body" style={{padding: '0 24px 24px'}}>
          <p style={{margin: '0 0 20px', color: '#657487', fontSize: '14px', lineHeight: '1.5'}}>Are you sure you want to delete <b>{deleting.model}</b> from the inventory? This action cannot be undone and it will be removed from all screens.</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="ghost-button" onClick={() => setDeleting(null)} style={{ flex: 1 }}>Cancel</button>
            <button type="button" disabled={busy} className="primary-button" style={{ flex: 1, background: '#d32f2f' }} onClick={confirmRemove}>{busy ? 'Deleting...' : 'Yes, Delete'}</button>
          </div>
        </div>
      </div>
    </div>}
  </section>;
}

function TestRideInventoryWorkspace({ vehicles, onChange, onToast }) {
  const blank = { model: '', variant: '', cc: '', color: '', stock: 1 };
  const [items, setItems] = useState(vehicles);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(blank);

  useEffect(() => setItems(vehicles), [vehicles]);

  function notify(message) {
    onToast?.(message);
    window.setTimeout(() => onToast?.(''), 3500);
  }

  function openAdd() {
    setEditing(null);
    setForm(blank);
    setShowForm(true);
  }

  function openEdit(vehicle) {
    setEditing(vehicle);
    setForm({ model: vehicle.model || '', variant: vehicle.variant || '', cc: vehicle.cc || '', color: vehicle.color || '', stock: vehicle.stock ?? 0, file: null });
    setShowForm(true);
  }

  async function saveVehicle(event) {
    event.preventDefault();
    setBusy(true);
    const payload = { model: form.model.trim(), variant: form.variant.trim(), cc: Number(form.cc || 0), color: form.color.trim(), stock: Math.max(0, Number(form.stock || 0)), status: Number(form.stock || 0) > 0 ? 'Available' : 'Unavailable' };
    if (!payload.model || !payload.variant || !payload.color) { setBusy(false); return; }
    let nextItem;
    if (editing?.id && !String(editing.id).startsWith('local-')) {
      if (form.file) {
        try {
          payload.image_url = await uploadVehicleImage(form.file, editing.id);
        } catch(err) {
          notify(`Image upload failed: ${err.message}`);
          setBusy(false);
          return;
        }
      }
      const { data, error } = await supabase.from('test_drive_inventory').update(payload).eq('id', editing.id).select().single();
      if (error) { notify(`Update failed: ${error.message}`); setBusy(false); return; }
      nextItem = data;
      const next = items.map(item => item.id === editing.id ? nextItem : item);
      setItems(next); onChange?.(next);
      notify('Test ride bike updated.');
    } else if (editing) {
      nextItem = { ...editing, ...payload };
      const next = items.map(item => item.id === editing.id ? nextItem : item);
      setItems(next); onChange?.(next);
      notify('Test ride bike updated locally.');
    } else {
      const { data, error } = await supabase.from('test_drive_inventory').insert(payload).select().single();
      if (error) { notify(`Add failed: ${error.message}`); setBusy(false); return; }
      nextItem = data;
      if (form.file) {
        try {
          const image_url = await uploadVehicleImage(form.file, nextItem.id);
          await supabase.from('test_drive_inventory').update({ image_url }).eq('id', nextItem.id);
          nextItem.image_url = image_url;
        } catch(err) { notify('Added bike, but image upload failed'); }
      }
      const next = [nextItem, ...items];
      setItems(next); onChange?.(next);
      notify('Test ride bike added.');
    }
    setBusy(false);
    setEditing(null);
    setShowForm(false);
  }

  async function confirmRemove() {
    if (!deleting) return;
    setBusy(true);
    const vehicle = deleting;
    if (vehicle.id && !String(vehicle.id).startsWith('local-')) {
      const { error } = await supabase.from('test_drive_inventory').delete().eq('id', vehicle.id);
      if (error) { notify(`Delete failed: ${error.message}`); setBusy(false); return; }
    }
    const next = items.filter(item => item.id !== vehicle.id);
    setItems(next); onChange?.(next); notify('Test ride bike removed.');
    setBusy(false);
    setDeleting(null);
  }

  const available = items.filter(vehicle => Number(vehicle.stock || 0) > 0).length;
  return <section className="test-ride-inventory" style={{paddingTop: 0, height: 'auto', flex: 1}}><div className="test-ride-inventory-head"><div><p className="eyebrow">DEMO FLEET</p><h2>Test ride inventory</h2><p>Separate bikes reserved only for customer test rides.</p></div><div className="test-ride-head-actions"><div className="inventory-count">{available} available · {items.length} demo bikes</div><button className="primary-button" onClick={openAdd}><Icon name="plus" size={15}/> Add bike</button></div></div>{items.length ? <div className="panel demo-fleet-grid">{items.map((vehicle, index) => <div className="demo-fleet-row" key={vehicle.id || index}><div className="demo-bike-mark">{vehicle.image_url ? <img src={vehicle.image_url} style={{width:'100%', height:'100%', objectFit:'cover'}} alt=""/> : <Icon name="bike" size={22}/>}</div><div><b>{vehicle.model}</b><small>{vehicle.variant} · {vehicle.cc || '—'} cc · {vehicle.color}</small></div><span className={Number(vehicle.stock) > 0 ? 'status success' : 'status warning'}><i/>{Number(vehicle.stock) > 0 ? `${vehicle.stock} available` : 'Unavailable'}</span><div className="demo-fleet-actions"><button className="ghost-button compact-button" onClick={() => openEdit(vehicle)}>Edit</button><button className="ghost-button compact-button danger-button" onClick={() => setDeleting(vehicle)}>Delete</button></div></div>)}</div> : <div className="panel placeholder-panel"><h2>No demo bikes added</h2><p>Add a bike to create your separate test ride fleet.</p><button className="primary-button" onClick={openAdd}><Icon name="plus" size={15}/> Add first bike</button></div>}{showForm && <div className="modal-backdrop" onClick={() => { setShowForm(false); setEditing(null); }}><form className="modal demo-inventory-modal" onClick={event => event.stopPropagation()} onSubmit={saveVehicle}><div className="modal-head"><div><p className="eyebrow">{editing ? 'UPDATE DEMO BIKE' : 'ADD DEMO BIKE'}</p><h2>{editing ? 'Edit test ride bike' : 'Add test ride bike'}</h2></div><button type="button" className="close" onClick={() => { setShowForm(false); setEditing(null); }}>×</button></div><div className="form-grid"><label>Model<input value={form.model} onChange={event => setForm({ ...form, model: event.target.value })} placeholder="e.g. Xtreme 125R" required/></label><label>Variant<input value={form.variant} onChange={event => setForm({ ...form, variant: event.target.value })} placeholder="e.g. ABS" required/></label><label>Engine cc<input type="number" min="0" value={form.cc} onChange={event => setForm({ ...form, cc: event.target.value })} placeholder="125" required/></label><label>Colour<input value={form.color} onChange={event => setForm({ ...form, color: event.target.value })} placeholder="Matte Red" required/></label><label>Available stock<input type="number" min="0" value={form.stock} onChange={event => setForm({ ...form, stock: event.target.value })} required/><small className="hint">0 stock means unavailable for booking</small></label><label>Upload Photo<input type="file" title=" " accept="image/*" onChange={e => setForm({...form, file: e.target.files[0]})}/></label></div><div className="modal-foot"><button type="button" className="ghost-button" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</button><button className="primary-button" type="submit" disabled={busy}><Icon name="check" size={15}/> {editing ? 'Save changes' : 'Add bike'}</button></div></form></div>}
  {deleting && <div className="modal-backdrop" onClick={() => setDeleting(null)}>
      <div className="modal sale-modal" style={{maxWidth: '400px'}} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Delete {deleting.model}?</h2>
          <button className="icon-button" onClick={() => setDeleting(null)}><Icon name="x" size={20}/></button>
        </div>
        <div className="modal-body" style={{padding: '0 24px 24px'}}>
          <p style={{margin: '0 0 20px', color: '#657487', fontSize: '14px', lineHeight: '1.5'}}>Are you sure you want to delete <b>{deleting.model}</b> from the test ride inventory? This action cannot be undone.</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="ghost-button" onClick={() => setDeleting(null)} style={{ flex: 1 }}>Cancel</button>
            <button type="button" disabled={busy} className="primary-button" style={{ flex: 1, background: '#d32f2f' }} onClick={confirmRemove}>{busy ? 'Deleting...' : 'Yes, Delete'}</button>
          </div>
        </div>
      </div>
    </div>}
  </section>;
}




function RCTracker({ records, onStatusChange }) {
  const [tab, setTab] = useState('Open');
  const openRecords = records.filter(r => r.status !== 'Completed');
  const completedRecords = records.filter(r => r.status === 'Completed');
  const shown = tab === 'Open' ? openRecords : completedRecords;

  return <section className="rc-layout">
    <div className="workspace-tabs-group" style={{marginBottom: '24px'}}>
      <div className="workspace-tabs">
        <button className={tab === 'Open' ? 'active' : ''} onClick={() => setTab('Open')}>Open <em>{openRecords.length}</em></button>
        <button className={tab === 'Completed' ? 'active' : ''} onClick={() => setTab('Completed')}>Completed <em>{completedRecords.length}</em></button>
      </div>
    </div>
    <div className="rc-header">
      <div><p className="eyebrow">LINKED TO SALES</p><h2>RC applications</h2><p>Har sold bike ka RC record yahan automatically create hota hai.</p></div>
      <div className="rc-summary"><b>{completedRecords.length}</b><span>completed</span><b>{openRecords.length}</b><span>open</span></div>
    </div>
    {shown.length ? <div className="panel rc-table"><div className="table-head rc-table-head"><span>Customer</span><span>Vehicle</span><span>Sale link</span><span>Status</span><span>Update</span></div>{shown.map((record, index) => <div className="rc-row" key={record.id || index}><div className="customer"><div className="avatar" style={{background:['#e8d4ce','#dce3d3','#d9dcea','#e8e0cc'][index % 4]}}>{String(record.customer_name || 'NK').split(' ').map(x => x[0]).join('').slice(0,2)}</div><b>{record.customer_name}</b></div><span className="muted">{record.vehicle_name}</span><span className="sale-link"><i/> Sale #{record.sale_id}</span><span className={`status ${record.status === 'Completed' ? 'success' : record.status === 'Submitted' ? 'info' : 'warning'}`}><i/>{record.status}</span><select value={record.status} onChange={e => onStatusChange(record, e.target.value)}><option>Pending</option><option>Submitted</option><option>Processing</option><option>Completed</option></select></div>)}</div>
    : <div className="panel placeholder-panel"><div className="empty-icon"><Icon name="file" size={27}/></div><h2>{tab === 'Open' ? 'Koi pending RC nahi' : 'Koi completed RC nahi'}</h2><p>{tab === 'Open' ? 'Saari RC applications complete ho gayi hain.' : 'Abhi tak koi RC complete nahi hua.'}</p></div>}
  </section>;
}

function SignaturePad({ value, onChange }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [typedName, setTypedName] = useState('');
  const point = event => { const rect = canvasRef.current.getBoundingClientRect(); const scaleX = canvasRef.current.width / rect.width; const scaleY = canvasRef.current.height / rect.height; return { x: (event.clientX - rect.left) * scaleX, y: (event.clientY - rect.top) * scaleY }; };
  const start = event => { drawing.current = true; canvasRef.current.setPointerCapture(event.pointerId); const ctx = canvasRef.current.getContext('2d'); const p = point(event); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
  const move = event => { if (!drawing.current) return; const canvas = canvasRef.current; const ctx = canvas.getContext('2d'); const p = point(event); ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.strokeStyle = '#252524'; ctx.lineTo(p.x, p.y); ctx.stroke(); onChange(canvas.toDataURL('image/png')); };
  const end = () => { drawing.current = false; };
  const drawTypedName = name => { const canvas = canvasRef.current; const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height); if (name.trim()) { ctx.fillStyle = '#252524'; ctx.font = '600 130px Caveat, cursive'; ctx.textBaseline = 'middle'; ctx.fillText(name.trim(), 40, canvas.height / 2 + 10); onChange(canvas.toDataURL('image/png')); } else onChange(''); };
  const handleTypedName = event => { const name = event.target.value; setTypedName(name); if (!drawing.current) drawTypedName(name); };
  const clear = () => { const canvas = canvasRef.current; canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height); setTypedName(''); onChange(''); };
  return <div className="signature-wrap"><div className="signature-head"><span>Customer signature</span><button type="button" className="signature-clear" onClick={clear}>Clear</button></div><canvas ref={canvasRef} width="900" height="190" className="signature-pad" onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end}/><div className="typed-signature"><label>Can’t sign? Type full name<input value={typedName} onChange={handleTypedName} placeholder="e.g. Priya Shah"/></label><small>Typed name is converted into a digital signature.</small></div><small>Draw above or type your name to include a digital signature on the invoice PDF.</small></div>;
}

function SaleModal({ vehicle, onClose, onSave }) {
  let availableColors = vehicle.stock_by_color?.filter(s => Number(s.qty) > 0).map(s => s.color);
  if (!availableColors || availableColors.length === 0) {
    availableColors = vehicle.available_colors || ({ 'Splendor+': ['Black', 'Silver', 'Blue'], 'Pleasure+': ['Pearl White', 'Matte Grey', 'Red'], 'Xtreme 125R': ['Matte Red', 'Black', 'Blue'], 'Glamour': ['Candy Red', 'Black', 'Grey'], 'Xtreme 160R': ['Sports Red', 'Stealth Black', 'Grey'], 'Maverick 440': ['Phantom Black', 'Stone Grey', 'Red'] }[vehicle.model] || [vehicle.color || 'Default']);
  }
  const [customer, setCustomer] = useState(''); const [phone, setPhone] = useState(''); const [aadhaar, setAadhaar] = useState(''); const [pan, setPan] = useState(''); const [aadhaarFile, setAadhaarFile] = useState(null); const [panFile, setPanFile] = useState(null); const [signature, setSignature] = useState(''); const [discount, setDiscount] = useState('0'); const [payment, setPayment] = useState('Pending'); const [saleType, setSaleType] = useState('Sale'); const [oldVehicleName, setOldVehicleName] = useState(''); const [oldVehicleRegistration, setOldVehicleRegistration] = useState(''); const [exchangeValue, setExchangeValue] = useState('0'); const [exchangeDiscount, setExchangeDiscount] = useState('0'); const [rcFile, setRcFile] = useState(null); const [emiAmount, setEmiAmount] = useState(''); const [tenureMonths, setTenureMonths] = useState(''); const [amountPaid, setAmountPaid] = useState(''); const [vehicleColor, setVehicleColor] = useState(availableColors[0]);
  const base = Number(vehicle.on_road_price || vehicle.ex_showroom_price); const safeDiscount = Math.min(Number(discount || 0), Number(vehicle.max_discount || 0)); const safeExchangeValue = saleType === 'Exchange' ? Math.max(0, Number(exchangeValue || 0)) : 0; const safeExchangeDiscount = saleType === 'Exchange' ? Math.max(0, Number(exchangeDiscount || 0)) : 0; const finalAmount = Math.max(0, base - safeDiscount - safeExchangeValue - safeExchangeDiscount);
  return <div className="modal-backdrop" onClick={onClose}><div className="modal sale-modal" onClick={e => e.stopPropagation()}><div className="modal-head"><div><p className="eyebrow">CONFIRM SALE</p><h2>{vehicle.model} <span>{vehicle.variant}</span></h2></div><button className="close" onClick={onClose}>×</button></div><div className={`sale-summary ${saleType === 'Exchange' ? 'has-exchange' : ''}`}><div><small>LISTED PRICE</small><b>{money(base)}</b></div><div><small>FINAL AMOUNT</small><strong>{money(finalAmount)}</strong></div>{saleType === 'Exchange' && <div className="exchange-summary"><small>EXCHANGE BENEFIT</small><b>− {money(safeExchangeValue + safeExchangeDiscount)}</b></div>}</div><div className="form-grid"><label>Customer name<input value={customer} onChange={e => setCustomer(e.target.value)} placeholder="e.g. Priya Shah" required/></label><label>Phone number<input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98XXX XXXXX"/></label><label>Vehicle color<select value={vehicleColor} onChange={e => setVehicleColor(e.target.value)}>{availableColors.map(c => <option key={c} value={c}>{c}</option>)}</select></label><label>Aadhaar number <span className="privacy-note">last 4 only<input inputMode="numeric" maxLength="12" value={aadhaar} onChange={e => setAadhaar(e.target.value)} placeholder="XXXX XXXX 1234"/></span></label><label>PAN number <span className="privacy-note">masked in record<input maxLength="10" value={pan} onChange={e => setPan(e.target.value.toUpperCase())} placeholder="ABCDE1234F"/></span></label><label>Upload Aadhaar<input type="file" accept="image/*,.pdf" onChange={e => setAadhaarFile(e.target.files?.[0] || null)}/><small className="hint">Private Supabase storage</small></label><label>Upload PAN<input type="file" accept="image/*,.pdf" onChange={e => setPanFile(e.target.files?.[0] || null)}/><small className="hint">Private Supabase storage</small></label><label>Discount<input type="number" min="0" max={vehicle.max_discount} value={discount} onChange={e => setDiscount(e.target.value)}/><small className="hint">Allowed up to {money(vehicle.max_discount)}</small></label><label>Payment status<select value={payment} onChange={e => setPayment(e.target.value)}><option>Pending</option><option>Paid</option><option>Finance</option></select></label><label>Amount paid (Advance)<input type="number" min="0" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} placeholder="e.g. 5000"/><small className="hint">Remaining: {money(Math.max(0, finalAmount - Number(amountPaid || 0)))}</small></label>{payment === 'Finance' && <><label>EMI Amount<input type="number" min="0" value={emiAmount} onChange={e => setEmiAmount(e.target.value)} placeholder="e.g. 3500"/></label><label>Tenure (Months)<input type="number" min="0" value={tenureMonths} onChange={e => setTenureMonths(e.target.value)} placeholder="e.g. 24"/></label></>}<label>Sale type<select value={saleType} onChange={e => setSaleType(e.target.value)}><option>Sale</option><option>Exchange</option></select></label>{saleType === 'Exchange' && <><label>Old bike model/name<input value={oldVehicleName} onChange={e => setOldVehicleName(e.target.value)} placeholder="e.g. Splendor+ 2019" required/></label><label>Old bike registration number<input value={oldVehicleRegistration} onChange={e => setOldVehicleRegistration(e.target.value)} placeholder="MH01AB1234" required/></label><label>Exchange value<input type="number" min="0" value={exchangeValue} onChange={e => setExchangeValue(e.target.value)} placeholder="50000" required/><small className="hint">Old bike value deducted from final amount</small></label><label>Exchange discount<input type="number" min="0" value={exchangeDiscount} onChange={e => setExchangeDiscount(e.target.value)} placeholder="5000"/><small className="hint">Additional exchange offer</small></label><label>Upload old bike RC<input type="file" accept="image/*,.pdf" onChange={e => setRcFile(e.target.files?.[0] || null)}/><small className="hint">Private Supabase storage</small></label></>}</div><SignaturePad value={signature} onChange={setSignature}/><div className="modal-foot"><button className="ghost-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={!customer} onClick={() => onSave({ customer, phone, aadhaar, pan, aadhaarFile, panFile, signature, discount: safeDiscount, payment, saleType, oldVehicleName, oldVehicleRegistration, exchangeValue: safeExchangeValue, exchangeDiscount: safeExchangeDiscount, rcFile, emiAmount, tenureMonths, amountPaid: amountPaid ? Number(amountPaid) : (payment === 'Paid' ? finalAmount : 0), vehicleColor })}><Icon name="check" size={16}/> Save sale + invoice</button></div></div></div>;
}

function InvoiceModal({ record, onClose }) {
  const { sale, vehicle, customer, saleAmount, discount, signature } = record;
  const invoiceNo = `RF-${new Date(sale.sale_date).getFullYear()}-${String(sale.id).padStart(5, '0')}`;
  const invoiceRef = useRef(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  async function makePdf() {
    setPdfBusy(true);
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2, backgroundColor: '#fffdfa', useCORS: true });
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth(); const pageHeight = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
      pdf.addImage(canvas.toDataURL('image/jpeg', .95), 'JPEG', 0, 0, canvas.width * ratio, canvas.height * ratio);
      return { pdf, blob: pdf.output('blob') };
    } finally { setPdfBusy(false); }
  }
  async function downloadPdf() { const { pdf } = await makePdf(); pdf.save(`${invoiceNo}.pdf`); }
  function shareWhatsApp() {
    const phone = String(customer.phone || '').replace(/\D/g, '');
    const text = encodeURIComponent(`Hello ${customer.name}, your Hero MotoCorp invoice ${invoiceNo} is ready. Total: ${money(saleAmount)}. Please download the PDF and send it here.`);
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank', 'noopener,noreferrer');
  }
  return <div className="modal-backdrop invoice-backdrop" onClick={onClose}><div className="invoice-sheet" onClick={e => e.stopPropagation()}><div className="invoice-actions"><button className="ghost-button" onClick={onClose}>Close</button><button className="ghost-button" disabled={pdfBusy} onClick={shareWhatsApp}>Send on WhatsApp</button><button className="primary-button" disabled={pdfBusy} onClick={downloadPdf}>{pdfBusy ? 'Preparing PDF…' : 'Download PDF'}</button></div><div className="invoice-paper" ref={invoiceRef}><div className="invoice-top"><div><div className="invoice-brand"><span>R</span><div><b>rideflow</b><small>SHOWROOM OS</small></div></div><p>Hero MotoCorp · Andheri West<br/>Mumbai, Maharashtra · +91 22 4000 2026</p></div><div className="invoice-meta"><small>TAX INVOICE</small><strong>{invoiceNo}</strong><span>{dateLabel(sale.sale_date)} · {new Date(sale.sale_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span></div></div><div className="invoice-rule"/><div className="invoice-parties"><div><small>BILLED TO</small><b>{customer.name}</b><span>{customer.phone || 'Phone not added'}</span><span>Aadhaar · •••• {customer.aadhaar_last4 || 'Not added'}</span><span>PAN · {customer.pan_masked || 'Not added'}</span></div><div><small>VEHICLE DETAILS</small><b>{vehicle.model}</b><span>{vehicle.variant} · {vehicle.cc || '—'} cc</span><span>Colour · {vehicle.color}</span></div></div><div className="invoice-items"><div className="invoice-item invoice-item-head"><span>DESCRIPTION</span><span>AMOUNT</span></div><div className="invoice-item"><span><b>{vehicle.model} {vehicle.variant}</b><small>On-road vehicle price</small></span><strong>{money(vehicle.on_road_price || vehicle.ex_showroom_price)}</strong></div><div className="invoice-item discount-row"><span>Showroom discount</span><strong>− {money(discount)}</strong></div></div><div className="invoice-total"><span>Total payable</span><strong>{money(saleAmount)}</strong></div><div className="invoice-footer"><div><b>Thank you for choosing Hero MotoCorp.</b><span>RC application has been linked to this sale.</span></div><div>{signature && <div className="invoice-signature"><img src={signature} alt="Customer digital signature"/><small>Digitally signed by customer</small></div>}<small>PAYMENT STATUS</small><strong>{sale.payment_status || 'Pending'}</strong></div></div></div></div></div>;
}

function ConfirmModal({ message, confirmText = 'OK', cancelText = 'Cancel', onConfirm, onCancel }) {
  return <div className="modal-backdrop" onClick={onCancel}>
    <div className="modal sale-modal" style={{maxWidth: '360px'}} onClick={e => e.stopPropagation()}>
      <div className="modal-head">
        <h2>Confirm action</h2>
        <button className="icon-button" onClick={onCancel}><Icon name="x" size={20}/></button>
      </div>
      <div className="modal-body" style={{fontSize: '14px', lineHeight: '1.5', marginTop: '10px'}}>
        {message}
      </div>
      <div className="modal-foot" style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
        <button type="button" className="outline-button" onClick={onCancel} style={{ flex: 1 }}>{cancelText}</button>
        <button type="button" className="primary-button" onClick={onConfirm} style={{ flex: 1 }}>{confirmText}</button>
      </div>
    </div>
  </div>;
}

function PricingModal({ vehicle, isEmi, onClose }) {
  return <div className="modal-backdrop" onClick={onClose}><div className="modal sale-modal" onClick={e => e.stopPropagation()}><div className="modal-head"><h2>{isEmi ? 'EMI finance breakdown' : 'Pricing breakdown'}</h2><button className="icon-button" onClick={onClose}><Icon name="x" size={20}/></button></div><div className="modal-body pricing-rows"><div className="pricing-row"><span>Ex-showroom price</span><strong>{money(vehicle.ex_showroom_price)}</strong></div><div className="pricing-row"><span>RTO + Insurance + PDI</span><strong>{money(vehicle.on_road_price - vehicle.ex_showroom_price)}</strong></div><div className="pricing-row"><span>Accessories kit</span><strong>Included</strong></div><div className="pricing-row total-row"><span>Total on-road price</span><strong>{money(vehicle.on_road_price)}</strong></div><p className="pricing-note">Subject to change. Validity: 15 days.</p></div></div></div>;
}

function PendingDuesWorkspace({ dues, onChange, onToast }) {
  const [tab, setTab] = useState('Pending');
  const [showAdd, setShowAdd] = useState(false);
  const [confirmClear, setConfirmClear] = useState(null);
  
  const visibleDues = dues.filter(d => d.status === tab);
  
  async function performClear(due) {
    const { data, error } = await supabase.from('pending_dues').update({ status: 'Cleared' }).eq('id', due.id).select().single();
    if (error) { onToast?.(`Error clearing due: ${error.message}`); setConfirmClear(null); return; }
    onChange(dues.map(d => d.id === due.id ? data : d));
    onToast?.(`Udhaar cleared for ${due.customer_name}!`);
    setConfirmClear(null);
  }

  return <section className="sales-workspace">
    <div className="sales-workspace-head">
      <div>
        <p className="eyebrow">STORE CREDITS</p>
        <h2>Pending dues (Udhaar)</h2>
        <p>Track informal store credits and customer dues here.</p>
      </div>
      <div className="workspace-tabs-group">
        <div className="workspace-tabs">
          <button className={tab === 'Pending' ? 'active' : ''} onClick={() => setTab('Pending')}>Pending</button>
          <button className={tab === 'Cleared' ? 'active' : ''} onClick={() => setTab('Cleared')}>Cleared</button>
        </div>
        <button className="primary-button" onClick={() => setShowAdd(true)}><Icon name="plus" size={16}/> New udhaar</button>
      </div>
    </div>
    {visibleDues.length ? <div className="panel sales-records">
      <div className="table-head sales-record-head" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
        <span>Customer</span>
        <span>Amount due</span>
        <span>Status</span>
        <span></span>
      </div>
      {visibleDues.map((due, index) => <div className="sales-record-row" key={due.id} style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
        <div className="customer">
          <div className="avatar" style={{background:['#e8d4ce','#dce3d3','#d9dcea','#e8e0cc'][index % 4]}}>
            {String(due.customer_name || 'NK').split(' ').map(x => x[0]).join('').slice(0,2)}
          </div>
          <div>
            <b>{due.customer_name}</b>
            <small>{due.customer_phone || 'No phone added'}</small>
          </div>
        </div>
        <strong>{money(due.amount)}</strong>
        <span className={due.status === 'Pending' ? 'status warning' : 'status success'}><i/>{due.status}</span>
        <div className="sale-row-actions">
          {due.status === 'Pending' && <button className="outline-button" style={{padding: '5px 10px', margin: 0, width: 'auto'}} onClick={() => setConfirmClear(due)}>Clear Udhaar</button>}
        </div>
      </div>)}
    </div> : <div className="panel placeholder-panel">
      <div className="empty-icon"><Icon name="file" size={27}/></div>
      <h2>No {tab.toLowerCase()} dues</h2>
      <p>Aapka udhaar record yahan aayega.</p>
    </div>}
    {showAdd && <PendingDuesModal onClose={() => setShowAdd(false)} onSave={async (values) => {
      const { data, error } = await supabase.from('pending_dues').insert([values]).select().single();
      if (error) { onToast?.(`Error adding due: ${error.message}`); return; }
      onChange([data, ...dues]);
      onToast?.('New udhaar added successfully.');
      setShowAdd(false);
    }} />}
    {confirmClear && <ConfirmModal 
      message={`Is ${confirmClear.customer_name} ka ₹${confirmClear.amount} udhaar clear ho gaya hai?`} 
      confirmText="Yes, clear it" 
      onConfirm={() => performClear(confirmClear)} 
      onCancel={() => setConfirmClear(null)} 
    />}
  </section>;
}

function PendingDuesModal({ onClose, onSave }) {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', amount: '' });
  
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    await onSave({
      customer_name: form.customer_name.trim(),
      customer_phone: form.customer_phone.trim(),
      amount: Number(form.amount)
    });
    setBusy(false);
  }

  return <div className="modal-backdrop" onClick={onClose}>
    <div className="modal sale-modal" style={{maxWidth: '400px'}} onClick={e => e.stopPropagation()}>
      <div className="modal-head">
        <h2>Add pending due</h2>
        <button className="icon-button" onClick={onClose}><Icon name="x" size={20}/></button>
      </div>
      <form className="modal-body form-grid" style={{gridTemplateColumns: '1fr', gap: '16px'}} onSubmit={submit}>
        <div>
          <label>Customer name <input autoFocus required placeholder="Rahul Sharma" value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} /></label>
        </div>
        <div>
          <label>Phone number <input type="tel" placeholder="9876543210" value={form.customer_phone} onChange={e => setForm({...form, customer_phone: e.target.value})} /></label>
        </div>
        <div>
          <label>Amount (₹) <input type="number" required min="1" placeholder="500" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} /></label>
        </div>
        <div className="modal-foot" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button type="button" className="outline-button" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button type="submit" className="primary-button" disabled={busy} style={{ flex: 1 }}>{busy ? 'Saving...' : 'Save Udhaar'}</button>
        </div>
      </form>
    </div>
  </div>;
}

const Metric = ({ label, value, delta, foot, accent }) => { const type = label === 'MONTHLY SALES' ? 'sales-chart' : label === 'UNITS SOLD' ? 'units-chart' : label === 'AVAILABLE STOCK' ? 'stock-chart' : 'rc-chart'; return <div className="metric"><p className="eyebrow">{label}</p><div className="metric-main"><strong>{value}</strong><span className={accent === 'amber' ? 'metric-delta amber' : 'metric-delta'}>{delta}</span></div><span className="muted">{foot}</span>{type === 'sales-chart' && <div className="metric-chart sales-chart"><svg viewBox="0 0 120 38" preserveAspectRatio="none"><path className="chart-area" d="M2 32 L18 25 L32 28 L47 17 L62 21 L78 9 L94 14 L108 4 L118 8 L118 38 L2 38 Z"/><path className="chart-line" d="M2 32 L18 25 L32 28 L47 17 L62 21 L78 9 L94 14 L108 4 L118 8"/></svg><span>7-day sales</span></div>}{type === 'units-chart' && <div className="metric-chart units-chart"><div className="units-bars"><i/><i/><i/><i/><i/><i/><i/></div><span>units moved</span></div>}{type === 'stock-chart' && <div className="metric-chart stock-chart"><div className="stock-ring"><b>LIVE</b></div><span>available now</span></div>}{type === 'rc-chart' && <div className="metric-chart rc-chart"><div className="rc-track"><i/></div><span>needs attention</span></div>}</div>; };

createRoot(document.getElementById('root')).render(<App />);
