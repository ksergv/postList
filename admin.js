const state = {
  posts: [],
  selectedId: null,
};

const elements = {
  content: document.getElementById("postContent"),
  deleteButton: document.getElementById("deletePostButton"),
  duplicateButton: document.getElementById("duplicatePostButton"),
  form: document.getElementById("postForm"),
  id: document.getElementById("postId"),
  image: document.getElementById("postImage"),
  importButton: document.getElementById("importFileButton"),
  importInput: document.getElementById("importFileInput"),
  list: document.getElementById("adminPostList"),
  newButton: document.getElementById("addPostButton"),
  preview: document.getElementById("postPreview"),
  resetButton: document.getElementById("resetDraftButton"),
  saveButton: document.getElementById("saveFileButton"),
  search: document.getElementById("postSearch"),
  status: document.getElementById("statusText"),
  category: document.getElementById("postCategory"),
  title: document.getElementById("postTitle"),
};

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
      item.innerHTML = `<strong>${post.id}. ${post.title || "Без заголовка"}</strong><span>${post.category} · ${post.image || "без картинки"}</span>`;
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
  elements.content.value = post ? post.content : "";
  renderPreview(post);
}

function selectPost(id) {
  state.selectedId = Number(id);
  fillForm(getSelectedPost());
  renderList();
}

function readFormPost() {
  return {
    id: Number(elements.id.value),
    category: elements.category.value,
    title: elements.title.value.trim(),
    image: elements.image.value.trim(),
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

function addPost() {
  const post = {
    id: getNextId(),
    category: "info",
    title: "Новый пост",
    image: "img/background.jpg",
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
elements.deleteButton.addEventListener("click", deletePost);
elements.importButton.addEventListener("click", () => elements.importInput.click());
elements.importInput.addEventListener("change", () => importPostsFile(elements.importInput.files[0]));
elements.resetButton.addEventListener("click", resetDraft);
elements.saveButton.addEventListener("click", () => {
  savePostsFile().catch((error) => {
    elements.status.textContent = `Не удалось сохранить файл: ${error.message}`;
  });
});

loadInitialPosts();
