import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { IntlProvider, useIntl, intl } from './IntlProvider'
import { translate, interpolate } from './intlCore'

function IntlConsumer() {
  const { language, setLanguage, isRtl, dir, intl: t } = useIntl()
  return (
    <div>
      <span data-testid="lang">{language}</span>
      <span data-testid="isRtl">{String(isRtl)}</span>
      <span data-testid="dir">{dir}</span>
      <span data-testid="translated-save">{t('common.save')}</span>
      <span data-testid="interpolated">
        {t('students.studentCount', { count: 42 })}
      </span>
      <span data-testid="fallback">
        {t('non.existent.key', null, 'Custom Fallback')}
      </span>
      <button onClick={() => setLanguage('ur')}>SetUrdu</button>
      <button onClick={() => setLanguage('ar')}>SetArabic</button>
      <button onClick={() => setLanguage('en')}>SetEnglish</button>
    </div>
  )
}

describe('Internationalization (INTL) System', () => {
  it('correctly translates and interpolates strings', () => {
    expect(interpolate('Hello {name}, you have {count} messages.', { name: 'Ali', count: 3 })).toBe(
      'Hello Ali, you have 3 messages.'
    )
    expect(translate('common.save', null, '', 'en')).toBe('Save')
    expect(translate('common.save', null, '', 'ur')).toBe('محفوظ کریں')
    expect(translate('common.save', null, '', 'ar')).toBe('حفظ')
  })

  it('handles language switching and updates HTML direction attributes', () => {
    render(
      <IntlProvider defaultLanguage="en">
        <IntlConsumer />
      </IntlProvider>
    )

    expect(screen.getByTestId('lang').textContent).toBe('en')
    expect(screen.getByTestId('isRtl').textContent).toBe('false')
    expect(screen.getByTestId('dir').textContent).toBe('ltr')
    expect(screen.getByTestId('translated-save').textContent).toBe('Save')

    // Switch to Urdu
    fireEvent.click(screen.getByText('SetUrdu'))
    expect(screen.getByTestId('lang').textContent).toBe('ur')
    expect(screen.getByTestId('isRtl').textContent).toBe('true')
    expect(screen.getByTestId('dir').textContent).toBe('rtl')
    expect(screen.getByTestId('translated-save').textContent).toBe('محفوظ کریں')
    expect(document.documentElement.getAttribute('dir')).toBe('rtl')

    // Switch to Arabic
    fireEvent.click(screen.getByText('SetArabic'))
    expect(screen.getByTestId('lang').textContent).toBe('ar')
    expect(screen.getByTestId('isRtl').textContent).toBe('true')
    expect(screen.getByTestId('dir').textContent).toBe('rtl')
    expect(screen.getByTestId('translated-save').textContent).toBe('حفظ')
  })

  it('gracefully falls back when key is missing', () => {
    render(
      <IntlProvider defaultLanguage="en">
        <IntlConsumer />
      </IntlProvider>
    )

    expect(screen.getByTestId('fallback').textContent).toBe('Custom Fallback')
  })
})
