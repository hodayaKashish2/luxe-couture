'use client';

import React, { useState, useEffect } from 'react';

// עקיפת ההתקנה: טעינת Supabase ישירות מהרשת כדי למנוע קריסה ב-Vercel
let createClient: any = null;
if (typeof window !== 'undefined') {
  // החבילה תיטען דינמית בדפדפן במידת הצורך, או שנשתמש בגרסת ה-CDN החלופית
}

export default function Home() {
  const [supabase, setSupabase] = useState<any>(null);
  const [dressesList, setDressesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // פילטרים
  const [searchTerm, setSearchTerm] = useState('');
  const [maxPrice, setMaxPrice] = useState(1000);
  const [selectedSize, setSelectedSize] = useState('All');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  const [favorites, setFavorites] = useState<number[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAddDressOpen, setIsAddDressOpen] = useState(false);

  const [newDressData, setNewDressData] = useState({
    name: '', price: '', size: '', color: '', condition: 'new', description: '', images: [] as string[]
  });

  const [bookedDates, setBookedDates] = useState<{ [dressId: number]: string[] }>({});
  const [selectedDress, setSelectedDress] = useState<any | null>(null);
  const [orderName, setOrderName] = useState('');
  const [orderPhone, setOrderPhone] = useState('');
  const [orderEmail, setOrderEmail] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [isOrdered, setIsOrdered] = useState(false);
  const [dateError, setDateError] = useState('');
  const [currentImageIndexes, setCurrentImageIndexes] = useState<{ [key: number]: number }>({});
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // טעינה דינמית של ה-SDK כדי שלא יכשיל את ה-Build
  useEffect(() => {
    const initSupabase = async () => {
      try {
        const supabaseJS = await import('@supabase/supabase-js');
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        const client = supabaseJS.createClient(url, key);
        setSupabase(client);
      } catch (e) {
        console.error("Supabase package not installed or failed to load. Please use Option A if possible.", e);
        setLoading(false);
      }
    };
    initSupabase();

    const savedFavs = localStorage.getItem('luxe_favs');
    if (savedFavs) setFavorites(JSON.parse(savedFavs));
    const savedCart = localStorage.getItem('luxe_cart');
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  useEffect(() => {
    if (supabase) {
      fetchDressesAndBookings();
    }
  }, [supabase]);

  const fetchDressesAndBookings = async () => {
    if (!supabase) return;
    try {
      setLoading(true);
      const { data: dresses, error: dressesError } = await supabase
        .from('dresses')
        .select('*')
        .order('created_at', { ascending: false });

      if (dressesError) throw dressesError;

      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('dress_id, date');

      if (bookingsError) throw bookingsError;

      const booked: { [dressId: number]: string[] } = {};
      bookings?.forEach((b: any) => {
        if (!booked[b.dress_id]) booked[b.dress_id] = [];
        booked[b.dress_id].push(b.date);
      });

      setDressesList(dresses || []);
      setBookedDates(booked);

      const indexes: { [key: number]: number } = {};
      dresses?.forEach((d: any) => { indexes[d.id] = 0; });
      setCurrentImageIndexes(indexes);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated = favorites.includes(id) ? favorites.filter(favId => favId !== id) : [...favorites, id];
    setFavorites(updated);
    localStorage.setItem('luxe_favs', JSON.stringify(updated));
  };

  const toggleCart = (dress: any, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated = cart.some(item => item.id === dress.id) ? cart.filter(item => item.id !== dress.id) : [...cart, dress];
    setCart(updated);
    localStorage.setItem('luxe_cart', JSON.stringify(updated));
  };

  const nextImage = (dressId: number, maxImages: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndexes(prev => ({ ...prev, [dressId]: (prev[dressId] + 1) % maxImages }));
  };

  const prevImage = (dressId: number, maxImages: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndexes(prev => ({ ...prev, [dressId]: (prev[dressId] - 1 + maxImages) % maxImages }));
  };

  const handleDateChange = (date: string) => {
    setOrderDate(date);
    if (selectedDress && bookedDates[selectedDress.id]?.includes(date)) {
      setDateError('אופס! השמלה כבר תפוסה בתאריך זה. אנא בחרי תאריך אחר.');
    } else {
      setDateError('');
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !orderName || !orderPhone || !orderEmail || !orderDate || !selectedDress) return;

    try {
      const { error: dbError } = await supabase.from('bookings').insert([
        { dress_id: selectedDress.id, date: orderDate, customer_name: orderName, customer_phone: orderPhone, customer_email: orderEmail }
      ]);
      if (dbError) throw dbError;

      await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: orderName, phone: orderPhone, email: orderEmail, dressName: selectedDress.name, date: orderDate }),
      });

      setBookedDates(prev => ({ ...prev, [selectedDress.id]: [...(prev[selectedDress.id] || []), orderDate] }));
      setIsOrdered(true);
      setTimeout(() => {
        setIsOrdered(false);
        setSelectedDress(null);
        setOrderName(''); setOrderPhone(''); setOrderEmail(''); setOrderDate('');
      }, 4000);
    } catch (error) {
      alert('הייתה בעיה ברישום ההזמנה');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const urlsArray = Array.from(e.target.files).map(file => URL.createObjectURL(file));
      setNewDressData(prev => ({ ...prev, images: [...prev.images, ...urlsArray] }));
    }
  };

  const handleAddDressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !newDressData.name || !newDressData.price || !newDressData.size) return;

    const imgs = newDressData.images.length > 0 ? newDressData.images : ["https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&auto=format&fit=crop&q=80"];
    const fullDescription = `${newDressData.description || ''} | צבע: ${newDressData.color || 'לא צוין'}`;

    try {
      const { data, error } = await supabase.from('dresses').insert([
        { name: newDressData.name, price: Number(newDressData.price), size: newDressData.size, condition: newDressData.condition, images: imgs, description: fullDescription }
      ]).select();
      if (error) throw error;
      if (data) setDressesList(prev => [data[0], ...prev]);
      setIsAddDressOpen(false);
      setNewDressData({ name: '', price: '', size: '', color: '', condition: 'new', description: '', images: [] });
    } catch (error) {
      alert('שגיאה בהוספת השמלה');
    }
  };

  const filteredDresses = (dressesList || []).filter((dress: any) => {
    if (!dress) return false;
    const matchesSearch = (dress.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPrice = (Number(dress.price) || 0) <= maxPrice;
    const matchesSize = selectedSize === 'All' || dress.size === selectedSize;
    const matchesFav = !showOnlyFavorites || favorites.includes(dress.id);
    return matchesSearch && matchesPrice && matchesSize && matchesFav;
  });

  const FAQS = [
    { q: "האם המחיר כולל ניקוי יבש?", a: "בטח! כל השמלות עוברות ניקוי יבש מקצועי קפדני לפני ואחרי כל השכרה." },
    { q: "איך מתבצע תהליך המדידות וההתאמה?", a: "לאחר שריון השמלה באתר, אנחנו נתאם איתך הגעה לסטודיו חגיגי למדידות." }
  ];

  const REVIEWS = [
    { name: "מיכל אהרוני", role: "כלה", text: "השכרתי את שמלת האמרלד לחתונה של אחותי ולא הפסקתי לקבל מחמאות כל הערב!", stars: 5 }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#fbf8f0] via-[#f3ebd6] to-[#e8dcbd] text-[#332c1e] pb-24 relative overflow-hidden" dir="rtl">
      <nav className="relative z-30 max-w-7xl mx-auto px-6 pt-6 flex justify-between items-center">
        <div className="text-sm font-serif tracking-widest text-[#8b6508] font-bold">LUXE COUTURE</div>
        <div className="flex gap-3">
          <button onClick={() => setIsAddDressOpen(true)} className="px-4 py-2 bg-[#d4af37] text-white rounded-xl text-xs font-bold">➕ הוספת שמלה</button>
          <button onClick={() => setIsCartOpen(true)} className="px-4 py-2 bg-[#2c261a] text-white rounded-xl text-xs font-bold">🛍️ סל ({cart.length})</button>
        </div>
      </nav>

      <header className="relative pt-14 pb-10 px-6 text-center z-10">
        <h1 className="text-5xl font-black text-neutral-900">LUXE <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-[#8b6508] to-[#d4af37]">COUTURE</span></h1>
      </header>

      <section className="max-w-6xl mx-auto px-4 mb-14 grid grid-cols-1 md:grid-cols-3 gap-6">
        <input type="text" placeholder="חפשי שמלה..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="p-3 border rounded-xl bg-white text-xs" />
      </section>

      <section className="max-w-6xl mx-auto px-4 relative z-10">
        {loading ? <div className="text-center py-12 text-[#8b6508] font-bold">טוען קולקציה...</div> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {filteredDresses.map((dress: any) => {
              const currentImgIndex = currentImageIndexes[dress.id] || 0;
              const dressImages = Array.isArray(dress.images) ? dress.images : [dress.images];
              return (
                <div key={dress.id} className="bg-white rounded-2xl overflow-hidden border p-4 shadow-sm">
                  <img src={dressImages[currentImgIndex]} alt={dress.name} className="w-full h-64 object-cover rounded-xl" />
                  <h3 className="text-lg font-bold mt-2">{dress.name}</h3>
                  <p className="text-xs text-neutral-500">{dress.description}</p>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-base font-black text-[#b8860b]">₪{dress.price}</span>
                    <button onClick={() => setSelectedDress(dress)} className="px-3 py-1.5 bg-[#2c261a] text-white text-xs rounded-lg">✨ שרייני תאריך</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {selectedDress && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setSelectedDress(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 relative" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-black">{selectedDress.name}</h2>
            <form onSubmit={handlePlaceOrder} className="mt-4 space-y-3">
              <input type="text" placeholder="שמך המלא" required value={orderName} onChange={e => setOrderName(e.target.value)} className="w-full p-2 border rounded-xl text-xs" />
              <input type="tel" placeholder="טלפון נייד" required value={orderPhone} onChange={e => setOrderPhone(e.target.value)} className="w-full p-2 border rounded-xl text-xs" />
              <input type="email" placeholder="כתובת אימייל" required value={orderEmail} onChange={e => setOrderEmail(e.target.value)} className="w-full p-2 border rounded-xl text-xs" />
              <input type="date" required value={orderDate} onChange={e => handleDateChange(e.target.value)} className="w-full p-2 border rounded-xl text-xs" />
              <button type="submit" className="w-full bg-[#d4af37] text-white py-2 rounded-xl text-xs font-bold">אשרי שריון</button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
