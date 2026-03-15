from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import sqlite3
import urllib.error
import urllib.request

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


def build_fallback_advice(prompt, context):
    total_spent = context.get("total_spent", 0)
    by_category = context.get("by_category", [])
    roommates = context.get("roommates", [])

    top_category_text = ""
    if by_category:
        top_category = sorted(
            by_category,
            key=lambda item: item.get("total", 0),
            reverse=True
        )[0]
        top_category_text = (
            f" Your top category is {top_category.get('category', 'Unknown')} "
            f"at about ${float(top_category.get('total', 0)):.2f}."
        )

    roommate_text = ""
    if roommates:
        each_share = total_spent / len(roommates) if len(roommates) > 0 else 0
        roommate_text = (
            f" With {len(roommates)} roommates, an even split is around "
            f"${each_share:.2f} per person."
        )

    lower_prompt = prompt.lower()

    if "save" in lower_prompt or "saving" in lower_prompt:
        action_tip = (
            "Try the 24-hour rule for non-essential purchases and move a small "
            "fixed amount to savings each week."
        )
    elif "food" in lower_prompt or "groceries" in lower_prompt or "eat" in lower_prompt:
        action_tip = (
            "Use a weekly food cap and meal prep 2-3 staple meals to avoid "
            "expensive last-minute orders."
        )
    elif "budget" in lower_prompt:
        action_tip = (
            "Use a simple split: 50% needs, 30% wants, 20% savings/debt, then "
            "adjust based on your rent and tuition."
        )
    else:
        action_tip = (
            "Review your top spending category first and cap it by 10% this month "
            "for a realistic improvement."
        )

    return (
        f"Based on your current tracked spend of about ${float(total_spent):.2f}."
        f"{top_category_text}{roommate_text} {action_tip}"
    )


def ask_openai(prompt, context):
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        return None

    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a supportive finance advisor for college students. "
                    "Give practical, safe, non-judgmental budgeting advice in 3-5 concise sentences."
                )
            },
            {
                "role": "user",
                "content": (
                    f"Student question: {prompt}\n"
                    f"Current context JSON: {json.dumps(context)}"
                )
            }
        ],
        "temperature": 0.4
    }

    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            body = json.loads(response.read().decode("utf-8"))
            return body["choices"][0]["message"]["content"].strip()
    except (urllib.error.URLError, KeyError, IndexError, json.JSONDecodeError):
        return None


@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json() or {}
    prompt = str(data.get("prompt", "")).strip()
    context = data.get("context", {})

    if not prompt:
        return jsonify({"error": "prompt is required"}), 400

    if not isinstance(context, dict):
        context = {}

    reply = ask_openai(prompt, context)

    if not reply:
        reply = build_fallback_advice(prompt, context)

    return jsonify({"reply": reply}), 200


if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000, debug=False)