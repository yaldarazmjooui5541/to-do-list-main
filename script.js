document.addEventListener('DOMContentLoaded', () => {
    const todoForm = document.getElementById('todo-form');
    const taskInput = document.getElementById('task-input');
    const descriptionInput = document.getElementById('description-input');
    const deadlineInput = document.getElementById('deadline-input');
    const taskList = document.getElementById('task-list');
    const completedList = document.getElementById('completed-list');
    const toggleCompleted = document.getElementById('toggle-completed');
    const completedContainer = document.getElementById('completed-container');
    const noCompletedMessage = document.getElementById('no-completed-message');
    const noTasksMessage = document.getElementById('no-tasks-message');

    // Load tasks from localStorage
    loadTasks();

    // Add task event listener
    todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addTask();
    });

    // Toggle completed tasks
    toggleCompleted.addEventListener('click', () => {
        completedContainer.classList.toggle('collapsed');
        toggleCompleted.classList.toggle('rotated');
    });

    function updateVisibility() {
        const hasCompletedTasks = completedList.children.length > 0;
        const hasPendingTasks = taskList.children.length > 0;
        
        noCompletedMessage.classList.toggle('visible', !hasCompletedTasks);
        noTasksMessage.classList.toggle('visible', !hasPendingTasks);
        completedContainer.classList.toggle('collapsed', !hasCompletedTasks);
        toggleCompleted.classList.toggle('rotated', !hasCompletedTasks);
    }

    function formatDeadline(deadline) {
        if (!deadline) return '';
        const date = new Date(deadline);
        return date.toLocaleString();
    }

    function getDeadlineStatus(deadline) {
        if (!deadline) return '';
        const now = new Date();
        const deadlineDate = new Date(deadline);
        const diffHours = (deadlineDate - now) / (1000 * 60 * 60);

        if (diffHours < 0) return 'urgent';
        if (diffHours < 24) return 'warning';
        return '';
    }

    function addTask() {
        const taskText = taskInput.value.trim();
        const description = descriptionInput.value.trim();
        const deadline = deadlineInput.value;
        
        if (taskText === '') return;

        const taskItem = createTaskElement(taskText, description, deadline, false);
        taskList.appendChild(taskItem);
        sortTasks();

        // Clear inputs
        taskInput.value = '';
        descriptionInput.value = '';
        deadlineInput.value = '';
        
        // Save tasks
        saveTasks();
        updateVisibility();
    }

    function createTaskElement(taskText, description, deadline, isCompleted) {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item';
        taskElement.dataset.id = taskText;
        
        if (isCompleted) {
            taskElement.classList.add('completed');
        }
        
        function updateButtons(isCompleted) {
            const buttonsContainer = taskElement.querySelector('.task-buttons');
            buttonsContainer.innerHTML = isCompleted ? `
                <button class="restore-btn" title="Move back to pending">Restore</button>
                <button class="delete-btn" title="Delete task">Delete</button>
            ` : `
                <button class="edit-btn" title="Edit task">Edit</button>
                <button class="complete-btn" title="Mark as complete">Complete</button>
                <button class="delete-btn" title="Delete task">Delete</button>
            `;

            // Add event listeners to the new buttons
            const editBtn = buttonsContainer.querySelector('.edit-btn');
            const completeBtn = buttonsContainer.querySelector('.complete-btn');
            const restoreBtn = buttonsContainer.querySelector('.restore-btn');
            const deleteBtn = buttonsContainer.querySelector('.delete-btn');

            if (editBtn) {
                editBtn.addEventListener('click', () => {
                    startEditing(taskElement, taskText, description, deadline);
                });
            }

            if (completeBtn) {
                completeBtn.addEventListener('click', () => {
                    taskElement.classList.add('completed');
                    completedList.appendChild(taskElement);
                    updateButtons(true);
                    // Re-initialize toggle functionality after moving to completed
                    initializeToggleButton(taskElement);
                    saveTasks();
                    updateVisibility();
                    sortTasks(); // Sort tasks after moving to completed
                });
            }

            if (restoreBtn) {
                restoreBtn.addEventListener('click', () => {
                    taskElement.classList.remove('completed');
                    taskList.appendChild(taskElement); // Fixed: was 'pendingList', now 'taskList'
                    updateButtons(false);
                    // Re-initialize toggle functionality after restoring
                    initializeToggleButton(taskElement);
                    saveTasks();
                    updateVisibility();
                    sortTasks(); // Sort tasks after restoring
                });
            }

            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => {
                    taskElement.remove();
                    saveTasks();
                    updateVisibility();
                });
            }
        }

        taskElement.innerHTML = `
            <div class="task-main-row">
                <div class="task-title">${taskText}</div>
                <div class="task-deadline">${deadline ? formatDeadline(deadline) : 'No deadline'}</div>
                <button class="toggle-description-btn" title="Toggle description">
                    <span class="toggle-text">Show Description</span>
                    <span class="toggle-icon">▼</span>
                </button>
                <div class="task-buttons">
                    ${!isCompleted ? `
                        <button class="edit-btn" title="Edit task">Edit</button>
                        <button class="complete-btn" title="Mark as complete">Complete</button>
                    ` : `
                        <button class="restore-btn" title="Move back to pending">Restore</button>
                    `}
                    <button class="delete-btn" title="Delete task">Delete</button>
                </div>
            </div>
            <div class="task-description">${description || 'No description'}</div>
            <div class="edit-form">
                <div class="form-row title-deadline-row">
                    <input type="text" class="edit-title" value="${taskText}" placeholder="Task title">
                    <input type="datetime-local" class="edit-deadline" value="${deadline || ''}">
                </div>
                <textarea class="edit-description" placeholder="Task description">${description || ''}</textarea>
                <div class="edit-form-buttons">
                    <button type="submit" class="save-btn">Save Changes</button>
                    <button type="button" class="cancel-btn">Cancel</button>
                </div>
            </div>
        `;

        // Initialize toggle functionality
        initializeToggleButton(taskElement);

        // Initialize buttons with proper event listeners
        updateButtons(isCompleted);

        return taskElement;
    }

    function initializeToggleButton(taskElement) {
        const toggleBtn = taskElement.querySelector('.toggle-description-btn');
        const toggleText = toggleBtn.querySelector('.toggle-text');
        const toggleIcon = toggleBtn.querySelector('.toggle-icon');
        const descriptionElement = taskElement.querySelector('.task-description');
        
        // Remove existing event listeners by cloning the button
        const newToggleBtn = toggleBtn.cloneNode(true);
        toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);
        
        // Get references to the new elements
        const newToggleText = newToggleBtn.querySelector('.toggle-text');
        const newToggleIcon = newToggleBtn.querySelector('.toggle-icon');
        
        function updateToggleState(isVisible) {
            descriptionElement.classList.toggle('visible', isVisible);
            newToggleBtn.classList.toggle('rotated', isVisible);
            newToggleIcon.textContent = isVisible ? '▲' : '▼';
            newToggleText.textContent = isVisible ? 'Hide Description' : 'Show Description';
        }
        
        newToggleBtn.addEventListener('click', () => {
            const isVisible = !descriptionElement.classList.contains('visible');
            updateToggleState(isVisible);
        });
    }

    function startEditing(taskElement, currentText, currentDescription, currentDeadline) {
        taskElement.classList.add('editing');
        
        const editForm = taskElement.querySelector('.edit-form');
        editForm.classList.add('visible');
        
        const titleInput = editForm.querySelector('.edit-title');
        const descriptionInput = editForm.querySelector('.edit-description');
        const deadlineInput = editForm.querySelector('.edit-deadline');
        const saveBtn = editForm.querySelector('.save-btn');
        const cancelBtn = editForm.querySelector('.cancel-btn');

        // Set initial values
        titleInput.value = currentText;
        descriptionInput.value = currentDescription || '';
        deadlineInput.value = currentDeadline || '';

        // Remove any existing event listeners by cloning buttons
        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

        newSaveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const newText = titleInput.value.trim();
            const newDescription = descriptionInput.value.trim();
            const newDeadline = deadlineInput.value;
            
            if (newText) {
                try {
                    // Update task content
                    const taskContent = taskElement.querySelector('.task-main-row');
                    taskContent.querySelector('.task-title').textContent = newText;
                    
                    const descriptionElement = taskElement.querySelector('.task-description');
                    descriptionElement.textContent = newDescription || 'No description';
                    
                    const deadlineElement = taskElement.querySelector('.task-deadline');
                    deadlineElement.textContent = newDeadline ? formatDeadline(newDeadline) : 'No deadline';
                    
                    // Update dataset id
                    taskElement.dataset.id = newText;
                    
                    // Hide edit form
                    taskElement.classList.remove('editing');
                    editForm.classList.remove('visible');
                    
                    // Save and sort
                    saveTasks();
                    sortTasks();
                } catch (error) {
                    console.error('Error saving task:', error);
                    alert('Error saving task. Please try again.');
                }
            }
        });

        newCancelBtn.addEventListener('click', () => {
            taskElement.classList.remove('editing');
            editForm.classList.remove('visible');
        });
    }

    function sortTasks() {
        const tasks = Array.from(taskList.children);
        tasks.sort((a, b) => {
            const deadlineA = a.querySelector('.task-deadline').textContent;
            const deadlineB = b.querySelector('.task-deadline').textContent;
            
            // Handle 'No deadline' cases
            if (deadlineA === 'No deadline' && deadlineB === 'No deadline') return 0;
            if (deadlineA === 'No deadline') return 1;
            if (deadlineB === 'No deadline') return -1;
            
            // Compare actual dates
            const dateA = new Date(deadlineA);
            const dateB = new Date(deadlineB);
            return dateA - dateB;
        });

        tasks.forEach(task => taskList.appendChild(task));
    }

    function saveTasks() {
        const tasks = {
            pending: [],
            completed: []
        };

        // Save pending tasks
        document.querySelectorAll('#task-list .task-item').forEach(task => {
            const deadlineText = task.querySelector('.task-deadline').textContent;
            const deadline = deadlineText === 'No deadline' ? '' : deadlineText;
            
            tasks.pending.push({
                text: task.querySelector('.task-title').textContent,
                description: task.querySelector('.task-description').textContent === 'No description' ? '' : task.querySelector('.task-description').textContent,
                deadline: deadline
            });
        });

        // Save completed tasks
        document.querySelectorAll('#completed-list .task-item').forEach(task => {
            const deadlineText = task.querySelector('.task-deadline').textContent;
            const deadline = deadlineText === 'No deadline' ? '' : deadlineText;
            
            tasks.completed.push({
                text: task.querySelector('.task-title').textContent,
                description: task.querySelector('.task-description').textContent === 'No description' ? '' : task.querySelector('.task-description').textContent,
                deadline: deadline
            });
        });

        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function loadTasks() {
        const tasks = JSON.parse(localStorage.getItem('tasks')) || { pending: [], completed: [] };

        // Load pending tasks
        tasks.pending.forEach(task => {
            const taskItem = createTaskElement(task.text, task.description, task.deadline, false);
            taskList.appendChild(taskItem);
        });

        // Load completed tasks
        tasks.completed.forEach(task => {
            const taskItem = createTaskElement(task.text, task.description, task.deadline, true);
            completedList.appendChild(taskItem);
        });

        sortTasks();
        updateVisibility();
    }
});