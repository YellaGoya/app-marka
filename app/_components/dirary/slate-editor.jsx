'use client';

import { useMemo, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { useRecoilState } from 'recoil';
import { Slate, Editable, withReact, useSlate, useFocused } from 'slate-react';
import { Editor, createEditor, Range, Transforms } from 'slate';
import { withHistory } from 'slate-history';

import { todoListState } from 'app/_lib/recoil';
import { Button, Icon, Menu, Portal } from 'app/_components/dirary/slate-components';
import css from 'app/_components/dirary/slate-editor.module.css';

const SlateEditor = forwardRef((props, ref) => {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  const [todoList, setTodoList] = useRecoilState(todoListState);

  useImperativeHandle(ref, () => ({
    unCodeBlock(path) {
      const range = Editor.range(editor, path);
      Transforms.setSelection(editor, range);
      Editor.removeMark(editor, 'code');
    },
  }));

  const keyDownHandler = (event) => {
    if (event.key === 'Enter') {
      for (const key in Editor.marks(editor)) {
        Editor.removeMark(editor, key);
      }
    }

    if (event.key === ' ') {
      const { selection } = editor;
      const [node] = Editor.node(editor, selection);
      const { text } = node;

      if (selection.focus.offset === text.length && text[text.length - 1] === ' ') {
        event.preventDefault();

        for (const key in Editor.marks(editor)) {
          Editor.removeMark(editor, key);
        }
      }
    }

    if (event.key === 'Backspace') {
      const { selection } = editor;
      const anchor = selection.anchor.path;

      if (selection.focus.offset === 0 && anchor[0] === 0 && anchor[1] === 0) {
        event.preventDefault();

        for (const key in Editor.marks(editor)) {
          Editor.removeMark(editor, key);
        }
      }

      if (Editor.marks(editor).code) {
        const [node] = Editor.node(editor, selection);
        const { text } = node;

        if (text.length === 1) {
          const anchor = selection.anchor.path;

          const newTodoList = new Map(todoList);
          newTodoList.delete(anchor[0] * 100000 + anchor[1]);
          setTodoList(newTodoList);
        }
      }
    }
  };

  const changeHandler = () => {
    if (Editor.marks(editor).code) {
      const { selection } = editor;
      const [node] = Editor.node(editor, selection);
      if (node.children) return;

      const anchor = selection.anchor.path;
      const { text } = node;

      const newTodoList = new Map(todoList);
      newTodoList.set(anchor[0] * 100000 + anchor[1], text);
      setTodoList(newTodoList);
    }
  };

  return (
    <Slate
      className={css.slateContainer}
      editor={editor}
      initialValue={initialValue}
      style={{
        minHeight: '300px',
      }}
      onChange={() => {
        changeHandler();
      }}
    >
      <HoveringToolbar />
      <Editable
        className={css.slateEditor}
        renderLeaf={(props) => <Leaf {...props} />}
        placeholder="내용..."
        onKeyDown={(event) => {
          keyDownHandler(event);
        }}
        onDOMBeforeInput={(event) => {
          switch (event.inputType) {
            case 'formatBold':
              event.preventDefault();
              return toggleMark(editor, 'bold');
            case 'formatItalic':
              event.preventDefault();
              return toggleMark(editor, 'italic');
            case 'formatUnderline':
              event.preventDefault();
              return toggleMark(editor, 'underlined');
            case 'formatCode':
              event.preventDefault();
              return toggleMark(editor, 'code');
            default:
          }
        }}
      />
    </Slate>
  );
});

const toggleMark = (editor, format, todoList = null, setTodoList = null) => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
    if (format === 'code') {
      const { selection } = editor;
      const anchor = selection.anchor.path;

      const newTodoList = new Map(todoList);
      newTodoList.delete(anchor[0] * 100000 + anchor[1]);
      setTodoList(newTodoList);
    }
  } else {
    Editor.addMark(editor, format, true);
  }
};

const isMarkActive = (editor, format) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};

const Leaf = ({ attributes, children, leaf }) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }

  if (leaf.italic) {
    children = <em>{children}</em>;
  }

  if (leaf.underlined) {
    children = <u>{children}</u>;
  }

  if (leaf.code) {
    children = <code>{children}</code>;
  }

  return <span {...attributes}>{children}</span>;
};

const HoveringToolbar = () => {
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
    const domRange = domSelection.getRangeAt(0);
    const rect = domRange.getBoundingClientRect();
    el.style.opacity = '1';
    el.style.top = `${rect.top + window.pageYOffset - el.offsetHeight}px`;
    el.style.left = `${rect.left + window.pageXOffset - el.offsetWidth / 2 + rect.width / 2}px`;
  });

  return (
    <Portal>
      <Menu
        ref={ref}
        onMouseDown={(e) => {
          e.preventDefault();
        }}
      >
        <FormatButton format="bold" icon="bold" />
        <FormatButton format="italic" icon="italic" />
        <FormatButton format="underlined" icon="underlined" />
        <FormatButton format="code" icon="code" />
      </Menu>
    </Portal>
  );
};

const FormatButton = ({ format, icon }) => {
  const [todoList, setTodoList] = useRecoilState(todoListState);
  const editor = useSlate();

  return (
    <Button
      reversed
      active={isMarkActive(editor, format)}
      onClick={() => {
        if (format === 'code') toggleMark(editor, format, todoList, setTodoList);
        else toggleMark(editor, format);
      }}
    >
      <Icon>{icon}</Icon>
    </Button>
  );
};

const initialValue = [
  {
    type: 'paragraph',
    children: [
      {
        text: '',
      },
    ],
  },
];

export default SlateEditor;
