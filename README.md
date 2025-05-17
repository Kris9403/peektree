# PeekTree

**PeekTree** is a web-based file tree explorer that lets users browse directories, view and edit files, and perform find-and-replace operations — all within a responsive and customizable interface.

Built using **Node.js**, **Express**, and **vanilla JavaScript**, it features syntax highlighting, breadcrumb navigation, dark mode, and file filtering/sorting tools to enhance local file exploration.

---

## ✨ Features

- **Directory Scanning**: Collapsible tree view of the file system.
- **File Viewing**: Display contents with syntax highlighting (via Highlight.js).
- **Editing**: Full-file editing and partial find-and-replace capabilities.
- **File Management**: Copy file contents, select multiple files, and refresh views.
- **Navigation**: Use breadcrumbs to move through folders easily.
- **Customization**: Sort by name/size, filter by file extensions, and toggle dark mode.
- **Security**: Restricts file access to a defined root directory.
- **Responsive Design**: Mobile-friendly layout and resizable sidebar.

---

## 🚀 Prerequisites

- **Node.js**: v16 or higher
- **Git**: For cloning the repository
- **Modern Browser**: Chrome, Firefox, Edge, etc.

---

## 🔧 Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Kris9403/peektree.git
   cd peektree
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   Create a `.env` file in the root directory (based on `.env.example`):
   ```env
   PORT=4002
   DEFAULT_ROOT=/absolute/path/to/your/folder
   ```
   Replace the path with your desired directory, e.g., `/home/user/projects` or `C:\Users\Krishna\Documents`.

4. **Start the Server**:
   ```bash
   npm start
   ```
   Access the app at: `http://localhost:4002`

---

## 💡 Usage

1. **Scan a Directory**:
   - Enter a directory path and click "Scan" to load its structure.

2. **Browse Files**:
   - Use arrow icons to expand/collapse folders.
   - Use checkboxes to select files or entire directories.

3. **View & Edit**:
   - Click a file to preview it.
   - Double-click to choose between "Full Edit" or "Find & Replace".
   - Use "Save" or "Apply" to store changes.

4. **Sort & Filter**:
   - Sort files by name or size.
   - Filter by file extension (e.g., `.js`, `.css`).
   - Use the "Extensions" button to auto-select files by type.

5. **Copying**:
   - Use "Copy" on individual files or "Copy Selected" for multiple files.

6. **Keyboard Shortcuts**:
   - `Ctrl+F`: Focus search
   - `Esc`: Clear search
   - `Ctrl+A`: Select all files
   - `Ctrl+C`: Copy selected file contents

---

## 📁 Project Structure

```
peektree/
├── public/
│   ├── lib/
│   │   └── highlight.min.js
│   ├── script.js
│   └── styles.css
├── .env.example
├── index.html
├── package.json
├── server.js
└── README.md
```

---

## 🐞 Troubleshooting

- **Server won't start**:
  - Check `.env` file for valid `PORT` and `DEFAULT_ROOT`.
  - Ensure the default root directory exists.
- **Files not displaying**:
  - Check directory permissions.
  - Open the browser console for any JavaScript errors.
- **Edits not saving**:
  - Ensure the server has write access to files.

---

## 🚧 Known Limitations

- No public deployment or live demo yet.
- No login or user management.
- Large files may cause performance issues.
- Screenshots and advanced features will be added in future updates.

---

## 📫 Contact

For questions, feedback, or suggestions:
- **GitHub**: [@Kris9403](https://github.com/Kris9403)
- **Email**: bhandalkarkrishna03@gmail.com

---

## 🛑 License

⚠️ No open-source license has been added yet. Please do not redistribute or use this project in production without permission.

---

## 🙏 Acknowledgments

- [Highlight.js](https://highlightjs.org/) for syntax highlighting
- [Express](https://expressjs.com/) for backend routing
- Inspired by tools like VS Code and file explorers

Happy coding with PeekTree! 🌳✨