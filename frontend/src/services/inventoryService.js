import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL + '/api/inventory';

export const getInventory = async (filter = filter) => {
  const param = new URLSearchParams(filter).toString();
  const url = param ? `${API_URL}?${param}` : API_URL;
  const token = localStorage.getItem('auth_token');
  const response = await axios.get(url, {
    withCredentials: true,
    headers: {
      Authorization: token ? `Bearer ${token}` : undefined,
    },
  });
  return response.data;
};
