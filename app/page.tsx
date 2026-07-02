import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import { useState, useEffect } from 'react';

// חיבור ל-Supabase באמצעות המפתחות שהגדרת ב-Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Dress {
  id: string;
  name: string;
  price: number;
  size: string;
  color: string;
  description: string;
  images: string[]; // מערך של תמונות לסליידר
}

export default function DressesPage() {
  const [dresses, setDresses] = useState<Dress[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndexes, setCurrentImageIndexes] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    async function fetchDresses() {
      // שליפת שמלות שקיבלו אישור (is_approved = true)
      const { data, error } = await supabase
        .from('dresses')
        .select('*')
        .eq('is_approved', true);

      if (!error && data) {
        setDresses(data);
        // מאתחל את האינדקס של הסליידר לכל שמלה ל-0
        const indexes: { [key: string]: number } = {};
        data.forEach((dress) => {
          indexes[dress.id] = 0;
        });
        setCurrentImageIndexes(indexes);
      }
      setLoading(false);
    }
    fetchDresses();
  }, []);

  // פונקציות לדפדוף בסליידר התמונות
  const nextImage = (dressId: string, totalImages: number) => {
    setCurrentImageIndexes((prev) => ({
      ...prev,
      [dressId]: (prev[dressId] + 1) % totalImages,
    }));
  };

  const prevImage = (dressId: string, totalImages: number) => {
    setCurrentImageIndexes((prev) => ({
      ...prev,
      [dressId]: (prev[dressId] - 1 + totalImages) % totalImages,
    }));
  };

  if (loading) {
    return <div className="text-center p-10 dir-rtl">טוען שמלות מהממות...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 dir-rtl" dir="rtl">
      <h1 className="text-3xl font-bold text-center mb-8">קולקציית השמלות שלנו</h1>
      
      {dresses.length === 0 ? (
        <p className="text-center text-gray-500">אין שמלות זמינות כרגע. שמלות חדשות יופיעו לאחר אישור מנהלת.</p>
      ) : (
        <div className="grid grid-cols-1 md-cols-2 lg-cols-3 gap-8">
          {dresses.map((dress) => {
            const currentIdx = currentImageIndexes[dress.id] || 0;
            const hasImages = dress.images && dress.images.length > 0;

            return (
              <div key={dress.id} className="border rounded-lg overflow-hidden shadow-lg bg-white flex flex-col">
                
                {/* אזור סליידר התמונות */}
                <div className="relative h-96 w-full bg-gray-100 group">
                  {hasImages ? (
                    <>
                      <Image
                        src={dress.images[currentIdx]}
                        alt={dress.name}
                        fill
                        className="object-cover"
                      />
                      
                      {/* חצים לדפדוף - יופיעו רק אם יש יותר מתמונה אחת */}
                      {dress.images.length > 1 && (
                        <>
                          <button
                            onClick={() => prevImage(dress.id, dress.images.length)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow text-gray-800 z-10 font-bold"
                          >
                            ▶
                          </button>
                          <button
                            onClick={() => nextImage(dress.id, dress.images.length)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow text-gray-800 z-10 font-bold"
                          >
                            ◀
                          </button>
                          {/* אינדיקטור נקודות בתחתית התמונה */}
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                            {dress.images.map((_, idx) => (
                              <div
                                key={idx}
                                className={`w-2 h-2 rounded-full ${idx === currentIdx ? 'bg-black' : 'bg-gray-400'}`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">אין תמונה זמינה</div>
                  )}
                </div>

                {/* פרטי השמלה */}
                <div className="p-4 flex flex-col flex-grow">
                  <h2 className="text-xl font-semibold mb-2">{dress.name}</h2>
                  <p className="text-gray-600 text-sm mb-4 flex-grow">{dress.description}</p>
                  
                  <div className="border-t pt-3 flex justify-between items-center text-sm font-medium text-gray-700">
                    <div>מידה: <span className="font-bold">{dress.size}</span></div>
                    <div>צבע: <span className="font-bold">{dress.color}</span></div>
                    <div className="text-lg font-bold text-pink-600">{dress.price} ₪</div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
