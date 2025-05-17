require('dotenv').config();

const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PORT || 4002;

// Optional default root (used only in fallback GET)
const DEFAULT_ROOT = process.env.DEFAULT_ROOT || path.resolve(__dirname);

const defaultIgnoreList = [
    '.next', 'next-env.d.ts', 'favicon.ico', 'node_modules', '.git', 'README.md', 'example.txt', 'package-lock.json',
    /\.log$/, /\.tmp$/, /\.png$/, /\.svg$/
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
        if (shouldIgnore(filePath, ignorePatterns)) {
            return;
        }
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            result.children.push(scanDirectory(filePath, ignorePatterns));
        } else {
            // Handle .env explicitly
            let ext = path.extname(file).toLowerCase().slice(1);
            if (file === '.env') {
                ext = 'env'; // Force .env to have 'env' extension
            }
            result.children.push({
                name: file,
                path: filePath,
                type: 'file',
                loc: countLines(filePath),
                extension: ext || '' // Include extension, empty if no extension
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
    if (!fs.existsSync(DEFAULT_ROOT)) {
        return res.status(400).json({ error: `Default root path does not exist: ${DEFAULT_ROOT}` });
    }
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

    if (!isWithinRoot(filePath, rootDir)) {
        return res.status(403).send('Access denied: File is outside the root directory');
    }

    fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading file');
        }
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
    
    if (!isWithinRoot(filePath, rootDir)) {
        return res.status(403).send('Access denied: File is outside the root directory');
    }
    
    fs.writeFile(filePath, content, err => {
        if (err) {
            return res.status(500).send('Error writing file');
        }
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
    
    if (!isWithinRoot(filePath, rootDir)) {
        return res.status(403).send('Access denied: File is outside the root directory');
    }
    
    fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading file');
        }
        try {
            const regex = new RegExp(find, 'g');
            const updated = data.replace(regex, replace);
            fs.writeFile(filePath, updated, err => {
                if (err) {
                    return res.status(500).send('Error writing file');
                }
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