(function () {
  const STORAGE_KEY = "postList.postsData";

  async function fetchPostsData() {
    const response = await fetch("posts.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Не удалось загрузить posts.json");
    }
    return response.json();
  }

  function normalizeData(data) {
    const posts = Array.isArray(data && data.posts) ? data.posts : [];
    return {
      posts: posts
        .map((post) => ({
          id: Number(post.id),
          category: post.category || "info",
          title: post.title || "",
          image: post.image || "",
          content: post.content || "",
          hidden: Boolean(post.hidden),
        }))
        .filter((post) => Number.isFinite(post.id)),
    };
  }

  function getDraftData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      return normalizeData(JSON.parse(raw));
    } catch (error) {
      console.warn("Черновик posts.json поврежден и будет пропущен", error);
      return null;
    }
  }

  async function getPostsData(options = {}) {
    if (!options.ignoreDraft) {
      const draft = getDraftData();
      if (draft) {
        return draft;
      }
    }

    try {
      return normalizeData(await fetchPostsData());
    } catch (error) {
      if (window.location.protocol === "file:") {
        throw new Error("Браузер блокирует чтение posts.json из file://. Откройте admin.html через http://127.0.0.1:4173/admin.html или импортируйте posts.json кнопкой импорта.");
      }
      throw error;
    }
  }

  function saveDraftData(data) {
    const normalized = normalizeData(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  }

  function clearDraftData() {
    localStorage.removeItem(STORAGE_KEY);
  }

  window.PostStore = {
    STORAGE_KEY,
    clearDraftData,
    getDraftData,
    getPostsData,
    saveDraftData,
  };
})();
