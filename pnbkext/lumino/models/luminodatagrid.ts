import * as p from "@bokehjs/core/properties"
import { HTMLBox, HTMLBoxView } from "@bokehjs/models/layouts/html_box"

import {
  BasicKeyHandler,
  BasicMouseHandler,
  BasicSelectionModel,
  JSONModel,
  DataGrid,
} from "@lumino/datagrid"
import { toArray } from "@lumino/algorithm"
import { Widget, Panel } from "@lumino/widgets"

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

const defaultStripeStyle = DataGrid.defaultStyle

const greenStripeStyle: DataGrid.Style = {
  ...DataGrid.defaultStyle,
  rowBackgroundColor: (i) => (i % 2 === 0 ? "rgba(64, 115, 53, 0.2)" : ""),
}

const blueStripeStyle: DataGrid.Style = {
  ...DataGrid.defaultStyle,
  rowBackgroundColor: (i) => (i % 2 === 0 ? "rgba(138, 172, 200, 0.3)" : ""),
  columnBackgroundColor: (i) => (i % 2 === 0 ? "rgba(100, 100, 100, 0.1)" : ""),
}

const brownStripeStyle: DataGrid.Style = {
  ...DataGrid.defaultStyle,
  columnBackgroundColor: (i) => (i % 2 === 0 ? "rgba(165, 143, 53, 0.2)" : ""),
}

const dataGridStyles = {
  green: greenStripeStyle,
  blue: blueStripeStyle,
  brown: brownStripeStyle,
  none: defaultStripeStyle,
}

function createWrapper(content: Widget): Widget {
  let wrapper = new Panel()
  wrapper.addWidget(content)
  return wrapper
}

export class LuminoDataGridView extends HTMLBoxView {
  model: LuminoDataGrid
  protected lumino_data_grig: DataGrid
  protected wrapper: Widget
  protected group_el: HTMLDivElement
  protected _isselecting: boolean

  connect_signals(): void {
    const p = this.model.properties
    this.on_change(
      [
        p.json_data,
        p.selection_mode,
        p.row_header_width,
        p.column_header_height,
        p.row_height,
        p.column_width,
        p.gridstyle,
      ],
      () => this.invalidate_render()
    )
    this.on_change(p.selections, () => {
      if (!this._isselecting) this._apply_selection()
    })
  }

  plot(): void {
    const lumino_model = new JSONModel(this.model.json_data)
    this.lumino_data_grig = new DataGrid({
      style: dataGridStyles[this.model.gridstyle],
      defaultSizes: {
        rowHeight: this.model.row_height,
        columnWidth: this.model.column_width,
        rowHeaderWidth: this.model.row_header_width,
        columnHeaderHeight: this.model.column_header_height,
      },
    })
    this.lumino_data_grig.stretchLastColumn
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
    this.wrapper = createWrapper(this.lumino_data_grig)
    this.wrapper.node.style.display = "flex"
    this.wrapper.node.style.flexDirection = "column"
    this.wrapper.node.style.height = "100%"
    this.lumino_data_grig.node.style.flex = "1 1 auto"
    Widget.attach(this.wrapper, this.el)
  }

  after_layout(): void {
    super.after_layout()
    this.wrapper.update()
  }
}

export namespace LuminoDataGrid {
  export type Attrs = p.AttrsOf<Props>
  export type Props = HTMLBox.Props & {
    json_data: p.Property<any>
    selection_mode: p.Property<SelectionMode>
    selections: p.Property<Selection[]>
    row_header_width: p.Property<number>
    column_header_height: p.Property<number>
    row_height: p.Property<number>
    column_width: p.Property<number>
    gridstyle: p.Property<keyof typeof dataGridStyles>
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
      row_header_width: [p.Int, 64],
      column_header_height: [p.Int, 32],
      row_height: [p.Int, 32],
      column_width: [p.Int, 128],
      gridstyle: [p.Instance, "green"],
    })

    this.override({
      height: 300,
      width: 300,
    })
  }
}
