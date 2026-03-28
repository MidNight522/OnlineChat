export const fetchMessages = async () => {
  const res = await fetch('/api/messages');
  if (!res.ok) {
    throw new Error('Failed to fetch messages');
  }
  const body = await res.json();
  return body.messages || [];
};

export const createMessage = async ({ username, content }) => {
  const response = await fetch('/api/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, content }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw err;
  }

  return response.json();
};

export const updateMessage = async ({ uuid, username, content }) => {
  const response = await fetch(`/api/message/${uuid}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, content }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw err;
  }

  return response.json();
};

export const deleteMessage = async ({ uuid, username }) => {
  const response = await fetch(`/api/message/${uuid}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw err;
  }

  return response.json();
};
