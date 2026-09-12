const seedPosts = [
  { id: 101, owner: 'meera', type: 'campus', title: 'Robotics club open lab', category: 'event', location: 'Innovation block', date: '2026-09-13', description: 'Everyone is welcome to join tonight at 5 PM. Bring your ideas and a notebook.', icon: '⚙', time: '12 min ago' },
  { id: 102, owner: 'ananya', type: 'reel', title: 'A day at CUPB library', category: 'campus', location: 'Central library', date: '2026-09-13', description: 'A quick reel from a quiet study day between classes.', icon: '▶', time: '34 min ago' },
  { id: 103, owner: 'rohan', type: 'campus', title: 'Inter-hostel football results', category: 'achievement', location: 'Sports ground', date: '2026-09-12', description: 'Congratulations to Hostel B for an incredible final match.', icon: '⚽', time: 'Yesterday' },
  { id: 1, owner: 'ananya', type: 'found', title: 'Blue water bottle', category: 'personal', location: 'Main lawn', date: '2026-09-12', description: 'Matte blue bottle with a small mountain sticker near the base.', icon: '♒', time: '2 min ago' },
  { id: 2, owner: 'rohan', type: 'lost', title: 'AirPods case', category: 'electronics', location: 'Library, 2nd floor', date: '2026-09-11', description: 'White case with a tiny orange mark on the lid. Last seen near the windows.', icon: '◉', time: '18 min ago' },
  { id: 3, owner: 'meera', type: 'found', title: 'Silver keyring', category: 'keys', location: 'North gate', date: '2026-09-10', description: 'Two keys and a round green keychain found near the security desk.', icon: '⌘', time: '1 hr ago' },
  { id: 4, owner: 'rohan', type: 'lost', title: 'Student ID card', category: 'cards', location: 'Cafeteria', date: '2026-09-10', description: 'Name starts with G. It is inside a clear plastic sleeve with a blue edge.', icon: '▣', time: '3 hrs ago' },
  { id: 5, owner: 'ananya', type: 'found', title: 'Black notebook', category: 'books', location: 'Science block, room 104', date: '2026-09-09', description: 'Plain black notebook with a yellow elastic band and handwritten notes.', icon: '▤', time: 'Yesterday' },
  { id: 6, owner: 'meera', type: 'lost', title: 'Green hoodie', category: 'clothing', location: 'Sports ground', date: '2026-09-09', description: 'Oversized green hoodie, small stitched logo on the left sleeve.', icon: '✦', time: 'Yesterday' },
  { id: 7, owner: 'ananya', type: 'found', title: 'Grocery tote bag', category: 'grocery', location: 'Hostel canteen', date: '2026-09-12', description: 'Reusable tote with packed groceries and a small receipt inside.', icon: '▰', time: 'Today' },
  { id: 8, owner: 'rohan', type: 'lost', title: 'Digital tablet pen', category: 'digital', location: 'Design lab', date: '2026-09-12', description: 'White stylus for a tablet, no brand marking, last used near desk 8.', icon: '✎', time: 'Today' }
];

const people = { gurudev: { id: 'gurudev', name: 'Gurudev', initial: 'G', verified: true }, ananya: { id: 'ananya', name: 'Ananya Sharma', initial: 'A', verified: true }, rohan: { id: 'rohan', name: 'Rohan Mehta', initial: 'R', verified: true }, meera: { id: 'meera', name: 'Meera Kapoor', initial: 'M', verified: true } };
const state = { posts: JSON.parse(localStorage.getItem('cupb-posts') || localStorage.getItem('foundly-posts') || 'null') || seedPosts, messages: JSON.parse(localStorage.getItem('foundly-messages') || '[]'), activeUser: localStorage.getItem('foundly-user') || 'gurudev', section: 'posts', filter: 'all', category: 'all', query: '', selectedPost: null, selectedPerson: null };
const postGrid = document.getElementById('postGrid');
const emptyState = document.getElementById('emptyState');
const dialog = document.getElementById('postDialog');
const form = document.getElementById('postForm');
const toast = document.getElementById('toast');
const mediaField = document.createElement('label');
mediaField.className = 'full media-field';
mediaField.innerHTML = 'Photo or reel cover<input name="media" type="file" accept="image/*,video/*" capture="environment">';
form.querySelector('.form-grid').insertBefore(mediaField, form.querySelector('.form-grid').lastElementChild);
const messageDialog = document.getElementById('messageDialog');
const inboxDialog = document.getElementById('inboxDialog');
const userDialog = document.getElementById('userDialog');
const categoryNames = { electronics: 'Electronics', digital: 'Digital', grocery: 'Grocery & Food', clothing: 'Clothing', personal: 'Personal', books: 'Books & Notes', keys: 'Keys', cards: 'Cards & IDs', other: 'Other' };

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function getVisiblePosts() {
  return state.posts.filter(post => {
    const matchesSection = state.section === 'lost' ? ['lost', 'found'].includes(post.type) : state.section === 'reels' ? post.type === 'reel' : ['campus', 'reel'].includes(post.type);
    const matchesType = state.section !== 'lost' || state.filter === 'all' || post.type === state.filter;
    const matchesCategory = state.category === 'all' || post.category === state.category;
    const haystack = `${post.title} ${post.location} ${post.description}`.toLowerCase();
    return matchesSection && matchesType && matchesCategory && haystack.includes(state.query.toLowerCase());
  });
}

function renderPosts() {
  const visible = getVisiblePosts();
  postGrid.innerHTML = visible.map(post => `
    <article class="post-card">
      <div class="post-image ${escapeHtml(post.category)}"><span class="post-badge ${post.type}">${post.type === 'reel' ? 'REEL' : post.type === 'campus' ? 'CUPB' : post.type.toUpperCase()}</span><span>${escapeHtml(post.icon || '✦')}</span></div>
      <div class="post-body"><h3>${escapeHtml(post.title)}</h3><p>${escapeHtml(post.description)}</p><div class="post-meta"><span>⌖ ${escapeHtml(post.location)}</span><strong>${escapeHtml(post.time || formatDate(post.date))}</strong></div><div class="post-actions"><span>${escapeHtml(categoryNames[post.category] || 'Other')}</span><button class="message-button" data-post-id="${post.id}">Message <span>↗</span></button></div></div>
    </article>`).join('');
  emptyState.classList.toggle('hidden', visible.length > 0);
  postGrid.classList.toggle('hidden', visible.length === 0);
  document.getElementById('activeCount').textContent = state.posts.length;
  document.querySelectorAll('.message-button').forEach(button => button.addEventListener('click', () => openMessage(button.dataset.postId)));
  updateMessageCount();
}

function formatDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function openDialog(type = 'lost') {
  form.reset();
  form.elements.type.value = type;
  document.getElementById('postDialogTitle').textContent = type === 'lost' ? 'Report a lost item.' : type === 'reel' ? 'Share a CUPB reel.' : 'Share with campus.';
  dialog.showModal();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 3000);
}

function openMessage(postId) {
  state.selectedPost = state.posts.find(post => String(post.id) === String(postId));
  if (!state.selectedPost) return;
  state.selectedPerson = people[state.selectedPost.owner] || people.ananya;
  document.getElementById('messageTitle').textContent = `Message ${state.selectedPerson.name}`;
  document.getElementById('messageForm').reset();
  messageDialog.showModal();
}

function updateMessageCount() {
  const count = state.messages.filter(message => !message.read).length;
  document.getElementById('messageCount').textContent = count;
}

function renderInbox() {
  const messageList = document.getElementById('messageList');
  const conversations = [...new Map(state.messages.map(message => [message.personId, message])).values()];
  document.getElementById('inboxEmpty').classList.toggle('hidden', conversations.length > 0);
  messageList.innerHTML = conversations.map(message => { const person = people[message.personId] || people.ananya; return `<button class="inbox-message" data-person-id="${person.id}"><span class="person-avatar">${person.initial}</span><span><strong>${escapeHtml(person.name)} <i>✓</i></strong><small>${escapeHtml(message.time)}</small><p>${escapeHtml(message.text)}</p></span><b>›</b></button>`; }).join('');
  messageList.querySelectorAll('.inbox-message').forEach(button => button.addEventListener('click', () => openPersonMessage(button.dataset.personId)));
}

function openPersonMessage(personId) {
  state.selectedPerson = people[personId];
  document.getElementById('messageTitle').textContent = `Message ${state.selectedPerson.name}`;
  document.getElementById('messageForm').reset();
  inboxDialog.close();
  messageDialog.showModal();
}

function renderUsers() {
  document.getElementById('userList').innerHTML = Object.values(people).map(person => `<button class="user-option ${person.id === state.activeUser ? 'selected' : ''}" data-user-id="${person.id}"><span class="person-avatar">${person.initial}</span><span><strong>${person.name} <i>✓</i></strong><small>${person.id === 'gurudev' ? 'Your verified profile' : 'Verified campus member'}</small></span>${person.id === state.activeUser ? '<b>Current</b>' : ''}</button>`).join('');
  document.querySelectorAll('.user-option').forEach(button => button.addEventListener('click', () => { state.activeUser = button.dataset.userId; localStorage.setItem('foundly-user', state.activeUser); updateActiveUser(); userDialog.close(); showToast(`Switched to ${people[state.activeUser].name}`); }));
}

function updateActiveUser() {
  const person = people[state.activeUser] || people.gurudev;
  if (!people[state.activeUser]) state.activeUser = 'gurudev';
  document.getElementById('activeUserAvatar').textContent = person.initial;
  document.getElementById('activeUserName').textContent = person.name.split(' ')[0];
}

document.getElementById('openPostButton').addEventListener('click', () => openDialog('campus'));
document.getElementById('openCampusPostButton').addEventListener('click', () => openDialog('campus'));
document.getElementById('reportLostButton').addEventListener('click', () => openDialog('lost'));
document.getElementById('emptyPostButton').addEventListener('click', () => openDialog());
document.getElementById('closeDialog').addEventListener('click', () => dialog.close());
document.getElementById('closeMessageDialog').addEventListener('click', () => messageDialog.close());
document.getElementById('closeInboxDialog').addEventListener('click', () => inboxDialog.close());
document.getElementById('closeUserDialog').addEventListener('click', () => userDialog.close());
document.getElementById('switchUserButton').addEventListener('click', () => { renderUsers(); userDialog.showModal(); });
document.getElementById('openInboxButton').addEventListener('click', () => { state.messages = state.messages.map(message => ({ ...message, read: true })); localStorage.setItem('foundly-messages', JSON.stringify(state.messages)); renderInbox(); updateMessageCount(); inboxDialog.showModal(); });
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
messageDialog.addEventListener('click', event => { if (event.target === messageDialog) messageDialog.close(); });
inboxDialog.addEventListener('click', event => { if (event.target === inboxDialog) inboxDialog.close(); });
userDialog.addEventListener('click', event => { if (event.target === userDialog) userDialog.close(); });
document.getElementById('searchInput').addEventListener('input', event => { state.query = event.target.value; renderPosts(); });
document.getElementById('categoryFilter').addEventListener('change', event => { state.category = event.target.value; renderPosts(); });
document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.filter').forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  state.filter = button.dataset.filter;
  renderPosts();
}));
document.querySelectorAll('.content-tab').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.content-tab').forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  state.section = button.dataset.section;
  state.filter = state.section === 'lost' ? 'all' : 'all';
  renderPosts();
}));

form.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(form);
  const post = {
    id: Date.now(), owner: state.activeUser, type: data.get('type'), title: data.get('title').trim(), category: data.get('category'), location: data.get('location').trim(), date: data.get('date'), description: data.get('description').trim(), icon: data.get('type') === 'lost' ? '⌕' : data.get('type') === 'reel' ? '▶' : '✦', time: 'Just now'
  };
  state.posts.unshift(post);
  localStorage.setItem('cupb-posts', JSON.stringify(state.posts));
  dialog.close();
  renderPosts();
  showToast('Your post is live. Good luck!');
  document.getElementById('browse').scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('messageForm').addEventListener('submit', event => {
  event.preventDefault();
  const text = new FormData(event.currentTarget).get('message').trim();
  state.messages.unshift({ id: Date.now(), personId: state.selectedPerson.id, postTitle: state.selectedPost?.title || '', text, time: 'Just now', read: false, from: state.activeUser });
  localStorage.setItem('foundly-messages', JSON.stringify(state.messages));
  messageDialog.close();
  updateMessageCount();
  showToast('Message sent. Keep an eye on your inbox.');
});

document.getElementById('communityCount').textContent = Math.max(128, state.posts.length + 122);
updateActiveUser();
renderPosts();
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('service-worker.js'));

function setupGoogleLogin() {
  const googleButton = document.getElementById('googleButton');
  if (!window.CUPB_CONFIG?.googleClientId) {
    googleButton.innerHTML = '<div class="config-warning">Google login is ready. Add your Google Client ID in <strong>auth-config.js</strong> to activate it.</div>';
    return;
  }
  if (!window.google?.accounts?.id) { window.setTimeout(setupGoogleLogin, 500); return; }
  google.accounts.id.initialize({ client_id: window.CUPB_CONFIG.googleClientId, callback: handleGoogleCredential });
  google.accounts.id.renderButton(googleButton, { theme: 'outline', size: 'large', text: 'continue_with', shape: 'rectangular', width: 330 });
}

function handleGoogleCredential(response) {
  const payload = JSON.parse(atob(response.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
  const googleUser = { id: `google-${payload.sub}`, name: payload.name || 'CUPB member', initial: (payload.name || 'C').charAt(0).toUpperCase(), verified: true };
  people[googleUser.id] = googleUser;
  state.activeUser = googleUser.id;
  localStorage.setItem('foundly-user', state.activeUser);
  updateActiveUser();
  document.getElementById('loginDialog').close();
  showToast(`Welcome to CUPB, ${googleUser.name}`);
}

document.getElementById('openLoginButton').addEventListener('click', () => { document.getElementById('loginDialog').showModal(); setupGoogleLogin(); });
document.getElementById('closeLoginDialog').addEventListener('click', () => document.getElementById('loginDialog').close());
document.getElementById('loginDialog').addEventListener('click', event => { if (event.target === document.getElementById('loginDialog')) document.getElementById('loginDialog').close(); });
document.getElementById('enableAlertsButton').addEventListener('click', async () => {
  if (!('Notification' in window)) { showToast('Notifications are not supported here.'); return; }
  const permission = await Notification.requestPermission();
  showToast(permission === 'granted' ? 'CUPB notifications enabled.' : 'Notifications remain off.');
});
