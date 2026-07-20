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
    refresh: <><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
};

const fallbackInventory = [];

const fallbackTestDriveInventory = [];

const fallbackSales = [];

const fallbackSecondHandInventory = [
  { id: 1, model: 'Splendor+ i3S', variant: 'Self Start Drum', cc: 100, color: 'Black with Purple', price: 42000, stock: 1, registration_number: 'MH02DU1234', km_driven: 18500, year_of_manufacture: 2021, status: 'Available' },
  { id: 2, model: 'Glamour Disc', variant: 'Disc Brake', cc: 125, color: 'Techno Blue', price: 48000, stock: 1, registration_number: 'MH03ET5678', km_driven: 22000, year_of_manufacture: 2020, status: 'Available' }
];

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
  return <div className="auth-screen"><div className="auth-panel"><div className="auth-brand"><img src="/hero.png" alt="Hero MotoCorp" style={{height:'30px', width:'auto', objectFit:'contain'}}/><div><b>rideflow</b><small>SHOWROOM OS</small></div></div><p className="eyebrow">SECURE SHOWROOM LOGIN</p><h1>{mode === 'signin' ? 'Welcome back.' : 'Create staff access.'}</h1><p className="auth-copy">Sign in to manage sales, inventory and customer follow-ups.</p><form onSubmit={submit}>{mode === 'signup' && <label>Full name<input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Aamir Khan" required/></label>}<label>Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="staff@showroom.com" required/></label><label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 6 characters" minLength="6" required/></label><button className="primary-button auth-submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'signin' ? 'Sign in to RideFlow' : 'Create account'}</button></form>{message && <p className="auth-message">{message}</p>}<button className="auth-switch" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage(''); }}>{mode === 'signin' ? 'Need staff access? Create an account' : 'Already have an account? Sign in'}</button></div><div className="auth-side" style={{backgroundImage: 'url(/showroom-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center right'}}><div style={{position:'absolute',inset:0,background:'linear-gradient(135deg, rgba(15,15,15,0.82) 0%, rgba(25,25,25,0.55) 60%, rgba(10,10,10,0.7) 100%)'}} /><img src="/hero.png" alt="Hero" className="auth-side-mark" style={{position:'relative', zIndex:1, height:'36px', width:'auto', filter:'brightness(0) invert(1)'}}/><p style={{position:'relative', zIndex:1}}>One clean workspace for every ride sold, every number plate updated, every customer remembered.</p><small style={{position:'relative', zIndex:1}}>Hero MotoCorp · Churcha</small></div></div>;
}

function App() {
  const [session, setSession] = useState(undefined);
  const [clock, setClock] = useState(() => new Date());
  const [profile, setProfile] = useState(null);
  const [active, setActive] = useState('Overview');
  const [query, setQuery] = useState('');
  const [inventory, setInventory] = useState(fallbackInventory);
  const [testDriveInventory, setTestDriveInventory] = useState(fallbackTestDriveInventory);
  const [secondHandInventory, setSecondHandInventory] = useState(fallbackSecondHandInventory);
  const [sales, setSales] = useState(fallbackSales);
  const [rcRecords, setRcRecords] = useState([]);
  const [testDrives, setTestDrives] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [pendingDues, setPendingDues] = useState([]);
  const [showTestDriveModal, setShowTestDriveModal] = useState(false);
  const [showOwnerSettings, setShowOwnerSettings] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [invoiceSale, setInvoiceSale] = useState(null);
  const [toast, setToast] = useState('');
  const [showroomSettings, setShowroomSettings] = useState(null);

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

  function generateBackupCsv() {
    let csv = 'Data Type,Date,Customer Name,Phone,Details,Amount\n';
    sales.forEach(s => csv += `Sale,${new Date(s.sale_date).toLocaleDateString()},"${s.customer_name || ''}","","${s.vehicle_name || ''}",${s.sale_amount}\n`);
    customers.forEach(c => csv += `Customer,${new Date(c.created_at).toLocaleDateString()},"${c.name || ''}","${c.phone || ''}","Kyc added",\n`);
    pendingDues.forEach(d => csv += `Pending Due,${new Date(d.created_at).toLocaleDateString()},"${d.customer_name || ''}","${d.customer_phone || ''}","Status: ${d.status}",${d.amount}\n`);
    return csv;
  }

  useEffect(() => {
    if (!showroomSettings?.auto_backup_enabled || !showroomSettings?.auto_backup_key) return;
    const interval = window.setInterval(async () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      if (currentTime === showroomSettings.auto_backup_time) {
        const lastSent = localStorage.getItem('rideflow_last_auto_backup');
        const todayStr = now.toLocaleDateString();
        if (lastSent !== todayStr) {
          localStorage.setItem('rideflow_last_auto_backup', todayStr);
          try {
            const formData = new FormData();
            formData.append("access_key", showroomSettings.auto_backup_key);
            formData.append("subject", `RideFlow Daily Backup - ${todayStr}`);
            formData.append("message", "Attached is your daily backup for sales, customers, and pending dues.");
            const csv = generateBackupCsv();
            const blob = new Blob([csv], { type: 'text/csv' });
            formData.append("attachment", blob, `RideFlow_Backup_${now.toISOString().slice(0,10)}.csv`);
            await fetch("https://api.web3forms.com/submit", { method: "POST", body: formData });
            console.log("Auto-backup sent successfully.");
          } catch(e) {
            console.error("Auto-backup failed", e);
            localStorage.removeItem('rideflow_last_auto_backup');
          }
        }
      }
    }, 60000); // Check every minute
    return () => window.clearInterval(interval);
  }, [showroomSettings, sales, customers, pendingDues]);

  useEffect(() => {
    if (!session?.user?.id) return;
    let mounted = true;
    async function load() {
      const [{ data: inv }, { data: tdInv }, { data: shInv }, { data: saleRows }, { data: rcRows }, { data: driveRows }, { data: customerRows }, { data: duesRows }, { data: settings }] = await Promise.all([
        supabase.from('inventory').select('*').order('model'),
        supabase.from('test_drive_inventory').select('*').order('model'),
        supabase.from('second_hand_inventory').select('*').order('model'),
        supabase.from('sales').select('*').order('sale_date', { ascending: false }).limit(12),
        supabase.from('rc_records').select('*').order('created_at', { ascending: false }).limit(30),
        supabase.from('test_drives').select('*').order('scheduled_at', { ascending: true }).limit(30),
        supabase.from('customers').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('pending_dues').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('showroom_settings').select('*').eq('id', 1).maybeSingle(),
      ]);
      if (mounted) {
        if (settings) setShowroomSettings(settings);
        if (inv) {
          setInventory(inv);
          const hasHondaOrTvs = inv.some(v => v.brand && (v.brand.toLowerCase() === 'honda' || v.brand.toLowerCase() === 'tvs'));
          if (!hasHondaOrTvs) {
            const seeds = [
              { brand: 'Honda', model: 'Shine 100', variant: 'Standard', cc: 100, color: 'Black with White', ex_showroom_price: 65000, on_road_price: 79000, max_discount: 2000, stock: 12, stock_by_color: [{"color":"Black with White","qty":4},{"color":"Black with Red","qty":4},{"color":"Black with Yellow","qty":2},{"color":"Black with Blue","qty":1},{"color":"Black with Green","qty":1}], image_url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=500&auto=format&fit=crop' },
              { brand: 'Honda', model: 'Shine 100 DX', variant: 'DX', cc: 100, color: 'Black with White', ex_showroom_price: 68000, on_road_price: 82000, max_discount: 2500, stock: 2, stock_by_color: [{"color":"Black with White","qty":1},{"color":"Black with Red","qty":1}], image_url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=500&auto=format&fit=crop' },
              { brand: 'Honda', model: 'SP 125', variant: 'Disc', cc: 125, color: 'Red Full', ex_showroom_price: 90000, on_road_price: 105000, max_discount: 3000, stock: 2, stock_by_color: [{"color":"Red Full","qty":1},{"color":"Blue Full","qty":1}], image_url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500&auto=format&fit=crop' },
              { brand: 'Honda', model: 'Unicorn', variant: 'Standard', cc: 160, color: 'Black', ex_showroom_price: 110000, on_road_price: 130000, max_discount: 4000, stock: 1, stock_by_color: [{"color":"Black","qty":1}], image_url: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=500&auto=format&fit=crop' },
              { brand: 'Honda', model: 'Livo', variant: 'Standard', cc: 110, color: 'Black', ex_showroom_price: 79000, on_road_price: 93000, max_discount: 3000, stock: 1, stock_by_color: [{"color":"Black","qty":1}], image_url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=500&auto=format&fit=crop' },
              { brand: 'Honda', model: 'Activa 125', variant: 'Standard', cc: 125, color: 'Black', ex_showroom_price: 82000, on_road_price: 97000, max_discount: 3000, stock: 1, stock_by_color: [{"color":"Black","qty":1}], image_url: 'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?w=500&auto=format&fit=crop' },
              { brand: 'Honda', model: 'Activa 110', variant: 'Standard', cc: 110, color: 'Black', ex_showroom_price: 77000, on_road_price: 91000, max_discount: 2500, stock: 4, stock_by_color: [{"color":"Black","qty":1},{"color":"Blue","qty":1},{"color":"White","qty":2}], image_url: 'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?w=500&auto=format&fit=crop' },
              { brand: 'TVS', model: 'Star Sport', variant: 'Standard', cc: 110, color: 'Black Red', ex_showroom_price: 65000, on_road_price: 79000, max_discount: 2000, stock: 1, stock_by_color: [{"color":"Black Red","qty":1}], image_url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=500&auto=format&fit=crop' },
              { brand: 'TVS', model: 'Raider 125', variant: 'Disc', cc: 125, color: 'Red', ex_showroom_price: 95000, on_road_price: 110000, max_discount: 3000, stock: 1, stock_by_color: [{"color":"Red","qty":1}], image_url: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=500&auto=format&fit=crop' },
              { brand: 'TVS', model: 'Radeon', variant: 'Standard', cc: 110, color: 'Black', ex_showroom_price: 75000, on_road_price: 89000, max_discount: 2000, stock: 2, stock_by_color: [{"color":"Black","qty":1},{"color":"Green","qty":1}], image_url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=500&auto=format&fit=crop' }
            ];
            supabase.from('inventory').insert(seeds).select().then(({ data, error }) => {
              if (error) console.error("Seeding error:", error);
              if (data) setInventory(current => {
                const uniqueData = data.filter(d => !current.some(c => c.id === d.id));
                return [...current, ...uniqueData];
              });
            });
          }
        }
        if (tdInv) setTestDriveInventory(tdInv);
        if (shInv) {
          setSecondHandInventory(shInv);
          const seen = new Set();
          const toDelete = [];
          for (const row of shInv) {
            const key = `${row.model}-${row.color}-${row.price}`;
            if (seen.has(key)) {
              toDelete.push(row.id);
            } else {
              seen.add(key);
            }
          }
          if (toDelete.length > 0) {
            supabase.from('second_hand_inventory').delete().in('id', toDelete).then(({ error }) => {
              if (!error) {
                setSecondHandInventory(current => current.filter(r => !toDelete.includes(r.id)));
              }
            });
          }
        }
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

  // Auto-sync cleanup for duplicate Honda/TVS bikes
  useEffect(() => {
    async function fixDuplicates() {
      if (!session?.user?.id) return;
      const { data: inv } = await supabase.from('inventory').select('*').in('brand', ['Honda', 'TVS']);
      if (inv && inv.length > 10) {
        const seen = new Set();
        const toDelete = [];
        for (const item of inv) {
          const key = `${item.brand}-${item.model}-${item.variant}`;
          if (seen.has(key)) {
            toDelete.push(item.id);
          } else {
            seen.add(key);
          }
        }
        if (toDelete.length > 0) {
          console.log(`Syncing list... removing ${toDelete.length} duplicates`);
          await supabase.from('inventory').delete().in('id', toDelete);
          window.location.reload();
        }
      }
    }
    fixDuplicates();
  }, [session?.user?.id]);

  const filteredInventory = useMemo(() => inventory.filter(v => `${v.model} ${v.variant} ${v.color}`.toLowerCase().includes(query.toLowerCase())), [inventory, query]);
  const monthlySales = sales.reduce((sum, sale) => sum + Number(sale.sale_amount || 0), 0);
  const stockTotal = inventory.reduce((sum, v) => sum + Number(v.stock || 0), 0) + secondHandInventory.reduce((sum, v) => sum + Number(v.stock || 0), 0);
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
    const discount = vehicle.is_second_hand
      ? Math.min(Number(form.discount || 0), Number(vehicle.price || 0))
      : Math.min(Number(form.discount || 0), Number(vehicle.max_discount || 0));
    const exchangeValue = form.saleType === 'Exchange' ? Math.max(0, Number(form.exchangeValue || 0)) : 0;
    const exchangeDiscount = form.saleType === 'Exchange' ? Math.max(0, Number(form.exchangeDiscount || 0)) : 0;
    const basePrice = vehicle.is_second_hand ? vehicle.price : (vehicle.on_road_price || vehicle.ex_showroom_price);
    const saleAmount = Math.max(0, Number(basePrice) - discount - exchangeValue - exchangeDiscount);
    const kyc = { aadhaar_last4: String(form.aadhaar || '').replace(/\D/g, '').slice(-4), pan_masked: form.pan ? `${String(form.pan).slice(0, 2).toUpperCase()}****${String(form.pan).slice(-2).toUpperCase()}` : '' };
    const { data: customerRow } = await supabase.from('customers').insert({ name: form.customer, phone: form.phone, ...kyc }).select().single();
    let documentPaths = {};
    if (customerRow?.id && session?.user?.id) {
      try {
        const [aadhaar_document_path, aadhaar_back_document_path, pan_document_path] = await Promise.all([
          uploadCustomerDocument(form.aadhaarFrontFile, customerRow.id, 'aadhaar-front', session.user.id),
          uploadCustomerDocument(form.aadhaarBackFile, customerRow.id, 'aadhaar-back', session.user.id),
          uploadCustomerDocument(form.panFile, customerRow.id, 'pan', session.user.id),
        ]);
        documentPaths = { aadhaar_document_path, aadhaar_back_document_path, pan_document_path };
        if (aadhaar_document_path || aadhaar_back_document_path || pan_document_path) await supabase.from('customers').update(documentPaths).eq('id', customerRow.id);
      } catch (documentError) {
        setToast(`Sale save ho rahi hai, lekin document upload fail hua: ${documentError.message}`);
      }
    }
    const sale = { 
      customer_id: customerRow?.id || null, 
      customer_name: form.customer, 
      customer_phone: form.phone, 
      vehicle_id: vehicle.is_second_hand ? null : vehicle.id, 
      vehicle_name: vehicle.is_second_hand 
        ? `${vehicle.model} ${vehicle.variant || ''} (${vehicle.registration_number})`.trim() 
        : `${vehicle.model} ${vehicle.variant || ''}`.trim(), 
      vehicle_color: form.vehicleColor || vehicle.color, 
      original_price: basePrice, 
      discount, 
      sale_amount: saleAmount, 
      payment_status: form.payment, 
      signature_data: form.signature || null, 
      sale_type: form.saleType || 'Sale', 
      old_vehicle_name: form.oldVehicleName || '', 
      old_vehicle_registration: form.oldVehicleRegistration || '', 
      exchange_value: exchangeValue, 
      exchange_discount: exchangeDiscount, 
      emi_amount: form.emiAmount ? Number(form.emiAmount) : null, 
      tenure_months: form.tenureMonths ? Number(form.tenureMonths) : null, 
      amount_paid: form.amountPaid,
      sold_by: profile?.full_name || session?.user?.email || 'Unknown'
    };
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
        setToast(`Sale save ho gayi, lekin number plate photo upload fail hua: ${rcError.message}`);
      }
    }
    const { data: rcRow } = await supabase.from('rc_records').insert({ sale_id: linkedSale.id, customer_name: form.customer, customer_phone: form.phone, vehicle_name: sale.vehicle_name, status: 'Pending' }).select().single();
    
    if (vehicle.is_second_hand) {
      await supabase.from('second_hand_inventory').update({ stock: 0, status: 'Sold' }).eq('id', vehicle.id);
      setSecondHandInventory(current => current.map(item => item.id === vehicle.id ? { ...item, stock: 0, status: 'Sold' } : item));
    } else {
      let newStock = Math.max(0, vehicle.stock - 1);
      let newStockByColor = vehicle.stock_by_color || [];
      if (newStockByColor.length > 0 && form.vehicleColor) {
        newStockByColor = newStockByColor.map(item => item.color === form.vehicleColor ? { ...item, qty: Math.max(0, Number(item.qty) - 1) } : item);
        newStock = newStockByColor.reduce((sum, item) => sum + Number(item.qty || 0), 0);
      }
      await supabase.from('inventory').update({ stock: newStock, stock_by_color: newStockByColor, status: newStock <= 0 ? 'Sold out' : 'Available' }).eq('id', vehicle.id);
      setInventory(current => current.map(item => item.id === vehicle.id ? { ...item, stock: newStock, stock_by_color: newStockByColor } : item));
    }

    setSales(current => [linkedSale, ...current]);
    setCustomers(current => [customerRow || { id: `local-${Date.now()}`, name: form.customer, phone: form.phone, ...kyc, created_at: new Date().toISOString(), last_vehicle: sale.vehicle_name, last_amount: saleAmount }, ...current]);
    setRcRecords(current => [rcRow || { id: Date.now(), sale_id: linkedSale.id, customer_name: form.customer, vehicle_name: sale.vehicle_name, status: 'Pending', created_at: new Date().toISOString() }, ...current]);
    
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
    const csv = generateBackupCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `RideFlow_Backup_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setToast('Backup downloaded successfully.');
  }

  async function downloadInventory() {
    let csv = 'Brand,Model,Variant,CC,Color,Stock,Ex-Showroom Price,On-Road Price\n';
    inventory.forEach(v => {
      csv += `"${v.brand || 'Hero'}","${v.model}","${v.variant}",${v.cc || 0},"${v.color || ''}",${v.stock || 0},${v.ex_showroom_price || 0},${v.on_road_price || 0}\n`;
    });
    secondHandInventory.forEach(v => {
      csv += `"Pre-owned","${v.model}","","","${v.color || ''}",${v.stock || 0},${v.price || 0},${v.price || 0}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `RideFlow_Inventory_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setToast('Inventory downloaded successfully.');
  }

  if (session === undefined) return <div className="auth-loading"/>;
  if (!session) return <AuthScreen />;
  const isOwner = profile?.role === 'owner';
  const nav = [
    { label: 'Overview', icon: 'grid' }, 
    { label: 'Inventory', icon: 'bike' }, 
    { label: 'Other bikes', icon: 'box', count: inventory.filter(v => (v.brand && v.brand.toLowerCase() !== 'hero') && Number(v.stock) > 0).length || undefined },
    { label: 'Second hand', icon: 'refresh', count: secondHandInventory.filter(v => Number(v.stock) > 0).length || undefined }, 
    { label: 'Sales', icon: 'tag', count: sales.length || undefined }, 
    { label: 'Test drives', icon: 'key', count: testDrives.filter(t => t.status !== 'Completed').length || undefined }, 
    { label: 'Number plate', icon: 'file', count: rcRecords.filter(r => r.status !== 'Completed').length || undefined }, 
    { label: 'Customers', icon: 'users', count: visibleCustomers?.length || undefined }, 
    { label: 'Pending dues', icon: 'file', count: pendingDues.filter(d => d.status === 'Pending').length || undefined }, 
    { label: 'EMI calculator', icon: 'calc' }
  ];
  const visibleNav = nav;
  const globalOwnerSignature = showroomSettings?.owner_signature || localStorage.getItem('rideflow_owner_signature') || '';
  return <div className="app-shell"><aside className="sidebar"><div className="brand"><div className="brand-mark">R</div><div><strong>rideflow</strong><span>SHOWROOM OS</span></div></div><div className="branch-select"><span className="online-dot"/> Hero MotoCorp <b>·</b> Churcha <Icon name="arrow" size={13}/></div><nav>{visibleNav.map(item => <button key={item.label} className={active === item.label ? 'nav-item active' : 'nav-item'} onClick={() => setActive(item.label)}><Icon name={item.icon}/><span>{item.label}</span>{item.count && <em>{item.count}</em>}</button>)}</nav><div className="sidebar-bottom"><div className="sync"><span className="pulse"/><div><b>Supabase synced</b><small>{isOwner ? 'Owner access · Secure' : 'Staff access · Limited'}</small></div></div><button className="user-row" onClick={() => isOwner ? setShowOwnerSettings(true) : supabase.auth.signOut()}><div className="avatar me">{(profile?.full_name || session.user.email || 'NK').slice(0,2).toUpperCase()}</div><div><b>{profile?.full_name || session.user.email}</b><small>{isOwner ? 'Showroom owner (Settings)' : 'Showroom staff · Sign out'}</small></div><Icon name="dots" size={16}/></button></div></aside>
    <main className="main-content"><header className="topbar"><div className="breadcrumb"><div className="topbar-brand"><img src="/hero.png" alt="Hero MotoCorp" style={{height:'56px', width:'auto', objectFit:'contain'}}/></div></div><div className="top-actions"><label className="search"><Icon name="search" size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search vehicles, customers..."/></label><button className="icon-button" onClick={() => { setToast('No new notifications'); setTimeout(() => setToast(''), 3000); }}><Icon name="bell"/></button><button className="primary-button" onClick={() => setActive('Inventory')}><Icon name="plus" size={17}/> New sale</button><button className="icon-button mobile-only" onClick={() => isOwner ? setShowOwnerSettings(true) : supabase.auth.signOut()}><Icon name="users"/></button></div></header><div className="content-wrap"><section className="page-heading"><div><p className="eyebrow">{dashboardDateLabel(clock)} <span className="live"><i/> LIVE</span></p><h1>{active === 'Overview' ? `${greetingForHour(clock.getHours())}, ${profile?.full_name ? profile.full_name.split(' ')[0] : (session?.user?.email ? session.user.email.split('@')[0] : 'User')}.` : active}</h1><p className="subcopy">{active === 'Overview' ? 'Your showroom numbers, inventory and follow-ups in one view.' : active === 'Inventory' ? 'Show customers every available Hero bike, price and offer limit.' : active === 'Other bikes' ? 'Show customers other brand bikes (Honda, TVS, etc.) in stock.' : active === 'Second hand' ? 'Manage pre-owned bikes, buyback from customers and sell them.' : `Manage your ${active.toLowerCase()} records from one place.`}</p></div><button className="date-button"><Icon name="calendar" size={16}/> Supabase live <span className="live-dot"/></button></section>
      {active === 'Overview' ? <Overview isOwner={isOwner} sales={filteredSales} inventory={inventory} secondHandInventory={secondHandInventory} monthlySales={monthlySales} stockTotal={stockTotal} rcRecords={filteredRcRecords} setActive={setActive} onDownloadBackup={downloadBackup} />
      : active === 'Inventory' ? selectedModel ? <VehicleDetail vehicle={selectedModel} onBack={() => setSelectedModel(null)} onSell={() => setSelectedVehicle(selectedModel)} /> : <Inventory isOwner={isOwner} vehicles={filteredInventory.filter(v => !v.brand || v.brand.toLowerCase() === 'hero')} onSell={setSelectedVehicle} onDetails={setSelectedModel} onManage={() => setActive('Inventory management')} onDownload={downloadInventory} />
      : active === 'Other bikes' ? selectedModel ? <VehicleDetail vehicle={selectedModel} onBack={() => setSelectedModel(null)} onSell={() => setSelectedVehicle(selectedModel)} /> : <Inventory isOwner={isOwner} vehicles={filteredInventory.filter(v => v.brand && v.brand.toLowerCase() !== 'hero')} onSell={setSelectedVehicle} onDetails={setSelectedModel} onManage={() => setActive('Inventory management')} onDownload={downloadInventory} />
      : active === 'Second hand' ? <SecondHandInventoryWorkspace vehicles={secondHandInventory} onChange={setSecondHandInventory} onSell={setSelectedVehicle} onToast={setToast} />
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
            setToast('Is sale ka number plate Supabase mein create karne ke liye setup.sql policies run karo.');
            setTimeout(() => setToast(''), 4000);
            return;
          }
          const { error } = await supabase.from('rc_records').update({ status, ...(status === 'Completed' ? { completed_at: new Date().toISOString() } : {}) }).eq('id', record.id);
          if (!error) {
            setRcRecords(current => current.map(item => item.id === record.id ? { ...item, status } : item));
            setToast(`Number plate status updated: ${status}`);
            setTimeout(() => setToast(''), 5000);
          }
        }} />
      : active === 'Customers' ? <Customers records={filteredVisibleCustomers} drives={filteredTestDrives} setToast={setToast} />
      : active === 'Sales' ? <SalesWorkspace isOwner={isOwner} sales={filteredSales} customers={filteredVisibleCustomers} userId={session.user.id} onChange={setSales} onToast={setToast} />
      : active === 'Test ride inventory' ? <TestRideInventoryWorkspace vehicles={testDriveInventory} onChange={setTestDriveInventory} onToast={setToast} />
      : active === 'EMI calculator' ? <EMIWorkspace defaultAmount={inventory[0]?.on_road_price || 100000} />
      : active === 'Pending dues' ? <PendingDuesWorkspace dues={filteredPendingDues} onChange={setPendingDues} onToast={setToast} />
      : active === 'Inventory management' ? <InventoryManagementWorkspace inventory={filteredInventory} onChange={setInventory} onToast={setToast} /> : <section className="placeholder-panel panel"><div className="empty-icon"><Icon name="chart" size={27}/></div><h2>{active} workspace ready</h2><p>Database connected. Is module ka next workflow yahan manage hoga.</p><button className="primary-button" onClick={() => setActive('Inventory')}><Icon name="bike" size={17}/> Open inventory</button></section>}
    </div></main>
    {selectedVehicle && <SaleModal vehicle={selectedVehicle} onClose={() => setSelectedVehicle(null)} onSave={completeSale} />}
    {invoiceSale && <InvoiceModal record={invoiceSale} onClose={() => setInvoiceSale(null)} />}
    {showTestDriveModal && <TestDriveModal vehicles={testDriveInventory} onClose={() => setShowTestDriveModal(false)} onSave={saveTestDrive} />}
    {showOwnerSettings && <OwnerSettingsModal currentSettings={showroomSettings} currentSignature={globalOwnerSignature} onClose={() => setShowOwnerSettings(false)} onSignOut={() => supabase.auth.signOut()} onSettingsSaved={(newSettings) => setShowroomSettings({ ...showroomSettings, ...newSettings })} />}
    {toast && <div className="toast"><Icon name="check" size={16}/>{toast}</div>}
  );
}

function Overview({ isOwner, sales, inventory, secondHandInventory, monthlySales, stockTotal, rcRecords, setActive, onDownloadBackup }) {
  const pendingRcCount = rcRecords?.filter(r => r.status !== 'Completed').length || 0;
  return <><section className="metrics">{isOwner && <Metric label="MONTHLY SALES" value={money(monthlySales)} delta="LIVE" foot="this month" accent="red"/>}<Metric label="UNITS SOLD" value={sales.length} delta="SYNCED" foot="sales records"/><Metric label="AVAILABLE STOCK" value={stockTotal} delta="LIVE" foot="bikes in inventory"/><Metric label="NUMBER PLATE PENDING" value={pendingRcCount.toString().padStart(2, '0')} delta={`${pendingRcCount} pending`} foot="needs attention" accent="amber"/></section><section className="workspace-grid"><div className="panel sales-panel"><div className="panel-head"><div><p className="eyebrow">CONNECTED DATA</p><h2>Latest sales</h2></div><button className="text-button" onClick={() => setActive('Sales')}>View all <Icon name="arrow" size={15}/></button></div><div className="table-head"><span>Customer</span><span>Vehicle</span>{isOwner && <span>Sale value</span>}<span>Updated</span><span>Status</span><span></span></div>{sales.slice(0, 5).map((s, i) => <div className="sale-row" key={s.id || i}><div className="customer"><div className="avatar" style={{background:['#e8d4ce','#dce3d3','#d9dcea','#e8e0cc'][i % 4]}}>{String(s.customer_name || 'NK').split(' ').map(x => x[0]).join('').slice(0,2)}</div><b>{s.customer_name}</b></div><span className="vehicle-highlight"><b>{s.vehicle_name || 'Vehicle not added'}</b></span>{isOwner && <b>{money(s.sale_amount)}</b>}<span className="muted">{dateLabel(s.sale_date)}</span><span className={s.sale_type === 'Return' ? 'status danger' : s.sale_type === 'Exchange' ? 'status info' : s.payment_status === 'Paid' ? 'status success' : 'status warning'}><i/>{s.sale_type || (s.payment_status === 'Paid' ? 'Paid' : 'Number plate pending')}</span><button className="row-dots" title="Open sales actions" aria-label={`Open actions for ${s.vehicle_name || 'sale'}`} onClick={() => setActive('Sales')}><Icon name="dots" size={16}/></button></div>)}</div><div className="side-stack"><div className="panel follow-panel"><div className="panel-head"><div><p className="eyebrow">INVENTORY SIGNAL</p><h2>Stock watch</h2></div><span className="count-badge">{inventory.filter(v => v.stock <= 2).length}</span></div><div className="follow-list">{inventory.filter(v => v.stock <= 2).map(v => <div className="follow-item" key={v.id}><div className="avatar small">{v.model.slice(0,2).toUpperCase()}</div><div className="follow-copy"><b>{v.model}</b><span>{v.variant} · {v.stock} left</span></div><div className="follow-tag today">Low stock</div></div>)}</div><button className="outline-button" onClick={() => setActive('Inventory')}>Open inventory <Icon name="arrow" size={15}/></button></div><div className="panel follow-panel"><div className="panel-head"><div><p className="eyebrow">PRE-OWNED BIKES</p><h2>Second hand</h2></div><span className="count-badge">{secondHandInventory.filter(v => Number(v.stock || 0) > 0).length}</span></div><div className="follow-list">{secondHandInventory.filter(v => Number(v.stock || 0) > 0).slice(0, 3).map(v => <div className="follow-item" key={v.id}><div className="avatar small">{v.model.slice(0,2).toUpperCase()}</div><div className="follow-copy"><b>{v.model}</b><span>{money(v.price)} · {v.stock} left</span></div><div className="follow-tag">Available</div></div>)}</div><button className="outline-button" onClick={() => setActive('Second hand')}>View all pre-owned <Icon name="arrow" size={15}/></button></div>{isOwner && <div className="panel quick-panel"><div className="quick-glyph"><Icon name="bike" size={20}/></div><div><p className="eyebrow">INVENTORY VALUE</p><h2>{money(inventory.reduce((sum, v) => sum + (v.on_road_price || 0) * (v.stock || 0), 0) + secondHandInventory.reduce((sum, v) => sum + (v.price || 0) * (v.stock || 0), 0))}</h2><span>{stockTotal} units currently available</span></div></div>}<div className="panel quick-panel" style={{cursor: 'pointer'}} onClick={onDownloadBackup}><div className="quick-glyph" style={{background: '#e2efe1', color: '#528d5f'}}><Icon name="file" size={20}/></div><div><p className="eyebrow">DATA EXPORT</p><h2 style={{fontSize: '18px', fontWeight: '600', letterSpacing: '-0.02em', margin: '4px 0 2px'}}>Download Backup</h2><span style={{fontSize: '13px', color: '#657487'}}>Export sales, customers & dues as CSV</span></div></div></div></section></>;
}

function EMICalculator({ defaultAmount }) {
  const [price, setPrice] = useState(defaultAmount); const [downPayment, setDownPayment] = useState(Math.round(defaultAmount * 0.2)); const [rate, setRate] = useState(11.5); const [months, setMonths] = useState(36);
  const principal = Math.max(0, Number(price) - Number(downPayment)); const monthlyRate = Number(rate) / 1200; const emi = monthlyRate ? principal * monthlyRate * (1 + monthlyRate) ** months / ((1 + monthlyRate) ** months - 1) : principal / months; const totalPayable = emi * months; const interest = Math.max(0, totalPayable - principal);
  return <section className="emi-panel panel"><div className="emi-copy"><p className="eyebrow">CUSTOMER TOOL</p><h2>Monthly EMI estimate</h2><p>Customer ko on-road price aur finance plan instantly samjhao.</p><div className="emi-result"><small>ESTIMATED MONTHLY EMI</small><strong>{money(Math.round(emi))}</strong><span>{months} months · {rate}% annual interest</span></div></div><div className="emi-form"><label>On-road price<input type="number" value={price} onChange={e => setPrice(e.target.value)}/></label><label>Down payment<input type="number" value={downPayment} onChange={e => setDownPayment(e.target.value)}/></label><label>Interest rate <span>{rate}%</span><input type="range" min="7" max="20" step="0.5" value={rate} onChange={e => setRate(e.target.value)}/></label><label>Tenure <span>{months} months</span><input type="range" min="12" max="84" step="12" value={months} onChange={e => setMonths(e.target.value)}/></label><div className="emi-breakdown"><span>Loan amount <b>{money(principal)}</b></span><span>Total interest <b>{money(Math.round(interest))}</b></span></div></div></section>;
}

function EMIWorkspace({ defaultAmount }) {
  return <section className="emi-workspace"><div className="emi-workspace-heading"><div><p className="eyebrow">CUSTOMER TOOL</p><h2>Finance desk</h2><p>Customer ke saamne bike ka monthly plan instantly calculate karo.</p></div><div className="emi-use-note"><span>LIVE CALCULATION</span><b>Adjust inputs → share estimate</b></div></div><EMICalculator defaultAmount={defaultAmount} /></section>;
}

function Inventory({ isOwner, vehicles, onSell, onDetails, onManage, onDownload }) {
  const [category, setCategory] = useState('all');
  const getCc = vehicle => Number(vehicle.cc || ({ 'Splendor+': 100, 'Pleasure+': 110, 'Xtreme 125R': 125, 'Glamour': 125, 'Xtreme 160R': 160, 'Maverick 440': 440 }[vehicle.model] || 0));
  const categories = [{ id: 'all', label: 'All bikes', detail: 'Every model' }, { id: 'commuter', label: '100–125 cc', detail: 'City & daily use' }, { id: 'premium', label: '150–200 cc', detail: 'Performance bikes' }, { id: 'big', label: '400 cc+', detail: 'Premium touring' }];
  const visible = vehicles.filter(vehicle => category === 'all' || category === 'commuter' && getCc(vehicle) >= 100 && getCc(vehicle) <= 125 || category === 'premium' && getCc(vehicle) >= 150 && getCc(vehicle) <= 200 || category === 'big' && getCc(vehicle) >= 400);
  return <section className="inventory-layout"><div className="inventory-toolbar"><div><p className="eyebrow">CUSTOMER VIEW · FILTER BY ENGINE</p><h2>{categories.find(item => item.id === category)?.label}</h2></div><div className="inventory-actions-wrap" style={{display: 'flex', alignItems: 'center', gap: '16px'}}><div className="inventory-count">{visible.length} models · {visible.reduce((sum, v) => sum + Number(v.stock || 0), 0)} units</div><button className="outline-button" style={{margin: 0}} onClick={onDownload}><Icon name="file" size={14}/> Download CSV</button>{isOwner && <button className="outline-button" style={{margin: 0}} onClick={onManage}><Icon name="grid" size={14}/> Manage stock</button>}</div></div><div className="cc-tabs">{categories.map((item, index) => <button key={item.id} className={`cc-tab cc-tab-${item.id} ${category === item.id ? 'active' : ''}`} onClick={() => setCategory(item.id)}><span className="cc-tab-index">0{index + 1}</span><b>{item.label}</b><span>{item.detail}</span></button>)}</div><div className="inventory-grid">{visible.map(vehicle => <article className="inventory-card" key={vehicle.id} onClick={() => onDetails(vehicle)}><div className="bike-visual"><div className="bike-badge">{getCc(vehicle)} CC · {(vehicle.brand || 'Hero').toUpperCase()}</div>{vehicle.image_url ? <img src={vehicle.image_url} style={{width:'100%', height:'100%', objectFit:'cover'}} alt=""/> : <Icon name="bike" size={56}/>}<span>{vehicle.color}</span><em className="view-detail-hint">View details <Icon name="arrow" size={12}/></em></div><div className="inventory-card-body"><div className="inventory-card-top"><div><h3>{vehicle.model}</h3><p>{vehicle.variant} · {getCc(vehicle)} cc</p></div><span className={vehicle.stock <= 2 ? 'stock-chip low' : 'stock-chip'}><i/>{vehicle.stock} in stock</span></div><div className="price-line"><div><small>ON-ROAD PRICE</small><strong>{money(vehicle.on_road_price || vehicle.ex_showroom_price)}</strong></div></div><div className="inventory-footer"><span>Ex-showroom {money(vehicle.ex_showroom_price)}</span><button className="sell-button" disabled={!vehicle.stock} onClick={e => { e.stopPropagation(); onSell(vehicle); }}>{vehicle.stock ? 'Sell this bike' : 'Sold out'} <Icon name="arrow" size={15}/></button></div></div></article>)}</div></section>;
}

function VehicleDetail({ vehicle, onBack, onSell }) {
  const cc = Number(vehicle.cc || ({ 'Splendor+': 100, 'Pleasure+': 110, 'Xtreme 125R': 125, 'Glamour': 125, 'Xtreme 160R': 160, 'Maverick 440': 440 }[vehicle.model] || 0));
  const colors = vehicle.available_colors || ({ 'Splendor+': ['Black', 'Silver', 'Blue'], 'Pleasure+': ['Pearl White', 'Matte Grey', 'Red'], 'Xtreme 125R': ['Matte Red', 'Black', 'Blue'], 'Glamour': ['Candy Red', 'Black', 'Grey'], 'Xtreme 160R': ['Sports Red', 'Stealth Black', 'Grey'], 'Maverick 440': ['Phantom Black', 'Stone Grey', 'Red'] }[vehicle.model] || [vehicle.color]);
  return <section className="vehicle-detail"><button className="back-link" onClick={onBack}>← Back to inventory</button><div className="vehicle-detail-grid"><div className="vehicle-hero"><span className="bike-badge">{cc} CC · {(vehicle.brand || 'Hero').toUpperCase()}</span>{vehicle.image_url ? <img src={vehicle.image_url} style={{width:'100%', height:'280px', objectFit:'contain', padding:'10px'}} alt=""/> : <Icon name="bike" size={130}/>}<small>{vehicle.color}</small></div><div className="vehicle-info"><p className="eyebrow">MODEL DETAILS</p><h2>{vehicle.model}</h2><p className="vehicle-variant">{vehicle.variant} · {cc} cc</p><div className="vehicle-price"><small>ON-ROAD PRICE</small><strong>{money(vehicle.on_road_price || vehicle.ex_showroom_price)}</strong><span>Ex-showroom {money(vehicle.ex_showroom_price)}</span></div><div className="vehicle-actions"><button className="primary-button" disabled={!vehicle.stock} onClick={onSell}>{vehicle.stock ? 'Start sale' : 'Sold out'} <Icon name="arrow" size={15}/></button><span className={vehicle.stock <= 2 ? 'stock-chip low' : 'stock-chip'}><i/>{vehicle.stock} units available</span></div></div></div><div className="vehicle-detail-lower"><div className="detail-section"><p className="eyebrow">AVAILABLE COLOURS</p><h3>Choose a finish for the customer</h3><div className="color-list">{colors.map((color, index) => <span key={color}><i style={{background:['#212121','#bfc1c4','#b44538','#657487','#8f8f87'][index % 5]}}/>{color}</span>)}</div></div><div className="detail-section"><p className="eyebrow">FINANCE SNAPSHOT</p><h3>Starting EMI</h3><div className="detail-number">{money(Math.round(((Number(vehicle.on_road_price || vehicle.ex_showroom_price) * .8) * .115 / 12 * (1 + .115 / 12) ** 36) / ((1 + .115 / 12) ** 36 - 1)))}</div><span className="detail-note">20% down · 11.5% · 36 months</span></div></div></section>;
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

function Customers({ records, drives, setToast }) {
  const [tab, setTab] = useState('Sales');
  
  const uniqueDrivesMap = new Map();
  drives.forEach(d => {
    const key = `${(d.customer_name || '').toLowerCase().replace(/\s+/g, '')}-${(d.phone || '').replace(/\s+/g, '')}`;
    if (!uniqueDrivesMap.has(key)) {
      uniqueDrivesMap.set(key, d);
    }
  });
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
      records.length ? <div className="panel customer-table"><div className="table-head customer-table-head"><span>Customer</span><span>Phone</span><span>KYC</span><span>Last vehicle</span><span>Last amount</span><span>Added</span></div>{records.map((record, index) => <div className="customer-row" key={record.id || index}><div className="customer"><div className="avatar" style={{background:['#e8d4ce','#dce3d3','#d9dcea','#e8e0cc'][index % 4]}}>{String(record.name || 'NK').split(' ').map(x => x[0]).join('').slice(0,2)}</div><b>{record.name}</b></div><span className="muted">{record.phone || 'No phone added'}</span><span className="kyc-cell">A •••• {record.aadhaar_last4 || '—'} {record.aadhaar_document_path && <button className="text-button" style={{padding:0, marginLeft: '6px'}} title="View Aadhaar Front" onClick={(e) => downloadDocument(record.aadhaar_document_path, setToast)}><Icon name="file" size={13}/></button>}{record.aadhaar_back_document_path && <button className="text-button" style={{padding:0, marginLeft: '6px'}} title="View Aadhaar Back" onClick={(e) => downloadDocument(record.aadhaar_back_document_path, setToast)}><Icon name="file" size={13}/></button>}<br/>P {record.pan_masked || '—'} {record.pan_document_path && <button className="text-button" style={{padding:0, marginLeft: '6px'}} title="View PAN" onClick={(e) => downloadDocument(record.pan_document_path, setToast)}><Icon name="file" size={13}/></button>}</span><span className="muted">{record.last_vehicle || 'Sale record linked'}</span><b>{record.last_amount ? money(record.last_amount) : '—'}</b><span className="muted">{dateLabel(record.created_at)}</span></div>)}</div> : <div className="panel placeholder-panel"><div className="empty-icon"><Icon name="users" size={27}/></div><h2>No customers yet</h2><p>Inventory se sale karte hi customer yahan automatically sync hoga.</p></div>
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



function SalesWorkspace({ isOwner, sales, customers, userId, onChange, onToast }) {
  const [tab, setTab] = useState('Cash');
  const [selectedSale, setSelectedSale] = useState(null);
  const [invoiceSale, setInvoiceSale] = useState(null);
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
  return <section className="sales-workspace"><div className="sales-workspace-head"><div><p className="eyebrow">CONNECTED SALES</p><h2>{tab === 'Finance' ? 'Finance desk' : tab === 'Pending' ? 'Pending payments' : 'Cash sales'}</h2><p>{tab === 'Finance' ? 'All financed vehicles stored separately.' : tab === 'Pending' ? 'Track un-cleared payments here.' : 'Edit returns, exchanges, discounts and RC records from here.'}</p></div><div className="workspace-tabs-group"><div className="workspace-tabs"><button className={tab === 'Cash' ? 'active' : ''} onClick={() => setTab('Cash')}>Cash sales</button><button className={tab === 'Finance' ? 'active' : ''} onClick={() => setTab('Finance')}>Finance</button><button className={tab === 'Pending' ? 'active' : ''} onClick={() => setTab('Pending')}>Pending</button></div><span className="inventory-count">{visibleSales.length} records</span></div></div>{visibleSales.length ? <div className="panel sales-records"><div className="table-head sales-record-head"><span>Customer</span><span>Vehicle</span><span>Sale value</span><span>Date</span><span>Payment</span><span></span></div>{visibleSales.map((sale, index) => <div className="sales-record-row" key={sale.id || index}><div className="customer"><div className="avatar" style={{background:['#e8d4ce','#dce3d3','#d9dcea','#e8e0cc'][index % 4]}}>{String(sale.customer_name || 'NK').split(' ').map(x => x[0]).join('').slice(0,2)}</div><div><b>{sale.customer_name}</b><small>{sale.customer_phone || 'No phone added'}</small></div></div><span className="vehicle-highlight"><b>{sale.vehicle_name || 'Vehicle not added'}</b></span><strong>{money(sale.sale_amount)}</strong><span className="muted">{dateLabel(sale.sale_date)}</span><span className={sale.sale_type === 'Return' ? 'status danger' : sale.sale_type === 'Exchange' ? 'status info' : sale.payment_status === 'Paid' ? 'status success' : 'status warning'}><i/>{sale.sale_type || sale.payment_status || 'Pending'}</span><div className="sale-row-actions">{tab === 'Pending' && <button className="outline-button" style={{padding: '5px 10px', margin: 0, width: 'auto'}} onClick={() => promptClearPayment(sale)}>Clear Payment</button>}<button className="text-button" onClick={() => setSelectedSale(sale)}>View</button><button className="text-button" onClick={() => setEditingSale(sale)}>Edit</button></div></div>)}</div> : <div className="panel placeholder-panel"><div className="empty-icon"><Icon name="chart" size={27}/></div><h2>No sales yet</h2><p>Inventory se sale save karte hi yahan sync ho jayegi.</p></div>}{selectedSale && <CustomerDetailModal isOwner={isOwner} sale={selectedSale} customer={customers?.find(c => `${(c.name || '').toLowerCase().replace(/\s+/g, '')}-${(c.phone || '').replace(/\s+/g, '')}` === `${(selectedSale?.customer_name || '').toLowerCase().replace(/\s+/g, '')}-${(selectedSale?.customer_phone || '').replace(/\s+/g, '')}`)} onClose={() => setSelectedSale(null)} onInvoice={(sale, cust) => { setSelectedSale(null); setInvoiceSale({ sale, vehicle: { model: sale.vehicle_name, variant: '', cc: '', color: sale.vehicle_color || '', on_road_price: (sale.sale_amount || 0) + (sale.discount || 0) }, customer: cust || { name: sale.customer_name, phone: sale.customer_phone || '', aadhaar_last4: '', pan_masked: '' }, saleAmount: sale.sale_amount, discount: sale.discount || 0, signature: '' }); }} />}{invoiceSale && <InvoiceModal record={invoiceSale} onClose={() => setInvoiceSale(null)} />}{editingSale && <SaleEditModal sale={editingSale} onClose={() => setEditingSale(null)} onSave={saveSaleUpdate} />}{confirmClear && <ConfirmModal message={<>Is <b>{confirmClear.customer_name}</b> ka pending <b>{money(Math.max(0, confirmClear.sale_amount - (confirmClear.amount_paid || 0)))}</b> clear ho gaya hai? Is action ko undo nahi kiya ja sakta.</>} confirmText="Yes, clear payment" onConfirm={proceedClearPayment} onCancel={() => setConfirmClear(null)} />}</section>;
}

function SaleEditModal({ sale, onClose, onSave }) {
  const [form, setForm] = useState({ customerName: sale.customer_name || '', phone: sale.customer_phone || '', vehicleName: sale.vehicle_name || '', saleAmount: sale.sale_amount || 0, discount: sale.discount || 0, paymentStatus: sale.payment_status || 'Pending', saleType: sale.sale_type || 'Sale', oldVehicleName: sale.old_vehicle_name || '', oldVehicleRegistration: sale.old_vehicle_registration || '', exchangeDiscount: sale.exchange_discount || 0, rcPhoto: null, emiAmount: sale.emi_amount || '', tenureMonths: sale.tenure_months || '', amountPaid: sale.amount_paid || 0 });
  const [busy, setBusy] = useState(false);
  const update = (key, value) => setForm(current => ({ ...current, [key]: value }));
  async function submit(event) { event.preventDefault(); setBusy(true); await onSave(form); setBusy(false); }
  const needsExchange = form.saleType === 'Exchange';
  return <div className="modal-backdrop" onClick={onClose}><form className="modal sale-edit-modal" onClick={event => event.stopPropagation()} onSubmit={submit}><div className="modal-head"><div><p className="eyebrow">EDIT SALE · #{sale.id}</p><h2>Update sale record</h2></div><button type="button" className="close" onClick={onClose}>×</button></div><div className="form-grid"><label>Customer name<input value={form.customerName} onChange={event => update('customerName', event.target.value)} required/></label><label>Phone number<input value={form.phone} onChange={event => update('phone', event.target.value)}/></label><label>Current vehicle<input value={form.vehicleName} onChange={event => update('vehicleName', event.target.value)} required/></label><label>Sale amount<input type="number" min="0" value={form.saleAmount} onChange={event => update('saleAmount', event.target.value)} required/></label><label>Discount<input type="number" min="0" value={form.discount} onChange={event => update('discount', event.target.value)}/></label><label>Amount paid (Advance)<input type="number" min="0" value={form.amountPaid} onChange={event => update('amountPaid', event.target.value)}/></label><label>Payment status<select value={form.paymentStatus} onChange={event => update('paymentStatus', event.target.value)}><option>Pending</option><option>Paid</option><option>Finance</option></select></label>{form.paymentStatus === 'Finance' && <><label>EMI Amount<input type="number" min="0" value={form.emiAmount} onChange={e => update('emiAmount', e.target.value)} placeholder="e.g. 3500"/></label><label>Tenure (Months)<input type="number" min="0" value={form.tenureMonths} onChange={e => update('tenureMonths', e.target.value)} placeholder="e.g. 24"/></label></>}<label>Record type<select value={form.saleType} onChange={event => update('saleType', event.target.value)}><option>Sale</option><option>Return</option><option>Exchange</option></select></label>{needsExchange && <><label>Old bike model/name<input value={form.oldVehicleName} onChange={event => update('oldVehicleName', event.target.value)} placeholder="e.g. Splendor+ 2019" required/></label><label>Old bike registration number<input value={form.oldVehicleRegistration} onChange={event => update('oldVehicleRegistration', event.target.value)} placeholder="MH01AB1234" required/></label><label>Exchange discount<input type="number" min="0" value={form.exchangeDiscount} onChange={event => update('exchangeDiscount', event.target.value)}/></label><label>Upload old bike RC photo<input type="file" accept="image/*,.pdf" onChange={event => update('rcPhoto', event.target.files?.[0] || null)}/><small className="hint">Private Supabase storage</small></label></>}</div><div className="modal-foot"><button type="button" className="ghost-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={busy} type="submit">{busy ? 'Saving…' : 'Save changes'}</button></div></form></div>;
}



async function downloadDocument(path, setToast) {
  try {
    const { data, error } = await supabase.storage.from('customer-documents').createSignedUrl(path, 60);
    if (error) throw error;
    window.open(data.signedUrl, '_blank');
  } catch (err) {
    console.error(err);
    setToast?.('Could not open document.');
  }
}

function CustomerDetailModal({ isOwner, sale, customer, onClose, onInvoice, setToast }) {
  return <div className="modal-backdrop" onClick={onClose}><div className="modal customer-detail-modal" onClick={event => event.stopPropagation()}><div className="modal-head"><div><p className="eyebrow">CUSTOMER PROFILE</p><h2>{sale.customer_name}</h2></div><button className="close" onClick={onClose}>×</button></div><div className="customer-detail-grid"><div><small>PHONE NUMBER</small><strong>{sale.customer_phone || 'Not added'}</strong></div><div className="vehicle-detail-highlight"><small>VEHICLE</small><strong>{sale.vehicle_name || 'Not added'}</strong></div><div><small>SALE VALUE</small><strong>{money(sale.sale_amount)}</strong></div>{sale.payment_status !== 'Paid' && <div><small>AMOUNT PAID</small><strong>{money(sale.amount_paid || 0)}</strong></div>}{sale.payment_status !== 'Paid' && <div><small>AMOUNT PENDING</small><strong style={{ color: '#d32f2f' }}>{money(Math.max(0, sale.sale_amount - (sale.amount_paid || 0)))}</strong></div>}<div><small>PAYMENT STATUS</small><strong>{sale.payment_status || 'Pending'}</strong></div>{sale.payment_status === 'Finance' && <div><small>EMI & TENURE</small><strong>{sale.emi_amount ? `${money(sale.emi_amount)} / ${sale.tenure_months}m` : 'Not recorded'}</strong></div>}<div><small>SALE DATE</small><strong>{dateLabel(sale.sale_date)}</strong></div><div><small>SALE ID</small><strong>#{sale.id}</strong></div><div><small>SOLD BY</small><strong>{sale.sold_by || 'Unknown'}</strong></div></div><div className="customer-detail-note"><span>KYC documents</span><b>Stored privately in Supabase</b><small>Aadhaar/PAN are masked in the UI. Authorized staff can access uploaded documents from the customer record.</small>{isOwner && <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>{customer?.pan_document_path && <button className="outline-button" onClick={() => downloadDocument(customer.pan_document_path, setToast)} style={{ padding: '4px 8px', fontSize: 11, margin: 0 }}>View PAN</button>}{customer?.aadhaar_document_path && <button className="outline-button" onClick={() => downloadDocument(customer.aadhaar_document_path, setToast)} style={{ padding: '4px 8px', fontSize: 11, margin: 0 }}>View Aadhaar (Front)</button>}{customer?.aadhaar_back_document_path && <button className="outline-button" onClick={() => downloadDocument(customer.aadhaar_back_document_path, setToast)} style={{ padding: '4px 8px', fontSize: 11, margin: 0 }}>View Aadhaar (Back)</button>}</div>}</div><div className="modal-foot"><button className="ghost-button" onClick={() => onInvoice?.(sale, customer)}><Icon name="file" size={15}/> View Invoice</button><button className="primary-button" onClick={onClose}>Done</button></div></div></div>;
}

function InventoryManagementWorkspace({ inventory, onChange, onToast }) {
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [editingStockByColor, setEditingStockByColor] = useState([]);
  const [busy, setBusy] = useState(false);

  function openAdd() {
    setEditing({ brand: 'Hero', model: '', variant: '', cc: '', color: '', ex_showroom_price: '', on_road_price: '', max_discount: '', stock: 1, file: null });
    setEditingStockByColor([]);
  }

  function openEdit(vehicle) {
    setEditing({ brand: 'Hero', ...vehicle, file: null });
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
    const hasColorVariants = editingStockByColor.length > 0;
    const totalStock = hasColorVariants
      ? editingStockByColor.reduce((sum, item) => sum + Number(item.qty || 0), 0)
      : Number(editing.stock || 0);
    const payload = { 
      brand: editing.brand ? editing.brand.trim() : 'Hero',
      model: editing.model.trim(),
      variant: editing.variant ? editing.variant.trim() : '',
      cc: Number(editing.cc || 0),
      color: editing.color ? editing.color.trim() : '',
      ex_showroom_price: Number(editing.ex_showroom_price), 
      on_road_price: Number(editing.on_road_price),
      max_discount: Number(editing.max_discount || 0),
      stock: totalStock,
      stock_by_color: editingStockByColor,
      status: totalStock > 0 ? 'Available' : 'Sold out'
    };
    
    if (editing.id) {
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
    } else {
      const { data, error } = await supabase.from('inventory').insert(payload).select().single();
      if (error) {
        onToast?.('Failed to add model: ' + error.message);
        setBusy(false);
        return;
      }
      let inserted = data;
      if (editing.file) {
        try {
          const image_url = await uploadVehicleImage(editing.file, inserted.id);
          const { data: updated, error: imgErr } = await supabase.from('inventory').update({ image_url }).eq('id', inserted.id).select().single();
          if (!imgErr && updated) inserted = updated;
        } catch (err) {
          onToast?.('Model added, but image upload failed: ' + err.message);
        }
      }
      onChange([inserted, ...inventory]);
      onToast?.(`Added new model ${inserted.model} successfully.`);
    }
    
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
      <div className="workspace-tabs-group" style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
        <span className="inventory-count">{inventory.length} models</span>
        <button className="primary-button" style={{height: '34px', padding: '0 16px', margin: 0}} onClick={openAdd}><Icon name="plus" size={15}/> Add New Model</button>
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
            <b>{v.model} <span style={{fontWeight: 'normal', color: '#888', fontSize: '11px'}}>({v.brand || 'Hero'})</span></b>
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
      <div className="modal sale-modal" style={{maxWidth: '550px'}} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{editing.id ? `Edit ${editing.model}` : 'Add New Bike Model'}</h2>
          <button className="icon-button" onClick={() => setEditing(null)}><Icon name="x" size={20}/></button>
        </div>
        <form className="modal-body form-grid" style={{gridTemplateColumns: '1fr 1fr', gap: '16px'}} onSubmit={save}>
          <label>Brand Name *<input required value={editing.brand || ''} onChange={e => setEditing({...editing, brand: e.target.value})} placeholder="e.g. Hero, Honda, TVS"/></label>
          <label>Model Name *<input required value={editing.model || ''} onChange={e => setEditing({...editing, model: e.target.value})} placeholder="e.g. Splendor+ i3S"/></label>
          <label>Variant<input value={editing.variant || ''} onChange={e => setEditing({...editing, variant: e.target.value})} placeholder="e.g. Self Start Drum"/></label>
          <label>Engine cc<input type="number" min="0" value={editing.cc || ''} onChange={e => setEditing({...editing, cc: e.target.value})} placeholder="e.g. 100"/></label>
          <label>Base Colour<input value={editing.color || ''} onChange={e => setEditing({...editing, color: e.target.value})} placeholder="e.g. Black with Purple"/></label>
          <label>Ex-showroom Price (₹) *<input type="number" required value={editing.ex_showroom_price || ''} onChange={e => setEditing({...editing, ex_showroom_price: e.target.value})} placeholder="e.g. 75000"/></label>
          <label>On-road Price (₹) *<input type="number" required value={editing.on_road_price || ''} onChange={e => setEditing({...editing, on_road_price: e.target.value})} placeholder="e.g. 88000"/></label>
          <label style={{gridColumn: 'span 2'}}>Max Discount (₹)<input type="number" min="0" value={editing.max_discount || ''} onChange={e => setEditing({...editing, max_discount: e.target.value})} placeholder="e.g. 3000"/></label>
          
          <div style={{gridColumn: 'span 2'}}>
            {editingStockByColor.length === 0 ? (
              <label>Total Stock Qty<input type="number" min="0" required value={editing.stock || 0} onChange={e => setEditing({...editing, stock: Number(e.target.value)})}/></label>
            ) : (
              <label>Total Stock Qty (Calculated from colors)<input type="number" disabled value={editingStockByColor.reduce((sum, item) => sum + Number(item.qty || 0), 0)}/></label>
            )}
          </div>
          <div style={{gridColumn: 'span 2'}}>
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
          <div style={{gridColumn: 'span 2'}}>
            <label>Upload Photo<input type="file" accept="image/*" onChange={e => setEditing({...editing, file: e.target.files[0]})}/><small className="hint">Overrides or sets the bike photo.</small></label>
          </div>
          <div className="modal-foot" style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="ghost-button" onClick={() => setEditing(null)} style={{ flex: 1 }}>Cancel</button>
            <button type="submit" disabled={busy} className="primary-button" style={{ flex: 1 }}>{busy ? 'Saving...' : 'Save Model'}</button>
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
      <div><p className="eyebrow">LINKED TO SALES</p><h2>Number plate applications</h2><p>Har sold bike ka number plate record yahan automatically create hota hai.</p></div>
      <div className="rc-summary"><b>{completedRecords.length}</b><span>completed</span><b>{openRecords.length}</b><span>open</span></div>
    </div>
    {shown.length ? <div className="panel rc-table"><div className="table-head rc-table-head"><span>Customer</span><span>Vehicle</span><span>Sale link</span><span>Status</span><span>Update</span></div>{shown.map((record, index) => <div className="rc-row" key={record.id || index}><div className="customer"><div className="avatar" style={{background:['#e8d4ce','#dce3d3','#d9dcea','#e8e0cc'][index % 4]}}>{String(record.customer_name || 'NK').split(' ').map(x => x[0]).join('').slice(0,2)}</div><b>{record.customer_name}</b></div><span className="muted">{record.vehicle_name}</span><span className="sale-link"><i/> Sale #{record.sale_id}</span><span className={`status ${record.status === 'Completed' ? 'success' : record.status === 'Submitted' ? 'info' : 'warning'}`}><i/>{record.status}</span><select value={record.status} onChange={e => onStatusChange(record, e.target.value)}><option>Pending</option><option>Submitted</option><option>Processing</option><option>Completed</option></select></div>)}</div>
    : <div className="panel placeholder-panel"><div className="empty-icon"><Icon name="file" size={27}/></div><h2>{tab === 'Open' ? 'Koi pending number plate nahi' : 'Koi completed number plate nahi'}</h2><p>{tab === 'Open' ? 'Saari number plate applications complete ho gayi hain.' : 'Abhi tak koi number plate complete nahi hua.'}</p></div>}
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
  const [customer, setCustomer] = useState(''); const [phone, setPhone] = useState(''); const [aadhaar, setAadhaar] = useState(''); const [pan, setPan] = useState(''); const [aadhaarFrontFile, setAadhaarFrontFile] = useState(null); const [aadhaarBackFile, setAadhaarBackFile] = useState(null); const [panFile, setPanFile] = useState(null); const [signature, setSignature] = useState(''); const [discount, setDiscount] = useState('0'); const [payment, setPayment] = useState('Pending'); const [saleType, setSaleType] = useState('Sale'); const [oldVehicleName, setOldVehicleName] = useState(''); const [oldVehicleRegistration, setOldVehicleRegistration] = useState(''); const [exchangeValue, setExchangeValue] = useState('0'); const [exchangeDiscount, setExchangeDiscount] = useState('0'); const [rcFile, setRcFile] = useState(null); const [emiAmount, setEmiAmount] = useState(''); const [tenureMonths, setTenureMonths] = useState(''); const [amountPaid, setAmountPaid] = useState(''); const [vehicleColor, setVehicleColor] = useState(availableColors[0]);
  const base = Number(vehicle.on_road_price || vehicle.ex_showroom_price || vehicle.price || 0); const safeDiscount = Math.min(Number(discount || 0), Number(vehicle.max_discount ?? base)); const safeExchangeValue = saleType === 'Exchange' ? Math.max(0, Number(exchangeValue || 0)) : 0; const safeExchangeDiscount = saleType === 'Exchange' ? Math.max(0, Number(exchangeDiscount || 0)) : 0; const finalAmount = Math.max(0, base - safeDiscount - safeExchangeValue - safeExchangeDiscount);
  return <div className="modal-backdrop" onClick={onClose}><div className="modal sale-modal" onClick={e => e.stopPropagation()}><div className="modal-head"><div><p className="eyebrow">CONFIRM SALE</p><h2>{vehicle.model} <span>{vehicle.variant}</span></h2></div><button className="close" onClick={onClose}>×</button></div><div className={`sale-summary ${saleType === 'Exchange' ? 'has-exchange' : ''}`}><div><small>LISTED PRICE</small><b>{money(base)}</b></div><div><small>FINAL AMOUNT</small><strong>{money(finalAmount)}</strong></div>{saleType === 'Exchange' && <div className="exchange-summary"><small>EXCHANGE BENEFIT</small><b>− {money(safeExchangeValue + safeExchangeDiscount)}</b></div>}</div><div className="form-grid"><label>Customer name<input value={customer} onChange={e => setCustomer(e.target.value)} placeholder="e.g. Priya Shah" required/></label><label>Phone number<input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98XXX XXXXX"/></label><label>Vehicle color<select value={vehicleColor} onChange={e => setVehicleColor(e.target.value)}>{availableColors.map(c => <option key={c} value={c}>{c}</option>)}</select></label><label>PAN number <span className="privacy-note">masked in record<input maxLength="10" value={pan} onChange={e => setPan(e.target.value.toUpperCase())} placeholder="ABCDE1234F"/></span></label><label>Upload Aadhaar (Front)<input type="file" accept="image/*,.pdf" onChange={e => setAadhaarFrontFile(e.target.files?.[0] || null)}/><small className="hint">Private Supabase storage</small></label><label>Upload Aadhaar (Back)<input type="file" accept="image/*,.pdf" onChange={e => setAadhaarBackFile(e.target.files?.[0] || null)}/><small className="hint">Private Supabase storage</small></label><label>Upload PAN<input type="file" accept="image/*,.pdf" onChange={e => setPanFile(e.target.files?.[0] || null)}/><small className="hint">Private Supabase storage</small></label><label>Discount<input type="number" min="0" max={vehicle.max_discount ?? base} value={discount} onChange={e => setDiscount(e.target.value)}/><small className="hint">Allowed up to {money(vehicle.max_discount ?? base)}</small></label><label>Payment status<select value={payment} onChange={e => setPayment(e.target.value)}><option>Pending</option><option>Paid</option><option>Finance</option></select></label><label>Amount paid (Advance)<input type="number" min="0" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} placeholder="e.g. 5000"/><small className="hint">Remaining: {money(Math.max(0, finalAmount - Number(amountPaid || 0)))}</small></label>{payment === 'Finance' && <><label>EMI Amount<input type="number" min="0" value={emiAmount} onChange={e => setEmiAmount(e.target.value)} placeholder="e.g. 3500"/></label><label>Tenure (Months)<input type="number" min="0" value={tenureMonths} onChange={e => setTenureMonths(e.target.value)} placeholder="e.g. 24"/></label></>}<label>Sale type<select value={saleType} onChange={e => setSaleType(e.target.value)}><option>Sale</option><option>Exchange</option></select></label>{saleType === 'Exchange' && <><label>Old bike model/name<input value={oldVehicleName} onChange={e => setOldVehicleName(e.target.value)} placeholder="e.g. Splendor+ 2019" required/></label><label>Old bike registration number<input value={oldVehicleRegistration} onChange={e => setOldVehicleRegistration(e.target.value)} placeholder="MH01AB1234" required/></label><label>Exchange value<input type="number" min="0" value={exchangeValue} onChange={e => setExchangeValue(e.target.value)} placeholder="50000" required/><small className="hint">Old bike value deducted from final amount</small></label><label>Exchange discount<input type="number" min="0" value={exchangeDiscount} onChange={e => setExchangeDiscount(e.target.value)} placeholder="5000"/><small className="hint">Additional exchange offer</small></label><label>Upload old bike RC<input type="file" accept="image/*,.pdf" onChange={e => setRcFile(e.target.files?.[0] || null)}/><small className="hint">Private Supabase storage</small></label></>}</div><SignaturePad value={signature} onChange={setSignature}/><div className="modal-foot"><button className="ghost-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={!customer} onClick={() => onSave({ customer, phone, aadhaar, pan, aadhaarFrontFile, aadhaarBackFile, panFile, signature, discount: safeDiscount, payment, saleType, oldVehicleName, oldVehicleRegistration, exchangeValue: safeExchangeValue, exchangeDiscount: safeExchangeDiscount, rcFile, emiAmount, tenureMonths, amountPaid: amountPaid ? Number(amountPaid) : (payment === 'Paid' ? finalAmount : 0), vehicleColor })}><Icon name="check" size={16}/> Save sale + invoice</button></div></div></div>;
}

function InvoiceModal({ record, ownerSignature, onClose }) {
  const { sale, vehicle, customer, saleAmount, discount, signature } = record;
  const invoiceNo = `RF-${new Date(sale.sale_date).getFullYear()}-${String(sale.id).padStart(5, '0')}`;
  const invoiceRef = useRef(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  const isSecondHand = vehicle.is_second_hand;
  const brandName = vehicle.brand || 'Hero';
  const isHero = brandName.toLowerCase() === 'hero' && !isSecondHand;

  let logoUrl = '/hero.png';
  let showroomSubText = 'Hero MotoCorp · Churcha Colliery';
  let thankYouText = 'Thank you for choosing Hero MotoCorp.';
  let rcText = 'Number plate application has been linked to this sale.';
  let waBrand = 'Hero MotoCorp';

  if (isSecondHand) {
    logoUrl = '/hero.png';
    showroomSubText = 'RideFlow Showroom OS · Pre-owned Desk';
    thankYouText = 'Thank you for buying pre-owned with us.';
    rcText = 'Ownership transfer documents are being prepared.';
    waBrand = 'pre-owned bike';
  } else if (!isHero) {
    logoUrl = null;
    showroomSubText = `${brandName} Showroom Sales`;
    thankYouText = `Thank you for choosing ${brandName} with us.`;
    rcText = 'Number plate application is being processed.';
    waBrand = brandName;
  }

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
    const text = encodeURIComponent(`Hello ${customer.name}, your ${waBrand} invoice ${invoiceNo} is ready. Total: ${money(saleAmount)}. Please download the PDF and send it here.`);
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank', 'noopener,noreferrer');
  }
  // ownerSignature passed as prop instead of getting from localStorage inline
  return <div className="modal-backdrop invoice-backdrop" onClick={onClose}><div className="invoice-sheet" onClick={e => e.stopPropagation()}><div className="invoice-actions"><button className="ghost-button" onClick={onClose}>Close</button><button className="ghost-button" disabled={pdfBusy} onClick={shareWhatsApp}>Send on WhatsApp</button><button className="primary-button" disabled={pdfBusy} onClick={downloadPdf}>{pdfBusy ? 'Preparing PDF…' : 'Download PDF'}</button></div><div className="invoice-paper" ref={invoiceRef}><div className="invoice-top"><div><div className="invoice-brand" style={{display: 'flex', alignItems: 'center'}}>{logoUrl ? <img src={logoUrl} alt={waBrand} style={{height:'64px', width:'auto', objectFit:'contain'}}/> : <div className="brand-mark" style={{width:'36px', height:'36px', background:'#212326', color:'#fff', borderRadius:'6px', display:'grid', placeItems:'center', marginRight:'12px', fontWeight:'bold', fontSize:'18px'}}>R</div>}</div><p>{showroomSubText}<br/>NH43 main road near police station churcha colliery<br/>Dist Koriya, Chhattisgarh - 497339<br/>Mobile: 9565550673, 7354205099</p></div><div className="invoice-meta"><small>TAX INVOICE</small><strong>{invoiceNo}</strong><span>{dateLabel(sale.sale_date)} · {new Date(sale.sale_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span></div></div><div className="invoice-rule"/><div className="invoice-parties"><div><small>BILLED TO</small><b>{customer.name}</b><span>{customer.phone || 'Phone not added'}</span>{customer.aadhaar_document_path || customer.aadhaar_back_document_path ? <span>Aadhaar · Document uploaded</span> : customer.aadhaar_last4 ? <span>Aadhaar · •••• {customer.aadhaar_last4}</span> : null}<span>PAN · {customer.pan_masked || (customer.pan_document_path ? 'Document uploaded' : 'Not added')}</span></div><div><small>VEHICLE DETAILS</small><b>{vehicle.model}</b>{(vehicle.variant || vehicle.cc) ? <span>{vehicle.variant ? vehicle.variant : ''}{(vehicle.variant && vehicle.cc) ? ' · ' : ''}{vehicle.cc ? vehicle.cc + ' cc' : ''}</span> : null}<span>Colour · {vehicle.color}</span></div></div><div className="invoice-items"><div className="invoice-item invoice-item-head"><span>DESCRIPTION</span><span>AMOUNT</span></div><div className="invoice-item"><span><b>{vehicle.model} {vehicle.variant}</b><small>{isSecondHand ? 'Pre-owned vehicle price' : 'On-road vehicle price'}</small></span><strong>{money(vehicle.on_road_price || vehicle.ex_showroom_price || vehicle.price)}</strong></div><div className="invoice-item discount-row"><span>Showroom discount</span><strong>− {money(discount)}</strong></div></div><div className="invoice-total"><span>Total payable</span><strong>{money(saleAmount)}</strong></div><div className="invoice-footer"><div><b>{thankYouText}</b><span>{rcText}</span><div style={{marginTop: '20px'}}>{ownerSignature ? <div className="invoice-signature"><img src={ownerSignature} alt="Authorized signature"/><small>Authorized Signatory</small></div> : <div style={{width:'150px', borderBottom:'1px solid #000', marginTop:'40px', paddingBottom:'4px', fontSize:'10px', color:'#666'}}>Authorized Signatory</div>}</div></div><div>{signature && <div className="invoice-signature"><img src={signature} alt="Customer digital signature"/><small>Digitally signed by customer</small></div>}<small>PAYMENT STATUS</small><strong>{sale.payment_status || 'Pending'}</strong></div></div></div></div></div>;
}

function OwnerSettingsModal({ onClose, onSignOut, currentSettings, currentSignature, onSettingsSaved }) {
  const [signature, setSignature] = useState(currentSignature || '');
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(currentSettings?.auto_backup_enabled || false);
  const [autoBackupKey, setAutoBackupKey] = useState(currentSettings?.auto_backup_key || '');
  const [autoBackupTime, setAutoBackupTime] = useState(currentSettings?.auto_backup_time || '11:00');
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    localStorage.setItem('rideflow_owner_signature', signature || '');
    const newSettings = { owner_signature: signature || null, auto_backup_enabled: autoBackupEnabled, auto_backup_key: autoBackupKey, auto_backup_time: autoBackupTime };
    const { error } = await supabase.from('showroom_settings').upsert({ id: 1, ...newSettings });
    setSaving(false);
    if (!error) {
      if (onSettingsSaved) onSettingsSaved(newSettings);
      onClose();
    } else {
      alert("Error saving to cloud, saved locally. Run updated setup.sql.");
      if (onSettingsSaved) onSettingsSaved(newSettings);
      onClose();
    }
  }

  return <div className="modal-backdrop" onClick={onClose}><div className="modal sale-modal" style={{maxWidth:'500px'}} onClick={e => e.stopPropagation()}><div className="modal-head"><h2>Settings & Profile</h2><button className="icon-button" onClick={onClose}><Icon name="x" size={20}/></button></div><div className="modal-body">
    <div style={{background:'#f5f5f5', padding:'16px', borderRadius:'10px', marginBottom:'20px'}}><b>Authorized Signatory</b><p style={{fontSize:'13px', color:'#666', marginTop:'4px', marginBottom:'16px'}}>This signature will appear permanently on all invoices as the showroom owner's signature.</p><SignaturePad value={signature} onChange={setSignature} /></div>
    <div style={{background:'#e2efe1', padding:'16px', borderRadius:'10px', marginBottom:'20px'}}>
      <b>Daily Automatic Backup (Frontend)</b>
      <p style={{fontSize:'13px', color:'#528d5f', marginTop:'4px', marginBottom:'16px'}}>Exports sales, customers & dues as CSV to your email. <strong>Requires this browser tab to be open.</strong></p>
      <label style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px', cursor:'pointer'}}><input type="checkbox" checked={autoBackupEnabled} onChange={e => setAutoBackupEnabled(e.target.checked)}/> Enable daily automatic backup</label>
      {autoBackupEnabled && <div className="form-grid">
        <label>Web3Forms Access Key <a href="https://web3forms.com" target="_blank" rel="noreferrer" style={{color:'#1c532b', textDecoration:'underline', float:'right', fontWeight:'normal'}}>Get free key</a><input type="text" value={autoBackupKey} onChange={e => setAutoBackupKey(e.target.value)} placeholder="e.g. 52c4b8d... (Sent to your email)" /></label>
        <label>Time to send email (24-hour)<input type="time" value={autoBackupTime} onChange={e => setAutoBackupTime(e.target.value)} required/></label>
      </div>}
    </div>
  </div><div className="modal-foot" style={{ display: 'flex', justifyContent:'space-between', marginTop: '24px' }}><button type="button" className="ghost-button" onClick={onSignOut} style={{color:'#d32f2f'}}>Sign out</button><div style={{display:'flex', gap:'10px'}}><button type="button" className="outline-button" onClick={onClose}>Cancel</button><button type="button" className="primary-button" disabled={saving} onClick={save}>{saving ? 'Saving...' : 'Save settings'}</button></div></div></div></div>;
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

function SecondHandInventoryWorkspace({ vehicles, onChange, onSell, onToast }) {
  const blank = { model: '', variant: '', cc: '', color: '', registration_number: '', km_driven: '', year_of_manufacture: '', price: '', stock: 1 };
  const [items, setItems] = useState(vehicles);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(blank);
  const [query, setQuery] = useState('');

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
    setForm({
      model: vehicle.model || '',
      variant: vehicle.variant || '',
      cc: vehicle.cc || '',
      color: vehicle.color || '',
      registration_number: vehicle.registration_number || '',
      km_driven: vehicle.km_driven || '',
      year_of_manufacture: vehicle.year_of_manufacture || '',
      price: vehicle.price || '',
      stock: vehicle.stock ?? 1,
      file: null
    });
    setShowForm(true);
  }

  async function saveVehicle(event) {
    event.preventDefault();
    setBusy(true);
    const payload = {
      model: form.model.trim(),
      variant: form.variant.trim(),
      cc: Number(form.cc || 0),
      color: form.color.trim(),
      registration_number: form.registration_number.trim().toUpperCase(),
      km_driven: Number(form.km_driven || 0),
      year_of_manufacture: Number(form.year_of_manufacture || 0),
      price: Number(form.price || 0),
      stock: Math.max(0, Number(form.stock || 0)),
      status: Math.max(0, Number(form.stock || 0)) > 0 ? 'Available' : 'Sold'
    };

    if (!payload.model || !payload.registration_number || !payload.price) {
      notify('Model, Registration number, and Price are required.');
      setBusy(false);
      return;
    }

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
      const { data, error } = await supabase.from('second_hand_inventory').update(payload).eq('id', editing.id).select().single();
      if (error) { notify(`Update failed: ${error.message}`); setBusy(false); return; }
      nextItem = data;
      const next = items.map(item => item.id === editing.id ? nextItem : item);
      setItems(next); onChange?.(next);
      notify('Pre-owned bike updated.');
    } else if (editing) {
      nextItem = { ...editing, ...payload };
      const next = items.map(item => item.id === editing.id ? nextItem : item);
      setItems(next); onChange?.(next);
      notify('Pre-owned bike updated locally.');
    } else {
      const { data, error } = await supabase.from('second_hand_inventory').insert(payload).select().single();
      if (error) { notify(`Add failed: ${error.message}`); setBusy(false); return; }
      nextItem = data;
      if (form.file) {
        try {
          const image_url = await uploadVehicleImage(form.file, nextItem.id);
          await supabase.from('second_hand_inventory').update({ image_url }).eq('id', nextItem.id);
          nextItem.image_url = image_url;
        } catch(err) { notify('Added bike, but image upload failed'); }
      }
      const next = [nextItem, ...items];
      setItems(next); onChange?.(next);
      notify('Pre-owned bike added.');
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
      const { error } = await supabase.from('second_hand_inventory').delete().eq('id', vehicle.id);
      if (error) { notify(`Delete failed: ${error.message}`); setBusy(false); return; }
    }
    const next = items.filter(item => item.id !== vehicle.id);
    setItems(next); onChange?.(next); notify('Pre-owned bike removed.');
    setBusy(false);
    setDeleting(null);
  }

  const filtered = items.filter(v =>
    `${v.model} ${v.variant} ${v.registration_number} ${v.color}`.toLowerCase().includes(query.toLowerCase())
  );
  const availableCount = items.filter(vehicle => Number(vehicle.stock || 0) > 0).length;

  return (
    <section className="test-ride-inventory" style={{paddingTop: 0, height: 'auto', flex: 1}}>
      <div className="test-ride-inventory-head">
        <div>
          <p className="eyebrow">PRE-OWNED BIKES</p>
          <h2>Second Hand Inventory</h2>
          <p>Manage pre-owned bikes in showroom stock, buy from customers, and sell them.</p>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
          <label className="search" style={{height: '34px', margin: 0, width: '200px'}}>
            <Icon name="search" size={15}/>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search pre-owned..." style={{fontSize: '11px'}}/>
          </label>
          <div className="inventory-count">{availableCount} available · {items.length} total</div>
          <button className="primary-button" onClick={openAdd}><Icon name="plus" size={15}/> Add Pre-owned Bike</button>
        </div>
      </div>

      {filtered.length ? (
        <div className="panel demo-fleet-grid">
          {filtered.map((vehicle, index) => (
            <div className="demo-fleet-row" key={vehicle.id || index} style={{gridTemplateColumns: '50px minmax(0,1fr) auto auto'}}>
              <div className="demo-bike-mark" style={{width: '42px', height: '42px'}}>
                {vehicle.image_url ? <img src={vehicle.image_url} style={{width:'100%', height:'100%', objectFit:'cover', borderRadius: '4px'}} alt=""/> : <Icon name="bike" size={24}/>}
              </div>
              <div>
                <b style={{fontSize: '13px'}}>{vehicle.model} <span style={{fontWeight: 'normal', color: '#888', fontSize: '11px'}}>{vehicle.variant}</span></b>
                <small style={{color: '#666', marginTop: '2px', fontSize: '10px'}}>
                  Reg No: <b>{vehicle.registration_number}</b> · {vehicle.year_of_manufacture} YOM · {vehicle.km_driven?.toLocaleString()} km · {vehicle.cc} cc · {vehicle.color}
                </small>
              </div>
              <div style={{textAlign: 'right', marginRight: '16px'}}>
                <b style={{fontSize: '14px', color: '#1d2326'}}>{money(vehicle.price)}</b>
                <small className={Number(vehicle.stock) > 0 ? 'status success' : 'status danger'} style={{marginTop: '4px'}}><i/>{Number(vehicle.stock) > 0 ? 'Available' : 'Sold'}</small>
              </div>
              <div className="demo-fleet-actions" style={{gap: '8px'}}>
                {Number(vehicle.stock) > 0 && (
                  <button className="sell-button" onClick={() => onSell({ ...vehicle, is_second_hand: true })} style={{padding: '7px 11px', fontSize: '10px'}}>Sell Bike</button>
                )}
                <button className="ghost-button compact-button" onClick={() => openEdit(vehicle)}>Edit</button>
                <button className="ghost-button compact-button danger-button" onClick={() => setDeleting(vehicle)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="panel placeholder-panel">
          <h2>No pre-owned bikes found</h2>
          <p>Add pre-owned bikes received from customer exchange or direct buyback to list them here.</p>
          <button className="primary-button" onClick={openAdd}><Icon name="plus" size={15}/> Add first bike</button>
        </div>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={() => { setShowForm(false); setEditing(null); }}>
          <form className="modal demo-inventory-modal" style={{maxWidth: '600px'}} onClick={event => event.stopPropagation()} onSubmit={saveVehicle}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">{editing ? 'UPDATE PRE-OWNED' : 'ADD PRE-OWNED'}</p>
                <h2>{editing ? 'Edit Pre-owned Bike' : 'Add Pre-owned Bike'}</h2>
              </div>
              <button type="button" className="close" onClick={() => { setShowForm(false); setEditing(null); }}>×</button>
            </div>
            <div className="form-grid" style={{gridTemplateColumns: '1fr 1fr'}}>
              <label>Model Name *<input value={form.model} onChange={event => setForm({ ...form, model: event.target.value })} placeholder="e.g. Splendor+ i3S" required/></label>
              <label>Variant<input value={form.variant} onChange={event => setForm({ ...form, variant: event.target.value })} placeholder="e.g. Self Start Drum"/></label>
              <label>Engine cc<input type="number" min="0" value={form.cc} onChange={event => setForm({ ...form, cc: event.target.value })} placeholder="e.g. 100"/></label>
              <label>Colour<input value={form.color} onChange={event => setForm({ ...form, color: event.target.value })} placeholder="e.g. Black with Purple"/></label>
              <label>Registration Number *<input value={form.registration_number} onChange={event => setForm({ ...form, registration_number: event.target.value })} placeholder="e.g. MH02DU1234" required/></label>
              <label>Kilometers Driven<input type="number" min="0" value={form.km_driven} onChange={event => setForm({ ...form, km_driven: event.target.value })} placeholder="e.g. 18500"/></label>
              <label>Year of Manufacture<input type="number" min="1900" max={new Date().getFullYear()} value={form.year_of_manufacture} onChange={event => setForm({ ...form, year_of_manufacture: event.target.value })} placeholder="e.g. 2021"/></label>
              <label>Expected Price (₹) *<input type="number" min="0" value={form.price} onChange={event => setForm({ ...form, price: event.target.value })} placeholder="e.g. 45000" required/></label>
              <label>Available Stock<select value={form.stock} onChange={event => setForm({ ...form, stock: Number(event.target.value) })}><option value="1">1 (Available)</option><option value="0">0 (Sold)</option></select></label>
              <label>Upload Photo<input type="file" title=" " accept="image/*" onChange={e => setForm({...form, file: e.target.files[0]})}/></label>
            </div>
            <div className="modal-foot">
              <button type="button" className="ghost-button" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</button>
              <button className="primary-button" type="submit" disabled={busy}><Icon name="check" size={15}/> {editing ? 'Save changes' : 'Add bike'}</button>
            </div>
          </form>
        </div>
      )}

      {deleting && (
        <div className="modal-backdrop" onClick={() => setDeleting(null)}>
          <div className="modal sale-modal" style={{maxWidth: '400px'}} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Delete {deleting.model}?</h2>
              <button className="icon-button" onClick={() => setDeleting(null)}><Icon name="x" size={20}/></button>
            </div>
            <div className="modal-body" style={{padding: '0 24px 24px'}}>
              <p style={{margin: '0 0 20px', color: '#657487', fontSize: '14px', lineHeight: '1.5'}}>Are you sure you want to delete <b>{deleting.model}</b> ({deleting.registration_number}) from the pre-owned inventory? This action cannot be undone.</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="ghost-button" onClick={() => setDeleting(null)} style={{ flex: 1 }}>Cancel</button>
                <button type="button" disabled={busy} className="primary-button" style={{ flex: 1, background: '#d32f2f' }} onClick={confirmRemove}>{busy ? 'Deleting...' : 'Yes, Delete'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

const Metric = ({ label, value, delta, foot, accent }) => { const type = label === 'MONTHLY SALES' ? 'sales-chart' : label === 'UNITS SOLD' ? 'units-chart' : label === 'AVAILABLE STOCK' ? 'stock-chart' : 'rc-chart'; return <div className="metric"><p className="eyebrow">{label}</p><div className="metric-main"><strong>{value}</strong><span className={accent === 'amber' ? 'metric-delta amber' : 'metric-delta'}>{delta}</span></div><span className="muted">{foot}</span>{type === 'sales-chart' && <div className="metric-chart sales-chart"><svg viewBox="0 0 120 38" preserveAspectRatio="none"><path className="chart-area" d="M2 32 L18 25 L32 28 L47 17 L62 21 L78 9 L94 14 L108 4 L118 8 L118 38 L2 38 Z"/><path className="chart-line" d="M2 32 L18 25 L32 28 L47 17 L62 21 L78 9 L94 14 L108 4 L118 8"/></svg><span>7-day sales</span></div>}{type === 'units-chart' && <div className="metric-chart units-chart"><div className="units-bars"><i/><i/><i/><i/><i/><i/><i/></div><span>units moved</span></div>}{type === 'stock-chart' && <div className="metric-chart stock-chart"><div className="stock-ring"><b>LIVE</b></div><span>available now</span></div>}{type === 'rc-chart' && <div className="metric-chart rc-chart"><div className="rc-track"><i/></div><span>needs attention</span></div>}</div>; };

createRoot(document.getElementById('root')).render(<App />);
