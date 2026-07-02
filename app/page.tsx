'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// אתחול ה-Supabase ישירות בצד הלקוח (בטוח לשימוש עם Anon Key)
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

// רשימת שמלות גיבוי / ראשוניות למקרה שהבסיס נתונים ריק בהתחלה
const INITIAL_DRESSES = [
  { 
    id: 1, 
    name: "שמלת ערב קלאסית קורל", 
    price: 350, 
    size: "M", 
    condition: "like-new",
    images: [
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1539008835657-9e8e818128e5?w=600&auto=format&fit=crop&q=80"
    ], 
    description: "שמלת ערב נשפכת בגוון קורל יוקרתי, מתאימה לחתונה או אירוע ערב חגיגי. בד נעים ומחטב." 
  },
  { 
    id: 2, 
    name: "שמלת נשף ספיר כחולה", 
    price: 450, 
    size: "S", 
    condition: "new",
    images: [
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1518887570146-0612132dd618?w=600&auto=format&fit=crop&q=80"
    ], 
    description: "שמלת מקסי מלכותית בצבע כחול ספיר עמוק עם מפתח וי עדין בחזה ומחטב פנימי מובנה." 
  },
  { 
    id: 3, 
    name: "שמלת פייאטים נוצצת רוז גולד", 
    price: 550, 
    size: "L", 
    condition: "like-new",
    images: [
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&auto=format&fit=crop&q=80"
    ], 
    description: "למראה הוליוודי שאי אפשר לפספס – שמלת פייאטים בגזרת בת הים, נמתחת ומחמיאה בטירוף." 
  }
];

export default function Home() {
  const [dressesList, setDressesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // פילטרים לשמלות
  const [searchTerm, setSearchTerm] = useState('');
  const [maxPrice, setMaxPrice] = useState(600);
  const [selectedSize, setSelectedSize] = useState('All');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // מועדפים וסל שריונות
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

  // תאריכים תפוסים ומודאל שריון הזמנה
  const [bookedDates, setBookedDates] = useState<{ [dressId: number]: string[] }>({});
  const [selectedDress, setSelectedDress] = useState<any | null>(null);
  const [orderName, setOrderName] = useState('');
  const [orderPhone, setOrderPhone] = useState('');
  const [orderEmail, setOrderEmail] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [isOrdered, setIsOrdered] = useState(false);
  const [dateError, setDateError] = useState('');

  // אינדקס גלריות ואקורדיון
  const [currentImageIndexes, setCurrentImageIndexes] = useState<{ [key: number]: number }>({});
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // טעינת נתונים ראשונית מה-LocalStorage וממסד הנתונים
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
      
      // שליפת שמלות ישירות מ-Supabase
      const { data: dresses, error: dressesError } = await supabase
        .from('dresses')
        .select('*')
        .order('created_at', { ascending: false });

      if (dressesError) throw dressesError;

      // שליפת תאריכים תפוסים מטבלת ההזמנות
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('dress_id, date');

      if (bookingsError) throw bookingsError;

      const booked: { [dressId: number]: string[] } = {};
      bookings?.forEach((b: any) => {
        if (!booked[b.dress_id]) booked[b.dress_id] = [];
        booked[b.dress_id].push(b.date);
      });

      // אם יש נתונים ב-DB נשתמש בהם, אחרת נשתמש ברשימה ההתחלתית
      const finalDresses = dresses && dresses.length > 0 ? dresses : INITIAL_DRESSES;
      setDressesList(finalDresses);
      setBookedDates(booked);

      const indexes: { [key: number]: number } = {};
      finalDresses.forEach((d: any) => { indexes[d.id] = 0; });
      setCurrentImageIndexes(indexes);
    } catch (error) {
      console.error('Error loading data from Supabase, using initial data:', error);
      setDressesList(INITIAL_DRESSES);
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
    setCurrentImageIndexes(prev => ({ ...prev, [dressId]: ((prev[dressId] || 0) + 1) % maxImages }));
  };

  const prevImage = (dressId: number, maxImages: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndexes(prev => ({ ...prev, [dressId]: ((prev[dressId] || 0) - 1 + maxImages) % maxImages }));
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
    if (!orderName || !orderPhone || !orderEmail || !orderDate || !selectedDress) return;

    try {
      // שמירת ההזמנה ישירות בטבלת bookings ב-Supabase
      const { error: dbError } = await supabase.from('bookings').insert([
        { 
          dress_id: selectedDress.id, 
          date: orderDate, 
          customer_name: orderName, 
          customer_phone: orderPhone, 
          customer_email: orderEmail 
        }
      ]);

      if (dbError) throw dbError;

      // ניסיון קריאה ל-SMS (אם ה-Route קיים, לא יכשיל את הקוד אם לא מוגדר)
      try {
        await fetch('/api/send-sms', {
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
      } catch (smsErr) {
        console.warn("SMS endpoint not found, skipped.");
      }

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

  const handleAddDressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDressData.name || !newDressData.price || !newDressData.size) {
      alert('אנא מלאי שדות חובה (שם, מחיר ומידה)');
      return;
    }

    const descriptionString = `${newDressData.description || 'אין תיאור זמין.'} | צבע: ${newDressData.color || 'לא צוין'} | מצב: ${
      newDressData.condition === 'new' ? 'חדש עם תווית' : newDressData.condition === 'like-new' ? 'כמו חדש' : 'יד שנייה'
    }`;

    const finalImages = newDressData.images.length > 0 ? newDressData.images : ["https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&auto=format&fit=crop&q=80"];

    try {
      // הוספה ישירות לטבלת dresses ב-Supabase
      const { data, error } = await supabase.from('dresses').insert([
        {
          name: newDressData.name,
          price: Number(newDressData.price),
          size: newDressData.size,
          condition: newDressData.condition,
          images: finalImages,
          description: descriptionString
        }
      ]).select();

      if (error) throw error;

      if (data) {
        setDressesList(prev => [data[0], ...prev]);
      }
      setIsAddDressOpen(false);
      setNewDressData({ name: '', price: '', size: '', color: '', condition: 'new', description: '', images: [] });
      alert('השמלה התווספה בהצלחה!');
    } catch (error) {
      console.error('Error adding dress:', error);
      alert('שגיאה בהוספת השמלה למסד הנתונים');
    }
  };

  const filteredDresses = dressesList.filter(dress => {
    const matchesSearch = dress.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPrice = dress.price <= maxPrice;
    const matchesSize = selectedSize === 'All' || dress.size === selectedSize;
    const matchesFav = !showOnlyFavorites || favorites.includes(dress.id);
    return matchesSearch && matchesPrice && matchesSize && matchesFav;
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#fbf8f0] via-[#f3ebd6] to-[#e8dcbd] text-[#332c1e] pb-24 relative overflow-hidden" dir="rtl">
      
      {/* רקע פירורים זוהר */}
      <div className="absolute inset-0 opacity-[0.25] pointer-events-none" style={{ backgroundImage: `radial-gradient(circle, #d4af37 1px, transparent 1px)`, backgroundSize: '30px 30px' }}></div>

      {/* נאב בר עליון */}
      <nav className="relative z-30 max-w-7xl mx-auto px-6 pt-6 flex justify-between items-center">
        <div className="text-sm font-serif tracking-widest text-[#8b6508] font-bold">LUXE COUTURE</div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => setIsAddDressOpen(true)} className="px-4 py-2 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white rounded-xl text-xs font-bold shadow-md hover:scale-102 transition-all">➕ הוספת שמלה</button>
          <button onClick={() => setShowOnlyFavorites(!showOnlyFavorites)} className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${showOnlyFavorites ? 'bg-[#d4af37] text-white' : 'bg-white text-[#8b6508]'}`}>❤️ מועדפים ({favorites.length})</button>
          <button onClick={() => setIsCartOpen(true)} className="px-4 py-2 bg-[#2c261a] text-white rounded-xl text-xs font-bold shadow-md hover:bg-neutral-800 transition-all">🛍️ הסל שלי ({cart.length})</button>
        </div>
      </nav>

      {/* כותרת ראשית */}
      <header className="relative pt-14 pb-10 px-6 text-center z-10">
        <h1 className="text-5xl font-black text-neutral-900 sm:text-6xl">LUXE <span className="font-serif italic font-light text-[#d4af37]">COUTURE</span></h1>
        <p className="text-sm text-[#554a33] max-w-lg mx-auto mt-4">דפדפי בקולקציה, סמני מועדפים ושרייני בקליק את התאריך שלך בשנייה.</p>
      </header>

      {/* פאנל סינונים קריסטלי */}
      <section className="max-w-6xl mx-auto px-4 mb-14 relative z-10">
        <div className="bg-white/90 p-6 rounded-2xl border-2 border-[#e6c687] shadow-lg grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div>
            <label className="block text-xs font-black text-[#8b6508] mb-2">חפשי שמלה</label>
            <input type="text" placeholder="שמלת החלומות שלך..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-3 bg-neutral-50 border border-[#dfc48c] rounded-xl text-xs text-neutral-900 font-medium focus:outline-none focus:border-[#d4af37]" />
          </div>
          <div>
            <label className="block text-xs font-black text-[#8b6508] mb-2">מידה</label>
            <div className="flex gap-1.5 bg-[#f5ebd2] p-1 rounded-xl">
              {['All', 'S', 'M', 'L'].map((size) => (
                <button key={size} onClick={() => setSelectedSize(size)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedSize === size ? 'bg-[#d4af37] text-white font-black' : 'text-[#6d5b3a]'}`}>{size === 'All' ? 'הכל' : size}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs font-black text-[#8b6508] mb-2"><span>תקציב מקסימלי</span><span className="text-black font-black">₪{maxPrice}</span></div>
            <input type="range" min="300" max="1000" step="50" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-[#d4af37]" />
          </div>
        </div>
      </section>

      {/* גלריית השמלות המרכזית */}
      <section className="max-w-6xl mx-auto px-4 relative z-10">
        {loading ? (
          <div className="text-center py-12 text-[#8b6508] font-bold animate-pulse">טוען קולקציה יוקרתית...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {filteredDresses.map((dress) => {
              const currentImgIndex = currentImageIndexes[dress.id] || 0;
              const dressImages = Array.isArray(dress.images) ? dress.images : [dress.images];
              return (
                <div key={dress.id} className="group bg-white rounded-2xl overflow-hidden border-2 border-[#ebd3a4]/60 shadow-md hover:border-[#d4af37] flex flex-col h-full hover:shadow-xl transition-all duration-300">
                  <div className="h-[430px] w-full relative bg-[#faf8f3] p-2.5">
                    <div className="w-full h-full rounded-xl overflow-hidden relative">
                      <button onClick={(e) => toggleFavorite(dress.id, e)} className="absolute top-3 left-3 z-10 bg-white/95 w-8 h-8 rounded-full shadow-md text-sm transition transform active:scale-90 flex items-center justify-center">{favorites.includes(dress.id) ? '❤️' : '🤍'}</button>
                      <span className="absolute top-3 right-3 z-10 bg-[#d4af37] text-white text-[10px] font-black px-3 py-1 rounded shadow-sm">מידה {dress.size}</span>
                      
                      {dressImages.length > 1 && (
                        <>
                          <button onClick={(e) => prevImage(dress.id, dressImages.length, e)} className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 text-[#b8860b] w-7 h-7 rounded-full text-center font-bold shadow hover:bg-white">‹</button>
                          <button onClick={(e) => nextImage(dress.id, dressImages.length, e)} className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 text-[#b8860b] w-7 h-7 rounded-full text-center font-bold shadow hover:bg-white">›</button>
                        </>
                      )}
                      <img src={dressImages[currentImgIndex]} alt={dress.name} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" />
                    </div>
                  </div>

                  <div className="p-5 flex flex-col flex-grow">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-lg font-bold text-neutral-900 group-hover:text-[#b8860b] transition-colors">{dress.name}</h3>
                      <button onClick={(e) => toggleCart(dress, e)} className="text-xs p-1.5 rounded-lg border font-medium whitespace-nowrap">{cart.some(item => item.id === dress.id) ? '🛒 בסל' : '➕ לסל'}</button>
                    </div>
                    <p className="mt-1.5 text-xs text-[#6e634c] line-clamp-2 flex-grow leading-relaxed">{dress.description}</p>
                    <div className="flex justify-between items-center mt-5 pt-4 border-t border-dashed border-[#eadaaf]">
                      <span className="text-neutral-900 font-black text-lg">₪{dress.price}</span>
                      <button onClick={() => setSelectedDress(dress)} className="bg-[#2c261a] hover:bg-[#d4af37] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm">שרייני תאריך</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* מודאל הוספת שמלה חדשה */}
      {isAddDressOpen && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border-2 border-[#d4af37]" style={{ direction: 'rtl' }}>
            <button onClick={() => setIsAddDressOpen(false)} className="absolute top-4 left-4 font-bold text-neutral-500 hover:text-black">✕</button>
            <h3 className="text-xl font-black text-center mb-4">הוספת דגם חדש לקולקציה</h3>
            <form onSubmit={handleAddDressSubmit} className="flex flex-col gap-4">
              <input type="text" required placeholder="שם הדגם (למשל: שמלת נצנצים פנינה)" value={newDressData.name} onChange={(e) => setNewDressData({...newDressData, name: e.target.value})} className="w-full p-2.5 border rounded-xl text-xs text-neutral-950 focus:outline-none" />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" required placeholder="מחיר השכרה (₪)" value={newDressData.price} onChange={(e) => setNewDressData({...newDressData, price: e.target.value})} className="w-full p-2.5 border rounded-xl text-xs text-neutral-950 focus:outline-none" />
                <select required value={newDressData.size} onChange={(e) => setNewDressData({...newDressData, size: e.target.value})} className="w-full p-2.5 border rounded-xl text-xs text-neutral-950 focus:outline-none">
                  <option value="">בחרי מידה...</option>
                  <option value="XS">XS</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                </select>
              </div>
              <textarea rows={3} placeholder="תיאור קצר על השמלה..." value={newDressData.description} onChange={(e) => setNewDressData({...newDressData, description: e.target.value})} className="w-full p-2.5 border rounded-xl text-xs resize-none text-neutral-950 focus:outline-none" />
              <button type="submit" className="w-full bg-[#d4af37] hover:bg-[#b8860b] text-white font-bold py-3 rounded-xl shadow transition-all">פרסמי באתר ✨</button>
            </form>
          </div>
        </div>
      )}

      {/* מודאל שריון תאריך */}
      {selectedDress && (
        <div className="fixed inset-0 bg-neutral-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setSelectedDress(null)}>
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative" onClick={e => e.stopPropagation()} style={{ direction: 'rtl' }}>
            <button onClick={() => setSelectedDress(null)} className="absolute top-4 left-4 font-bold text-[#b8860b]">✕</button>
            {isOrdered ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2 animate-bounce">👑</div>
                <h4 className="text-lg font-black text-[#8b6508]">השריון נשמר בהצלחה במסד הנתונים!</h4>
              </div>
            ) : (
              <form onSubmit={handlePlaceOrder} className="space-y-3">
                <h3 className="text-md font-bold text-neutral-950 mb-4">שריון דגם: {selectedDress.name}</h3>
                <input type="text" required placeholder="שם מלא" value={orderName} onChange={e => setOrderName(e.target.value)} className="w-full p-2 border rounded-xl text-xs text-neutral-950" />
                <input type="tel" required placeholder="טלפון נייד" value={orderPhone} onChange={e => setOrderPhone(e.target.value)} className="w-full p-2 border rounded-xl text-xs text-neutral-950" />
                <input type="email" required placeholder="אימייל" value={orderEmail} onChange={e => setOrderEmail(e.target.value)} className="w-full p-2 border rounded-xl text-xs text-neutral-950" />
                <input type="date" required value={orderDate} onChange={e => handleDateChange(e.target.value)} className="w-full p-2 border rounded-xl text-xs font-bold text-neutral-950" />
                {dateError && <p className="text-red-500 text-[11px] font-bold">{dateError}</p>}
                <button type="submit" disabled={!!dateError} className="w-full text-white bg-[#d4af37] disabled:bg-neutral-300 py-3 rounded-xl text-xs font-black transition-all shadow">אשרי שריון דגם</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* חוות דעת */}
      <section className="max-w-6xl mx-auto px-4 mt-24">
        <h2 className="text-2xl font-serif text-center italic mb-8 text-neutral-900">מה הלקוחות שלנו מספרות</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {REVIEWS.map((rev, i) => (
            <div key={i} className="bg-white/80 p-6 rounded-2xl border border-[#eadaaf] shadow-sm flex flex-col justify-between"><p className="text-xs text-neutral-700 italic">"{rev.text}"</p><span className="text-xs font-bold mt-3 block text-neutral-900">{rev.name}</span></div>
          ))}
        </div>
      </section>

      {/* אקורדיון שאלות ותשובות */}
      <section className="max-w-3xl mx-auto px-4 mt-16">
        <div className="flex flex-col gap-3">
          {FAQS.map((faq, idx) => (
            <div key={idx} className="bg-white border border-[#ebd4a8] rounded-xl overflow-hidden shadow-sm">
              <button onClick={() => setActiveFaq(activeFaq === idx ? null : idx)} className="w-full p-4 text-right flex justify-between items-center font-bold text-xs text-neutral-900"><span>{faq.q}</span><span>{activeFaq === idx ? '−' : '＋'}</span></button>
              {activeFaq === idx && <div className="p-4 bg-[#fffdf9] border-t text-xs text-[#5c5037] leading-relaxed">{faq.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* מודאל סל צדדי */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm z-50 flex justify-end" onClick={() => setIsCartOpen(false)}>
          <div className="bg-white w-full max-w-md h-full p-6 shadow-2xl flex flex-col justify-between" onClick={e => e.stopPropagation()} style={{ direction: 'rtl' }}>
            <div>
              <div className="flex justify-between items-center pb-4 border-b">
                <h3 className="text-lg font-bold text-neutral-950">סל השריונות שלך 🛒</h3>
                <button onClick={() => setIsCartOpen(false)} className="text-lg font-bold text-neutral-500 hover:text-black">✕</button>
              </div>
              {cart.length === 0 ? <p className="text-xs text-center py-12 text-neutral-500">הסל שלך עדיין ריק...</p> : (
                <div className="flex flex-col gap-4 mt-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex gap-3 items-center p-3 border rounded-xl justify-between bg-neutral-50">
                      <div>
                        <h4 className="text-xs font-bold text-neutral-900">{item.name}</h4>
                        <span className="text-xs font-black text-[#b8860b]">₪{item.price}</span>
                      </div>
                      <button onClick={(e) => toggleCart(item, e)} className="text-xs text-red-500 hover:underline">הסרה</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 📱 כפתור צף קבוע לצ'אט מהיר ב-WhatsApp */}
      <a 
        href="https://wa.me/972500000000?text=%D7%94%D7%99%D7%95%D7%A5%20%D7%90%D7%A0%D7%99%20%D7%99%D7%A9%D7%9E%D7%97%20%D7%9C%D7%91%D7%A4%D7%A8%D7%98%D7%99%D7%9D"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:bg-[#20ba5a] hover:scale-110 transition-all duration-300 flex items-center justify-center gap-2"
        title="צ'אט מהיר ב-WhatsApp"
      >
        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.455L0 24zm6.59-4.846c1.66.986 3.296 1.481 5.352 1.482 5.434 0 9.853-4.384 9.856-9.773.001-2.611-1.013-5.066-2.857-6.91-1.846-1.843-4.298-2.856-6.906-2.857-5.442 0-9.86 4.384-9.863 9.776-.001 1.942.511 3.512 1.483 5.127l-.993 3.626 3.728-.976z"/>
        </svg>
      </a>

    </main>
  );
}
