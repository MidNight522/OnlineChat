export const initAuthUi = ({ root, onAuthSuccess }) => {
  const validateUsername = (username) => {
    const trimmed = username.trim();

    if (!trimmed) {
      return 'Username is required';
    }

    if (trimmed.length < 2) {
      return 'Username must be at least 2 characters';
    }

    if (trimmed.length > 15) {
      return 'Username must be no more than 15 characters';
    }

    return '';
  };

  const headerNonAuth = document.createElement('header');
  headerNonAuth.classList.add('chat-header');

  const title = document.createElement('h1');
  title.classList.add('chat-title');
  title.innerText = 'The CSS Whisperer';

  const buttonForCallingAuthDialog = document.createElement('button');
  buttonForCallingAuthDialog.type = 'button';
  buttonForCallingAuthDialog.classList.add('login-icon-button');

  const icon = document.createElement('img');
  icon.src = '/assets/images/ProfileInfo.svg';
  icon.alt = 'Profile';

  buttonForCallingAuthDialog.appendChild(icon);

  headerNonAuth.appendChild(title);
  headerNonAuth.appendChild(buttonForCallingAuthDialog);
  root.appendChild(headerNonAuth);

  buttonForCallingAuthDialog.addEventListener('click', (event) => {
    event.preventDefault();

    const dialogForAuthWrapper = document.createElement('div');
    dialogForAuthWrapper.classList.add('dialog-auth-wrapper');

    const dialogForAuth = document.createElement('div');
    dialogForAuth.classList.add('dialog-auth');

    const formForAuth = document.createElement('form');
    const inputForAuth = document.createElement('input');
    inputForAuth.placeholder = 'Enter username';

    const errorText = document.createElement('p');
    errorText.classList.add('auth-error');

    const buttonSubmitAuth = document.createElement('button');
    buttonSubmitAuth.type = 'submit';
    buttonSubmitAuth.innerText = 'Log in';

    const buttonLeaveAuth = document.createElement('button');
    buttonLeaveAuth.type = 'button';
    buttonLeaveAuth.innerText = 'Close';

    formForAuth.appendChild(inputForAuth);
    formForAuth.appendChild(errorText);
    formForAuth.appendChild(buttonSubmitAuth);
    formForAuth.appendChild(buttonLeaveAuth);

    dialogForAuth.appendChild(formForAuth);
    dialogForAuthWrapper.appendChild(dialogForAuth);
    root.appendChild(dialogForAuthWrapper);

    buttonLeaveAuth.addEventListener('click', () => {
      root.removeChild(dialogForAuthWrapper);
    });

    inputForAuth.addEventListener('input', () => {
      errorText.innerText = '';
    });

    formForAuth.addEventListener('submit', async (event) => {
      event.preventDefault();

      try {
        const username = inputForAuth.value.trim();
        const validationError = validateUsername(username);

        if (validationError) {
          errorText.innerText = validationError;
          return;
        }

        errorText.innerText = '';
        await onAuthSuccess(username);
      } catch (error) {
        errorText.innerText = 'Auth error';
        console.log(error);
      }
    });
  });
};

export const initLoggedInHeader = ({ root, storedUser, onProfileClick }) => {
  const headerAuth = document.createElement('header');
  headerAuth.classList.add('header-auth');

  const titleBlock = document.createElement('div');
  titleBlock.classList.add('header-title-block');
  titleBlock.addEventListener('click', () => {
    const messagesWrapper = document.querySelector('.messages-wrapper');

    if (messagesWrapper) {
      messagesWrapper.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  });

  const chatAvatar = document.createElement('img');
  chatAvatar.addEventListener('click', () => {
    const messagesWrapper = document.querySelector('.messages-wrapper');

    if (messagesWrapper) {
      messagesWrapper.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  });
  chatAvatar.classList.add('chat-avatar');
  chatAvatar.src = '/assets/images/chat-avatar.svg';
  chatAvatar.alt = 'Chat';

  const textBlock = document.createElement('div');
  textBlock.classList.add('chat-title-text');

  const title = document.createElement('h1');
  title.classList.add('chat-title');
  title.innerText = 'The CSS Whisperer';

  const status = document.createElement('span');
  status.classList.add('chat-status');
  status.innerText = 'Online';

  titleBlock.appendChild(chatAvatar);
  titleBlock.appendChild(textBlock);

  titleBlock.appendChild(title);
  titleBlock.appendChild(status);

  const profileBtn = document.createElement('button');
  profileBtn.type = 'button';
  profileBtn.classList.add('profile-icon-button');

  const icon = document.createElement('img');
  icon.src = storedUser?.avatar || '/assets/images/ProfileInfo.svg';
  icon.alt = 'Profile';

  profileBtn.appendChild(icon);

  profileBtn.addEventListener('click', onProfileClick);

  headerAuth.appendChild(titleBlock);
  headerAuth.appendChild(profileBtn);
  root.appendChild(headerAuth);
};

export const openProfileModal = ({
  root,
  storedUser,
  onClose,
  onLogout,
  onJoin,
  onChangePicture,
  onDeletePicture,
}) => {
  const dialogWrapper = document.createElement('div');
  dialogWrapper.classList.add('dialog-auth-wrapper');

  const dialog = document.createElement('div');
  dialog.classList.add('dialog-auth');

  dialogWrapper.addEventListener('click', (event) => {
    if (event.target === dialogWrapper) {
      root.removeChild(dialogWrapper);
      onClose?.();
    }
  });

  const titlePicture = document.createElement('p');
  titlePicture.classList.add('profile-header');
  titlePicture.innerText = 'Profile picture';

  const profileImage = document.createElement('img');
  profileImage.classList.add('profile-modal-image');
  profileImage.src = storedUser?.avatar || '/assets/images/ProfileInfo.svg';
  profileImage.alt = 'Profile picture';

  const pictureButtons = document.createElement('div');
  pictureButtons.classList.add('profile-picture-actions');

  const changePictureBtn = document.createElement('button');
  changePictureBtn.classList.add('change-button');
  changePictureBtn.addEventListener.type = 'button';
  changePictureBtn.innerText = 'Change picture';

  const deletePictureBtn = document.createElement('button');
  deletePictureBtn.classList.add('delete-button');
  deletePictureBtn.type = 'button';
  deletePictureBtn.innerText = 'Delete picture';

  pictureButtons.appendChild(changePictureBtn);
  pictureButtons.appendChild(deletePictureBtn);

  const nameLabel = document.createElement('p');
  nameLabel.classList.add('name-label');
  nameLabel.innerText = 'Enter your name';

  const nameInput = document.createElement('input');
  nameInput.classList.add('name-input');
  nameInput.type = 'text';
  nameInput.value = storedUser?.username || '';

  const errorText = document.createElement('p');
  errorText.classList.add('auth-error');

  const joinBtn = document.createElement('button');
  joinBtn.classList.add('join-button');
  joinBtn.type = 'button';
  joinBtn.innerText = 'Join';

  const closeBtn = document.createElement('button');
  closeBtn.classList.add('close-button');
  closeBtn.type = 'button';
  closeBtn.innerText = 'Close';

  const logoutBtn = document.createElement('button');
  logoutBtn.classList.add('logout-button');
  logoutBtn.type = 'button';
  logoutBtn.innerText = 'Logout';

  dialog.appendChild(titlePicture);
  dialog.appendChild(profileImage);
  dialog.appendChild(pictureButtons);
  dialog.appendChild(nameLabel);
  dialog.appendChild(nameInput);
  dialog.appendChild(errorText);
  dialog.appendChild(joinBtn);
  dialog.appendChild(closeBtn);
  dialog.appendChild(logoutBtn);

  dialogWrapper.appendChild(dialog);
  root.appendChild(dialogWrapper);

  changePictureBtn.addEventListener('click', () => {
    onChangePicture?.();
  });

  deletePictureBtn.addEventListener('click', () => {
    onDeletePicture?.();
  });

  closeBtn.addEventListener('click', () => {
    root.removeChild(dialogWrapper);
    onClose?.();
  });

  logoutBtn.addEventListener('click', () => {
    root.removeChild(dialogWrapper);
    onLogout?.();
  });

  joinBtn.addEventListener('click', async () => {
    try {
      const username = nameInput.value.trim();

      if (!username) {
        errorText.innerText = 'Username is required';
        return;
      }

      if (username.length < 2) {
        errorText.innerText = 'Username must be at least 2 characters';
        return;
      }

      if (username.length > 15) {
        errorText.innerText = 'Username must be no more than 15 characters';
        return;
      }

      errorText.innerText = '';
      await onJoin?.(username);
      root.removeChild(dialogWrapper);
    } catch (error) {
      errorText.innerText = 'Profile update error';
      console.log(error);
    }
  });

  nameInput.addEventListener('input', () => {
    errorText.innerText = '';
  });
};
