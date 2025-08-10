# 🚀 InternLinkt

InternLinkt is a sleek, full-stack internship portal designed to connect ambitious students with forward-thinking companies offering real-world experience. Built with simplicity and performance in mind, it offers tailored dashboards, smart features, and a smooth, Apple-inspired UI for both user roles.

## ✨ Key Features

- 🔐 **Secure Auth**: Signup/login for students and companies
- 📋 **Internship Listings**: Browse, search, and apply with ease
- 🧾 **Smart Dashboards**: Separate views for students and companies
- 📝 **Profile Management**: Update your details anytime
- 🛠️ **Internship Management**: CRUD features for companies
- 📂 **Resume Upload & Download**: Hassle-free document handling
- 📡 **Application Tracking**: Real-time status updates

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JS
- **Backend**: Node.js, Express.js
- **Database**: MySQL

No frameworks used – just clean, raw web development.

## 🧭 Project Structure

```
backend/
├── server.js
├── db.js
├── routes/
│   ├── student.js
│   ├── company.js
│   └── internship.js
├── public/
│   ├── index.html
│   ├── student_signup.html
│   ├── student_dashboard.html
│   ├── student_profile.html
│   ├── company_signup.html
│   ├── company_dashboard.html
│   ├── create_internship.html
│   ├── style.css
│   ├── app.js
│   └── resumes/                # Uploaded resumes
├── database_setup.sql          # DB schema & sample data
├── package.json
└── README.md
```

## 🧪 Getting Started

### 📦 Prerequisites

Make sure you have:
- Node.js (v14+)
- MySQL

### 🔄 Clone the Repo

```bash
git clone <repository-url>
cd <repository-name>
```

### 📥 Install Dependencies

```bash
npm install
```

### ⚙️ Configure MySQL

Edit `backend/db.js` if needed:

```js
const db = mysql.createConnection({
    user: 'root',
    password: 'FatimaUsman@2007',
    database: 'internlinkt'
});
```

### 🏗️ Initialize Database

Run the provided SQL script:

```bash
mysql -u root -p < database_setup.sql
```

### 📁 Create Resumes Folder

```bash
mkdir -p backend/public/resumes
```

### ▶️ Start the Server

```bash
npm start
```

Visit http://localhost:3000

## 🚀 Try It Out

- Use sample accounts from `database_setup.sql`, or
- Sign up as a new student or company

## 💡 Usage Tips

- Dashboards are role-specific and loaded after login
- Resume files are saved in `/resumes/` — ensure it's writable
- Companies can manage application status (e.g., Accept/Reject)
- Students will see live updates in their dashboard

## 🧯 Troubleshooting

- **Port in use?** Change the port in `backend/server.js` or via PORT env variable
- **MySQL errors?** Check credentials & service status
- **Resume not uploading?** Ensure `resumes/` folder exists and is writable
- **Changes not showing?** Try Ctrl+Shift+R to hard-refresh or clear cache

## 📄 License

This project is open-sourced under the MIT License.
