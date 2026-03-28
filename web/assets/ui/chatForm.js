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

  const inputMessageElement = document.createElement('textarea');
  inputMessageElement.classList.add('input-message');
  inputMessageElement.placeholder = 'Enter your message';
  inputMessageElement.value = inputValue || '';

  inputMessageElement.addEventListener('input', (event) => {
    setInputValue(event.target.value);
  });

  inputMessageElement.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      formMessageElement.requestSubmit();
    }
  });

  const button = document.createElement('button');
  button.type = 'submit';
  button.innerText = 'Send';

  formMessageElement.appendChild(inputMessageElement);
  formMessageElement.appendChild(button);

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
      inputMessageElement.placeholder = 'Enter your message';
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
