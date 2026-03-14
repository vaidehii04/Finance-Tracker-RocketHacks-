from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app)

DATABASE = "expenses.db"


def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # expenses table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            date TEXT NOT NULL
        )
    """)

    # budget table (just one row for now)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS budget (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            monthly_budget REAL NOT NULL
        )
    """)

    conn.commit()
    conn.close()


@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Expense Tracker API is running"}), 200


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


@app.route("/expenses", methods=["GET"])
def get_expenses():
    conn = get_db_connection()
    expenses = conn.execute(
        "SELECT * FROM expenses ORDER BY date DESC, id DESC"
    ).fetchall()
    conn.close()

    return jsonify([dict(expense) for expense in expenses]), 200


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


@app.route("/set-budget", methods=["POST"])
def set_budget():
    data = request.get_json()

    if not data or "monthly_budget" not in data:
        return jsonify({"error": "monthly_budget is required"}), 400

    try:
        monthly_budget = float(data["monthly_budget"])
    except (ValueError, TypeError):
        return jsonify({"error": "monthly_budget must be a valid number"}), 400

    conn = get_db_connection()

    existing_budget = conn.execute(
        "SELECT * FROM budget WHERE id = 1"
    ).fetchone()

    if existing_budget:
        conn.execute(
            "UPDATE budget SET monthly_budget = ? WHERE id = 1",
            (monthly_budget,)
        )
    else:
        conn.execute(
            "INSERT INTO budget (id, monthly_budget) VALUES (1, ?)",
            (monthly_budget,)
        )

    conn.commit()
    conn.close()

    return jsonify({"message": "Budget set successfully", "monthly_budget": monthly_budget}), 200


@app.route("/budget", methods=["GET"])
def get_budget():
    conn = get_db_connection()
    budget = conn.execute(
        "SELECT monthly_budget FROM budget WHERE id = 1"
    ).fetchone()
    conn.close()

    if budget is None:
        return jsonify({"monthly_budget": None, "message": "No budget set yet"}), 200

    return jsonify({"monthly_budget": budget["monthly_budget"]}), 200


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


@app.route("/insights", methods=["GET"])
def get_insights():
    conn = get_db_connection()

    # total spent
    total_result = conn.execute(
        "SELECT SUM(amount) AS total FROM expenses"
    ).fetchone()
    total_spent = total_result["total"] if total_result["total"] is not None else 0

    # top category
    top_category_result = conn.execute("""
        SELECT category, SUM(amount) AS total
        FROM expenses
        GROUP BY category
        ORDER BY total DESC
        LIMIT 1
    """).fetchone()

    # budget
    budget_result = conn.execute(
        "SELECT monthly_budget FROM budget WHERE id = 1"
    ).fetchone()

    conn.close()

    monthly_budget = budget_result["monthly_budget"] if budget_result else None
    remaining_budget = None
    percent_used = None
    budget_status = "no_budget"
    recommendation = "Set a monthly budget to unlock smarter spending alerts."

    if monthly_budget is not None and monthly_budget > 0:
        remaining_budget = monthly_budget - total_spent
        percent_used = round((total_spent / monthly_budget) * 100, 2)

        if percent_used < 50:
            budget_status = "healthy"
            recommendation = "You are under control right now. Keep tracking your daily spending."
        elif percent_used < 80:
            budget_status = "watch"
            recommendation = "You are doing okay, but keep an eye on your higher categories before the month ends."
        elif percent_used <= 100:
            budget_status = "warning"
            recommendation = "You are getting close to your budget limit. Try cutting back on non-essential spending."
        else:
            budget_status = "overspent"
            recommendation = "You have gone over budget. Focus on reducing flexible expenses like food, shopping, or entertainment."

    top_category = None
    top_category_total = 0
    top_category_message = "No expenses recorded yet."

    if top_category_result:
        top_category = top_category_result["category"]
        top_category_total = top_category_result["total"]
        top_category_message = f"Your highest spending category is {top_category}."

    return jsonify({
        "total_spent": total_spent,
        "monthly_budget": monthly_budget,
        "remaining_budget": remaining_budget,
        "percent_used": percent_used,
        "budget_status": budget_status,
        "top_category": top_category,
        "top_category_total": top_category_total,
        "top_category_message": top_category_message,
        "recommendation": recommendation
    }), 200


if __name__ == "__main__":
    init_db()
    app.run(debug=True)
