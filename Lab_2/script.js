'use strict';

const STORAGE_KEY = 'todo-app.tasks';

let tasks = [];
let currentFilter = 'all';   // all | done | undone
let searchQuery = '';        // поиск по названию
let sortDirection = 'none';  // none | asc | desc
let editingId = null;        // id редактируемой задачи
let draggedId = null;        // id перетаскиваемой задачи

let listEl = null;
let emptyEl = null;
let titleInput = null;
let dateInput = null;

/* styles */
function injectStyles() {
  const style = document.createElement('style');
  style.id = 'todo-styles';
  style.textContent = `
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
      min-height: 100vh;
      padding: 24px 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #1f2937;
    }

    .app {
      max-width: 720px;
      margin: 0 auto;
      padding: 24px;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.18);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .app-header h1 { font-size: 1.6rem; text-align: center; }

    .task-form { display: flex; gap: 8px; flex-wrap: wrap; }

    .task-form__input {
      flex: 1 1 220px;
      min-width: 0;
      padding: 10px 12px;
      font-size: 1rem;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .task-form__date { flex: 0 1 170px; }

    .task-form__input:focus,
    .controls__search:focus,
    .controls__select:focus,
    .edit-input:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.25);
    }

    .task-form__btn {
      flex: 0 0 auto;
      padding: 10px 22px;
      font-size: 1rem;
      font-weight: 600;
      color: #ffffff;
      background: #667eea;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s, transform 0.1s;
    }
    .task-form__btn:hover { background: #5a67d8; }
    .task-form__btn:active { transform: scale(0.97); }

    .controls { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }

    .controls__search {
      flex: 1 1 200px;
      min-width: 0;
      padding: 8px 12px;
      font-size: 0.95rem;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      outline: none;
    }

    .controls__select {
      padding: 8px 12px;
      font-size: 0.95rem;
      background: #ffffff;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      outline: none;
      cursor: pointer;
    }

    .task-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }

    .task-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      transition: box-shadow 0.2s, border-color 0.2s, opacity 0.2s, background 0.2s;
    }
    .task-item:hover { box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08); }
    .task-item.dragging { opacity: 0.45; }
    .task-item.drag-over {
      border-color: #667eea;
      box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.35);
    }

    .task-item--done { background: #f0fdf4; border-color: #bbf7d0; }
    .task-item--done .task-item__title { text-decoration: line-through; color: #6b7280; }

    .task-item__handle {
      font-size: 1.15rem;
      color: #9ca3af;
      cursor: grab;
      user-select: none;
      flex-shrink: 0;
    }

    .task-item__check {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      cursor: pointer;
      accent-color: #22c55e;
    }

    .task-item__content {
      flex: 1 1 auto;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .task-item__title { font-weight: 600; word-break: break-word; }
    .task-item__date { font-size: 0.85rem; color: #6b7280; }

    .task-item__actions { display: flex; gap: 4px; flex-shrink: 0; }

    .icon-btn {
      padding: 4px 7px;
      font-size: 1rem;
      line-height: 1;
      background: transparent;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .icon-btn:hover { background: #e5e7eb; }

    .edit-input {
      width: 100%;
      padding: 7px 10px;
      font-size: 0.95rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      outline: none;
    }

    .empty { padding: 24px; text-align: center; color: #9ca3af; }

    @media (max-width: 560px) {
      body { padding: 16px 10px; }
      .app { padding: 16px; border-radius: 12px; }
      .task-form__input,
      .task-form__date,
      .task-form__btn { flex: 1 1 100%; }
      .controls__search,
      .controls__select { flex: 1 1 100%; }
      .app-header h1 { font-size: 1.35rem; }
    }
  `;
  document.head.append(style);
}

/* storage */
function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    tasks = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(tasks)) tasks = [];
  } catch (err) {
    tasks = [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.warn('Не удалось сохранить задачи', err);
  }
}

/* utilities */
function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

function formatDate(iso) {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  return parts[2] + '.' + parts[1] + '.' + parts[0];
}

function buildApp() {
  const app = document.createElement('div');
  app.className = 'app';

  /* header */
  const header = document.createElement('header');
  header.className = 'app-header';
  const h1 = document.createElement('h1');
  h1.textContent = 'Мои задачи';
  header.append(h1);

  const form = document.createElement('form');
  form.className = 'task-form';

  titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.className = 'task-form__input';
  titleInput.placeholder = 'Что нужно сделать?';
  titleInput.setAttribute('aria-label', 'Название задачи');
  titleInput.required = true;

  dateInput = document.createElement('input');
  dateInput.type = 'date';
  dateInput.className = 'task-form__input task-form__date';
  dateInput.setAttribute('aria-label', 'Дата задачи');

  const addBtn = document.createElement('button');
  addBtn.type = 'submit';
  addBtn.className = 'task-form__btn';
  addBtn.textContent = 'Добавить';

  form.append(titleInput, dateInput, addBtn);

  const controls = document.createElement('div');
  controls.className = 'controls';

  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.className = 'controls__search';
  searchInput.placeholder = 'Поиск по названию…';
  searchInput.setAttribute('aria-label', 'Поиск задач');

  const filterSelect = document.createElement('select');
  filterSelect.className = 'controls__select';
  filterSelect.setAttribute('aria-label', 'Фильтр по статусу');
  [
    { value: 'all', label: 'Все задачи' },
    { value: 'done', label: 'Выполненные' },
    { value: 'undone', label: 'Невыполненные' }
  ].forEach(function (opt) {
    const o = document.createElement('option');
    o.value = opt.value;
    o.textContent = opt.label;
    filterSelect.append(o);
  });

  const sortSelect = document.createElement('select');
  sortSelect.className = 'controls__select';
  sortSelect.setAttribute('aria-label', 'Сортировка по дате');
  [
    { value: 'none', label: 'Без сортировки' },
    { value: 'asc', label: 'По дате ↑' },
    { value: 'desc', label: 'По дате ↓' }
  ].forEach(function (opt) {
    const o = document.createElement('option');
    o.value = opt.value;
    o.textContent = opt.label;
    sortSelect.append(o);
  });

  controls.append(searchInput, filterSelect, sortSelect);

  listEl = document.createElement('ul');
  listEl.className = 'task-list';
  listEl.setAttribute('aria-label', 'Список задач');

  emptyEl = document.createElement('p');
  emptyEl.className = 'empty';
  emptyEl.textContent = 'Задач пока нет — добавьте первую!';

  app.append(header, form, controls, listEl, emptyEl);
  document.body.append(app);

  form.addEventListener('submit', handleAdd);

  searchInput.addEventListener('input', function () {
    searchQuery = searchInput.value;
    render();
  });

  filterSelect.addEventListener('change', function () {
    currentFilter = filterSelect.value;
    render();
  });

  sortSelect.addEventListener('change', function () {
    sortDirection = sortSelect.value;
    render();
  });
}

/* add, push and etc. */
function handleAdd(event) {
  event.preventDefault();
  const title = titleInput.value.trim();
  if (!title) {
    titleInput.focus();
    return;
  }

  tasks.push({
    id: generateId(),
    title: title,
    date: dateInput.value || '',
    done: false
  });

  titleInput.value = '';
  dateInput.value = '';

  saveTasks();
  render();
  titleInput.focus();
}

function deleteTask(id) {
  tasks = tasks.filter(function (t) { return t.id !== id; });
  if (editingId === id) editingId = null;
  saveTasks();
  render();
}

/* filter, search, sort */
function getVisibleTasks() {
  let result = tasks.slice();

  if (currentFilter === 'done') {
    result = result.filter(function (t) { return t.done; });
  } else if (currentFilter === 'undone') {
    result = result.filter(function (t) { return !t.done; });
  }

  const q = searchQuery.trim().toLowerCase();
  if (q) {
    result = result.filter(function (t) {
      return t.title.toLowerCase().includes(q);
    });
  }

  if (sortDirection === 'asc') {
    result.sort(function (a, b) {
      return (a.date || '9999-99-99').localeCompare(b.date || '9999-99-99');
    });
  } else if (sortDirection === 'desc') {
    result.sort(function (a, b) {
      return (b.date || '').localeCompare(a.date || '');
    });
  }

  return result;
}

/* render-tender */
function render() {
  const visible = getVisibleTasks();

  listEl.replaceChildren();
  visible.forEach(function (task) {
    listEl.append(createTaskElement(task));
  });

  if (visible.length === 0) {
    emptyEl.style.display = '';
    emptyEl.textContent = tasks.length === 0
      ? 'Задач пока нет — добавьте первую!'
      : 'Ничего не найдено по заданным условиям.';
  } else {
    emptyEl.style.display = 'none';
  }
}

function createTaskElement(task) {
  const li = document.createElement('li');
  li.className = 'task-item';
  li.dataset.id = task.id;

  if (task.done) li.classList.add('task-item--done');

  /* redact type */
  if (task.id === editingId) {
    li.classList.add('task-item--editing');
    const parts = buildEditView(task);
    li.append(parts.content, parts.actions);
    return li;
  }

  /* default type */
  li.draggable = true;

  const handle = document.createElement('span');
  handle.className = 'task-item__handle';
  handle.textContent = '⠿';
  handle.setAttribute('aria-hidden', 'true');
  handle.title = 'Перетащите, чтобы изменить порядок';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'task-item__check';
  checkbox.checked = task.done;
  checkbox.setAttribute('aria-label', 'Отметить как выполненную');
  checkbox.addEventListener('change', function () {
    task.done = checkbox.checked;
    saveTasks();
    render();
  });

  const content = document.createElement('div');
  content.className = 'task-item__content';

  const title = document.createElement('span');
  title.className = 'task-item__title';
  title.textContent = task.title;
  content.append(title);

  if (task.date) {
    const date = document.createElement('span');
    date.className = 'task-item__date';
    date.textContent = formatDate(task.date);
    content.append(date);
  }

  const actions = document.createElement('div');
  actions.className = 'task-item__actions';

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'icon-btn';
  editBtn.textContent = '✏️';
  editBtn.title = 'Редактировать';
  editBtn.setAttribute('aria-label', 'Редактировать задачу');
  editBtn.addEventListener('click', function () {
    editingId = task.id;
    render();
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'icon-btn';
  deleteBtn.textContent = '🗑️';
  deleteBtn.title = 'Удалить';
  deleteBtn.setAttribute('aria-label', 'Удалить задачу');
  deleteBtn.addEventListener('click', function () {
    deleteTask(task.id);
  });

  actions.append(editBtn, deleteBtn);

  li.append(handle, checkbox, content, actions);

  /* --- drag and drop --- */
  li.addEventListener('dragstart', function (e) { handleDragStart(e, task, li); });
  li.addEventListener('dragend', function () { handleDragEnd(li); });
  li.addEventListener('dragover', function (e) { handleDragOver(e, li); });
  li.addEventListener('dragleave', function () { li.classList.remove('drag-over'); });
  li.addEventListener('drop', function (e) { handleDrop(e, task); });

  return li;
}

/* For redact */
function buildEditView(task) {
  const content = document.createElement('div');
  content.className = 'task-item__content';

  const editTitle = document.createElement('input');
  editTitle.type = 'text';
  editTitle.className = 'edit-input';
  editTitle.value = task.title;
  editTitle.setAttribute('aria-label', 'Название задачи');

  const editDate = document.createElement('input');
  editDate.type = 'date';
  editDate.className = 'edit-input';
  editDate.value = task.date || '';
  editDate.setAttribute('aria-label', 'Дата задачи');

  content.append(editTitle, editDate);

  const actions = document.createElement('div');
  actions.className = 'task-item__actions';

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'icon-btn';
  saveBtn.textContent = '💾';
  saveBtn.title = 'Сохранить';
  saveBtn.setAttribute('aria-label', 'Сохранить изменения');

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'icon-btn';
  cancelBtn.textContent = '✖️';
  cancelBtn.title = 'Отмена';
  cancelBtn.setAttribute('aria-label', 'Отменить редактирование');

  function save() {
    const newTitle = editTitle.value.trim();
    if (!newTitle) {
      editTitle.focus();
      return;
    }
    task.title = newTitle;
    task.date = editDate.value || '';
    editingId = null;
    saveTasks();
    render();
  }

  function cancel() {
    editingId = null;
    render();
  }

  saveBtn.addEventListener('click', save);
  cancelBtn.addEventListener('click', cancel);

  editTitle.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); save(); }
    if (e.key === 'Escape') { cancel(); }
  });
  editDate.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); save(); }
    if (e.key === 'Escape') { cancel(); }
  });

  actions.append(saveBtn, cancelBtn);

  setTimeout(function () { editTitle.focus(); }, 0);

  return { content: content, actions: actions };
}


/* hold(em) and drug(s) */
function handleDragStart(event, task, li) {
  draggedId = task.id;
  li.classList.add('dragging');
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    try { event.dataTransfer.setData('text/plain', task.id); } catch (err) {}
  }
}

function handleDragEnd(li) {
  li.classList.remove('dragging');
  draggedId = null;
  document.querySelectorAll('.task-item.drag-over').forEach(function (el) {
    el.classList.remove('drag-over');
  });
}

function handleDragOver(event, li) {
  if (!draggedId) return;
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  li.classList.add('drag-over');
}

function handleDrop(event, targetTask) {
  event.preventDefault();
  event.currentTarget.classList.remove('drag-over');

  if (!draggedId || draggedId === targetTask.id) return;

  const fromIdx = tasks.findIndex(function (t) { return t.id === draggedId; });
  const toIdx = tasks.findIndex(function (t) { return t.id === targetTask.id; });
  if (fromIdx === -1 || toIdx === -1) return;

  const moved = tasks.splice(fromIdx, 1)[0];
  tasks.splice(toIdx, 0, moved);

  draggedId = null;
  saveTasks();
  render();
}


injectStyles();
loadTasks();
buildApp();
render();