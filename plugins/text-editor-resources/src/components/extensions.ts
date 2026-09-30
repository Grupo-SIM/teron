//
// Copyright © 2023, 2024 Hardcore Engineering Inc.
//
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
//

import textEditor from '../plugin'
import { translate } from '@hcengineering/platform'
import { themeStore } from '@hcengineering/theme'
import { IconScribble } from '@hcengineering/ui'
import view from '@hcengineering/view'
import { type Editor, type Range } from '@tiptap/core'
import { get } from 'svelte/store'

import { type InlineCommandsOptions } from './extension/inlineCommands'
import type { SuggestionKeyDownProps, SuggestionProps } from './extension/suggestion'
import InlineCommandsList from './InlineCommandsList.svelte'
import { SvelteRenderer } from './node-view'

export const mInsertTable = [
  {
    id: '2x2',
    label: textEditor.string.Table2x2,
    rows: 2,
    cols: 2,
    header: false
  },
  {
    id: '3x3',
    label: textEditor.string.Table3x3,
    rows: 3,
    cols: 3,
    header: false
  },
  {
    id: '2x1',
    label: textEditor.string.Table2x1,
    rows: 2,
    cols: 1,
    header: false
  },
  {
    id: '5x5',
    label: textEditor.string.Table5x5,
    rows: 5,
    cols: 5,
    header: false
  },
  {
    id: '1x2',
    label: textEditor.string.Table1x2,
    rows: 1,
    cols: 2,
    header: false
  },
  {
    id: 'headed-2x2',
    label: textEditor.string.HeadedTable2x2,
    rows: 2,
    cols: 2,
    header: true
  },
  {
    id: 'headed-3x3',
    label: textEditor.string.HeadedTable3x3,
    rows: 3,
    cols: 3,
    header: true
  },
  {
    id: 'headed-2x1',
    label: textEditor.string.HeadedTable2x1,
    rows: 2,
    cols: 1,
    header: true
  },
  {
    id: 'headed-5x5',
    label: textEditor.string.HeadedTable5x5,
    rows: 5,
    cols: 5,
    header: true
  },
  {
    id: 'headed-1x2',
    label: textEditor.string.HeadedTable1x2,
    rows: 1,
    cols: 2,
    header: true
  }
]

const inlineCommandsIds = [
  'image',
  'table',
  'code-block',
  'separator-line',
  'todo-list',
  'drawing-board',
  'mermaid'
] as const
export type InlineCommandId = (typeof inlineCommandsIds)[number]

/**
 * @public
 */
export function inlineCommandsConfig (
  handleSelect: (id: string, pos: number, targetItem?: MouseEvent | HTMLElement) => Promise<void>,
  excludedCommands: InlineCommandId[] = []
): Partial<InlineCommandsOptions> {
  return {
    suggestion: {
      items: async () => {
        const commands = [
          { id: 'image', label: textEditor.string.Image, icon: view.icon.Image },
          { id: 'table', label: textEditor.string.Table, icon: view.icon.Table2 },
          { id: 'code-block', label: textEditor.string.CodeBlock, icon: view.icon.CodeBlock },
          { id: 'separator-line', label: textEditor.string.SeparatorLine, icon: view.icon.SeparatorLine },
          { id: 'todo-list', label: textEditor.string.TodoItem, icon: view.icon.TodoList },
          { id: 'drawing-board', label: textEditor.string.DrawingBoard, icon: IconScribble as any },
          { id: 'mermaid', label: textEditor.string.MermaidDiargram, icon: view.icon.Model }
        ].filter(({ id }) => !excludedCommands.includes(id as InlineCommandId))

        return await Promise.all(commands.map(async ({ label, ...command }) => ({
          ...command,
          text: await translate(label, {}, get(themeStore).language)
        })))
      },
      command: ({ editor, range, props }: { editor: Editor, range: Range, props: any }) => {
        editor.commands.deleteRange(range)

        if (props?.id != null) {
          const { node } = editor.view.domAtPos(range.from)
          const targetElement = node instanceof HTMLElement ? node : undefined

          void handleSelect(props.id, range.from, targetElement)
        }
      },
      render: () => {
        let component: any

        return {
          onStart: (props: SuggestionProps) => {
            component = new SvelteRenderer(InlineCommandsList, {
              element: document.body,
              props: {
                ...props,
                close: () => {
                  component?.destroy()
                }
              }
            })
          },
          onUpdate (props: SuggestionProps) {
            component?.updateProps(props)
          },
          onKeyDown (props: SuggestionKeyDownProps) {
            if (props.event.key === 'Escape') {
              props.event.stopPropagation()
            }
            return component?.onKeyDown(props)
          },
          onExit () {
            component?.destroy()
          }
        }
      }
    }
  }
}
