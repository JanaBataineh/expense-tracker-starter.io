const API_URL = 'http://localhost:3000/api/expenses';

let allExpenses = [];
let editModal = null;

const expenseList = document.getElementById('expense-list');
const categoryFilter = document.getElementById('category-filter');
const spinner = document.getElementById('loading-spinner');
const alertContainer = document.getElementById('alert-container');
const editAlertContainer = document.getElementById('edit-alert-container');

document.addEventListener('DOMContentLoaded', () => {
    editModal = new bootstrap.Modal(document.getElementById('editModal'));
    fetchExpenses();
});

// Show a dismissible Bootstrap alert in the given container
function showAlert(message, type = 'danger', container = alertContainer) {
    container.innerHTML = '';

    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.setAttribute('role', 'alert');
    alert.textContent = message;

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn-close';
    closeBtn.setAttribute('data-bs-dismiss', 'alert');
    closeBtn.setAttribute('aria-label', 'Close');

    alert.appendChild(closeBtn);
    container.appendChild(alert);
}

const showSpinner = () => spinner.classList.remove('d-none');
const hideSpinner = () => spinner.classList.add('d-none');

// Send a JSON request and return the response
function sendJson(url, method, data) {
    return fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
}

// ---------- GET ----------
async function fetchExpenses() {
    showSpinner();
    alertContainer.innerHTML = '';

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Request failed.');

        allExpenses = await response.json();
        applyFilter();
    } catch (error) {
        showAlert('Could not reach the server. Make sure the backend is running.');
    } finally {
        hideSpinner();
    }
}

// ---------- Filter ----------
// The table follows the filter; the summary always uses all expenses
function applyFilter() {
    const category = categoryFilter.value;
    const list = category === 'All'
        ? allExpenses
        : allExpenses.filter(e => e.category === category);

    renderExpenses(list);
    updateSummary(allExpenses);
}

categoryFilter.addEventListener('change', applyFilter);

// ---------- Render ----------
function renderExpenses(expenses) {
    expenseList.innerHTML = '';

    expenses.forEach(expense => {
        const tr = document.createElement('tr');

        const tdTitle = document.createElement('td');
        tdTitle.textContent = expense.title;

        const tdAmount = document.createElement('td');
        tdAmount.textContent = expense.amount.toFixed(2);

        const badge = document.createElement('span');
        badge.className = `badge badge-${expense.category.toLowerCase()}`;
        badge.textContent = expense.category;
        const tdCategory = document.createElement('td');
        tdCategory.appendChild(badge);

        const tdDate = document.createElement('td');
        tdDate.textContent = expense.date;

        const tdActions = document.createElement('td');
        tdActions.innerHTML = `
            <button class="btn btn-warning btn-sm me-2" onclick="openEditModal(${expense.id})">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteExpense(${expense.id})">Delete</button>
        `;

        tr.append(tdTitle, tdAmount, tdCategory, tdDate, tdActions);
        expenseList.appendChild(tr);
    });
}

function updateSummary(expenses) {
    const amounts = expenses.map(e => Number(e.amount));
    const total = amounts.reduce((sum, a) => sum + a, 0);
    const highest = amounts.length ? Math.max(...amounts) : 0;

    document.getElementById('total-amount').textContent = total.toFixed(2);
    document.getElementById('expense-count').textContent = expenses.length;
    document.getElementById('highest-expense').textContent = highest.toFixed(2);
}

// ---------- POST ----------
document.getElementById('add-expense-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    showSpinner();

    const expenseData = {
        title: document.getElementById('title').value.trim(),
        amount: document.getElementById('amount').value,
        category: document.getElementById('category').value,
        date: document.getElementById('date').value
    };

    try {
        const response = await sendJson(API_URL, 'POST', expenseData);

        if (response.ok) {
            e.target.reset();
            await fetchExpenses();
            showAlert('Expense added.', 'success');
        } else {
            const errorData = await response.json();
            showAlert(errorData.message);
        }
    } catch (error) {
        showAlert('Could not reach the server while adding.');
    } finally {
        hideSpinner();
    }
});

// ---------- DELETE ----------
async function deleteExpense(id) {
    if (!confirm('Delete this expense?')) return;

    showSpinner();
    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });

        if (response.ok) {
            await fetchExpenses();
            showAlert('Expense deleted.', 'success');
        } else {
            const errorData = await response.json();
            showAlert(errorData.message);
        }
    } catch (error) {
        showAlert('Could not reach the server while deleting.');
    } finally {
        hideSpinner();
    }
}

// ---------- PUT (edit modal) ----------
function openEditModal(id) {
    const expense = allExpenses.find(e => e.id === id);
    if (!expense) return;

    document.getElementById('edit-id').value = expense.id;
    document.getElementById('edit-title').value = expense.title;
    document.getElementById('edit-amount').value = expense.amount;
    document.getElementById('edit-category').value = expense.category;
    document.getElementById('edit-date').value = expense.date;

    editAlertContainer.innerHTML = '';
    editModal.show();
}

document.getElementById('edit-expense-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Saving...';
    submitBtn.disabled = true;
    editAlertContainer.innerHTML = '';

    const expenseData = {
        title: document.getElementById('edit-title').value.trim(),
        amount: document.getElementById('edit-amount').value,
        category: document.getElementById('edit-category').value,
        date: document.getElementById('edit-date').value
    };

    try {
        const response = await sendJson(`${API_URL}/${id}`, 'PUT', expenseData);

        if (response.ok) {
            editModal.hide();
            await fetchExpenses();
            showAlert('Expense updated.', 'success');
        } else {
            const errorData = await response.json();
            showAlert(errorData.message, 'danger', editAlertContainer);
        }
    } catch (error) {
        showAlert('Could not reach the server while saving.', 'danger', editAlertContainer);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});