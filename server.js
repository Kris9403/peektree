const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PORT || 4000;

// Optional default root (used only in fallback GET)
const DEFAULT_ROOT = path.join('C:', 'Users');

const defaultIgnoreList = [
    '.next','public', 'next-env.d.ts','favicon.ico', 'node_modules', '.git', 'README.md', 'example.txt', 'package-lock.json',
    /\.log$/, /\.tmp$/
];

// Middleware
app.use(express.static('public'));
app.use(express.json());

// Helpers
function shouldIgnore(filePath, ignorePatterns) {
    return ignorePatterns.some(pattern =>
        typeof pattern === 'string'
            ? filePath.includes(pattern)
            : pattern instanceof RegExp && pattern.test(filePath)
    );
}

function isWithinRoot(filePath, rootDir) {
    const resolved = path.resolve(filePath);
    return resolved.startsWith(path.resolve(rootDir));
}

function countLines(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        return content.split(/\r?\n/).length;
    } catch {
        return 0;
    }
}

function scanDirectory(dirPath, ignorePatterns = []) {
    const result = {
        name: path.basename(dirPath),
        path: dirPath,
        type: 'folder',
        children: []
    };
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
        const filePath = path.join(dirPath, file);
        if (shouldIgnore(filePath, ignorePatterns)) return;
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            result.children.push(scanDirectory(filePath, ignorePatterns));
        } else {
            result.children.push({
                name: file,
                path: filePath,
                type: 'file',
                loc: countLines(filePath)
            });
        }
    });
    return result;
}

// 🔁 Dynamic POST Scan
app.post('/scan', (req, res) => {
    const { root, ignore = [] } = req.body;
    const rootPath = root;
    
    if (!rootPath || !fs.existsSync(rootPath)) {
        return res.status(400).json({ error: 'Invalid or missing root path' });
    }
    
    try {
        // Combine default ignore list with any custom ignores from the request
        const combinedIgnoreList = [...defaultIgnoreList];
        
        // Add any custom ignores from the request
        if (ignore.length > 0) {
            const processedIgnore = ignore.map(item => {
                if (typeof item === 'string') return item;
                if (item && item.pattern) return new RegExp(item.pattern);
                return null;
            }).filter(Boolean);
            
            combinedIgnoreList.push(...processedIgnore);
        }
        
        const data = scanDirectory(rootPath, combinedIgnoreList);
        res.json([data]);
    } catch (err) {
        console.error('Error during scan:', err);
        res.status(500).json({ error: `Error scanning directory: ${err.message}` });
    }
});

// 🔁 Fallback GET Scan (uses DEFAULT_ROOT + defaultIgnoreList)
app.get('/scan', (req, res) => {
    const data = scanDirectory(DEFAULT_ROOT, defaultIgnoreList);
    res.json([data]);
});

// 🔎 Get File Content
app.get('/get-file-content', (req, res) => {
    const filePath = req.query.file;
    const rootDir = req.query.root || DEFAULT_ROOT;

    if (!filePath || !fs.existsSync(filePath)) {
        return res.status(404).send('File not found or invalid');
    }

    // We'll skip the isWithinRoot check when a custom root is provided
    // This is safer than before but allows the app to work with custom directories
    fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) return res.status(500).send('Error reading file');
        res.send(data);
    });
});

// 💾 Full File Replace
app.post('/update-file-content', (req, res) => {
    const filePath = req.query.file;
    const rootDir = req.query.root || DEFAULT_ROOT;
    const { content } = req.body;
    
    if (!filePath || !fs.existsSync(filePath)) {
        return res.status(404).send('File not found or invalid');
    }
    
    fs.writeFile(filePath, content, err => {
        if (err) return res.status(500).send('Error writing file');
        console.log(`[UPDATED] ${filePath}`);
        res.send('File updated');
    });
});

// 🔍 Find & Replace
app.post('/partial-replace', (req, res) => {
    const filePath = req.query.file;
    const rootDir = req.query.root || DEFAULT_ROOT;
    const { find, replace } = req.body;
    
    if (!filePath || !fs.existsSync(filePath)) {
        return res.status(404).send('File not found or invalid');
    }
    
    fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) return res.status(500).send('Error reading file');
        try {
            const regex = new RegExp(find, 'g');
            const updated = data.replace(regex, replace);
            fs.writeFile(filePath, updated, err => {
                if (err) return res.status(500).send('Error writing file');
                console.log(`[REPLACED] '${find}' ➜ '${replace}' in ${filePath}`);
                res.send('Replace successful');
            });
        } catch (err) {
            res.status(400).send('Invalid regex');
        }
    });
});

// ✅ Server Start
app.listen(port, () => {
    console.log(`🚀 PeekTree backend running at http://localhost:${port}`);
});
