<!--
// Copyright © 2020, 2021 Anticrm Platform Contributors.
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
-->
<script lang="ts">
  import { Analytics } from '@hcengineering/analytics'
  import platform, { loadPluginStrings, setMetadata } from '@hcengineering/platform'
  import { onMount, setContext } from 'svelte'
  import { writable } from 'svelte/store'
  import { ThemeVariant } from './variants'
  import {
    ThemeOptions,
    getCurrentFontSize,
    getCurrentLanguage,
    getCurrentTheme,
    isThemeDark,
    themeStore as themeOptions,
    getCurrentEmoji
  } from './'

  const currentTheme = writable<string>(getCurrentTheme())
  const currentFontSize = writable<string>(getCurrentFontSize())
  const currentLanguage = writable<string>(getCurrentLanguage())
  const currentEmoji = writable<string>(getCurrentEmoji())

  const setOptions = (currentFont: string, theme: string, language: string, emoji: string) => {
    themeOptions.set(new ThemeOptions(currentFont === 'normal-font' ? 16 : 14, isThemeDark(theme), language, emoji))
  }

  const setRootColors = (_theme: string, set = true) => {
    const theme = ThemeVariant.Dark
    currentTheme.set(theme)
    if (set) {
      localStorage.setItem('theme', theme)
    }
    document.documentElement.setAttribute(
      'class',
      `${ThemeVariant.Dark} ${getCurrentFontSize()} ${getCurrentEmoji()}`
    )
    setOptions(getCurrentFontSize(), theme, getCurrentLanguage(), getCurrentEmoji())
  }
  const setRootFontSize = (fontsize: string, set = true) => {
    currentFontSize.set(fontsize)
    if (set) {
      localStorage.setItem('fontsize', fontsize)
    }
    document.documentElement.setAttribute(
      'class',
      `${ThemeVariant.Dark} ${fontsize} ${getCurrentEmoji()}`
    )
    setOptions(fontsize, ThemeVariant.Dark, getCurrentLanguage(), getCurrentEmoji())
  }
  const setLanguage = async (language: string, set: boolean = true) => {
    currentLanguage.set(language)
    if (set) {
      localStorage.setItem('lang', language)
    }
    Analytics.setTag('language', language)
    setMetadata(platform.metadata.locale, $currentLanguage)
    await loadPluginStrings($currentLanguage, set)
    setOptions(getCurrentFontSize(), getCurrentTheme(), language, getCurrentEmoji())
  }
  const setEmoji = (emoji: string, set = true) => {
    currentEmoji.set(emoji)
    if (set) {
      localStorage.setItem('emoji', emoji)
    }
    document.documentElement.setAttribute(
      'class',
      `${ThemeVariant.Dark} ${getCurrentFontSize()} ${emoji}`
    )
    setOptions(getCurrentFontSize(), ThemeVariant.Dark, getCurrentLanguage(), emoji)
  }

  setContext('theme', {
    currentTheme,
    setTheme: setRootColors
  })
  setContext('fontsize', {
    currentFontSize,
    setFontSize: setRootFontSize
  })
  setContext('lang', {
    currentLanguage,
    setLanguage
  })
  setContext('emoji', {
    currentEmoji,
    setEmoji
  })

  const setDocumentLanguage = (): void => {
    document.documentElement.lang = $currentLanguage
  }

  onMount(() => {
    setRootColors($currentTheme)
    setRootFontSize($currentFontSize, false)
    void setLanguage($currentLanguage, false)
    void loadPluginStrings($currentLanguage)
    setDocumentLanguage()
  })
</script>

<slot />
