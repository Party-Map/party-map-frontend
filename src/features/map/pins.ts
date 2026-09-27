import L, { type DivIcon } from 'leaflet'
import { cx } from '@/lib/cx'

export type PinState = {
  isActive: boolean
  isHighlighted: boolean
}

/**
 * Gradient map pin with sparks and a pulse ring while highlighted or active. Colours are the
 * --pin-default / --pin-highlight / --pin-active tokens, resolved in pins.css, so pins follow the
 * theme without being rebuilt.
 */
export function createPinIcon({ isActive, isHighlighted }: PinState): DivIcon {
  const shiny = isActive || isHighlighted
  const pinClass = cx('pm-pin', isActive ? 'pm-pin--active' : isHighlighted && 'pm-pin--highlight', shiny && 'pm-pin--shiny')

  const html = `
    <div class="${pinClass}">
      <div class="pm-pin__shadow"></div>
      <div class="pm-pin__head">
        <div class="pm-pin__core"></div>
        <div class="pm-pin__gloss"></div>
        ${shiny ? '<span class="pm-pin__pulse"></span>' : ''}
        <div class="pm-pin__sparks">
          <span class="pm-pin__spark pm-pin__spark--1"></span>
          <span class="pm-pin__spark pm-pin__spark--2"></span>
          <span class="pm-pin__spark pm-pin__spark--3"></span>
        </div>
      </div>
      <div class="pm-pin__tail"></div>
    </div>`

  return L.divIcon({
    className: 'pm-pin-wrapper',
    html,
    iconSize: [36, 48],
    iconAnchor: [18, 44],
    popupAnchor: [0, -38],
  })
}

const pinIcons = new Map<string, DivIcon>()

/** One shared icon per state, so markers keep their DOM (and running animations) across re-renders. */
export function getPinIcon(state: PinState): DivIcon {
  const key = `${state.isActive ? 'active' : 'idle'}/${state.isHighlighted ? 'highlight' : 'plain'}`
  const cached = pinIcons.get(key)
  if (cached) return cached
  const icon = createPinIcon(state)
  pinIcons.set(key, icon)
  return icon
}

/** "You are here" dot: glowing core, rotating conic ring and two expanding waves. */
export function createYouAreHereIcon(): DivIcon {
  const html = `
    <div class="pm-you">
      <span class="pm-you__glow"></span>
      <span class="pm-you__ring"></span>
      <span class="pm-you__core"></span>
      <span class="pm-you__wave"></span>
      <span class="pm-you__wave pm-you__wave--delayed"></span>
    </div>`

  return L.divIcon({ className: 'pm-you-wrapper', html, iconSize: [28, 28], iconAnchor: [14, 14] })
}
