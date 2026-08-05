import { EditorView, basicSetup } from 'codemirror';
import { keymap } from '@codemirror/view';
import { sql, PostgreSQL } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import { Prec } from '@codemirror/state';

export function createEditor(parent, onSubmit, onChange) {
  const view = new EditorView({
    doc: '',
    parent,
    extensions: [
      basicSetup,
      // Діалект має збігатися з рушієм (PGlite): інакше редактор не знає
      // ключових слів PostgreSQL і, навпаки, підказує SQLite-івські, яких
      // база не приймає.
      sql({ dialect: PostgreSQL }),
      oneDark,
      EditorView.lineWrapping,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) onChange?.(update.state.doc.toString());
      }),
      Prec.highest(
        keymap.of([
          {
            key: 'Mod-Enter',
            run: () => {
              onSubmit();
              return true;
            },
          },
        ])
      ),
    ],
  });

  return {
    getValue: () => view.state.doc.toString(),
    setValue: (text) => {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text } });
    },
    focus: () => view.focus(),
  };
}
