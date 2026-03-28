export const getStoredUser = () => {
  const raw = localStorage.getItem('user');
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (e) {
    console.log('Bad user in localStorage, clearing...');
    localStorage.removeItem('user');
    return null;
  }
};
