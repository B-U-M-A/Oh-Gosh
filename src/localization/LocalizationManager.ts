import type { LocalizationStrings } from '../types/LocalizationTypes'
import en from './en'

export class LocalizationManager {
  private currentLanguage: string = 'en'
  private languages: Record<string, LocalizationStrings> = {}
  private listeners: Array<() => void> = []

  constructor() {
    // Load default English strings
    this.languages['en'] = en
  }

  getCurrentLanguage(): string {
    return this.currentLanguage
  }

  getStrings(): LocalizationStrings {
    return this.languages[this.currentLanguage]
  }

  async loadLanguage(langCode: string): Promise<boolean> {
    try {
      if (!this.languages[langCode]) {
        const module = await import(`./${langCode}`)
        this.languages[langCode] = module.default
      }
      return true
    } catch (e) {
      console.error(`Failed to load language ${langCode}:`, e)
      return false
    }
  }

  async setLanguage(langCode: string): Promise<boolean> {
    if (this.currentLanguage === langCode) return true

    const loaded = await this.loadLanguage(langCode)
    if (loaded) {
      this.currentLanguage = langCode
      this.notifyListeners()
      return true
    }
    return false
  }

  addChangeListener(callback: () => void): void {
    this.listeners.push(callback)
  }

  removeChangeListener(callback: () => void): void {
    this.listeners = this.listeners.filter((l) => l !== callback)
  }

  private notifyListeners(): void {
    this.listeners.forEach((callback) => callback())
  }
}

// Singleton instance
export const localizationManager = new LocalizationManager()
