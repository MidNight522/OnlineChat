// console.log(1000);

const root = document.getElementById('root');
const user = localStorage.getItem('user');
let formMessageElement = null;
let messagesWrapperDiv = null;
let inputValue = null;
let inputMessageElement = null;
let messageConfigBlock = null;
let messageConfigIsOpened = false;

const initBottomFormMessage = () => {
  formMessageElement = document.createElement('form');
  formMessageElement.classList.add('bottom-form');

  inputMessageElement = document.createElement('input');
  inputMessageElement.placeholder = 'Enter your message';
  inputMessageElement.classList.add('input-message');
  if (inputValue) inputMessageElement.value = inputValue;

  inputMessageElement.addEventListener('input', function (event) {
    const value = event.target.value;
    inputValue = value;
  });

  const button = document.createElement('button');
  button.innerText = 'Send';

  formMessageElement.appendChild(inputMessageElement);
  formMessageElement.appendChild(button);

  root.appendChild(formMessageElement);

  formMessageElement.addEventListener('submit', async function (event) {
    try {
      event.preventDefault();
      const content = event.target[0].value;

      const username = JSON.parse(user).username;

      const messageObject = {
        username,
        content,
      };

      const response = await fetch('/api/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageObject),
      });
      const data = await response.json();
      console.log('data: ', data);
      document.location.reload();
    } catch (error) {
      console.log('ERROR: ', error);
    }
  });
};

const initFetchMessages = () => {
  return fetch(`/api/messages`)
    .then((res) => res.json())
    .then((body) => {
      console.log('messages: ', body.messages);

      const messages = body.messages;

      messagesWrapperDiv = document.createElement('div');
      messagesWrapperDiv.classList.add('messages-wrapper');

      root.appendChild(messagesWrapperDiv);

      messages.forEach((message) => {
        const isUserAuthorOfMessage =
          message.username == JSON.parse(user).username;
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        if (isUserAuthorOfMessage) {
          messageDiv.classList.add('message-of-mine');

          const messageConfigButton = document.createElement('button');
          messageConfigButton.innerText = 'config';
          messageConfigButton.classList.add('config-button');
          messageDiv.appendChild(messageConfigButton);

          messageConfigButton.addEventListener('click', function (event) {
            if (messageConfigIsOpened) destroyMessageConfig();
            const { clientX: xCoord, clientY: yCoord } = event;
            console.log('xCoord: ', xCoord, ' yCoord: ', yCoord);

            messageConfigBlock = document.createElement('div');
            messageConfigBlock.classList.add('message-config');
            messageConfigBlock.style.top = yCoord + 'px';
            messageConfigBlock.style.left = xCoord + 'px';

            const buttonEdit = document.createElement('button');
            const buttonDelete = document.createElement('button');
            buttonEdit.innerText = 'Edit';
            buttonDelete.innerText = 'Delete';

            messageConfigBlock.appendChild(buttonEdit);
            messageConfigBlock.appendChild(buttonDelete);

            buttonEdit.addEventListener('click', function (event) {
              const currentMessage = message;
              inputValue = currentMessage.content;
              inputMessageElement.value = currentMessage.content;
            });

            root.appendChild(messageConfigBlock);
            messageConfigIsOpened = !messageConfigIsOpened;
          });
        }

        const messageP = document.createElement('p');
        messageP.innerHTML = message.content;

        const messageAvatarImg = document.createElement('img');
        messageAvatarImg.setAttribute('src', message.avatar);
        messageAvatarImg.setAttribute('width', 32);
        messageAvatarImg.setAttribute('height', 32);

        const messageUsernameP = document.createElement('p');
        messageUsernameP.innerText = message.username;

        messageDiv.appendChild(messageAvatarImg);
        messageDiv.appendChild(messageUsernameP);
        messageDiv.appendChild(messageP);

        messagesWrapperDiv.appendChild(messageDiv);
      });

      if (user) initBottomFormMessage();
    });
};

const destroyOldContent = () => {
  root.removeChild(messagesWrapperDiv);
  root.removeChild(formMessageElement);
  messagesWrapperDiv = null;
  formMessageElement = null;
};

const destroyMessageConfig = () => {
  root.removeChild(messageConfigBlock);
  messageConfigBlock = null;
  messageConfigIsOpened = false;
};

if (!user) {
  const headerNonAuth = document.createElement('header');
  headerNonAuth.innerText = 'The CSS Whisperer';
  root.appendChild(headerNonAuth);

  const buttonForCallingAuthDialog = document.createElement('button');
  buttonForCallingAuthDialog.innerText = 'Log in';
  headerNonAuth.appendChild(buttonForCallingAuthDialog);

  buttonForCallingAuthDialog.addEventListener('click', function (event) {
    event.preventDefault();

    const dialogForAuthWrapper = document.createElement('div');
    dialogForAuthWrapper.classList.add('dialog-auth-wrapper');
    const dialogForAuth = document.createElement('div');
    dialogForAuth.classList.add('dialog-auth');

    const formForAuth = document.createElement('form');
    const inputForAuth = document.createElement('input');
    const buttonSubmitAuth = document.createElement('button');
    buttonSubmitAuth.innerText = 'Log in';
    const buttonLeaveAuth = document.createElement('button');
    buttonLeaveAuth.innerText = 'Close';

    formForAuth.appendChild(inputForAuth);
    formForAuth.appendChild(buttonSubmitAuth);
    formForAuth.appendChild(buttonLeaveAuth);

    dialogForAuth.appendChild(formForAuth);

    dialogForAuthWrapper.appendChild(dialogForAuth);
    root.appendChild(dialogForAuthWrapper);

    formForAuth.addEventListener('submit', async function (event) {
      try {
        event.preventDefault();
        const username = event.target[0].value;
        console.log('username: ', username);

        const response = await fetch(`/api/user?username=${username}`);
        const data = await response.json();
        console.log('data: ', data);
        const user = data.user;
        localStorage.setItem('user', JSON.stringify(user));
        document.location.reload();
      } catch (error) {
        alert(error);
      }
    });
  });
} else {
  const headerNonAuth = document.createElement('header');
  headerNonAuth.innerText = 'Вы авторизовались';

  root.appendChild(headerNonAuth);

  // initBottomFormMessage();
}

initFetchMessages();
// setInterval(() => {
// 	destroyOldContent();
// 	initFetchMessages();
// }, 5000);

// fetch(`/api/messages`)
// 	.then((res) => res.json())
// 	.then((body) => {
// 		console.log("messages: ", body.messages);

// 		const messages = body.messages;

// 		const messagesWrapperDiv = document.createElement("div");
// 		messagesWrapperDiv.classList.add("messages-wrapper");

// 		root.appendChild(messagesWrapperDiv);

// 		messages.forEach((message) => {
// 			const messageDiv = document.createElement("div");
// 			messageDiv.classList.add("message");

// 			const messageP = document.createElement("p");
// 			messageP.innerHTML = message.content;

// 			const messageAvatarImg = document.createElement("img");
// 			messageAvatarImg.setAttribute("src", message.avatar);
// 			messageAvatarImg.setAttribute("width", 32);
// 			messageAvatarImg.setAttribute("height", 32);

// 			const messageUsernameP = document.createElement("p");
// 			messageUsernameP.innerText = message.username;
// 			// messageDiv.innerText = message.content;

// 			messageDiv.appendChild(messageAvatarImg);
// 			messageDiv.appendChild(messageUsernameP);
// 			messageDiv.appendChild(messageP);

// 			messagesWrapperDiv.appendChild(messageDiv);
// 		});

// 		if (user) initBottomFormMessage();
// 	});
