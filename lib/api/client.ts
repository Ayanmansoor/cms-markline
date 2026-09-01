import axios from 'axios'

export const apiClient = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add response interceptor for consistent error extraction
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred'
    return Promise.reject(new Error(message))
  }
)

export default apiClient
