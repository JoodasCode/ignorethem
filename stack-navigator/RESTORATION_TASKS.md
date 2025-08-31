# Stack Navigator UI Restoration Tasks

## Phase 1: Core Dependencies & Configuration

### 1.1 Install Missing Core UI Dependencies
- [ ] Install class-variance-authority: `npm install class-variance-authority`
- [ ] Install @hookform/resolvers: `npm install @hookform/resolvers`
- [ ] Install react-hook-form: `npm install react-hook-form`
- [ ] Install date-fns: `npm install date-fns`
- [ ] Install react-day-picker: `npm install react-day-picker`

### 1.2 Install Animation & Motion Dependencies
- [ ] Install framer-motion: `npm install framer-motion`
- [ ] Install @radix-ui/react-icons: `npm install @radix-ui/react-icons`

### 1.3 Install Email Template Dependencies (if using email features)
- [ ] Install @react-email/components: `npm install @react-email/components`
- [ ] Install @react-email/render: `npm install @react-email/render`

### 1.4 Install Additional Utility Dependencies
- [ ] Install sonner: `npm install sonner`
- [ ] Install vaul: `npm install vaul`
- [ ] Install cmdk: `npm install cmdk`

## Phase 2: Theme & Styling Issues

### 2.1 Fix Theme Provider Integration
- [ ] Verify ThemeProvider is properly wrapped in layout.tsx
- [ ] Check if theme toggle component exists and works
- [ ] Test dark/light mode switching

### 2.2 Font Integration
- [ ] Install Google Fonts properly: `npm install @next/font`
- [ ] Verify Inter font is loading in layout.tsx
- [ ] Check if custom fonts (Oxanium, Merriweather, Fira Code) need installation

### 2.3 CSS Variables & Styling
- [ ] Verify all CSS custom properties are defined
- [ ] Check if Tailwind config matches the CSS variables
- [ ] Test responsive design breakpoints

## Phase 3: Page & Route Issues

### 3.1 Create Missing Page Components
- [ ] Verify /browse page exists: `app/browse/page.tsx`
- [ ] Verify /compare page exists: `app/compare/page.tsx`
- [ ] Verify /templates page exists: `app/templates/page.tsx`
- [ ] Create 404 page if missing: `app/not-found.tsx`

### 3.2 API Routes Verification
- [ ] Check all API routes in `app/api/` are working
- [ ] Verify API route handlers have proper imports
- [ ] Test API endpoints return expected responses

### 3.3 Dynamic Routes
- [ ] Check dynamic routes like `[id]` pages work
- [ ] Verify catch-all routes if any exist
- [ ] Test route parameters are properly handled

## Phase 4: Component Dependencies

### 4.1 Navigation Components
- [ ] Verify Navigation component renders properly
- [ ] Check if mobile navigation works
- [ ] Test all navigation links

### 4.2 UI Component Library
- [ ] Test Button component variants
- [ ] Test Card component layouts
- [ ] Test Input and Form components
- [ ] Test Dialog/Modal components
- [ ] Test Dropdown/Select components

### 4.3 Complex Components
- [ ] Test ChatInterface component
- [ ] Test LandingPage component
- [ ] Test any Dashboard components
- [ ] Test Error Boundary component

## Phase 5: External Service Integration

### 5.1 Supabase Integration
- [ ] Verify Supabase client connection works
- [ ] Test authentication flows
- [ ] Check database queries work
- [ ] Verify environment variables are correct

### 5.2 AI/Chat Integration
- [ ] Test AI chat functionality
- [ ] Verify OpenAI API integration
- [ ] Check conversation management

### 5.3 Analytics & Monitoring
- [ ] Test PostHog integration
- [ ] Verify Sentry error tracking
- [ ] Check analytics event tracking

## Phase 6: Build & Production Issues

### 6.1 TypeScript Issues
- [ ] Fix any TypeScript compilation errors
- [ ] Verify all type definitions are correct
- [ ] Check import/export statements

### 6.2 Build Process
- [ ] Test `npm run build` completes successfully
- [ ] Verify no build warnings or errors
- [ ] Check bundle size is reasonable

### 6.3 Performance
- [ ] Test page load speeds
- [ ] Verify images are optimized
- [ ] Check for any console errors

## Execution Order

1. Start with Phase 1 (Core Dependencies)
2. Move to Phase 2 (Theme & Styling) 
3. Address Phase 3 (Pages & Routes)
4. Fix Phase 4 (Components)
5. Test Phase 5 (External Services)
6. Validate Phase 6 (Build & Production)

## Notes
- Test the app after each phase completion
- Check browser console for errors after each step
- Verify both light and dark themes work
- Test on different screen sizes
- Check all interactive elements work properly