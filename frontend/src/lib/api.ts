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

export const api = {
  register: (data: { username: string; email: string; password: string }) =>
    request("/user/register", { method: "POST", body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request("/user/login", { method: "POST", body: JSON.stringify(data) }),

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

  adminLogin: (data: { username: string; password: string }) =>
    request("/admin/login", { method: "POST", body: JSON.stringify(data) }),

  adminUsers: (token: string) =>
    request("/admin/users", { headers: { Authorization: `Bearer ${token}` } }),

  adminPosts: (token: string) =>
    request("/admin/posts", { headers: { Authorization: `Bearer ${token}` } }),
}
