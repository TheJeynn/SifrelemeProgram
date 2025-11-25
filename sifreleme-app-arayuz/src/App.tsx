import React, { useState, useEffect } from 'react';
import './App.css'; 

// --- YENİ TİP TANIMLAMALARI ---
// C#'taki ResponseDtos.cs dosyamızdaki tiplere karşılık geliyor
interface VaultDto {
  id: number;
  name: string;
  description: string | null;
}

interface LoginResponse {
  accessToken: string;
}

function App() {
  // --- YENİ STATE (DURUM) YÖNETİMİ ---
  // Sadece email/password değil, artık token'ı ve kasaları da state'te tutuyoruz
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [message, setMessage] = useState<string>('Lütfen giriş yapın.');
  
  // localstorage'dan token'ı okuyarak başla
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [vaults, setVaults] = useState<VaultDto[]>([]); // Kasa listesi

  // --- API URL'LERİMİZ ---
  const API_BASE_URL = 'https://localhost:7202';


  // --- YENİ FONKSİYON: KASALARI GETİR (GET /api/vaults) ---
  const fetchVaults = async (currentToken: string) => {
    setMessage('Kasalarınız yükleniyor...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/vaults`, {
        method: 'GET',
        headers: {
          // EN ÖNEMLİ KISIM: API'ye "Ben kimim?" demek için
          // token'ı (anahtarı) "Bearer" olarak ekliyoruz
          'Authorization': `Bearer ${currentToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json() as VaultDto[];
        setVaults(data); // Gelen kasa listesini state'e kaydet
        setMessage(''); // Mesajı temizle
      } else {
        // Token süresi dolmuş olabilir (401 hatası)
        setMessage('Oturumunuzun süresi dolmuş. Lütfen tekrar giriş yapın.');
        handleLogout(); // Oturumu kapat
      }
    } catch (error) {
      console.error('Kasa çekme hatası:', error);
      setMessage('Kasalar yüklenirken bir hata oluştu.');
    }
  };

  // --- GİRİŞ FONKSİYONU (GÜNCELLENDİ) ---
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); 
    setMessage('Giriş yapılıyor, lütfen bekleyin...');
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json() as LoginResponse;
        
        // Token'ı hem local storage'a hem de state'e kaydet
        localStorage.setItem('token', data.accessToken);
        setToken(data.accessToken); 
        
        // GİRİŞ BAŞARILI, ŞİMDİ KASALARI ÇEK
        await fetchVaults(data.accessToken); 
        
        setMessage(''); // Mesajı temizle
      } else {
        setMessage('Giriş başarısız! E-posta veya şifre hatalı.');
      }
    } catch (error) {
      console.error('Fetch Hatası:', error);
      setMessage('API\'ye bağlanırken bir hata oluştu.');
    }
  };

  // --- YENİ FONKSİYON: ÇIKIŞ YAP ---
  const handleLogout = () => {
    localStorage.removeItem('token'); // Hafızadan token'ı sil
    setToken(null); // State'i temizle
    setVaults([]); // Kasa listesini temizle
    setMessage('Çıkış yapıldı.');
  };

  // --- YENİ: SAYFA İLK YÜKLENDİĞİNDE ÇALIŞAN KOD ---
  // Bu useEffect, sayfa ilk açıldığında çalışır
  // Eğer token varsa, giriş formunu atlayıp doğrudan kasaları çeker
  useEffect(() => {
    if (token) {
      fetchVaults(token);
    }
  }, []); // Boş dizi '[]', "sadece bir kez çalış" demektir


  // --- EKRANDA GÖRÜNECEK HTML KISMI (GÜNCELLENDİ) ---
  return (
    <div className="App">
      <header className="App-header">
        <h1>Şifreleme App</h1>
        
        {/* EĞER TOKEN YOKSA (GİRİŞ YAPMAMIŞSA), GİRİŞ FORMUNU GÖSTER */}
        {!token ? (
          <form onSubmit={handleLogin}>
            <h2>Giriş</h2>
            <div>
              <label>E-posta:</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div>
              <label>Şifre:</label>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit">Giriş Yap</button>
            {message && <p>{message}</p>}
          </form>
        ) : (
          // EĞER TOKEN VARSA (GİRİŞ YAPMIŞSA), KASALARI GÖSTER
          <div>
            <h2>Kasalarınız</h2>
            <button onClick={handleLogout}>Çıkış Yap</button>
            {message && <p>{message}</p>}
            
            {vaults.length > 0 ? (
              <ul>
                {vaults.map(vault => (
                  <li key={vault.id}>
                    <strong>{vault.name}</strong>
                    <p>{vault.description}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Henüz bir kasanız yok.</p>
            )}
          </div>
        )}
      </header>
    </div>
  );
}

export default App;