import React from 'react'
import { AlertDialog } from '@keystone-ui/modals'
import { CaptionInput } from './button'
import { CaptionState } from './type'
import { DeleteMarkIcon, EditMarkIcon, MarkIcon } from './styled'
import { useState } from 'react'
import styled from 'styled-components'

const Container = styled.div`
  position: relative;

  svg {
    width: 40px;
  }

  svg:nth-child(2) {
    position: absolute;
    width: 40px;
    height: 40px;
    bottom: -20px;
    left: 0px;
  }
`

const modes = {
  default: 'default',
  tooltip: 'tooltip',
  edit: 'edit',
  delete: 'delete',
}

export function CaptionMark({
  className,
  captionState,
  onChange,
}: {
  className?: string
  captionState: CaptionState
  onChange: (arg0: CaptionState | null) => void
}) {
  const [mode, setMode] = useState(modes.default)

  let iconsJsx = null

  switch (mode) {
    case modes.tooltip:
    case modes.delete:
    case modes.edit: {
      iconsJsx = (
        <>
          <EditMarkIcon
            onClick={() => {
              setMode(modes.edit)
            }}
          />
          <DeleteMarkIcon
            onClick={() => {
              setMode(modes.delete)
            }}
          />
        </>
      )
      break
    }

    case modes.default:
    default: {
      iconsJsx = (
        <MarkIcon
          onClick={() => {
            setMode(modes.tooltip)
          }}
        />
      )
      break
    }
  }

  const deleteAlertJsx = (
    // @ts-ignore `children` should be optional
    <AlertDialog
      title="確認刪除"
      isOpen={mode === modes.delete}
      actions={{
        cancel: {
          label: 'Cancel',
          action: () => {
            setMode(modes.default)
          },
        },
        confirm: {
          label: 'Confirm',
          action: () => {
            onChange(null)
            setMode(modes.default)
          },
        },
      }}
    ></AlertDialog>
  )

  return (
    <Container className={className}>
      {mode === modes.edit && (
        <CaptionInput
          onConfirm={(captionState) => {
            onChange(captionState)
            setMode(modes.default)
          }}
          onCancel={() => {
            setMode(modes.default)
          }}
          isOpen={true}
          inputValue={captionState}
        />
      )}
      {deleteAlertJsx}
      {iconsJsx}
    </Container>
  )
}
