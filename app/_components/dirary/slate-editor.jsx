'use client';

import { useMemo, useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { useRecoilState } from 'recoil';
import { Slate, Editable, withReact, useSlate, useFocused } from 'slate-react';
import { Editor, createEditor, Range, Transforms, Text, Node, Path } from 'slate';
import { withHistory } from 'slate-history';

import { todoListState } from 'app/_lib/recoil';
import { Button, Icon, Menu, Portal } from 'app/_components/dirary/slate-components';
import css from 'app/_components/dirary/slate-editor.module.css';

const SlateEditor = forwardRef((props, ref) => {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  const [todoList, setTodoList] = useRecoilState(todoListState);

  const [newNodeId, setNewNodeId] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  /** write-form 에서 Todolist 삭제시 code format을 제거할 수 있게 */
  useImperativeHandle(ref, () => ({
    unCodeBlock(path) {
      const range = Editor.range(editor, path);
      Transforms.setSelection(editor, range);
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

      /** 특정 code format 이 모두 지워진 경우 Todolist 에서 제거 */
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

      // return;
    }
  };

  /** code 포맷으로 작성시 투두리스트에 추가, 업데이트 */
  const changeHandler = () => {
    const { selection } = editor;
    const [node] = Editor.node(editor, selection);

    console.log(node);
    if (!node.id) {
      Transforms.setNodes(editor, { id: newNodeId }, { match: (n) => Text.isText(n) });
      setNewNodeId(newNodeId + 1);
    }

    if (node.code) {
      const { selection } = editor;
      const [node] = Editor.node(editor, selection);
      if (node.children) return;

      const anchor = selection.anchor.path;
      const { text } = node;

      if (text === '') return;

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
        readOnly={!isMounted}
        onKeyDown={(event) => {
          keyDownHandler(event);
        }}
      />
    </Slate>
  );
});

const toggleMark = (editor, format, todoList = null, setTodoList = null) => {
  const isActive = isMarkActive(editor, format);

  const { selection } = editor;

  const { anchor, focus } = selection;
  const a = anchor.path;
  const f = focus.path;

  const path = {};

  if (a[0] > f[0] || (a[0] === f[0] && a[1] > f[1])) {
    path.start = [f[0], f[1]];
    path.end = [a[0], a[1]];
  } else {
    path.start = [a[0], a[1]];
    path.end = [f[0], f[1]];
  }

  // if (path.start[1] > 0) path.start[1] -= 1;
  // path.end[1] += 1;

  const prevNodes = [];

  for (const nodeEntry of Node.nodes(editor, { from: path.start, to: path.end })) {
    if (nodeEntry[0].text) {
      prevNodes.push(nodeEntry);
    }
  }

  if (isActive) {
    Editor.removeMark(editor, format);
    if (format === 'code') {
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
        toggleMark(editor, format, todoList, setTodoList);
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
