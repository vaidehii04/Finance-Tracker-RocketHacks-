document.addEventListener("DOMContentLoaded", () => {
    const expenseForm = document.getElementById("expense-form");
    const expenseList = document.getElementById("expense-list");

    // Function to fetch and display all expenses
    async function loadExpenses() {
        try {
            const response = await fetch("http://127.0.0.1:5000/expenses");
            const data = await response.json();

            // Clear current list
            expenseList.innerHTML = "";

            // Display each expense
            data.forEach(expense => {
                const li = document.createElement("li");
                li.textContent = `${expense.date} - ${expense.title}: $${expense.amount} (${expense.category})`;
                expenseList.appendChild(li);
            });
        } catch (err) {
            console.error("Error fetching expenses:", err);
        }
    }

    // Handle form submission
    expenseForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const title = document.getElementById("title").value;
        const amount = document.getElementById("amount").value;
        const category = document.getElementById("category").value;
        const date = document.getElementById("date").value;

        const expenseData = { title, amount, category, date };

        try {
            const response = await fetch("http://127.0.0.1:5000/add-expense", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(expenseData)
            });

            if (response.ok) {
                // Clear form
                expenseForm.reset();
                // Reload expense list
                loadExpenses();
            } else {
                const error = await response.json();
                alert("Error: " + error.error);
            }
        } catch (err) {
            console.error("Error adding expense:", err);
        }
    });

    // Initial load
    loadExpenses();
});