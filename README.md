# Quran Web Application

A high-performance REST API for the Holy Quran, built with Node.js, TypeScript, and Prisma. It provides access to Surahs, Ayahs, and translations, with support for pagination and search.

## Features
- **Surah List:** Paginated list of all 114 Surahs with metadata.
- **Ayat by Surah:** Retrieve verses for a specific Surah with Uthmani script and translations.
- **Search:** Full-text search across translations.
- **Fast Performance:** Uses Prisma with an optimized PostgreSQL adapter and connection pooling.
- **Auto-Seeding:** Integrated script to fetch and seed data from Al Quran Cloud API.

## Tech Stack
- **Runtime:** Node.js (v20+)
- **Language:** TypeScript
- **Framework:** Express.js
- **ORM:** Prisma 7
- **Database:** PostgreSQL
- **Execution:** tsx (for direct TS execution)

---

## Getting Started

### 1. Prerequisites
- Node.js (v20 or higher)
- PostgreSQL instance running

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/quran_new?schema=public"
PG_CONNECTION_URL="postgresql://user:password@localhost:5432/quran_new?schema=public"
PORT=3002
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Migration & Seeding
```bash
# Apply migrations
npx prisma migrate deploy

# Seed data (fetches from API and populates DB)
npm run db:seed
```

### 5. Run the Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

---

## API Documentation

### 1. List Surahs
Returns a paginated list of all Surahs.

**Endpoint:** `GET /api/surahs`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 114)

**Sample Request:**
`GET http://localhost:3002/api/surahs?page=1&limit=2`

**Sample Response:**
```json
{
  "data": [
    {
      "id": 1,
      "nameArabic": "سُورَةُ ٱلْفَاتِحَةِ",
      "nameTransliterated": "Al-Faatiha",
      "nameEnglish": "The Opening",
      "revelationType": "MECCAN",
      "ayahCount": 7
    },
    {
      "id": 2,
      "nameArabic": "سُورَةُ البَقَرَةِ",
      "nameTransliterated": "Al-Baqara",
      "nameEnglish": "The Cow",
      "revelationType": "MEDINAN",
      "ayahCount": 286
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 2,
    "total": 114,
    "totalPages": 57,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 2. Get Ayat by Surah
Returns verses for a specific Surah with translations.

**Endpoint:** `GET /api/surahs/:surahNumber/ayat`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `edition` (optional): Translation slug (default: `en-sahih`)

**Sample Request:**
`GET http://localhost:3002/api/surahs/1/ayat?limit=2`

**Sample Response:**
```json
{
  "surah": {
    "id": 1,
    "nameArabic": "سُورَةُ ٱلْفَاتِحَةِ",
    "nameTransliterated": "Al-Faatiha",
    "nameEnglish": "The Opening",
    "revelationType": "MECCAN",
    "ayahCount": 7
  },
  "edition": {
    "slug": "en-sahih",
    "name": "Sahih International",
    "languageCode": "en"
  },
  "data": [
    {
      "id": "cm9e...",
      "verseInSurah": 1,
      "globalVerseIndex": 1,
      "textArabic": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
      "textTranslation": "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
      "page": 1,
      "juz": 1,
      "hizbQuarter": 1,
      "sajdahType": "NONE"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 2,
    "total": 7,
    "totalPages": 4,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 3. Search Ayat
Search for verses across translations.

**Endpoint:** `GET /api/ayat/search`

**Query Parameters:**
- `q`: Search query (minimum 2 characters)
- `page` (optional): Page number
- `edition` (optional): Translation slug

**Sample Request:**
`GET http://localhost:3002/api/ayat/search?q=merciful&limit=1`

**Sample Response:**
```json
{
  "query": "merciful",
  "edition": {
    "slug": "en-sahih",
    "name": "Sahih International"
  },
  "results": [
    {
      "surahNumber": 1,
      "surahNameArabic": "سُورَةُ ٱلْفَاتِحَةِ",
      "surahNameEnglish": "The Opening",
      "surahNameTransliterated": "Al-Faatiha",
      "verseInSurah": 1,
      "globalVerseIndex": 1,
      "textArabic": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
      "textTranslation": "In the name of Allah, the Entirely Merciful, the Especially Merciful."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 1,
    "total": 354,
    "totalPages": 354,
    "hasNext": true,
    "hasPrev": false
  }
}
```
