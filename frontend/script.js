let roommates=[]
let expenses=[]
let chart
const API_BASE = "http://127.0.0.1:5000";

document.getElementById("startBtn").onclick=()=>{
showPage(2)
}

function showPage(num){

document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"))

document.getElementById("page"+num).classList.add("active")

}

function goBack(num){
showPage(num)
}

function createRoommateInputs(){

let count=document.getElementById("roommateCount").value

let container=document.getElementById("roommateInputs")

container.innerHTML=""

for(let i=0;i<count;i++){

let input=document.createElement("input")

input.placeholder="Roommate "+(i+1)+" name"

container.appendChild(input)

}

document.getElementById("roommateNext").classList.remove("hidden")

}

function goToExpenses(){

roommates=[]

document.querySelectorAll("#roommateInputs input").forEach(i=>{

roommates.push(i.value)

})

addExpenseRow()

showPage(3)

}

function addExpenseRow() {
  let row = document.createElement("div");
  row.className = "expenseRow";

  row.innerHTML = `
    <input placeholder="Expense title" class="expense-title">
    <input type="number" placeholder="Amount" class="expense-amount">
    <input placeholder="Category" class="expense-category">
    <input type="date" class="expense-date">
  `;

  document.getElementById("expenseContainer").appendChild(row);
}
async function saveExpenseToBackend(expense) {
  try {
    const response = await fetch(`${API_BASE}/add-expense`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(expense)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to save expense");
    }

    return result;
  } catch (error) {
    console.error("Error saving expense:", error);
    alert("Could not save expense to backend: " + error.message);
  }
  function createChart() {
  let labels = expenses.map(e => e.title);
  let data = expenses.map(e => e.amount);

  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("expenseChart"), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Expenses",
        data: data,
        backgroundColor: ["#800000", "#0077cc", "#b30000", "#3399ff", "#cc4c4c"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      }
    }
  });
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
}

document.getElementById("addExpenseBtn").onclick=addExpenseRow

function showSummary(){

expenses=[]

document.querySelectorAll(".expenseRow").forEach(row=>{

let name=row.children[0].value
let amount=parseFloat(row.children[1].value)

if(name && amount){

expenses.push({name,amount})

}

})

let summary=document.getElementById("summary")

summary.innerHTML=""

let total=0

expenses.forEach(e=>{

summary.innerHTML+=`<p>${e.name} - $${e.amount}</p>`

total+=e.amount

})

let perPerson=(total/roommates.length).toFixed(2)

let splitText=""

roommates.forEach(r=>{

splitText+=`<p>${r} pays $${perPerson}</p>`

})

document.getElementById("splitResult").innerHTML=splitText

showPage(4)

}

function createChart(){

let labels=expenses.map(e=>e.name)

let data=expenses.map(e=>e.amount)

if(chart) chart.destroy()

chart=new Chart(document.getElementById("expenseChart"),{

type:"bar",

data:{

labels:labels,

datasets:[{

label:"Expenses",

data:data,

backgroundColor:["#800000","#0077cc","#b30000","#3399ff","#cc4c4c"]

}]

},

options:{

responsive:true,

plugins:{

legend:{display:false}

}

}

})

}