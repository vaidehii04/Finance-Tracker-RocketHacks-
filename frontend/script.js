let roommateCount = 1; 
let expenses = [];
let chart;

// Page elements
const page1 = document.getElementById('page1');
const page2 = document.getElementById('page2');
const page3 = document.getElementById('page3');

const page1Next = document.getElementById('page1-next');
const page2Next = document.getElementById('page2-next');
const addExpenseBtn = document.getElementById('add-expense');

const expenseList = document.getElementById('expense-list');
const summaryList = document.getElementById('summary-list');
const splitTotal = document.getElementById('split-total');

// Move from Page 1 to Page 2
page1Next.addEventListener('click', () => {
    const count = parseInt(document.getElementById('roommate-count').value);
    if (count > 0) {
        roommateCount = count;
        page1.classList.add('hidden');
        page2.classList.remove('hidden');
    } else {
        alert('Please enter a valid number of roommates.');
    }
});

// Add expense dynamically
addExpenseBtn.addEventListener('click', () => {
    const title = document.getElementById('expense-title').value;
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const date = document.getElementById('expense-date').value;
    const paidBy = document.getElementById('paid-by').value;

    if (!title || isNaN(amount) || !date || !paidBy) {
        alert('Please fill all fields correctly.');
        return;
    }

    expenses.push({ title, amount, date, paidBy });
    document.getElementById('expense-title').value = '';
    document.getElementById('expense-amount').value = '';
    document.getElementById('expense-date').value = '';
    document.getElementById('paid-by').value = '';

    renderExpenses();
});

function renderExpenses() {
    expenseList.innerHTML = '';
    expenses.forEach(exp => {
        const li = document.createElement('li');
        li.classList.add('expense-item');
        li.textContent = `${exp.date} - ${exp.title}: $${exp.amount.toFixed(2)} (Paid by: ${exp.paidBy})`;
        expenseList.appendChild(li);
    });
}

// Move to summary page
page2Next.addEventListener('click', () => {
    if (expenses.length === 0) {
        alert('Please add at least one expense.');
        return;
    }
    page2.classList.add('hidden');
    page3.classList.remove('hidden');
    renderSummary();
    generateChart();
});

function renderSummary() {
    summaryList.innerHTML = '';
    let total = 0;
    expenses.forEach(exp => {
        total += exp.amount;
        const div = document.createElement('div');
        div.classList.add('expense-item');
        div.textContent = `${exp.date} - ${exp.title}: $${exp.amount.toFixed(2)} (Paid by: ${exp.paidBy})`;
        summaryList.appendChild(div);
    });
    const split = total / roommateCount;
    splitTotal.textContent = `Total per roommate: $${split.toFixed(2)}`;
}

// Back buttons
document.getElementById("back-to-page1").onclick = () => {
    page2.classList.add("hidden");
    page1.classList.remove("hidden");
};

document.getElementById("back-to-page2").onclick = () => {
    page3.classList.add("hidden");
    page2.classList.remove("hidden");
};

// Chart.js
function generateChart() {
    const categories = {};
    const people = new Set();

    expenses.forEach(exp => {
        people.add(exp.paidBy);
        if (!categories[exp.title]) categories[exp.title] = {};
        if (!categories[exp.title][exp.paidBy]) categories[exp.title][exp.paidBy] = 0;
        categories[exp.title][exp.paidBy] += exp.amount;
    });

    const labels = Object.keys(categories);
    const persons = Array.from(people);

    // Use maroon and blue for first two persons, then variations if more
    const baseColors = ['#800000', '#0077CC', '#A00000', '#3399FF', '#CC3333', '#66CCFF'];

    const datasets = persons.map((person, idx) => {
        return {
            label: person,
            data: labels.map(cat => categories[cat][person] || 0),
            backgroundColor: baseColors[idx % baseColors.length]
        };
    });

    const ctx = document.getElementById('expenseChart');
    if(chart) chart.destroy();
    chart = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: 'Expenses by Category and Person' },
                legend: { position: 'bottom' }
            },
            scales: { y: { beginAtZero: true } }
        }
    });
}