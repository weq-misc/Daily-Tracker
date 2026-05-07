const STORAGE = {
  habits: 'tracker_habits_v4',
  tasks: 'tracker_tasks_v4',
  must: 'tracker_must_v4',
  title: 'tracker_title_v4',
  desc: 'tracker_desc_v4',
  workout: 'tracker_workout_notes_v4',
  summary: 'tracker_day_summary_v4',
  history: 'tracker_history_v4',
  streak: 'tracker_streak_v4',
  lastDate: 'tracker_last_date_v4'
};

const defaultHabits = [
  { time: '6:30 AM', category: 'Sleep', text: 'Wake up. No snooze.', done: false },
  { time: '6:35 AM', category: 'Looks', text: 'Brush teeth + wash face', done: false },
  { time: 'After school', category: 'Grades', text: 'Homework / study first', done: false },
  { time: '7:00 PM', category: 'Gym', text: 'Workout / pushups / abs', done: false },
  { time: '9:30 PM', category: 'Looks', text: 'Skincare + shower', done: false },
  { time: '10:30 PM', category: 'Sleep', text: 'Put phone down and sleep before it gets bad', done: false }
];

const quotePacks = {
  morning: {
    label: 'Morning focus',
    quotes: [
      'Up early = better skin, better focus, better day.',
      'No snooze. Get up and start improving.',
      'Morning routine = looks + grades + discipline.',
      'Hydrate, wash face, move your body.',
      'Win the morning, everything gets easier.'
    ]
  },
  afternoon: {
    label: 'Afternoon grades',
    quotes: [
      'Homework first. Grades don’t fix themselves.',
      'Lock in for 30 minutes. No distractions.',
      'Study now = less stress later.',
      'Do the work even if you don’t feel like it.',
      'Consistency beats cramming.'
    ]
  },
  evening: {
    label: 'Evening gym',
    quotes: [
      'Train. Your physique is built here.',
      'Pushups, shoulders, abs—no skipping.',
      'You don’t need motivation. Start the first set.',
      'Good form > ego reps. Do it right.',
      'Finish your workout. Then you can relax.'
    ]
  },
  night: {
    label: 'Night recovery',
    quotes: [
      'Skincare, shower, then sleep.',
      'Sleep is growth—for muscles and brain.',
      'Put the phone down. Recovery matters.',
      'Tomorrow’s results depend on tonight.',
      'Rest like someone who has goals.'
    ]
  }
};

let habits = normalizeHabits(loadJSON(STORAGE.habits, defaultHabits));
let tasks = loadJSON(STORAGE.tasks, []);
let mustDos = loadJSON(STORAGE.must, []);
let history = loadJSON(STORAGE.history, {});
let streak = loadJSON(STORAGE.streak, { count: 0, lastFinished: null });

let timerSeconds = 25 * 60;
let timerRunning = false;
let timerInterval = null;

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : structuredCloneSafe(fallback);
  } catch (error) {
    return structuredCloneSafe(fallback);
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value));
}

function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function guessCategory(text) {
  const t = String(text).toLowerCase();

  if (t.includes('workout') || t.includes('pushup') || t.includes('abs') || t.includes('gym')) {
    return 'Gym';
  }

  if (t.includes('homework') || t.includes('study') || t.includes('school')) {
    return 'Grades';
  }

  if (t.includes('skin') || t.includes('shower') || t.includes('brush') || t.includes('face')) {
    return 'Looks';
  }

  if (t.includes('sleep') || t.includes('wake') || t.includes('phone')) {
    return 'Sleep';
  }

  return 'Discipline';
}

function normalizeHabits(items) {
  if (!Array.isArray(items)) return structuredCloneSafe(defaultHabits);

  return items.map(item => ({
    time: item.time || 'Anytime',
    category: item.category || guessCategory(item.text || ''),
    text: item.text || 'Untitled habit',
    done: Boolean(item.done)
  }));
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 1300);
}

function makeButton(text, className, onClick) {
  const button = document.createElement('button');
  button.textContent = text;
  button.className = className;
  button.onclick = onClick;
  return button;
}

function getQuotePack(date = new Date()) {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) return quotePacks.morning;
  if (hour >= 12 && hour < 17) return quotePacks.afternoon;
  if (hour >= 17 && hour < 22) return quotePacks.evening;

  return quotePacks.night;
}

function setRandomQuote() {
  const pack = getQuotePack();
  const quote = pack.quotes[Math.floor(Math.random() * pack.quotes.length)];

  document.getElementById('quoteLabel').textContent = pack.label;
  document.getElementById('mainQuote').textContent = `“${quote}”`;
}

function setTodayBadge() {
  const now = new Date();

  document.getElementById('todayBadge').textContent = now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  const standalone =
    window.navigator.standalone ||
    window.matchMedia('(display-mode: standalone)').matches;

  if (standalone) {
    document.getElementById('appBadge').textContent = 'App mode';
  }
}

function showInstallHint() {
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone =
    window.navigator.standalone ||
    window.matchMedia('(display-mode: standalone)').matches;

  if (isIOS && !standalone) {
    document.getElementById('installBox').classList.add('show');
  }
}

function getScore() {
  const total = habits.length;
  const done = habits.filter(habit => habit.done).length;

  return total ? Math.round((done / total) * 100) : 0;
}

function getLast7Days() {
  const days = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    days.push({
      key: todayKey(date),
      label: date.toLocaleDateString(undefined, { weekday: 'short' })
    });
  }

  return days;
}

function checkAutoReset() {
  const today = todayKey();
  const last = localStorage.getItem(STORAGE.lastDate);

  if (!last) {
    localStorage.setItem(STORAGE.lastDate, today);
    return;
  }

  if (last !== today) {
    saveDayScore(last, false);

    habits = habits.map(habit => ({ ...habit, done: false }));
    tasks = tasks.map(task => ({ ...task, done: false }));
    mustDos = [];

    saveHabits(false);
    saveTasks(false);
    saveMustDos(false);

    localStorage.setItem(STORAGE.lastDate, today);
  }
}

function saveDayScore(date = todayKey(), shouldUpdateStreak = true) {
  const score = getScore();
  const done = habits.filter(habit => habit.done).length;
  const total = habits.length;

  history[date] = { score, done, total };
  saveJSON(STORAGE.history, history);

  if (shouldUpdateStreak) {
    updateStreakCounter(score, date);
  }

  renderWeekly();
  updateStats();
}

function updateStreakCounter(score, date) {
  const yesterday = new Date(`${date}T00:00:00`);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = todayKey(yesterday);

  if (score < 70) {
    streak = { count: 0, lastFinished: date };
  } else if (streak.lastFinished === date) {
    // Already counted today.
  } else if (streak.lastFinished === yesterdayKey) {
    streak.count += 1;
    streak.lastFinished = date;
  } else {
    streak = { count: 1, lastFinished: date };
  }

  saveJSON(STORAGE.streak, streak);

  showToast(score >= 70 ? 'Day saved + streak counted' : 'Day saved');
}

function finishDay() {
  saveDayScore(todayKey(), true);
}

function updateStats() {
  const done = habits.filter(habit => habit.done).length;
  const total = habits.length;
  const score = getScore();

  const weekScores = getLast7Days()
    .map(day => history[day.key]?.score)
    .filter(scoreValue => typeof scoreValue === 'number');

  const avg = weekScores.length
    ? Math.round(weekScores.reduce((a, b) => a + b, 0) / weekScores.length)
    : score;

  document.getElementById('doneCount').textContent = done;
  document.getElementById('totalCount').textContent = total;
  document.getElementById('percent').textContent = `${score}%`;
  document.getElementById('streakCount').textContent = streak.count || 0;
  document.getElementById('weekAvg').textContent = `${avg}%`;
  document.getElementById('progressText').textContent = `${done} of ${total} complete`;
  document.getElementById('progressFill').style.width = `${score}%`;
}

function renderHabits() {
  const list = document.getElementById('habitList');
  list.innerHTML = '';

  habits.forEach((habit, index) => {
    const div = document.createElement('div');
    div.className = `habit${habit.done ? ' done' : ''}`;

    const time = document.createElement('div');
    time.className = 'habit-time';
    time.textContent = habit.time || 'Anytime';
    time.onclick = () => editTime(index);

    const category = document.createElement('div');
    category.className = 'category-pill';
    category.textContent = habit.category || 'Discipline';
    category.onclick = () => editCategory(index);

    const text = document.createElement('span');
    text.className = 'habit-text';
    text.textContent = habit.text;
    text.onclick = () => toggleHabit(index);

    const actions = document.createElement('div');
    actions.className = 'item-actions';
    actions.append(makeButton('Edit', 'small-btn ghost-btn', () => editHabit(index)));
    actions.append(makeButton('X', 'small-btn danger-btn', () => deleteHabit(index)));

    div.append(time, category, text, actions);
    list.appendChild(div);
  });

  updateStats();
  renderCategories();
}

function addHabit() {
  const timeInput = document.getElementById('habitTimeInput');
  const categoryInput = document.getElementById('habitCategoryInput');
  const habitInput = document.getElementById('habitInput');

  const text = habitInput.value.trim();

  if (!text) return showToast('Type a habit first');

  habits.push({
    time: timeInput.value.trim() || 'Anytime',
    category: categoryInput.value || 'Discipline',
    text,
    done: false
  });

  timeInput.value = '';
  habitInput.value = '';

  saveHabits(false);
  renderHabits();
  showToast('Added');
}

function toggleHabit(index) {
  habits[index].done = !habits[index].done;

  saveHabits(false);
  renderHabits();
  saveDayScore(todayKey(), false);
}

function editTime(index) {
  const newTime = prompt('Edit the time:', habits[index].time || 'Anytime');

  if (!newTime?.trim()) return;

  habits[index].time = newTime.trim();

  saveHabits(false);
  renderHabits();
  showToast('Updated');
}

function editCategory(index) {
  const newCategory = prompt(
    'Category: Gym, Grades, Looks, Sleep, or Discipline',
    habits[index].category || 'Discipline'
  );

  if (!newCategory?.trim()) return;

  habits[index].category = newCategory.trim();

  saveHabits(false);
  renderHabits();
  showToast('Updated');
}

function editHabit(index) {
  const newTime = prompt('Edit the time:', habits[index].time || 'Anytime');
  const newCategory = prompt('Edit category:', habits[index].category || 'Discipline');
  const newText = prompt('Edit what to do:', habits[index].text);

  if (newTime?.trim()) habits[index].time = newTime.trim();
  if (newCategory?.trim()) habits[index].category = newCategory.trim();
  if (newText?.trim()) habits[index].text = newText.trim();

  saveHabits(false);
  renderHabits();
  showToast('Updated');
}

function deleteHabit(index) {
  habits.splice(index, 1);

  saveHabits(false);
  renderHabits();
  showToast('Deleted');
}

function saveHabits(show = true) {
  saveJSON(STORAGE.habits, habits);

  if (show) {
    showToast('Schedule saved');
  }
}

function resetHabits() {
  if (!confirm('Reset your schedule back to default?')) return;

  habits = structuredCloneSafe(defaultHabits);

  saveHabits(false);
  renderHabits();
  showToast('Schedule reset');
}

function renderCategories() {
  const grid = document.getElementById('categoryGrid');
  grid.innerHTML = '';

  ['Gym', 'Grades', 'Looks', 'Sleep', 'Discipline'].forEach(categoryName => {
    const items = habits.filter(
      habit => (habit.category || 'Discipline').toLowerCase() === categoryName.toLowerCase()
    );

    const done = items.filter(habit => habit.done).length;
    const total = items.length;
    const score = total ? Math.round((done / total) * 100) : 0;

    const card = document.createElement('div');
    card.className = 'category-card';
    card.innerHTML = `<strong>${categoryName}</strong><p>${done}/${total} done • ${score}%</p>`;

    grid.appendChild(card);
  });
}

function renderMustDos() {
  const list = document.getElementById('mustList');
  list.innerHTML = '';

  if (!mustDos.length) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'No must-do tasks yet.';
    list.appendChild(empty);
    return;
  }

  mustDos.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = `must-item${item.done ? ' done' : ''}`;

    const main = document.createElement('div');
    main.className = `must-main${item.done ? ' must-done' : ''}`;
    main.textContent = `${item.done ? '✅' : '⬜'} ${item.text}`;
    main.onclick = () => toggleMustDo(index);

    const actions = document.createElement('div');
    actions.className = 'item-actions';
    actions.append(makeButton('Edit', 'small-btn ghost-btn', () => editMustDo(index)));
    actions.append(makeButton('X', 'small-btn danger-btn', () => deleteMustDo(index)));

    div.append(main, actions);
    list.appendChild(div);
  });
}

function addMustDo() {
  const input = document.getElementById('mustInput');
  const text = input.value.trim();

  if (!text) return showToast('Type a must-do first');
  if (mustDos.length >= 3) return showToast('Keep it to 3 max');

  mustDos.push({ text, done: false });

  input.value = '';

  saveMustDos(false);
  renderMustDos();
  showToast('Must-do added');
}

function toggleMustDo(index) {
  mustDos[index].done = !mustDos[index].done;

  saveMustDos(false);
  renderMustDos();
}

function editMustDo(index) {
  const text = prompt('Edit must-do:', mustDos[index].text);

  if (!text?.trim()) return;

  mustDos[index].text = text.trim();

  saveMustDos(false);
  renderMustDos();
}

function deleteMustDo(index) {
  mustDos.splice(index, 1);

  saveMustDos(false);
  renderMustDos();
}

function saveMustDos(show = true) {
  saveJSON(STORAGE.must, mustDos);

  if (show) {
    showToast('Must-do list saved');
  }
}

function renderTasks() {
  const list = document.getElementById('taskList');
  list.innerHTML = '';

  if (!tasks.length) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'No extra tasks yet.';
    list.appendChild(empty);
    return;
  }

  tasks.forEach((task, index) => {
    const li = document.createElement('li');

    const main = document.createElement('div');
    main.className = `task-main${task.done ? ' task-done' : ''}`;
    main.onclick = () => toggleTask(index);

    const time = document.createElement('span');
    time.className = 'task-time';
    time.textContent = task.time || 'Anytime';

    const text = document.createElement('span');
    text.textContent = `${task.done ? '✅' : '⬜'} ${task.text}`;

    const actions = document.createElement('div');
    actions.className = 'item-actions';
    actions.append(makeButton('Edit', 'small-btn ghost-btn', () => editTask(index)));
    actions.append(makeButton('X', 'small-btn danger-btn', () => deleteTask(index)));

    main.append(time, text);
    li.append(main, actions);
    list.appendChild(li);
  });
}

function addTask() {
  const timeInput = document.getElementById('taskTimeInput');
  const taskInput = document.getElementById('taskInput');

  const text = taskInput.value.trim();

  if (!text) return showToast('Type a task first');

  tasks.push({
    time: timeInput.value.trim() || 'Anytime',
    text,
    done: false
  });

  timeInput.value = '';
  taskInput.value = '';

  saveTasks(false);
  renderTasks();
  showToast('Task added');
}

function toggleTask(index) {
  tasks[index].done = !tasks[index].done;

  saveTasks(false);
  renderTasks();
}

function editTask(index) {
  const newTime = prompt('Edit task time:', tasks[index].time || 'Anytime');
  const newText = prompt('Edit task:', tasks[index].text);

  if (newTime?.trim()) tasks[index].time = newTime.trim();
  if (newText?.trim()) tasks[index].text = newText.trim();

  saveTasks(false);
  renderTasks();
  showToast('Task updated');
}

function deleteTask(index) {
  tasks.splice(index, 1);

  saveTasks(false);
  renderTasks();
  showToast('Task deleted');
}

function saveTasks(show = true) {
  saveJSON(STORAGE.tasks, tasks);

  if (show) {
    showToast('Tasks saved');
  }
}

function clearTasks() {
  tasks = [];

  saveTasks(false);
  renderTasks();
  showToast('Tasks cleared');
}

function renderWeekly() {
  const list = document.getElementById('weeklyList');
  list.innerHTML = '';

  getLast7Days().forEach(day => {
    const data = history[day.key];
    const score = data ? data.score : 0;

    const row = document.createElement('div');
    row.className = 'week-row';

    row.innerHTML = `
      <strong>${day.label}</strong>
      <div class="week-bar">
        <div class="week-fill" style="width:${score}%"></div>
      </div>
      <span>${data ? score + '%' : '—'}</span>
    `;

    list.appendChild(row);
  });
}

function resetToday() {
  habits = habits.map(habit => ({ ...habit, done: false }));
  tasks = tasks.map(task => ({ ...task, done: false }));
  mustDos = mustDos.map(item => ({ ...item, done: false }));

  saveHabits(false);
  saveTasks(false);
  saveMustDos(false);

  renderHabits();
  renderTasks();
  renderMustDos();

  saveDayScore(todayKey(), false);
  setRandomQuote();
  showToast('Today reset');
}

function saveNotes(id) {
  const key = id === 'workoutNotes' ? STORAGE.workout : STORAGE.summary;

  localStorage.setItem(key, document.getElementById(id).value);

  showToast('Saved');
}

function saveHeader() {
  localStorage.setItem(STORAGE.title, document.getElementById('mainTitle').innerText.trim());
  localStorage.setItem(STORAGE.desc, document.getElementById('mainDesc').innerText.trim());

  showToast('Title saved');
}

function loadHeader() {
  const title = localStorage.getItem(STORAGE.title);
  const desc = localStorage.getItem(STORAGE.desc);

  if (title) {
    document.getElementById('mainTitle').innerText = title;
  }

  if (desc) {
    document.getElementById('mainDesc').innerText = desc;
  }
}

function updateTimerDisplay() {
  const mins = Math.floor(timerSeconds / 60);
  const secs = timerSeconds % 60;

  document.getElementById('timerDisplay').textContent =
    `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function setTimer(minutes) {
  stopTimer();

  timerSeconds = minutes * 60;

  updateTimerDisplay();
  showToast(`${minutes} min timer set`);
}

function toggleTimer() {
  if (timerRunning) {
    stopTimer();
    return;
  }

  timerRunning = true;

  document.getElementById('timerButton').textContent = 'Pause Timer';

  timerInterval = setInterval(() => {
    if (timerSeconds > 0) {
      timerSeconds--;
      updateTimerDisplay();
    } else {
      stopTimer();
      showToast('Timer done');

      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    }
  }, 1000);
}

function stopTimer() {
  timerRunning = false;
  clearInterval(timerInterval);

  const button = document.getElementById('timerButton');

  if (button) {
    button.textContent = 'Start Timer';
  }
}

function resetTimer() {
  stopTimer();

  timerSeconds = 25 * 60;

  updateTimerDisplay();
}

function exportData() {
  const data = {
    habits,
    tasks,
    mustDos,
    history,
    streak,
    title: localStorage.getItem(STORAGE.title) || '',
    desc: localStorage.getItem(STORAGE.desc) || '',
    workout: localStorage.getItem(STORAGE.workout) || '',
    summary: localStorage.getItem(STORAGE.summary) || '',
    exportedAt: new Date().toISOString()
  };

  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(data))));

  document.getElementById('backupBox').value = encoded;

  showToast('Backup created');
}

function importData() {
  const code = document.getElementById('backupBox').value.trim();

  if (!code) return showToast('Paste backup first');

  try {
    const data = JSON.parse(decodeURIComponent(escape(atob(code))));

    habits = normalizeHabits(data.habits || defaultHabits);
    tasks = Array.isArray(data.tasks) ? data.tasks : [];
    mustDos = Array.isArray(data.mustDos) ? data.mustDos : [];
    history = data.history && typeof data.history === 'object' ? data.history : {};
    streak = data.streak && typeof data.streak === 'object'
      ? data.streak
      : { count: 0, lastFinished: null };

    saveHabits(false);
    saveTasks(false);
    saveMustDos(false);
    saveJSON(STORAGE.history, history);
    saveJSON(STORAGE.streak, streak);

    if (typeof data.title === 'string') localStorage.setItem(STORAGE.title, data.title);
    if (typeof data.desc === 'string') localStorage.setItem(STORAGE.desc, data.desc);
    if (typeof data.workout === 'string') localStorage.setItem(STORAGE.workout, data.workout);
    if (typeof data.summary === 'string') localStorage.setItem(STORAGE.summary, data.summary);

    loadHeader();

    document.getElementById('workoutNotes').value = localStorage.getItem(STORAGE.workout) || '';
    document.getElementById('daySummary').value = localStorage.getItem(STORAGE.summary) || '';

    renderAll();

    showToast('Backup imported');
  } catch (error) {
    showToast('Invalid backup');
  }
}

function clearBackupBox() {
  document.getElementById('backupBox').value = '';
}

function renderAll() {
  renderMustDos();
  renderHabits();
  renderTasks();
  renderWeekly();
  renderCategories();
  updateStats();
  updateTimerDisplay();
}

function runSmokeTests() {
  console.assert(typeof setRandomQuote === 'function', 'setRandomQuote should exist');
  console.assert(getQuotePack(new Date('2026-01-01T08:00:00')).label === 'Morning focus', 'morning quote pack should load');
  console.assert(getQuotePack(new Date('2026-01-01T14:00:00')).label === 'Afternoon grades', 'afternoon quote pack should load');
  console.assert(getQuotePack(new Date('2026-01-01T19:00:00')).label === 'Evening gym', 'evening quote pack should load');
  console.assert(getQuotePack(new Date('2026-01-01T23:00:00')).label === 'Night recovery', 'night quote pack should load');
  console.assert(todayKey(new Date('2026-05-07T12:00:00')) === '2026-05-07', 'todayKey should format dates');
  console.assert(guessCategory('pushups and abs') === 'Gym', 'gym category guess should work');
}

function init() {
  checkAutoReset();
  setTodayBadge();
  showInstallHint();
  loadHeader();

  document.getElementById('workoutNotes').value = localStorage.getItem(STORAGE.workout) || '';
  document.getElementById('daySummary').value = localStorage.getItem(STORAGE.summary) || '';

  saveDayScore(todayKey(), false);
  setRandomQuote();
  renderAll();
  runSmokeTests();
}

document.addEventListener('DOMContentLoaded', init);
