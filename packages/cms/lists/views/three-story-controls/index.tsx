import { useEffect, useState, useRef } from 'react'
import { FieldProps } from '@keystone-6/core/types'
import { FieldContainer, FieldLabel } from '@keystone-ui/fields'
import { controller } from '@keystone-6/core/fields/types/json/views'
import { CameraHelperProps } from '@story-telling-reporter/react-three-story-controls'

export const Field = ({
  field,
  value,
  onChange: onFieldChange,
}: FieldProps<typeof controller>) => {
  const [cameraHelperProp, setCameraHelperProp] = useState(
    value ? JSON.parse(value) : {}
  )
  const [prevValue, setPrevValue] = useState(value)
  const [, setMounted] = useState(false)
  const CameraHelperRef = useRef<React.ComponentType<CameraHelperProps> | null>(
    null
  )

  if (value !== prevValue) {
    setPrevValue(value)
    setCameraHelperProp(value ? JSON.parse(value) : {})
  }

  useEffect(() => {
    // The reason we don't `import {CameraHelper} from '@story-telling-reporter/react-three-story-controls'`
    // at the beginning of this file is because Keystone server will fail to render the page.
    // The root cause is not clear so far.
    // Just know the error is related to Webpack.
    // Keystone uses Webpack and its related loaders, such as babel-loader, to transpile the source codes (this file).
    // But, Webpack cannot handle the import well.
    // The following is a workaround to solve this error.
    const {CameraHelper} = require('@story-telling-reporter/react-three-story-controls')  // eslint-disable-line
    CameraHelperRef.current =
      CameraHelper as React.ComponentType<CameraHelperProps>

    // force re-rendering
    setMounted(true)
  }, [])

  const Component = CameraHelperRef.current
  const modelObjs = cameraHelperProp?.modelObjs || []
  const pois = cameraHelperProp?.pois || []

  return (
    <FieldContainer>
      <FieldLabel>{field.label}</FieldLabel>
      {Component && (
        <div
          style={{
            maxWidth: '50vw',
            height: '300px',
            position: 'relative',
            zIndex: '30',
          }}
        >
          <Component
            modelObjs={modelObjs}
            pois={pois}
            onChange={(value) => {
              if (typeof onFieldChange === 'function') {
                onFieldChange(
                  JSON.stringify(Object.assign({ modelObjs }, value))
                )
              }
            }}
          />
        </div>
      )}
    </FieldContainer>
  )
}