# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Alex uses the site for short personal guitar practice sessions, often on a phone with a guitar in hand. Quick access and low interaction overhead take priority over public-facing marketing.

## Product Purpose

A personal collection of guitar exercises that makes frequent, focused practice easy. Success means opening an exercise and starting with little setup or scrolling.

## Operating Context

The site runs in the browser and supports offline use. Practice includes silent theory recall and an audible metronome-led fretboard exercise. Existing preferences and review history are saved on the device.

## Capabilities and Constraints

- Four primary exercises: fretboard notes, chord recall/progressions, relative keys/fourths/fifths, and chord families on the circle of fifths.
- Chord recall asks for root notes only. Roman numerals communicate quality; tonic chords are supplied rather than questioned.
- Preserve musical spelling, equivalent-pitch acceptance, natural-minor rules, retry behavior and saved review history.
- Keep the existing Astro implementation and lightweight client scripts.
- The redesign covers the whole site, with the chord game as the main example.
- Implementation is local. Do not push unless Alex explicitly requests it.

## Brand Commitments

Alex’s guitar workout. Warm paper, dark ink and restrained terracotta/sage accents. Simpler framing and clear typography replace ornamental pedal screws and inset containers.

## Product Principles

- Put practice before configuration.
- Keep questions, input and feedback in predictable positions.
- Reveal teaching detail when requested.
- Make preference changes explicit; never silently discard an active round.
- Share conventions across exercises while preserving each exercise’s teaching mechanism.

## Accessibility & Inclusion

Support touch, keyboard and screen-reader use. Associate changing key context with questions, retain visible focus, and respect reduced-motion preferences.
