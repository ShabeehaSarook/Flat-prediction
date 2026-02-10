# Real Estate Price Prediction - Vite + React Frontend

Professional React frontend built with Vite for real estate price prediction.

## Features

- React 18 with Vite for fast development
- Professional authentication pages (Login/Register)
- Property price prediction with backend integration
- SVG icons (no emojis/logos)
- Professional responsive design
- Real-time backend connection monitoring
- Form validation
- Error handling

## Tech Stack

- React 18.2
- Vite 5.0
- React Router DOM 6.20
- Axios 1.6
- CSS3 with custom properties

## Installation

```bash
cd frontend
npm install
```

## Development

```bash
npm run dev
```

App runs at: http://localhost:5173

## Build

```bash
npm run build
```

## Project Structure

```
frontend/
├── src/
│   ├── components/      # Reusable components
│   ├── context/         # Auth context
│   ├── pages/           # Login, Register, Home
│   ├── services/        # API integration
│   ├── styles/          # CSS files
│   ├── App.jsx          # Main app
│   └── main.jsx         # Entry point
├── index.html           # HTML template
├── vite.config.js       # Vite configuration
└── package.json         # Dependencies
```

## Environment Variables

Create `.env` file:

```
VITE_API_URL=http://localhost:3000
```

## Prerequisites

Ensure backend servers are running:
1. Flask ML API (port 5000)
2. Node.js backend (port 3000)

## Usage

1. Start backend servers
2. Run `npm run dev`
3. Open http://localhost:5173
4. Register/Login
5. Use prediction form

## Status

✅ Vite + React setup complete
✅ All pages implemented
✅ Backend integration working
✅ Professional styling applied
✅ Ready for use
