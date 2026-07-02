'use client';

import React, { useState, useEffect } from 'react';

// נתוני ה-FAQs וה-Reviews נשארים סטטיים כפי שהיו בקוד המקורי שלך
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
  // רשימת שמלות שמתחילה ריקה ונטענת מה-API
  const [dressesList, setDressesList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // תאריכים ומודאל שריון הזמנה
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

  // טעינת השמלות מה-API ושימוש ב-LocalStorage למועדפים
  useEffect(() => {
    async function loadInitialData() {
      try {
        const res = await fetch('/api/dresses');
        const data = await res.json();
        if (Array.isArray(data)) {
          setDressesList(data);
        }
      } catch (err) {
        console.error("Failed to fetch dresses from API:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();

    const savedFavs = localStorage.getItem('luxe_favs');
    if (savedFavs) setFavorites(JSON.parse(savedFavs));
    const savedCart = localStorage.getItem('luxe_cart');
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

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

  // שליחת טופס הזמנה ורישום ה-SMS
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderName || !orderPhone || !orderEmail || !orderDate || !selectedDress) return;

    try {
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

      const data = await response.json();
      if (data.success) {
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
      } else {
        alert('הייתה בעיה ברישום ההזמנה במערכת');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('תקלה בתקשורת עם השרת');
    }
  };

  // שליחת שמלה חדשה ל-API על מנת שתשמר בבסיס הנתונים
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
      const res = await fetch('/api/dresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDressData.name,
          price: Number(newDressData.price),
          size: newDressData.size,
          condition: newDressData.condition,
          images: finalImages,
          description: descriptionString
        })
      });

      const result = await res.json();

      if (result.success) {
        // הוספה אופטימית ישירות למסך ללא צורך בריענון הדף
        setDressesList(prev => [result.data[0], ...prev]);
        setIsAddDressOpen(false);
        setNewDressData({ name: '', price: '', size: '', color: '', condition: 'new', description: '', images: [] });
        alert('השמלה נוספה בהצלחה למסד הנתונים והתווספה לקולקציה באתר!');
      } else {
        alert('שגיאה בשמירה למסד הנתונים: ' + result.error);
      }
    } catch (err) {
      console.error(err);
      alert('תקלת שרת בעת שמירת השמלה');
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
        <div className="text-sm font-serif tracking-widest text-[#8b6508] font-bold">LUXE COUTURE</div>
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
              max="1000" 
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
        {isLoading ? (
          <div className="text-center py-12 text-[#8b6508] font-bold animate-pulse">טוען קולקציה יוקרתית ממסד הנתונים...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {filteredDresses.map((dress) => {
              const currentImgIndex = currentImageIndexes[dress.id] || 0;
              const dressImages = Array.isArray(dress.images) ? dress.images : [dress.images];
              const isFav = favorites.includes(dress.id);
              const inCart = cart.some(item => item.id === dress.id);
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

                      {/* חצים */}
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
                      >
                        {inCart ? '🛒 בסל' : '➕ לסל'}
                      </button>
                    </div>
                    <p className="mt-1.5 text-xs text-[#6e634c] font-normal leading-relaxed line-clamp-2 flex-grow">
                      {dress.description}
                    </p>
                    
                    <div className="flex justify-between items-center mt-5 pt-4 border-t-2 border-dotted border-[#f0e6cc]">
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase tracking-widest text-[#b8860b] font-black">השכרה חגיגית</span>
                        <span className="text-neutral-900 font-black text-lg">₪{dress.price}</span>
                      </div>
                      <button 
                        onClick={() => setSelectedDress(dress)} 
                        className="bg-gradient-to-r from-[#2c261a] to-[#4a3f2b] hover:from-[#d4af37] hover:to-[#b8860b] text-white text-xs font-bold px-4 py-3 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg transform active:scale-98"
                      >
                        שרייני לערב הזוהר שלך
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ✨ מודאל הוספת שמלה לאתר ✨ */}
      {isAddDressOpen && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border-2 border-[#d4af37] max-h-[90vh] overflow-y-auto" style={{ direction: 'rtl' }}>
            <button 
              onClick={() => setIsAddDressOpen(false)} 
              className="absolute top-4 left-4 bg-neutral-100 hover:bg-[#d4af37] text-[#b8860b] hover:text-white w-8 h-8 rounded-full flex items-center justify-center border shadow-sm font-bold transition-all"
            >
              ✕
            </button>

            <div className="text-center mb-5">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#b8860b] font-black block mb-1">✦ ADD TO THE COLLECTION ✦</span>
              <h3 className="text-xl font-black text-neutral-950">הוספת דגם שמלה חדש</h3>
              <div className="w-12 h-[1px] bg-[#d4af37] mx-auto mt-2"></div>
            </div>

            <form onSubmit={handleAddDressSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-[#8b6508] mb-1">שם הדגם / השמלה *</label>
                <input type="text" required placeholder="למשל: שמלת משי פנינה" value={newDressData.name} onChange={(e) => setNewDressData({...newDressData, name: e.target.value})} className="w-full p-2.5 bg-neutral-50 border border-[#decfa8] rounded-xl text-xs font-medium focus:outline-none focus:border-[#d4af37]" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#8b6508] mb-1">מחיר השכרה (₪) *</label>
                  <input type="number" required placeholder="350" value={newDressData.price} onChange={(e) => setNewDressData({...newDressData, price: e.target.value})} className="w-full p-2.5 bg-neutral-50 border border-[#decfa8] rounded-xl text-xs font-medium focus:outline-none focus:border-[#d4af37]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#8b6508] mb-1">מידה *</label>
                  <select required value={newDressData.size} onChange={(e) => setNewDressData({...newDressData, size: e.target.value})} className="w-full p-2.5 bg-neutral-50 border border-[#decfa8] rounded-xl text-xs font-medium focus:outline-none focus:border-[#d4af37]">
                    <option value="">בחרי...</option>
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8b6508] mb-1">תיאור השמלה</label>
                <textarea rows={3} placeholder="ספרי על השמלה..." value={newDressData.description} onChange={(e) => setNewDressData({...newDressData, description: e.target.value})} className="w-full p-2.5 bg-neutral-50 border border-[#decfa8] rounded-xl text-xs font-medium focus:outline-none focus:border-[#d4af37] resize-none" />
              </div>

              <button type="submit" className="w-full bg-gradient-to-r from-[#d4af37] via-[#b8860b] to-[#d4af37] text-white text-xs font-black py-3.5 rounded-xl shadow-lg transition-transform active:scale-98">
                פרסמי שמלה בקולקציה ✨
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 🔮 מודאל שריון תאריך 🔮 */}
      {selectedDress && (
        <div className="fixed inset-0 bg-neutral-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setSelectedDress(null)}>
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden border border-[#ebd4a8] p-6 shadow-2xl relative" onClick={e => e.stopPropagation()} style={{ direction: 'rtl' }}>
            <button onClick={() => setSelectedDress(null)} className="absolute top-4 left-4 text-[#b8860b] font-bold">✕</button>

            {isOrdered ? (
              <div className="text-center py-8 space-y-3">
                <div className="text-4xl animate-bounce">✨👑</div>
                <h4 className="text-lg font-black text-[#8b6508]">השריון בוצע בהצלחה!</h4>
              </div>
            ) : (
              <form onSubmit={handlePlaceOrder} className="space-y-3">
                <h3 className="text-md font-bold mb-4">שריון דגם: {selectedDress.name}</h3>
                <input type="text" required placeholder="שם מלא" value={orderName} onChange={e => setOrderName(e.target.value)} className="w-full p-2 border border-[#dfc48c] rounded-xl text-xs" />
                <input type="tel" required placeholder="טלפון נייד" value={orderPhone} onChange={e => setOrderPhone(e.target.value)} className="w-full p-2 border border-[#dfc48c] rounded-xl text-xs" />
                <input type="email" required placeholder="אימייל" value={orderEmail} onChange={e => setOrderEmail(e.target.value)} className="w-full p-2 border border-[#dfc48c] rounded-xl text-xs" />
                <input type="date" required value={orderDate} onChange={e => setOrderDate(e.target.value)} className="w-full p-2 border border-[#dfc48c] rounded-xl text-xs font-bold" />
                <button type="submit" className="w-full text-white bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-xs font-black py-3.5 rounded-xl">אשרי שריון</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 💬 סקשן חוות דעת לקוחות */}
      <section className="max-w-6xl mx-auto px-4 mt-24 relative z-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-serif italic text-neutral-900 mt-1">מה הלקוחות שלנו מספרות</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {REVIEWS.map((rev, index) => (
            <div key={index} className="bg-white/80 p-6 rounded-2xl border border-[#eadaaf] shadow-sm flex flex-col justify-between">
              <p className="text-xs text-[#554a33] italic">"{rev.text}"</p>
              <span className="text-xs font-bold mt-3 block">{rev.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 👑 אזור שאלות נפוצות */}
      <section className="max-w-3xl mx-auto px-4 mt-24 relative z-10">
        <div className="flex flex-col gap-3">
          {FAQS.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div key={idx} className="bg-white border border-[#ebd4a8] rounded-xl overflow-hidden">
                <button onClick={() => setActiveFaq(isOpen ? null : idx)} className="w-full p-4 text-right flex justify-between items-center font-bold text-xs text-neutral-900">
                  <span>{faq.q}</span>
                  <span>{isOpen ? '−' : '＋'}</span>
                </button>
                {isOpen && <div className="p-4 bg-[#fffdf9] text-xs text-[#5c5037]">{faq.a}</div>}
              </div>
            );
          })}
        </div>
      </section>

    </main>
  );
}
