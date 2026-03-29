const createToolBarButton = ({ iconPath, alt, onClick }) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.classList.add('toolbar-button');

  const icon = document.createElement('img');
  icon.src = iconPath;
  icon.alt = alt;

  button.appendChild(icon);
  button.addEventListener('click', onClick);

  return button;
};

const escapeHtml = (value) => {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
};

const stripHtml = (value) => {
  const temp = document.createElement('div');
  temp.innerHTML = value;
  return temp.textContent || temp.innerText || '';
};

const replaceSelection = ({
  input,
  setInputValue,
  before = '',
  after = '',
  fallbackText = '',
}) => {
  const start = input.selectionStart;
  const end = input.selectionEnd;
  const text = input.value;
  const selectedText = text.slice(start, end);
  const content = selectedText || fallbackText;

  const nextValue =
    text.slice(0, start) + before + content + after + text.slice(end);

  input.value = nextValue;
  setInputValue(nextValue);
  input.focus();

  const cursorStart = start + before.length;
  const cursorEnd = cursorStart + content.length;
  input.setSelectionRange(cursorStart, cursorEnd);
};

const replaceSelectionCompletely = ({
  input,
  setInputValue,
  replacement,
  selectInserted = false,
}) => {
  const start = input.selectionStart;
  const end = input.selectionEnd;
  const text = input.value;

  const nextValue = text.slice(0, start) + replacement + text.slice(end);

  input.value = nextValue;
  setInputValue(nextValue);
  input.focus();

  if (selectInserted) {
    input.setSelectionRange(start, start + replacement.length);
  } else {
    input.setSelectionRange(
      start + replacement.length,
      start + replacement.length,
    );
  }
};

const wrapWithTag = ({
  input,
  setInputValue,
  tagName,
  fallbackText = 'text',
}) => {
  replaceSelection({
    input,
    setInputValue,
    before: `<${tagName}>`,
    after: `</${tagName}>`,
    fallbackText,
  });
};

const makeOrderedList = ({ input, setInputValue }) => {
  const start = input.selectionStart;
  const end = input.selectionEnd;
  const text = input.value;
  const selectionText = text.slice(start, end).trim();

  const items = (selectionText || 'Item 1\nItem 2')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join('');

  replaceSelectionCompletely({
    input,
    setInputValue,
    replacement: `<ol>${items}</ol>`,
  });
};

const makeBulletList = ({ input, setInputValue }) => {
  const start = input.selectionStart;
  const end = input.selectionEnd;
  const text = input.value;
  const selectedText = text.slice(start, end).trim();

  const items = (selectedText || 'Item 1\nItem 2')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join('');

  replaceSelectionCompletely({
    input,
    setInputValue,
    replacement: `<ul>${items}</ul>`,
  });
};

const insertImage = ({ input, setInputValue }) => {
  const url = window.prompt('Enter image URL');

  if (!url) return;

  const safeUrl = url.trim();
  if (!safeUrl) return;

  replaceSelectionCompletely({
    input,
    setInputValue,
    replacement: `<img src="${escapeHtml(safeUrl)}" alt="image"/>`,
  });
};

const insertLink = ({ input, setInputValue }) => {
  const url = window.prompt('Enter link URL');
  if (!url) return;

  const safeUrl = url.trim();
  if (!safeUrl) return;

  const start = input.selectionStart;
  const end = input.selectionEnd;
  const text = input.value;
  const selectedText = text.slice(start, end) || 'link text';

  replaceSelectionCompletely({
    input,
    setInputValue,
    replacement: `<a href="${escapeHtml(safeUrl)}" target="_blank">${escapeHtml(selectedText)}</a>`,
  });
};

const insertQuote = ({ input, setInputValue }) => {
  wrapWithTag({
    input,
    setInputValue,
    tagName: 'blockquote',
    fallbackText: 'Quote',
  });
};

const insertCode = ({ input, setInputValue }) => {
  wrapWithTag({
    input,
    setInputValue,
    tagName: 'code',
    fallbackText: 'code',
  });
};

const cleanFormatting = ({ input, setInputValue }) => {
  const start = input.selectionStart;
  const end = input.selectionEnd;
  const text = input.value;
  const selectedText = text.slice(start, end);

  if (!selectedText) return;
  const cleaned = stripHtml(selectedText);
  const nextValue = text.slice(0, start) + cleaned + text.slice(end);

  input.value = nextValue;
  setInputValue(nextValue);
  input.focus();
  input.setSelectionRange(start, start + cleaned.length);
};

export const createToolbar = ({ inputMessageElement, setInputValue }) => {
  const toolbar = document.createElement('div');
  toolbar.classList.add('edit-toolbar');
  toolbar.style.display = 'none';

  const buttons = [
    {
      alt: 'Bold',
      iconPath: '/assets/images/toolButton/bold.svg',
      onClick: () =>
        wrapWithTag({
          input: inputMessageElement,
          setInputValue,
          tagName: 'b',
          fallbackText: 'bold',
        }),
    },
    {
      alt: 'Italic',
      iconPath: '/assets/images/toolButton/italic.svg',
      onClick: () =>
        wrapWithTag({
          input: inputMessageElement,
          setInputValue,
          tagName: 'i',
          fallbackText: 'italic',
        }),
    },
    {
      alt: 'Underline',
      iconPath: '/assets/images/toolButton/underline.svg',
      onClick: () =>
        wrapWithTag({
          input: inputMessageElement,
          setInputValue,
          tagName: 'u',
          fallbackText: 'underline',
        }),
    },
    {
      alt: 'Strike',
      iconPath: '/assets/images/toolButton/strike.svg',
      onClick: () =>
        wrapWithTag({
          input: inputMessageElement,
          setInputValue,
          tagName: 's',
          fallbackText: 'strike',
        }),
    },
    {
      alt: 'Subscript',
      iconPath: '/assets/images/toolButton/sub.svg',
      onClick: () =>
        wrapWithTag({
          input: inputMessageElement,
          setInputValue,
          tagName: 'sub',
          fallbackText: 'sub',
        }),
    },
    {
      alt: 'Superscript',
      iconPath: '/assets/images/toolButton/super.svg',
      onClick: () =>
        wrapWithTag({
          input: inputMessageElement,
          setInputValue,
          tagName: 'sup',
          fallbackText: 'super',
        }),
    },
    {
      alt: 'Ordered list',
      iconPath: '/assets/images/toolButton/ordered-list.svg',
      onClick: () =>
        makeOrderedList({
          input: inputMessageElement,
          setInputValue,
        }),
    },
    {
      alt: 'Bullet list',
      iconPath: '/assets/images/toolButton/unordered-list.svg',
      onClick: () =>
        makeBulletList({
          input: inputMessageElement,
          setInputValue,
        }),
    },
    {
      alt: 'Image',
      iconPath: '/assets/images/toolButton/image.svg',
      onClick: () =>
        insertImage({
          input: inputMessageElement,
          setInputValue,
        }),
    },
    {
      alt: 'Link',
      iconPath: '/assets/images/toolButton/link.svg',
      onClick: () =>
        insertLink({
          input: inputMessageElement,
          setInputValue,
        }),
    },
    {
      alt: 'Quote',
      iconPath: '/assets/images/toolButton/quote.svg',
      onClick: () =>
        insertQuote({
          input: inputMessageElement,
          setInputValue,
        }),
    },
    {
      alt: 'Code',
      iconPath: '/assets/images/toolButton/code.svg',
      onClick: () =>
        insertCode({
          input: inputMessageElement,
          setInputValue,
        }),
    },
    {
      alt: 'Clean',
      iconPath: '/assets/images/toolButton/clean.svg',
      onClick: () =>
        cleanFormatting({
          input: inputMessageElement,
          setInputValue,
        }),
    },
  ];

  buttons.forEach((buttonConfig) => {
    const button = createToolBarButton(buttonConfig);
    toolbar.appendChild(button);
  });
  return toolbar;
};
