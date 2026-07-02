'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// אתחול קליינט Supabase באמצעות מפתחות הסביבה מ-Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const FAQS = [
  { q: "האם המחיר כולל ניקוי יבש?", a: "בטח! כל השמלות עוברות ניקוי יבש מקצועי קפדני לפני ואחרי כל השכרה. את מקבלת את השמלה מוכנה ללבישה ומחזירה אותה ככה, אנחנו דואגים להכל." },
  { q: "איך מתבצע תהליך המדידות וההתאמה?", a: "לאחר שריון השמלה באתר, אנחנו נתאם איתך הגעה לסטודיו חגיגי למדידות. במידת הצורך נבצע מכפלת או התאמות קלות שלא פוגעות בגזרת השמלה המקורית." },
  { q: "מהי מדיניות הביטולים שלכן?", a: "ביטול שריון חינם יתאפשר עד 14 ימים לפני מועד האירוע המתוכנן. בביטול מאוחר יותר ייגבו דמי רצינות בגובה 15% מעלות ההשכרה." },
  { q: "האם נדרש להשאיר פיקדון?", a: "כן, במעמד לקחת השמלה מהסטודיו נבקש להשאיר כרטיס אשראי לביטחון בלבד. לא מבוצע שום חיוב אלא אם נגרם נזק בלתי הפיך לשמלה." }
];

const REVIEWS = [
  { name: "מיכל אהרוני", role: "כלה", text: "השכרתי את שמלת האמרלד לחתונה של אחותי ולא הפסקתי לקבל מחמאות כל הערב! הבד ישב פשוט מושלם והשירות בסטודיו היה של נסיכות.", stars: 5 },
  { name: "דניאל לוי", role: "מלווה", text: "חוויה מדהימה! השמלה הגיעה נקייה ומגוהצת כמו חדשה מהניילון. מערכת השריון באתר חסכה לי המון כאב ראש.", stars: 5 },
  { name: "שירז כהן", role: "אירוע חברה", text: "הצלתן אותי בדקה ה-90. השמלה ישבה בדיוק לפי המידות והרגשתי כמו על השטיח האדום. מומלץ בחום!", stars: 5 }
];

export default function Home() {
  // רשימת שמלות דינמית ממסד הנתונים
  const [dressesList, setDressesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // פילטרים
  const [searchTerm, setSearchTerm] = useState('');
  const [maxPrice, setMaxPrice] = useState(1000);
  const [selectedSize, setSelectedSize] = useState('All');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // מועדפים וסל
  const [favorites, setFavorites] = useState<number[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // מודאל הוספת שמלה חדשה
  const [isAddDressOpen, setIsAddDressOpen] = useState(false);
  const [newDressData, setNewDressData] = useState({
    name: '',
    price: '',
    size: '',
    color: '',
    condition: 'new',
    description: '',
    images: [] as string[]
  });

  // תאריכים תפוסים מתוך מסד הנתונים
  const [bookedDates, setBookedDates] = useState<{ [dressId: number]: string[] }>({});

  // מודאלים ושריון
  const [selectedDress, setSelectedDress] = useState<any | null>(null);
  const [orderName, setOrderName] = useState('');
  const [orderPhone, setOrderPhone] = useState('');
  const [orderEmail, setOrderEmail] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [isOrdered, setIsOrdered] = useState(false);
  const [dateError, setDateError] = useState('');

  // אינדקס גלריה לכל כרטיס
  const [currentImageIndexes, setCurrentImageIndexes] = useState<{ [key: number]: number }>({});
  const [modalImageIndex, setModalImageIndex] = useState(0);

  // אקורדיון FAQ פעיל
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // טעינת נתונים ראשונית מ-Supabase (שמלות והזמנות קיימות)
  useEffect(() => {
    fetchDressesAndBookings();

    const savedFavs = localStorage.getItem('luxe_favs');
    if (savedFavs) setFavorites(JSON.parse(savedFavs));
    const savedCart = localStorage.getItem('luxe_cart');
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  const fetchDressesAndBookings = async () => {
    try {
      setLoading(true);
      // שליפת שמלות
      const { data: dresses, error: dressesError } = await supabase
        .from('dresses')
        .select('*')
        .order('created_at', { ascending: false });

      if (dressesError) throw dressesError;

      // שליפת הזמנות כדי למפות תאריכים תפוסים
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('dress_id, date');

      if (bookingsError) throw bookingsError;

      // עיבוד התאריכים התפוסים למבנה הקיים בקוד
      const booked: { [dressId: number]: string[] } = {};
      bookings?.forEach((b: any) => {
        if (!booked[b.dress_id]) booked[b.dress_id] = [];
        booked[b.dress_id].push(b.date);
      });

      setDressesList(dresses || []);
      setBookedDates(booked);

      // איפוס אינדקסים לגלריות
      const indexes: { [key: number]: number } = {};
      dresses?.forEach((d: any) => {
        indexes[d.id] = 0;
      });
      setCurrentImageIndexes(indexes);

    } catch (error) {
      console.error('Error loading data from Supabase:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated;
    if (favorites.includes(id)) {
      updated = favorites.filter(favId => favId !== id);
    } else {
      updated = [...favorites, id];
    }
    setFavorites(updated);
    localStorage.setItem('luxe_favs', JSON.stringify(updated));
  };

  const toggleCart = (dress: any, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated;
    if (cart.some(item => item.id === dress.id)) {
      updated = cart.filter(item => item.id !== dress.id);
    } else {
      updated = [...cart, dress];
    }
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

  const checkDateAvailability = (date: string, dressId: number) => {
    if (bookedDates[dressId]?.includes(date)) {
      return false;
    }
    return true;
  };

  const handleDateChange = (date: string) => {
    setOrderDate(date);
    if (selectedDress && !checkDateAvailability(date, selectedDress.id)) {
      setDateError('אופס! השמלה כבר תפוסה בתאריך זה. אנא בחרי תאריך אחר או דגם חלופי.');
    } else {
      setDateError('');
    }
  };

  // ביצוע הזמנה ושמירה ב-Supabase + שליחת SMS
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderName || !orderPhone || !orderEmail || !orderDate || !selectedDress) return;
    if (!checkDateAvailability(orderDate, selectedDress.id)) return;

    try {
      // א. שמירה בטבלת bookings ב-Supabase
      const { error: dbError } = await supabase
        .from('bookings')
        .insert([
          {
            dress_id: selectedDress.id,
            date: orderDate,
            customer_name: orderName,
            customer_phone: orderPhone,
            customer_email: orderEmail
          }
        ]);

      if (dbError) throw dbError;

      // ב. שליחת SMS דרך ה-API הקיים
      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: orderName,
          phone: orderPhone,
          email: orderEmail,
          dressName: selectedDress.name,
          date: orderDate
        }),
      });

      await response.json();

      // עדכון הסטייט המקומי עם התאריך החדש
      setBookedDates(prev => ({
        ...prev,
        [selectedDress.id]: [...(prev[selectedDress.id] || []), orderDate]
      }));

      setIsOrdered(true);
      setTimeout(() => {
        setIsOrdered(false);
        setSelectedDress(null);
        setOrderName('');
        setOrderPhone('');
        setOrderEmail('');
        setOrderDate('');
      }, 4000);

    } catch (error) {
      console.error('Error placing order:', error);
      alert('הייתה בעיה ברישום ההזמנה במערכת');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const urlsArray = filesArray.map(file => URL.createObjectURL(file));
      setNewDressData(prev => ({
        ...prev,
        images: [...prev.images, ...urlsArray]
      }));
    }
  };

  // הוספת שמלה חדשה ישירות ל-Supabase
  const handleAddDressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDressData.name || !newDressData.price || !newDressData.size) {
      alert('אנא מלאי שדות חובה (שם, מחיר ומידה)');
      return;
    }

    const imgs = newDressData.images.length > 0 ? 
      newDressData.images : 
      ["https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&auto=format&fit=crop&q=80"];

    const fullDescription = `${newDressData.description || 'אין תיאור זמין.'} | צבע: ${newDressData.color || 'לא צוין'} | מצב: ${
      newDressData.condition === 'new' ? 'חדש עם תווית' : newDressData.condition === 'like-new' ? 'כמו חדש' : 'יד שנייה'
    }`;

    try {
      const { data, error } = await supabase
        .from('dresses')
        .insert([
          {
            name: newDressData.name,
            price: Number(newDressData.price),
            size: newDressData.size,
            condition: newDressData.condition,
            images: imgs,
            description: fullDescription
          }
        ])
        .select();

      if (error) throw error;

      if (data) {
        setDressesList(prev => [data[0], ...prev]);
      }

      setIsAddDressOpen(false);
      setNewDressData({ name: '', price: '', size: '', color: '', condition: 'new', description: '', images: [] });
      alert('השמלה התווספה בהצלחה לקולקציה באתר ובמסד הנתונים!');
    } catch (error) {
      console.error('Error adding dress:', error);
      alert('שגיאה בהוספת השמלה לשרת');
    }
  };

  const filteredDresses = dressesList.filter(dress => {
    const matchesSearch = dress.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPrice = dress.price <= maxPrice;
    const matchesSize = selectedSize === 'All' || dress.size === selectedSize;
    const matchesFav = !showOnlyFavorites || favorites.includes(dress.id);
    return matchesSearch && matchesPrice && matchesSize && matchesFav;
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#fbf8f0] via-[#f3ebd6] to-[#e8dcbd] text-[#332c1e] pb-24 relative overflow-hidden" dir="rtl">
      
      {/* 🌟 מפל נצנצים וחלקיקי זהב זוהרים */}
      <div 
        className="absolute inset-0 opacity-[0.25] pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle, #d4af37 1px, transparent 1px),
            radial-gradient(circle, #f3e5ab 1.5px, transparent 1.5px),
            radial-gradient(circle, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px, 45px 45px, 20px 20px',
          backgroundPosition: '0 0, 15px 20px, 5px 5px'
        }}
      ></div>

      {/* הילות אור נוצצות */}
      <div className="absolute top-[-10%] right-[5%] w-[800px] h-[500px] bg-gradient-to-br from-[#ffd700]/20 to-[#fff8dc]/40 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute top-[40%] left-[-10%] w-[600px] h-[600px] bg-[#fdf5e6]/50 rounded-full blur-[120px] pointer-events-none"></div>

      {/* 🛍️ סרגל עליון מהיר */}
      <nav className="relative z-30 max-w-7xl mx-auto px-6 pt-6 flex justify-between items-center">
        <div className="text-sm font-serif tracking-widest text-[#8b6508] font-bold">שמלה להשכיר</div>
        <div className="flex gap-3 flex-wrap">
          <button 
            onClick={() => setIsAddDressOpen(true)} 
            className="px-4 py-2 bg-gradient-to-r from-[#d4af37] to-[#b8860b] hover:from-[#b8860b] hover:to-[#8b6508] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
          >
            <span>➕</span>
            <span>הוספת שמלה לאתר</span>
          </button>
          
          <button 
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)} 
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-[#dfc48c] shadow-sm ${
              showOnlyFavorites ? 'bg-[#d4af37] text-white' : 'bg-white/90 text-[#8b6508]'
            }`}
          >
            <span>❤️</span>
            <span>מועדפים ({favorites.length})</span>
          </button>
          
          <button 
            onClick={() => setIsCartOpen(true)}
            className="px-4 py-2 bg-[#2c261a] hover:bg-[#b8860b] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
          >
            <span>🛍️</span>
            <span>הסל שלי ({cart.length})</span>
          </button>
        </div>
      </nav>

      {/* 👑 לוגו וכותרת שטיח אדום */}
      <header className="relative pt-14 pb-10 px-6 text-center z-10">
        <div className="inline-block animate-pulse mb-2">
          <span className="text-[11px] uppercase tracking-[0.4em] bg-gradient-to-r from-[#b8860b] via-[#d4af37] to-[#b8860b] bg-clip-text text-transparent font-black">
            ✦ HIGH GLAMOUR EXCLUSIVE ✦
          </span>
        </div>
        <h1 className="text-5xl font-black tracking-tight text-neutral-900 sm:text-6xl drop-shadow-[0_2px_10px_rgba(212,175,55,0.15)]">
          LUXE <span className="font-serif italic font-light bg-gradient-to-r from-[#8b6508] to-[#d4af37] bg-clip-text text-transparent">COUTURE</span>
        </h1>
        <div className="flex items-center justify-center gap-3 mt-4 mb-4">
          <div className="w-16 h-[1px] bg-gradient-to-r from-transparent to-[#d4af37]"></div>
          <span className="text-[#d4af37] text-xs">✦</span>
          <div className="w-16 h-[1px] bg-gradient-to-l from-transparent to-[#d4af37]"></div>
        </div>
        <p className="text-sm text-[#554a33] max-w-lg mx-auto font-medium leading-relaxed">
          המראה הזוהר והנוצץ ביותר לאירוע הבא שלך. דפדפי בקולקציה, סמני מועדפים ושרייני בקליק את התאריך שלך.
        </p>
      </header>

      {/* 🔍 פאנל סינונים קריסטלי מבריק */}
      <section className="max-w-6xl mx-auto px-4 mb-14 relative z-10">
        <div className="bg-white/90 backdrop-blur-xl p-6 rounded-2xl border-2 border-[#e6c687] shadow-[0_20px_50px_rgba(212,175,55,0.18)] grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div>
            <label className="block text-xs font-black text-[#8b6508] tracking-wide mb-2">חפשי שמלה זוהרת</label>
            <input 
              type="text" 
              placeholder="שמלת החלומות שלך..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full p-3 bg-neutral-50/50 border border-[#dfc48c] rounded-xl text-xs text-neutral-900 font-medium focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition placeholder-neutral-400" 
            />
          </div>

          <div>
            <label className="block text-xs font-black text-[#8b6508] tracking-wide mb-2">בחרי מידה</label>
            <div className="flex gap-1.5 bg-[#f5ebd2] p-1 rounded-xl border border-[#dec085]">
              {['All', 'S', 'M', 'L'].map((size) => (
                <button 
                  key={size} 
                  onClick={() => setSelectedSize(size)} 
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedSize === size 
                      ? 'bg-gradient-to-r from-[#d4af37] to-[#aa8010] text-white shadow-md transform scale-102 font-black' 
                      : 'text-[#6d5b3a] hover:text-black hover:bg-white/40'
                  }`}
                >
                  {size === 'All' ? 'הכל' : size}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-black text-[#8b6508] mb-2">
              <span>טווח תקציב</span>
              <span className="text-black font-black bg-[#f5ebd2] px-2 py-0.5 rounded border border-[#dec085]">₪{maxPrice}</span>
            </div>
            <input 
              type="range" 
              min="300" 
              max="1500" 
              step="50" 
              value={maxPrice} 
              onChange={(e) => setMaxPrice(Number(e.target.value))} 
              className="w-full accent-[#d4af37] h-1.5 bg-[#eadaaf] rounded-lg cursor-pointer" 
            />
          </div>
        </div>
      </section>

      {/* 👗 גלריית השמלות */}
      <section className="max-w-6xl mx-auto px-4 relative z-10">
        {loading ? (
          <div className="text-center py-12 text-[#8b6508] font-bold">טוען קולקציה יוקרתית...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {filteredDresses.map((dress) => {
              const currentImgIndex = currentImageIndexes[dress.id] || 0;
              const isFav = favorites.includes(dress.id);
              const inCart = cart.some(item => item.id === dress.id);
              const dressImages = Array.isArray(dress.images) ? dress.images : [dress.images];

              return (
                <div 
                  key={dress.id} 
                  className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden border-2 border-[#ebd3a4]/60 shadow-[0_10px_30px_rgba(212,175,55,0.06)] hover:shadow-[0_25px_60px_rgba(212,175,55,0.22)] hover:border-[#d4af37] transition-all duration-300 transform hover:-translate-y-1"
                >
                  {/* 📸 גלריית התמונות */}
                  <div className="h-[430px] w-full relative overflow-hidden bg-[#faf8f3] p-2.5">
                    <div className="w-full h-full rounded-xl overflow-hidden relative border border-[#f0e2c3]">
                      
                      <button 
                        onClick={(e) => toggleFavorite(dress.id, e)}
                        className="absolute top-3 left-3 z-10 bg-white/90 hover:bg-white w-8 h-8 rounded-full flex items-center justify-center shadow-md border border-[#eadaaf] text-sm transition transform active:scale-90"
                      >
                        {isFav ? '❤️' : '🤍'}
                      </button>

                      <span className="absolute top-3 right-3 z-10 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white text-[10px] font-black px-3 py-1 rounded shadow-md">
                        מידה {dress.size}
                      </span>

                      {dressImages.length > 1 && (
                        <>
                          <button 
                            onClick={(e) => prevImage(dress.id, dressImages.length, e)}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 bg-white/95 text-[#b8860b] w-9 h-9 rounded-full flex items-center justify-center shadow-lg border border-[#e8cc92] font-black text-lg hover:bg-gradient-to-r hover:from-[#d4af37] hover:to-[#b8860b] hover:text-white transition-all opacity-0 group-hover:opacity-100"
                          >
                            ‹
                          </button>
                          <button 
                            onClick={(e) => nextImage(dress.id, dressImages.length, e)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 bg-white/95 text-[#b8860b] w-9 h-9 rounded-full flex items-center justify-center shadow-lg border border-[#e8cc92] font-black text-lg hover:bg-gradient-to-r hover:from-[#d4af37] hover:to-[#b8860b] hover:text-white transition-all opacity-0 group-hover:opacity-100"
                          >
                            ›
                          </button>
                        </>
                      )}

                      <img src={dressImages[currentImgIndex]} alt={dress.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />

                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1 bg-white/95 px-2.5 py-1 rounded-full shadow-md border border-[#e0cba0]">
                        {dressImages.map((_, idx) => (
                          <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === currentImgIndex ? 'bg-[#d4af37] w-3.5' : 'bg-[#e5d9bd]'}`} />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* פרטי השמלה והמחיר */}
                  <div className="p-5 flex flex-col flex-grow bg-gradient-to-b from-white to-[#fdfbf7]">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-lg font-bold text-neutral-900 tracking-wide group-hover:text-[#b8860b] transition-colors">{dress.name}</h3>
                      <button 
                        onClick={(e) => toggleCart(dress, e)}
                        className={`text-xs p-1.5 rounded-lg border transition ${
                          inCart ? 'bg-[#f4ebd4] border-[#d4af37] text-[#b8860b]' : 'border-neutral-200 hover:bg-neutral-50'
                        }`}
                        title={inCart ? "הסר מהסל" : "הוסף לסל שריונות מרוכז"}
                      >
                        {inCart ? '🛒 בסל' : '➕ לסל'}
                      </button>
                    </div>
                    <p className="mt-1.5 text-xs text-[#6e634c] font-normal leading-relaxed line-clamp-2 flex-grow">
                      {dress.description}
                    </p>
                    
                    <div className="flex justify-between items-center mt-5 pt-4 border-t-2 border-dotted border-[#e5d9bd]">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-neutral-400 font-normal">מצב שמלה</span>
                        <span className="text-xs font-bold text-neutral-700">
                          {dress.condition === 'new' ? 'חדש' : dress.condition === 'like-new' ? 'כמו חדש' : 'משומש'}
                        </span>
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] text-neutral-400 block font-normal">מחיר השכרה</span>
                        <span className="text-base font-black text-[#b8860b]">₪{dress.price}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => { setSelectedDress(dress); setModalImageIndex(0); }}
                      className="w-full mt-4 py-2.5 bg-gradient-to-r from-[#2c261a] to-[#4a3f2b] hover:from-[#b8860b] hover:to-[#d4af37] text-white text-xs font-black rounded-xl transition-all shadow-md group-hover:shadow-lg"
                    >
                      ✨ פרטים ושריון תאריך
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 🧾 מדור חוות דעת יוקרתי */}
      <section className="max-w-6xl mx-auto px-4 mt-24 relative z-10">
        <div className="text-center mb-10">
          <span className="text-[10px] tracking-[0.3em] text-[#b8860b] font-black uppercase">WHAT LADY SAYS</span>
          <h2 className="text-3xl font-black mt-1">לקוחות מספרות וממליצות</h2>
          <div className="w-12 h-0.5 bg-[#d4af37] mx-auto mt-3"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {REVIEWS.map((rev, i) => (
            <div key={i} className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-[#ebd3a4]/50 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex text-[#d4af37] text-sm mb-3">{"★".repeat(rev.stars)}</div>
                <p className="text-xs text-[#554a33] font-medium leading-relaxed italic">"{rev.text}"</p>
              </div>
              <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-900">{rev.name}</span>
                <span className="text-[10px] bg-[#f5ebd2] text-[#8b6508] px-2 py-0.5 rounded-full font-bold">{rev.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ❓ שאלות ותשובות נפוצות (FAQ) */}
      <section className="max-w-4xl mx-auto px-4 mt-24 relative z-10">
        <div className="text-center mb-10">
          <span className="text-[10px] tracking-[0.3em] text-[#b8860b] font-black uppercase">QUESTIONS & ANSWERS</span>
          <h2 className="text-3xl font-black mt-1">שאלות נפוצות של שוכרות</h2>
          <div className="w-12 h-0.5 bg-[#d4af37] mx-auto mt-3"></div>
        </div>
        <div className="space-y-3">
          {FAQS.map((faq, i) => {
            const isOpen = activeFaq === i;
            return (
              <div key={i} className="bg-white/80 border border-[#eadaaf] rounded-xl overflow-hidden shadow-2xs transition-all">
                <button 
                  onClick={() => setActiveFaq(isOpen ? null : i)}
                  className="w-full p-4 flex justify-between items-center text-right font-bold text-xs sm:text-sm text-neutral-900 hover:bg-[#faf6eb] transition-colors"
                >
                  <span>{faq.q}</span>
                  <span className={`text-[#b8860b] font-black transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                </button>
                <div className={`transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-40 border-t border-[#f4ebd4]' : 'max-h-0'}`}>
                  <p className="p-4 text-xs text-[#554a33] leading-relaxed font-medium bg-[#fdfcf9]">{faq.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 🛍️ מגירה צידית - הסל שלי */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex justify-end" onClick={() => setIsCartOpen(false)}>
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col justify-between" onClick={e => e.stopPropagation()}>
            <div>
              <div className="flex justify-between items-center pb-4 border-b">
                <h3 className="text-xl font-black text-neutral-900 flex items-center gap-2">
                  <span>🛍️</span> סל השריונות המרוכז שלך
                </h3>
                <button onClick={() => setIsCartOpen(false)} className="text-xl font-bold hover:text-red-500 text-neutral-400">✕</button>
              </div>
              
              {cart.length === 0 ? (
                <div className="text-center py-20 text-neutral-400 text-sm">הסל שלך ריק כרגע. סמני שמלות שמוצאות חן בעינייך!</div>
              ) : (
                <div className="mt-4 space-y-3 overflow-y-auto max-h-[60vh] pr-1">
                  {cart.map(item => (
                    <div key={item.id} className="flex gap-3 bg-neutral-50 p-3 rounded-xl border border-neutral-100 items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={Array.isArray(item.images) ? item.images[0] : item.images} alt={item.name} className="w-14 h-14 object-cover rounded-lg border border-[#eadaaf]" />
                        <div>
                          <h4 className="text-xs font-bold text-neutral-900">{item.name}</h4>
                          <span className="text-[10px] text-neutral-400 block mt-0.5">מידה {item.size} | ₪{item.price}</span>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => toggleCart(item, e)}
                        className="text-xs text-red-500 hover:bg-red-50 p-1.5 rounded-lg font-bold"
                      >
                        הסר
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex justify-between font-black text-sm mb-4">
                  <span>סך הכל מוצרים:</span>
                  <span className="text-[#b8860b]">{cart.length} שמלות</span>
                </div>
                <button 
                  onClick={() => { setIsCartOpen(false); setSelectedDress(cart[0]); }}
                  className="w-full py-3 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white text-xs font-black rounded-xl text-center shadow-lg hover:from-[#b8860b]"
                >
                  🏁 המשיכי לשריון השמלה הראשונה בסל
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ➕ מודאל הוספת שמלה חדשה */}
      {isAddDressOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setIsAddDressOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsAddDressOpen(false)} className="absolute top-4 left-4 text-neutral-400 hover:text-black font-bold text-lg">✕</button>
            <h3 className="text-xl font-black text-neutral-900 mb-4 flex items-center gap-2">✨ הוספת דגם יוקרתי חדש לקולקציה</h3>
            
            <form onSubmit={handleAddDressSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-600 mb-1">שם השמלה (שדה חובה)</label>
                <input type="text" placeholder="למשל: שמלת נצנצים רוז גולד" required value={newDressData.name} onChange={e => setNewDressData(prev => ({ ...prev, name: e.target.value }))} className="w-full p-2.5 bg-neutral-50 border rounded-xl text-xs focus:outline-none focus:border-[#d4af37]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1">מחיר השכרה (₪ חובה)</label>
                  <input type="number" placeholder="400" required value={newDressData.price} onChange={e => setNewDressData(prev => ({ ...prev, price: e.target.value }))} className="w-full p-2.5 bg-neutral-50 border rounded-xl text-xs focus:outline-none focus:border-[#d4af37]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1">מידה (חובה)</label>
                  <select value={newDressData.size} required onChange={e => setNewDressData(prev => ({ ...prev, size: e.target.value }))} className="w-full p-2.5 bg-neutral-50 border rounded-xl text-xs focus:outline-none focus:border-[#d4af37]">
                    <option value="">בחרי...</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1">צבע דומיננטי</label>
                  <input type="text" placeholder="זהב, שחור, קורל" value={newDressData.color} onChange={e => setNewDressData(prev => ({ ...prev, color: e.target.value }))} className="w-full p-2.5 bg-neutral-50 border rounded-xl text-xs focus:outline-none focus:border-[#d4af37]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1">מצב הפריט</label>
                  <select value={newDressData.condition} onChange={e => setNewDressData(prev => ({ ...prev, condition: e.target.value }))} className="w-full p-2.5 bg-neutral-50 border rounded-xl text-xs focus:outline-none focus:border-[#d4af37]">
                    <option value="new">חדש לחלוטין (עם תווית)</option>
                    <option value="like-new">כמו חדש (נלבש פעם אחת)</option>
                    <option value="good">יד שנייה במצב מעולה</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-600 mb-1">תיאור קצר ומפתה</label>
                <textarea rows={3} placeholder="ספרי על הבד, הגזרה, הגובה שמתאים..." value={newDressData.description} onChange={e => setNewDressData(prev => ({ ...prev, description: e.target.value }))} className="w-full p-2.5 bg-neutral-50 border rounded-xl text-xs focus:outline-none focus:border-[#d4af37] resize-none"></textarea>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-600 mb-1">העלאת תמונות (אפשר לבחור כמה ביחד)</label>
                <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="w-full text-xs text-neutral-500 file:ml-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#f5ebd2] file:text-[#8b6508] hover:file:bg-[#eadaaf] cursor-pointer" />
                {newDressData.images.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {newDressData.images.map((img, index) => (
                      <img key={index} src={img} className="w-12 h-12 object-cover rounded-lg border" alt="תצוגה מקדימה" />
                    ))}
                  </div>
                )}
              </div>
              <button type="submit" className="w-full py-3 bg-gradient-to-r from-[#d4af37] via-[#b8860b] to-[#d4af37] text-white text-xs font-black rounded-xl shadow-md transition-transform active:scale-98">
                🚀 פרסמי את השמלה במסד ובאתר
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 🔮 מודאל פירוט שמלה ושריון תאריך */}
      {selectedDress && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setSelectedDress(null)}>
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl relative overflow-hidden grid grid-cols-1 md:grid-cols-2 max-h-[95vh] md:max-h-none" onClick={e => e.stopPropagation()}>
            
            <button onClick={() => setSelectedDress(null)} className="absolute top-4 left-4 z-30 bg-white/80 hover:bg-white w-8 h-8 rounded-full flex items-center justify-center shadow font-bold text-neutral-600">✕</button>

            {/* חצי שמאלי: גלריית מודאל מורחבת */}
            <div className="relative bg-neutral-50 p-4 flex flex-col justify-center h-[300px] md:h-[580px]">
              <div className="w-full h-full rounded-xl overflow-hidden relative border">
                
                {selectedDress.images.length > 1 && (
                  <>
                    <button 
                      onClick={() => setModalImageIndex(prev => (prev - 1 + selectedDress.images.length) % selectedDress.images.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 text-[#b8860b] w-8 h-8 rounded-full flex items-center justify-center shadow border border-[#ebd3a4] font-black"
                    >
                      ‹
                    </button>
                    <button 
                      onClick={() => setModalImageIndex(prev => (prev + 1) % selectedDress.images.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 text-[#b8860b] w-8 h-8 rounded-full flex items-center justify-center shadow border border-[#ebd3a4] font-black"
                    >
                      ›
                    </button>
                  </>
                )}

                <img src={selectedDress.images[modalImageIndex]} alt={selectedDress.name} className="w-full h-full object-cover" />

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 bg-white/90 px-2 py-0.5 rounded-full border">
                  {selectedDress.images.map((_: any, idx: number) => (
                    <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all ${idx === modalImageIndex ? 'bg-[#d4af37] w-3' : 'bg-neutral-300'}`} />
                  ))}
                </div>
              </div>
            </div>

            {/* חצי ימני: טופס הזמנה ופרטים */}
            <div className="p-6 flex flex-col justify-between max-y-auto overflow-y-auto">
              <div>
                <span className="text-[10px] tracking-widest text-[#b8860b] font-black uppercase block mb-1">DRESS SPECIFICATIONS</span>
                <h2 className="text-2xl font-black text-neutral-900 leading-tight">{selectedDress.name}</h2>
                
                <div className="flex gap-4 items-center mt-2 pb-4 border-b border-neutral-100">
                  <span className="text-xl font-black text-[#8b6508]">₪{selectedDress.price}</span>
                  <span className="text-xs font-bold bg-[#f5ebd2] text-[#8b6508] px-3 py-1 rounded-md">מידה {selectedDress.size}</span>
                </div>

                <p className="text-xs text-[#554a33] font-medium leading-relaxed mt-4 bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                  {selectedDress.description}
                </p>

                {bookedDates[selectedDress.id]?.length > 0 && (
                  <div className="mt-4">
                    <span className="text-[10px] font-black text-red-500 block mb-1">🚨 תאריכים שכבר תפוסים וסגורים:</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {bookedDates[selectedDress.id].map((d, index) => (
                        <span key={index} className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-md border border-red-100 font-bold">{d}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* טופס או מסך הצלחה */}
              {isOrdered ? (
                <div className="mt-6 p-6 bg-emerald-50 border-2 border-dashed border-emerald-400 rounded-xl text-center animate-bounce">
                  <span className="text-3xl block mb-2">🎉</span>
                  <h4 className="text-emerald-800 font-black text-sm">השריון נרשם במסד הנתונים בהצלחה!</h4>
                  <p className="text-emerald-600 text-xs mt-1 font-medium">הודעת SMS חגיגית עם אישור נשלחה לנייד שלך.</p>
                </div>
              ) : (
                <form onSubmit={handlePlaceOrder} className="mt-6 space-y-3 pt-4 border-t border-neutral-100">
                  <h4 className="text-xs font-black text-neutral-900 uppercase tracking-wide">📅 שרייני את האירוע שלך כעת</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="שמך המלא" required value={orderName} onChange={e => setOrderName(e.target.value)} className="w-full p-2.5 bg-neutral-50 border rounded-xl text-xs focus:outline-none focus:border-[#d4af37]" />
                    <input type="tel" placeholder="טלפון נייד" required value={orderPhone} onChange={e => setOrderPhone(e.target.value)} className="w-full p-2.5 bg-neutral-50 border rounded-xl text-xs focus:outline-none focus:border-[#d4af37]" />
                  </div>
                  <div>
                    <input type="email" placeholder="כתובת אימייל לעדכונים" required value={orderEmail} onChange={e => setOrderEmail(e.target.value)} className="w-full p-2.5 bg-neutral-50 border rounded-xl text-xs focus:outline-none focus:border-[#d4af37]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 mb-1">בחרי את תאריך הערב המיוחל:</label>
                    <input type="date" required value={orderDate} onChange={e => handleDateChange(e.target.value)} className="w-full p-2.5 bg-neutral-50 border rounded-xl text-xs focus:outline-none focus:border-[#d4af37]" />
                    {dateError && <p className="text-[10px] text-red-500 font-bold mt-1 leading-normal">{dateError}</p>}
                  </div>

                  <button 
                    type="submit" 
                    disabled={!!dateError}
                    className={`w-full text-white text-xs font-black py-3.5 rounded-xl mt-1 transition-all duration-300 shadow-lg transform active:scale-98 ${
                      dateError 
                        ? 'bg-neutral-300 cursor-not-allowed shadow-none' 
                        : 'bg-gradient-to-r from-[#d4af37] via-[#b8860b] to-[#d4af37] hover:from-[#b8860b] hover:to-[#8b6508]'
                    }`}
                  >
                    אשרי שריון דגם חלומותיי
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 📱 כפתור צף קבוע לצ'אט מהיר ב-WhatsApp */}
      <a 
        href="https://wa.me/972500000000?text=%D7%94%D7%99%D7%95%D7%A5%20%D7%90%D7%A0%D7%99%20%D7%99%D7%A9%D7%9E%D7%97%20%D7%9C%D7%91%D7%A4%D7%A8%D7%98%D7%99%D7%9D%20%D7%A0%D7%A5%D7%A3%25"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 bg-emerald-500 hover:bg-emerald-600 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-110 active:scale-95 text-xl font-bold"
        title="צ'אט מהיר ב-WhatsApp"
      >
        💬
      </a>
    </main>
  );
}
