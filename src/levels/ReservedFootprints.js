// Placement-only occupancy; no physics or player collision. Any scenery system
// can register world-space sprite bounds before dependent objects are placed.
export default class ReservedFootprints {
    constructor({ enabled = false, padding = 0 } = {}) {
        this.enabled = enabled;
        this.padding = padding;
        this.footprints = [];
    }

    registerReservedFootprint(bounds) {
        if (!this.enabled) return;
        const p = this.padding;
        this.footprints.push({ left: bounds.left - p, right: bounds.right + p,
            top: bounds.top - p, bottom: bounds.bottom + p });
    }

    isPlacementBlocked(bounds) {
        return this.enabled && this.footprints.some(other =>
            bounds.left < other.right && bounds.right > other.left &&
            bounds.top < other.bottom && bounds.bottom > other.top);
    }

    clear() {
        this.footprints.length = 0;
    }
}
