# Gridle

Gridle is a full-stack productivity and collaboration platform built with Next.js, MongoDB, and Tailwind CSS. It provides a unified dashboard for managing users, groups, tasks, notes, analytics, and more, with robust authentication and admin controls.

## Features

- **Authentication:** Secure login, registration, password reset, and Google OAuth via NextAuth.
- **User Management:** Admins can view, edit, and manage users.
- **Groups:** Create, search, and manage groups; assign users and tasks.
- **Tasks:** CRUD operations for tasks, with status, priority, due dates, and assignment to users/groups.
- **Notes:** Personal and group notes, linked to tasks.
- **Analytics Dashboard:** Visualize user activity, group creation, task completion rates, and trends.
- **Admin Panel:** Role-based access for advanced management of users, groups, tasks, and notes.
- **Email Integration:** Password reset and notifications via SMTP.
- **Responsive UI:** Built with Tailwind CSS and custom React components.

## Tech Stack

- **Frontend:** Next.js (App Router), React, Tailwind CSS
- **Backend:** Next.js API routes, MongoDB (Mongoose)
- **Authentication:** NextAuth.js
- **Email:** Nodemailer
- **Deployment:** Vercel

## Project Structure

```
src/
  app/
    admin/           # Admin dashboard and management pages
    api/             # API routes for users, groups, tasks, notes, auth, etc.
    components/      # Reusable UI components
    lib/             # Utility libraries (db, email, etc.)
    models/          # Mongoose models
    ...              # Other feature pages (dashboard, notes, tasks, etc.)
public/              # Static assets
```

## Environment Variables

Create a `.env.local` file with:

```
NEXTAUTH_URL=
NEXTAUTH_SECRET=
MONGODB_URI=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
EMAIL_SERVER_HOST=
EMAIL_SERVER_PORT=
EMAIL_SERVER_USER=
EMAIL_SERVER_PASSWORD=
EMAIL_FROM=
```

## Getting Started

1. **Install dependencies:**
   ```
   npm install
   ```
2. **Set up environment variables:**  
   Copy `.env.example` to `.env.local` and fill in your credentials.

3. **Run the development server:**
   ```
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000) in your browser.**

## Deployment

Deploy easily to [Vercel](https://vercel.com/) with your environment variables.

## Contributing

Pull requests and issues are welcome! Please follow the code style and add tests where possible.

## License

MIT
