# Lokebox Quote

Lokebox Quote is an interactive quoting tool. A visitor picks options, sees a live 3D preview, gets a price, and can leave their contact details. The first demo covers signage.

## Stack

- Vite, React and TypeScript
- Tailwind CSS v4, set up as a Vite plugin
- Framer Motion
- React Three Fiber and drei
- Supabase
- React Router

## Run it

You need Node 20 or newer.

```bash
npm install
npm run dev
```

The app runs on http://localhost:5173.

To build for production:

```bash
npm run build
npm run preview
```

## Environment

Copy `.env.example` to `.env` and fill in your Supabase values:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Layout

- `src/core` shared parts: layout, options panel, pricing engine, lead capture, printable quote, tracking
- `src/core/pricing` the pricing engine, a pure function
- `src/verticals/signage` the signage module: option schema and 3D preview
- `src/clients` one JSON file per client
- `src/pages` the landing page and the `/d/:slug` route
- `docs` project documents
