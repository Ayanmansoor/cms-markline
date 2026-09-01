import apiClient from '@/lib/api/client'

export interface UploadResponse {
  success: boolean
  url: string
}

export interface FoldersResponse {
  folders: string[]
}

export const uploadService = {
  uploadFile: async (file: File, folder?: string): Promise<UploadResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    if (folder) {
      formData.append('folder', folder)
    }
    const res = await apiClient.post<UploadResponse>('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return res.data
  },

  getFolders: async (): Promise<FoldersResponse> => {
    const res = await apiClient.get<FoldersResponse>('/api/upload/folders')
    return res.data
  },

  uploadVideo: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await apiClient.post<{ url: string }>('/api/upload/video', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return res.data
  },
}
