class TodoApp {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('todoTasks')) || [];
        this.currentFilter = 'all';
        this.taskIdCounter = this.tasks.length > 0 ? Math.max(...this.tasks.map(t => t.id)) + 1 : 1;
        
        this.initializeElements();
        this.bindEvents();
        this.render();
    }

    initializeElements() {
        this.taskInput = document.getElementById('taskInput');
        this.addBtn = document.getElementById('addBtn');
        this.taskList = document.getElementById('taskList');
        this.emptyState = document.getElementById('emptyState');
        this.totalTasks = document.getElementById('totalTasks');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.clearCompletedBtn = document.getElementById('clearCompleted');
        this.markAllCompleteBtn = document.getElementById('markAllComplete');
    }

    bindEvents() {
        this.addBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());
        this.markAllCompleteBtn.addEventListener('click', () => this.markAllComplete());
    }

    addTask() {
        const text = this.taskInput.value.trim();
        if (!text) return;

        const task = {
            id: this.taskIdCounter++,
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.unshift(task);
        this.taskInput.value = '';
        this.saveToStorage();
        this.render();
        
        // Add a subtle animation
        setTimeout(() => {
            const newTaskElement = this.taskList.querySelector('.task-item');
            if (newTaskElement) {
                newTaskElement.style.transform = 'scale(1.02)';
                setTimeout(() => {
                    newTaskElement.style.transform = 'scale(1)';
                }, 200);
            }
        }, 100);
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveToStorage();
            this.render();
        }
    }

    deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveToStorage();
            this.render();
        }
    }

    editTask(id, newText) {
        const task = this.tasks.find(t => t.id === id);
        if (task && newText.trim()) {
            task.text = newText.trim();
            this.saveToStorage();
            this.render();
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        this.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.render();
    }

    clearCompleted() {
        if (confirm('Are you sure you want to delete all completed tasks?')) {
            this.tasks = this.tasks.filter(task => !task.completed);
            this.saveToStorage();
            this.render();
        }
    }

    markAllComplete() {
        const hasIncomplete = this.tasks.some(task => !task.completed);
        this.tasks.forEach(task => {
            task.completed = hasIncomplete;
        });
        this.saveToStorage();
        this.render();
    }

    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'active':
                return this.tasks.filter(task => !task.completed);
            case 'completed':
                return this.tasks.filter(task => task.completed);
            default:
                return this.tasks;
        }
    }

    saveToStorage() {
        localStorage.setItem('todoTasks', JSON.stringify(this.tasks));
    }

    createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.dataset.id = task.id;

        li.innerHTML = `
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="todoApp.toggleTask(${task.id})">
                ${task.completed ? '<i class="fas fa-check"></i>' : ''}
            </div>
            <div class="task-text ${task.completed ? 'completed' : ''}">${this.escapeHtml(task.text)}</div>
            <input type="text" class="edit-input" value="${this.escapeHtml(task.text)}">
            <div class="task-actions">
                <button class="task-btn edit-btn" onclick="todoApp.startEdit(${task.id})" title="Edit task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="task-btn delete-btn" onclick="todoApp.deleteTask(${task.id})" title="Delete task">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        return li;
    }

    startEdit(id) {
        const taskElement = document.querySelector(`[data-id="${id}"]`);
        const editInput = taskElement.querySelector('.edit-input');
        
        taskElement.classList.add('editing');
        editInput.focus();
        editInput.select();

        const finishEdit = () => {
            const newText = editInput.value.trim();
            if (newText) {
                this.editTask(id, newText);
            } else {
                taskElement.classList.remove('editing');
            }
        };

        const cancelEdit = () => {
            taskElement.classList.remove('editing');
            editInput.value = taskElement.querySelector('.task-text').textContent;
        };

        editInput.addEventListener('blur', finishEdit, { once: true });
        editInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                finishEdit();
            }
        }, { once: true });
        editInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                cancelEdit();
            }
        }, { once: true });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    updateStats() {
        const totalCount = this.tasks.length;
        const completedCount = this.tasks.filter(task => task.completed).length;
        const activeCount = totalCount - completedCount;

        this.totalTasks.textContent = totalCount;
        
        // Update bulk action buttons
        this.clearCompletedBtn.disabled = completedCount === 0;
        this.markAllCompleteBtn.textContent = activeCount === 0 ? 
            '✓ All Complete' : `Mark All Complete (${activeCount})`;
    }

    render() {
        const filteredTasks = this.getFilteredTasks();
        
        // Clear the task list
        this.taskList.innerHTML = '';
        
        // Show/hide empty state
        if (filteredTasks.length === 0) {
            this.emptyState.classList.remove('hidden');
            this.taskList.classList.add('hidden');
        } else {
            this.emptyState.classList.add('hidden');
            this.taskList.classList.remove('hidden');
            
            // Add tasks to the list
            filteredTasks.forEach(task => {
                const taskElement = this.createTaskElement(task);
                this.taskList.appendChild(taskElement);
            });
        }
        
        this.updateStats();
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.todoApp = new TodoApp();
});

// Add some keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + / to focus on input
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        document.getElementById('taskInput').focus();
    }
    
    // Ctrl/Cmd + A to mark all complete (when not in input)
    if ((e.ctrlKey || e.metaKey) && e.key === 'a' && document.activeElement !== document.getElementById('taskInput')) {
        e.preventDefault();
        window.todoApp.markAllComplete();
    }
}); 