# 🎬 Cinevora

A modern movie discovery web application built using **React**, **Vite**, **Tailwind CSS**, **TMDB API**, and **Appwrite**.

Live Demo → [https://cinevora-movies.vercel.app/]

---

## ✨ Features

- 🔎 Real-time movie search
- 🎬 Trending movies section
- ⚡ Debounced search for better performance
- 📊 Search analytics tracking with Appwrite
- 🌙 Modern dark UI design
- 📱 Fully responsive across devices
- 🚀 Deployed on Vercel

---

## 🛠 Tech Stack

- React
- Vite
- Tailwind CSS
- TMDB API
- Appwrite
- Vercel

---

## 📸 Preview

![Cinevora Screenshot](./Screenshot.png)


<br/>


![Cinevora Screenshot](./Screenshott.png)


---

## ⚙️ Installation & Setup

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd my-first-react-app
```

## Install Dependencies

```bash
npm install
```

## Create a .env.local file in the root directory and add:

```bash
VITE_TMDB_API_KEY=your_tmdb_read_access_token_v4
VITE_APPWRITE_PROJECT_ID=your_project_id
VITE_APPWRITE_DATABASE_ID=your_database_id
VITE_APPWRITE_COLLECTION_ID=your_collection_id
```

For Vercel production deploys, add this environment variable in Project Settings > Environment Variables:

```bash
VITE_TMDB_API_KEY=your_tmdb_read_access_token_v4
```

The app now uses Vercel API routes (`/api/movies` and `/api/trending`) as a backend proxy. After setting the env var, redeploy the Vercel app.

If you want to run the `/api` routes locally, use Vercel's dev server instead of plain Vite:

```bash
vercel dev
```

## Start development server:

```bash
npm run dev
```

## Build for production:

```bash
npm run build
```

## 📊 Appwrite Setup

This project uses Appwrite to:

- Track search counts

Make sure you:

1. Create a project in Appwrite

2. Create a database

3. Create a collection (e.g., metrics)

4. Add required attributes:

    - searchTerm (string/text)

    - count (integer)

    - movie_id (string)

    - poster_url (string)

## 🤝 Contributing

Contributions, suggestions, and improvements are welcome.

If you'd like to:

Improve UI

Optimize performance

Add new features

Fix bugs

Feel free to fork the repo and create a pull request.

You can also open an issue to discuss ideas.

## 🚀 Deployment

The project is deployed using Vercel.

To deploy:

```bash 
npm run build
```

Then deploy the project on Vercel.

## 👨‍💻 Author

Created by Sushil Kumar Mishra

GitHub → https://github.com/Sushil2k4

## 📄 License

This project is open source and available under the MIT License.


---


```bash
git add .
git commit -m "Updated README with full documentation"
git push
