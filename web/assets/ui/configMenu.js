export const openConfigMenu = ({
  root,
  x,
  y,
  message,
  storedUser,
  inputMessageElement,
  destroyMessageConfig,
  onEdit,
  onDelete,
}) => {
  const messageConfigBlock = document.createElement('div');
  messageConfigBlock.classList.add('message-config');
  messageConfigBlock.style.top = `${y}px`;
  messageConfigBlock.style.left = `${x}px`;

  const buttonEdit = document.createElement('button');
  const buttonDelete = document.createElement('button');

  buttonEdit.type = 'button';
  buttonDelete.type = 'button';

  buttonEdit.innerText = 'Edit';
  buttonDelete.innerText = 'Delete';

  buttonEdit.classList.add('edit-button');
  buttonDelete.classList.add('delete-button');

  messageConfigBlock.appendChild(buttonEdit);
  messageConfigBlock.appendChild(buttonDelete);

  buttonEdit.addEventListener('click', () => {
    onEdit(message);

    if (inputMessageElement) {
      inputMessageElement.focus();
      inputMessageElement.placeholder = 'Editing message...';
    }

    destroyMessageConfig();
  });

  buttonDelete.addEventListener('click', async () => {
    try {
      await onDelete({
        uuid: message.uuid,
        username: storedUser.username,
      });

      destroyMessageConfig();
    } catch (error) {
      console.log('Delete error', error);
      alert('Unexpected delete error');
    }
  });

  root.appendChild(messageConfigBlock);

  return messageConfigBlock;
};
