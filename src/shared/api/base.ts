import axios from 'axios'
import type { AxiosInstance, AxiosResponse } from 'axios'
import { toast } from 'sonner'

const apiBaseUrl = import.meta.env.VITE_API_URL || ''

export const apiClient: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error) => {
    const message = error.response?.data?.message || 'An error occurred'
    toast.error(message)
    return Promise.reject(error)
  },
)
