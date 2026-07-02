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
    description: "שמלת ערב נשפכת בגוון קורל יוקרתי, מתאימה לחתונה או אירוע ערב חגיגי. בד נעים ומחטב." [cite: 168]
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
    description: "שמלת סאטן מבריקה בגזרת מקסי בצבע ירוק אמרלד עמוק. שסע עדין ברגל ומחשוף קלאסי." [cite: 169]
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
    description: "שמלת נשף דרמטית לחובבות המראה האצילי. חלקה העליון מחוך תומך וחלקה התחתון עשיר בטול." [cite: 170]
  }
];

const FAQS = [
  { q: "האם המחיר כולל ניקוי יבש?", a: "בטח! כל השמלות עוברות ניקוי יבש מקצועי קפדני לפני ואחרי כל השכרה. את מקבלת את השמלה מוכנה ללבישה ומחזירה אותה ככה, אנחנו דואגים להכל." [cite: 171] },
  { q: "איך מתבצע תהליך המדידות וההתאמה?", a: "לאחר שריון השמלה באתר, אנחנו נתאם איתך הגעה לסטודיו חגיגי למדידות. במידת הצורך נבצע מכפלת או התאמות קלות שלא פוגעות בגזרת השמלה המקורית." [cite: 172] },
  { q: "מהי מדיניות הביטולים שלכן?", a: "ביטול שריון חינם יתאפשר עד 14 ימים לפני מועד האירוע המתוכנן. בביטול מאוחר יותר ייגבו דמי רצינות בגובה 15% מעלות ההשכרה." [cite: 173] },
  { q: "האם נדרש להשאיר פיקדון?", a: "כן, במעמד לקחת השמלה מהסטודיו נבקש להשאיר כרטיס אשראי לביטחון בלבד. לא מבוצע שום חיוב אלא אם נגרם נזק בלתי הפיך לשמלה." [cite: 174] }
];

const REVIEWS = [
  { name: "מיכל אהרוני", role: "כלה", text: "השכרתי את שמלת האמרלד לחתונה של אחותי ולא הפסקתי לקבל מחמאות כל הערב! הבד ישב פשוט מושלם והשירות בסטודיו היה של נסיכות.", stars: 5 },
  { name: "דניאל לוי", role: "מלווה", text: "חוויה מדהימה! השמלה הגיעה נקייה ומגוהצת כמו חדשה מהניילון. מערכת השריון באתר חסכה לי המון כאב ראש.", stars: 5 },
  { name: "שירז כהן", role: "אירוע חברה", text: "הצלתן אותי בדקה ה-90. השמלה ישבה בדיוק לפי המידות והרגשתי כמו על השטיח האדום. מומלץ בחום!", stars: 5 } [cite: 175]
];

export default function Home() {
  // רשימת שמלות דינמית
  const [dressesList, setDressesList] = useState(INITIAL_DRESSES); [cite: 176]
  // פילטרים
  const [searchTerm, setSearchTerm] = useState(''); [cite: 177]
  const [maxPrice, setMaxPrice] = useState(600); [cite: 177]
  const [selectedSize, setSelectedSize] = useState('All'); [cite: 177]
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false); [cite: 178]

  // מועדפים וסל (שמירה ב-State)
  const [favorites, setFavorites] = useState<number[]>([]); [cite: 178]
  const [cart, setCart] = useState<typeof INITIAL_DRESSES>([]); [cite: 179]
  const [isCartOpen, setIsCartOpen] = useState(false); [cite: 179]
  // מודאל הוספת שמלה חדשה
  const [isAddDressOpen, setIsAddDressOpen] = useState(false); [cite: 180]
  const [newDressData, setNewDressData] = useState({ [cite: 181]
    name: '',
    price: '',
    size: '',
    color: '',
    condition: 'new',
    description: '',
    images: [] as string[]
  });
  // תאריכים תפוסים (מניעת כפל הזמנות - סימולציה)
  const [bookedDates, setBookedDates] = useState<{ [dressId: number]: string[] }>({ [cite: 182]
    1: ['2026-07-15', '2026-08-01'],
    2: ['2026-07-20'],
    3: []
  });
  // מודאלים ושריון
  const [selectedDress, setSelectedDress] = useState<typeof INITIAL_DRESSES[0] | null>(null); [cite: 183]
  const [orderName, setOrderName] = useState(''); [cite: 183]
  const [orderPhone, setOrderPhone] = useState(''); [cite: 184]
  const [orderEmail, setOrderEmail] = useState(''); [cite: 184]
  const [orderDate, setOrderDate] = useState(''); [cite: 184]
  const [isOrdered, setIsOrdered] = useState(false); [cite: 184]
  const [dateError, setDateError] = useState(''); [cite: 185]

  // אינדקס גלריה לכל כרטיס
  const [currentImageIndexes, setCurrentImageIndexes] = useState<{ [key: number]: number }>({ [cite: 185]
    1: 0, 2: 0, 3: 0
  });
  const [modalImageIndex, setModalImageIndex] = useState(0); [cite: 186]

  // אקורדיון FAQ פעיל
  const [activeFaq, setActiveFaq] = useState<number | null>(null); [cite: 186]

  // טעינת מועדפים מהדפדפן
  useEffect(() => {
    const savedFavs = localStorage.getItem('luxe_favs'); [cite: 187]
    if (savedFavs) setFavorites(JSON.parse(savedFavs)); [cite: 187]
    const savedCart = localStorage.getItem('luxe_cart'); [cite: 187]
    if (savedCart) setCart(JSON.parse(savedCart)); [cite: 187]
  }, []);

  const toggleFavorite = (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); [cite: 188]
    let updated;
    if (favorites.includes(id)) { [cite: 189]
      updated = favorites.filter(favId => favId !== id); [cite: 189]
    } else {
      updated = [...favorites, id]; [cite: 189]
    }
    setFavorites(updated); [cite: 189]
    localStorage.setItem('luxe_favs', JSON.stringify(updated)); [cite: 190]
  };

  const toggleCart = (dress: typeof INITIAL_DRESSES[0], e: React.MouseEvent) => {
    e.stopPropagation(); [cite: 190]
    let updated;
    if (cart.some(item => item.id === dress.id)) { [cite: 191]
      updated = cart.filter(item => item.id !== dress.id); [cite: 191]
    } else {
      updated = [...cart, dress]; [cite: 192]
    }
    setCart(updated); [cite: 192]
    localStorage.setItem('luxe_cart', JSON.stringify(updated)); [cite: 192]
  };

  const nextImage = (dressId: number, maxImages: number, e: React.MouseEvent) => {
    e.stopPropagation(); [cite: 193]
    setCurrentImageIndexes(prev => ({ ...prev, [dressId]: (prev[dressId] + 1) % maxImages })); [cite: 194]
  };

  const prevImage = (dressId: number, maxImages: number, e: React.MouseEvent) => {
    e.stopPropagation(); [cite: 195]
    setCurrentImageIndexes(prev => ({ ...prev, [dressId]: (prev[dressId] - 1 + maxImages) % maxImages })); [cite: 196]
  };

  const checkDateAvailability = (date: string, dressId: number) => {
    if (bookedDates[dressId]?.includes(date)) { [cite: 197]
      return false;
    }
    return true; [cite: 197]
  };

  const handleDateChange = (date: string) => {
    setOrderDate(date); [cite: 198]
    if (selectedDress && !checkDateAvailability(date, selectedDress.id)) { [cite: 198]
      setDateError('אופס! השמלה כבר תפוסה בתאריך זה. אנא בחרי תאריך אחר או דגם חלופי.'); [cite: 198]
    } else {
      setDateError(''); [cite: 199]
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault(); [cite: 199]
    if (!orderName || !orderPhone || !orderEmail || !orderDate || !selectedDress) return; [cite: 200]
    if (!checkDateAvailability(orderDate, selectedDress.id)) return; [cite: 200]
    try {
      const response = await fetch('/api/send-sms', { [cite: 201]
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: orderName, phone: orderPhone, email: orderEmail, dressName: selectedDress.name, date: orderDate }),
      });

      const data = await response.json(); [cite: 202]
      if (data.success) { [cite: 202]
        setBookedDates(prev => ({ ...prev, [selectedDress.id]: [...(prev[selectedDress.id] || []), orderDate] })); [cite: 202]
        setIsOrdered(true); [cite: 202]
        setTimeout(() => { [cite: 203]
          setIsOrdered(false);
          setSelectedDress(null);
          setOrderName('');
          setOrderPhone('');
          setOrderEmail('');
          setOrderDate('');
        }, 4000);
      } else {
        alert('הייתה בעיה ברישום ההזמנה במערכת'); [cite: 203]
      }
    } catch (error) {
      console.error('Error:', error); [cite: 204]
      alert('תקלה בתקשורת עם השרת'); [cite: 204]
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files); [cite: 205]
      const urlsArray = filesArray.map(file => URL.createObjectURL(file)); [cite: 206]
      setNewDressData(prev => ({ ...prev, images: [...prev.images, ...urlsArray] })); [cite: 206]
    }
  };

  const handleAddDressSubmit = (e: React.FormEvent) => {
    e.preventDefault(); [cite: 207]
    if (!newDressData.name || !newDressData.price || !newDressData.size) { [cite: 208]
      alert('אנא מלאי שדות חובה (שם, מחיר ומידה)'); return; [cite: 208]
    } 
    const newDress = { 
      id: Date.now(), 
      name: newDressData.name, 
      price: Number(newDressData.price), 
      size: newDressData.size, 
      condition: newDressData.condition, 
      images: newDressData.images.length > 0 ? [cite: 209]
        newDressData.images : ["https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&auto=format&fit=crop&q=80"], [cite: 210]
      description: `${newDressData.description || 'אין תיאור זמין.'} | צבע: ${newDressData.color || 'לא צוין'} | מצב: ${ [cite: 210]
        newDressData.condition === 'new' ? 'חדש עם תווית' : newDressData.condition === 'like-new' ? 'כמו חדש' : 'יד שנייה' [cite: 211, 212]
      }` 
    }; 
    setDressesList(prev => [newDress, ...prev]); [cite: 212]
    setIsAddDressOpen(false); [cite: 212]
    setNewDressData({ name: '', price: '', size: '', color: '', condition: 'new', description: '', images: [] }); [cite: 213]
    alert('השמלה התווספה בהצלחה לקולקציה באתר!'); [cite: 214]
  };

  const filteredDresses = dressesList.filter(dress => {
    const matchesSearch = dress.name.toLowerCase().includes(searchTerm.toLowerCase()); [cite: 214]
    const matchesPrice = dress.price <= maxPrice; [cite: 214]
    const matchesSize = selectedSize === 'All' || dress.size === selectedSize; [cite: 214]
    const matchesFav = !showOnlyFavorites || favorites.includes(dress.id); [cite: 214]
    return matchesSearch && matchesPrice && matchesSize && matchesFav; [cite: 214]
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#fbf8f0] via-[#f3ebd6] to-[#e8dcbd] text-[#332c1e] pb-24 relative overflow-hidden" dir="rtl"> [cite: 215]
      
      {/* 🌟 מפל נצנצים וחלקיקי זהב זוהרים */}
      <div className="absolute inset-0 opacity-[0.25] pointer-events-none" style={{ backgroundImage: ` radial-gradient(circle, #d4af37 1px, transparent 1px), radial-gradient(circle, #f3e5ab 1.5px, transparent 1.5px), radial-gradient(circle, #ffffff 1px, transparent 1px) `, backgroundSize: '30px 30px, 45px 45px, 20px 20px', backgroundPosition: '0 0, 15px 20px, 5px 5px' }} ></div> [cite: 215]

      {/* הילות אור נוצצות */}
      <div className="absolute top-[-10%] right-[5%] w-[800px] h-[500px] bg-gradient-to-br from-[#ffd700]/20 to-[#fff8dc]/40 rounded-full blur-[140px] pointer-events-none"></div> [cite: 215]
      <div className="absolute top-[40%] left-[-10%] w-[600px] h-[600px] bg-[#fdf5e6]/50 rounded-full blur-[120px] pointer-events-none"></div> [cite: 215]

      {/* 🛍️ סרגל עליון מהיר */}
      <nav className="relative z-30 max-w-7xl mx-auto px-6 pt-6 flex justify-between items-center"> [cite: 215, 216]
        <div className="text-sm font-serif tracking-widest text-[#8b6508] font-bold">שמלה להשכיר</div> [cite: 216]
        <div className="flex gap-3 flex-wrap"> [cite: 216]
          <button onClick={() => setIsAddDressOpen(true)} className="px-4 py-2 bg-gradient-to-r from-[#d4af37] to-[#b8860b] hover:from-[#b8860b] hover:to-[#8b6508] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5" > <span>➕</span> <span>הוספת שמלה לאתר</span> </button> [cite: 216]
          <button onClick={() => setShowOnlyFavorites(!showOnlyFavorites)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-[#dfc48c] shadow-sm ${ showOnlyFavorites ? 'bg-[#d4af37] text-white' : 'bg-white/90 text-[#8b6508]' }`} > <span>❤️</span> <span>מועדפים ({favorites.length})</span> </button> [cite: 216, 217]
          <button onClick={() => setIsCartOpen(true)} className="px-4 py-2 bg-[#2c261a] hover:bg-[#b8860b] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md" > <span>🛍️</span> <span>הסל שלי ({cart.length})</span> </button> [cite: 217]
        </div>
      </nav>

      {/* 👑 לוגו וכותרת חדשה */}
      <header className="relative pt-14 pb-10 px-6 text-center z-10"> [cite: 217]
        <div className="inline-block animate-pulse mb-3">
          <span className="text-[28px] block text-center filter drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]">
            👑
          </span>
          <span className="text-[10px] uppercase tracking-[0.4em] bg-gradient-to-r from-[#b8860b] via-[#d4af37] to-[#b8860b] bg-clip-text text-transparent font-black mt-1 block">
            ✦ HIGH GLAMOUR EXCLUSIVE ✦
          </span> [cite: 217]
        </div>
        <h1 className="text-5xl font-black tracking-tight text-neutral-900 sm:text-6xl drop-shadow-[0_2px_10px_rgba(212,175,55,0.15)]">
          שמלה <span className="font-serif italic font-light bg-gradient-to-r from-[#8b6508] to-[#d4af37] bg-clip-text text-transparent">להשכיר</span>
        </h1> 
        <div className="flex items-center justify-center gap-3 mt-5 mb-4"> [cite: 217]
          <div className="w-16 h-[1px] bg-gradient-to-r from-transparent to-[#d4af37]"></div> 
          <span className="text-[#d4af37] text-xs">✦</span> [cite: 218]
          <div className="w-16 h-[1px] bg-gradient-to-l from-transparent to-[#d4af37]"></div> [cite: 218]
        </div>
        <p className="text-sm text-[#554a33] max-w-lg mx-auto font-medium leading-relaxed"> [cite: 218]
          המראה הזוהר והנוצץ ביותר לאירוע הבא שלך. דפדפי בקולקציה, סמני מועדפים ושרייני בקליק את התאריך שלך. [cite: 218, 219]
        </p>
      </header>

      {/* 🔍 פאנל סינונים קריסטלי מבריק */}
      <section className="max-w-6xl mx-auto px-4 mb-14 relative z-10"> [cite: 219]
        <div className="bg-white/90 backdrop-blur-xl p-6 rounded-2xl border-2 border-[#e6c687] shadow-[0_20px_50px_rgba(212,175,55,0.18)] grid grid-cols-1 md:grid-cols-3 gap-6 items-end"> [cite: 219]
          <div>
            <label className="block text-xs font-black text-[#8b6508] tracking-wide mb-2">חפשי שמלה זוהרת</label> [cite: 219]
            <input type="text" placeholder="שמלת החלומות שלך..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-3 bg-neutral-50/50 border border-[#dfc48c] rounded-xl text-xs text-neutral-900 font-medium focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition placeholder-neutral-400" /> [cite: 219]
          </div>
          <div>
            <label className="block text-xs font-black text-[#8b6508] tracking-wide mb-2">בחרי מידה</label> [cite: 219]
            <div className="flex gap-1.5 bg-[#f5ebd2] p-1 rounded-xl border border-[#dec085]"> [cite: 219]
              {['All', 'S', 'M', 'L'].map((size) => ( [cite: 219]
                <button key={size} onClick={() => setSelectedSize(size)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${ selectedSize === size ? 'bg-gradient-to-r from-[#d4af37] to-[#aa8010] text-white shadow-md transform scale-102 font-black' : 'text-[#6d5b3a] hover:text-black hover:bg-white/40' }`} > {size === 'All' ? 'הכל' : size} </button> [cite: 219, 220, 221, 222]
              ))}
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs font-black text-[#8b6508] mb-2"> [cite: 222]
              <span>טווח תקציב</span> [cite: 222]
              <span className="text-black font-black bg-[#f5ebd2] px-2 py-0.5 rounded border border-[#dec085]">₪{maxPrice}</span> [cite: 222]
            </div>
            <input type="range" min="300" max="1000" step="50" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-[#d4af37] h-1.5 bg-[#eadaaf] rounded-lg cursor-pointer" /> [cite: 222]
          </div>
        </div>
      </section>

      {/* 👗 גלריית השמלות */}
      <section className="max-w-6xl mx-auto px-4 relative z-10"> [cite: 222]
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8"> [cite: 222]
          {filteredDresses.map((dress) => {
            const currentImgIndex = currentImageIndexes[dress.id] || 0; [cite: 222]
            const isFav = favorites.includes(dress.id); [cite: 222]
            const inCart = cart.some(item => item.id === dress.id); [cite: 222]
            return (
              <div key={dress.id} className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden border-2 border-[#ebd3a4]/60 shadow-[0_10px_30px_rgba(212,175,55,0.06)] hover:shadow-[0_25px_60px_rgba(212,175,55,0.22)] hover:border-[#d4af37] transition-all duration-300 transform hover:-translate-y-1" > [cite: 222, 223]
                <div className="h-[430px] w-full relative overflow-hidden bg-[#faf8f3] p-2.5"> [cite: 223]
                  <div className="w-full h-full rounded-xl overflow-hidden relative border border-[#f0e2c3]"> [cite: 223]
                    <button onClick={(e) => toggleFavorite(dress.id, e)} className="absolute top-3 left-3 z-10 bg-white/90 hover:bg-white w-8 h-8 rounded-full flex items-center justify-center shadow-md border border-[#eadaaf] text-sm transition transform active:scale-90" > {isFav ? '❤️' : '🤍'} </button> [cite: 223, 224]
                    <span className="absolute top-3 right-3 z-10 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white text-[10px] font-black px-3 py-1 rounded shadow-md"> מידה {dress.size} </span> [cite: 224]
                    {dress.images.length > 1 && ( [cite: 224]
                      <>
                        <button onClick={(e) => prevImage(dress.id, dress.images.length, e)} className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 bg-white/95 text-[#b8860b] w-9 h-9 rounded-full flex items-center justify-center shadow-lg border border-[#e8cc92] font-black text-lg hover:bg-gradient-to-r hover:from-[#d4af37] hover:to-[#b8860b] hover:text-white transition-all opacity-0 group-hover:opacity-100" > ‹ </button> [cite: 224]
                        <button onClick={(e) => nextImage(dress.id, dress.images.length, e)} className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 bg-white/95 text-[#b8860b] w-9 h-9 rounded-full flex items-center justify-center shadow-lg border border-[#e8cc92] font-black text-lg hover:bg-gradient-to-r hover:from-[#d4af37] hover:to-[#b8860b] hover:text-white transition-all opacity-0 group-hover:opacity-100" > › </button> [cite: 224]
                      </>
                    )}
                    <img src={dress.images[currentImgIndex]} alt={dress.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" /> [cite: 225]
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1 bg-white/95 px-2.5 py-1 rounded-full shadow-md border border-[#e0cba0]"> [cite: 225]
                      {dress.images.map((_, idx) => ( [cite: 225]
                        <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === currentImgIndex ? 'bg-[#d4af37] w-3.5' : 'bg-[#e5d9bd]'}`} /> [cite: 225, 226]
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-grow bg-gradient-to-b from-white to-[#fdfbf7]"> [cite: 226]
                  <div className="flex justify-between items-start gap-2"> [cite: 226]
                    <h3 className="text-lg font-bold text-neutral-900 tracking-wide group-hover:text-[#b8860b] transition-colors">{dress.name}</h3> [cite: 226]
                    <button onClick={(e) => toggleCart(dress, e)} className={`text-xs p-1.5 rounded-lg border transition ${ inCart ? 'bg-[#f4ebd4] border-[#d4af37] text-[#b8860b]' : 'border-neutral-200 hover:bg-neutral-50' }`} title={inCart ? "הסר מהסל" : "הוסף לסל שריונות מרוכז"} > {inCart ? '🛒 בסל' : '➕ לסל'} </button> [cite: 226, 227, 228]
                  </div>
                  <p className="mt-1.5 text-xs text-[#6e634c] font-normal leading-relaxed line-clamp-2 flex-grow"> {dress.description} </p> [cite: 228]
                  <div className="flex justify-between items-center mt-5 pt-4 border-t-2 border-dotted border-[#f0e6cc]"> [cite: 228]
                    <div className="flex flex-col"> [cite: 228]
                      <span className="text-[9px] uppercase tracking-widest text-[#b8860b] font-black">השכרה חגיגית</span> [cite: 228]
                      <span className="text-neutral-900 font-black text-lg">₪{dress.price}</span> [cite: 228]
                    </div>
                    <button onClick={() => { setSelectedDress(dress); setModalImageIndex(currentImgIndex); }} className="bg-gradient-to-r from-[#2c261a] to-[#4a3f2b] hover:from-[#d4af37] hover:to-[#b8860b] text-white text-xs font-bold px-4 py-3 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg transform active:scale-98" > שרייני לערב הזוהר שלך </button> [cite: 228, 229]
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ✨ מודאל הוספת שמלה לאתר ✨ */}
      {isAddDressOpen && ( [cite: 230]
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"> [cite: 230]
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border-2 border-[#d4af37] max-h-[90vh] overflow-y-auto" style={{ direction: 'rtl' }}> [cite: 230]
            <button onClick={() => setIsAddDressOpen(false)} className="absolute top-4 left-4 bg-neutral-100 hover:bg-[#d4af37] text-[#b8860b] hover:text-white w-8 h-8 rounded-full flex items-center justify-center border shadow-sm font-bold transition-all" > ✕ </button> [cite: 230]
            <div className="text-center mb-5"> [cite: 230]
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#b8860b] font-black block mb-1">✦ ADD TO THE COLLECTION ✦</span> [cite: 230]
              <h3 className="text-xl font-black text-neutral-950">הוספת דגם שמלה חדש</h3> [cite: 230]
              <div className="w-12 h-[1px] bg-[#d4af37] mx-auto mt-2"></div> [cite: 230]
            </div>
            <form onSubmit={handleAddDressSubmit} className="flex flex-col gap-4"> [cite: 230, 231]
              <div>
                <label className="block text-xs font-bold text-[#8b6508] mb-1">שם הדגם / השמלה *</label> [cite: 231]
                <input type="text" required placeholder="למשל: שמלת משי פנינה" value={newDressData.name} onChange={(e) => setNewDressData({...newDressData, name: e.target.value})} className="w-full p-2.5 bg-neutral-50 border border-[#decfa8] rounded-xl text-xs font-medium focus:outline-none focus:border-[#d4af37]" /> [cite: 231]
              </div>
              <div className="grid grid-cols-2 gap-4"> [cite: 231]
                <div>
                  <label className="block text-xs font-bold text-[#8b6508] mb-1">מחיר השכרה (₪) *</label> [cite: 231]
                  <input type="number" required placeholder="350" value={newDressData.price} onChange={(e) => setNewDressData({...newDressData, price: e.target.value})} className="w-full p-2.5 bg-neutral-50 border border-[#decfa8] rounded-xl text-xs font-medium focus:outline-none focus:border-[#d4af37]" /> [cite: 231]
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#8b6508] mb-1">מידה *</label> [cite: 231]
                  <select required value={newDressData.size} onChange={(e) => setNewDressData({...newDressData, size: e.target.value})} className="w-full p-2.5 bg-neutral-50 border border-[#decfa8] rounded-xl text-xs font-medium focus:outline-none focus:border-[#d4af37]" > [cite: 231, 232]
                    <option value="">בחרי...</option> [cite: 232]
                    <option value="XS">XS (34)</option> [cite: 232]
                    <option value="S">S (36)</option> [cite: 232]
                    <option value="M">M (38)</option> [cite: 232]
                    <option value="L">L (40)</option> [cite: 232]
                    <option value="XL">XL (42)</option> [cite: 232]
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#8b6508] mb-1">צבע השמלה</label> [cite: 232]
                <input type="text" placeholder="למשל: לבן שמנת, ורוד עתיק" value={newDressData.color} onChange={(e) => setNewDressData({...newDressData, color: e.target.value})} className="w-full p-2.5 bg-neutral-50 border border-[#decfa8] rounded-xl text-xs font-medium focus:outline-none focus:border-[#d4af37]" /> [cite: 232]
              </div>
              <div>
                <label className="block text-xs font-bold text-[#8b6508] mb-2">מצב השמלה</label> [cite: 232]
                <div className="flex gap-4 bg-neutral-50 p-2.5 rounded-xl border border-[#decfa8] justify-around"> [cite: 232]
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer"> <input type="radio" name="condition" value="new" checked={newDressData.condition === 'new'} onChange={(e) => setNewDressData({...newDressData, condition: e.target.value})} className="accent-[#d4af37]" /> חדש עם תווית </label> [cite: 232, 233]
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer"> <input type="radio" name="condition" value="like-new" checked={newDressData.condition === 'like-new'} onChange={(e) => setNewDressData({...newDressData, condition: e.target.value})} className="accent-[#d4af37]" /> כמו חדש </label> [cite: 233]
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer"> <input type="radio" name="condition" value="used" checked={newDressData.condition === 'used'} onChange={(e) => setNewDressData({...newDressData, condition: e.target.value})} className="accent-[#d4af37]" /> יד שנייה </label> [cite: 233]
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#8b6508] mb-1">תיאור השמלה וסוג הבד</label> [cite: 233]
                <textarea rows={3} placeholder="ספרי על השמלה, סוג הבד, התאמה לאירועים..." value={newDressData.description} onChange={(e) => setNewDressData({...newDressData, description: e.target.value})} className="w-full p-2.5 bg-neutral-50 border border-[#decfa8] rounded-xl text-xs font-medium focus:outline-none focus:border-[#d4af37] resize-none" /> [cite: 233, 234]
              </div>
              <div>
                <label className="block text-xs font-bold text-[#8b6508] mb-1">העלאת תמונות של השמלה</label> [cite: 234]
                <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="w-full p-2 bg-neutral-50 border border-dashed border-[#decfa8] rounded-xl text-xs file:ml-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#f4ebd4] file:text-[#8b6508] hover:file:bg-[#eadaaf] cursor-pointer" /> [cite: 234]
                {newDressData.images.length > 0 && ( [cite: 234]
                  <div className="flex gap-2 flex-wrap mt-2 bg-neutral-50 p-2 rounded-xl border border-neutral-100"> [cite: 234]
                    {newDressData.images.map((img, index) => ( [cite: 234]
                      <img key={index} src={img} alt="תצוגה מקדימה" className="w-12 h-12 object-cover rounded-lg border border-[#decfa8]" /> [cite: 234]
                    ))}
                  </div>
                )}
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-[#d4af37] via-[#b8860b] to-[#d4af37] hover:from-[#b8860b] hover:to-[#8b6508] text-white text-xs font-black py-3.5 rounded-xl shadow-lg mt-2 transition-transform active:scale-98" > פרסמי שמלה בקולקציה ✨ </button> [cite: 234, 235]
            </form>
          </div>
        </div>
      )}

      {/* 💬 סקשן חוות דעת לקוחות */}
      <section className="max-w-6xl mx-auto px-4 mt-24 relative z-10"> [cite: 235]
        <div className="text-center mb-10"> [cite: 235]
          <span className="text-xs uppercase font-black text-[#b8860b] tracking-widest">REAL GLAMOUR STORIES</span> [cite: 235]
          <h2 className="text-3xl font-serif italic text-neutral-900 mt-1">מה הלקוחות שלנו מספרות</h2> [cite: 235]
          <div className="w-12 h-[1.5px] bg-[#d4af37] mx-auto mt-3"></div> [cite: 235]
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6"> [cite: 235]
          {REVIEWS.map((rev, index) => ( [cite: 235]
            <div key={index} className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-[#eadaaf] shadow-sm flex flex-col justify-between"> [cite: 235]
              <div>
                <div className="flex text-[#d4af37] gap-0.5 mb-3"> [cite: 235]
                  {Array.from({ length: rev.stars }).map((_, i) => <span key={i}>⭐</span>)} [cite: 235]
                </div>
                <p className="text-xs text-[#554a33] italic leading-relaxed">"{rev.text}"</p> [cite: 235]
              </div>
              <div className="mt-4 flex flex-col">
                <span className="text-xs font-bold text-neutral-950">{rev.name}</span>
                <span className="text-[10px] text-[#8b6508] font-medium">{rev.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}
