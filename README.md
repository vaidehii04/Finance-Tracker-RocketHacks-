# Finance-Tracker-RocketHacks-
This is a project we've done for RocketHacks 2026, where we've created a simple finance for students to use.
Spendly 💸

Smart Roommate Expense Tracker
Spendly is a lightweight full-stack web application that helps roommates track shared expenses, split costs fairly, and visualize spending. The app combines a simple frontend interface with a Flask backend and SQLite database for persistent storage.

Features
• Track shared expenses between roommates
• Automatically split costs evenly
• Visualize spending using charts
• Store expenses in a persistent database
• REST API powered by Flask
• Simple and responsive user interface

Tech Stack
-Frontend
HTML
CSS
JavaScript
Chart.js

-Backend
Python
Flask
Flask-CORS

-Database
SQLite

Project Structure
Spendly
│
├── app.py            # Flask backend API
├── expenses.db       # SQLite database (auto-created)
├── index.html        # Frontend UI
├── script.js         # Frontend logic
├── style.css         # UI styling
└── README.md
How to Run the Project
1️⃣ Install dependencies
pip install flask flask-cors
2️⃣ Start the backend server
python app.py

The backend will run at:

http://127.0.0.1:5000
3️⃣ Open the frontend

Simply open:

index.html

in your browser.

How It Works

Users enter the number of roommates and their names.

Expenses are added with title, amount, category, and date.

Expenses are sent to the Flask backend and stored in SQLite.

The app calculates the total spending and evenly splits costs between roommates.

Spending data is visualized with a bar chart.

API Endpoints
Get all expenses
GET /expenses
Add an expense
POST /add-expense

Example request:

{
  "title": "Groceries",
  "amount": 35,
  "category": "Food",
  "date": "2026-03-15"
}
Delete an expense
DELETE /delete-expense/<id>
Set monthly budget
POST /set-budget
Get budget
GET /budget
Expense summary
GET /summary

Returns total spending and spending by category.

Spending insights
GET /insights

Provides insights such as:

highest spending category

budget usage

recommendations

Future Improvements

• Smart expense categorization
• AI spending recommendations
• Individual payment tracking
• Bar charts for category spending
• User authentication

Authors:
Vaidehi Panchal
Prachi Sony
Computer Science & Engineering
University of Toledo
