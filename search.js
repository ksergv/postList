  
  // Function to display a post
  function displayPost(post) {
    const postList = document.getElementById('postList');
    postList.classList.remove('post-grid'); // Remove the 'post-grid' class
    const listItem = document.createElement('li');
    listItem.classList.add('post');
    listItem.innerHTML = `
      <h2>${post.title}</h2>
      <p>${post.content}</p>
    `;
      // Создаем кнопку возврата
      const button = document.createElement('button');
      button.textContent = "Вернуться";
      // При нажатии на кнопку вызываем функцию для перехода на index.html
      button.addEventListener('click', () => {
          window.location.href = `index.html`;
      }); 
    listItem.appendChild(button);  
    postList.appendChild(listItem);
  }
  
  // Function to search for posts by text in title and content
  function searchPosts() {
    const searchText = document.getElementById('searchText').value.toLowerCase();
    fetch('posts.json')
      .then(response => response.json())
      .then(data => data.posts) 
      .then(posts => {
      const postList = document.getElementById('postList');
      postList.innerHTML = '';
  
      const filteredPosts = posts.filter(post => 
        post.title.toLowerCase().includes(searchText) || 
        post.content.toLowerCase().includes(searchText)
      );
  
      if (filteredPosts.length > 0) {
        filteredPosts.forEach(displayPost);
      } else {
        alert('No posts found');
      }
    });
  }
  
  // Load all posts initially (optional, if you want to display all posts at the start)
  // loadPosts().then(posts => posts.forEach(displayPost));
  