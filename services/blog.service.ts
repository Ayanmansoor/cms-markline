import apiClient from '@/lib/api/client'

export const blogService = {
  getBlogs: async () => {
    const res = await apiClient.get('/api/blogs')
    return res.data
  },

  getBlogById: async (id: string | number) => {
    const res = await apiClient.get(`/api/blogs/${id}`)
    return res.data
  },

  createBlog: async (payload: any) => {
    const res = await apiClient.post('/api/blogs', payload)
    return res.data
  },

  updateBlog: async (id: string | number, payload: any) => {
    const res = await apiClient.put(`/api/blogs/${id}`, payload)
    return res.data
  },

  deleteBlog: async (id: string | number) => {
    const res = await apiClient.delete(`/api/blogs/${id}`)
    return res.data
  },
}
