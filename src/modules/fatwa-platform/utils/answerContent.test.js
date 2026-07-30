// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import {
  classifyAnswerText,
  getArabicScriptRatio,
  prepareFatwaAnswer,
} from './answerContent'

describe('classifyAnswerText', () => {
  it('confidently identifies Quran text with Quranic markers', () => {
    expect(classifyAnswerText('﴿ إِنَّ مَعَ الْعُسْرِ يُسْرًا ﴾')).toBe('quran')
  })

  it('confidently identifies Arabic Hadith quotations', () => {
    expect(classifyAnswerText('قال رسول الله ﷺ إنما الأعمال بالنيات رواه البخاري')).toBe('hadith')
  })

  it('identifies long Arabic-only prose', () => {
    expect(classifyAnswerText('الحمد لله رب العالمين والصلاة والسلام على سيد المرسلين')).toBe('arabic')
  })

  it('leaves Urdu explanations and low-confidence fragments normal', () => {
    expect(classifyAnswerText('یہ ایک اہم مسئلہ ہے اور اس کی تفصیل درج ذیل ہے۔')).toBe('normal')
    expect(classifyAnswerText('اسلام')).toBe('normal')
    expect(getArabicScriptRatio('English text')).toBe(0)
  })
})

describe('prepareFatwaAnswer', () => {
  it('preserves mixed safe HTML while classifying each content block', () => {
    const original = [
      '<p>یہ مسئلہ شرعی اصولوں کے مطابق سمجھنا ضروری ہے۔</p>',
      '<p><strong>﴿ إِنَّ مَعَ الْعُسْرِ يُسْرًا ﴾</strong></p>',
      '<p>قال رسول الله ﷺ إنما الأعمال بالنيات <a href="https://example.com/source">رواه البخاري</a></p>',
      '<ul><li>مزید وضاحت یہاں موجود ہے۔</li></ul>',
    ].join('')
    const unchanged = original

    const result = prepareFatwaAnswer(original)
    const document = new DOMParser().parseFromString(result.html, 'text/html')

    expect(original).toBe(unchanged)
    expect(document.querySelector('.fatwa-answer-urdu')).not.toBeNull()
    expect(document.querySelector('.fatwa-answer-quran strong')?.textContent).toContain('إِنَّ')
    expect(document.querySelector('.fatwa-answer-hadith a')?.getAttribute('href')).toBe('https://example.com/source')
    expect(document.querySelector('ul li')?.textContent).toContain('مزید وضاحت')
  })

  it('removes executable HTML without removing safe formatting', () => {
    const result = prepareFatwaAnswer(`
      <p onclick="alert(1)"><strong>محفوظ متن</strong>
      <a href="javascript:alert(1)" style="color:red">link</a></p>
      <script>alert(1)</script><iframe src="https://example.com"></iframe>
    `)
    const document = new DOMParser().parseFromString(result.html, 'text/html')

    expect(document.querySelector('strong')?.textContent).toBe('محفوظ متن')
    expect(document.querySelector('[onclick]')).toBeNull()
    expect(document.querySelector('[style]')).toBeNull()
    expect(document.querySelector('a')?.hasAttribute('href')).toBe(false)
    expect(document.querySelector('script')).toBeNull()
    expect(document.querySelector('iframe')).toBeNull()
  })

  it('converts plain-text lines into independently classified paragraphs', () => {
    const result = prepareFatwaAnswer([
      'یہ اردو وضاحت اپنی موجودہ نستعلیق صورت میں رہے گی۔',
      '﴿ وَقُلْ رَبِّ زِدْنِي عِلْمًا ﴾',
      'قال رسول الله ﷺ إنما الأعمال بالنيات رواه البخاري',
    ].join('\n'))
    const document = new DOMParser().parseFromString(result.html, 'text/html')

    expect(document.querySelectorAll('p')).toHaveLength(3)
    expect(document.querySelector('.fatwa-answer-quran')).not.toBeNull()
    expect(document.querySelector('.fatwa-answer-hadith')).not.toBeNull()
  })

  it('truncates rich HTML at a text-node boundary without malformed markup', () => {
    const words = Array.from({ length: 520 }, (_, index) => `word${index}`).join(' ')
    const result = prepareFatwaAnswer(`<p><strong>${words}</strong></p><p>tail content</p>`, 500)
    const document = new DOMParser().parseFromString(result.truncatedHtml, 'text/html')
    const visibleWords = document.body.textContent.trim().split(/\s+/)

    expect(result.wordCount).toBe(522)
    expect(visibleWords).toHaveLength(500)
    expect(document.querySelector('strong')).not.toBeNull()
    expect(document.body.textContent).not.toContain('tail content')
  })
})
