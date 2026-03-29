export const initChatForm = ({
  root,
  storedUser,
  inputValue,
  setInputValue,
  getEditingMessageUuid,
  resetEditingState,
  onSendMessage,
}) => {
  const formMessageElement = document.createElement('form');
  formMessageElement.classList.add('bottom-form');

  const inputWrapper = document.createElement('div');
  inputWrapper.classList.add('input-wrapper');

  const inputMessageElement = document.createElement('textarea');
  inputMessageElement.classList.add('input-message');
  inputMessageElement.placeholder = 'Write a message...';
  inputMessageElement.value = inputValue || '';
  inputMessageElement.maxLength = 760;

  const charCounter = document.createElement('div');
  charCounter.classList.add('char-counter');
  charCounter.innerText = `${inputMessageElement.value.length} / 760`;

  inputMessageElement.addEventListener('input', (event) => {
    setInputValue(event.target.value);
  });

  inputMessageElement.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      formMessageElement.requestSubmit();
    }
  });

  const editButton = document.createElement('button');
  editButton.type = 'button';
  editButton.classList.add('edit-button');

  const editIcon = document.createElement('img');
  editIcon.src = '/assets/images/editButton.svg';
  editIcon.alt = 'editButton';

  editButton.appendChild(editIcon);

  const emojiButton = document.createElement('button');
  emojiButton.type = 'button';
  emojiButton.classList.add('emoji-button');

  const emojiIcon = document.createElement('img');
  emojiIcon.src = '/assets/images/emotion.svg';
  emojiIcon.alt = 'emoji';

  emojiButton.appendChild(emojiIcon);

  const emojiPicker = document.createElement('emoji-picker');
  emojiPicker.classList.add('emoji-picker');
  emojiPicker.style.display = 'none';

  const sendButton = document.createElement('button');
  sendButton.classList.add('send-message-button');
  sendButton.type = 'submit';

  const sendIcon = document.createElement('img');
  sendIcon.src = '/assets/images/btn_send.svg';
  sendIcon.alt = 'sendButton';

  sendButton.appendChild(sendIcon);

  inputWrapper.appendChild(inputMessageElement);
  inputWrapper.appendChild(charCounter);
  inputWrapper.appendChild(editButton);
  inputWrapper.appendChild(emojiButton);
  inputWrapper.appendChild(emojiPicker);
  inputWrapper.appendChild(sendButton);

  formMessageElement.appendChild(inputWrapper);

  emojiButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();

    const isVisible = emojiPicker.style.display === 'block';
    emojiPicker.style.display = isVisible ? 'none' : 'block';
  });

  emojiPicker.addEventListener('emoji-click', (event) => {
    const emoji = event.detail.unicode;

    const cursorStart = inputMessageElement.selectionStart;
    const cursorEnd = inputMessageElement.selectionEnd;

    const text = inputMessageElement.value;

    inputMessageElement.value =
      text.slice(0, cursorStart) + emoji + text.slice(cursorEnd);

    inputMessageElement.focus();

    setInputValue(inputMessageElement.value);
  });

  document.addEventListener('click', (e) => {
    if (!emojiPicker.contains(e.target) && !emojiButton.contains(e.target)) {
      emojiPicker.style.display = 'none';
    }
  });

  inputMessageElement.addEventListener('input', (event) => {
    const value = event.target.value;

    setInputValue(value);

    inputMessageElement.style.height = 'auto';
    inputMessageElement.style.height = inputMessageElement.scrollHeight + 'px';

    charCounter.innerText = `${event.target.value.length} / 760`;

    if (value.length > 0) {
      charCounter.classList.add('visible');
    } else {
      charCounter.classList.remove('visible');
    }

    if (value.length > 700) {
      charCounter.classList.add('warning');
    } else {
      charCounter.classList.remove('warning');
    }
  });

  formMessageElement.addEventListener('submit', async (event) => {
    event.preventDefault();

    try {
      const content = inputMessageElement.value.trim();
      if (!content) return;

      const username = storedUser.username;
      const editingMessageUuid = getEditingMessageUuid();

      await onSendMessage({
        username,
        content,
        editingMessageUuid,
      });

      setInputValue('');
      inputMessageElement.value = '';
      inputMessageElement.placeholder = 'Write a message...';
      inputMessageElement.style.height = 'auto';
      charCounter.classList.remove('visible');
      charCounter.innerText = '0 / 760';
      resetEditingState();
    } catch (error) {
      console.log('ERROR', error);
      alert('Unexpected error while sending message');
    }
  });

  root.appendChild(formMessageElement);

  return {
    formMessageElement,
    inputMessageElement,
  };
};
