# 💸 Expense Splitter

A lightweight, beginner-friendly Node.js and Express web application designed to track shared expenses among friends and calculate the minimum number of payments needed to settle all debts.

---

## ✨ Features

- **👥 Dynamic Participants**: Add or remove friends from the group at any time with an auto-updating counter.
- **📝 Selective Splitting**: Choose exactly which friends share each expense using checkboxes (split equally among selected participants).
- **🤝 "Who Pays Whom" (Settlement Plan)**: Uses a greedy debt-simplification algorithm (`settle.js`) to calculate the minimal number of payments to settle all debts.
- **📊 Real-time Balance Overview**: Displays total group expenses, average fair share, and individual net balances (who is owed vs. who owes).
- **💾 Local Persistence**: Automatically saves participants and expenses to a local JSON file (`server/data.json`) so your data survives server restarts and page refreshes.
- **🧪 Automated Tests**: Built-in test suite to verify the debt simplification algorithm.

---

## 🛠️ Tech Stack

- **Backend**: [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/)
- **Frontend**: Vanilla HTML5, CSS3, and JavaScript (Fetch API)
- **Data Storage**: JSON file-based local persistence
- **Testing**: Node.js built-in `assert` runner

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- npm (installed automatically with Node.js)

### Installation & Running Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AP24110011001/Expense_Splitter.git
   cd Expense_Splitter
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the application:**
   ```bash
   npm start
   ```

4. **Open in your browser:**
   Visit [http://localhost:3000](http://localhost:3000)

---

## 🧪 Running Tests

To run the automated tests for the debt simplification logic:

```bash
npm test
```

---

## 📁 Project Structure

```text
expense/
├── public/
│   ├── index.html       # Web page layout & UI structure
│   ├── style.css        # Clean, modern responsive stylesheet
│   └── script.js        # Client-side logic, API calls, and UI updates
├── server/
│   ├── index.js         # Express server & REST API endpoints
│   └── data.json        # Persistent JSON storage
├── settle.js            # Greedy debt simplification algorithm
├── test-settle.js       # Test suite for settle.js
├── package.json         # Project metadata, dependencies, and npm scripts
└── README.md            # Project documentation
```

---

## 👤 Author

- **GitHub**: [@AP24110011001](https://github.com/AP24110011001)
