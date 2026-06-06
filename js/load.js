// Function to get the selected sort order
function getSelectedSortOrder() {
  const sortOrderSelect = document.getElementById('sortOrder');
  return sortOrderSelect ? sortOrderSelect.value : 'asc';
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getYouTubeVideoId(content) {
  const match = String(content).match(/(?:youtube\.com\/(?:embed\/|watch\?v=|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
  return match ? match[1] : "";
}

function getTextPreview(content, maxLength = 200) {
  const preview = document.createElement("div");
  preview.innerHTML = content || "";
  preview.querySelectorAll("script, style, iframe, .youtube-embed").forEach((node) => node.remove());
  const text = preview.textContent.replace(/\s+/g, " ").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()} ...` : text;
}

function getYouTubePreviewHtml(content) {
  const videoId = getYouTubeVideoId(content);
  if (!videoId) {
    return "";
  }

  return `<div class="youtube-card-preview" role="button" tabindex="0" aria-label="Открыть пост с YouTube видео">
    <img src="https://img.youtube.com/vi/${videoId}/hqdefault.jpg" alt="">
    <span class="youtube-card-play" aria-hidden="true"></span>
  </div>`;
}

// Function to load and display all posts
function loadPosts() {
  const sortOrder = getSelectedSortOrder();
  PostStore.getPostsData()
    .then(data => {
      const posts = data.posts || [];
      const postList = document.getElementById('postList');
      postList.innerHTML = '';
      posts
        .filter(post => !post.hidden)
        .sort((a, b) => sortOrder === 'asc' ? a.id - b.id : b.id - a.id)
        .forEach(post => {
        const listItem = document.createElement('li');
        listItem.classList.add(`${post.category}`);
        listItem.classList.add('card');
        const previewText = getTextPreview(post.content);
        const youtubePreview = getYouTubePreviewHtml(post.content);
        const button = document.createElement('button');
        button.textContent = "Перейти";
        const openPost = () => {
          window.location.href = `one.html?id=${post.id}`;
        };
        button.addEventListener('click', openPost);
        listItem.addEventListener('click', (event) => {
          if (event.target.closest('.youtube-card-preview')) {
            openPost();
          }
        });
        listItem.addEventListener('keydown', (event) => {
          if (event.target.closest('.youtube-card-preview') && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            openPost();
          }
        });
        listItem.innerHTML = `<h2>${escapeHtml(post.title)}</h2>${youtubePreview}<p>${escapeHtml(previewText)}</p>`;
        listItem.appendChild(button);
        postList.appendChild(listItem);
        });

      // Trigger contentLoaded event after loading posts
      $(document).trigger("contentLoaded");
    })
    .catch(error => console.error('Ошибка:', error));
}

// Load posts when the page is loaded
window.onload = loadPosts;
