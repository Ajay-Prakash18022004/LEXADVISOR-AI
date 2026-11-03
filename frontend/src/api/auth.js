import client from './client';

export const loginUser = async (email, password, role = null) => {
  const payload = { email, password };
  if (role) payload.role = role;
  const response = await client.post('/auth/login', payload);
  return response.data;
};

export const registerUser = async (data) => {
  // Supports both simple (name, email, password) and full advocate registration
  const payload = typeof data === 'object' ? data : { name: arguments[0], email: arguments[1], password: arguments[2] };
  const response = await client.post('/auth/register', payload);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await client.get('/auth/me');
  return response.data;
};

export const googleLogin = async (data = {}) => {
  const response = await client.post('/auth/google', {
    email: data.email || 'sureshtakur194@gmail.com',
    name: data.name || 'Suresh Thakur',
    role: data.role || 'client',
    avatar: data.avatar || null
  });
  return response.data;
};

export const updateUserProfile = async (profileData) => {
  const response = await client.put('/auth/profile', profileData);
  return response.data;
};

export const updateAdvocateProfile = async (profileData) => {
  const response = await client.put('/auth/advocate/profile', profileData);
  return response.data;
};
