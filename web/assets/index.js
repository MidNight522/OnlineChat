import { API_BASE_URL } from './api/config.js';
import {
  fetchMessages,
  createMessage,
  updateMessage,
  deleteMessage,
} from './api/messages.js';
import { getDateKey, formatDateSeparator } from './utils/date.js';
import { createMessageElement } from './ui/message.js';
import { getStoredUser } from './utils/storage.js';
import { openConfigMenu } from './ui/configMenu.js';
import { initChatForm } from './ui/chatForm.js';
import { initAuthUi, initLoggedInHeader, openProfileModal } from './ui/auth.js';
import { updateUserAvatar, deleteUserAvatar } from './api/user.js';

const root = document.getElementById('root');

const appContainer = document.createElement('div');
appContainer.classList.add('chat-container');
root.appendChild(appContainer);

const storedUser = getStoredUser();

let formMessageElement = null;
let messagesWrapperDiv = null;
let openedConfigMessageUuid = null;

let scrollToBottomBtn = null;
let shouldAutoScroll = true;

let inputValue = '';
let inputMessageElement = null;

let messageConfigBlock = null;
let messageConfigIsOpened = false;

let editingMessageUuid = null;

let profileModalOpen = false;

// ---------- helpers ----------
const ensureMessagesWrapper = () => {
  if (messagesWrapperDiv) return;

  messagesWrapperDiv = document.createElement('div');
  messagesWrapperDiv.classList.add('messages-wrapper');
  appContainer.appendChild(messagesWrapperDiv);

  messagesWrapperDiv.addEventListener('scroll', () => {
    shouldAutoScroll = checkIsNearBottom();

    if (shouldAutoScroll) {
      hideScrollToBottomButton();
    } else {
      showScrollToBottomButton();
    }
  });
};

const destroyMessageConfig = () => {
  if (!messageConfigBlock) return;

  appContainer.removeChild(messageConfigBlock);
  messageConfigBlock = null;
  messageConfigIsOpened = false;
  openedConfigMessageUuid = null;
};

const checkIsNearBottom = () => {
  if (!messagesWrapperDiv) return true;

  const distanceFromBottom =
    messagesWrapperDiv.scrollHeight -
    messagesWrapperDiv.scrollTop -
    messagesWrapperDiv.clientHeight;
  return distanceFromBottom < 100;
};

const ensureScrollBottomButton = () => {
  if (scrollToBottomBtn) return;

  scrollToBottomBtn = document.createElement('button');
  scrollToBottomBtn.type = 'button';
  scrollToBottomBtn.classList.add('scroll-to-bottom-btn');
  scrollToBottomBtn.innerText = '↓';

  scrollToBottomBtn.addEventListener('click', () => {
    if (!messagesWrapperDiv) return;

    shouldAutoScroll = true;
    hideScrollToBottomButton();

    messagesWrapperDiv.scrollTo({
      top: messagesWrapperDiv.scrollHeight,
      behavior: 'smooth',
    });

    setTimeout(() => {
      hideScrollToBottomButton();
    }, 300);
  });

  appContainer.appendChild(scrollToBottomBtn);
};

const showScrollToBottomButton = () => {
  ensureScrollBottomButton();
  scrollToBottomBtn.classList.add('visible');
};

const hideScrollToBottomButton = () => {
  if (!scrollToBottomBtn) return;
  scrollToBottomBtn.classList.remove('visible');
};

// menu-out close click
document.addEventListener('click', (e) => {
  if (!messageConfigIsOpened) return;

  // menu-in click
  if (messageConfigBlock && messageConfigBlock.contains(e.target)) return;

  destroyMessageConfig();
});

// ---------- UI: bottom form ----------
const initBottomFormMessage = () => {
  if (formMessageElement) return;

  const chatForm = initChatForm({
    root: appContainer,
    storedUser,
    inputValue,
    setInputValue: (value) => {
      inputValue = value;
    },
    getEditingMessageUuid: () => editingMessageUuid,
    resetEditingState: () => {
      editingMessageUuid = null;
    },
    onSendMessage: async ({ username, content, editingMessageUuid }) => {
      if (editingMessageUuid) {
        await updateMessage({
          uuid: editingMessageUuid,
          username,
          content,
        });
      } else {
        await createMessage({
          username,
          content,
        });
      }

      shouldAutoScroll = true;
      await initFetchMessages();
    },
  });

  formMessageElement = chatForm.formMessageElement;
  inputMessageElement = chatForm.inputMessageElement;
};

// ---------- API: fetch + render ----------
const initFetchMessages = async () => {
  try {
    const messages = await fetchMessages();

    ensureMessagesWrapper();
    messagesWrapperDiv.innerHTML = '';

    let previousDateKey = null;

    messages.forEach((message) => {
      // date separator
      const currentDateKey = getDateKey(message.created_at);

      if (currentDateKey !== previousDateKey) {
        const separator = document.createElement('div');
        separator.classList.add('date-separator');
        separator.innerText = formatDateSeparator(message.created_at);
        messagesWrapperDiv.appendChild(separator);

        previousDateKey = currentDateKey;
      }
      // message element
      const element = createMessageElement({
        message,
        storedUser,
        // config click handler
        onConfigClick: (message, event, messageDiv) => {
          if (!messageDiv) return;

          if (
            messageConfigIsOpened &&
            openedConfigMessageUuid === message.uuid
          ) {
            destroyMessageConfig();
            openedConfigMessageUuid = null;
            return;
          }

          if (messageConfigIsOpened) {
            destroyMessageConfig();
          }

          const containerRect = appContainer.getBoundingClientRect();
          const messageRect = messageDiv.getBoundingClientRect();

          const menuWidth = 194;
          const menuOffset = 8;

          const xCoord = messageRect.right - containerRect.left - menuWidth;
          const yCoord = messageRect.top - containerRect.top - menuOffset - 90;

          messageConfigBlock = openConfigMenu({
            root: appContainer,
            x: xCoord,
            y: Math.max(8, yCoord),
            message,
            storedUser,
            inputMessageElement,
            destroyMessageConfig,
            onEdit: (message) => {
              editingMessageUuid = message.uuid;
              inputValue = message.content || '';

              if (inputMessageElement) {
                inputMessageElement.value = inputValue;
              }
            },
            onDelete: async ({ uuid, username }) => {
              await deleteMessage({ uuid, username });
              await initFetchMessages();
            },
          });

          messageConfigIsOpened = true;
          openedConfigMessageUuid = message.uuid;
        },
      });

      messagesWrapperDiv.appendChild(element);
    });
    if (storedUser) initBottomFormMessage();
    if (shouldAutoScroll) {
      setTimeout(() => {
        messagesWrapperDiv.scrollTop = messagesWrapperDiv.scrollHeight;
        hideScrollToBottomButton();
      }, 0);
    } else {
      showScrollToBottomButton();
    }
  } catch (err) {
    console.log('Fetch messages error', err);
  }
};

// ---------- auth UI ----------
if (!storedUser) {
  initAuthUi({
    root: appContainer,
    onAuthSuccess: async (username, accessCode) => {
      const response = await fetch(`${API_BASE_URL}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, accessCode }),
      });

      const data = await response.json();

      if (!response.ok || !data.user) {
        console.log('Auth/Register error:', data);
        alert(data?.error?.message || 'Auth/Register failed');
        return;
      }

      localStorage.setItem('user', JSON.stringify(data.user));
      document.location.reload();
    },
  });
} else {
  initLoggedInHeader({
    root: appContainer,
    storedUser,
    onProfileClick: () => {
      if (profileModalOpen) {
        const modal = document.querySelector('.dialog-auth-wrapper');
        if (modal) modal.remove();

        profileModalOpen = false;
        return;
      }
      profileModalOpen = true;

      openProfileModal({
        root,
        storedUser,

        onClose: () => {
          profileModalOpen = false;
        },

        onLogout: () => {
          localStorage.removeItem('user');
          document.location.reload();
        },

        onJoin: async (username, accessCode) => {
          const response = await fetch(`${API_BASE_URL}/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, accessCode }),
          });

          const data = await response.json();

          if (!response.ok || !data.user) {
            throw new Error(data?.error?.message || 'Auth failed');
          }

          localStorage.setItem('user', JSON.stringify(data.user));
          document.location.reload();
        },

        onChangePicture: () => {
          const fileInput = document.createElement('input');
          fileInput.type = 'file';
          fileInput.accept = 'image/*';

          fileInput.addEventListener('change', async () => {
            const file = fileInput.files?.[0];
            if (!file) return;

            try {
              const data = await updateUserAvatar({
                username: storedUser.username,
                file,
              });

              localStorage.setItem('user', JSON.stringify(data.user));
              document.location.reload();
            } catch (error) {
              console.log('Avatar upload error:', error);
              alert('Failed to update picture');
            }
          });

          fileInput.click();
        },

        onDeletePicture: async () => {
          try {
            const data = await deleteUserAvatar({
              username: storedUser.username,
            });

            localStorage.setItem('user', JSON.stringify(data.user));
            document.location.reload();
          } catch (error) {
            console.log('Avatar delete error:', error);
            alert('Failed to delete picture');
          }
        },
      });
    },
  });
}

// start
if (storedUser) {
  initFetchMessages();
  setInterval(initFetchMessages, 3000);
}
