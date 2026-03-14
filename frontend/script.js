let roommateCount = 1;
let expenses = [];

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

    if (!title || isNaN(amount) || !date) {
        alert('Please fill all fields correctly.');
        return;
    }

    expenses.push({ title, amount, date });
    document.getElementById('expense-title').value = '';
    document.getElementById('expense-amount').value = '';
    document.getElementById('expense-date').value = '';

    renderExpenses();
});

function renderExpenses() {
    expenseList.innerHTML = '';
    expenses.forEach(exp => {
        const li = document.createElement('li');
        li.classList.add('expense-item');
        li.textContent = `${exp.date} - ${exp.title}: $${exp.amount.toFixed(2)}`;
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
});

function renderSummary() {
    summaryList.innerHTML = '';
    let total = 0;
    expenses.forEach(exp => {
        total += exp.amount;
        const div = document.createElement('div');
        div.classList.add('expense-item');
        div.textContent = `${exp.date} - ${exp.title}: $${exp.amount.toFixed(2)}`;
        summaryList.appendChild(div);
    });
    const split = total / roommateCount;
    splitTotal.textContent = `Total per roommate: $${split.toFixed(2)}`;
}