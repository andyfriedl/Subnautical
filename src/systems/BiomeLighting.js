import { mixColor } from './waterTint.js';

const smoothstep = (a, b, value) => {
    const t = Math.max(0, Math.min(1, (value - a) / (b - a)));
    return t * t * (3 - 2 * t);
};

// A precomputed alpha texture reveals the scene rather than adding a bright glow.
export default class BiomeLighting {
    constructor(scene, submarine, config) {
        this.scene = scene;
        this.submarine = submarine;
        this.config = config;
        this.textureKey = 'biomeLighting';
        // A square wider than the viewport diagonal stays covered at every rotation.
        // Half-resolution is sufficient for a soft mask and limits texture memory.
        const resolution = 0.5;
        const extent = Math.hypot(scene.scale.width, scene.scale.height) +
            Math.abs(config.frontOffset) + 100;
        const size = Math.ceil(extent * 2 * resolution);
        const texture = scene.textures.createCanvas(this.textureKey, size, size);
        const ctx = texture.context;
        ctx.fillStyle = `rgba(${config.color}, ${config.darknessAlpha})`;
        ctx.fillRect(0, 0, size, size);

        // Precompute a forward-facing, widening cone with smooth side/tip falloff.
        // Only alpha is removed: the original scene supplies all light/color.
        const center = Math.floor(size / 2);
        const width = Math.ceil(config.beamLength * resolution);
        const halfHeight = Math.ceil(Math.max(config.beamWidthStart, config.beamWidthEnd) * resolution / 2);
        const pixels = ctx.getImageData(center, center - halfHeight, width, halfHeight * 2);
        for (let y = 0; y < pixels.height; y++) {
            for (let x = 0; x < width; x++) {
                const forward = (x + 0.5) / resolution;
                const reveal = this.beamReveal(forward, (y + 0.5 - halfHeight) / resolution);
                pixels.data[(y * width + x) * 4 + 3] *= 1 - reveal;
            }
        }
        ctx.putImageData(pixels, center, center - halfHeight);
        texture.refresh();
        // Below submarine and bubbles, above scenery; existing water tint unchanged.
        this.image = scene.add.image(0, 0, this.textureKey)
            .setOrigin(center / size).setScale(1 / resolution).setDepth(999);
        this.update();
    }

    // Shared with bubbles; exactly the same soft cone used to build the texture.
    beamReveal(forward, sideways) {
        const config = this.config;
        const progress = forward / config.beamLength;
        if (progress <= 0 || progress >= 1) return 0;
        const halfWidth = (config.beamWidthStart +
            (config.beamWidthEnd - config.beamWidthStart) * progress) / 2;
        return (1 - smoothstep(1 - config.softness, 1, Math.abs(sideways) / halfWidth)) *
            smoothstep(0, 18, forward) *
            (1 - smoothstep(1 - config.softness * 0.6, 1, progress));
    }

    bubbleLightAt(x, y) {
        const forward = this.submarine.getFacingVector();
        const dx = x - this.image.x, dy = y - this.image.y;
        const beam = this.beamReveal(dx * forward.x + dy * forward.y, -dx * forward.y + dy * forward.x);
        const player = this.submarine.player;
        const local = 1 - smoothstep(0, this.config.bubbleFadeDistance, Math.hypot(x - player.x, y - player.y));
        return Math.max(beam, local);
    }

    update() {
        const point = this.submarine.getGrabPoint();
        const forward = this.submarine.getFacingVector();
        this.image.setPosition(
            point.x + forward.x * this.config.frontOffset,
            point.y + forward.y * this.config.frontOffset
        ).setRotation(Math.atan2(forward.y, forward.x));
        const player = this.submarine.player;
        // Translation moves the mask every frame, but corner colors depend only
        // on facing, sprite dimensions and the lighting configuration.
        const cache = this.tintCache;
        if (cache && cache.x === forward.x && cache.y === forward.y &&
            cache.width === player.width && cache.height === player.height &&
            cache.ambient === this.config.ambientTint && cache.strength === this.config.subRearTintStrength) return;
        this.tintCache = { x: forward.x, y: forward.y, width: player.width, height: player.height,
            ambient: this.config.ambientTint, strength: this.config.subRearTintStrength };
        const span = Math.abs(forward.x) * player.width + Math.abs(forward.y) * player.height;
        const tint = (x, y) => {
            const frontness = 0.5 + (x * forward.x + y * forward.y) / span;
            return mixColor(0xffffff, this.config.ambientTint, (1 - frontness) * this.config.subRearTintStrength);
        };
        player.setTint(
            tint(-player.width / 2, -player.height / 2), tint(player.width / 2, -player.height / 2),
            tint(-player.width / 2, player.height / 2), tint(player.width / 2, player.height / 2)
        );
    }

    destroy() {
        this.image.destroy();
        this.scene.textures.remove(this.textureKey);
    }
}
