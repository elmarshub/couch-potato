# Couch Potato - Your Ultimate Movie & TV Discovery and Booking Platform

A modern, responsive web application built with Next.js 15, React 19, and TypeScript that helps you discover, track, and book your favorite movies and TV shows. Beyond discovery, it's a full virtual theater: browse showtimes, pick real seats, and pay through Stripe — with a cinematic design and smooth animations throughout.

## Features

### Discovery

- **User Authentication**: Secure login/signup with Supabase Auth
- **Watchlist Management**: Save movies and shows you want to watch later
- **Favorites System**: Mark your favorite content for quick access
- **Profile Management**: Customize your viewing preferences

### Theater & Booking

- **Admin Console**: Add movies to theaters as bookable showtimes with per-seat-tier pricing
- **Interactive Seat Map**: Pick real seats (Standard/Premium/VIP) for a showtime
- **Stripe Checkout**: Secure payment with webhook-reconciled bookings and automatic hold expiry
- **Booking History**: Track pending and paid bookings from your profile
- **Notifications**: Get an unread badge the moment a new movie is added to theaters, linking straight into booking with prices

## Tech Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling with custom design system
- **Framer Motion** - Smooth animations and transitions
- **Zod** - Used for validations
- **TanStack Query** - Data fetching and caching

### Backend & Database

- **Supabase** - Authentication and real-time database
- **Prisma** - Type-safe database ORM
- **PostgreSQL** - Relational database
- **Next.js API Routes** - Serverless API endpoints
- **Stripe** - Checkout payments and webhook-reconciled bookings

### Data & APIs

- **TMDB API** - The Movie Database for movie/TV data
- **Axios** - HTTP client for API requests
