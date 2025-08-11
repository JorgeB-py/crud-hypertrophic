Hypertrophic · CRUD Dashboard

Panel de administración para productos, marcas y pedidos de Hypertrophic.
Construido con Next.js (App Router), Firebase (Auth + Firestore) y shadcn/ui.

Features:
- Auth (Email/Password) sin registro público (solo usuarios creados en Firebase Console).
- Productos: CRUD completo, variantes, campos extra dinámicos por producto y por variante.
- Marcas: CRUD con logo y búsqueda.
- Pedidos: listado y detalle (cliente, ítems, estado, total).
- UI limpia con shadcn/ui, accesible, responsive y con atajos visuales.
- Reglas de Firestore seguras: público lee, solo logueados escriben; pedidos restringidos.

Stack:
- Next.js 14 (App Router)
- Firebase: Authentication + Firestore
- Tailwind CSS + shadcn/ui
- TypeScript

Quick Start:
1) Clonar
   git clone https://github.com/<tu-usuario>/<tu-repo>.git
   cd <tu-repo>

2) Instalar deps
   npm i

3) Variables de entorno
   cp .env.example .env.local   # y rellena con tus claves

4) Dev
   npm run dev

Abre http://localhost:3000.

Configurar Firebase:
1. Crear proyecto en Firebase Console.
2. Firestore: habilitar en modo producción.
3. Authentication → Email/Password.
4. Crear usuarios manualmente.
5. Copiar claves SDK Web a .env.local.

.env.local ejemplo:
NEXT_PUBLIC_FB_API_KEY=AIzaSy...
NEXT_PUBLIC_FB_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FB_PROJECT_ID=tu-proyecto
NEXT_PUBLIC_FB_STORAGE_BUCKET=tu-proyecto.appspot.com
NEXT_PUBLIC_FB_MESSAGE_SENDER=1234567890
NEXT_PUBLIC_FB_APP_ID=1:1234567890:web:abc123
NEXT_PUBLIC_FB_MEASUREMENT_ID=G-XXXXXXX

Rutas principales:
- /           Home
- /login      Iniciar sesión
- /productos  CRUD productos
- /marcas     CRUD marcas
- /pedidos    Listado + detalle pedidos

Modelo de datos:
(Product, Variant, Market, Pedido) — ver descripción detallada en el README original.

Reglas de Firestore recomendadas:
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() { return request.auth != null; }
    function isAdmin() { return isSignedIn() && request.auth.token.admin == true; }

    match /productos/{id} {
      allow read: if true;
      allow write: if isSignedIn();
    }

    match /marcas/{id} {
      allow read: if true;
      allow write: if isSignedIn();
    }

    match /pedidos/{id} {
      allow read, create, update, delete: if isAdmin();
    }

    match /users/{uid} {
      allow read, update: if isSignedIn() && request.auth.uid == uid;
      allow create: if isSignedIn() && request.auth.uid == uid;
    }
  }
}

Scripts:
npm run dev     # desarrollo
npm run build   # build producción
npm run start   # producción
npm run lint    # lint

Seguridad:
- No exponer claves privadas.
- Crear usuarios manualmente.
- Reglas de Firestore activas antes del deploy.

Licencia:
MIT © Hypertrophic
