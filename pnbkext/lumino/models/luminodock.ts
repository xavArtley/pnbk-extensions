import * as p from "@bokehjs/core/properties"
import { each } from "@lumino/algorithm"
import { DockPanel, BoxPanel, Widget } from "@lumino/widgets"
import { Message } from "@lumino/messaging"
import { HTMLBox, HTMLBoxView } from "@bokehjs/models/layouts/html_box"
import { LayoutDOM, LayoutDOMView } from "@bokehjs/models/layouts/layout_dom"
import { Grid } from "@bokehjs/core/layout"
import { empty } from "@bokehjs/core/dom"

class BkBoxPanel extends BoxPanel {
  protected bkmodel: LayoutDOM
  protected bkcontainer: LuminoDockView

  constructor(
    title: string,
    bkmodel: LayoutDOM,
    bkcontainer: LuminoDockView,
    options: BoxPanel.IOptions = {}
  ) {
    super(options)
    this.bkmodel = bkmodel
    this.bkcontainer = bkcontainer
    this.title.label = title
    this.node.appendChild(this.bkview.el)
    this.node.style.overflow = "auto"
  }

  get bkview(): LayoutDOMView {
    return this.bkcontainer.child_views[
      this.bkcontainer.child_models.indexOf(this.bkmodel)
    ]
  }

  processMessage(msg: Message): void {
    console.log(msg.type)
    if (this.isVisible) {
      if (
        ["resize", "update-request"].indexOf(msg.type) > -1
      ) {
        let { width, height } = this.node.getBoundingClientRect()
        width -=
          Number(this.node.style.borderLeft || 0) +
          Number(this.node.style.borderRight || 0)
        height -=
          Number(this.node.style.borderBottom || 0) +
          Number(this.node.style.borderTop || 0)
        this.bkview.update_layout()
        this.bkview.layout.compute({ width: width - 4, height: height - 4})
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
  protected _compute_layout: boolean = true

  initialize(): void {
    super.initialize()
    this.parent.root.el.onresize = () => {
      console.log("resize?")
      if(this._dock)
        this._dock.update()
    }
  }

  connect_signals(): void {
    const p = this.model.properties
    this.on_change([p.children], () => this.invalidate_render())
  }

  get child_models(): LayoutDOM[] {
    return this.model.children.map((child) => child[1])
  }

  render(): void {
    this._dock = new DockPanel()
    this._dock.node.style.width = "100%"
    this._dock.node.style.height = "100%"
    super.render()
  }

  _update_layout(): void {
    console.log('update layout')
    const panels = this.child_views.map((child_view) => {
      return { layout: child_view.layout, row: 0, col: 0 }
    })
    this.layout = new Grid([...panels])
    this.layout.set_sizing(this.box_sizing())
    this.layout.compute(this._viewport)
    this.update_position()
    if (!this._dock.isAttached) {
      empty(this.el) // children will be added to LuminoWidgets (BkBoxPanel)
      this.model.children.forEach((item) => {
        const widget = new BkBoxPanel(item[0], item[1], this)
        this._dock.addWidget(widget)
      })
      Widget.attach(this._dock, this.el)
    }
  }

  compute_layout(): void {
    each(this._dock.widgets(), (widget) => widget.update())
  }

  after_layout(): void {
    this.compute_layout()
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
