let selectedFiles = [];
let currentRootPath = ''; // Track the current root path
let currentSortMethod = 'name-asc'; // Default sorting method
let currentFileFilter = 'all'; // Default file filter
let selectedExtensions = []; // Track selected extensions

// Load selected extensions from localStorage
function loadSelectedExtensions() {
  const savedExtensions = localStorage.getItem('selectedExtensions');
  if (savedExtensions) {
    selectedExtensions = JSON.parse(savedExtensions);
  }
}

// Show Edit Mode selection on double-click
document.addEventListener('dblclick', (e) => {
  const block = e.target.closest('.file-block');
  if (!block) return;
  
  const existingPopup = document.querySelector('.edit-popup');
  if (existingPopup) existingPopup.remove();
  
  const popup = document.createElement('div');
  popup.className = 'edit-popup';
  popup.innerHTML = `
    <p>Select Edit Mode:</p>
    <button class="edit-option" data-mode="full">Full Edit</button>
    <button class="edit-option" data-mode="partial">Find & Replace</button>
  `;
  
  block.appendChild(popup);
  
  popup.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      const selectElement = block.querySelector('select');
      if (selectElement) selectElement.classList.add('hidden');
      
      if (mode === 'full') {
        block.querySelector('.full-edit')?.classList.remove('hidden');
        block.querySelector('.partial-edit')?.classList.add('hidden');
      } else {
        block.querySelector('.full-edit')?.classList.add('hidden');
        block.querySelector('.partial-edit')?.classList.remove('hidden');
      }
      
      popup.remove();
    });
  });
  
  // Hide popup when clicking outside
  setTimeout(() => {
    document.addEventListener('click', function outsideClick(e) {
      if (!popup.contains(e.target)) {
        popup.remove();
        document.removeEventListener('click', outsideClick);
      }
    });
  });
});

async function copySelected() {
  const checkboxes = document.querySelectorAll('.tree-checkbox:checked');
  if (checkboxes.length === 0) {
    showToast("No files selected", "error");
    return;
  }
  let combinedText = '';
  let copiedCount = 0;
  const processedFiles = new Set(); // Track unique file paths

  for (const checkbox of checkboxes) {
    const li = checkbox.closest('li');
    if (li.classList.contains('folder')) {
      const fileItems = Array.from(li.querySelectorAll('li.file')).filter(fileLi => {
        if (currentFileFilter === 'all') return true;
        const fileName = fileLi.dataset.path.split(/[\\/]/).pop();
        return fileName.toLowerCase().endsWith(`.${currentFileFilter}`);
      });
      for (const fileLi of fileItems) {
        const filePath = fileLi.dataset.path;
        if (processedFiles.has(filePath)) continue; // Skip duplicates
        processedFiles.add(filePath);
        const fileName = filePath.split(/[\\/]/).pop();
        let content = await getFileContent(filePath, fileName);
        if (content.trim()) {
          combinedText += `\n\n/* ${fileName} */\n${content}`;
          copiedCount++;
        }
      }
    } else {
      const filePath = li.dataset.path;
      if (processedFiles.has(filePath)) continue; // Skip duplicates
      processedFiles.add(filePath);
      const fileName = filePath.split(/[\\/]/).pop();
      let content = await getFileContent(filePath, fileName);
      if (content.trim()) {
        combinedText += `\n\n/* ${fileName} */\n${content}`;
        copiedCount++;
      }
    }
  }
  
  if (!combinedText.trim()) {
    showToast("No file content found", "error");
    return;
  }
  
  try {
    await navigator.clipboard.writeText(combinedText.trim());
    showToast(`Copied content from ${copiedCount} file(s)`, "success");
  } catch (err) {
    console.error("Clipboard error:", err);
    showToast("Failed to copy to clipboard", "error");
  }
}

// Helper to fetch file content
async function getFileContent(filePath, fileName) {
  let contentBlock = document.querySelector(`.file-block[data-path="${CSS.escape(filePath)}"]`);
  let content = '';
  if (contentBlock) {
    const contentDiv = contentBlock.querySelector('pre code');
    if (contentDiv) {
      content = contentDiv.textContent || '';
    }
  } else {
    try {
      const response = await fetch(`/get-file-content?file=${encodeURIComponent(filePath)}&root=${encodeURIComponent(currentRootPath)}`);
      if (response.ok) {
        content = await response.text();
      } else {
        console.warn(`Failed to fetch content for ${fileName}`);
        showToast(`Could not load ${fileName}`, "error");
      }
    } catch (err) {
      console.error(`Error fetching ${fileName}:`, err);
      showToast(`Error fetching ${fileName}`, "error");
    }
  }
  return content;
}

function escapeHTML(str) {
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;'
  })[m]);
}

// Initialize dark mode
function initDarkMode() {
  const darkModeBtn = document.getElementById('darkModeToggle');
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark');
  }
  
  darkModeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    localStorage.setItem('darkMode', isDark);
  });
}

// Generate breadcrumb navigation
function generateBreadcrumbs(currentPath) {
  const breadcrumbContainer = document.getElementById('breadcrumbTrail');
  if (!breadcrumbContainer) return;
  breadcrumbContainer.innerHTML = '';
  
  if (!currentPath) {
    breadcrumbContainer.innerHTML = '<span class="breadcrumb-item">Home</span>';
    return;
  }
  
  const segments = currentPath.split(/[\\\/]/);
  let cumulativePath = '';
  
  const homeItem = document.createElement('span');
  homeItem.className = 'breadcrumb-item';
  homeItem.textContent = 'Home';
  homeItem.addEventListener('click', () => {
    currentRootPath = '';
    scanDirectory();
  });
  breadcrumbContainer.appendChild(homeItem);
  
  breadcrumbContainer.appendChild(document.createTextNode(' > '));
  
  segments.forEach((segment, index) => {
    if (!segment) return;
    
    cumulativePath += (cumulativePath ? '\\' : '') + segment;
    
    const breadcrumbItem = document.createElement('span');
    breadcrumbItem.className = 'breadcrumb-item';
    breadcrumbItem.textContent = segment;
    
    if (index < segments.length - 1) {
      breadcrumbItem.classList.add('clickable');
      breadcrumbItem.addEventListener('click', () => {
        currentRootPath = cumulativePath;
        scanDirectory();
      });
    } else {
      breadcrumbItem.classList.add('current');
    }
    
    breadcrumbContainer.appendChild(breadcrumbItem);
    
    if (index < segments.length - 1) {
      breadcrumbContainer.appendChild(document.createTextNode(' > '));
    }
  });
}

// Sort files function
function sortFileTree(data, method) {
  if (data && Array.isArray(data)) {
    data.forEach(item => {
      if (item.type === 'folder' && item.children) {
        sortFileTree(item.children, method);
      }
    });
    
    data.sort((a, b) => {
      if (a.type === 'folder' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'folder') return 1;
      
      switch (method) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'size-asc':
          if (a.type === 'folder' && b.type === 'folder') return a.name.localeCompare(b.name);
          return (a.loc || 0) - (b.loc || 0);
        case 'size-desc':
          if (a.type === 'folder' && b.type === 'folder') return a.name.localeCompare(b.name);
          return (b.loc || 0) - (a.loc || 0);
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }
  return data;
}

// Filter files function
function filterFileTree(data, filter) {
  if (!data || !Array.isArray(data)) return [];
  
  const filteredData = data.map(item => {
    if (item.type === 'folder') {
      const filteredChildren = filterFileTree(item.children || [], filter);
      
      if (filteredChildren.length > 0 || filter === 'all') {
        return {
          ...item,
          children: filteredChildren
        };
      }
      return null;
    } else if (item.type === 'file') {
      if (filter === 'all') return item;
      
      const fileExt = item.name.split('.').pop().toLowerCase();
      if (filter === fileExt) return item;
      return null;
    }
    return null;
  }).filter(Boolean);
  
  return filteredData;
}

function createTree(data) {
  const ul = document.createElement('ul');
  data.forEach(item => {
    const li = document.createElement('li');
    if (item.type === 'folder') {
      const arrow = document.createElement('span');
      arrow.textContent = '▶';
      arrow.className = 'arrow';
      li.classList.add('folder');
      li.appendChild(arrow);
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.classList.add('tree-checkbox', 'folder-checkbox');
      li.appendChild(checkbox);
      
      const label = document.createElement('span');
      label.className = 'label';
      label.textContent = item.name;
      li.appendChild(label);
      
      const children = createTree(item.children || []);
      children.classList.add('nested');
      li.appendChild(children);
      
      arrow.addEventListener('click', (e) => {
        e.stopPropagation();
        children.classList.toggle('active');
        li.classList.toggle('expanded');
      });
      
      label.addEventListener('click', (e) => {
        e.stopPropagation();
        children.classList.toggle('active');
        li.classList.toggle('expanded');
      });
      
      // Handle folder checkbox
      checkbox.addEventListener('change', (e) => {
        e.stopPropagation();
        const isChecked = e.target.checked;
        
        // Select/deselect all children
        const childCheckboxes = li.querySelectorAll('.tree-checkbox');
        childCheckboxes.forEach(cb => {
          cb.checked = isChecked;
          
          if (!cb.classList.contains('folder-checkbox')) {
            const fileLi = cb.closest('li');
            const filePath = fileLi.dataset.path;
            const fileName = filePath.split(/[\\/]/).pop();
            
            if (isChecked) {
              if (!selectedFiles.includes(filePath)) {
                selectedFiles.push(filePath);
                showToast(`Selected: ${fileName}`, 'info');
                loadFile(filePath, fileName, fileLi.dataset.loc || 0);
              }
            } else {
              const index = selectedFiles.indexOf(filePath);
              if (index > -1) {
                selectedFiles.splice(index, 1);
                showToast(`Unselected: ${fileName}`, 'info');
                const block = document.querySelector(`.file-block[data-path="${CSS.escape(filePath)}"]`);
                if (block) block.remove();
              }
            }
          }
        });
        
        // Update parent checkboxes
        updateParentCheckboxes(li);
      });
    } else {
      li.dataset.path = item.path;
      li.dataset.loc = item.loc;
      li.classList.add('file');
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.classList.add('tree-checkbox');
      li.appendChild(checkbox);
      
      const label = document.createElement('span');
      label.className = 'label';
      label.textContent = `${item.name} (${item.loc} LOC)`;
      li.appendChild(label);
      
      checkbox.addEventListener('change', (e) => {
        e.stopPropagation();
        const filePath = item.path;
        const fileName = item.name;
        
        if (e.target.checked) {
          if (!selectedFiles.includes(filePath)) {
            selectedFiles.push(filePath);
            showToast(`Selected: ${fileName}`, 'info');
            loadFile(filePath, fileName, item.loc);
          }
        } else {
          const index = selectedFiles.indexOf(filePath);
          if (index > -1) {
            selectedFiles.splice(index, 1);
            showToast(`Unselected: ${fileName}`, 'info');
            const block = document.querySelector(`.file-block[data-path="${CSS.escape(filePath)}"]`);
            if (block) block.remove();
          }
        }
        
        updateParentCheckboxes(li);
      });
      
      label.addEventListener('click', (e) => {
        e.stopPropagation();
        const checkbox = li.querySelector('.tree-checkbox');
        checkbox.checked = !checkbox.checked;
        
        const changeEvent = new Event('change');
        checkbox.dispatchEvent(changeEvent);
      });
      
      label.addEventListener('click', (e) => {
        if (e.shiftKey) {
          e.preventDefault();
          handleShiftClick(li);
        }
      });
    }
    ul.appendChild(li);
  });
  return ul;
}

// Update parent checkboxes based on children
function updateParentCheckboxes(li) {
  let parentLi = li.closest('.nested')?.closest('li.folder');
  while (parentLi) {
    const parentCheckbox = parentLi.querySelector('.folder-checkbox');
    const childCheckboxes = parentLi.querySelectorAll('.tree-checkbox:not(.folder-checkbox)');
    const allChecked = Array.from(childCheckboxes).every(cb => cb.checked);
    const someChecked = Array.from(childCheckboxes).some(cb => cb.checked);
    
    parentCheckbox.checked = allChecked;
    parentCheckbox.indeterminate = someChecked && !allChecked;
    
    parentLi = parentLi.closest('.nested')?.closest('li.folder');
  }
}

// Shift-click for multi-select
let lastSelectedLi = null;
function handleShiftClick(currentLi) {
  if (!currentLi.classList.contains('file')) return;
  
  const fileItems = Array.from(document.querySelectorAll('#sidebar li.file'));
  const currentIndex = fileItems.indexOf(currentLi);
  
  if (lastSelectedLi && lastSelectedLi.classList.contains('file')) {
    const lastIndex = fileItems.indexOf(lastSelectedLi);
    
    const start = Math.min(currentIndex, lastIndex);
    const end = Math.max(currentIndex, lastIndex);
    
    for (let i = start; i <= end; i++) {
      const item = fileItems[i];
      const checkbox = item.querySelector('.tree-checkbox');
      if (checkbox && !checkbox.checked) {
        checkbox.checked = true;
        const changeEvent = new Event('change');
        checkbox.dispatchEvent(changeEvent);
      }
    }
  }
  
  lastSelectedLi = currentLi;
}

function loadFile(path, name, loc) {
  if (document.querySelector(`.file-block[data-path="${CSS.escape(path)}"]`)) return;
  
  document.getElementById('loading-spinner').classList.remove('hidden');
  
  fetch(`/get-file-content?file=${encodeURIComponent(path)}&root=${encodeURIComponent(currentRootPath)}`)
    .then(res => {
      if (!res.ok) throw new Error(`Server returned ${res.status}: ${res.statusText}`);
      return res.text();
    })
    .then(data => {
      document.getElementById('loading-spinner').classList.add('hidden');
      
      const block = document.createElement('div');
      block.className = 'file-block slide-in';
      block.dataset.path = path;
      
      block.innerHTML = `
        <div class="file-header">
          <h2>${escapeHTML(name)} (${loc} LOC)</h2>
          <div class="file-actions">
            <button onclick="copyContent(this)">Copy</button>
            <button onclick="closeFile(this)">Close</button>
          </div>
        </div>
        <pre><code>${escapeHTML(data)}</code></pre>
        <div class="edit-controls">
          <div class="full-edit hidden">
            <textarea>${escapeHTML(data)}</textarea>
            <button onclick="saveFullEdit('${CSS.escape(path)}', this)">Save</button>
          </div>
          <div class="partial-edit hidden">
            <input type="text" placeholder="Find" class="find-text">
            <input type="text" placeholder="Replace" class="replace-text">
            <button onclick="savePartialEdit('${CSS.escape(path)}', this)">Apply</button>
          </div>
        </div>`;
        
      document.getElementById('content').appendChild(block);
      block.scrollIntoView({ behavior: 'smooth' });
    })
    .catch(error => {
      document.getElementById('loading-spinner').classList.add('hidden');
      showToast(`Failed to load file: ${name}`, 'error');
      console.error('Error loading file:', error);
    });
}

function closeFile(btn) {
  const block = btn.closest('.file-block');
  const filePath = block.dataset.path;
  
  const checkbox = document.querySelector(`li[data-path="${CSS.escape(filePath)}"] .tree-checkbox`);
  if (checkbox) {
    checkbox.checked = false;
    updateParentCheckboxes(checkbox.closest('li'));
  }
  
  const index = selectedFiles.indexOf(filePath);
  if (index > -1) {
    selectedFiles.splice(index, 1);
  }
  
  block.remove();
}

function copyContent(btn) {
  const code = btn.closest('.file-block').querySelector('pre code').textContent;
  navigator.clipboard.writeText(code)
    .then(() => {
      showToast('File content copied to clipboard', 'success');
    })
    .catch(err => {
      console.error("Clipboard write failed:", err);
      showToast("Failed to copy to clipboard", "error");
    });
}

function initResizer() {
  const resizer = document.getElementById('resizer');
  const sidebar = document.getElementById('sidebar');
  sidebar.style.width = '300px';
  
  resizer.addEventListener('mousedown', (e) => {
    document.body.style.cursor = 'ew-resize';
    
    function resize(e) {
      const newWidth = Math.max(200, Math.min(e.clientX, window.innerWidth * 0.8));
      sidebar.style.width = `${newWidth}px`;
    }
    
    function stopResize() {
      document.body.style.cursor = '';
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResize);
    }
    
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResize);
  });
}

function saveFullEdit(path, btn) {
  const text = btn.previousElementSibling.value;
  
  fetch(`/update-file-content?file=${encodeURIComponent(path)}&root=${encodeURIComponent(currentRootPath)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: text })
  })
    .then(response => {
      if (!response.ok) throw new Error('Server returned error');
      return response.text();
    })
    .then(() => {
      showToast('File saved successfully!', 'success');
      const block = btn.closest('.file-block');
      block.querySelector('pre code').textContent = text;
    })
    .catch(() => {
      showToast('Failed to save file!', 'error');
    });
}

function savePartialEdit(path, btn) {
  const block = btn.closest('.partial-edit');
  const find = block.querySelector('.find-text').value;
  const replace = block.querySelector('.replace-text').value;
  
  if (!find) {
    showToast('Find text cannot be empty', 'error');
    return;
  }
  
  fetch(`/partial-replace?file=${encodeURIComponent(path)}&root=${encodeURIComponent(currentRootPath)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ find, replace })
  })
    .then(response => {
      if (!response.ok) throw new Error('Failed to apply replacement');
      return response.text();
    })
    .then(() => {
      showToast('Find & Replace applied!', 'success');
      return fetch(`/get-file-content?file=${encodeURIComponent(path)}&root=${encodeURIComponent(currentRootPath)}`);
    })
    .then(res => res.text())
    .then(updated => {
      const block = btn.closest('.file-block');
      block.querySelector('pre code').textContent = updated;
      block.querySelector('.full-edit textarea').value = updated;
    })
    .catch(() => {
      showToast('Find & Replace failed', 'error');
    });
}

function expandAll() {
  document.querySelectorAll('.folder').forEach(folder => {
    folder.classList.add('expanded');
    const arrow = folder.querySelector('.arrow');
    const nested = folder.querySelector('.nested');
    if (arrow && nested) {
      nested.classList.add('active');
    }
  });
  showToast('All folders expanded', 'info');
}

function showToast(message, type = 'info') {
  const existing = Array.from(document.querySelectorAll('.toast')).find(t => t.textContent === message);
  if (existing) return;
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'alert');
  toast.textContent = message;
  document.getElementById('toast-container').appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function searchTree() {
  const searchValue = document.getElementById('searchInput').value.toLowerCase();
  const listItems = document.querySelectorAll('#sidebar li');
  let matchCount = 0;
  
  listItems.forEach(li => {
    const fullText = li.textContent.toLowerCase();
    const matches = fullText.includes(searchValue);
    const labelElement = li.querySelector('.label');
    
    if (labelElement) {
      const originalText = labelElement.textContent;
      labelElement.innerHTML = originalText;
      
      if (matches && searchValue) {
        const regex = new RegExp(`(${searchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig');
        labelElement.innerHTML = originalText.replace(regex, `<span class="blink-highlight">$1</span>`);
        if (!li.classList.contains('folder')) matchCount++;
      }
    }
    
    li.style.display = matches ? '' : 'none';
    
    if (li.classList.contains('folder')) {
      const nested = li.querySelector('.nested');
      const hasMatchingChildren = Array.from(nested.children).some(child => child.style.display !== 'none');
      
      li.style.display = hasMatchingChildren || matches ? '' : 'none';
      
      if (hasMatchingChildren && searchValue) {
        nested.classList.add('active');
        li.classList.add('expanded');
      } else if (searchValue === '') {
        // Keep expansion state
      } else {
        nested.classList.remove('active');
        li.classList.remove('expanded');
      }
    }
  });
  
  if (searchValue) {
    showToast(`Found ${matchCount} matching files`, 'info');
  }
}

// New function to get unique extensions from file tree
function getUniqueExtensions(data) {
  const extensions = new Set();
  function traverse(items) {
    items.forEach(item => {
      if (item.type === 'file' && item.extension) {
        extensions.add(item.extension);
      }
      if (item.children) {
        traverse(item.children);
      }
    });
  }
  traverse(data);
  return Array.from(extensions).sort();
}

// New function to render extension dropdown
function renderExtensionDropdown(extensions) {
  const dropdown = document.querySelector('#extensionDropdown .extension-list');
  dropdown.innerHTML = '';

  extensions.forEach(ext => {
    const div = document.createElement('div');
    div.className = 'extension-item';
    div.innerHTML = `
      <input type="checkbox" id="ext-${ext}" value="${ext}" ${selectedExtensions.includes(ext) ? 'checked' : ''}>
      <label for="ext-${ext}">${ext}</label>
    `;
    dropdown.appendChild(div);
  });

  // Add event listeners to checkboxes
  dropdown.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const ext = e.target.value;
      if (e.target.checked) {
        if (!selectedExtensions.includes(ext)) {
          selectedExtensions.push(ext);
        }
      } else {
        const index = selectedExtensions.indexOf(ext);
        if (index > -1) {
          selectedExtensions.splice(index, 1);
        }
      }
      localStorage.setItem('selectedExtensions', JSON.stringify(selectedExtensions));
      selectFilesByExtensions();
      showToast(`Extension ${ext} ${e.target.checked ? 'selected' : 'deselected'}`, 'info');
    });
  });
}

// New function to select files by selected extensions
function selectFilesByExtensions() {
  const fileItems = document.querySelectorAll('#sidebar li.file');
  fileItems.forEach(item => {
    const checkbox = item.querySelector('.tree-checkbox');
    const filePath = item.dataset.path;
    const fileName = filePath.split(/[\\/]/).pop();
    const ext = fileName.split('.').pop().toLowerCase();
    
    if (selectedExtensions.includes(ext)) {
      if (!checkbox.checked) {
        checkbox.checked = true;
        const changeEvent = new Event('change');
        checkbox.dispatchEvent(changeEvent);
      }
    } else {
      if (checkbox.checked) {
        checkbox.checked = false;
        const changeEvent = new Event('change');
        checkbox.dispatchEvent(changeEvent);
      }
    }
  });
}

// Initialize extension filter dropdown
function initExtensionFilter(data) {
  const extensions = getUniqueExtensions(data);
  renderExtensionDropdown(extensions);
  
  const filterBtn = document.getElementById('extensionFilterBtn');
  const dropdown = document.getElementById('extensionDropdown');
  
  filterBtn.addEventListener('click', () => {
    dropdown.classList.toggle('hidden');
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && e.target !== filterBtn) {
      dropdown.classList.add('hidden');
    }
  });
}

function scanDirectory() {
  let inputPath = document.getElementById('directoryPathInput').value.trim() || currentRootPath;
  if (!inputPath) {
    showToast("Please enter a directory path", "error");
    return;
  }

  // Normalize path for Windows (replace forward slashes with backslashes)
  inputPath = inputPath.replace(/\//g, '\\');
  currentRootPath = inputPath;

  fetch('/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ root: inputPath })
  })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        showToast(`Error: ${data.error}`, "error");
      } else {
        showToast("Directory scanned successfully!", "success");
        window.currentRootPath = currentRootPath;
        generateBreadcrumbs(currentRootPath);
        let processedData = [...data];
        processedData = sortFileTree(processedData, currentSortMethod);
        processedData = filterFileTree(processedData, currentFileFilter);
        const sidebarEl = document.getElementById('sidebar');
        const existingTree = sidebarEl.querySelector('ul');
        if (existingTree) {
          existingTree.remove();
        }
        const tree = createTree(processedData);
        sidebarEl.appendChild(tree);
        initExtensionFilter(data);
        selectFilesByExtensions();
      }
    })
    .catch(err => {
      console.error(err);
      showToast("Failed to scan directory.", "error");
    });
}

function refreshFileTree() {
  scanDirectory();
}

function handleSortChange(e) {
  currentSortMethod = e.target.value;
  refreshFileTree();
  showToast(`Sorted by: ${currentSortMethod}`, 'info');
}

function handleFilterChange(e) {
  currentFileFilter = e.target.value;
  refreshFileTree();
  showToast(`Filtered to show: ${currentFileFilter === 'all' ? 'all files' : '.' + currentFileFilter + ' files'}`, 'info');
}

function selectAll() {
  document.querySelectorAll('#sidebar li.file .tree-checkbox').forEach(cb => {
    if (!cb.checked) {
      cb.checked = true;
      const changeEvent = new Event('change');
      cb.dispatchEvent(changeEvent);
    }
  });
  showToast('All files selected', 'info');
}

function clearAll() {
  document.querySelectorAll('.tree-checkbox').forEach(cb => {
    if (cb.checked) {
      cb.checked = false;
      if (!cb.classList.contains('folder-checkbox')) {
        const changeEvent = new Event('change');
        cb.dispatchEvent(changeEvent);
      }
    }
  });
  selectedFiles = [];
  document.getElementById('content').innerHTML = '';
  showToast('All selections cleared', 'info');
}

async function refreshSelectedFiles() {
  const checkboxes = document.querySelectorAll('#sidebar li.file .tree-checkbox:checked');
  if (checkboxes.length === 0) {
    showToast("No files selected to refresh", "error");
    return;
  }

  document.getElementById('loading-spinner').classList.remove('hidden');
  let refreshedCount = 0;
  const processedFiles = new Set();

  for (const checkbox of checkboxes) {
    const li = checkbox.closest('li');
    const filePath = li.dataset.path;
    const fileName = filePath.split(/[\\/]/).pop();
    const loc = li.dataset.loc || 0;

    if (processedFiles.has(filePath)) continue;
    processedFiles.add(filePath);

    try {
      const response = await fetch(`/get-file-content?file=${encodeURIComponent(filePath)}&root=${encodeURIComponent(currentRootPath)}`);
      if (!response.ok) {
        throw new Error(`Server returned ${response.status} for ${fileName}`);
      }

      const data = await response.text();
      const block = document.querySelector(`.file-block[data-path="${CSS.escape(filePath)}"]`);
      if (block) {
        // Update existing block
        block.querySelector('pre code').textContent = escapeHTML(data);
        const textarea = block.querySelector('.full-edit textarea');
        if (textarea) textarea.value = data;
        refreshedCount++;
      } else {
        // Load new block
        const newBlock = document.createElement('div');
        newBlock.className = 'file-block slide-in';
        newBlock.dataset.path = filePath;
        newBlock.innerHTML = `
          <div class="file-header">
            <h2>${escapeHTML(fileName)} (${loc} LOC)</h2>
            <div class="file-actions">
              <button onclick="copyContent(this)">Copy</button>
              <button onclick="closeFile(this)">Close</button>
            </div>
          </div>
          <pre><code>${escapeHTML(data)}</code></pre>
          <div class="edit-controls">
            <div class="full-edit hidden">
              <textarea>${escapeHTML(data)}</textarea>
              <button onclick="saveFullEdit('${CSS.escape(filePath)}', this)">Save</button>
            </div>
            <div class="partial-edit hidden">
              <input type="text" placeholder="Find" class="find-text">
              <input type="text" placeholder="Replace" class="replace-text">
              <button onclick="savePartialEdit('${CSS.escape(filePath)}', this)">Apply</button>
            </div>
          </div>`;
        document.getElementById('content').appendChild(newBlock);
        newBlock.scrollIntoView({ behavior: 'smooth' });
        refreshedCount++;
      }
    } catch (error) {
      console.error(`Error refreshing ${fileName}:`, error);
      showToast(`Failed to refresh ${fileName}`, 'error');
    }
  }

  document.getElementById('loading-spinner').classList.add('hidden');
  if (refreshedCount > 0) {
    showToast(`Refreshed ${refreshedCount} file(s)`, 'success');
  } else {
    showToast('No files were refreshed', 'info');
  }
}

function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl+F for search
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      document.getElementById('searchInput').focus();
    }
    
    // Escape to clear search
    if (e.key === 'Escape') {
      document.getElementById('searchInput').value = '';
      searchTree();
    }
    
    // Ctrl+A to select all
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      selectAll();
    }
    
    // Ctrl+C to copy selected
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      copySelected();
    }
  });
}

function initBeforeUnloadCheck() {
  window.addEventListener('beforeunload', (e) => {
    const hasUnsavedEdits = Array.from(document.querySelectorAll('.full-edit textarea'))
      .some(textarea => {
        const original = textarea.closest('.file-block').querySelector('pre code')?.textContent;
        return textarea.value !== original;
      });
      
    if (hasUnsavedEdits) {
      e.preventDefault();
      e.returnValue = '';
      return 'You have unsaved changes. Are you sure you want to leave?';
    }
  });
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
  loadSelectedExtensions();
  initDarkMode();
  initResizer();
  initKeyboardShortcuts();
  initBeforeUnloadCheck();
  
  document.getElementById('clearAllBtn').addEventListener('click', clearAll);
  document.getElementById('copySelectedBtn').addEventListener('click', copySelected);
  document.getElementById('refreshSelectedBtn').addEventListener('click', refreshSelectedFiles);
  document.getElementById('expandAllBtn').addEventListener('click', expandAll);
  document.getElementById('scanDirectoryBtn').addEventListener('click', scanDirectory);
  document.getElementById('searchInput').addEventListener('input', searchTree);
  document.getElementById('sortSelect').addEventListener('change', handleSortChange);
  document.getElementById('filterSelect').addEventListener('change', handleFilterChange);
  
  fetch('/scan')
    .then(res => {
      if (!res.ok) throw new Error('Failed to scan directory');
      return res.json();
    })
    .then(data => {
      const tree = createTree(data);
      document.getElementById('sidebar').appendChild(tree);
      initExtensionFilter(data);
      selectFilesByExtensions();
      showToast('File tree loaded successfully', 'success');
    })
    .catch(error => {
      console.error('Error loading file tree:', error);
      showToast('Failed to load file tree', 'error');
    });
});