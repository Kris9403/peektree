# PeekTree

PeekTree is a web-based file tree explorer that allows users to browse directories, view file contents, edit files, and perform find-and-replace operations. Built with Node.js, Express, and vanilla JavaScript, it features a responsive UI with dark mode, breadcrumb navigation, file sorting/filtering, and extension-based file selection.

## Features

- **Directory Scanning**: Browse file structures with a collapsible tree view.
- **File Viewing**: Display file contents with syntax highlighting (via Highlight.js).
- **Editing**: Full file editing and partial find-and-replace functionality.
- **File Management**: Copy file contents, select multiple files, and refresh file views.
- **Navigation**: Breadcrumb trail for easy directory navigation.
- **Customization**: Sort files by name or size, filter by extension, and toggle dark mode.
- **Security**: Prevents access to files outside the specified root directory.
- **Responsive Design**: Resizable sidebar and mobile-friendly layout.

## Prerequisites

- **Node.js**: Version 16 or higher.
- **Git**: For cloning the repository.
- **Web Browser**: Chrome, Firefox, or any modern browser.

## Installation

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
   Create a `.env` file in the root directory based on `.env.example`:
   ```env
   PORT=4002
   DEFAULT_ROOT=/path/to/your/default/directory
   ```
   Replace `/path/to/your/default/directory` with the absolute path to the default directory you want to scan (e.g., `/home/user/projects` or `C:\Users\Krishna\Documents`).

4. **Start the Server**:
   ```bash
   npm start
   ```
   The application will run at `http://localhost:4002` (or the port specified in `.env`).

## Usage

1. **Access the Application**:
   Open `http://localhost:4002` in your browser.

2. **Scan a Directory**:
   - Enter a directory path in the input field and click "Scan" to load the file tree.
   - Use the breadcrumb trail to navigate directories.

3. **Browse and Select Files**:
   - Click folder arrows to expand/collapse directories.
   - Check file checkboxes to select files; folder checkboxes select all files within.
   - Use "Expand All" to view the entire tree.

4. **View and Edit Files**:
   - Select a file to view its contents in the main panel.
   - Double-click a file block to choose between "Full Edit" (edit entire file) or "Find & Replace" (partial edits).
   - Save changes using the respective "Save" or "Apply" buttons.

5. **Sort and Filter**:
   - Use the sort dropdown to order files by name or size (ascending/descending).
   - Use the filter dropdown to show specific file types (e.g., `.js`, `.css`).
   - Select file extensions via the "Extensions" button to auto-select files by type.

6. **Copy Content**:
   - Click "Copy" on a file block to copy its contents.
   - Use "Copy Selected" to copy contents of all selected files.

7. **Keyboard Shortcuts**:
   - `Ctrl+F`: Focus search input.
   - `Esc`: Clear search.
   - `Ctrl+A`: Select all files.
   - `Ctrl+C`: Copy selected files' contents.

## Project Structure

```
peektree/
├── public/
│   ├── lib/
│   │   └── highlight.min.js  # Syntax highlighting library
│   ├── script.js             # Client-side JavaScript
│   └── styles.css            # CSS styles
├── .env                      # Environment variables (not tracked)
├── .env.example              # Example environment file
├── .gitignore                # Git ignore patterns
├── index.html                # Main HTML file
├── package.json              # Node.js dependencies and scripts
├── README.md                 # This file
└── server.js                 # Express server
```

## Contributing

We welcome contributions! To contribute:

1. **Fork the Repository**:
   Click "Fork" on the GitHub repository page.

2. **Clone Your Fork**:
   ```bash
   git clone https://github.com/your-username/peektree.git
   ```

3. **Create a Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Make Changes**:
   Implement your feature or bug fix, ensuring code quality and tests (if applicable).

5. **Commit and Push**:
   ```bash
   git add .
   git commit -m "Add your feature or fix description"
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**:
   Go to the original repository on GitHub and create a pull request from your branch.

Please follow the [Code of Conduct](CODE_OF_CONDUCT.md) and ensure your changes align with the project's style (e.g., consistent formatting, clear comments).

## Security Notes

- The server restricts file access to the specified root directory to prevent unauthorized access.
- File paths and content are sanitized to mitigate XSS risks.
- Avoid exposing sensitive files (e.g., `.env`) in the scanned directory.

## Troubleshooting

- **Server Fails to Start**:
  - Check `.env` for valid `PORT` and `DEFAULT_ROOT`.
  - Ensure the default root directory exists and is accessible.
- **Files Not Loading**:
  - Verify the directory path and file permissions.
  - Check browser console for errors (e.g., CORS, 404).
- **Changes Not Saved**:
  - Ensure the server has write permissions for the target files.
- **Contact**:
  For issues, open a GitHub issue or contact the maintainer at [your.email@example.com].

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Highlight.js](https://highlightjs.org/) for syntax highlighting.
- [Express](https://expressjs.com/) for the server framework.
- Inspired by tools like VS Code and File Explorer.

---

Happy coding with PeekTree! 🌳✨
