import React, { useEffect, useRef, useState } from 'react'
import debounce from 'lodash/debounce'
import { gsap } from 'gsap/dist/gsap'
import styled from '../styled-components'
import { DraftRenderer } from '../draft-renderer/index'
import { RawDraftContentState } from 'draft-js' // eslint-disable-line
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import { mediaQuery } from '../utils/media-query'
import { useGSAP } from '@gsap/react'
import { CaptionState } from '../type'

const _ = {
  debounce,
} // lodash

gsap.registerPlugin(ScrollTrigger)

const Container = styled.div`
  background-color: #e2e2e2;
  width: 100vw;
`

const Sections = styled.div`
  position: relative;
`

const Buttons = styled.div`
  position: absolute;
  top: -40px;
  right: 0px;

  display: flex;
  justify-content: space-around;
  align-items: center;

  > div {
    cursor: pointer;
    width: 40px;
    height: 40px;
  }
`

const Section = styled.div`
  position: absolute;
  padding: 24px 16px;

  &[data-section-dark-mode='false'] {
    background-color: rgba(255, 255, 255, 0.5);
  }

  &[data-section-dark-mode='true'] {
    background-color: rgba(0, 0, 0, 0.5);
  }

  ${mediaQuery.mobileOnly} {
    // horizontally center
    left: 0;
    right: 0;
    margin-left: auto;
    margin-right: auto;

    &[data-section-narrow-width='true'] {
      width: 75vw;
    }

    &[data-section-narrow-width='false'] {
      width: 100vw;
      max-width: 720px;
    }
  }

  ${mediaQuery.tabletAbove} {
    &[data-section-narrow-width='true'] {
      width: 320px;
    }

    &[data-section-narrow-width='false'] {
      width: 46vw;
      max-width: 720px;
    }

    &[data-section-alignment='left'] {
      left: 4vw;
    }
    &[data-section-alignment='right'] {
      right: 4vw;
    }
    &[data-section-alignment='center'] {
      // horizontally center
      left: 0;
      right: 0;
      margin-left: auto;
      margin-right: auto;
    }
  }
`

const BackgroundVideo = styled.div`
  width: 100vw;
  height: 100vh;

  position: sticky;
  top: 0;

  > video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

const DebugPanel = styled.div`
  position: absolute;
  top: 50px;
  right: 50px;

  &.darkMode {
    color: white;
  }

  &.lightMode {
    color: black;
  }
`

type VideoObj = {
  duration: number
  src: string
  type?: string
  preload?: string
  mobileSrc: string
  mobileType?: string
}

export type ScrollableVideoProps = {
  className?: string
  captions: CaptionState[]
  video: VideoObj
  darkMode?: boolean
  secondsPer100vh?: number
  scrollerRef?: React.RefObject<HTMLElement>
  readOnly?: boolean
  onEdit: (arg: number) => void
  onRemove: (arg: number) => void
}

export function ScrollableVideo({
  className,
  captions = [],
  video,
  darkMode = false,
  secondsPer100vh = 1.5,
  scrollerRef,
  readOnly = true,
  onEdit,
  onRemove,
}: ScrollableVideoProps) {
  const [windowObject, setWindowObject] = useState({
    innerWidth: 0,
    innerHeight: 0,
  })
  const scrollTriggerInstance = useRef<ScrollTrigger | null>(null)
  const scrollTriggerRef = useRef<HTMLDivElement>(null)
  const lastSectionRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [lastSectionOverflowHeight, setLastSectionOverflowHeight] = useState(0) // px
  const [pickedVideoSource, setPickedVideoSource] = useState('')
  const [debugMode, setDebugMode] = useState(false)
  const duration = video.duration
  const [debugState, setDebugState] = useState({ currentTime: 0 })

  // use gsap ScrollTrigger to check if
  // Sections are in the viewport or not,
  // and if the Sections are in the viewport,
  // use the scroll progress to manipulate the video player.
  useGSAP(
    () => {
      if (!scrollTriggerRef.current) {
        return
      }

      const videoEle = videoRef.current

      if (scrollTriggerInstance.current) {
        // kill old instance to avoid getting stale dependencies
        scrollTriggerInstance.current.kill()
      }

      scrollTriggerInstance.current = ScrollTrigger.create({
        markers: debugMode,
        trigger: scrollTriggerRef.current,
        start: 'top 50%',
        end: 'bottom 50%',
        scroller: scrollerRef?.current || window,
        onUpdate: ({ progress }: { progress: number }) => {
          if (videoEle && !videoEle?.seeking) {
            const time = Number((progress * duration).toFixed(2))
            videoEle.currentTime = time
            if (debugMode) {
              setDebugState((prevState) => {
                return Object.assign({}, prevState, {
                  currentTime: time,
                })
              })
            }
          }
        },
      })

      return () => {
        if (scrollTriggerInstance.current) {
          scrollTriggerInstance.current.kill()
        }
      }
    },
    {
      scope: scrollTriggerRef,
      dependencies: [debugMode, windowObject, scrollerRef],
    }
  )

  // In order to play video by `play()` method, we need to follow browser video autoplay policy.
  // For autoplay policy information, see https://developer.mozilla.org/en-US/docs/Web/Media/Autoplay_guide.
  //
  // The video is allowed to autoplay or `play()` by JavaScript only if at least one of the following
  // is true.
  // 1. The video is muted or its volume is set to 0
  // 2. The user has interacted with the webpage (by clicking, tapping, etc.)
  //
  // Since the scrollable video is designed to be muted,
  // we set video element to `muted=true` manually to make `play()` method work well.
  //
  // The reason we don't add `muted={true}` in `<Video>` component is because
  // React does not support `muted` props yet. For related issue, see https://github.com/facebook/react/issues/10389.
  useEffect(() => {
    const video = videoRef.current
    if (!video) {
      return
    }
    // mute video to enable `video.play()`
    video.muted = true

    const fixCornerCaseOnIOS = () => {
      // `play()` here is to clear play button when iOS is under the low battery mode.
      const startPlayPromise = video.play()
      if (startPlayPromise !== undefined) {
        startPlayPromise
          // play successfully
          .then(() => {
            console.log('[react-scrollable-video] video plays successfully.')
            video.setAttribute('data-played', 'true')
            // `pause()` video after `play()` successfully
            video.pause()
          })
          // fail to play
          .catch((error) => {
            // browser prevent from playing audio before user interactions
            console.log('[react-scrollable-video] unable to play video')
            console.log('[react-scrollable-video] error: ', error)
          })
      }
      window.removeEventListener('touchstart', fixCornerCaseOnIOS)
    }
    window.addEventListener('touchstart', fixCornerCaseOnIOS)

    return () => {
      window.removeEventListener('touchstart', fixCornerCaseOnIOS)
    }
  }, [pickedVideoSource])

  useEffect(() => {
    // pick video.src according to viewport width
    const pickVideoSource = () => {
      const viewportWidth = window.innerWidth

      if (viewportWidth >= 768 && video?.src) {
        return video.src
      } else if (viewportWidth < 768 && video?.mobileSrc) {
        return video.mobileSrc
      } else if (video?.src) {
        return video.src
      }

      return video.mobileSrc
    }

    // In some edge cases,
    // if the last section contains lots of paragraphs,
    // it might overflow the its container.
    // If the edge case happens, the following side effect
    // will increase height of the container to not overflow
    // the last section.
    const handleLastSectionOverflow = () => {
      const sections = scrollTriggerRef.current
      const lastSection = lastSectionRef.current
      if (sections && lastSection) {
        const overflowHeight =
          lastSection?.getBoundingClientRect()?.bottom -
          sections?.getBoundingClientRect()?.bottom
        if (overflowHeight > 0) {
          setLastSectionOverflowHeight(overflowHeight)
        }
      }
    }

    const handleResize = _.debounce(() => {
      const videoSource = pickVideoSource()
      setPickedVideoSource(videoSource)

      handleLastSectionOverflow()

      if (window.innerWidth !== windowObject.innerWidth) {
        setWindowObject({
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
        })
      }
    }, 300)

    handleResize()

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [windowObject, video.src, video.mobileSrc])

  // use query param to enable debugMode
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    if (searchParams.has('debug')) {
      setDebugMode(true)
    }
  }, [])

  if (windowObject.innerWidth === 0) {
    return null
  }

  const sectionsJsx = captions.map((caption, idx) => {
    const startTime = caption.startTime
    const _top = Math.round((startTime / secondsPer100vh) * 100) / 100
    const top = `${_top * windowObject.innerHeight}px`
    const sectionId = caption.id ? `section-${caption.id}` : undefined
    const key = sectionId ?? idx
    return (
      <Section
        id={sectionId}
        className="section"
        data-section-narrow-width={caption.width !== 'wide'}
        data-section-dark-mode={darkMode}
        data-section-alignment={caption.alignment ?? 'left'}
        ref={idx === captions.length - 1 ? lastSectionRef : undefined}
        key={key}
        style={{
          top,
        }}
      >
        {!readOnly && (
          <Buttons>
            <EditButton
              darkMode={darkMode}
              onClick={() => {
                onEdit(idx)
              }}
            />
            <DeleteButton
              darkMode={darkMode}
              onClick={() => {
                onRemove(idx)
              }}
            />
          </Buttons>
        )}
        <DraftRenderer
          darkMode={darkMode}
          rawContentState={caption.rawContentState}
        />
      </Section>
    )
  })

  const _sectionsHeight = Math.round((duration / secondsPer100vh) * 100) / 100
  const sectionsHeight = `${_sectionsHeight * windowObject.innerHeight}px`
  const lastSectionHeight = `${lastSectionOverflowHeight}px`

  return (
    <Container
      className={
        className
          ? className + ' scrollable-video container'
          : 'scrollable-video container'
      }
    >
      <BackgroundVideo>
        <video
          ref={videoRef}
          preload={video?.preload || 'auto'}
          data-twreporter-story-telling
          data-react-scrollable-video
          data-autoplay={true}
          data-played={false}
          playsInline
          src={pickedVideoSource}
        />
        {debugMode && (
          <DebugPanel className={darkMode ? 'darkMode' : 'lightMode'}>
            duration: {debugState.currentTime}/{duration}
            <br />
            sectionsHeight: {sectionsHeight}
            <br />
            width: {windowObject?.innerWidth}
            <br />
            height: {windowObject.innerHeight}
            <br />
          </DebugPanel>
        )}
      </BackgroundVideo>
      <Sections
        ref={scrollTriggerRef}
        style={{ height: sectionsHeight }}
        className="sections"
      >
        {sectionsJsx}
      </Sections>
      <LastSectionOverflowHeight style={{ height: lastSectionHeight }} />
    </Container>
  )
}

const LastSectionOverflowHeight = styled.div``

const staticFileURLPrefix =
  'https://www.unpkg.com/@story-telling-reporter/react-scrollable-video/public/icons'

const Icon = styled.div<{
  $bgImg?: string
  $hoverBgImg?: string
  $focusBgImg?: string
}>`
  background-image: url(${(props) => props.$bgImg || ''});

  &:hover {
    background-image: url(${(props) => props.$hoverBgImg || ''});
  }
`

type IconProps = {
  className?: string
  onClick?: () => void
  darkMode?: boolean
}

export function DeleteButton(props: IconProps) {
  const svg = staticFileURLPrefix + '/delete.svg'
  const svgHover = staticFileURLPrefix + '/delete.hover.svg'
  const svgDark = staticFileURLPrefix + '/delete.dark.svg'
  const svgDarkHover = staticFileURLPrefix + '/delete.dark.hover.svg'
  return (
    <Icon
      className={props?.className}
      onClick={props?.onClick}
      $bgImg={props?.darkMode ? svgDark : svg}
      $hoverBgImg={props?.darkMode ? svgDarkHover : svgHover}
    />
  )
}

export function EditButton(props: IconProps) {
  const svg = staticFileURLPrefix + '/edit.svg'
  const svgHover = staticFileURLPrefix + '/edit.hover.svg'
  const svgDark = staticFileURLPrefix + '/edit.dark.svg'
  const svgDarkHover = staticFileURLPrefix + '/edit.dark.hover.svg'
  return (
    <Icon
      className={props?.className}
      onClick={props?.onClick}
      $bgImg={props?.darkMode ? svgDark : svg}
      $hoverBgImg={props?.darkMode ? svgDarkHover : svgHover}
    />
  )
}
