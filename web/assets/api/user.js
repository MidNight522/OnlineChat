export const updateUserAvatar = async ({ username, file }) => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('avatar', file);

  const response = await fetch('/api/user', {
    method: 'PATCH',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text().catch(() => '');
    throw new Error(err || 'Failed to update avatar');
  }

  return response.json();
};

export const deleteUserAvatar = async ({ username }) => {
  const response = await fetch('/api/user/avatar', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => '');
    throw new Error(err || 'Failed to delete avatar');
  }

  return response.json();
};
