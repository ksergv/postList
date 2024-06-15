// Function to get the selected sort order
function getSelectedSortOrder() {
  const sortOrderSelect = document.getElementById('sortOrder');
  return sortOrderSelect ? sortOrderSelect.value : 'asc';
}

// Function to load and display all posts
function loadPosts() {
  const sortOrder = getSelectedSortOrder();
  fetch('posts.json')
    .then(response => response.json())
    .then(data => {
      const posts = data.posts || [];
      const postList = document.getElementById('postList');
      postList.innerHTML = '';
      posts.sort((a, b) => sortOrder === 'asc' ? a.id - b.id : b.id - a.id);
      posts.forEach(post => {
        const listItem = document.createElement('li');
        listItem.classList.add(`${post.category}`);
        listItem.classList.add('card');
        const shortenedContent = post.content.slice(0, 200);
        const button = document.createElement('button');
        button.textContent = "Перейти";
        button.addEventListener('click', () => {
          window.location.href = `one.html?id=${post.id}`;
        });
        listItem.innerHTML = `<h2>${post.title}</h2> ${shortenedContent} ...`;
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
