// =======================================
// CONFIG
// =======================================

// ===== API BASE URL =====
const API_URL = "https://social-media-api-b7j1.onrender.com";
window.API_URL = API_URL;

// =======================================
// GLOBAL HELPERS (UI / AUTH)
// =======================================

// ===== SHOW ALERT MESSAGE =====
function showAlert(message, type = "success") {
  let alertPlaceholder = document.getElementById("alert");
  if (!alertPlaceholder) {
    alertPlaceholder = document.createElement("div");
    alertPlaceholder.id = "alert";

    alertPlaceholder.style.position = "fixed";
    alertPlaceholder.style.right = "20px";
    alertPlaceholder.style.bottom = "20px";
    alertPlaceholder.style.zIndex = "9999";

    document.body.appendChild(alertPlaceholder);
  }
  if (window.innerWidth < 768) {
    alertPlaceholder.style.width = "90%";
  } else {
    alertPlaceholder.style.width = "30%";
  }

  const wrapper = document.createElement("div");

  wrapper.innerHTML = `
  
    <div
      class="alert alert-${type} alert-dismissible fade show"
      role="alert"
    >

      ${message}

      <button
        type="button"
        class="btn-close"
        data-bs-dismiss="alert"
      ></button>

    </div>
  `;

  alertPlaceholder.append(wrapper);

  setTimeout(() => {
    const alert = bootstrap.Alert.getOrCreateInstance(
      wrapper.firstElementChild,
    );

    alert.close();
  }, 2000);
}
// ===== GLOBAL ALERTS =====
window.addEventListener("DOMContentLoaded", function () {
  const message = localStorage.getItem("message");
  const type = localStorage.getItem("type");

  if (message) {
    showAlert(message, type || "success");

    localStorage.removeItem("message");
    localStorage.removeItem("type");
  }
});
// ===== TOGGLE LOADER =====
function toggleLoader(show = true) {
  const loader = document.getElementById("loader");

  if (show) {
    loader.style.display = "flex";
  } else {
    loader.style.display = "none";
  }
}
// ===== GET CURRENT USER =====
function getCurrentUser() {
  let user = null;
  const storageUser = localStorage.getItem("user");
  if (storageUser != null) {
    user = JSON.parse(storageUser);
  }
  return user;
}

// =======================================
// AUTH (LOGOUT / USER STATE)
// =======================================

// ===== UPDATE HEADER UI =====
function updateHeaderUI() {
  let token = localStorage.getItem("token");
  const profileImage = document.getElementById("profile_image");
  const user = getCurrentUser();
  const addBtn = document.getElementById("add-btn");
  const commentBtn = document.getElementById("comment-btn");

  if (token == null) {
    document.getElementById("logout-btn").style.display = "none";
    document.getElementById("register-btn").style.display = "block";
    document.getElementById("login-btn").style.display = "block";
    document.getElementById("nav-user").innerHTML = "";

    if (addBtn) addBtn.style.display = "none";
    if (commentBtn) commentBtn.style.display = "none";

    if (profileImage) {
      profileImage.src = "";
      profileImage.style.display = "none";
    }
  } else {
    document.getElementById("register-btn").style.display = "none";
    document.getElementById("login-btn").style.display = "none";
    document.getElementById("logout-btn").style.display = "block";

    if (addBtn) addBtn.style.display = "block";
    if (commentBtn) commentBtn.style.display = "flex";

    if (user) {
      document.getElementById("nav-user").innerHTML = user.username;
    }

    if (profileImage && user) {
      profileImage.style.display = "block";
      profileImage.src = user.image;
    }
  }
}
// ===== LOGOUT USER =====
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  localStorage.setItem("message", "Logged out successfully");

  window.location.href = "../index.html";
}

// =======================================
// PROFILE NAVIGATION
// =======================================

// ===== OPEN CURRENT USER PROFILE =====
function profileClicked() {
  const user = getCurrentUser();
  if (!user || !user.id) return;
  window.location.href = `/pages/profile.html?id=${user.id}`;
}
// ===== OPEN USER PROFILE =====
function openProfile(event, id) {
  event.stopPropagation();
  window.location.href = `/pages/profile.html?id=${id}`;
}

// =======================================
// POSTS FEATURE (CRUD + UI + NAVIGATION)
// =======================================

// ===== OPEN CREATE POST MODAL =====
function addBtnClicked() {
  let postModal = new bootstrap.Modal(
    document.getElementById("post-modal"),
    {},
  );

  postModal.toggle();

  document.getElementById("post-header").innerHTML = "Create A New Post";
  document.getElementById("post-modal-submit-btn").innerHTML = "Create";

  const postIdInput = document.getElementById("post-id-input");
  const postTitle = document.getElementById("post-title");
  const postMessage = document.getElementById("post-message");
  postIdInput.value = "";
  postTitle.value = "";
  postMessage.value = "";
}
// ===== CREATE / UPDATE POST =====
function savePost() {
  let token = localStorage.getItem("token");

  let postId = document.getElementById("post-id-input").value;
  let isCreat = postId == null || postId == "";

  const postTitle = document.getElementById("post-title").value;
  const postMessage = document.getElementById("post-message").value;
  const postImage = document.getElementById("post-image").files[0];

  let formData = new FormData();
  formData.append("title", postTitle);
  formData.append("body", postMessage);
  formData.append("image", postImage);
  toggleLoader(true);

  if (isCreat) {
    axios
      .post(`${API_URL}/api/v1/posts`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        localStorage.setItem("message", response.data.message);
        location.reload();
      })
      .catch((error) => {
        console.error(error);
        showAlert(error.response.data.message, error.response.data.type);
      })
      .finally(() => {
        toggleLoader(false);
      });
  } else {
    axios
      .patch(`${API_URL}/api/v1/posts/${postId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        localStorage.setItem("message", response.data.message);
        location.reload();
      })
      .catch((error) => {
        console.error(error);
        showAlert(error.response.data.message, error.response.data.type);
      })
      .finally(() => {
        toggleLoader(false);
      });
  }
}
// ===== CREATE POST CARD =====
function createPostCard(post, clickable = true) {
  let user = getCurrentUser();
  let isMyPost = user != null && post.author.id == user.id;
  let isMobile = window.innerWidth <= 576;

  let editBtnContent = "";
  if (isMyPost) {
    editBtnContent = ` <div class="d-flex gap-2 ms-auto">
        <button onclick="editPost(event,'${encodeURIComponent(JSON.stringify(post))}')" id="edit-btn" class="btn btn-secondary  ${isMobile ? "btn-sm" : ""}" " >edit</button>
        <button onclick="deletePostBtnClicked(event,'${encodeURIComponent(JSON.stringify(post))}')" id="delete-btn" class="btn btn-danger  ${isMobile ? "btn-sm" : ""}"">delete</button>
        </div>
        `;
  }
  return `
          <div class="post mt-4" ${clickable ? `onclick="openPost(${post.id})"` : ""}>
           <div class="card shadow">
            <div class="card-header d-flex justify-content-between align-items-center " >
             <div class="d-flex align-items-center flex-grow-1 overflow-hidden">
              <img
                src="${post.author.profile_image}"
                alt="profile-image"
                style="width: 40px; height: 40px ; cursor: pointer"
                class="rounded-circle border border-2"
                onclick="openProfile(event,${post.author.id})"
                />
              <b class="ms-2 text-truncate" style="cursor: pointer " onclick="openProfile(event,${post.author.id})">@${post.author.username}</b>
               </div>
              ${editBtnContent}
              </div>
             <div class="card-body">
              ${
                post.image
                  ? `
              <img
                src="${post.image}"
                alt=""
                class="img-fluid w-100 "
                id="post-img"
              />`
                  : ""
              }
                <h6 class="mt-1" style="color: rgb(163, 163, 163)">
                ${new Date(post.created_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                </h6>
                <h5 >${post.title}</h5>
                <p>${post.body}</p>
                <hr />
                <div>
                  <span ><i class="fa-regular fa-comment"></i> ${post.comments_count} </span>
                </div>
              </div>
            </div> 
          </div>`;
}
// ===== OPEN POST DETAILS =====
function openPost(id) {
  window.location.href = `/pages/singlepost.html?id=${id}`;
}
// ===== EDIT POST =====
function editPost(event, postOb) {
  event.stopPropagation();

  let post = JSON.parse(decodeURIComponent(postOb));

  let postModal = new bootstrap.Modal(
    document.getElementById("post-modal"),
    {},
  );

  postModal.toggle();
  document.getElementById("post-id-input").value = post.id;
  document.getElementById("post-header").innerHTML = "Edit Post";
  document.getElementById("post-modal-submit-btn").innerHTML = "Edit";
  document.getElementById("post-title").value = post.title;
  document.getElementById("post-message").value = post.body;
}
// ===== DELETE POST BUTTON CLICK =====
function deletePostBtnClicked(event, postOb) {
  event.stopPropagation();
  let post = JSON.parse(decodeURIComponent(postOb));
  document.getElementById("delete-id-input").value = post.id;
  document.getElementById("delete-post-title").innerHTML = post.title;

  let postModal = new bootstrap.Modal(
    document.getElementById("delete-post-modal"),
    {},
  );
  postModal.toggle();
}
// ===== CONFIRM POST DELETION =====
function confirmPostDelete() {
  const token = localStorage.getItem("token");
  let postId = document.getElementById("delete-id-input").value;
  toggleLoader(true);

  axios
    .delete(`${API_URL}/api/v1/posts/${postId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((response) => {
      if (window.location.pathname.includes("/pages/singlepost.html")) {
        localStorage.setItem("message", response.data.message);
        localStorage.setItem("type", "success");

        window.location.href = "../index.html";
        return;
      }

      const modal = document.getElementById("delete-post-modal");
      const modalInstance = bootstrap.Modal.getInstance(modal);

      modalInstance.hide();
      showAlert(response.data.message, response.data.type);

      document.getElementById("posts").innerHTML = "";
      currentPage = 1;
      hasMorePosts = true;
      getPosts();
    })
    .catch((error) => {
      console.error(error);
      showAlert(error.response.data.message, error.response.data.type);
    })
    .finally(() => {
      toggleLoader(false);
    });
}

window.savePost = savePost;
window.openPost = openPost;
window.openProfile = openProfile;
window.profileClicked = profileClicked;
window.logout = logout;
window.editPost = editPost;
window.confirmPostDelete = confirmPostDelete;
window.addBtnClicked = addBtnClicked;
window.deletePostBtnClicked = deletePostBtnClicked;
