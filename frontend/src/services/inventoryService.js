import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL + '/api/inventory';

export const getInventory = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const url = params ? `${API_URL}?${params}` : API_URL;
  const token = localStorage.getItem('auth_token');
  const response = await axios.get(url, {
    withCredentials: true,
    headers: {
      Authorization: token ? `Bearer ${token}` : undefined,
    },
  });
  return response.data;
};
