import { useEffect, useState, type RefObject } from 'react'

// Same behaviour as navbar-reveal.js in Subapp 1: hide the navbar while scrolling
// down and show it again when the user scrolls up or moves the mouse to the top.
// Keyboard focus is handled in CSS with :focus-within.
const useNavbarReveal = (headerRef: RefObject<HTMLElement | null>) => {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const header = headerRef.current
    if (!header) return

    const topZone = 40
    const scrollTolerance = 4
    let lastScrollY = window.scrollY
    let revealedByMouse = false

    const headerHeight = () => header.offsetHeight

    // The hidden position moves the header up by exactly its own height.
    const updateHeight = () => {
      document.documentElement.style.setProperty('--site-header-height', `${headerHeight()}px`)
    }
    updateHeight()
    const observer = new ResizeObserver(updateHeight)
    observer.observe(header)

    const onScroll = () => {
      const scrollY = window.scrollY

      if (scrollY <= headerHeight()) {
        setHidden(false)
        revealedByMouse = false
      } else if (scrollY > lastScrollY + scrollTolerance) {
        setHidden(true)
        revealedByMouse = false
      } else if (scrollY < lastScrollY - scrollTolerance) {
        setHidden(false)
      }

      lastScrollY = scrollY
    }

    const onMouseMove = (event: MouseEvent) => {
      if (window.scrollY <= headerHeight()) return

      if (event.clientY <= topZone) {
        setHidden(false)
        revealedByMouse = true
      } else if (
        revealedByMouse &&
        event.clientY > headerHeight() + 24 &&
        !header.contains(document.activeElement)
      ) {
        setHidden(true)
        revealedByMouse = false
      }
    }

    // Show the navbar at once when keyboard focus enters it, before the browser
    // scrolls the page to bring the focused element into view. The class is changed
    // directly because a React state update would come too late.
    const onFocusIn = () => {
      if (!header.classList.contains('site-header-hidden')) return
      header.classList.add('site-header-instant')
      header.classList.remove('site-header-hidden')
      setHidden(false)
      requestAnimationFrame(() => header.classList.remove('site-header-instant'))
    }

    header.addEventListener('focusin', onFocusIn)
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('mousemove', onMouseMove, { passive: true })

    return () => {
      observer.disconnect()
      header.removeEventListener('focusin', onFocusIn)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('mousemove', onMouseMove)
      document.documentElement.style.removeProperty('--site-header-height')
    }
  }, [headerRef])

  return hidden
}

export default useNavbarReveal
