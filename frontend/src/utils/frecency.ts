/**
 * Frecency Tracker (EDITOR-3409)
 *
 * Track recently/frequently accessed bullets using frecency algorithm
 * Storage: localStorage (persists across sessions)
 * Algorithm: Mozilla Firefox frecency (frequency * decay factor based on age)
 *
 * Decay factors (Mozilla Firefox algorithm):
 * - < 4 hours: 100
 * - < 24 hours: 70
 * - < 1 week: 50
 * - > 1 week: 30
 */

export interface RecentItem {
  documentId: string
  blockId: string
  bulletText: string
  contextPath: string
  accessCount: number
  lastAccessTime: number
  frecencyScore: number
}

export class FrecencyTracker {
  private storageKey = 'hydra-portal-recents'

  /**
   * Record access to a bullet
   * Updates access count, last access time, and recalculates frecency
   */
  recordAccess(item: {
    documentId: string
    blockId: string
    bulletText: string
    contextPath: string
  }): void {
    const recents = this.getRecentsFromStorage()
    const existing = recents.find(
      (r) => r.documentId === item.documentId && r.blockId === item.blockId
    )

    if (existing) {
      existing.accessCount++
      existing.lastAccessTime = Date.now()
      existing.bulletText = item.bulletText
      existing.contextPath = item.contextPath
      existing.frecencyScore = this.calculateFrecency(
        existing.accessCount,
        existing.lastAccessTime
      )
    } else {
      recents.push({
        ...item,
        accessCount: 1,
        lastAccessTime: Date.now(),
        frecencyScore: this.calculateFrecency(1, Date.now()),
      })
    }

    this.saveRecents(recents)
  }

  /**
   * Get top N recent items sorted by frecency
   * Recalculates frecency scores at read time to account for age decay
   */
  getTopRecents(limit: number = 10): RecentItem[] {
    const recents = this.getRecentsFromStorage()

    // Recalculate frecency scores based on current time
    for (const item of recents) {
      item.frecencyScore = this.calculateFrecency(
        item.accessCount,
        item.lastAccessTime
      )
    }

    return recents
      .sort((a, b) => b.frecencyScore - a.frecencyScore)
      .slice(0, limit)
  }

  /**
   * Remove a specific item from recents
   */
  removeItem(documentId: string, blockId: string): void {
    const recents = this.getRecentsFromStorage()
    const filtered = recents.filter(
      (r) => !(r.documentId === documentId && r.blockId === blockId)
    )
    this.saveRecents(filtered)
  }

  /**
   * Clear all recents
   */
  clearAll(): void {
    localStorage.removeItem(this.storageKey)
  }

  /**
   * Calculate frecency score
   * Formula: accessCount * decayFactor(age)
   *
   * Decay factors (Mozilla Firefox algorithm):
   * - < 4 hours: 100
   * - < 24 hours: 70
   * - < 1 week: 50
   * - > 1 week: 30
   */
  private calculateFrecency(
    accessCount: number,
    lastAccessTime: number
  ): number {
    const ageHours = (Date.now() - lastAccessTime) / (1000 * 60 * 60)

    let decayFactor: number
    if (ageHours < 4) {
      decayFactor = 100
    } else if (ageHours < 24) {
      decayFactor = 70
    } else if (ageHours < 168) {
      // 1 week = 168 hours
      decayFactor = 50
    } else {
      decayFactor = 30
    }

    return accessCount * decayFactor
  }

  private getRecentsFromStorage(): RecentItem[] {
    try {
      const json = localStorage.getItem(this.storageKey)
      return json ? JSON.parse(json) : []
    } catch {
      return []
    }
  }

  private saveRecents(recents: RecentItem[]): void {
    // Keep max 100 items to prevent unbounded growth
    const limited = recents.slice(0, 100)
    localStorage.setItem(this.storageKey, JSON.stringify(limited))
  }
}

// Singleton instance for global use
export const frecencyTracker = new FrecencyTracker()
