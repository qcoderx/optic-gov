# Optic-Gov - AI-Powered Public Infrastructure Verification

A production-ready React application for the Optic-Gov landing page, featuring AI-powered infrastructure verification using Gemini 2.5 Flash as an Oracle.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/                 # Reusable UI primitives
│   │   ├── Button.tsx      # Button component with variants
│   │   ├── Icon.tsx        # Material Symbols icon wrapper
│   │   └── StatusBadge.tsx # Status indicator with animations
│   ├── layout/             # Layout components
│   │   ├── Header.tsx      # Navigation header with wallet
│   │   └── Footer.tsx      # Footer with CTA and links
│   └── sections/           # Page sections
│       ├── HeroSection.tsx # Hero with demo interface
│       ├── FeaturesSection.tsx # Feature cards
│       └── HowItWorksSection.tsx # Process steps
├── hooks/
│   └── useWallet.ts        # MetaMask wallet integration
├── types/
│   └── index.ts           # TypeScript interfaces
└── styles/
    └── globals.css        # Global styles and utilities
```

## 🎨 Design System

### Colors
- **Primary**: `#10b981` (Emerald 500)
- **Primary Dark**: `#059669` (Emerald 600)
- **Background Dark**: `#0b0c10`
- **Card Dark**: `#15181e`
- **Border Dark**: `#252a33`
- **Text Secondary**: `#9ca3af`

### Typography
- **Display Font**: Space Grotesk
- **Body Font**: Noto Sans

## 🔧 Component Usage

### Button Component
```tsx
import { Button } from '@/components/ui/Button';

<Button variant="primary" size="lg" loading={isLoading}>
  Launch App
</Button>
```

### Icon Component
```tsx
import { Icon } from '@/components/ui/Icon';

<Icon name="verified_user" size="lg" className="text-primary" />
```

### Wallet Hook
```tsx
import { useWallet } from '@/hooks/useWallet';

const { isConnected, connectWallet, address } = useWallet();
```

## 🌟 Key Features

### Accessibility
- Keyboard navigation support
- ARIA attributes for screen readers
- Focus management
- Semantic HTML structure
- High contrast ratios

### Responsive Design
- Mobile-first approach
- Tablet and desktop optimizations
- Flexible grid layouts
- Touch-friendly interactions

### Performance
- Lazy loading for images
- Optimized bundle size
- Tree-shaking enabled
- Modern build tools (Vite)

### Animations
- Subtle micro-interactions
- Hover and focus states
- Loading states
- Respects reduced motion preferences

## 🔌 Integration Points

### Wallet Connection
The `useWallet` hook provides MetaMask integration:
- Connection status
- Account address
- Error handling
- Loading states

### API Integration
To connect real data, update these files:
- `src/components/sections/HeroSection.tsx` - Replace mock verification data
- Add API service in `src/services/` directory
- Update types in `src/types/index.ts`

### Smart Contract Integration
Add contract interaction in:
```
src/
├── contracts/
│   ├── abi/           # Contract ABIs
│   └── addresses.ts   # Contract addresses
└── services/
    └── blockchain.ts  # Web3 service layer
```

## 🎯 UX Enhancements Made

1. **Interactive Demo Interface**: Live verification simulation in hero section
2. **Smooth Animations**: Hover effects, loading states, and transitions
3. **Status Indicators**: Live badge with pulsing animation
4. **Progress Visualization**: Step-by-step process with visual connections
5. **Accessible Navigation**: Keyboard support and focus management
6. **Responsive Layout**: Optimized for all screen sizes
7. **Loading States**: Button loading indicators and skeleton states
8. **Error Handling**: Graceful wallet connection error messages

## 🛠 Development

### Adding New Components
1. Create component in appropriate directory
2. Export from index file if needed
3. Add TypeScript interfaces in `types/index.ts`
4. Follow existing naming conventions

### Styling Guidelines
- Use Tailwind utility classes
- Follow existing color palette
- Maintain consistent spacing scale
- Use semantic class names for complex components

### Testing
```bash
# Add testing framework (recommended)
npm install -D @testing-library/react @testing-library/jest-dom vitest
```

## 📦 Dependencies

### Core
- React 18.2.0
- TypeScript 5.2.2
- Vite 5.0.8

### Styling
- Tailwind CSS 3.3.6
- PostCSS 8.4.32
- Autoprefixer 10.4.16

### Utilities
- clsx 2.0.0 (for conditional classes)

## 🚀 Deployment

```bash
# Build for production
npm run build

# The dist/ folder contains the production build
# Deploy to your preferred hosting platform
```

## 🔄 Future Enhancements

1. **Real API Integration**: Connect to actual Gemini Oracle
2. **Smart Contract Integration**: Add Web3 functionality
3. **User Dashboard**: Project management interface
4. **Real-time Updates**: WebSocket for live verification status
5. **Multi-language Support**: i18n implementation
6. **Advanced Analytics**: Usage tracking and metrics