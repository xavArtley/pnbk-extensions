import * as p from "@bokehjs/core/properties"

import { DockPanel, BoxPanel, Widget } from "@lumino/widgets"
import { Message } from "@lumino/messaging"
import { HTMLBox, HTMLBoxView } from "@bokehjs/models/layouts/html_box"
import { LayoutDOM, LayoutDOMView } from "@bokehjs/models/layouts/layout_dom"
import { Grid } from "@bokehjs/core/layout"
import { empty, position } from "@bokehjs/core/dom"

class BkBoxPanel extends BoxPanel {
  protected bkview: LayoutDOMView

  constructor(
    title: string,
    bkview: LayoutDOMView,
    options: BoxPanel.IOptions = {}
  ) {
    super(options)
    this.bkview = bkview
    this.title.label = title
    this.node.appendChild(bkview.el)
    this.node.style.overflow = "auto"
  }

  processMessage(msg: Message): void {
    if (
      ["resize", "update-request", "activate-request"].indexOf(msg.type) > -1
    ) {
      if (this.isVisible) {
        let {width, height} = this.node.getBoundingClientRect()
        width -= Number(this.node.style.borderLeft || 0) + Number(this.node.style.borderRight || 0)
        height -= Number(this.node.style.borderBottom || 0) + Number(this.node.style.borderTop || 0)
        this.bkview.layout.compute({width: width-2, height: height-2})
        this.bkview.update_position()
        this.bkview.after_layout()
        this.bkview.notify_finished()
      }
    }
    super.processMessage(msg)
  }
}

export class LuminoDockView extends HTMLBoxView {
  model: LuminoDock
  layout: Grid
  protected _dock: DockPanel
  protected group_el: HTMLDivElement
  static is_init_css: Boolean = false

  initialize(): void {
    super.initialize()
  }

  connect_signals(): void {
    const p = this.model.properties
    this.on_change([p.children], () => this.invalidate_render())
  }

  get child_models(): LayoutDOM[] {
    return this.model.children.map((child) => child[1])
  }

  get tab_titles(): string[] {
    return this.model.children.map((child) => child[0])
  }

  render(): void {
    console.log("Render")
    this._dock = new DockPanel()
    super.render()
  }

  update_position(): void {
    this.el.style.display = this.model.visible ? "block" : "none"
    const margin = this.is_root ? this.layout.sizing.margin : undefined
    position(this.el, this.layout.bbox, margin)
    position(this._dock.node, this.layout.bbox, margin)
  }

  _update_layout(): void {
    const panels = this.child_views.map((child_view) => {
      return { layout: child_view.layout, row: 0, col: 0 }
    })
    this.layout = new Grid([...panels])
    this.layout.set_sizing(this.box_sizing())
    empty(this.el) // children will be added to LuminoWidgets (BkBoxPanel)
    for(let idx=0; idx<this.model.children.length; idx++){
      const widget = new BkBoxPanel(this.tab_titles[idx], this.child_views[idx])
      this._dock.addWidget(widget)
    }
    Widget.attach(this._dock, this.el)
  }

  after_layout(): void {
    this._dock.update()
    this._has_finished = true
  }
}

export namespace LuminoDock {
  export type Attrs = p.AttrsOf<Props>
  export type Props = HTMLBox.Props & {
    children: p.Property<[string, LayoutDOM][]>
  }
}

export interface LuminoDock extends LuminoDock.Attrs {}

export class LuminoDock extends HTMLBox {
  properties: LuminoDock.Props
  __view_type__: LuminoDockView

  constructor(attrs?: Partial<LuminoDock.Attrs>) {
    super(attrs)
  }

  static __module__ = "pnbkext.lumino.models.luminodock"

  static init_LuminoDock(): void {
    this.prototype.default_view = LuminoDockView

    this.define<LuminoDock.Props>({
      children: [p.Array, []],
    })

    this.override({
      height: 300,
      width: 300,
    })
  }
}
