from flask import Flask, request, jsonify
import sqlite3
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # lets your frontend talk to backend if they're on different ports

DATABASE = "expenses.db"


def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row  # lets rows act like dictionaries
    return conn


def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            date TEXT NOT NULL
        )
    """)

    conn.commit()
    conn.close()


@app.route("/")
def home():
    return jsonify({"message": "Expense Tracker API is running"})


@app.route("/expenses", methods=["GET"])
def get_expenses():
    conn = get_db_connection()
    expenses = conn.execute("SELECT * FROM expenses ORDER BY date DESC").fetchall()
    conn.close()

    expense_list = [dict(expense) for expense in expenses]
    return jsonify(expense_list), 200


@app.route("/add-expense", methods=["POST"])
def add_expense():
    data = request.get_json()

    title = data.get("title")
    amount = data.get("amount")
    category = data.get("category")
    date = data.get("date")

    # basic validation
    if not title or amount is None or not category or not date:
        return jsonify({"error": "Missing required fields"}), 400

    try:
        amount = float(amount)
    except ValueError:
        return jsonify({"error": "Amount must be a number"}), 400

    conn = get_db_connection()
    conn.execute(
        "INSERT INTO expenses (title, amount, category, date) VALUES (?, ?, ?, ?)",
        (title, amount, category, date)
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "Expense added successfully"}), 201
@app.route("/summary", methods=["GET"])
def get_summary():
    conn = get_db_connection()

    total_result = conn.execute(
        "SELECT SUM(amount) AS total FROM expenses"
    ).fetchone()

    category_result = conn.execute("""
        SELECT category, SUM(amount) AS total
        FROM expenses
        GROUP BY category
        ORDER BY total DESC
    """).fetchall()

    conn.close()

    total_spent = total_result["total"] if total_result["total"] is not None else 0

    by_category = []
    for row in category_result:
        by_category.append({
            "category": row["category"],
            "total": row["total"]
        })

    return jsonify({
        "total_spent": total_spent,
        "by_category": by_category
    }), 200
@app.route("/delete-expense/<int:expense_id>", methods=["DELETE"])
def delete_expense(expense_id):
    conn = get_db_connection()

    expense = conn.execute(
        "SELECT * FROM expenses WHERE id = ?",
        (expense_id,)
    ).fetchone()

    if expense is None:
        conn.close()
        return jsonify({"error": "Expense not found"}), 404

    conn.execute("DELETE FROM expenses WHERE id = ?", (expense_id,))
    conn.commit()
    conn.close()

    return jsonify({"message": "Expense deleted successfully"}), 200


if __name__ == "__main__":
    init_db()
    app.run(debug=True)