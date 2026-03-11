# Sports E-commerce Frontend

Modern, responsive React.js frontend for sports e-commerce and court booking platform.

## Features

- 🛍️ **E-commerce**: Product browsing, cart, checkout
- 🏟️ **Court Booking**: Search, book, and manage court reservations
- 👤 **User Management**: Authentication, profile, orders, bookings
- 🎨 **Modern UI**: Nike-inspired design with Bootstrap 5
- 🌙 **Dark Mode**: Toggle between light and dark themes
- 🌍 **i18n**: English and Vietnamese support
- 📱 **Responsive**: Mobile-first design
- ⚡ **Performance**: Code splitting, lazy loading

## Tech Stack

- **React 18** - UI library
- **React Router 6** - Routing
- **Redux Toolkit** - State management
- **Bootstrap 5** - Styling
- **React Bootstrap** - Bootstrap components
- **Framer Motion** - Animations
- **React Hook Form + Zod** - Form validation
- **Axios** - API calls
- **react-i18next** - Internationalization
- **Vite** - Build tool

## Installation

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update .env with your API URL
VITE_API_BASE_URL=http://localhost:3000/api
```

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/       # Reusable components
│   ├── Layout/
│   ├── Navbar/
│   ├── Footer/
│   ├── ProductCard/
│   └── ...
├── pages/           # Page components
│   ├── Home/
│   ├── Products/
│   ├── ProductDetail/
│   ├── Cart/
│   ├── Checkout/
│   ├── Courts/
│   ├── Booking/
│   ├── Auth/
│   ├── Profile/
│   └── Admin/
├── store/           # Redux store
│   ├── slices/
│   └── store.js
├── services/        # API services
│   └── api.js
├── i18n/            # Internationalization
│   ├── locales/
│   └── config.js
└── styles/          # Global styles
    └── index.css
```

## API Integration

The frontend expects a backend API at `http://localhost:3000/api` (configurable via `.env`).

### Key Endpoints Used:
- `/api/auth/*` - Authentication
- `/api/products/*` - Products
- `/api/cart/*` - Shopping cart
- `/api/orders/*` - Orders
- `/api/bookings/*` - Court bookings
- `/api/courts/*` - Courts
- `/api/wishlist/*` - Wishlist
- `/api/addresses/*` - Addresses

## Features Overview

### Authentication
- Login/Register with email
- Firebase Google OAuth (ready)
- JWT token management
- Protected routes

### Products
- Product listing with filters
- Product detail with variants
- Add to cart/wishlist
- Search functionality

### Shopping Cart
- Add/remove items
- Update quantities
- Calculate totals
- Proceed to checkout

### Court Booking
- Browse available courts
- Select date and time slots
- Create bookings
- Manage bookings

### User Profile
- Edit profile
- View orders
- Manage bookings
- Wishlist

### Admin Dashboard
- Product management
- Order management
- Booking management

## Environment Variables

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=Sports E-commerce
VITE_APP_VERSION=1.0.0
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT
