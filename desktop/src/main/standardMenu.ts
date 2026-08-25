//
// Copyright © 2024 Hardcore Engineering Inc.
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

import { BrowserWindow, Menu, MenuItemConstructorOptions } from 'electron'
import { Command, CommandOpenSettings, CommandSelectWorkspace, CommandLogout } from '../ui/types'
import { openFindInPageBar } from './findInPage'
import { translateDesktop } from '../i18n'

const isMac = process.platform === 'darwin'
const isLinux = process.platform === 'linux'

export const addMenus = (sendCommand: (cmd: Command, ...args: any[]) => void): void => {
  const template: MenuItemConstructorOptions[] = [
    {
      label: translateDesktop('menu.file'),
      submenu: [
        {
          label: translateDesktop('menu.settings'),
          accelerator: isLinux ? 'Ctrl+,' : 'Meta+,',
          click: () => { sendCommand(CommandOpenSettings) }
        },
        {
          label: translateDesktop('menu.selectWorkspace'),
          click: () => { sendCommand(CommandSelectWorkspace) }
        },
        {
          label: translateDesktop('menu.logout'),
          click: () => { sendCommand(CommandLogout) }
        },
        { role: isMac ? 'close' : 'quit' }
      ]
    },
    {
      label: translateDesktop('menu.search'),
      submenu: [
        {
          label: translateDesktop('menu.find'),
          click: (_item, browserWindow) => {
            openFindInPageBar(browserWindow as BrowserWindow | undefined)
          }
        }
      ]
    },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' }
  ]
  if (isMac) {
    template.unshift({ role: 'appMenu' })
  }
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}
