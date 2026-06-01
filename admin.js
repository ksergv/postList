const state = {
  posts: [],
  selectedId: null,
};

const ADMIN_PASSWORD = "admin123";
const AUTH_KEY = "postList.adminAuth";
const SAVE_API_URL_KEY = "postList.saveApiUrl";
const SAVE_API_SECRET_KEY = "postList.saveApiSecret";

const elements = {
  adminPassword: document.getElementById("adminPassword"),
  adminShell: document.getElementById("adminShell"),
  content: document.getElementById("postContent"),
  deleteButton: document.getElementById("deletePostButton"),
  duplicateButton: document.getElementById("duplicatePostButton"),
  form: document.getElementById("postForm"),
  formatToolbar: document.querySelector(".format-toolbar"),
  hidden: document.getElementById("postHidden"),
  id: document.getElementById("postId"),
  image: document.getElementById("postImage"),
  importButton: document.getElementById("importFileButton"),
  importInput: document.getElementById("importFileInput"),
  list: document.getElementById("adminPostList"),
  loginForm: document.getElementById("loginForm"),
  loginMessage: document.getElementById("loginMessage"),
  loginPanel: document.getElementById("loginPanel"),
  newButton: document.getElementById("addPostButton"),
  previewButton: document.getElementById("previewPostButton"),
  preview: document.getElementById("postPreview"),
  resetButton: document.getElementById("resetDraftButton"),
  saveApiSecret: document.getElementById("saveApiSecret"),
  saveApiUrl: document.getElementById("saveApiUrl"),
  saveButton: document.getElementById("saveFileButton"),
  search: document.getElementById("postSearch"),
  status: document.getElementById("statusText"),
  category: document.getElementById("postCategory"),
  title: document.getElementById("postTitle"),
};

function unlockAdmin() {
  document.body.classList.remove("admin-locked");
  document.body.classList.add("admin-unlocked");
  sessionStorage.setItem(AUTH_KEY, "1");
  loadInitialPosts();
}

function isAdminUnlocked() {
  return sessionStorage.getItem(AUTH_KEY) === "1";
}

function getNextId() {
  return state.posts.reduce((maxId, post) => Math.max(maxId, Number(post.id) || 0), 0) + 1;
}

function getSelectedPost() {
  return state.posts.find((post) => post.id === state.selectedId) || null;
}

function saveDraft(message = "Черновик сохранен в браузере") {
  PostStore.saveDraftData({ posts: state.posts });
  elements.status.textContent = `${message}. Не забудьте сохранить posts.json для публикации.`;
}

function sortPosts() {
  state.posts.sort((a, b) => Number(a.id) - Number(b.id));
}

function renderList() {
  const query = elements.search.value.trim().toLowerCase();
  elements.list.innerHTML = "";

  state.posts
    .filter((post) => {
      const haystack = `${post.title} ${post.category} ${post.content}`.toLowerCase();
      return haystack.includes(query);
    })
    .forEach((post) => {
      const item = document.createElement("li");
      item.className = `admin-post-item${post.id === state.selectedId ? " active" : ""}`;
      const hiddenLabel = post.hidden ? " · скрыт" : "";
      item.innerHTML = `<strong>${post.id}. ${post.title || "Без заголовка"}</strong><span>${post.category}${hiddenLabel} · ${post.image || "без картинки"}</span>`;
      item.addEventListener("click", () => selectPost(post.id));
      elements.list.appendChild(item);
    });
}

function renderPreview(post) {
  if (!post) {
    elements.preview.innerHTML = "<p>Выберите пост для редактирования.</p>";
    return;
  }

  const image = post.image ? `<img src="${post.image}" alt="">` : "";
  elements.preview.innerHTML = `<h2>${post.title}</h2>${image}<div>${post.content}</div>`;
}

function fillForm(post) {
  elements.id.value = post ? post.id : "";
  elements.category.value = post ? post.category : "info";
  elements.title.value = post ? post.title : "";
  elements.image.value = post ? post.image : "";
  elements.hidden.checked = post ? Boolean(post.hidden) : false;
  elements.content.value = post ? post.content : "";
  renderPreview(post);
}

function selectPost(id) {
  state.selectedId = Number(id);
  fillForm(getSelectedPost());
  renderList();

  if (window.matchMedia("(max-width: 980px)").matches) {
    elements.form.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function readFormPost() {
  return {
    id: Number(elements.id.value),
    category: elements.category.value,
    title: elements.title.value.trim(),
    image: elements.image.value.trim(),
    hidden: elements.hidden.checked,
    content: elements.content.value,
  };
}

function updateSelectedPost() {
  const post = getSelectedPost();
  if (!post) {
    return;
  }

  const formPost = readFormPost();
  const duplicateId = state.posts.some((item) => item.id === formPost.id && item !== post);
  if (!Number.isFinite(formPost.id) || formPost.id < 1 || duplicateId) {
    elements.status.textContent = "ID должен быть положительным и уникальным.";
    elements.id.focus();
    return;
  }

  Object.assign(post, formPost);
  state.selectedId = formPost.id;
  sortPosts();
  saveDraft();
  renderList();
  renderPreview(post);
}

function insertIntoContent(before, after = "", placeholder = "") {
  const textarea = elements.content;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.slice(start, end);
  const text = selectedText || placeholder;
  const insertText = `${before}${text}${after}`;

  textarea.value = `${textarea.value.slice(0, start)}${insertText}${textarea.value.slice(end)}`;
  textarea.focus();
  textarea.setSelectionRange(start + before.length, start + before.length + text.length);
  updateSelectedPost();
}

function insertUnorderedList() {
  const textarea = elements.content;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.slice(start, end).trim();
  const items = selectedText
    ? selectedText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
    : ["Пункт списка", "Пункт списка"];
  const insertText = `<ul style="border:none; margin:0; padding-left: 1.2em; list-style: disc;">\n${items
    .map((item) => `  <li style="border:none;">${item}</li>`)
    .join("\n")}\n</ul>`;

  textarea.value = `${textarea.value.slice(0, start)}${insertText}${textarea.value.slice(end)}`;
  textarea.focus();
  textarea.setSelectionRange(start, start + insertText.length);
  updateSelectedPost();
}

function insertTable() {
  const tableHtml = `<table>
  <thead>
    <tr>
      <th>Заголовок 1</th>
      <th>Заголовок 2</th>
      <th>Заголовок 3</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Текст</td>
      <td>Текст</td>
      <td>Текст</td>
    </tr>
    <tr>
      <td>Текст</td>
      <td>Текст</td>
      <td>Текст</td>
    </tr>
  </tbody>
</table>`;

  insertIntoContent(tableHtml, "", "");
}

function applyFormat(format) {
  const imagePath = elements.image.value.trim() || "img/example.jpg";

  const formats = {
    paragraph: () => insertIntoContent("<p>", "</p>", "Текст абзаца"),
    bold: () => insertIntoContent("<b>", "</b>", "жирный текст"),
    heading2: () => insertIntoContent("<h2>", "</h2>", "Заголовок"),
    heading3: () => insertIntoContent("<h3>", "</h3>", "Подзаголовок"),
    unorderedList: insertUnorderedList,
    image: () => insertIntoContent(`<img src="${imagePath}" alt="">`, "", ""),
    link: () => insertIntoContent('<a href="#">', "</a>", "текст ссылки"),
    table: insertTable,
    linebreak: () => insertIntoContent("<br>\n", "", ""),
  };

  if (formats[format]) {
    formats[format]();
  }
}

function addPost() {
  const post = {
    id: getNextId(),
    category: "info",
    title: "Новый пост",
    image: "img/background.jpg",
    hidden: false,
    content: "<p>Новый текст поста.</p>",
  };
  state.posts.push(post);
  sortPosts();
  saveDraft("Новый пост добавлен");
  selectPost(post.id);
}

function duplicatePost() {
  const current = getSelectedPost();
  if (!current) {
    return;
  }

  const post = {
    ...current,
    id: getNextId(),
    title: `${current.title} копия`,
  };
  state.posts.push(post);
  sortPosts();
  saveDraft("Пост продублирован");
  selectPost(post.id);
}

function previewSelectedPost() {
  const current = getSelectedPost();
  if (!current) {
    elements.status.textContent = "Выберите пост для просмотра.";
    return;
  }

  window.open(`one.html?id=${current.id}&adminPreview=1`, "_blank");
}

function deletePost() {
  const current = getSelectedPost();
  if (!current) {
    return;
  }

  const confirmed = confirm(`Удалить пост "${current.title}"?`);
  if (!confirmed) {
    return;
  }

  state.posts = state.posts.filter((post) => post.id !== current.id);
  state.selectedId = state.posts[0] ? state.posts[0].id : null;
  saveDraft("Пост удален");
  fillForm(getSelectedPost());
  renderList();
}

async function savePostsFile() {
  const json = `${JSON.stringify({ posts: state.posts }, null, 2)}\n`;
  const apiUrl = elements.saveApiUrl.value.trim();

  if (apiUrl) {
    await savePostsToApi(apiUrl);
    return;
  }

  if ("showSaveFilePicker" in window) {
    const handle = await window.showSaveFilePicker({
      suggestedName: "posts.json",
      types: [{ description: "JSON", accept: { "application/json": [".json"] } }],
    });
    const writable = await handle.createWritable();
    await writable.write(json);
    await writable.close();
    elements.status.textContent = "Файл posts.json сохранен.";
    return;
  }

  const blob = new Blob([json], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "posts.json";
  link.click();
  URL.revokeObjectURL(link.href);
  elements.status.textContent = "Файл posts.json скачан. Замените им старый файл в папке проекта.";
}

async function savePostsToApi(apiUrl) {
  const apiSecret = elements.saveApiSecret.value.trim();

  if (!apiSecret) {
    elements.status.textContent = "Введите API secret для сохранения через сервер.";
    elements.saveApiSecret.focus();
    return;
  }

  elements.saveButton.disabled = true;
  elements.status.textContent = "Сохраняем posts.json в GitHub...";

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Secret": apiSecret,
      },
      body: JSON.stringify({ posts: state.posts }),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }

    localStorage.setItem(SAVE_API_URL_KEY, apiUrl);
    sessionStorage.setItem(SAVE_API_SECRET_KEY, apiSecret);
    PostStore.clearDraftData();
    elements.status.textContent = result.commit
      ? `posts.json сохранен в GitHub. Commit: ${result.commit}`
      : "posts.json сохранен в GitHub.";
  } finally {
    elements.saveButton.disabled = false;
  }
}

async function resetDraft() {
  const confirmed = confirm("Сбросить локальный черновик и снова загрузить posts.json?");
  if (!confirmed) {
    return;
  }

  PostStore.clearDraftData();
  await loadInitialPosts(true);
}

function loadPostsFromData(data, message) {
  state.posts = PostStore.saveDraftData(data).posts;
  sortPosts();
  state.selectedId = state.posts[0] ? state.posts[0].id : null;
  elements.status.textContent = message;
  fillForm(getSelectedPost());
  renderList();
}

async function importPostsFile(file) {
  if (!file) {
    return;
  }

  try {
    const data = JSON.parse(await file.text());
    loadPostsFromData(data, "posts.json импортирован и сохранен как черновик.");
  } catch (error) {
    elements.status.textContent = `Не удалось импортировать posts.json: ${error.message}`;
  } finally {
    elements.importInput.value = "";
  }
}

async function loadInitialPosts(ignoreDraft = false) {
  try {
    const data = await PostStore.getPostsData({ ignoreDraft });
    state.posts = data.posts;
    sortPosts();
    state.selectedId = state.posts[0] ? state.posts[0].id : null;
    elements.status.textContent = PostStore.getDraftData() && !ignoreDraft
      ? "Открыт локальный черновик из браузера."
      : "posts.json загружен.";
    fillForm(getSelectedPost());
    renderList();
  } catch (error) {
    elements.status.textContent = error.message;
  }
}

elements.form.addEventListener("input", updateSelectedPost);
elements.form.addEventListener("change", updateSelectedPost);
elements.search.addEventListener("input", renderList);
elements.newButton.addEventListener("click", addPost);
elements.duplicateButton.addEventListener("click", duplicatePost);
elements.previewButton.addEventListener("click", previewSelectedPost);
elements.deleteButton.addEventListener("click", deletePost);
elements.formatToolbar.addEventListener("click", (event) => {
  const button = event.target.closest("[data-format]");
  if (button) {
    applyFormat(button.dataset.format);
  }
});
elements.importButton.addEventListener("click", () => elements.importInput.click());
elements.importInput.addEventListener("change", () => importPostsFile(elements.importInput.files[0]));
elements.resetButton.addEventListener("click", resetDraft);
elements.saveApiUrl.value = localStorage.getItem(SAVE_API_URL_KEY) || "";
elements.saveApiSecret.value = sessionStorage.getItem(SAVE_API_SECRET_KEY) || "";
elements.saveApiUrl.addEventListener("change", () => {
  localStorage.setItem(SAVE_API_URL_KEY, elements.saveApiUrl.value.trim());
});
elements.saveApiSecret.addEventListener("change", () => {
  sessionStorage.setItem(SAVE_API_SECRET_KEY, elements.saveApiSecret.value.trim());
});
elements.saveButton.addEventListener("click", () => {
  savePostsFile().catch((error) => {
    elements.status.textContent = `Не удалось сохранить файл: ${error.message}`;
  });
});

elements.loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (elements.adminPassword.value === ADMIN_PASSWORD) {
    elements.adminPassword.value = "";
    elements.loginMessage.textContent = "";
    unlockAdmin();
    return;
  }

  elements.loginMessage.textContent = "Неверный пароль";
  elements.adminPassword.select();
});

if (isAdminUnlocked()) {
  unlockAdmin();
}
