export const getAvatarUrl = (avatar, API_BASE_URL) => {
  if (!avatar) return '/assets/images/ProfileInfo.svg';

  if (avatar.startsWith('http://') || avatar.startsWith('https://'))
    return avatar;
  return `${API_BASE_URL}${avatar}`;
};
