const API = "http://localhost:8000"

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers as Record<string, string>) },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || "Request failed")
  }
  return res.json()
}

async function uploadFile(path: string, file: File, token: string) {
  const form = new FormData()
  form.append("file", file)
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || "Upload failed")
  }
  return res.json()
}

export const api = {
  register: (data: { username: string; email: string; password: string }) =>
    request("/user/register", { method: "POST", body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request("/user/login", { method: "POST", body: JSON.stringify(data) }),

  uploadPostImage: (file: File, token: string) =>
    uploadFile("/user/post/upload-image", file, token),

  uploadProfilePic: (file: File, token: string) =>
    uploadFile("/user/upload-pic", file, token),

  createPost: (data: { title: string; caption?: string; image_url: string }, token: string) =>
    request("/user/post/create", {
      method: "POST",
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  likePost: (postId: number, token: string) =>
    request("/user/post/like", {
      method: "POST",
      body: JSON.stringify({ post_id: postId }),
      headers: { Authorization: `Bearer ${token}` },
    }),

  comment: (data: { post_id: number; comment: string }, token: string) =>
    request("/user/post/comment", {
      method: "POST",
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  getPosts: (token: string) =>
    request("/user/post/list", { headers: { Authorization: `Bearer ${token}` } }),

  getPost: (postId: number, token: string) =>
    request(`/user/post/${postId}`, { headers: { Authorization: `Bearer ${token}` } }),

  searchPosts: (q: string, token: string) =>
    request(`/user/post/search?q=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${token}` } }),

  getComments: (postId: number, token: string) =>
    request(`/user/post/${postId}/comments`, { headers: { Authorization: `Bearer ${token}` } }),

  getProfile: (token: string) =>
    request("/user/profile/me", { headers: { Authorization: `Bearer ${token}` } }),

  getUserProfile: (userId: number, token: string) =>
    request(`/user/profile/${userId}`, { headers: { Authorization: `Bearer ${token}` } }),

  updateProfile: (data: { username?: string; bio?: string }, token: string) =>
    request("/user/profile/update", {
      method: "PUT",
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  followUser: (userId: number, token: string) =>
    request(`/user/follow/${userId}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }),

  unfollowUser: (userId: number, token: string) =>
    request(`/user/unfollow/${userId}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }),

  sendMessage: (data: { receiver_id: number; content: string }, token: string) =>
    request("/chat/send", {
      method: "POST",
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  getMessages: (userId: number, token: string) =>
    request(`/chat/messages/${userId}`, { headers: { Authorization: `Bearer ${token}` } }),

  getConversations: (token: string) =>
    request("/chat/conversations", { headers: { Authorization: `Bearer ${token}` } }),

  getUnreadCount: (token: string) =>
    request("/chat/unread-count", { headers: { Authorization: `Bearer ${token}` } }),

  adminLogin: (data: { username: string; password: string }) =>
    request("/admin/login", { method: "POST", body: JSON.stringify(data) }),

  adminUsers: (token: string) =>
    request("/admin/users", { headers: { Authorization: `Bearer ${token}` } }),

  adminPosts: (token: string) =>
    request("/admin/posts", { headers: { Authorization: `Bearer ${token}` } }),
}
