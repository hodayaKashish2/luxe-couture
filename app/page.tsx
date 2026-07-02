'use client';

import React, { useState, useEffect } from 'react';

// נתוני השמלות המורחבים (התחלתיים)
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
    name: "שמלת סאטן אמרלד", 
    price: 420, 
    size: "S", 
    condition: "new",
    images: [
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1518049360962-53651b57c0e8?w=600&auto=format&fit=crop&q=80"
    ], 
    description: "שמלת סאטן מבריקה בגזרת מקסי בצבע ירוק אמרלד עמוק. שסע עדין ברגל ומחשוף קלאסי."
  },
  { 
    id: 3, 
    name: "שמלת נשף נפוחה שחורה", 
    price: 550, 
    size: "L", 
    condition: "used",
    images: [
      "https://images.unsplash.com/photo-1518049360962-53651b57c0e8?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&auto=format&fit=crop&q=80"
    ], 
    description: "שמלת נשף דרמטית לחובבות המראה האצילי. חלקה העליון מחוך תומך וחלקה התחתון עשיר בטול."
  }
];

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
  // רשימת שמלות דינמית
  const [dressesList, setDressesList] = useState(INITIAL_DRESSES);

  // פילטרים
  const [searchTerm, setSearchTerm] = useState('');
  const [maxPrice, setMaxPrice] = useState(600);
  const [selectedSize, setSelectedSize] = useState('All');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // מועדפים וסל (שמירה ב-State)
  const [favorites, setFavorites] = useState<number[]>([]);
  const [cart, setCart] = useState<typeof INITIAL_DRESSES>([]);
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

  // תאריכים תפוסים (מניעת כפל הזמנות - סימולציה)
  const [bookedDates, setBookedDates] = useState<{ [dressId: number]: string[] }>({
    1: ['2026-07-15', '2026-08-01'],
    2: ['2026-07-20'],
    3: []
  });

  // מודאלים ושריון
  const [selectedDress, setSelectedDress] = useState<typeof INITIAL_DRESSES[0] | null>(null);
  const [orderName, setOrderName] = useState('');
  const [orderPhone, setOrderPhone] = useState('');
  const [orderEmail, setOrderEmail] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [isOrdered, setIsOrdered] = useState(false);
  const [dateError, setDateError] = useState('');

  // אינדקס גלריה לכל כרטיס
  const [currentImageIndexes, setCurrentImageIndexes] = useState<{ [key: number]: number }>({
    1: 0, 2: 0, 3: 0
  });
  const [modalImageIndex, setModalImageIndex] = useState(0);

  // אקורדיון FAQ פעיל
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // טעינת מועדפים מהדפדפן
  useEffect(() => {
    const savedFavs = localStorage.getItem('luxe_favs');
    if (savedFavs) setFavorites(JSON.parse(savedFavs));
    const savedCart = localStorage.getItem('luxe_cart');
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

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

  const toggleCart = (dress: typeof INITIAL_DRESSES[0], e: React.MouseEvent) => {
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

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderName || !orderPhone || !orderEmail || !orderDate || !selectedDress) return;
    if (!checkDateAvailability(orderDate, selectedDress.id)) return;
    
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
      console.error('Error:', error);
      alert('תקלה בתקשורת עם השרת');
    }
  };

  // פונקציית טיפול בהעלאת תמונות מקומיות
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

  // פונקציית הגשת הטופס להוספת שמלה
  const handleAddDressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDressData.name || !newDressData.price || !newDressData.size) {
      alert('אנא מלאי שדות חובה (שם, מחיר ומידה)');
      return;
    }

    const newDress = {
      id: Date.now(), // מזהה ייחודי זמני
      name: newDressData.name,
      price: Number(newDressData.price),
      size: newDressData.size,
      condition: newDressData.condition,
      images: newDressData.images.length > 0 ?
        newDressData.images : ["https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&auto=format&fit=crop&q=80"],
      description: `${newDressData.description || 'אין תיאור זמין.'} | צבע: ${newDressData.color || 'לא צוין'} | מצב: ${
        newDressData.condition === 'new' ? 'חדש עם תווית' : newDressData.condition === 'like-new' ? 'כמו חדש' : 'יד שנייה'
      }`
    };

    setDressesList(prev => [newDress, ...prev]);
    setIsAddDressOpen(false); // סגירת המודאל
    setNewDressData({ name: '', price: '', size: '', color: '', condition: 'new', description: '', images: [] }); // איפוס
    alert('השמלה התווספה בהצלחה לקולקציה באתר!');
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
          {/* כפתור הוספת שמלה חדש */}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {filteredDresses.map((dress) => {
            const currentImgIndex = currentImageIndexes[dress.id] || 0;
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
                    {dress.images.length > 1 && (
                      <>
                        <button 
                          onClick={(e) => prevImage(dress.id, dress.images.length, e)}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 bg-white/95 text-[#b8860b] w-9 h-9 rounded-full flex items-center justify-center shadow-lg border border-[#e8cc92] font-black text-lg hover:bg-gradient-to-r hover:from-[#d4af37] hover:to-[#b8860b] hover:text-white transition-all opacity-0 group-hover:opacity-100"
                        >
                          ‹
                        </button>
                        <button 
                          onClick={(e) => nextImage(dress.id, dress.images.length, e)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 bg-white/95 text-[#b8860b] w-9 h-9 rounded-full flex items-center justify-center shadow-lg border border-[#e8cc92] font-black text-lg hover:bg-gradient-to-r hover:from-[#d4af37] hover:to-[#b8860b] hover:text-white transition-all opacity-0 group-hover:opacity-100"
                        >
                          ›
                        </button>
                      </>
                    )}

                    <img src={dress.images[currentImgIndex]} alt={dress.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />

                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1 bg-white/95 px-2.5 py-1 rounded-full shadow-md border border-[#e0cba0]">
                      {dress.images.map((_, idx) => (
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
                  
                  <div className="flex justify-between items-center mt-5 pt-4 border-t-2 border-dotted border-[#f0e6cc]">
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-widest text-[#b8860b] font-black">השכרה חגיגית</span>
                      <span className="text-neutral-900 font-black text-lg">₪{dress.price}</span>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedDress(dress);
                        setModalImageIndex(currentImgIndex);
                      }} 
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
      </section>

      {/* ✨ ממודאל חדש: שאלון הוספת שמלה לאתר ✨ */}
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
              {/* שם השמלה */}
              <div>
                <label className="block text-xs font-bold text-[#8b6508] mb-1">שם הדגם / השמלה *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="למשל: שמלת משי פנינה"
                  value={newDressData.name} 
                  onChange={(e) => setNewDressData({...newDressData, name: e.target.value})} 
                  className="w-full p-2.5 bg-neutral-50 border border-[#decfa8] rounded-xl text-xs font-medium focus:outline-none focus:border-[#d4af37]" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* מחיר השכרה */}
                <div>
                  <label className="block text-xs font-bold text-[#8b6508] mb-1">מחיר השכרה (₪) *</label>
                  <input 
                    type="number" 
                    required 
                    placeholder="350"
                    value={newDressData.price} 
                    onChange={(e) => setNewDressData({...newDressData, price: e.target.value})} 
                    className="w-full p-2.5 bg-neutral-50 border border-[#decfa8] rounded-xl text-xs font-medium focus:outline-none focus:border-[#d4af37]" 
                  />
                </div>

                {/* מידה */}
                <div>
                  <label className="block text-xs font-bold text-[#8b6508] mb-1">מידה *</label>
                  <select 
                    required
                    value={newDressData.size}
                    onChange={(e) => setNewDressData({...newDressData, size: e.target.value})}
                    className="w-full p-2.5 bg-neutral-50 border border-[#decfa8] rounded-xl text-xs font-medium focus:outline-none focus:border-[#d4af37]"
                  >
                    <option value="">בחרי...</option>
                    <option value="XS">XS (34)</option>
                    <option value="S">S (36)</option>
                    <option value="M">M (38)</option>
                    <option value="L">L (40)</option>
                    <option value="XL">XL (42)</option>
                  </select>
                </div>
              </div>

              {/* צבע השמלה */}
              <div>
                <label className="block text-xs font-bold text-[#8b6508] mb-1">צבע השמלה</label>
                <input 
                  type="text" 
                  placeholder="למשל: לבן שמנת, ורוד עתיק"
                  value={newDressData.color} 
                  onChange={(e) => setNewDressData({...newDressData, color: e.target.value})} 
                  className="w-full p-2.5 bg-neutral-50 border border-[#decfa8] rounded-xl text-xs font-medium focus:outline-none focus:border-[#d4af37]" 
                />
              </div>

              {/* מצב השמלה */}
              <div>
                <label className="block text-xs font-bold text-[#8b6508] mb-2">מצב השמלה</label>
                <div className="flex gap-4 bg-neutral-50 p-2.5 rounded-xl border border-[#decfa8] justify-around">
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                    <input 
                      type="radio" 
                      name="condition" 
                      value="new"
                      checked={newDressData.condition === 'new'}
                      onChange={(e) => setNewDressData({...newDressData, condition: e.target.value})}
                      className="accent-[#d4af37]"
                    />
                    חדש עם תווית
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                    <input 
                      type="radio" 
                      name="condition" 
                      value="like-new"
                      checked={newDressData.condition === 'like-new'}
                      onChange={(e) => setNewDressData({...newDressData, condition: e.target.value})}
                      className="accent-[#d4af37]"
                    />
                    כמו חדש
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                    <input 
                      type="radio" 
                      name="condition" 
                      value="used"
                      checked={newDressData.condition === 'used'}
                      onChange={(e) => setNewDressData({...newDressData, condition: e.target.value})}
                      className="accent-[#d4af37]"
                    />
                    יד שנייה
                  </label>
                </div>
              </div>

              {/* תיאור קצר */}
              <div>
                <label className="block text-xs font-bold text-[#8b6508] mb-1">תיאור השמלה וסוג הבד</label>
                <textarea 
                  rows={3}
                  placeholder="ספרי על השמלה, סוג הבד, התאמה לאירועים..."
                  value={newDressData.description} 
                  onChange={(e) => setNewDressData({...newDressData, description: e.target.value})} 
                  className="w-full p-2.5 bg-neutral-50 border border-[#decfa8] rounded-xl text-xs font-medium focus:outline-none focus:border-[#d4af37] resize-none" 
                />
              </div>

              {/* העלאת תמונות */}
              <div>
                <label className="block text-xs font-bold text-[#8b6508] mb-1">העלאת תמונות של השמלה</label>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full p-2 bg-neutral-50 border border-dashed border-[#decfa8] rounded-xl text-xs file:ml-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#f4ebd4] file:text-[#8b6508] hover:file:bg-[#eadaaf] cursor-pointer"
                />
                {newDressData.images.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-2 bg-neutral-50 p-2 rounded-xl border border-neutral-100">
                    {newDressData.images.map((img, index) => (
                      <img key={index} src={img} alt="תצוגה מקדימה" className="w-12 h-12 object-cover rounded-lg border border-[#decfa8]" />
                    ))}
                  </div>
                )}
              </div>

              {/* כפתור אישור */}
              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-[#d4af37] via-[#b8860b] to-[#d4af37] hover:from-[#b8860b] hover:to-[#8b6508] text-white text-xs font-black py-3.5 rounded-xl shadow-lg mt-2 transition-transform active:scale-98"
              >
                פרסמי שמלה בקולקציה ✨
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 💬 סקשן חוות דעת לקוחות */}
      <section className="max-w-6xl mx-auto px-4 mt-24 relative z-10">
        <div className="text-center mb-10">
          <span className="text-xs uppercase font-black text-[#b8860b] tracking-wide">REAL GLAMOUR STORIES</span>
          <h2 className="text-3xl font-serif italic text-neutral-900 mt-1">מה הלקוחות שלנו מספרות</h2>
          <div className="w-12 h-[1.5px] bg-[#d4af37] mx-auto mt-3"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {REVIEWS.map((rev, index) => (
            <div key={index} className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-[#eadaaf] shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex text-[#d4af37] gap-0.5 mb-3">
                  {Array.from({ length: rev.stars }).map((_, i) => <span key={i}>⭐</span>)}
                </div>
                <p className="text-xs text-[#554a33] italic leading-relaxed">"{rev.text}"</p>
              </div>
              <div className="mt-4 pt-3 border-t border-neutral-100 flex justify-between items-center">
                <span className="text-xs font-bold text-neutral-900">{rev.name}</span>
                <span className="text-[10px] bg-[#f4ebd4] text-[#8b6508] px-2 py-0.5 rounded-full font-bold">{rev.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 👑 אזור שאלות נפוצות */}
      <section className="max-w-3xl mx-auto px-4 mt-24 relative z-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-serif italic text-neutral-900">שאלות ותשובות נפוצות</h2>
          <div className="w-12 h-[1.5px] bg-[#d4af37] mx-auto mt-3"></div>
        </div>
        <div className="flex flex-col gap-3">
          {FAQS.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div key={idx} className="bg-white border border-[#ebd4a8] rounded-xl overflow-hidden shadow-sm transition-all">
                <button 
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-right flex justify-between items-center font-bold text-xs text-neutral-900 hover:bg-neutral-50 transition"
                >
                  <span>{faq.q}</span>
                  <span className="text-[#b8860b] text-base">{isOpen ? '−' : '＋'}</span>
                </button>
                {isOpen && (
                  <div className="p-4 bg-[#fffdf9] border-t border-[#f7eed8] text-xs text-[#5c5037] leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 🛒 מודאל מגירה צידית - סל השריונות */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white w-full max-w-md h-full p-6 shadow-2xl flex flex-col justify-between border-r-2 border-[#d4af37]">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-neutral-200">
                <h3 className="text-lg font-bold text-neutral-900">סל השריונות שלך 🛒</h3>
                <button onClick={() => setIsCartOpen(false)} className="text-neutral-400 hover:text-black font-bold text-lg">✕</button>
              </div>
              
              {cart.length === 0 ? (
                <p className="text-xs text-[#6e634c] text-center py-12">הסל שלך עדיין ריק. הוסיפי שמלות כדי לבצע הזמנה מרוכזת.</p>
              ) : (
                <div className="flex flex-col gap-4 mt-4 overflow-y-auto max-h-[60vh] p-1">
                  {cart.map(item => (
                    <div key={item.id} className="flex gap-3 items-center bg-gradient-to-r from-neutral-50 to-[#fffdf9] p-2 rounded-xl border border-[#ebd4a8]">
                      <img src={item.images[0]} alt={item.name} className="w-16 h-16 object-cover rounded-lg border" />
                      <div className="flex-grow">
                        <h4 className="text-xs font-bold text-neutral-950">{item.name}</h4>
                        <span className="text-[10px] text-[#b8860b] block">מידה {item.size}</span>
                        <span className="text-xs font-black text-neutral-900">₪{item.price}</span>
                      </div>
                      <button 
                        onClick={(e) => toggleCart(item, e)} 
                        className="text-neutral-400 hover:text-red-500 text-xs px-2"
                      >
                        הסר
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-neutral-200 pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold text-neutral-600">סה״כ זמני להשכרה:</span>
                  <span className="text-lg font-black text-neutral-950">₪{cart.reduce((acc, item) => acc + item.price, 0)}</span>
                </div>
                <button 
                  onClick={() => {
                    setIsCartOpen(false);
                    setSelectedDress(cart[0]);
                  }}
                  className="w-full bg-[#2c261a] hover:bg-[#b8860b] text-white text-xs font-bold py-3 rounded-xl transition shadow-md"
                >
                  המשכי לשריון מרוכז בסטודיו
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🔒 מודאל שריון קריסטלי חכם */}
      {selectedDress && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl relative flex flex-col md:flex-row border-2 border-[#d4af37]">
            <button 
              onClick={() => {
                setSelectedDress(null);
                setDateError('');
              }} 
              className="absolute top-4 left-4 z-30 bg-white hover:bg-[#d4af37] text-[#b8860b] hover:text-white w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#ebd4a8] shadow-md font-bold transition-all"
            >
              ✕
            </button>

            {/* גלריה מודאל */}
            <div className="w-full md:w-1/2 h-48 md:h-auto relative bg-neutral-50 border-l border-[#f2e6cc]">
              {selectedDress.images.length > 1 && (
                <>
                  <button 
                    onClick={() => setModalImageIndex((prev) => (prev - 1 + selectedDress.images.length) % selectedDress.images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-white/95 text-[#b8860b] w-8 h-8 rounded-full flex items-center justify-center shadow-md font-black"
                  >
                    ‹
                  </button>
                  <button 
                    onClick={() => setModalImageIndex((prev) => (prev + 1) % selectedDress.images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-white/95 text-[#b8860b] w-8 h-8 rounded-full flex items-center justify-center shadow-md font-black"
                  >
                    ›
                  </button>
                </>
              )}
              <img src={selectedDress.images[modalImageIndex]} alt={selectedDress.name} className="w-full h-full object-cover" />
            </div>

            {/* טופס שריון בקליק */}
            <div className="w-full md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto bg-gradient-to-b from-[#fffdf9] to-[#faf6eb]">
              {isOrdered ? (
                <div className="text-center my-auto py-10">
                  <span className="text-3xl block mb-2">✨ ✨ ✨</span>
                  <h3 className="text-xl font-black text-neutral-900">הדגם שוריין עבורך בהצלחה!</h3>
                  <p className="mt-2 text-[#5c5037] text-xs font-medium leading-relaxed">
                    אישור ההזמנה נשלח בהצלחה ל-<strong>{orderEmail}</strong>. מנהלת האירועים תיצור איתך קשר בהקדם לתיאום מדידות אחרונות.
                  </p>
                </div>
              ) : (
                <form onSubmit={handlePlaceOrder} className="flex flex-col gap-3">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest bg-gradient-to-r from-[#b8860b] to-[#d4af37] bg-clip-text text-transparent font-black block mb-1">
                      ✦ LUXURY RED CARPET SELECTION ✦
                    </span>
                    <h3 className="text-xl font-bold text-neutral-950 tracking-wide">{selectedDress.name}</h3>
                    <p className="text-xs text-[#5c5037] mt-1 font-normal leading-relaxed">{selectedDress.description}</p>
                    <div className="mt-3 bg-gradient-to-r from-[#fdfcf7] to-[#f4ebd4] p-3 rounded-xl border border-[#decfa8] flex justify-between items-center shadow-sm">
                      <span className="text-xs text-[#5c5037] font-bold">מחיר השכרה לערב נוצץ:</span>
                      <span className="text-base font-black text-neutral-950">₪{selectedDress.price}</span>
                    </div>
                  </div>

                  <div className="w-full h-[1px] bg-[#ebdcb6] my-0.5"></div>

                  <h4 className="text-xs font-black text-[#8b6508] tracking-wide">פרטי קשר לשריון מידי</h4>
                  
                  <input type="text" placeholder="שם מלא" required value={orderName} onChange={(e) => setOrderName(e.target.value)} className="p-3 bg-white border border-[#decfa8] rounded-xl text-xs font-medium focus:outline-none focus:border-[#d4af37]" />
                  <input type="tel" placeholder="מספר טלפון זמין" required value={orderPhone} onChange={(e) => setOrderPhone(e.target.value)} className="p-3 bg-white border border-[#decfa8] rounded-xl text-xs font-medium focus:outline-none focus:border-[#d4af37]" />
                  <input type="email" placeholder="כתובת אימייל לאישור קליל" required value={orderEmail} onChange={(e) => setOrderEmail(e.target.value)} className="p-3 bg-white border border-[#decfa8] rounded-xl text-xs font-medium text-left focus:outline-none focus:border-[#d4af37]" dir="ltr" />
                  
                  <div className="flex flex-col">
                    <label className="text-[10px] text-[#8b6508] font-black mb-1">תאריך האירוע החגיגי שלך</label>
                    <input 
                      type="date" 
                      required 
                      value={orderDate} 
                      onChange={(e) => handleDateChange(e.target.value)} 
                      className="p-3 bg-white border border-[#decfa8] rounded-xl text-xs text-right font-medium focus:outline-none focus:border-[#d4af37]" 
                    />
                    {dateError && (
                      <p className="text-[11px] text-red-600 font-bold mt-1 bg-red-50 p-2 rounded-lg border border-red-200">
                        {dateError}
                      </p>
                    )}
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
        href="https://wa.me/972500000000?text=%D7%94%D7%99%D7%95%D7%A5%20%D7%90%D7%A0%D7%99%20%D7%99%D7%A9%D7%9E%D7%97%20%D7%9C%D7%91%D7%A4%D7%A8%D7%98%D7%99%D7%9D%20%D7%A2%D7%9C%20%D7%A9%D7%9E%D7%94%20%D7%9E%D7%94%D7%90%AA%D7%A5" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 bg-[#25D366] text-white p-3.5 rounded-full shadow-[0_8px_30px_rgba(37,211,102,0.4)] hover:bg-[#20ba5a] transition-all hover:scale-105 flex items-center justify-center font-bold text-lg"
        title="צ'אט מהיר ב-WhatsApp"
      >
        💬 <span className="text-xs font-bold mr-1 block sm:inline">צרי קשר</span>
      </a>

    </main>
  );
}
