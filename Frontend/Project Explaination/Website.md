# Website Module Documentation

## Overview
The Website module implements the public-facing landing page, including navigation, footer, contact, home, and pricing pages. It provides a modern, animated, and responsive user interface for visitors, integrating with backend services for dynamic content such as subscription plans and reviews.

---

## 1. Web Footer Component

### TypeScript (`web-footer.component.ts`)
- Stateless component for rendering the website footer.
- No business logic or lifecycle hooks used.

### HTML (`web-footer.component.html`)
- Renders the footer with logo, navigation links, email contact, and social media links.
- Includes a scroll-to-top button (likely controlled by external JS/TS).

### SCSS (`web-footer.component.scss`)
- No custom styles defined in the provided file.

---

## 2. Web Navigation Component

### TypeScript (`web-nav.component.ts`)
- Handles navigation bar logic, including user authentication state and dashboard navigation.
- Uses GSAP for menu and navigation animations.
- Manages mobile menu open/close with timeline animations.
- Fetches user profile data to conditionally render dashboard/login/register buttons.
- Navigates to the appropriate dashboard route based on user role.

### HTML (`web-nav.component.html`)
- Renders navigation links, logo, and login/register/dashboard buttons.
- Implements a responsive side menu for mobile devices.
- Uses Angular routerLink for navigation.

### SCSS (`web-nav.component.scss`)
- No custom styles defined in the provided file.

---

## 3. Contact Component

### TypeScript (`contact.component.ts`)
- Stateless component for rendering the contact page.
- No business logic or lifecycle hooks used.

### HTML (`contact.component.html`)
- Renders a contact form, company contact details, and includes the web navigation and footer components.
- Uses Tailwind CSS classes for layout and styling.

### SCSS (`contact.component.scss`)
- No custom styles defined in the provided file.

---

## 4. Home Component

### TypeScript (`home.component.ts`)
- Implements all landing page animations and interactivity using GSAP.
- Animates hero section, video hover, FAQ accordion, scroll-triggered effects, and feature boxes.
- Loads statistics from the HomeService.
- No direct data fetching for reviews in the provided code.
- All animation logic is encapsulated in private methods called after view initialization.

### HTML (`home.component.html`)
- Renders the hero section, about, features, newsletter, FAQ, testimonials, and footer.
- Uses Angular structural directives for layout.
- Integrates with the navigation and footer components.
- Uses Tailwind CSS for styling.

### SCSS (`home.component.scss`)
- No custom styles defined in the provided file.

---

## 5. Pricing Component

### TypeScript (`pricing.component.ts`)
- Fetches and paginates subscription plans from the backend using SubscriptionsService.
- Fetches and paginates approved reviews using HomeService.
- Manages loading states, pagination, and UI state for plans and reviews.
- Provides utility methods for formatting names, ratings, and dates.

### HTML (`pricing.component.html`)
- Renders a grid of subscription plans with pagination and loading skeletons.
- Displays testimonials, reviews, and statistics.
- Integrates with the navigation and footer components.
- Uses Tailwind CSS for styling.

### SCSS (`pricing.component.scss`)
- No custom styles defined in the provided file.

---

## Notes
- All business logic for data fetching is abstracted through services (`HomeService`, `SubscriptionsService`).
- All animations are handled using GSAP in the Home and WebNav components.
- For any unclear data structure or service method, a log statement should be inserted in the relevant file and the user should provide the following log output:
  - The full response or object structure returned by the service or method in question.
  - The values of any relevant variables at the point of logging.

---

# End of Website Module Documentation 