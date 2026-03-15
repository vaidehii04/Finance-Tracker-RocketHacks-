let roommates = [];
let expenses = [];
let chart = null;

const API_BASE = "http://127.0.0.1:5000";

// ---------- ELEMENTS ----------
const startBtn = document.getElementById("startBtn");
const addExpenseBtn = document.getElementById("addExpenseBtn");

const chatToggleBtn = document.getElementById("chatToggleBtn");
const chatCloseBtn = document.getElementById("chatCloseBtn");
const chatPanel = document.getElementById("chatPanel");
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const chatSendBtn = document.getElementById("chatSendBtn");

// ---------- EVENT LISTENERS ----------
if (startBtn) {
  startBtn.onclick = () => showPage(2);
}

if (addExpenseBtn) {
  addExpenseBtn.onclick = addExpenseRow;
}

if (chatToggleBtn && chatCloseBtn && chatPanel && chatMessages && chatInput && chatSendBtn) {
  chatToggleBtn.onclick = openChat;
  chatCloseBtn.onclick = closeChat;
  chatSendBtn.onclick = sendChatMessage;

  chatInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      sendChatMessage();
    }
  });
}

// ---------- PAGE NAVIGATION ----------
function showPage(num) {
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.remove("active");
  });

  const targetPage = document.getElementById("page" + num);
  if (targetPage) {
    targetPage.classList.add("active");
  }
}

function goBack(num) {
  showPage(num);
}

// ---------- ROOMMATES ----------
function createRoommateInputs() {
  const count = parseInt(document.getElementById("roommateCount").value, 10);
  const container = document.getElementById("roommateInputs");
  const nextBtn = document.getElementById("roommateNext");

  container.innerHTML = "";
  nextBtn.classList.add("hidden");

  if (!count || count < 1) {
    alert("Please enter a valid number of roommates.");
    return;
  }

  for (let i = 0; i < count; i += 1) {
    const input = document.createElement("input");
    input.placeholder = `Roommate ${i + 1} name`;
    container.appendChild(input);
  }

  nextBtn.classList.remove("hidden");
}

function goToExpenses() {
  roommates = [];

  document.querySelectorAll("#roommateInputs input").forEach((input) => {
    const name = input.value.trim();
    if (name) {
      roommates.push(name);
    }
  });

  if (roommates.length === 0) {
    alert("Please add at least one roommate name.");
    return;
  }

  const expenseContainer = document.getElementById("expenseContainer");
  expenseContainer.innerHTML = "";

  addExpenseRow();
  showPage(3);
}

// ---------- EXPENSES ----------
function addExpenseRow() {
  const row = document.createElement("div");
  row.className = "expenseRow";

  row.innerHTML = `
    <input placeholder="Expense title" class="expense-title">
    <input type="number" min="0" step="0.01" placeholder="Amount" class="expense-amount">
    <input placeholder="Category" class="expense-category">
    <input type="date" class="expense-date">
  `;

  document.getElementById("expenseContainer").appendChild(row);
}

async function saveExpenseToBackend(expense) {
  const response = await fetch(`${API_BASE}/add-expense`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(expense),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Failed to save expense");
  }

  return result;
}

async function loadExpensesFromBackend() {
  try {
    const response = await fetch(`${API_BASE}/expenses`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to load expenses");
    }

    return data;
  } catch (error) {
    console.error("Error loading expenses:", error);
    return [];
  }
}

async function showSummary() {
  expenses = [];

  document.querySelectorAll(".expenseRow").forEach((row) => {
    const title = row.querySelector(".expense-title")?.value.trim() || "";
    const amount = parseFloat(row.querySelector(".expense-amount")?.value);
    const category = row.querySelector(".expense-category")?.value.trim() || "Other";
    const date = row.querySelector(".expense-date")?.value || "";

    if (title && !Number.isNaN(amount) && amount > 0 && date) {
      expenses.push({
        title,
        amount,
        category,
        date,
      });
    }
  });

  if (expenses.length === 0) {
    alert("Please enter at least one complete expense row.");
    return;
  }

  try {
    await Promise.all(expenses.map((expense) => saveExpenseToBackend(expense)));
  } catch (error) {
    console.error("Failed to save some expenses:", error);
    alert(`Could not save expenses to backend: ${error.message}`);
    return;
  }

  const summary = document.getElementById("summary");
  summary.innerHTML = "";

  let total = 0;

  expenses.forEach((expense) => {
    summary.innerHTML += `
      <p>${expense.title} (${expense.category}) - $${expense.amount.toFixed(2)} on ${expense.date}</p>
    `;
    total += expense.amount;
  });

  const perPerson = roommates.length > 0 ? (total / roommates.length).toFixed(2) : "0.00";

  let splitText = "";
  roommates.forEach((roommate) => {
    splitText += `<p>${roommate} pays $${perPerson}</p>`;
  });

  document.getElementById("splitResult").innerHTML = splitText;
  showPage(4);
}

// ---------- CHART ----------
function createChart() {
  const labels = expenses.map((expense) => expense.title);
  const data = expenses.map((expense) => expense.amount);

  if (chart) {
    chart.destroy();
  }

  chart = new Chart(document.getElementById("expenseChart"), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Expenses",
          data: data,
          backgroundColor: ["#800000", "#0077cc", "#b30000", "#3399ff", "#cc4c4c"],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  });
}

// ---------- CHAT ----------
function openChat() {
  chatPanel.classList.remove("hidden");
  chatToggleBtn.classList.add("hidden");
}

function closeChat() {
  chatPanel.classList.add("hidden");
  chatToggleBtn.classList.remove("hidden");
}

function appendChatMessage(message, sender) {
  const item = document.createElement("div");
  item.className = `chat-message ${sender}`;
  item.textContent = message;
  chatMessages.appendChild(item);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getLocalChatContext() {
  const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  const byCategory = {};

  expenses.forEach((expense) => {
    const category = expense.category || "Other";
    byCategory[category] = (byCategory[category] || 0) + Number(expense.amount || 0);
  });

  return {
    roommates,
    total_spent: Number(totalSpent.toFixed(2)),
    by_category: Object.entries(byCategory).map(([category, total]) => ({
      category,
      total: Number(total.toFixed(2)),
    })),
  };
}

async function sendChatMessage() {
  const prompt = chatInput.value.trim();

  if (!prompt) {
    return;
  }

  appendChatMessage(prompt, "user");
  chatInput.value = "";

  try {
    const context = getLocalChatContext();

    const response = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        context,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Unable to get chatbot response");
    }

    appendChatMessage(result.reply, "assistant");
  } catch (error) {
    console.error("Chat error:", error);
    appendChatMessage(
      "I couldn't reach the advisor right now. Please try again.",
      "assistant"
    );
  }
}