// @vitest-environment jsdom

import React from 'react'
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import FatwaAnswerContent from './FatwaAnswerContent'
import { prepareFatwaAnswer } from '../utils/answerContent'

describe('FatwaAnswerContent', () => {
  it('renders Urdu, Quran, and Hadith with separate semantic typography', () => {
    const { container } = render(
      <FatwaAnswerContent answer={`
        <p>یہ اردو تشریح اپنی موجودہ صورت میں ہے۔</p>
        <p>﴿ إِنَّ مَعَ الْعُسْرِ يُسْرًا ﴾</p>
        <p>قال رسول الله ﷺ إنما الأعمال بالنيات رواه البخاري</p>
      `} />
    )

    expect(container.querySelector('.fatwa-answer-urdu')?.getAttribute('lang')).toBe('ur')
    expect(container.querySelector('.fatwa-answer-quran')?.getAttribute('lang')).toBe('ar')
    expect(container.querySelector('.fatwa-answer-hadith')?.getAttribute('dir')).toBe('rtl')
  })

  it('uses the DOM-safe truncated variant when collapsed', () => {
    const words = Array.from({ length: 510 }, (_, index) => `word${index}`).join(' ')
    const prepared = prepareFatwaAnswer(`<p><strong>${words}</strong></p>`, 500)
    const { container } = render(
      <FatwaAnswerContent prepared={prepared} expanded={false} />
    )

    expect(container.querySelector('strong')).not.toBeNull()
    expect(container.textContent).toContain('word499…')
    expect(container.textContent).not.toContain('word500')
  })
})
