# Library App (User Application)

A modern web application that allows users to browse books, borrow items, and manage their reading activities through a clean and responsive interface.
This project focuses on building a scalable front-end architecture using modern React ecosystem tools.
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Live Demo

https://project1-library-app.vercel.app/

## Repository

https://github.com/AI-NovaNX/Project1-Library-App

## Tech Stack

This project is built using a modern front-end stack focused on performance, maintainability, and developer productivity.

- **React + TypeScript** – Main framework for building the UI with strong type safety.
- **Tailwind CSS** – Utility-first CSS framework for fast and consistent styling.
- **shadcn/ui** – Prebuilt and customizable UI components.
- **Redux Toolkit** – Manages global state such as authentication token, filters, cart, and UI state.
- **TanStack Query** – Handles data fetching, caching, and synchronization with the server.
- **Optimistic UI** – Improves user experience by instantly updating the interface before server confirmation.
- **Day.js** – Lightweight library for date formatting and manipulation.

## Features

This application provides a simple and intuitive experience for users to explore and manage library resources.

- **User Authentication**  
  Users can register and log in securely. Authentication tokens are stored to maintain session access and allow users to interact with protected features.

- **Browse and Discover Books**  
  Users can explore the available book collection, apply filters, search for specific titles, and open detailed pages to view more information about each book.

- **Borrow Books with Optimistic UI**  
  Users can borrow books directly from the interface. The available stock updates instantly using an optimistic UI approach to provide a faster and smoother user experience.

- **Add and View Reviews**  
  Users can write reviews for books they have read. Newly added reviews appear immediately, making the interaction feel responsive and real-time.

- **My Loans Dashboard**  
  Users can track their borrowed books, monitor loan status, and view due dates to manage their reading schedule effectively.

- **Profile Management**  
  Users can update their personal profile information and view their reading statistics and activity history.
  
## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Project Structure
<img width="157" height="175" alt="image" src="https://github.com/user-attachments/assets/e666d94d-474c-48a1-81df-ccd416fd3c22" />

