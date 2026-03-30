import { API_BASE_URL } from '../api/config.js';
import { formatTime } from '../utils/date.js';

export const createMessageElement = ({
  message,
  storedUser,
  onConfigClick,
}) => {
  const isUserAuthorOfMessage =
    storedUser && message.username === storedUser.username;

  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message');

  if (isUserAuthorOfMessage) {
    messageDiv.classList.add('message-of-mine');
  }

  // content wrapper
  const content = document.createElement('div');
  content.classList.add('message-content');

  // header
  const header = document.createElement('div');
  header.classList.add('message-header');

  // time
  const time = document.createElement('span');
  time.classList.add('message-time');
  time.innerText = formatTime(message.created_at);

  if (!isUserAuthorOfMessage) {
    // avatar
    const messageAvatarImg = document.createElement('img');
    messageAvatarImg.classList.add('message-avatar');
    messageAvatarImg.setAttribute(
      'src',
      message.avatar
        ? `${API_BASE_URL}${message.avatar}`
        : '/assets/images/ProfileInfo.svg',
    );
    messageAvatarImg.setAttribute('width', 32);
    messageAvatarImg.setAttribute('height', 32);

    // username
    const username = document.createElement('span');
    username.classList.add('message-username');
    username.innerText = message.username || 'Unknown';

    header.appendChild(username);
    header.appendChild(time);

    messageDiv.appendChild(messageAvatarImg);
  } else {
    header.classList.add('message-header-own');
    header.appendChild(time);
  }

  // message text
  const text = document.createElement('div');
  text.classList.add('message-text');
  text.innerHTML = message.content || '';

  if (message.was_edited === 'true') {
    const edited = document.createElement('span');
    edited.classList.add('message-edited');
    edited.innerText = ' (edited)';
    text.appendChild(edited);
  }

  content.appendChild(header);
  content.appendChild(text);

  messageDiv.appendChild(content);

  // config button
  if (isUserAuthorOfMessage) {
    const configBtn = document.createElement('button');
    configBtn.type = 'button';
    configBtn.innerText = '⋯';
    configBtn.classList.add('config-button');

    configBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      onConfigClick(message, event, messageDiv);
    });

    messageDiv.appendChild(configBtn);
  }

  return messageDiv;
};
