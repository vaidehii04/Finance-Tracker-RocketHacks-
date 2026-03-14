from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
import sqlite3
import os
print("KEY:", os.environ.get("OPENAI_API_KEY"))

app = Flask(__name__)
CORS(app)

DATABASE = "expenses.db"
client = OpenAI()  # reads OPENAI_API_KEY from environment variable


def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
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


@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Expense Tracker API is running"}), 200


@app.route("/expenses", methods=["GET"])
def get_expenses():
    conn = get_db_connection()
    expenses = conn.execute(
        "SELECT * FROM expenses ORDER BY date DESC, id DESC"
    ).fetchall()
    conn.close()

    expense_list = [dict(expense) for expense in expenses]
    return jsonify(expense_list), 200


@app.route("/add-expense", methods=["POST"])
def add_expense():
    data = request.get_json()

    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    title = data.get("title")
    amount = data.get("amount")
    category = data.get("category")
    date = data.get("date")

    if not title or amount is None or not category or not date:
        return jsonify({"error": "Missing required fields"}), 400

    try:
        amount = float(amount)
    except (ValueError, TypeError):
        return jsonify({"error": "Amount must be a valid number"}), 400

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

    by_category = [
        {
            "category": row["category"],
            "total": row["total"]
        }
        for row in category_result
    ]

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


@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Request body must be JSON"}), 400

        question = data.get("question")

        if not question:
            return jsonify({"error": "Question is required"}), 400

        conn = get_db_connection()
        expenses = conn.execute(
            "SELECT title, amount, category, date FROM expenses ORDER BY date DESC, id DESC"
        ).fetchall()
        conn.close()

        if not expenses:
            return jsonify({
                "response": "There are no expenses saved yet. Add some expenses first so I can analyze them."
            }), 200

        expense_text = "\n".join(
            [
                f"{expense['title']} - ${expense['amount']} ({expense['category']}) on {expense['date']}"
                for expense in expenses
            ]
        )

        prompt = f"""
You are a helpful budgeting assistant for a student expense tracker app.

Use only the expense data below to answer the user's question.
Keep your answer concise, practical, and easy to understand.
If relevant, point out the largest spending categories and suggest realistic ways to save money.

Expense data:
{expense_text}

User question:
{question}
"""

        response = client.responses.create(
            model="gpt-4.1-mini",
            input=prompt
        )

        answer = response.output_text

        return jsonify({"response": answer}), 200

    except Exception as e:
        return jsonify({
            "error": "Chat request failed",
            "details": str(e)
        }), 500


if __name__ == "__main__":
    init_db()
    app.run(debug=True)
