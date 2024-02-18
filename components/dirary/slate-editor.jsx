'use client';

import { useMemo, useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

import { Slate, Editable, withReact, useSlate, useFocused } from 'slate-react';
import { Editor, createEditor, Range, Transforms, Text, Node } from 'slate';
import { withHistory } from 'slate-history';
import { jsx } from 'slate-hyperscript';
import escapeHtml from 'escape-html';
import clsx from 'clsx';

import { Button, Menu, Portal } from 'components/dirary/slate-components';

import DriveFileRenameOutlineRoundedIcon from '@mui/icons-material/DriveFileRenameOutlineRounded';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import css from 'components/dirary/slate-editor.module.css';

const SlateEditor = forwardRef((props, ref) => {
  const onEdit = Boolean(props.contentHtml);
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);

  const [isMounted, setIsMounted] = useState(false);
  const isSelected = useRef(false);

  const [initialValue, setInitialValue] = useState(null);

  useEffect(() => {
    if (onEdit) {
      const document = new DOMParser().parseFromString(props.contentHtml, 'text/html');
      const content = deserializeSlateToHtml(document.body);

      setInitialValue(content);
    } else {
      setInitialValue([
        {
          type: 'paragraph',
          children: [
            {
              text: '',
            },
          ],
        },
      ]);
    }
  }, []);

  useEffect(() => {
    if (editor) {
      setIsMounted(true);
      Transforms.select(editor, {
        anchor: { path: [0, 0], offset: 0 },
        focus: { path: [0, 0], offset: 0 },
      });
    }
  }, [editor]);

  const dblClickHandler = () => {
    const selection = window.getSelection();
    const selectedText = selection.toString();

    if (selectedText[selectedText.length - 1] === ' ' && selectedText !== ' ') {
      const trimmedText = selectedText.trim();
      const range = selection.getRangeAt(0).cloneRange();
      range.setEnd(range.endContainer, range.endOffset - (selectedText.length - trimmedText.length));

      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  const selectionChangeHandler = () => {
    if (document.activeElement.id !== 'slateEditor') return;

    const selection = window.getSelection();
    const selectedText = selection.toString();

    if (isSelected.current && !selectedText) {
      const styleElement = document.getElementById('selectedEditor');
      document.head.removeChild(styleElement);

      isSelected.current = false;
    } else if (!isSelected.current && selectedText && (selectedText[selectedText.length - 1] !== ' ' || selectedText === ' ')) {
      const parentElement = document.getElementById('slateEditor');
      const styleElement = document.createElement('style');
      styleElement.id = 'selectedEditor';
      document.head.appendChild(styleElement);

      const newRule = `
      #${parentElement.id} *::selection {
        background-color: ${onEdit ? '#7ab8ff' : '#d7e5fc'};
      }
      `;
      styleElement.sheet.insertRule(newRule, 0);

      isSelected.current = true;
    }
  };

  const blurHandler = () => {
    if (isSelected.current) {
      const styleElement = document.getElementById('selectedEditor');
      document.head.removeChild(styleElement);

      isSelected.current = false;
    }
  };

  useImperativeHandle(ref, () => ({
    // 내부에 있는 code 블럭들을 모두 파악해서 TodoList 에 추가
    extractTodoList(setTodoList) {
      // editor의 value 또는 document를 사용하여 모든 노드에 접근
      const nodes = Node.descendants(editor);
      const diaryTodolist = new Map();
      let keyNumber = 0;

      for (const [node] of nodes) {
        // 각 노드가 'code' 형식을 갖고 있고 빈칸이 아닌 경우에만 배열에 추가
        if (node.code && node.text !== '') {
          diaryTodolist.set(`extracted-${keyNumber}`, { done: false, text: node.text.trim() });

          keyNumber++;
        }
      }

      // todoList의 'diary'를 codeTexts로 변경
      setTodoList((prevTodoList) => {
        return {
          ...prevTodoList,
          extracted: diaryTodolist,
        };
      });
    },

    extractDiary() {
      const [total] = Editor.nodes(editor);
      if (!total) return;

      return serializeSlateToHtml(total[0]);
    },

    emptyDiary() {
      Transforms.delete(editor, {
        at: {
          anchor: Editor.start(editor, []),
          focus: Editor.end(editor, []),
        },
      });
      Editor.removeMark(editor, 'code');
    },
  }));

  const keyDownHandler = (event) => {
    /** 엔터키 입력시 모든 format을 제거하고 일반 텍스트로 */
    if (event.key === 'Enter') {
      const { selection } = editor;
      const node = Editor.node(editor, selection);
      const { text } = node[0];

      event.preventDefault();
      Editor.insertBreak(editor);

      if (selection.focus.offset === 0 || (selection.focus.offset === text.length && !node[0].code)) {
        const node = Editor.node(editor, selection);
        const prevPath = node[1];
        const prevLast = Node.last(editor, prevPath);
        const lastPath = prevLast[1];

        Transforms.setNodes(editor, { code: false }, { at: lastPath });
      } else {
        Transforms.setNodes(editor, { code: false }, { match: (n) => Text.isText(n) });
      }

      return;
    }

    /** 특정 format의 마지막에서 스페이스 바 2번 입력시 format 제거 */
    if (event.key === ' ') {
      const { selection } = editor;
      const [node] = Editor.node(editor, selection);
      const { text } = node;

      if (Editor.marks(editor).code && selection.focus.offset === text.length && text[text.length - 1] === ' ') {
        event.preventDefault();

        Editor.deleteBackward(editor);
        Editor.removeMark(editor, 'code');
      } else if (Editor.marks(editor).code !== node.code && selection.focus.offset === 0) {
        const anchor = selection.anchor.path;
        const [prev] = Editor.previous(editor, { at: anchor });
        const prevText = prev.text;

        if (prevText[prevText.length - 1] === ' ') {
          Editor.deleteBackward(editor);
          event.preventDefault();
        }

        Editor.removeMark(editor, 'code');
      }

      return;
    }

    /** 백스페이스 핸들러 */
    if (event.key === 'Backspace') {
      const { selection } = editor;
      const anchor = selection.anchor.path;

      /** 가장 첫 번째 칸에서 백스페이스 시에는 format 제거 */
      if (selection.focus.offset === 0 && anchor[0] === 0 && anchor[1] === 0) {
        event.preventDefault();

        Editor.removeMark(editor, 'code');
      }

      // return;
    }
  };

  const checkEmpty = () => {
    const nodes = editor.children;

    if (nodes.length !== 1) {
      props.setSlateIsEmpty(false);
      return;
    }

    const firstLine = nodes[0].children;

    if (firstLine.length !== 1 || firstLine[0].text) {
      props.setSlateIsEmpty(false);
      return;
    }

    if (!firstLine[0].text) props.setSlateIsEmpty(true);
  };

  return initialValue ? (
    <Slate
      editor={editor}
      initialValue={initialValue}
      onChange={() => {
        checkEmpty();
        selectionChangeHandler();
      }}
    >
      <HoveringToolbar onEdit={onEdit} />
      <Editable
        id="slateEditor"
        className={clsx(css.slateEditor, { [css.editEditor]: onEdit })}
        renderLeaf={(props) => <Leaf {...props} />}
        placeholder="내용..."
        readOnly={!isMounted}
        onDoubleClick={dblClickHandler}
        onKeyDown={(event) => {
          // if (!event.nativeEvent.isComposing) checkEmpty();
          keyDownHandler(event);
        }}
        onBlur={blurHandler}
      />
    </Slate>
  ) : (
    <div className={css.slateEditor} />
  );
});

const toggleMark = async (editor) => {
  const isActive = isMarkActive(editor);

  if (isActive) {
    Editor.removeMark(editor, 'code');
  } else {
    Editor.addMark(editor, 'code', true);
  }

  Transforms.collapse(editor, { edge: 'end' });
  Transforms.move(editor, { distance: 1, unit: 'offset' });
};

const isMarkActive = (editor) => {
  try {
    const marks = Editor.marks(editor);
    return marks ? marks.code === true : false;
  } catch {
    return false;
  }
};

const Leaf = ({ attributes, children, leaf }) => {
  if (leaf.code) {
    children = <code>{children}</code>;
  }

  return <span {...attributes}>{children}</span>;
};

const HoveringToolbar = ({ onEdit }) => {
  const ref = useRef(null);
  const editor = useSlate();
  const inFocus = useFocused();

  useEffect(() => {
    const el = ref.current;
    const { selection } = editor;

    if (!el) {
      return;
    }

    if (!selection || !inFocus || Range.isCollapsed(selection) || Editor.string(editor, selection) === '') {
      el.removeAttribute('style');
      return;
    }

    const domSelection = window.getSelection();
    if (domSelection) {
      const domRange = domSelection.getRangeAt(0);
      const rect = domRange.getBoundingClientRect();
      if (el) {
        el.style.opacity = '1';
        el.style.top = `${rect.bottom + window.pageYOffset - el.offsetHeight + 45}px`;
        el.style.left = `${rect.left + window.pageXOffset}px`;
      }
    }
  });

  return (
    <Portal>
      <Menu
        ref={ref}
        onMouseDown={(e) => {
          e.preventDefault();
        }}
      >
        <Button
          onEdit={onEdit}
          onClick={() => {
            toggleMark(editor);
          }}
        >
          {isMarkActive(editor) ? (
            <>
              <ClearRoundedIcon
                sx={{
                  position: 'relative',
                  zIndex: '3',
                }}
              />
            </>
          ) : (
            <>
              <DriveFileRenameOutlineRoundedIcon
                sx={{
                  position: 'relative',
                  zIndex: '3',
                }}
              />
            </>
          )}
        </Button>
      </Menu>
    </Portal>
  );
};

const serializeSlateToHtml = (node) => {
  if (Text.isText(node)) {
    const string = escapeHtml(node.text);
    if (node.code) return `<code>${string}</code>`;

    return node.text;
  }

  const children = node.children.map((n) => serializeSlateToHtml(n)).join('');

  if (node.type === 'paragraph') {
    return `<p>${children}</p>`;
  }

  return children;
};

const deserializeSlateToHtml = (el, markAttributes = {}) => {
  if (el.nodeType === window.Node.TEXT_NODE) {
    return jsx('text', markAttributes, el.textContent);
  }

  if (el.nodeType !== window.Node.ELEMENT_NODE) {
    return null;
  }

  const nodeAttributes = { ...markAttributes };
  if (el.nodeName === 'CODE') nodeAttributes.code = true;

  const children = Array.from(el.childNodes)
    .map((node) => deserializeSlateToHtml(node, nodeAttributes))
    .flat();

  if (children.length === 0) {
    children.push(jsx('text', nodeAttributes, ''));
  }

  switch (el.nodeName) {
    case 'BODY':
      return jsx('fragment', {}, children);
    case 'BR':
      return '\n';
    case 'P':
      return jsx('element', { type: 'paragraph' }, children);
    default:
      return children;
  }
};

export default SlateEditor;
