export function WebGLFallback() {
  return (
    <section
      className="fallback-card"
      role="status"
      data-testid="webgl-fallback"
    >
      <div className="fallback-orbit" aria-hidden="true">
        <span>🌍</span>
      </div>
      <p className="eyebrow">需要一点图形能力</p>
      <h1>这台设备暂时无法开启 3D 地球</h1>
      <p>
        请尝试更新浏览器、开启硬件加速，或换一台支持 WebGL
        的设备。未来的轻量地图模式也会在这里提供。
      </p>
    </section>
  )
}
