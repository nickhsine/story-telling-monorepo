import React from 'react'
import styled from 'styled-components'

const Icon = styled.div<{
  $bgImg?: string
  $hoverBgImg?: string
  $focusBgImg?: string
}>`
  cursor: pointer;
  width: 50px;
  height: 50px;

  background-image: url(${(props) => props.$bgImg || ''});

  &:hover {
    background-image: url(${(props) => props.$hoverBgImg || ''});
  }
`

type IconProps = {
  className?: string
  onClick?: () => void
  enabled?: boolean
}

export function PlayButton(props: IconProps) {
  return (
    <Icon
      className={props?.className}
      onClick={props?.onClick}
      $bgImg="/static/icons/play.svg"
      $hoverBgImg="/static/icons/play.hover.svg"
      $focusBgImg="/static/icons/play.hover.svg"
    />
  )
}

export function PauseButton(props: IconProps) {
  return (
    <Icon
      className={props?.className}
      onClick={props?.onClick}
      $bgImg="/static/icons/pause.svg"
      $hoverBgImg="/static/icons/pause.hover.svg"
      $focusBgImg="/static/icons/pause.hover.svg"
    />
  )
}

export function DeleteCaptionIcon(props: IconProps) {
  const disableImg = '/static/icons/delete.disable.svg'
  const enableImg = '/static/icons/delete.enable.svg'
  return (
    <Icon
      className={props?.className}
      onClick={props?.onClick}
      $bgImg={props?.enabled ? enableImg : disableImg}
      $hoverBgImg={props?.enabled ? enableImg : disableImg}
    />
  )
}

export function AddCaptionIcon(props: IconProps) {
  return (
    <Icon
      className={props?.className}
      onClick={props?.onClick}
      $bgImg="/static/icons/add-caption.svg"
      $hoverBgImg="/static/icons/add-caption.hover.svg"
    />
  )
}

export const MarkIcon = styled.div`
  cursor: pointer;
  width: 25px;
  height: 50px;

  background-image: url(/static/icons/mark.svg);
`

export const EditMarkIcon = styled(MarkIcon)`
  background-image: url(/static/icons/edit-mark.svg);
`

export const DeleteMarkIcon = styled(MarkIcon)`
  height: 25px;
  background-image: url(/static/icons/delete-mark.svg);
`
