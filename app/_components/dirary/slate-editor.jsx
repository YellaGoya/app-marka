'use client';

import { useMemo, useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { useSetRecoilState } from 'recoil';
import { Slate, Editable, withReact, useSlate, useFocused } from 'slate-react';
import { Editor, createEditor, Range, Transforms, Text, Node } from 'slate';
import { withHistory } from 'slate-history';
import { useDebouncedCallback } from 'use-debounce';

import { todoListState, slateIsEmptyState } from 'app/_lib/recoil';
import { Button, Icon, Menu, Portal } from 'app/_components/dirary/slate-components';
import css from 'app/_components/dirary/slate-editor.module.css';

const SlateEditor = forwardRef((props, ref) => {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);

  const [isMounted, setIsMounted] = useState(false);
  const setTodoList = useSetRecoilState(todoListState);
  const setSlateIsEmpty = useSetRecoilState(slateIsEmptyState);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useImperativeHandle(ref, () => ({
    // 내부에 있는 code 블럭들을 모두 파악해서 TodoList 에 추가
    extractTodoList() {
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
      setTodoList((prev) => {
        return {
          ...prev,
          extracted: diaryTodolist,
        };
      });
    },

    extractDiary() {
      const [total] = Editor.nodes(editor);
      if (!total) return;

      return serializeSlateToHtml(total[0]);
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

  const checkEmpty = useDebouncedCallback(() => {
    const [total] = Editor.nodes(editor);
    const nodes = total[0].children;
    const firstNode = nodes[0].children;

    if (nodes.length === 1 && firstNode.length === 1 && !firstNode[0].text) {
      setSlateIsEmpty(true);
      return;
    }

    setSlateIsEmpty(false);
  }, 300);

  return (
    <Slate
      className={css.slateContainer}
      editor={editor}
      initialValue={initialValue}
      style={{
        minHeight: '300px',
      }}
      onChange={() => {
        checkEmpty();
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

const toggleMark = (editor, format) => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
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
  const editor = useSlate();

  return (
    <Button
      reversed
      active={isMarkActive(editor, format)}
      onClick={() => {
        toggleMark(editor, format);
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

const serializeSlateToHtml = (node) => {
  if (Text.isText(node)) {
    if (node.code) return `<code>${node.text}</code>`;
    return node.text;
  }

  const children = node.children.map((n) => serializeSlateToHtml(n)).join('');

  if (node.type === 'paragraph') {
    return `<p>${children}</p>`;
  }

  return children;
};

export default SlateEditor;
