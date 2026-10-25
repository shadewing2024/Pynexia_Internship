/**
         * TaskFlow Productivity Web Application
         * ES6+ JavaScript implementation with dual section dropzones and robust localStorage state persistence.
         */

        // Theme Keys
        const THEME_STORAGE_KEY = 'taskflow_theme';

        // State Management
        let tasks = [];
        let currentStatusFilter = 'all';
        let currentCategoryFilter = 'all';
        let currentPriorityFilter = 'all';
        let searchQuery = '';
        let pendingDeleteTaskId = null;
        let isClearingCompleted = false;
        let syncBadgeTimeout = null;

        // Category & Priority Color Configurations
        const CATEGORY_STYLES = {
            'Work': 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-900',
            'Personal': 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-900',
            'Study': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
            'Other': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/80 dark:text-cyan-300 border-cyan-200 dark:border-cyan-900',
        };

        const PRIORITY_STYLES = {
            'High': 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900',
            'Medium': 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
            'Low': 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900'
        };

        // DOM Element Cache
        const syncBadge = document.getElementById('syncBadge');
        const taskForm = document.getElementById('taskForm');
        const taskTitle = document.getElementById('taskTitle');
        const taskCategory = document.getElementById('taskCategory');
        const taskPriority = document.getElementById('taskPriority');
        const taskDueDate = document.getElementById('taskDueDate');
        const taskDescription = document.getElementById('taskDescription');

        const activeDropZone = document.getElementById('activeDropZone');
        const completedDropZone = document.getElementById('completedDropZone');
        const activeSectionWrapper = document.getElementById('activeSectionWrapper');
        const completedSectionWrapper = document.getElementById('completedSectionWrapper');

        const activeCountBadge = document.getElementById('activeCountBadge');
        const completedCountBadge = document.getElementById('completedCountBadge');

        const searchInput = document.getElementById('searchInput');
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        const statusTabs = document.querySelectorAll('.status-tab');
        const filterCategory = document.getElementById('filterCategory');
        const filterPriority = document.getElementById('filterPriority');
        const clearCompletedBtn = document.getElementById('clearCompletedBtn');

        const statTotal = document.getElementById('statTotal');
        const statActive = document.getElementById('statActive');
        const statCompleted = document.getElementById('statCompleted');
        const statPercentage = document.getElementById('statPercentage');
        const progressBar = document.getElementById('progressBar');

        const themeToggleBtn = document.getElementById('themeToggleBtn');
        const themeIcon = document.getElementById('themeIcon');
        const seedDataBtn = document.getElementById('seedDataBtn');

        // Modals
        const editModal = document.getElementById('editModal');
        const editModalCard = document.getElementById('editModalCard');
        const editTaskForm = document.getElementById('editTaskForm');
        const closeEditModalBtn = document.getElementById('closeEditModalBtn');
        const cancelEditBtn = document.getElementById('cancelEditBtn');

        const confirmModal = document.getElementById('confirmModal');
        const confirmModalCard = document.getElementById('confirmModalCard');
        const confirmTitle = document.getElementById('confirmTitle');
        const confirmMessage = document.getElementById('confirmMessage');
        const confirmCancelBtn = document.getElementById('confirmCancelBtn');
        const confirmActionBtn = document.getElementById('confirmActionBtn');

        // Audio Effects Synthesizer
        function playChime(type = 'complete') {
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);

                if (type === 'complete') {
                    osc.frequency.setValueAtTime(523.25, ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15);
                    gain.gain.setValueAtTime(0.1, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.3);
                } else if (type === 'reactivate') {
                    osc.frequency.setValueAtTime(440, ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(349.23, ctx.currentTime + 0.15);
                    gain.gain.setValueAtTime(0.1, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.25);
                } else if (type === 'delete') {
                    osc.frequency.setValueAtTime(300, ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.15);
                    gain.gain.setValueAtTime(0.1, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.2);
                }
            } catch (e) {
                // Audio Context unavailable
            }
        }

        // --- Visual Persistence Indicator ---
        function triggerSyncAnimation() {
            if (syncBadge) {
                syncBadge.classList.remove('hidden');
                syncBadge.classList.add('scale-105', 'ring-2', 'ring-emerald-500/50');
                if (syncBadgeTimeout) clearTimeout(syncBadgeTimeout);
                syncBadgeTimeout = setTimeout(() => {
                    syncBadge.classList.remove('scale-105', 'ring-2', 'ring-emerald-500/50');
                }, 400);
            }
        }

        // --- Theme Handler ---
        function initTheme() {
            const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
            if (savedTheme === 'light') {
                document.documentElement.classList.remove('dark');
                themeIcon.className = 'fa-solid fa-sun text-amber-500';
            } else {
                document.documentElement.classList.add('dark');
                themeIcon.className = 'fa-solid fa-moon';
            }
        }

        themeToggleBtn.addEventListener('click', () => {
            const isDark = document.documentElement.classList.toggle('dark');
            localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
            themeIcon.className = isDark ? 'fa-solid fa-moon' : 'fa-solid fa-sun text-amber-500';
            triggerSyncAnimation();
        });

        // --- Toast System ---
        function showToast(message, type = 'info') {
            const container = document.getElementById('toastContainer');
            const toast = document.createElement('div');
            
            let bgClass = 'bg-slate-900 text-white border-slate-800';
            let iconClass = 'fa-circle-info text-brand-400';

            if (type === 'success') {
                bgClass = 'bg-emerald-900/90 text-emerald-100 border-emerald-700/50';
                iconClass = 'fa-circle-check text-emerald-400';
            } else if (type === 'error') {
                bgClass = 'bg-red-900/90 text-red-100 border-red-700/50';
                iconClass = 'fa-circle-exclamation text-red-400';
            }

            toast.className = `toast-enter pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold backdrop-blur-md ${bgClass}`;
            toast.innerHTML = `<i class="fa-solid ${iconClass} text-base"></i><span>${escapeHTML(message)}</span>`;

            container.appendChild(toast);

            setTimeout(() => {
                toast.classList.remove('toast-enter');
                toast.classList.add('toast-exit');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }

        // --- HTML Sanitization Guard ---
        function escapeHTML(str) {
            return str ? str.replace(/[&<>'"]/g, 
                tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
            ) : '';
        }

        // --- Dashboard Update Functions ---
        function updateDashboardStats() {
            const total = tasks.length;
            const completed = tasks.filter(t => t.completed).length;
            const active = total - completed;
            const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

            statTotal.textContent = total;
            statActive.textContent = active;
            statCompleted.textContent = completed;
            statPercentage.textContent = `${percentage}%`;
            progressBar.style.width = `${percentage}%`;
        }

        function filterTasks() {
            return tasks.filter(task => {
                // Category Filter
                if (currentCategoryFilter !== 'all' && task.category !== currentCategoryFilter) return false;

                // Priority Filter
                if (currentPriorityFilter !== 'all' && task.priority !== currentPriorityFilter) return false;

                // Search Query Filter
                if (searchQuery.trim() !== '') {
                    const q = searchQuery.toLowerCase();
                    const titleMatch = task.title.toLowerCase().includes(q);
                    const descMatch = task.description && task.description.toLowerCase().includes(q);
                    if (!titleMatch && !descMatch) return false;
                }

                return true;
            });
        }

        function renderTaskCardHTML(task) {
            const categoryClass = CATEGORY_STYLES[task.category] || 'bg-slate-100 text-slate-700';
            const priorityClass = PRIORITY_STYLES[task.priority] || 'text-slate-600';
            
            let formattedDate = '';
            let isOverdue = false;
            if (task.dueDate) {
                const dateObj = new Date(task.dueDate + 'T00:00:00');
                formattedDate = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                
                const today = new Date();
                today.setHours(0,0,0,0);
                if (dateObj < today && !task.completed) {
                    isOverdue = true;
                }
            }

            return `
                <div data-id="${task.id}" draggable="true" 
                     class="task-card group glass rounded-2xl p-4 transition-all duration-200 hover:shadow-md border ${task.completed ? 'opacity-70 bg-slate-100/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800/50 completed' : 'border-slate-200/80 dark:border-slate-800/80'} flex items-start gap-3 relative">
                    
                    <!-- Drag Handle -->
                    <div class="cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-700 hover:text-slate-500 pt-1 px-0.5">
                        <i class="fa-solid fa-grip-vertical text-sm"></i>
                    </div>

                    <!-- Checkbox -->
                    <div class="pt-0.5">
                        <button onclick="toggleTaskCompletion('${task.id}')" 
                                class="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 dark:border-slate-700 hover:border-brand-500'}">
                            ${task.completed ? '<i class="fa-solid fa-check text-[10px]"></i>' : ''}
                        </button>
                    </div>

                    <!-- Main Content Block -->
                    <div class="flex-grow min-w-0 pr-1">
                        <div class="flex items-center gap-2 flex-wrap mb-1">
                            <span class="task-title-strikethrough font-semibold text-sm text-slate-800 dark:text-slate-100 break-words">
                                ${escapeHTML(task.title)}
                            </span>
                        </div>

                        ${task.description ? `<p class="text-xs text-slate-500 dark:text-slate-400 mb-2 line-clamp-2">${escapeHTML(task.description)}</p>` : ''}

                        <!-- Badges & Due Date -->
                        <div class="flex items-center gap-1.5 flex-wrap text-[10px] font-semibold pt-1">
                            <span class="px-2 py-0.5 rounded-md border ${categoryClass}">
                                ${task.category}
                            </span>

                            <span class="px-1.5 py-0.5 rounded-md border flex items-center gap-1 ${priorityClass}">
                                <i class="fa-solid fa-circle text-[5px]"></i>
                                ${task.priority}
                            </span>

                            ${task.dueDate ? `
                                <span class="flex items-center gap-1 px-1.5 py-0.5 rounded-md border ${isOverdue ? 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400 border-red-200 dark:border-red-900 font-bold' : 'text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800'}">
                                    <i class="fa-regular fa-calendar"></i>
                                    ${formattedDate} ${isOverdue ? '(Overdue)' : ''}
                                </span>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="openEditModal('${task.id}')" title="Edit Task" class="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                            <i class="fa-solid fa-pen text-xs"></i>
                        </button>
                        <button onclick="promptDeleteTask('${task.id}')" title="Delete Task" class="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all">
                            <i class="fa-solid fa-trash text-xs"></i>
                        </button>
                    </div>
                </div>
            `;
        }

        function renderTasks() {
            updateDashboardStats();
            const filteredTasks = filterTasks();

            // Toggle visibility of section containers based on top status tabs
            if (currentStatusFilter === 'active') {
                activeSectionWrapper.classList.remove('hidden');
                completedSectionWrapper.classList.add('hidden');
            } else if (currentStatusFilter === 'completed') {
                activeSectionWrapper.classList.add('hidden');
                completedSectionWrapper.classList.remove('hidden');
            } else {
                activeSectionWrapper.classList.remove('hidden');
                completedSectionWrapper.classList.remove('hidden');
            }

            const activeTasks = filteredTasks.filter(t => !t.completed);
            const completedTasks = filteredTasks.filter(t => t.completed);

            activeCountBadge.textContent = activeTasks.length;
            completedCountBadge.textContent = completedTasks.length;

            // Render Active Tasks
            if (activeTasks.length === 0) {
                activeDropZone.innerHTML = `
                    <div class="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
                        <i class="fa-solid fa-inbox text-2xl mb-2 text-slate-300 dark:text-slate-700"></i>
                        <p class="text-xs font-semibold">No active tasks</p>
                        <p class="text-[11px] text-slate-400 mt-0.5">Drag tasks here or create a new one</p>
                    </div>
                `;
            } else {
                activeDropZone.innerHTML = activeTasks.map(renderTaskCardHTML).join('');
            }

            // Render Completed Tasks
            if (completedTasks.length === 0) {
                completedDropZone.innerHTML = `
                    <div class="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
                        <i class="fa-solid fa-circle-check text-2xl mb-2 text-slate-300 dark:text-slate-700"></i>
                        <p class="text-xs font-semibold">No completed tasks</p>
                        <p class="text-[11px] text-slate-400 mt-0.5">Drag completed tasks into this zone</p>
                    </div>
                `;
            } else {
                completedDropZone.innerHTML = completedTasks.map(renderTaskCardHTML).join('');
            }

            attachDragAndDropHandlers();
        }

        // // --- Task CRUD Operations ---

        
        // --- Express API ---
        const API_URL = '/api/tasks';

        function normalizeTask(task) {
            return {
                ...task,
                id: task._id || task.id,
                completed: task.status === 'completed' || task.completed === true,
                dueDate: task.dueDate
                    ? String(task.dueDate).slice(0, 10)
                    : '',
                description: task.description || ''
            };
        }

        async function apiRequest(path = '', options = {}) {
            const response = await fetch(`${API_URL}${path}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...(options.headers || {})
                }
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }

            triggerSyncAnimation();
            return data;
        }

        async function loadTasksFromAPI() {
            try {
                const data = await apiRequest();
                const records = Array.isArray(data)
                    ? data
                    : (data.tasks || data.data || []);

                tasks = records.map(normalizeTask);
                renderTasks();
            } catch (error) {
                console.error(error);
                showToast(`Tasks load nahi huay: ${error.message}`, 'error');
            }
        }

        async function updateTaskOnAPI(id, changes) {
            const data = await apiRequest(`/${encodeURIComponent(id)}`, {
                method: 'PATCH',
                body: JSON.stringify(changes)
            });

            return normalizeTask(data.task || data);
        }

        // Create Task
        taskForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const title = taskTitle.value.trim();
            if (!title) return;

            try {
                const data = await apiRequest('', {
                    method: 'POST',
                    body: JSON.stringify({
                        title,
                        category: ['Work', 'Personal', 'Study', 'Other']
                            .includes(taskCategory.value)
                            ? taskCategory.value : 'Other',
                        priority: taskPriority.value,
                        dueDate: taskDueDate.value || null,
                        description: taskDescription.value.trim(),
                        status: 'pending'
                    })
                });

                tasks.unshift(normalizeTask(data.task || data));
                renderTasks();

                taskForm.reset();
                taskTitle.focus();
                showToast('Task added successfully!', 'success');
            } catch (error) {
                showToast(error.message, 'error');
            }
        });

        // Toggle completion
        window.toggleTaskCompletion = async function(id) {
            const task = tasks.find(t => t.id === id);
            if (!task) return;

            const completed = !task.completed;

            try {
                const updated = await updateTaskOnAPI(id, {
                    status: completed ? 'completed' : 'pending'
                });

                tasks = tasks.map(t => t.id === id ? updated : t);
                renderTasks();
                playChime(completed ? 'complete' : 'reactivate');
            } catch (error) {
                showToast(error.message, 'error');
            }
        };

        // Open edit modal
        window.openEditModal = function(id) {
            const task = tasks.find(t => t.id === id);
            if (!task) return;

            document.getElementById('editTaskId').value = task.id;
            document.getElementById('editTaskTitle').value = task.title;
            document.getElementById('editTaskCategory').value = task.category;
            document.getElementById('editTaskPriority').value = task.priority;
            document.getElementById('editTaskDueDate').value = task.dueDate;
            document.getElementById('editTaskDescription').value = task.description;

            editModal.classList.remove('hidden');
            setTimeout(() => {
                editModal.classList.remove('opacity-0');
                editModalCard.classList.remove('scale-95');
                editModalCard.classList.add('scale-100');
            }, 10);
        };

        function closeEditModal() {
            editModal.classList.add('opacity-0');
            editModalCard.classList.remove('scale-100');
            editModalCard.classList.add('scale-95');

            setTimeout(() => editModal.classList.add('hidden'), 200);
        }

        closeEditModalBtn.addEventListener('click', closeEditModal);
        cancelEditBtn.addEventListener('click', closeEditModal);

        // Save edited task
        editTaskForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const id = document.getElementById('editTaskId').value;

            try {
                const updated = await updateTaskOnAPI(id, {
                    title: document.getElementById('editTaskTitle').value.trim(),
                    category: ['Work', 'Personal', 'Study', 'Other']
                        .includes(document.getElementById('editTaskCategory').value)
                        ? document.getElementById('editTaskCategory').value
                        : 'Other',
                    priority: document.getElementById('editTaskPriority').value,
                    dueDate: document.getElementById('editTaskDueDate').value || null,
                    description: document.getElementById('editTaskDescription').value.trim()
                });

                tasks = tasks.map(t => t.id === id ? updated : t);
                renderTasks();
                closeEditModal();
                showToast('Task updated!', 'success');
            } catch (error) {
                showToast(error.message, 'error');
            }
        });

        // Delete confirmation
        window.promptDeleteTask = function(id) {
            pendingDeleteTaskId = id;
            isClearingCompleted = false;

            confirmTitle.textContent = 'Delete Task?';
            confirmMessage.textContent =
                'Are you sure you want to delete this task? This action cannot be undone.';
            confirmActionBtn.textContent = 'Delete';

            confirmModal.classList.remove('hidden');
            setTimeout(() => {
                confirmModal.classList.remove('opacity-0');
                confirmModalCard.classList.remove('scale-95');
                confirmModalCard.classList.add('scale-100');
            }, 10);
        };

        // Clear completed tasks confirmation
        clearCompletedBtn.addEventListener('click', () => {
            const count = tasks.filter(t => t.completed).length;

            if (!count) {
                showToast('No completed tasks to clear.', 'info');
                return;
            }

            isClearingCompleted = true;
            confirmTitle.textContent = 'Clear Completed Tasks?';
            confirmMessage.textContent =
                `Are you sure you want to permanently delete all ${count} completed tasks?`;
            confirmActionBtn.textContent = 'Clear All';

            confirmModal.classList.remove('hidden');
            setTimeout(() => {
                confirmModal.classList.remove('opacity-0');
                confirmModalCard.classList.remove('scale-95');
                confirmModalCard.classList.add('scale-100');
            }, 10);
        });

        function closeConfirmModal() {
            confirmModal.classList.add('opacity-0');
            confirmModalCard.classList.remove('scale-100');
            confirmModalCard.classList.add('scale-95');

            setTimeout(() => {
                confirmModal.classList.add('hidden');
                pendingDeleteTaskId = null;
                isClearingCompleted = false;
            }, 200);
        }

        confirmCancelBtn.addEventListener('click', closeConfirmModal);

        // Delete through Express API
        confirmActionBtn.addEventListener('click', async () => {
            try {
                if (isClearingCompleted) {
                    const completed = tasks.filter(t => t.completed);

                    await Promise.all(completed.map(t =>
                        apiRequest(`/${encodeURIComponent(t.id)}`, {
                            method: 'DELETE'
                        })
                    ));

                    tasks = tasks.filter(t => !t.completed);
                    showToast('Cleared completed tasks!', 'success');
                } else if (pendingDeleteTaskId) {
                    const id = pendingDeleteTaskId;

                    await apiRequest(`/${encodeURIComponent(id)}`, {
                        method: 'DELETE'
                    });

                    tasks = tasks.filter(t => t.id !== id);
                    showToast('Task deleted!', 'success');
                }

                playChime('delete');
                renderTasks();
            } catch (error) {
                showToast(error.message, 'error');
            } finally {
                closeConfirmModal();
            }
        });


        // --- Search & Filters ---
        statusTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                statusTabs.forEach(t => {
                    t.className = 'status-tab flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-all';
                });
                tab.className = 'status-tab flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm';
                
                currentStatusFilter = tab.getAttribute('data-status');
                renderTasks();
            });
        });

        filterCategory.addEventListener('change', (e) => {
            currentCategoryFilter = e.target.value;
            renderTasks();
        });

        filterPriority.addEventListener('change', (e) => {
            currentPriorityFilter = e.target.value;
            renderTasks();
        });

        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            clearSearchBtn.classList.toggle('hidden', searchQuery === '');
            renderTasks();
        });

        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchQuery = '';
            clearSearchBtn.classList.add('hidden');
            renderTasks();
        });
        
        // --- Cross-Section & Intra-Section Drag and Drop Handler ---
        let draggedTaskId = null;

        function attachDragAndDropHandlers() {
            const cards = document.querySelectorAll('.task-card');
            const dropZones = [activeDropZone, completedDropZone];

            cards.forEach(card => {
                card.addEventListener('dragstart', (e) => {
                    draggedTaskId = card.getAttribute('data-id');

                    card.classList.add('dragging');
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', draggedTaskId);
                });

                card.addEventListener('dragend', () => {
                    document.querySelectorAll('.task-card').forEach(c => {
                        c.classList.remove('dragging', 'drag-over-card');
                    });

                    dropZones.forEach(zone => {
                        zone.classList.remove('drop-zone-active');
                    });

                    draggedTaskId = null;
                });

                card.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    card.classList.add('drag-over-card');
                });

                card.addEventListener('dragleave', () => {
                    card.classList.remove('drag-over-card');
                });
            });

            dropZones.forEach(zone => {
                zone.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    zone.classList.add('drop-zone-active');
                });

                zone.addEventListener('dragleave', (e) => {
                    if (!zone.contains(e.relatedTarget)) {
                        zone.classList.remove('drop-zone-active');
                    }
                });

                zone.addEventListener('drop', async (e) => {
                    e.preventDefault();
                    zone.classList.remove('drop-zone-active');

                    if (!draggedTaskId) return;

                    const targetStatus = zone.getAttribute('data-zone-status');
                    const isTargetCompleted = targetStatus === 'completed';

                    const draggedTask = tasks.find(
                        task => String(task.id) === String(draggedTaskId)
                    );

                    if (!draggedTask) return;

                    // Sirf status change hone par MongoDB ko request bhejo.
                    if (draggedTask.completed !== isTargetCompleted) {
                        const previousStatus = draggedTask.completed;

                        // UI ko foran update karo.
                        draggedTask.completed = isTargetCompleted;
                        renderTasks();

                        try {
                            await updateTaskOnAPI(draggedTask.id, {
                                status: isTargetCompleted ? 'completed' : 'pending'
                            });

                            playChime(isTargetCompleted ? 'complete' : 'reactivate');
                            showToast(
                                `Task moved to ${isTargetCompleted ? 'Completed' : 'Active'}!`,
                                'success'
                            );
                        } catch (error) {
                            // API fail ho to purana status restore karo.
                            const currentTask = tasks.find(
                                task => String(task.id) === String(draggedTaskId)
                            );

                            if (currentTask) {
                                currentTask.completed = previousStatus;
                            }

                            renderTasks();
                            showToast('Task status save nahi hua. Please try again.', 'error');
                        }
                    }
                });
            });
        }
        
        // Synchronize theme across browser tabs.
        // Tasks are loaded from the backend API, not localStorage.
        window.addEventListener('storage', (e) => {
            if (e.key === THEME_STORAGE_KEY) {
                initTheme();
            }
        });

        // Initialize Application
        window.addEventListener('DOMContentLoaded', async () => {
            initTheme();
            await loadTasksFromAPI();
        });