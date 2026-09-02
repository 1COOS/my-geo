import { DetailPanelShell } from './DetailPanelShell'

export function ExploreGuideCard() {
  return (
    <DetailPanelShell
      label="3D 地球使用说明"
      identity="explore-guide"
      accent="#53d8e8"
      className="explore-guide-card"
    >
      <header className="knowledge-region-overview-heading">
        <p>探索地球 · 使用说明</p>
        <h2>转动地球，发现世界</h2>
        <span>从国家、地貌与经纬知识开始你的探索</span>
      </header>

      <p className="knowledge-region-overview-lead">
        直接操控 3D 地球，或借助主导航搜索、图层和定位图快速找到想了解的地方。
      </p>

      <section className="country-detail-section explore-guide-section">
        <h3 className="country-detail-label">控制地球</h3>
        <ul className="explore-guide-list">
          <li>
            <strong>旋转</strong>
            <span>鼠标或单指拖动地球，键盘方向键也可以移动视角。</span>
          </li>
          <li>
            <strong>缩放</strong>
            <span>使用滚轮或双指开合，观察大洲全貌或地区细节。</span>
          </li>
          <li>
            <strong>查看知识</strong>
            <span>点击国家或图层对象，右侧会切换为对应知识卡。</span>
          </li>
        </ul>
      </section>

      <section className="country-detail-section explore-guide-section">
        <h3 className="country-detail-label">快速探索</h3>
        <dl className="explore-guide-tools">
          <div>
            <dt>搜索</dt>
            <dd>从左侧主导航定位国家、河流、山脉、古迹与知识主题。</dd>
          </div>
          <div>
            <dt>图层</dt>
            <dd>开启经纬、气候、水域、山脉等专题内容。</dd>
          </div>
          <div>
            <dt>定位图</dt>
            <dd>在平面世界地图上快速移动当前观察位置。</dd>
          </div>
        </dl>
      </section>

      <p className="explore-guide-note">
        选择对象后，本卡会由详情知识卡替换；重新进入 3D 地球即可再次查看本说明。
      </p>
    </DetailPanelShell>
  )
}
