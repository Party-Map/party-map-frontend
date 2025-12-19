import L from 'leaflet'
import {cn} from '@/lib/utils'
import {MAP_PIN_COLORS} from "@/lib/constants";
import {PinIconState} from "@/lib/types";

function getPinColor({isActive, isHighlighted, isDark}: PinIconState): string {
    if (isActive) return MAP_PIN_COLORS.active
    if (isHighlighted) return MAP_PIN_COLORS.highlight
    return isDark ? MAP_PIN_COLORS.dark : MAP_PIN_COLORS.light
}

export function YouAreHereIcon() {
    const wrapper =
        'relative w-[24px] h-[24px] rounded-full pointer-events-none'

    const glow =
        'absolute -inset-2 rounded-full ' +
        'bg-[radial-gradient(circle,#60a5fa55,#60a5fa00_60%)] ' +
        'blur-[6px]'

    const ring =
        'absolute inset-[2px] rounded-full ' +
        'bg-[conic-gradient(from_0deg,#60a5fa,#a78bfa,#f472b6,#60a5fa)] ' +
        'blur-[0.5px] saturate-[1.1] opacity-90 ' +
        'animate-pm-you-rotate ' +
        '[mask-image:radial-gradient(circle,transparent_62%,black_63%)] ' +
        '[-webkit-mask-image:radial-gradient(circle,transparent_62%,black_63%)]'

    const core =
        'absolute inset-[6px] rounded-full ' +
        'bg-[radial-gradient(circle_at_35%_35%,#ffffff,#93c5fd_45%,#3b82f6_80%)] ' +
        'shadow-[0_0_0_2px_#fff,0_4px_16px_#3b82f6cc]'

    const waveBase =
        'absolute -inset-[2px] rounded-full border-2 border-[#60a5fa] ' +
        'opacity-0 animate-pm-you-wave ' +
        'motion-reduce:animate-none motion-reduce:opacity-40'

    const wave1 = waveBase
    const wave2 = waveBase + ' animate-pm-you-wave-delayed'

    return L.divIcon({
        className: 'pm-you-wrapper',
        html: `
      <div class="${wrapper}">
        <span class="${glow}"></span>
        <span class="${ring}"></span>
        <span class="${core}"></span>
        <span class="${wave1}"></span>
        <span class="${wave2}"></span>
      </div>
    `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
    })
}

export function PinIcon(state: PinIconState) {
    const color = getPinColor(state)
    const shiny = state.isActive || state.isHighlighted

    const pinBase =
        'relative w-[34px] h-[44px] origin-[50%_90%] ' +
        'transition-[transform,filter] duration-[350ms] ' +
        '[transition-timing-function:cubic-bezier(.4,.2,.2,1)]'

    const pin = cn(
        pinBase,
        shiny &&
        'translate-y-[-3px] scale-[1.08] ' +
        '[filter:drop-shadow(0_0_6px_var(--pin))_drop-shadow(0_0_18px_color-mix(in_srgb,var(--pin)_60%,transparent))]'
    )

    const headBase =
        'absolute top-0 left-1/2 -translate-x-1/2 ' +
        'w-[28px] h-[28px] rounded-full overflow-hidden ' +
        'bg-[radial-gradient(circle_at_30%_30%,#fff8,color-mix(in_srgb,var(--pin)_85%,#000)_55%,#000_90%)] ' +
        'shadow-[0_2px_4px_-1px_#000a,0_0_0_1px_#000_inset,0_0_10px_-2px_var(--pin)]'

    const head = cn(
        headBase,
        shiny &&
        'shadow-[0_0_0_1px_#000,0_0_12px_-2px_var(--pin),0_0_28px_-4px_var(--pin)]'
    )

    const core =
        'absolute inset-0 rounded-full ' +
        'bg-[radial-gradient(circle_at_60%_40%,color-mix(in_srgb,var(--pin)_65%,#fff)_0,var(--pin)_55%,#000_100%)] ' +
        'mix-blend-screen opacity-85'

    const gloss =
        'absolute top-[2px] left-[5px] w-[10px] h-[14px] rounded-full ' +
        'bg-[linear-gradient(140deg,#fff9,#ffffff05)] blur-[0.5px]'

    const shadow =
        'absolute bottom-[-4px] left-1/2 -translate-x-1/2 ' +
        'w-[22px] h-[6px] ' +
        'bg-[radial-gradient(circle_at_50%_50%,#0006,#0000_70%)]'

    const tail =
        'absolute bottom-0 left-1/2 -translate-x-1/2 ' +
        'w-[12px] h-[20px] ' +
        'bg-[linear-gradient(180deg,var(--pin),color-mix(in_srgb,var(--pin)_40%,#000))] ' +
        '[clip-path:polygon(50%_0,100%_20%,70%_100%,30%_100%,0_20%)] ' +
        '[filter:drop-shadow(0_3px_3px_#0008)]'

    const sparkWrapper = 'absolute inset-0 pointer-events-none'

    const sparkBase = cn(
        'absolute w-[4px] h-[4px] rounded-full ' +
        'bg-[radial-gradient(circle,#fff,#fff0)] opacity-0',
        shiny && 'animate-pm-spark',
        'motion-reduce:animate-none motion-reduce:opacity-40'
    )

    const spark1 = cn(
        sparkBase,
        'top-[6px] left-[6px] [animation-delay:.2s]'
    )
    const spark2 = cn(
        sparkBase,
        'top-[10px] right-[6px] [animation-delay:1.1s]'
    )
    const spark3 = cn(
        sparkBase,
        'bottom-[6px] left-[12px] [animation-delay:1.8s]'
    )

    const pulseRing =
        'absolute inset-[-4px] rounded-full border-2 ' +
        '[border-color:color-mix(in_srgb,var(--pin)_70%,#fff)] opacity-0 ' +
        'animate-pm-pulse motion-reduce:animate-none motion-reduce:opacity-40'

    return L.divIcon({
        className: 'pm-pin-wrapper',
        html: `
              <div class="${pin}" style="--pin:${color}">
                <div class="${shadow}"></div>
        
                <div class="${head}">
                  <div class="${core}"></div>
                  <div class="${gloss}"></div>
        
                  ${
            shiny
                ? `<span class="${pulseRing}"></span>`
                : ''
        }
        
                  <div class="${sparkWrapper}">
                    <span class="${spark1}"></span>
                    <span class="${spark2}"></span>
                    <span class="${spark3}"></span>
                  </div>
                </div>
        
                <div class="${tail}"></div>
              </div>
    `,
        iconSize: [36, 48],
        iconAnchor: [18, 44],
        popupAnchor: [0, -38],
    })
}
