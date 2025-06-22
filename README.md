# GalleryDB - System Zarządzania Galeriami

Nowoczesna aplikacja webowa do zarządzania galeriami zdjęć, użytkownikami i obrazami zbudowana w Node.js, Express, MongoDB i Bootstrap 5.

## 🚀 Funkcjonalności

- **Zarządzanie galeriami** - tworzenie i organizacja galerii zdjęć
- **Zarządzanie obrazami** - przesyłanie, organizacja i podgląd obrazów
- **Zarządzanie użytkownikami** - rejestracja, logowanie, role (Admin/Użytkownik)
- **Panel statystyk** - przegląd danych i aktywności
- **Nowoczesny interfejs** - responsywny design z Bootstrap 5

## 🛠️ Technologie

- **Backend**: Node.js, Express.js
- **Baza danych**: MongoDB z Mongoose
- **Frontend**: Pug templates, Bootstrap 5
- **Uwierzytelnianie**: JWT
- **Przesyłanie plików**: Formidable

## 📋 Wymagania

- Node.js (wersja 14 lub wyższa)
- npm
- MongoDB

## 🚀 Instalacja

### 1. Sklonuj repozytorium
```bash
git clone <repository-url>
cd gallery-copy
```

### 2. Zainstaluj zależności
```bash
npm install
```

### 3. Skonfiguruj środowisko
Utwórz plik `.env` w głównym katalogu:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/gallerydb
JWT_SECRET=twoj-sekret-klucz
NODE_ENV=development
```

### 4. Uruchom MongoDB
```bash
# Uruchom MongoDB lokalnie
mongod

# Lub użyj MongoDB Atlas - zaktualizuj MONGODB_URI w .env
```

### 5. Uruchom aplikację
```bash
npm start
```

Aplikacja będzie dostępna pod adresem `http://localhost:3000`

## 🗄️ Baza danych

### Automatyczne tworzenie kolekcji
Aplikacja automatycznie utworzy potrzebne kolekcje w MongoDB na podstawie schematów:

- **users** - użytkownicy systemu
- **galleries** - galerie zdjęć  
- **images** - obrazy w galeriach

Nie musisz ręcznie tworzyć tabel - wszystko dzieje się automatycznie!

### Automatyczne tworzenie konta administratora
Przy pierwszym uruchomieniu aplikacja automatycznie utworzy konto administratora:
- **Username**: admin
- **Password**: admin123 (zahashowane)
- **Role**: Administrator (pełne uprawnienia)

### Połączenie z bazą
- Domyślnie: `mongodb://localhost:27017/gallerydb`
- Możesz zmienić przez zmienną `MONGODB_URI` w pliku `.env`
- Obsługuje MongoDB Atlas (chmura) i lokalną instalację

## 👤 Domyślne konto administratora

Aplikacja automatycznie tworzy konto administratora przy pierwszym uruchomieniu:

- **Login**: admin
- **Hasło**: admin123 lub admin1

**Ważne**: 
- Konto jest tworzone automatycznie przy pierwszym uruchomieniu aplikacji
- Zmień domyślne hasło po pierwszym logowaniu!
- Jeśli konto już istnieje, nie zostanie utworzone ponownie

## 📱 Jak używać

### 🔐 Logowanie
1. Przejdź do strony logowania
2. Wprowadź dane logowania
3. Administratorzy mają dostęp do wszystkich funkcji
4. Zwykli użytkownicy mogą zarządzać tylko swoimi galeriami

### 🖼️ Tworzenie galerii
1. Zaloguj się
2. Kliknij "Add Gallery" w menu bocznym
3. Wypełnij nazwę i opis galerii
4. Wyślij formularz

### 📸 Przesyłanie obrazów
1. Przejdź do "Add Image"
2. Wybierz plik obrazu (JPEG, PNG, GIF)
3. Wybierz galerię
4. Dodaj nazwę i opis obrazu
5. Wyślij formularz

### 🔍 Przeglądanie galerii
1. Przejdź do "Browse Gallery"
2. Wybierz galerię z listy
3. Zobacz wszystkie obrazy w galerii
4. Użyj przycisków akcji do podglądu, edycji lub usuwania

## 🔧 Konfiguracja

### Zmienne środowiskowe
- `PORT`: Port serwera (domyślnie: 3000)
- `MONGODB_URI`: String połączenia z MongoDB
- `JWT_SECRET`: Sekretny klucz dla JWT
- `NODE_ENV`: Tryb środowiska (development/production)

### Ustawienia przesyłania plików
- Maksymalny rozmiar: 10MB
- Obsługiwane formaty: JPEG, PNG, GIF
- Katalog przesyłania: `public/images/`

## 🐛 Rozwiązywanie problemów

**Problem z połączeniem MongoDB**
- Upewnij się, że MongoDB jest uruchomione
- Sprawdź string połączenia w `.env`
- Sprawdź czy port 27017 jest dostępny

**Problem z przesyłaniem plików**
- Sprawdź uprawnienia do katalogu `public/images/`
- Sprawdź limit rozmiaru pliku
- Upewnij się, że format pliku jest obsługiwany

**Problem z uwierzytelnianiem**
- Wyczyść ciasteczka przeglądarki
- Sprawdź konfigurację JWT_SECRET
- Sprawdź dane logowania

---

**GalleryDB** - Nowoczesne zarządzanie galeriami! 🎨📸