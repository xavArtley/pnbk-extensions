import * as p from "@bokehjs/core/properties"
import { HTMLBox, HTMLBoxView } from "@bokehjs/models/layouts/html_box"
import { div } from "@bokehjs/core/dom"

import {
  BasicKeyHandler,
  BasicMouseHandler,
  BasicSelectionModel,
  JSONModel,
  DataGrid,
} from "@lumino/datagrid"
import { toArray } from "@lumino/algorithm"
import { Widget } from "@lumino/widgets"

type ClearMode = "all" | "current" | "none"
type Selection = {
  r1: number
  c1: number
  r2: number
  c2: number
  cursorRow?: number
  cursorColumn?: number
  clear?: ClearMode
}
type SelectionMode = "row" | "column" | "cell"

const greenStripeStyle: DataGrid.Style = {
  ...DataGrid.defaultStyle,
  rowBackgroundColor: (i) => (i % 2 === 0 ? "rgba(64, 115, 53, 0.2)" : ""),
}
export class LuminoDataGridView extends HTMLBoxView {
  model: LuminoDataGrid
  protected lumino_data_grig: DataGrid
  protected group_el: HTMLDivElement
  protected _isselecting: boolean

  connect_signals(): void {
    const p = this.model.properties
    this.on_change([p.json_data, p.selection_mode], () =>
      this.invalidate_render()
    )
    this.on_change(p.selections, () => {
      if (!this._isselecting) this._apply_selection()
    })
  }

  plot(): void {
    const lumino_model = new JSONModel(this.model.json_data)
    this.lumino_data_grig = new DataGrid({
      style: greenStripeStyle,
      defaultSizes: {
        rowHeight: 32,
        columnWidth: 128,
        rowHeaderWidth: 64,
        columnHeaderHeight: 32,
      },
    })
    this.lumino_data_grig.dataModel = lumino_model
    this.lumino_data_grig.keyHandler = new BasicKeyHandler()
    this.lumino_data_grig.mouseHandler = new BasicMouseHandler()
    this.lumino_data_grig.selectionModel = new BasicSelectionModel({
      dataModel: lumino_model,
      selectionMode: this.model.selection_mode,
    })
    this.lumino_data_grig.selectionModel.changed.connect((sender) => {
      this._isselecting = true
      this.model.selections = toArray(sender.selections())
      this._isselecting = false
    })
    this._apply_selection()
  }

  _apply_selection(): void {
    this._isselecting = true
    if (this.model.selections.length > 0) {
      this.model.selections.forEach((selection) => {
        this.lumino_data_grig.selectionModel!.select(
          Object.assign(selection, {
            cursorRow: selection.cursorRow ? selection.cursorRow : -1,
            cursorColumn: selection.cursorColumn ? selection.cursorColumn : -1,
            clear: selection.clear ? selection.clear : "none",
          })
        )
      })
    }
    this._isselecting = false
  }

  render(): void {
    super.render()
    this.plot()
    this.group_el = div()
    this.group_el.style.display = "flex"
    this.group_el.style.flexDirection = "column"
    this.group_el.style.height = "100%"
    this.lumino_data_grig.node.style.flex = "1 1 auto"
    this.el.appendChild(this.group_el)
    Widget.attach(this.lumino_data_grig, this.group_el)
  }

  after_layout(): void {
    super.after_layout()
    this.lumino_data_grig.update()
  }
}

export namespace LuminoDataGrid {
  export type Attrs = p.AttrsOf<Props>
  export type Props = HTMLBox.Props & {
    json_data: p.Property<any>
    selection_mode: p.Property<SelectionMode>
    selections: p.Property<Selection[]>
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
      json_data: [p.Instance],
      selection_mode: [p.Instance, "row"],
      selections: [p.Array, []],
    })

    this.override({
      height: 300,
      width: 300,
    })
  }
}
