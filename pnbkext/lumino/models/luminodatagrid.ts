import * as p from "@bokehjs/core/properties"
import { HTMLBox, HTMLBoxView } from "@bokehjs/models/layouts/html_box"

import {
  BasicKeyHandler,
  BasicMouseHandler,
  BasicSelectionModel,
  JSONModel,
  DataGrid,
} from "@lumino/datagrid"
import { DockPanel, Widget, StackedPanel } from "@lumino/widgets"
import { div } from "@bokehjs/core/dom"

function createWrapper(content: Widget, title: string): Widget {
  let wrapper = new StackedPanel()
  wrapper.addClass("content-wrapper")
  wrapper.addWidget(content)
  wrapper.title.label = title
  return wrapper
}

const greenStripeStyle: DataGrid.Style = {
  ...DataGrid.defaultStyle,
  rowBackgroundColor: (i) => (i % 2 === 0 ? "rgba(64, 115, 53, 0.2)" : ""),
}

export class LuminoDataGridView extends HTMLBoxView {
  model: LuminoDataGrid
  protected _dock: DockPanel
  protected group_el: HTMLDivElement
  static is_init_css: Boolean = false

  initialize(): void {
    if (!LuminoDataGridView.is_init_css) {
      const sheet: CSSStyleSheet = window.document
        .styleSheets[0] as CSSStyleSheet
      sheet.insertRule(
        ".bk-lumino-dock { flex: 1 1 auto; padding: 4px; }",
        sheet.cssRules.length
      )
      LuminoDataGridView.is_init_css = true
    }
    super.initialize()
  }

  connect_signals(): void {
    this.on_change(this.model.properties.json_data, () => this.invalidate_render())
  }

  render(): void {
    const lumino_model = new JSONModel(this.model.json_data)
    super.render()
    const grid = new DataGrid({
      style: greenStripeStyle,
      defaultSizes: {
        rowHeight: 32,
        columnWidth: 128,
        rowHeaderWidth: 64,
        columnHeaderHeight: 32,
      },
    })
    grid.dataModel = lumino_model
    grid.keyHandler = new BasicKeyHandler()
    grid.mouseHandler = new BasicMouseHandler()
    grid.selectionModel = new BasicSelectionModel({
      dataModel: lumino_model,
      selectionMode: "row",
    })
    this._dock = new DockPanel()
    this._dock.addClass("bk-lumino-dock")
    const wrapper = createWrapper(grid, this.model.title)
    this._dock.addWidget(wrapper)
    this.group_el = div()
    this.group_el.style.position = "absolute"
    this.group_el.style.top = "0"
    this.group_el.style.bottom = "0"
    this.group_el.style.left = "0"
    this.group_el.style.right = "0"
    this.group_el.style.display = "flex"
    this.group_el.style.flexDirection = "column"
    this.el.appendChild(this.group_el)
    window.onresize = () => this._dock.update()
    Widget.attach(this._dock, this.group_el)
  }
}

export namespace LuminoDataGrid {
  export type Attrs = p.AttrsOf<Props>
  export type Props = HTMLBox.Props & {
    json_data: p.Property<any>
    title: p.Property<string>
  }
}

export interface LuminoDataGrid extends LuminoDataGrid.Attrs {}

export class LuminoDataGrid extends HTMLBox {
  properties: LuminoDataGrid.Props

  constructor(attrs?: Partial<LuminoDataGrid.Attrs>) {
    super(attrs)
  }

  static __module__ = "pnbkext.lumino.models.luminodatagrid"

  static init_LuminoDataGrid(): void {
    this.prototype.default_view = LuminoDataGridView

    this.define<LuminoDataGrid.Props>({
      json_data:  [ p.Instance            ],
      title:      [ p.String, 'DataTable' ],
    })

    this.override({
      height: 300,
      width: 300,
    })
  }
}
