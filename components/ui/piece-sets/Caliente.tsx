/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

// This file contains the "Caliente" chess piece SVG set.

type PieceProps = React.SVGProps<SVGSVGElement>;

export const CalienteWhitePawn = (props: PieceProps) => (
<svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 16.933331 16.933331" {...props}>
    <defs>
        <linearGradient id="cwp-b"><stop offset="0" stopColor="#fff"/></linearGradient>
        <linearGradient id="cwp-c" gradientTransform="translate(-6e-8 2.1166665)"><stop offset="0" stopColor="#ccc"/></linearGradient>
        <linearGradient id="cwp-a"><stop offset="0" stopOpacity=".2"/></linearGradient>
        <linearGradient xlinkHref="#cwp-a" id="cwp-d" x1="4.2333326" x2="103.04872" y1="24.341663" y2="24.341663" gradientTransform="matrix(1 0 0 1.25 .79374989 -3.0427069)" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cwp-b" id="cwp-e" x1="4.7624993" x2="12.170832" y1="9.5249987" y2="9.5249987" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cwp-c" id="cwp-f" gradientTransform="translate(-6e-8 2.1166665)" gradientUnits="userSpaceOnUse"/>
    </defs>
    <path fill="url(#cwp-d)" d="M5.0270826 14.816665c0 .992188 2.645833 1.322916 4.2333328 1.322916 1.5874976 0 4.2333306-.330728 4.2333306-1.322916 0-.992187-2.778792-1.322916-4.2333306-1.322916-1.4545399 0-4.2333328.330729-4.2333328 1.322916z" className="UnoptimicedTransforms" style={{ fontVariationSettings: 'normal' }} transform="matrix(1.09375 0 0 1 -1.2650402 9.6e-7)"/>
    <path fill="url(#cwp-e)" d="M4.7624993 14.287498c1.5874998.529167 3.7041663.529167 3.7041663.529167s2.1166664 0 3.7041664-.529167c0-2.116666-.79375-2.645833-2.38125-4.233333 1.5875-1.5874995.79375-2.6458327-.2645833-3.7041659.7937503-.7937499 0-2.1166663-1.0583332-2.1166663S6.6145824 5.5562492 7.4083323 6.3499991C6.3499991 7.4083323 5.5562492 8.4666655 7.143749 10.054165c-1.5874998 1.5875-2.3812497 2.116667-2.3812497 4.233333z"/>
    <path fill="url(#cwp-f)" d="m12.170833 14.287498-1.852084.529167c0-.835948-.247609-1.630627-.5309499-2.335143-.4340941-1.079359-.9520569-1.947087-.7919669-2.427357.2645834-.7937496.2645833-1.0583329.2645833-1.5874995 0-1.0583332-.7937499-1.3229165-.5291666-2.1166664.2645833-.7937499 0-1.5874998-.7937499-1.8520831 1.3229165-.5291666 1.6436342 1.3657023 1.8520831 1.8520831.3385889.7900413 1.0583339 2.3812497 0 3.7041659 1.8520839 1.5875 2.3812509 3.721739 2.3812509 4.233333z"/>
    <path fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.05833" d="M4.7624993 14.287498c1.5874998.529167 3.7041663.529167 3.7041663.529167s2.1166664 0 3.7041664-.529167c0-2.116666-.79375-2.645833-2.38125-4.233333 1.5875-1.5874995.79375-2.6458327-.2645833-3.7041659.7937503-.7937499 0-2.1166663-1.0583332-2.1166663S6.6145824 5.5562492 7.4083323 6.3499991C6.3499991 7.4083323 5.5562492 8.4666655 7.143749 10.054165c-1.5874998 1.5875-2.3812497 2.116667-2.3812497 4.233333z"/>
</svg>
);
export const CalienteWhiteKnight = (props: PieceProps) => (
<svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 16.933329 16.93333" {...props}>
    <defs>
        <linearGradient id="cwn-a"><stop offset="0" stopColor="#fff"/></linearGradient>
        <linearGradient id="cwn-b" gradientTransform="translate(-6e-8 2.1166665)"><stop offset="0" stopColor="#ccc"/></linearGradient>
        <linearGradient id="cwn-c"><stop offset="0" stopOpacity=".2"/></linearGradient>
        <linearGradient xlinkHref="#cwn-a" id="cwn-e" x1="4.0848351" x2="13.229165" y1="8.8635406" y2="8.8635406" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cwn-b" id="cwn-f" gradientTransform="translate(-6e-8 2.1166665)" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cwn-c" id="cwn-d" x1="4.2333326" x2="103.04872" y1="24.341663" y2="24.341663" gradientTransform="matrix(1 0 0 1.25 .79374989 -3.0427069)" gradientUnits="userSpaceOnUse"/>
    </defs>
    <path fill="url(#cwn-d)" d="M5.0270826 14.816665c0 .992188 2.645833 1.322916 4.2333328 1.322916 1.5874976 0 4.2333306-.330728 4.2333306-1.322916 0-.992187-2.778792-1.322916-4.2333306-1.322916-1.4545399 0-4.2333328.330729-4.2333328 1.322916z" className="UnoptimicedTransforms" style={{ fontVariationSettings: 'normal' }} transform="matrix(1.09375 0 0 1 -1.265043 9.6e-7)"/>
    <g transform="translate(.000003)">
        <path fill="url(#cwn-e)" d="M4.7624993 14.287498c1.5874998.529167 3.7041663.529167 3.7041663.529167s2.1166664 0 3.7041664-.529167c-.79375-2.38125 1.058333-3.968749 1.058333-6.3499991 0-3.9687494-4.7624995-5.0270826-4.7624995-5.0270826v1.3229164S4.4979159 7.143749 4.2333327 7.4083323c-.2645832.2645833-.1183253.5570994 0 .7937499.2645833.5291666.5291666.7937499.7937499 1.0583332.2645833.2645833.5291666.2645833.7937499 0 .2645833-.2645833.7937499-.5291666 1.0583332-.5291666.2645833 0 1.0583332.2645833 1.3229165.2645833.2645833 0 1.3229165-.2645833 1.8520828-.7937499-1.3229162 1.3229165-2.1166661 1.3229165-2.910416 1.8520828-.7937499.529167-2.3812497 2.116667-2.3812497 4.233333Z"/>
        <path fill="url(#cwn-f)" d="m-6.0854366 12.699998.2645826 1.5875-2.3812468.529167c-.5291664-3.968749 2.9104162-4.233333 2.9104162-6.8791661.7937499.7937499-.793752 4.7624991-.793752 4.7624991z" style={{ fontVariationSettings: 'normal' }} transform="translate(17.991677)"/>
        <path fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.05833" d="M4.7624993 14.287498c1.5874998.529167 3.7041663.529167 3.7041663.529167s2.1166664 0 3.7041664-.529167c-.79375-2.38125 1.058333-3.968749 1.058333-6.3499991 0-3.9687494-4.7624995-5.0270826-4.7624995-5.0270826v1.3229164S4.4979159 7.143749 4.2333327 7.4083323c-.2645832.2645833-.1183253.5570994 0 .7937499.2645833.5291666.5291666.7937499.7937499 1.0583332.2645833.2645833.5291666.2645833.7937499 0 .2645833-.2645833.7937499-.5291666 1.0583332-.5291666.2645833 0 1.0583332.2645833 1.3229165.2645833.2645833 0 1.3229165-.2645833 1.8520828-.7937499-1.3229162 1.3229165-2.1166661 1.3229165-2.910416 1.8520828-.7937499.529167-2.3812497 2.116667-2.3812497 4.233333Z"/>
        <ellipse cx="8.7312489" cy="6.0854158" rx=".52916664" ry=".52916658"/>
        <path fill="none" stroke="#000" strokeLinejoin="round" strokeWidth="1.05833" d="M11.906243 12.699998c-1.322916.529167-3.4395775.529167-3.4395775.529167s-2.1166722 0-3.4395887-.529167"/>
    </g>
</svg>
);
export const CalienteWhiteBishop = (props: PieceProps) => (
<svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 16.933327 16.933331" {...props}>
    <defs>
        <linearGradient id="cwb-a"><stop offset="0" stopColor="#fff"/></linearGradient>
        <linearGradient id="cwb-b" gradientTransform="translate(-6e-8 2.1166665)"><stop offset="0" stopColor="#ccc"/></linearGradient>
        <linearGradient id="cwb-c"><stop offset="0" stopOpacity=".2"/></linearGradient>
        <linearGradient xlinkHref="#cwb-a" id="cwb-i" x1="6.8791485" x2="10.054144" y1="2.9104161" y2="2.9104161" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cwb-a" id="cwb-g" x1="4.7624993" x2="12.170832" y1="13.758332" y2="13.758332" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cwb-a" id="cwb-e" x1="40.76622" x2="48.133766" y1="8.2020826" y2="8.2020826" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cwb-b" id="cwb-h" gradientTransform="translate(-6e-8 2.1166665)" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cwb-b" id="cwb-f" gradientTransform="translate(-6e-8 2.1166665)" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cwb-c" id="cwb-d" x1="4.2333326" x2="103.04872" y1="24.341663" y2="24.341663" gradientTransform="matrix(1 0 0 1.25 .79374989 -3.0427069)" gradientUnits="userSpaceOnUse"/>
    </defs>
    <path fill="url(#cwb-d)" d="M5.0270826 14.816665c0 .992188 2.645833 1.322916 4.2333328 1.322916 1.5874976 0 4.2333306-.330728 4.2333306-1.322916 0-.992187-2.778792-1.322916-4.2333306-1.322916-1.4545399 0-4.2333328.330729-4.2333328 1.322916z" className="UnoptimicedTransforms" style={{ fontVariationSettings: 'normal' }} transform="matrix(1.09375 0 0 1 -1.265041 9.6e-7)"/>
    <g transform="translate(.000017)">
        <path fill="url(#cwb-e)" d="M42.333328 12.964582c-4.497917-5.5562497 2.116666-9.5249991 2.116666-9.5249991s6.614582 3.9687494 2.116667 9.5249991" style={{ fontVariationSettings: 'normal' }} transform="translate(-35.983347)"/>
        <path fill="url(#cwb-f)" d="M8.2020638 4.2333325c2.1166662.7937501 3.7041672 6.6145825-.264583 8.9958325l2.6458332-.264583c4.233333-4.4979172.529166-8.4666665-2.1166672-8.9958325Z" style={{ fontVariationSettings: 'normal' }} />
        <path fill="none" stroke="#000" strokeLinejoin="round" strokeMiterlimit="2.4" strokeWidth="1.05833" d="M42.333328 12.964582c-4.497917-6.0854163 2.116666-8.9958325 2.116666-8.9958325s6.614582 2.9104162 2.116667 8.9958325" style={{ fontVariationSettings: 'normal' }} transform="translate(-35.983347)"/>
        <path fill="url(#cwb-g)" d="M5.027064 12.699998s-.2645833.529167-.2645647 1.5875c1.5874998.529167 3.7041663.529167 3.7041663.529167s2.1166664 0 3.7041664-.529167c-.000019-1.058333-.264602-1.5875-.264602-1.5875-1.322917.529167-3.4395831.529167-3.4395831.529167s-2.1166664 0-3.4395829-.529167z"/>
        <path fill="url(#cwb-h)" d="m11.906229 12.699998.264583 1.5875-1.852082.264583-.264583-1.322916 1.852082-.529167" style={{ fontVariationSettings: 'normal' }} />
        <path fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.05833" d="M5.027064 12.699998s-.2645833.529167-.2645647 1.5875c1.5874998.529167 3.7041663.529167 3.7041663.529167s2.1166664 0 3.7041664-.529167c-.000019-1.058333-.264602-1.5875-.264602-1.5875-1.322917.529167-3.4395831.529167-3.4395831.529167s-2.1166664 0-3.4395829-.529167z"/>
        <ellipse cx="8.4666462" cy="2.9104161" fill="url(#cwb-i)" stroke="#000" strokeLinejoin="round" strokeWidth="1.05833" rx="1.0583324" ry="1.0583333" style={{ fontVariationSettings: 'normal' }} />
        <path fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="2.4" strokeWidth="1.05833" d="M8.4666469 3.9687495c3.1749991 1.5874997 1.0583332 3.7041661 0 4.7624993" style={{ fontVariationSettings: 'normal' }}/>
    </g>
</svg>
);
export const CalienteWhiteRook = (props: PieceProps) => (
<svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 16.933331 16.93333" {...props}>
    <defs>
        <linearGradient id="cwr-a"><stop offset="0" stopColor="#fff"/></linearGradient>
        <linearGradient id="cwr-b" gradientTransform="translate(-6e-8 2.1166665)"><stop offset="0" stopColor="#ccc"/></linearGradient>
        <linearGradient id="cwr-c"><stop offset="0" stopOpacity=".2"/></linearGradient>
        <linearGradient xlinkHref="#cwr-a" id="cwr-i" x1="4.4978838" x2="12.435383" y1="5.8061337" y2="5.8061337" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cwr-a" id="cwr-g" x1="4.2333326" x2="12.699999" y1="13.758332" y2="13.758332" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cwr-a" id="cwr-e" x1="41.274979" x2="47.624981" y1="9.7895823" y2="9.7895823" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cwr-b" id="cwr-j" gradientTransform="translate(-6e-8 2.1166665)" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cwr-b" id="cwr-h" gradientTransform="translate(-6e-8 2.1166665)" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cwr-b" id="cwr-f" gradientTransform="translate(-6e-8 2.1166665)" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cwr-c" id="cwr-d" x1="4.2333326" x2="103.04872" y1="24.341663" y2="24.341663" gradientTransform="matrix(1 0 0 1.25 .79374989 -3.0427069)" gradientUnits="userSpaceOnUse"/>
    </defs>
    <path fill="url(#cwr-d)" d="M5.0270826 14.816665c0 .992188 2.645833 1.322916 4.2333328 1.322916 1.5874976 0 4.2333306-.330728 4.2333306-1.322916 0-.992187-2.778792-1.322916-4.2333306-1.322916-1.4545399 0-4.2333328.330729-4.2333328 1.322916z" className="UnoptimicedTransforms" style={{ fontVariationSettings: 'normal' }} transform="matrix(1.21528 0 0 1 -2.405139 9.6e-7)"/>
    <path fill="url(#cwr-e)" d="m41.27498 12.964582.529167-6.3499996h5.291666l.529167 6.3499996" style={{ fontVariationSettings: 'normal' }} transform="translate(-35.983317)"/>
    <path fill="url(#cwr-f)" d="m9.5249662 6.8791657.5291668 6.3499993 1.5875-.264583-.529167-6.3499996z" style={{ fontVariationSettings: 'normal' }} transform="translate(.00003)"/>
    <path fill="none" stroke="#000" strokeLinejoin="round" strokeMiterlimit="2.4" strokeWidth="1.05833" d="m41.27498 12.699998.529167-5.0270824m5.291666 0 .529167 5.0270824" style={{ fontVariationSettings: 'normal' }} transform="translate(-35.983317)"/>
    <path fill="url(#cwr-g)" d="M4.4978974 12.699998s-.2645833.529167-.2645647 1.5875c1.5874998.529167 4.2333329.529167 4.2333329.529167s2.6458334 0 4.2333334-.529167c-.000019-1.058333-.264602-1.5875-.264602-1.5875-1.322917.529167-3.9687501.529167-3.9687501.529167s-2.645833 0-3.9687495-.529167z" transform="translate(.00003)"/>
    <path fill="url(#cwr-h)" d="m12.435396 12.699998.264583 1.5875-1.852082.264583-.264583-1.322916 1.852082-.529167" style={{ fontVariationSettings: 'normal' }} transform="translate(.00003)"/>
    <path fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.05833" d="M4.4979274 12.699998s-.2645833.529167-.2645647 1.5875c1.5874998.529167 4.2333329.529167 4.2333329.529167s2.6458334 0 4.2333334-.529167c-.000019-1.058333-.264602-1.5875-.264602-1.5875-1.322917.529167-3.9687501.529167-3.9687501.529167s-2.645833 0-3.9687495-.529167z"/>
    <path fill="url(#cwr-i)" d="M5.2916335 3.9687495s-.7937685 2.3812496-.7937499 3.4395828c1.5874991.5291676 3.9687796 7e-7 3.9687796 7e-7s2.3812198.5291669 3.9687198-7e-7c-.000019-1.0583332-.529167-3.4395828-.529167-3.4395828-1.322917.5291666-3.4395829.2645833-3.4395829.2645833s-1.8520842.2645833-3.1749996-.2645833z" transform="translate(.00003)"/>
    <path fill="url(#cwr-j)" d="m11.906227 5.2916656.264572 2.1166667-.79375.7937499-.529166-4.2333327h.79375" style={{ fontVariationSettings: 'normal' }} transform="translate(.00003)"/>
    <path fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.05833" d="M4.7624969 3.9687495s-.2646019 2.3812496-.2645833 3.4395828c1.3229165.5291666 3.9687796.5291673 3.9687796.5291673s2.6458028-7e-7 3.9687198-.5291673c-.000019-1.0583332-.264584-3.4395828-.264584-3.4395828H4.7624969z"/>
    <path fill="none" stroke="#000" strokeLinejoin="round" strokeWidth="1.05833" d="m7.1437166 3.7041662-.1466061 2.3812496m2.6341609-2.3812496.1466061 2.3812496" className="UnoptimicedTransforms" style={{ fontVariationSettings: 'normal' }} transform="translate(.07916911 .00673837)"/>
</svg>
);
export const CalienteWhiteQueen = (props: PieceProps) => (
<svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 16.933335 16.93333" {...props}>
    <defs>
        <linearGradient id="cwq-a"><stop offset="0" stopColor="#fff"/></linearGradient>
        <linearGradient id="cwq-b" gradientTransform="translate(-6e-8 2.1166665)"><stop offset="0" stopColor="#ccc"/></linearGradient>
        <linearGradient id="cwq-c"><stop offset="0" stopOpacity=".2"/></linearGradient>
        <linearGradient xlinkHref="#cwq-a" id="cwq-k" x1="76.200043" x2="84.666718" y1="12.964581" y2="12.964581" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cwq-a" id="cwq-j" x1="19.049967" x2="22.224962" y1="5.8208327" y2="5.8208327" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cwq-a" id="cwq-i" x1="29.633303" x2="32.808296" y1="5.8208327" y2="5.8208327" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cwq-a" id="cwq-h" x1="26.4583" x2="29.633295" y1="3.4395828" y2="3.4395828" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cwq-a" id="cwq-g" x1="22.22497" x2="25.399965" y1="3.4395826" y2="3.4395826" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cwq-a" id="cwq-e" x1="20.637465" x2="31.220797" y1="8.2020826" y2="8.2020826" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cwq-b" id="cwq-l" gradientTransform="translate(-6e-8 2.1166665)" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cwq-b" id="cwq-f" gradientTransform="translate(-6e-8 2.1166665)" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cwq-c" id="cwq-d" x1="4.2333326" x2="103.04872" y1="24.341663" y2="24.341663" gradientTransform="matrix(1 0 0 1.25 .79374989 -3.0427069)" gradientUnits="userSpaceOnUse"/>
    </defs>
    <path fill="url(#cwq-d)" d="M5.0270826 14.816665c0 .992188 2.645833 1.322916 4.2333328 1.322916 1.5874976 0 4.2333306-.330728 4.2333306-1.322916 0-.992187-2.778792-1.322916-4.2333306-1.322916-1.4545399 0-4.2333328.330729-4.2333328 1.322916z" className="UnoptimicedTransforms" style={{ fontVariationSettings: 'normal' }} transform="matrix(1.21528 0 0 1 -2.405118 9.6e-7)"/>
    <g transform="translate(-17.462461)">
        <path fill="url(#cwq-e)" d="m22.754133 12.964582-2.116668-7.1437495c3.175 2.9104163 3.175 1.3229165 3.175-2.3812496 2.116666 2.6458329 2.116666 2.6458329 4.233333 0 0 3.7041661-.01298 5.3096054 3.174999 2.3812496l-2.116665 7.1437495" style={{ fontVariationSettings: 'normal' }}/>
        <path fill="url(#cwq-f)" d="m29.104131 12.964582-2.116667.264583s1.058334-2.645833 1.058334-6.8791659c.79375 1.0583332 2.381249 1.0583332 2.381249 1.0583332s-1.587499 3.7041657-1.322916 5.5562497z" style={{ fontVariationSettings: 'normal' }} />
        <path fill="none" stroke="#000" strokeLinejoin="round" strokeWidth="1.05833" d="m22.224965 11.112498-1.5875-5.2916655c3.175 2.9104163 3.175 1.3229165 3.175-2.3812496 2.116666 3.4395828 2.116666 3.4395828 4.233333 0 0 3.7041661-.01298 5.3096054 3.174999 2.3812496l-1.5875 5.2916655" style={{ fontVariationSettings: 'normal' }}/>
        <ellipse cx="23.812468" cy="3.4395826" fill="url(#cwq-g)" stroke="#000" strokeLinejoin="round" strokeWidth="1.05833" rx="1.0583324" ry="1.0583333" style={{ fontVariationSettings: 'normal' }} />
        <ellipse cx="28.045797" cy="3.4395828" fill="url(#cwq-h)" stroke="#000" strokeLinejoin="round" strokeWidth="1.05833" rx="1.0583324" ry="1.0583333" style={{ fontVariationSettings: 'normal' }} />
        <ellipse cx="31.2208" cy="5.8208327" fill="url(#cwq-i)" stroke="#000" strokeLinejoin="round" strokeWidth="1.05833" rx="1.0583324" ry="1.0583333" style={{ fontVariationSettings: 'normal' }} />
        <ellipse cx="20.637465" cy="5.8208327" fill="url(#cwq-j)" stroke="#000" strokeLinejoin="round" strokeWidth="1.05833" rx="1.0583324" ry="1.0583333" style={{ fontVariationSettings: 'normal' }} />
        <path fill="url(#cwq-k)" d="M76.464607 11.112498s-.264583 2.116667-.264565 3.175c1.587502.529167 4.233337.529167 4.233337.529167s2.645835 0 4.233335-.529167c-.000019-1.058333-.264602-3.175-.264602-3.175-1.322917.529167-3.968751.529167-3.968751.529167s-2.645835 0-3.968754-.529167z" transform="translate(-54.504191)"/>
        <path fill="url(#cwq-l)" d="m83.872944 11.112498.79375 3.175-1.852082.264583-.529207-2.910416 1.587539-.529167" style={{ fontVariationSettings: 'normal' }} transform="translate(-54.504191)"/>
        <path fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.05833" d="M22.224963 11.112498s-.52913 2.116667-.529112 3.175c1.587502.529167 4.233337.529167 4.233337.529167s2.645835 0 4.233335-.529167c-.000019-1.058333-.529226-3.175-.529226-3.175-1.322917.529167-3.704167.529167-3.704167.529167s-2.381248 0-3.704167-.529167z"/>
        <path fill="none" stroke="#000" strokeLinejoin="round" strokeWidth="1.05833" d="M29.897885 12.699998c-1.32292.529167-3.968746.529167-3.968746.529167s-2.645841 0-3.968758-.529167"/>
    </g>
</svg>
);
export const CalienteWhiteKing = (props: PieceProps) => (
<svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 16.933335 16.93333" {...props}>
    <defs>
        <linearGradient id="cwk-a"><stop offset="0" stopColor="#fff"/></linearGradient>
        <linearGradient id="cwk-b" gradientTransform="translate(-6e-8 2.1166665)"><stop offset="0" stopColor="#ccc"/></linearGradient>
        <linearGradient id="cwk-c"><stop offset="0" stopOpacity=".2"/></linearGradient>
        <linearGradient xlinkHref="#cwk-a" id="cwk-i" x1="25.929119" x2="31.74995" y1="8.5989571" y2="8.5989571" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cwk-a" id="cwk-g" x1="21.695839" x2="30.16251" y1="12.964581" y2="12.964581" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cwk-a" id="cwk-f" x1="92.074989" x2="98.954155" y1="8.5989571" y2="8.5989571" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cwk-a" id="cwk-e" x1="23.283287" x2="28.574949" y1="7.1437492" y2="7.1437492" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cwk-b" id="cwk-j" gradientTransform="translate(-6e-8 2.1166665)" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cwk-b" id="cwk-h" gradientTransform="translate(-6e-8 2.1166665)" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cwk-c" id="cwk-d" x1="4.2333326" x2="103.04872" y1="24.341663" y2="24.341663" gradientTransform="matrix(1 0 0 1.25 .79374989 -3.0427069)" gradientUnits="userSpaceOnUse"/>
    </defs>
    <path fill="url(#cwk-d)" d="M5.0270826 14.816665c0 .992188 2.645833 1.322916 4.2333328 1.322916 1.5874976 0 4.2333306-.330728 4.2333306-1.322916 0-.992187-2.778792-1.322916-4.2333306-1.322916-1.4545399 0-4.2333328.330729-4.2333328 1.322916z" className="UnoptimicedTransforms" style={{ fontVariationSettings: 'normal' }} transform="matrix(1.21528 0 0 1 -2.405109 9.6e-7)"/>
    <g transform="translate(-17.462453)">
        <path fill="#a6a6a6" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.05833" d="M25.929118 1.3229165v3.4395828" style={{ fontVariationSettings: 'normal' }}/>
        <ellipse cx="25.929119" cy="7.1437492" fill="url(#cwk-e)" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.05833" rx="2.1166663" ry="2.9104159" style={{ fontVariationSettings: 'normal' }}/>
        <path fill="url(#cwk-f)" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.05833" d="M94.720821 11.112498s-2.116666-1.058333-2.116666-3.1749991c0-1.0583332 1.001019-2.1166664 2.116666-2.1166664 2.116667 0 3.704166 1.5874998 3.704166 5.5562495" style={{ fontVariationSettings: 'normal' }} transform="translate(-72.495869)"/>
        <path fill="url(#cwk-g)" d="M21.960404 11.112498s-.264583 2.116667-.264565 3.175c1.587501.529167 4.233336.529167 4.233336.529167s2.645835 0 4.233335-.529167c-.000019-1.058333-.264602-3.175-.264602-3.175-1.322917.529167-3.968751.529167-3.968751.529167s-2.645835 0-3.968753-.529167z"/>
        <path fill="url(#cwk-h)" d="m29.36874 11.112498.79375 3.175-1.852082.264583-.529207-2.910416 1.587539-.529167" style={{ fontVariationSettings: 'normal' }} />
        <path fill="url(#cwk-i)" d="M29.633285 11.112498s2.116666-1.058333 2.116666-3.1749991c0-1.0583332-1.001019-2.1166664-2.116666-2.1166664-2.116667 0-3.704167 1.5874998-3.704166 5.5562495" style={{ fontVariationSettings: 'normal' }}/>
        <path fill="url(#cwk-j)" d="M30.162451 6.3499991c0 2.645833-.79375 3.7041659-2.116666 4.7624989 2.116666 0 3.704166-1.8520826 3.704167-3.174999.000001-.8819444-1.587501-1.5874999-1.587501-1.5874999z" style={{ fontVariationSettings: 'normal' }}/>
        <path fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.05833" d="M22.224951 11.112498s-.52913 2.116667-.529112 3.175c1.587501.529167 4.233336.529167 4.233336.529167s2.645835 0 4.233335-.529167c-.000019-1.058333-.529226-3.175-.529226-3.175-1.322917.529167-3.704167.529167-3.704167.529167s-2.381248 0-3.704166-.529167z"/>
        <path fill="#a6a6a6" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.05833" d="M24.870786 2.3812497h2.116667" style={{ fontVariationSettings: 'normal' }}/>
        <path fill="none" stroke="#000" strokeLinejoin="round" strokeWidth="1.05833" d="M29.897872 12.699998c-1.32292.529167-3.968746.529167-3.968746.529167s-2.645841 0-3.968757-.529167"/>
        <path fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.05833" d="M29.633285 11.112498s2.116666-1.058333 2.116666-3.1749991c0-1.0583332-1.001019-2.1166664-2.116666-2.1166664-2.116667 0-3.704167 1.5874998-3.704166 5.5562495" style={{ fontVariationSettings: 'normal' }}/>
    </g>
</svg>
);
export const CalienteBlackPawn = (props: PieceProps) => (
<svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 16.93333 16.933331" {...props}>
    <defs>
        <linearGradient id="cbp-c"><stop offset="0" stopOpacity=".2"/></linearGradient>
        <linearGradient id="cbp-b" gradientTransform="scale(.07)"><stop offset="0" stopColor="#8c8c8c"/></linearGradient>
        <linearGradient id="cbp-a" gradientTransform="matrix(.07 0 0 .07 -53.975025 2.1166665)"><stop offset="0" stopColor="#595959"/></linearGradient>
        <linearGradient xlinkHref="#cbp-a" id="cbp-e" x1="4.7624993" x2="12.170832" y1="9.5249987" y2="9.5249987" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cbp-b" id="cbp-f" x1="4.7624993" x2="8.9958324" y1="9.6110868" y2="9.6110868" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cbp-c" id="cbp-d" x1="4.2333326" x2="103.04872" y1="24.341663" y2="24.341663" gradientTransform="matrix(1 0 0 1.25 .79374989 -3.0427069)" gradientUnits="userSpaceOnUse"/>
    </defs>
    <path fill="url(#cbp-d)" d="M5.0270826 14.816665c0 .992188 2.645833 1.322916 4.2333328 1.322916 1.5874976 0 4.2333306-.330728 4.2333306-1.322916 0-.992187-2.778792-1.322916-4.2333306-1.322916-1.4545399 0-4.2333328.330729-4.2333328 1.322916z" className="UnoptimicedTransforms" style={{ fontVariationSettings: 'normal' }} transform="matrix(1.09375 0 0 1 -1.26504066 0)"/>
    <path fill="url(#cbp-e)" d="M4.7624993 14.287498c1.5874998.529167 3.7041663.529167 3.7041663.529167s2.1166664 0 3.7041664-.529167c0-2.116666-.79375-2.645833-2.38125-4.233333 1.5875-1.5874995.79375-2.6458327-.2645833-3.7041659.7937503-.7937499 0-2.1166663-1.0583332-2.1166663S6.6145824 5.5562492 7.4083323 6.3499991C6.3499991 7.4083323 5.5562492 8.4666655 7.143749 10.054165c-1.5874998 1.5875-2.3812497 2.116667-2.3812497 4.233333z" transform="translate(-5.2e-7 -.000001)"/>
    <path fill="url(#cbp-f)" d="m4.7624994 14.287498 1.8520831.529167c-1e-7-2.116667 1.5874999-3.96875 1.3229164-4.7625-.2645833-.7937496-.2645833-1.0583329-.2645833-1.5874995 0-1.0583332.7937499-1.3229165.5291666-2.1166664-.2645833-.7937499 0-1.5874998.7937499-1.8520831-1.3229165-.5291666-1.6436342 1.3657023-1.8520831 1.8520831-.3385891.7900413-1.0583332 2.3812497 0 3.7041659-1.8520831 1.5875-2.3812496 3.721739-2.3812496 4.233333z" transform="translate(-5.2e-7 -.000001)"/>
    <path fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.05833" d="M4.76249878 14.287497c1.5874998.529167 3.7041663.529167 3.7041663.529167s2.1166664 0 3.7041664-.529167c0-2.116666-.79375-2.645833-2.38125-4.233333 1.5875-1.5874995.79375-2.6458327-.2645833-3.7041659.7937503-.7937499 0-2.1166663-1.0583332-2.1166663s-1.8520831 1.3229164-1.0583332 2.1166663c-1.0583332 1.0583332-1.8520831 2.1166664-.2645833 3.7041659-1.5874998 1.5875-2.3812497 2.116667-2.3812497 4.233333z"/>
</svg>
);
export const CalienteBlackKnight = (props: PieceProps) => (
<svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 16.933329 16.933331" {...props}>
    <defs>
        <linearGradient id="cbn-c"><stop offset="0" stopOpacity=".2"/></linearGradient>
        <linearGradient id="cbn-b" gradientTransform="scale(.07)"><stop offset="0" stopColor="#8c8c8c"/></linearGradient>
        <linearGradient id="cbn-a" gradientTransform="matrix(.07 0 0 .07 -53.975025 2.1166665)"><stop offset="0" stopColor="#595959"/></linearGradient>
        <linearGradient xlinkHref="#cbn-a" id="cbn-e" x1="4.0848351" x2="13.229165" y1="8.8635406" y2="8.8635406" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cbn-b" id="cbn-g" x1="4.7624993" x2="10.583332" y1="11.509374" y2="11.509374" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cbn-b" id="cbn-f" x1="4.2333326" x2="9.8979397" y1="5.953124" y2="5.953124" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cbn-c" id="cbn-d" x1="4.2333326" x2="103.04872" y1="24.341663" y2="24.341663" gradientTransform="matrix(1 0 0 1.25 .79374989 -3.0427069)" gradientUnits="userSpaceOnUse"/>
    </defs>
    <path fill="url(#cbn-d)" d="M5.0270826 14.816665c0 .992188 2.645833 1.322916 4.2333328 1.322916 1.5874976 0 4.2333306-.330728 4.2333306-1.322916 0-.992187-2.778792-1.322916-4.2333306-1.322916-1.4545399 0-4.2333328.330729-4.2333328 1.322916z" className="UnoptimicedTransforms" style={{ fontVariationSettings: 'normal' }} transform="matrix(1.09375 0 0 1 -1.265043 0)"/>
    <g transform="translate(.000003 .000004)">
        <path fill="url(#cbn-e)" d="M4.7624993 14.287498c1.5874998.529167 3.7041663.529167 3.7041663.529167s2.1166664 0 3.7041664-.529167c-.79375-2.38125 1.058333-3.968749 1.058333-6.3499991 0-3.9687494-4.7624995-5.0270826-4.7624995-5.0270826v1.3229164S4.4979159 7.143749 4.2333327 7.4083323c-.2645832.2645833-.1183253.5570994 0 .7937499.2645833.5291666.5291666.7937499.7937499 1.0583332.2645833.2645833.5291666.2645833.7937499 0 .2645833-.2645833.7937499-.5291666 1.0583332-.5291666.2645833 0 1.0583332.2645833 1.3229165.2645833.2645833 0 1.3229165-.2645833 1.8520828-.7937499-1.3229162 1.3229165-2.1166661 1.3229165-2.910416 1.8520828-.7937499.529167-2.3812497 2.116667-2.3812497 4.233333Z"/>
        <path fill="url(#cbn-f)" d="M8.4666655 3.1749996c1.3229165 1.0583331 1.8520835 1.852083 1.0583332 2.3812496-.7937499.5291666-2.645833.7937499-4.7624994 3.1749996l-.5291666-1.3229165 4.2333328-3.1749996"/>
        <path fill="url(#cbn-g)" d="m6.6145824 14.816665-1.8520831-.529167c0-2.116666 1.5874998-3.968749 2.3812497-4.4979164.7937499-.5291663 2.1166666-.2645829 3.439583-1.5874994 0 .5291666-1.8520833 1.8520828-2.3812498 2.3812498-.7937499.79375-1.5874998 2.645833-1.5874998 4.233333z"/>
        <path fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.05833" d="M4.7624993 14.287498c1.5874998.529167 3.7041663.529167 3.7041663.529167s2.1166664 0 3.7041664-.529167c-.79375-2.38125 1.058333-3.968749 1.058333-6.3499991 0-3.9687494-4.7624995-5.0270826-4.7624995-5.0270826v1.3229164S4.4979159 7.143749 4.2333327 7.4083323c-.2645832.2645833-.1183253.5570994 0 .7937499.2645833.5291666.5291666.7937499.7937499 1.0583332.2645833.2645833.5291666.2645833.7937499 0 .2645833-.2645833.7937499-.5291666 1.0583332-.5291666.2645833 0 1.0583332.2645833 1.3229165.2645833.2645833 0 1.3229165-.2645833 1.8520828-.7937499-1.3229162 1.3229165-2.1166661 1.3229165-2.910416 1.8520828-.7937499.529167-2.3812497 2.116667-2.3812497 4.233333Z"/>
        <ellipse cx="8.7312489" cy="6.0854158" rx=".52916664" ry=".52916658"/>
        <path fill="none" stroke="#000" strokeLinejoin="round" strokeWidth="1.05833" d="M11.906248 12.699998c-1.322916.529167-3.4395825.529167-3.4395825.529167s-1.8520831.000001-3.1749996-.529166"/>
    </g>
</svg>
);
export const CalienteBlackBishop = (props: PieceProps) => (
<svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 16.933327 16.933331" {...props}>
    <defs>
        <linearGradient id="cbb-c"><stop offset="0" stopOpacity=".2"/></linearGradient>
        <linearGradient id="cbb-b" gradientTransform="scale(.07)"><stop offset="0" stopColor="#8c8c8c"/></linearGradient>
        <linearGradient id="cbb-a" gradientTransform="matrix(.07 0 0 .07 -53.975025 2.1166665)"><stop offset="0" stopColor="#595959"/></linearGradient>
        <linearGradient xlinkHref="#cbb-a" id="cbb-g" x1="4.7624993" x2="12.170832" y1="13.758332" y2="13.758332" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cbb-a" id="cbb-e" x1="40.76622" x2="48.133766" y1="8.2020826" y2="8.2020826" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cbb-b" id="cbb-i" x1="6.8791485" x2="10.054144" y1="2.9104161" y2="2.9104161" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cbb-b" id="cbb-h" x1="4.7624812" x2="6.8791471" y1="13.62604" y2="13.62604" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cbb-b" id="cbb-f" x1="40.412125" x2="44.97916" y1="8.5989571" y2="8.5989571" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cbb-c" id="cbb-d" x1="4.2333326" x2="103.04872" y1="24.341663" y2="24.341663" gradientTransform="matrix(1 0 0 1.25 .79374989 -3.0427069)" gradientUnits="userSpaceOnUse"/>
    </defs>
    <path fill="url(#cbb-d)" d="M5.0270826 14.816665c0 .992188 2.645833 1.322916 4.2333328 1.322916 1.5874976 0 4.2333306-.330728 4.2333306-1.322916 0-.992187-2.778792-1.322916-4.2333306-1.322916-1.4545399 0-4.2333328.330729-4.2333328 1.322916z" className="UnoptimicedTransforms" style={{ fontVariationSettings: 'normal' }} transform="matrix(1.09375 0 0 1 -1.265022 0)"/>
    <g transform="translate(.000017 .000005)">
        <path fill="url(#cbb-e)" d="M42.333328 12.964582c-4.497917-5.5562497 2.116666-9.5249991 2.116666-9.5249991s6.614582 3.9687494 2.116667 9.5249991" style={{ fontVariationSettings: 'normal' }} transform="translate(-35.983347)"/>
        <path fill="url(#cbb-f)" d="M44.714577 4.2333327c-1.852083 2.1166664-3.704167 6.6145823.264583 8.9958323l-2.645833-.264583c-4.233333-4.4979172-.529166-8.466666 2.116667-8.9958325Z" style={{ fontVariationSettings: 'normal' }} transform="translate(-35.983347)"/>
        <path fill="none" stroke="#000" strokeLinejoin="round" strokeMiterlimit="2.4" strokeWidth="1.05833" d="M42.333328 12.964582c-4.497917-6.0854163 2.116666-8.9958325 2.116666-8.9958325s6.614582 2.9104162 2.116667 8.9958325" style={{ fontVariationSettings: 'normal' }} transform="translate(-35.983347)"/>
        <path fill="url(#cbb-g)" d="M5.027064 12.699998s-.2645833.529167-.2645647 1.5875c1.5874998.529167 3.7041663.529167 3.7041663.529167s2.1166664 0 3.7041664-.529167c-.000019-1.058333-.264602-1.5875-.264602-1.5875-1.322917.529167-3.4395831.529167-3.4395831.529167s-2.1166664 0-3.4395829-.529167z"/>
        <path fill="url(#cbb-h)" d="m5.0270645 12.699998-.2645833 1.5875 1.8520826.264583.2645833-1.322916-1.8520826-.529167" style={{ fontVariationSettings: 'normal' }} />
        <path fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.05833" d="M5.027064 12.699998s-.2645833.529167-.2645647 1.5875c1.5874998.529167 3.7041663.529167 3.7041663.529167s2.1166664 0 3.7041664-.529167c-.000019-1.058333-.264602-1.5875-.264602-1.5875-1.322917.529167-3.4395831.529167-3.4395831.529167s-2.1166664 0-3.4395829-.529167z"/>
        <ellipse cx="8.4666462" cy="2.9104161" rx="1.0583324" ry="1.0583333" fill="url(#cbb-i)" stroke="#000" strokeLinejoin="round" strokeWidth="1.05833" style={{ fontVariationSettings: 'normal' }} />
        <path fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="2.4" strokeWidth="1.05833" d="M8.4666469 3.9687495c3.1749991 1.5874997 1.0583332 3.7041661 0 4.7624993" style={{ fontVariationSettings: 'normal' }}/>
    </g>
</svg>
);
export const CalienteBlackRook = (props: PieceProps) => (
<svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 16.933331 16.933331" {...props}>
    <defs>
        <linearGradient id="cbr-c"><stop offset="0" stopOpacity=".2"/></linearGradient>
        <linearGradient id="cbr-b" gradientTransform="scale(.07)"><stop offset="0" stopColor="#8c8c8c"/></linearGradient>
        <linearGradient id="cbr-a" gradientTransform="matrix(.07 0 0 .07 -53.975025 2.1166665)"><stop offset="0" stopColor="#595959"/></linearGradient>
        <linearGradient xlinkHref="#cbr-a" id="cbr-i" x1="4.4978838" x2="12.435383" y1="5.8061337" y2="5.8061337" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cbr-a" id="cbr-g" x1="4.2333326" x2="12.699999" y1="13.758332" y2="13.758332" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cbr-a" id="cbr-e" x1="41.274979" x2="47.624981" y1="9.7895823" y2="9.7895823" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cbr-b" id="cbr-j" x1="10.847883" x2="12.170799" y1="6.0854158" y2="6.0854158" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cbr-b" id="cbr-h" x1="10.583314" x2="12.699979" y1="13.62604" y2="13.62604" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cbr-b" id="cbr-f" x1="9.5249662" x2="11.641633" y1="9.921874" y2="9.921874" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cbr-c" id="cbr-d" x1="4.2333326" x2="103.04872" y1="24.341663" y2="24.341663" gradientTransform="matrix(1 0 0 1.25 .79374989 -3.0427069)" gradientUnits="userSpaceOnUse"/>
    </defs>
    <path fill="url(#cbr-d)" d="M5.0270826 14.816665c0 .992188 2.645833 1.322916 4.2333328 1.322916 1.5874976 0 4.2333306-.330728 4.2333306-1.322916 0-.992187-2.778792-1.322916-4.2333306-1.322916-1.4545399 0-4.2333328.330729-4.2333328 1.322916z" className="UnoptimicedTransforms" style={{ fontVariationSettings: 'normal' }} transform="matrix(1.21528 0 0 1 -2.40514 0)"/>
    <path fill="url(#cbr-e)" d="m41.27498 12.964582.529167-6.3499996h5.291666l.529167 6.3499996" style={{ fontVariationSettings: 'normal' }} transform="matrix(-1 0 0 1 52.916709 .000005)"/>
    <path fill="url(#cbr-f)" d="m9.5249662 6.8791657.5291668 6.3499993 1.5875-.264583-.529167-6.3499996z" style={{ fontVariationSettings: 'normal' }} transform="matrix(-1 0 0 1 16.933362 .000005)"/>
    <path fill="none" stroke="#000" strokeLinejoin="round" strokeMiterlimit="2.4" strokeWidth="1.05833" d="m41.27498 12.699998.529167-5.0270824m5.291666 0 .529167 5.0270824" style={{ fontVariationSettings: 'normal' }} transform="matrix(-1 0 0 1 52.916709 .000005)"/>
    <path fill="url(#cbr-g)" d="M4.4978974 12.699998s-.2645833.529167-.2645647 1.5875c1.5874998.529167 4.2333329.529167 4.2333329.529167s2.6458334 0 4.2333334-.529167c-.000019-1.058333-.264602-1.5875-.264602-1.5875-1.322917.529167-3.9687501.529167-3.9687501.529167s-2.645833 0-3.9687495-.529167z" transform="matrix(-1 0 0 1 16.933362 .000005)"/>
    <path fill="url(#cbr-h)" d="m12.435396 12.699998.264583 1.5875-1.852082.264583-.264583-1.322916 1.852082-.529167" style={{ fontVariationSettings: 'normal' }} transform="matrix(-1 0 0 1 16.933362 .000005)"/>
    <path fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.05833" d="M12.4354646 12.700003s.2645833.529167.2645647 1.5875c-1.5874998.529167-4.2333329.529167-4.2333329.529167s-2.6458334 0-4.2333334-.529167c.000019-1.058333.264602-1.5875.264602-1.5875 1.322917.529167 3.9687501.529167 3.9687501.529167s2.645833 0 3.9687495-.529167z"/>
    <path fill="url(#cbr-i)" d="M5.2916335 3.9687495s-.7937685 2.3812496-.7937499 3.4395828c1.5874991.5291676 3.9687796 7e-7 3.9687796 7e-7s2.3812198.5291669 3.9687198-7e-7c-.000019-1.0583332-.529167-3.4395828-.529167-3.4395828-1.322917.5291666-3.4395829.2645833-3.4395829.2645833s-1.8520842.2645833-3.1749996-.2645833z" transform="matrix(-1 0 0 1 16.933362 .000005)"/>
    <path fill="url(#cbr-j)" d="m11.906227 5.2916656.264572 2.1166667-.79375.7937499-.529166-4.2333327h.79375" style={{ fontVariationSettings: 'normal' }} transform="matrix(-1 0 0 1 16.933362 .000005)"/>
    <path fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.05833" d="M12.1708292 3.9687486s.2646678 2.3812555.2646492 3.4395887c-1.3229165.5291666-3.9687796.5291673-3.9687796.5291673s-2.6458028-7e-7-3.9687198-.5291673c.000019-1.0583332.264518-3.4395887.264518-3.4395887h7.4083322z"/>
    <path fill="none" stroke="#000" strokeLinejoin="round" strokeWidth="1.05833" d="m7.1437166 3.7041662-.1466061 2.3812496m2.6341609-2.3812496.1466061 2.3812496" className="UnoptimicedTransforms" style={{ fontVariationSettings: 'normal' }} transform="matrix(-1 0 0 1 16.85422289 .00674337)"/>
</svg>
);
export const CalienteBlackQueen = (props: PieceProps) => (
<svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 16.933335 16.933331" {...props}>
    <defs>
        <linearGradient id="cbq-c"><stop offset="0" stopOpacity=".2"/></linearGradient>
        <linearGradient id="cbq-b" gradientTransform="scale(.07)"><stop offset="0" stopColor="#8c8c8c"/></linearGradient>
        <linearGradient id="cbq-a" gradientTransform="matrix(.07 0 0 .07 -53.975025 2.1166665)"><stop offset="0" stopColor="#595959"/></linearGradient>
        <linearGradient xlinkHref="#cbq-a" id="cbq-k" x1="76.200043" x2="84.666718" y1="12.964581" y2="12.964581" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cbq-a" id="cbq-e" x1="20.637465" x2="31.220797" y1="8.2020826" y2="8.2020826" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cbq-b" id="cbq-l" x1="82.285408" x2="84.666695" y1="12.832289" y2="12.832289" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cbq-b" id="cbq-j" x1="19.049967" x2="22.224964" y1="5.8208327" y2="5.8208327" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cbq-b" id="cbq-i" x1="29.633301" x2="32.8083" y1="5.8208327" y2="5.8208327" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cbq-b" id="cbq-h" x1="26.458298" x2="29.633295" y1="3.4395828" y2="3.4395828" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cbq-b" id="cbq-g" x1="22.22497" x2="25.399967" y1="3.4395826" y2="3.4395826" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cbq-b" id="cbq-f" x1="26.987465" x2="30.427048" y1="9.7895823" y2="9.7895823" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cbq-c" id="cbq-d" x1="4.2333326" x2="103.04872" y1="24.341663" y2="24.341663" gradientTransform="matrix(1 0 0 1.25 .79374989 -3.0427069)" gradientUnits="userSpaceOnUse"/>
    </defs>
    <path fill="url(#cbq-d)" d="M5.0270826 14.816665c0 .992188 2.645833 1.322916 4.2333328 1.322916 1.5874976 0 4.2333306-.330728 4.2333306-1.322916 0-.992187-2.778792-1.322916-4.2333306-1.322916-1.4545399 0-4.2333328.330729-4.2333328 1.322916z" className="UnoptimicedTransforms" style={{ fontVariationSettings: 'normal' }} transform="matrix(1.21528 0 0 1 -2.405127 0)"/>
    <g transform="matrix(-1 0 0 1 34.39576 -.000001)">
        <path fill="url(#cbq-e)" d="m22.754133 12.964582-2.116668-7.1437495c3.175 2.9104163 3.175 1.3229165 3.175-2.3812496 2.116666 2.6458329 2.116666 2.6458329 4.233333 0 0 3.7041661-.01298 5.3096054 3.174999 2.3812496l-2.116665 7.1437495" style={{ fontVariationSettings: 'normal' }}/>
        <path fill="url(#cbq-f)" d="m29.104131 12.964582-2.116667.264583s1.058334-2.645833 1.058334-6.8791659c.79375 1.0583332 2.381249 1.0583332 2.381249 1.0583332s-1.587499 3.7041657-1.322916 5.5562497z" style={{ fontVariationSettings: 'normal' }} />
        <path fill="none" stroke="#000" strokeLinejoin="round" strokeWidth="1.05833" d="m22.224965 11.112498-1.5875-5.2916655c3.175 2.9104163 3.175 1.3229165 3.175-2.3812496 2.116666 3.4395828 2.116666 3.4395828 4.233333 0 0 3.7041661-.01298 5.3096054 3.174999 2.3812496l-1.5875 5.2916655" style={{ fontVariationSettings: 'normal' }}/>
        <ellipse cx="23.812468" cy="3.4395826" fill="url(#cbq-g)" stroke="#000" strokeLinejoin="round" strokeWidth="1.05833" rx="1.0583324" ry="1.0583333" style={{ fontVariationSettings: 'normal' }} />
        <ellipse cx="28.045797" cy="3.4395828" fill="url(#cbq-h)" stroke="#000" strokeLinejoin="round" strokeWidth="1.05833" rx="1.0583324" ry="1.0583333" style={{ fontVariationSettings: 'normal' }} />
        <ellipse cx="31.2208" cy="5.8208327" fill="url(#cbq-i)" stroke="#000" strokeLinejoin="round" strokeWidth="1.05833" rx="1.0583324" ry="1.0583333" style={{ fontVariationSettings: 'normal' }} />
        <ellipse cx="20.637465" cy="5.8208327" fill="url(#cbq-j)" stroke="#000" strokeLinejoin="round" strokeWidth="1.05833" rx="1.0583324" ry="1.0583333" style={{ fontVariationSettings: 'normal' }} />
        <path fill="url(#cbq-k)" d="M76.464607 11.112498s-.264583 2.116667-.264565 3.175c1.587502.529167 4.233337.529167 4.233337.529167s2.645835 0 4.233335-.529167c-.000019-1.058333-.264602-3.175-.264602-3.175-1.322917.529167-3.968751.529167-3.968751.529167s-2.645835 0-3.968754-.529167z" transform="translate(-54.504191)"/>
        <path fill="url(#cbq-l)" d="m83.872944 11.112498.79375 3.175-1.852082.264583-.529207-2.910416 1.587539-.529167" style={{ fontVariationSettings: 'normal' }} transform="translate(-54.504191)"/>
        <path fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.05833" d="M22.224963 11.112498s-.52913 2.116667-.529112 3.175c1.587502.529167 4.233337.529167 4.233337.529167s2.645835 0 4.233335-.529167c-.000019-1.058333-.529226-3.175-.529226-3.175-1.322917.529167-3.704167.529167-3.704167.529167s-2.381248 0-3.704167-.529167z"/>
        <path fill="none" stroke="#000" strokeLinejoin="round" strokeWidth="1.05833" d="M29.897885 12.699998c-1.32292.529167-3.968746.529167-3.968746.529167s-2.645841 0-3.968758-.529167"/>
    </g>
</svg>
);
export const CalienteBlackKing = (props: PieceProps) => (
<svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 16.933341 16.933331" {...props}>
    <defs>
        <linearGradient id="cbk-c"><stop offset="0" stopOpacity=".2"/></linearGradient>
        <linearGradient id="cbk-b" gradientTransform="scale(.07)"><stop offset="0" stopColor="#8c8c8c"/></linearGradient>
        <linearGradient id="cbk-a" gradientTransform="matrix(.07 0 0 .07 -53.975025 2.1166665)"><stop offset="0" stopColor="#595959"/></linearGradient>
        <linearGradient xlinkHref="#cbk-a" id="cbk-i" x1="25.929119" x2="31.74995" y1="8.5989571" y2="8.5989571" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cbk-a" id="cbk-g" x1="21.695839" x2="30.16251" y1="12.964581" y2="12.964581" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cbk-a" id="cbk-f" x1="92.074989" x2="98.954155" y1="8.5989571" y2="8.5989571" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cbk-a" id="cbk-e" x1="23.283287" x2="28.574949" y1="7.1437492" y2="7.1437492" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cbk-b" id="cbk-j" x1="28.04579" x2="31.749952" y1="8.4627514" y2="8.4627514" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cbk-b" id="cbk-h" x1="27.7812" x2="30.162491" y1="12.832289" y2="12.832289" gradientUnits="userSpaceOnUse"/>
        <linearGradient xlinkHref="#cbk-c" id="cbk-d" x1="4.2333326" x2="103.04872" y1="24.341663" y2="24.341663" gradientTransform="matrix(1 0 0 1.25 .79374989 -3.0427069)" gradientUnits="userSpaceOnUse"/>
    </defs>
    <path fill="url(#cbk-d)" d="M5.0270826 14.816665c0 .992188 2.645833 1.322916 4.2333328 1.322916 1.5874976 0 4.2333306-.330728 4.2333306-1.322916 0-.992187-2.778792-1.322916-4.2333306-1.322916-1.4545399 0-4.2333328.330729-4.2333328 1.322916z" className="UnoptimicedTransforms" style={{ fontVariationSettings: 'normal' }} transform="matrix(1.21528 0 0 1 -2.40511 0)"/>
    <g transform="matrix(-1 0 0 1 34.395789 -.000001)">
        <path fill="#a6a6a6" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.05833" d="M25.929118 1.3229165v3.4395828" style={{ fontVariationSettings: 'normal' }}/>
        <ellipse cx="25.929119" cy="7.1437492" fill="url(#cbk-e)" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.05833" rx="2.1166663" ry="2.9104159" style={{ fontVariationSettings: 'normal' }}/>
        <path fill="url(#cbk-f)" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.05833" d="M94.720821 11.112498s-2.116666-1.058333-2.116666-3.1749991c0-1.0583332 1.001019-2.1166664 2.116666-2.1166664 2.116667 0 3.704166 1.5874998 3.704166 5.5562495" style={{ fontVariationSettings: 'normal' }} transform="translate(-72.495869)"/>
        <path fill="url(#cbk-g)" d="M21.960404 11.112498s-.264583 2.116667-.264565 3.175c1.587501.529167 4.233336.529167 4.233336.529167s2.645835 0 4.233335-.529167c-.000019-1.058333-.264602-3.175-.264602-3.175-1.322917.529167-3.968751.529167-3.968751.529167s-2.645835 0-3.968753-.529167z"/>
        <path fill="url(#cbk-h)" d="m29.36874 11.112498.79375 3.175-1.852082.264583-.529207-2.910416 1.587539-.529167" style={{ fontVariationSettings: 'normal' }} />
        <path fill="url(#cbk-i)" d="M29.633285 11.112498s2.116666-1.058333 2.116666-3.1749991c0-1.0583332-1.001019-2.1166664-2.116666-2.1166664-2.116667 0-3.704167 1.5874998-3.704166 5.5562495" style={{ fontVariationSettings: 'normal' }}/>
        <path fill="url(#cbk-j)" d="M28.04579 6.6145826c1.852083.2645833 2.910416 2.645833 1.5875 4.2333324 2.116665-.79375 2.11666-1.5874996 2.116662-2.910416.000004-3.1749995-3.704162-1.3229164-3.704162-1.3229164z" style={{ fontVariationSettings: 'normal' }}/>
        <path fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.05833" d="M29.633285 11.112498s2.116666-1.058333 2.116666-3.1749991c0-1.0583332-1.001019-2.1166664-2.116666-2.1166664-2.116667 0-3.704167 1.5874998-3.704166 5.5562495" style={{ fontVariationSettings: 'normal' }}/>
        <path fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.05833" d="M22.224951 11.112498s-.52913 2.116667-.529112 3.175c1.587501.529167 4.233336.529167 4.233336.529167s2.645835 0 4.233335-.529167c-.000019-1.058333-.529226-3.175-.529226-3.175-1.322917.529167-3.704167.529167-3.704167.529167s-2.381248 0-3.704166-.529167z"/>
        <path fill="#a6a6a6" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.05833" d="M24.870786 2.3812497h2.116667" style={{ fontVariationSettings: 'normal' }}/>
        <path fill="none" stroke="#000" strokeLinejoin="round" strokeWidth="1.05833" d="M29.897872 12.699998c-1.32292.529167-3.968746.529167-3.968746.529167s-2.645841 0-3.968757-.529167"/>
    </g>
</svg>
);
