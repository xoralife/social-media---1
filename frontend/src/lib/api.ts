const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export function getImageUrl(url: string): string {
  if (!url) return ""
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  return `${API}${url}`
}

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

  createPost: (data: { title: string; caption?: string; image_url: string; media_type?: string }, token: string) =>
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

  unlikePost: (postId: number, token: string) =>
    request(`/user/post/like/${postId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }),

  comment: (data: { post_id: number; comment: string; parent_id?: number }, token: string) =>
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

  sendMessage: (data: { receiver_id: number; content?: string; media_type?: string; media_url?: string }, token: string) =>
    request("/chat/send", {
      method: "POST",
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  uploadVoice: (file: Blob, token: string) => {
    const ext = file.type.includes("mp4") ? "mp4" : file.type.includes("ogg") ? "ogg" : "webm"
    const form = new FormData()
    form.append("file", file, `voice.${ext}`)
    return fetch(`${API}/chat/upload-voice`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    }).then(async res => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }))
        throw new Error(err.detail || "Upload failed")
      }
      return res.json()
    })
  },

  getMessages: (userId: number, token: string) =>
    request(`/chat/messages/${userId}`, { headers: { Authorization: `Bearer ${token}` } }),

  getConversations: (token: string) =>
    request("/chat/conversations", { headers: { Authorization: `Bearer ${token}` } }),

  deleteMessage: (messageId: number, token: string) =>
    request(`/chat/message/${messageId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }),

  deletePost: (postId: number, token: string) =>
    request(`/user/post/${postId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }),

  favoritePost: (postId: number, token: string) =>
    request("/user/post/favorite", {
      method: "POST",
      body: JSON.stringify({ post_id: postId }),
      headers: { Authorization: `Bearer ${token}` },
    }),

  unfavoritePost: (postId: number, token: string) =>
    request(`/user/post/favorite/${postId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }),

  getFavorites: (token: string) =>
    request("/user/post/favorites", { headers: { Authorization: `Bearer ${token}` } }),

  getLikedPosts: (token: string) =>
    request("/user/post/liked", { headers: { Authorization: `Bearer ${token}` } }),

  deleteAccount: (token: string) =>
    request("/user/account", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }),

  getFollowers: (token: string) =>
    request("/user/followers", { headers: { Authorization: `Bearer ${token}` } }),

  getFollowing: (token: string) =>
    request("/user/following", { headers: { Authorization: `Bearer ${token}` } }),

  getUserFollowers: (userId: number, token: string) =>
    request(`/user/${userId}/followers`, { headers: { Authorization: `Bearer ${token}` } }),

  getUserFollowing: (userId: number, token: string) =>
    request(`/user/${userId}/following`, { headers: { Authorization: `Bearer ${token}` } }),

  getUnreadCount: (token: string) =>
    request("/chat/unread-count", { headers: { Authorization: `Bearer ${token}` } }),

  adminLogin: (data: { username: string; password: string }) =>
    request("/admin/login", { method: "POST", body: JSON.stringify(data) }),

  adminUsers: (token: string, search?: string) =>
    request(`/admin/users${search ? `?search=${encodeURIComponent(search)}` : ""}`, { headers: { Authorization: `Bearer ${token}` } }),

  adminPosts: (token: string, search?: string) =>
    request(`/admin/posts${search ? `?search=${encodeURIComponent(search)}` : ""}`, { headers: { Authorization: `Bearer ${token}` } }),

  adminUpdateUser: (userId: number, data: { username?: string; email?: string; account_status?: string; bio?: string }, token: string) =>
    request(`/admin/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminDeletePost: (postId: number, token: string) =>
    request(`/admin/posts/${postId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminDeleteUser: (userId: number, token: string) =>
    request(`/admin/users/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminAnalytics: (token: string) =>
    request("/admin/analytics", { headers: { Authorization: `Bearer ${token}` } }),
}
