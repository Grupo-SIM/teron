import { getDeleteConfirmationDefaults } from './delete-confirmation'

describe('file deletion confirmation defaults', () => {
  it('handles files and subclasses without persisted action props', () => {
    expect(getDeleteConfirmationDefaults([
      ['drive:class:File', 'drive:class:Resource'],
      ['custom:class:File', 'drive:class:File', 'drive:class:Resource']
    ])).toEqual({
      confirmation: 'drive:string:DeleteFileConfirm',
      confirmationTitle: 'drive:string:DeleteFile'
    })
  })

  it('keeps generic confirmation for folders, mixed selections and empty selections', () => {
    expect(getDeleteConfirmationDefaults([['drive:class:Folder']])).toBeUndefined()
    expect(getDeleteConfirmationDefaults([['drive:class:File'], ['drive:class:Folder']])).toBeUndefined()
    expect(getDeleteConfirmationDefaults([])).toBeUndefined()
  })
})
