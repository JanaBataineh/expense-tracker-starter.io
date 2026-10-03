Expense Tracker

A Full-Stack web application built to track personal expenses. Designed with a unique "Confidential Detective Case File" UI theme, this project features a RESTful API backend connected to a PostgreSQL database, and a dynamic, responsive front-end.

Features
Full CRUD Operations: Add, view, edit via Bootstrap Modal, and delete expenses.
Dynamic Summary Cards:Real-time calculation of total expenses, transaction count, and the highest single expense using CSS Grid.
Category Filtering:Instantly filter records by category without affecting the overall summary calculations.
Robust Validation: Strict server-side and client-side validation for all inputs, ensuring database integrity.
Security:Implemented XSS protection on the front-end by properly handling user inputs.
UX Improvements: Loading spinners, Bootstrap alerts for error handling, and a responsive mobile-friendly table.

Technologies Used
Frontend:HTML5, CSS3 (CSS Grid, Flexbox), Vanilla JavaScript (ES6+), Bootstrap 5.
Backend: Node.js, Express.js.
Database: PostgreSQL (using `pg` library).

Setup Instructions

Follow these steps to run the project locally:

1. Database Setup
Open pgAdmin and create a new database named expense_tracker.
*Run the SQL queries provided in the `backend/schema.sql` file to create the table and seed initial data.

2. Backend Setup
Navigate to the `backend` folder in your terminal: `cd backend`
Create a `.env` file based on the provided `.env.example` file and insert your PostgreSQL credentials.
Install dependencies: `npm install`
Start the server: `node server.js` (The API will run on `http://localhost:3000`)

3. Frontend Setup
Ensure the backend server is running.
Open the `frontend` folder in VS Code.
Right-click on `index.html` and select Open with Live Server.

Biggest Challenge & Solution

The Challenge:
One of the trickiest parts of the project was managing the UI state after operations like adding, editing, or deleting an expense, particularly ensuring that the loading spinner behaved correctly and didn't disappear before the fresh data was fully fetched and rendered. Additionally, maintaining the overall expense summary calculations while a specific category filter was applied required careful data array management.

The Solution:
I solved the state management issue by strictly enforcing `await fetchExpenses()` inside the `try` blocks of all modifier functions (POST, PUT, DELETE) before triggering the success alerts or hiding the spinner in the `finally` block. For the filter logic, I maintained a global `allExpenses` array and applied the filter dynamically inside `applyFilter()`, passing the filtered list to the table renderer while ensuring the summary cards always calculated their totals directly from the unmodified `allExpenses` array.


 vidio :https://drive.google.com/file/d/1sBk39AMrooGTomat--olvUyTGmj8HPog/view?usp=sharing